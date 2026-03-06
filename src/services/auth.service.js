const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { HttpError } = require("../utils/httpError");
const { getOtpStore, hashOtp, OTP_TTL_SECONDS } = require("../storage/otpRequest.store");

const OTP_ATTEMPTS = 5;
const IP_RATE_LIMIT = { max: 5, windowSeconds: 10 * 60 };
const PHONE_RATE_LIMIT = { max: 3, windowSeconds: 10 * 60 };
const DEV_TEST_PHONE = process.env.TEST_AUTH_PHONE || "+79990000000";
const DEV_TEST_CODE = process.env.TEST_AUTH_CODE || "111111";
const DEV_TEST_PHONE_2 = process.env.TEST_AUTH_PHONE_2 || "+79990000001";
const DEV_TEST_CODE_2 = process.env.TEST_AUTH_CODE_2 || "222222";
const DEV_TEST_ROLE_1 = process.env.TEST_AUTH_ROLE || "customer";
const DEV_TEST_ROLE_2 = process.env.TEST_AUTH_ROLE_2 || "contractor";

const usersByPhone = new Map();

const normalizeRussianPhone = (input) => {
  const raw = String(input || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    throw new HttpError(400, "VALIDATION_ERROR", "Phone is required", [
      { field: "phone", message: "Phone is required" }
    ]);
  }

  let normalizedDigits = digits;
  if (digits.length === 10) {
    normalizedDigits = `7${digits}`;
  } else if (digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))) {
    normalizedDigits = `7${digits.slice(1)}`;
  }

  if (!/^7\d{10}$/.test(normalizedDigits)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid phone format", [
      { field: "phone", message: "Expected Russian phone in format +7XXXXXXXXXX" }
    ]);
  }

  return `+${normalizedDigits}`;
};

const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const isTimingSafeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left), "utf8");
  const rightBuffer = Buffer.from(String(right), "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const parseSmsRuStatusCode = (code) => Number.parseInt(String(code || ""), 10);

const sanitizeDevOtpCode = (value) => {
  const safeCode = String(value || "").replace(/\D/g, "").slice(0, 6);
  return /^\d{6}$/.test(safeCode) ? safeCode : null;
};

const sanitizeDevRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  return role === "contractor" ? "contractor" : "customer";
};

const normalizeDevPhone = (value) => {
  try {
    return normalizeRussianPhone(value);
  } catch (_error) {
    return null;
  }
};

const getDevTestAccounts = () => {
  if (process.env.NODE_ENV === "production") return null;

  const accounts = [
    {
      phone: normalizeDevPhone(DEV_TEST_PHONE),
      code: sanitizeDevOtpCode(DEV_TEST_CODE),
      role: sanitizeDevRole(DEV_TEST_ROLE_1)
    },
    {
      phone: normalizeDevPhone(DEV_TEST_PHONE_2),
      code: sanitizeDevOtpCode(DEV_TEST_CODE_2),
      role: sanitizeDevRole(DEV_TEST_ROLE_2)
    }
  ];

  return accounts.filter((account) => account.phone && account.code);
};

const getDevTestAccount = (normalizedPhone) => {
  const accounts = getDevTestAccounts() || [];
  return accounts.find((account) => account.phone === normalizedPhone) || null;
};

const getDevOtpOverride = (normalizedPhone) => {
  const account = getDevTestAccount(normalizedPhone);
  return account?.code || null;
};

const mapSmsRuFailureToHttpError = (providerCode, providerText) => {
  const code = parseSmsRuStatusCode(providerCode);
  const details = providerText ? [{ field: "providerMessage", message: providerText }] : [];
  if (code === 220) {
    return new HttpError(503, "SMS_TEMPORARY_UNAVAILABLE", "SMS delivery is temporarily unavailable", details);
  }
  if ([233, 304, 305].includes(code)) {
    return new HttpError(429, "SMS_RATE_LIMITED", "Too many requests. Please try later", details);
  }
  if ([300, 301].includes(code)) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "sms_ru_auth_error",
        message: "SMS.RU authentication failed. Check SMS_RU_API_ID",
        providerCode: code
      })
    );
    return new HttpError(500, "SMS_PROVIDER_AUTH_ERROR", "SMS provider configuration error", details);
  }
  if (code === 201) {
    return new HttpError(402, "SMS_INSUFFICIENT_BALANCE", "Insufficient SMS balance. Top up your SMS.ru account.", details);
  }
  if (code === 507) {
    return new HttpError(
      502,
      "SMS_IP_REJECTED",
      "SMS provider rejected request (invalid/private IP). In production, ensure X-Forwarded-For is set.",
      details
    );
  }
  if (code === 221) {
    return new HttpError(
      502,
      "SMS_SENDER_REQUIRED",
      "Create an alphabetic sender in SMS.ru: https://sms.ru/?panel=senders",
      details
    );
  }
  return new HttpError(502, "SMS_SEND_FAILED", "Failed to send SMS code", details);
};

const getClientIp = (req) => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.trim()) {
    const first = xForwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const isPrivateOrLocalIp = (ip) => {
  if (!ip || ip === "unknown") return true;
  const s = String(ip).trim();
  if (s === "127.0.0.1" || s === "::1") return true;
  if (s.startsWith("10.") || s.startsWith("192.168.")) return true;
  const m = s.match(/^172\.(\d{1,3})\./);
  if (m) {
    const second = parseInt(m[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
};

const SENDERS_CACHE_TTL_MS = 10 * 60 * 1000;
let sendersCache = { list: null, fetchedAt: 0 };

const getSmsRuSender = async (apiId) => {
  const fromEnv = process.env.SMS_RU_FROM?.trim();
  if (fromEnv) return fromEnv;

  const now = Date.now();
  if (sendersCache.list && now - sendersCache.fetchedAt < SENDERS_CACHE_TTL_MS) {
    return sendersCache.list[0] || null;
  }

  try {
    const url = `https://sms.ru/my/senders?api_id=${encodeURIComponent(apiId)}&json=1`;
    const response = await fetch(url, { method: "GET" });
    const body = await response.json();
    if (body?.status !== "OK") return null;
    const list = Array.isArray(body?.senders) ? body.senders.filter(Boolean) : [];
    sendersCache = { list, fetchedAt: now };
    return list[0] || null;
  } catch (_err) {
    sendersCache = { list: [], fetchedAt: now };
    return null;
  }
};

const sendSmsRuOtp = async ({ toPhoneE164, code, clientIp }) => {
  const apiId = process.env.SMS_RU_API_ID;
  if (!apiId) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "SMS provider is not configured");
  }

  const sender = await getSmsRuSender(apiId);
  if (!sender) {
    throw new HttpError(
      502,
      "SMS_SENDER_REQUIRED",
      "Create an alphabetic sender in SMS.ru: https://sms.ru/?panel=senders. Then set SMS_RU_FROM=YourSender or it will be auto-detected.",
      [{ field: "providerMessage", message: "No approved sender. Create one at https://sms.ru/?panel=senders" }]
    );
  }

  const toDigits = toPhoneE164.replace("+", "");
  const params = new URLSearchParams({
    api_id: apiId,
    to: toDigits,
    msg: `Ваш код входа: ${code}. Никому его не сообщайте.`,
    json: "1",
    from: sender
  });
  if (!isPrivateOrLocalIp(clientIp)) {
    params.set("ip", clientIp);
  }
  if (process.env.SMS_RU_TEST === "1") {
    params.set("test", "1");
  }

  const url = `https://sms.ru/sms/send?${params.toString()}`;
  const response = await fetch(url, { method: "GET" });
  let body = null;
  try {
    body = await response.json();
  } catch (_error) {
    throw new HttpError(502, "SMS_PROVIDER_BAD_RESPONSE", "Unexpected SMS provider response");
  }

  const phoneStatus = body?.sms?.[toDigits]?.status;
  const providerCode = body?.sms?.[toDigits]?.status_code || body?.status_code;
  const providerText = body?.sms?.[toDigits]?.status_text || body?.status_text || null;

  console.info(
    JSON.stringify({
      level: "info",
      event: "sms_ru_send_response",
      httpStatus: response.status,
      providerStatus: body?.status || "UNKNOWN",
      providerCode: body?.status_code ?? null,
      phoneStatus: phoneStatus || null,
      phoneStatusCode: body?.sms?.[toDigits]?.status_code ?? null
    })
  );

  if (!response.ok) {
    throw new HttpError(502, "SMS_PROVIDER_HTTP_ERROR", "SMS provider request failed");
  }
  if (body?.status !== "OK" || phoneStatus !== "OK") {
    throw mapSmsRuFailureToHttpError(providerCode, providerText);
  }
};

const enforceRateLimit = async (store, key, config) => {
  const result = await store.incrementRateLimit(key, config.windowSeconds);
  if (result.count > config.max) {
    throw new HttpError(429, "RATE_LIMITED", "Too many requests. Please try later", [
      { field: "retryAfterSeconds", message: String(result.ttlSeconds) }
    ]);
  }
};

const startPhoneAuth = async ({ phone, req }) => {
  const normalizedPhone = normalizeRussianPhone(phone);
  const store = await getOtpStore();
  const ip = getClientIp(req);

  await enforceRateLimit(store, `ip:${ip}`, IP_RATE_LIMIT);
  await enforceRateLimit(store, `phone:${normalizedPhone}`, PHONE_RATE_LIMIT);

  const requestId = crypto.randomUUID();
  const devOtpOverride = getDevOtpOverride(normalizedPhone);
  const code = devOtpOverride || generateOtp();
  const otpPepper = process.env.OTP_HASH_PEPPER || process.env.JWT_SECRET || "dev-otp-pepper";
  const otpHash = hashOtp(code, requestId, otpPepper);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000).toISOString();

  await store.saveRequest(
    {
      requestId,
      phone: normalizedPhone,
      otpHash,
      expiresAt,
      attemptsLeft: OTP_ATTEMPTS,
      createdAt: now.toISOString(),
      ip
    },
    OTP_TTL_SECONDS
  );

  const isDevOverride = Boolean(devOtpOverride);
  if (!isDevOverride) {
    try {
      await sendSmsRuOtp({ toPhoneE164: normalizedPhone, code, clientIp: ip });
    } catch (error) {
      await store.deleteRequest(requestId);
      throw error;
    }
  }

  return { requestId };
};

const findOrCreateUser = (phone) => {
  const existing = usersByPhone.get(phone);
  if (existing) return { user: existing, isNewUser: false };
  const devAccount = getDevTestAccount(phone);
  const user = {
    id: crypto.randomUUID(),
    phone,
    role: devAccount?.role || "customer",
    createdAt: new Date().toISOString()
  };
  usersByPhone.set(phone, user);
  return { user, isNewUser: true };
};

const verifyPhoneAuth = async ({ requestId, code }) => {
  const store = await getOtpStore();
  const record = await store.getRequest(requestId);
  if (!record) {
    throw new HttpError(400, "OTP_NOT_FOUND", "OTP request not found or expired");
  }

  const expiresAtTs = Date.parse(record.expiresAt);
  if (!Number.isFinite(expiresAtTs) || Date.now() > expiresAtTs) {
    await store.deleteRequest(requestId);
    throw new HttpError(400, "OTP_EXPIRED", "OTP code has expired");
  }

  if (record.attemptsLeft <= 0) {
    await store.deleteRequest(requestId);
    throw new HttpError(429, "OTP_ATTEMPTS_EXCEEDED", "No attempts left for this code");
  }

  const otpPepper = process.env.OTP_HASH_PEPPER || process.env.JWT_SECRET || "dev-otp-pepper";
  const incomingHash = hashOtp(code, requestId, otpPepper);
  const isValid = isTimingSafeEqual(record.otpHash, incomingHash);

  if (!isValid) {
    const nextAttempts = Math.max(0, record.attemptsLeft - 1);
    if (nextAttempts <= 0) {
      await store.deleteRequest(requestId);
      throw new HttpError(429, "OTP_ATTEMPTS_EXCEEDED", "No attempts left for this code");
    }
    await store.updateRequest(requestId, { attemptsLeft: nextAttempts });
    throw new HttpError(400, "OTP_INVALID", "Invalid OTP code", [
      { field: "attemptsLeft", message: String(nextAttempts) }
    ]);
  }

  const { user, isNewUser } = findOrCreateUser(record.phone);
  const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-jwt-secret");
  if (!jwtSecret) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", "JWT secret is not configured");
  }

  const token = jwt.sign({ sub: user.id, phone: user.phone, role: user.role }, jwtSecret, {
    expiresIn: "1h"
  });

  await store.deleteRequest(requestId);
  return { token, user, isNewUser };
};

module.exports = {
  normalizeRussianPhone,
  startPhoneAuth,
  verifyPhoneAuth
};
