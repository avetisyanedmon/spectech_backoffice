const crypto = require("crypto");

const OTP_TTL_SECONDS = 5 * 60;
const DEFAULT_RATE_WINDOW_SECONDS = 10 * 60;

class InMemoryOtpStore {
  constructor() {
    this.requests = new Map();
    this.rateBuckets = new Map();
  }

  async saveRequest(record, ttlSeconds = OTP_TTL_SECONDS) {
    const expiresAtTs = Date.now() + ttlSeconds * 1000;
    this.requests.set(record.requestId, { ...record, expiresAtTs });
  }

  async getRequest(requestId) {
    const request = this.requests.get(requestId);
    if (!request) return null;
    if (Date.now() > request.expiresAtTs) {
      this.requests.delete(requestId);
      return null;
    }
    return { ...request };
  }

  async updateRequest(requestId, patch) {
    const current = await this.getRequest(requestId);
    if (!current) return null;
    const updated = { ...current, ...patch };
    this.requests.set(requestId, updated);
    return { ...updated };
  }

  async deleteRequest(requestId) {
    this.requests.delete(requestId);
  }

  async incrementRateLimit(key, windowSeconds = DEFAULT_RATE_WINDOW_SECONDS) {
    const now = Date.now();
    const existing = this.rateBuckets.get(key);
    if (!existing || existing.expiresAtTs <= now) {
      const next = { count: 1, expiresAtTs: now + windowSeconds * 1000 };
      this.rateBuckets.set(key, next);
      return { count: 1, ttlSeconds: windowSeconds };
    }

    existing.count += 1;
    this.rateBuckets.set(key, existing);
    const ttlSeconds = Math.max(1, Math.ceil((existing.expiresAtTs - now) / 1000));
    return { count: existing.count, ttlSeconds };
  }
}

class RedisOtpStore {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  requestKey(requestId) {
    return `otp:request:${requestId}`;
  }

  async saveRequest(record, ttlSeconds = OTP_TTL_SECONDS) {
    await this.redis.set(this.requestKey(record.requestId), JSON.stringify(record), { EX: ttlSeconds });
  }

  async getRequest(requestId) {
    const raw = await this.redis.get(this.requestKey(requestId));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async updateRequest(requestId, patch) {
    const key = this.requestKey(requestId);
    const currentRaw = await this.redis.get(key);
    if (!currentRaw) return null;
    const ttlSeconds = await this.redis.ttl(key);
    if (ttlSeconds <= 0) return null;
    const updated = { ...JSON.parse(currentRaw), ...patch };
    await this.redis.set(key, JSON.stringify(updated), { EX: ttlSeconds });
    return updated;
  }

  async deleteRequest(requestId) {
    await this.redis.del(this.requestKey(requestId));
  }

  async incrementRateLimit(key, windowSeconds = DEFAULT_RATE_WINDOW_SECONDS) {
    const namespacedKey = `otp:limit:${key}`;
    const count = await this.redis.incr(namespacedKey);
    if (count === 1) {
      await this.redis.expire(namespacedKey, windowSeconds);
    }
    const ttlSeconds = await this.redis.ttl(namespacedKey);
    return { count, ttlSeconds: Math.max(1, ttlSeconds) };
  }
}

let singletonStore = null;

const buildRedisStore = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // Optional dependency: use Redis when available and configured.
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { createClient } = require("redis");
    const client = createClient({ url: redisUrl });

    client.on("error", (error) => {
      console.error(
        JSON.stringify({
          level: "error",
          event: "otp_store_redis_error",
          message: error.message
        })
      );
    });

    await client.connect();
    return new RedisOtpStore(client);
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "otp_store_fallback_memory",
        reason: "Redis unavailable, using in-memory store",
        message: error.message
      })
    );
    return null;
  }
};

const getOtpStore = async () => {
  if (singletonStore) return singletonStore;
  const redisStore = await buildRedisStore();
  singletonStore = redisStore || new InMemoryOtpStore();
  return singletonStore;
};

const hashOtp = (code, requestId, pepper) => {
  const salt = crypto.createHash("sha256").update(requestId).digest("hex");
  return crypto
    .createHash("sha256")
    .update(`${salt}:${code}:${pepper}`)
    .digest("hex");
};

module.exports = { getOtpStore, hashOtp, OTP_TTL_SECONDS };
