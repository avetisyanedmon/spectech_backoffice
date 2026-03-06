const { HttpError } = require("../utils/httpError");
const jwt = require("jsonwebtoken");

const ALLOWED_ORDER_CREATOR_ROLES = ["customer", "contractor", "admin", "manager"];
const ALLOWED_BID_ROLES = ["contractor", "admin", "manager"];
const ALLOWED_EQUIPMENT_ROLES = ["customer", "contractor", "admin", "manager"];
const ROLE_ALIASES = {
  "role_customer": "customer",
  client: "customer",
  заказчик: "customer",
  "role_contractor": "contractor",
  executor: "contractor",
  contractor_user: "contractor",
  исполнитель: "contractor",
  "role_admin": "admin",
  administrator: "admin",
  "role_manager": "manager"
};

const normalizeRole = (role) => {
  const normalized = role.trim().toLowerCase();
  return ROLE_ALIASES[normalized] || normalized;
};

const parseBearerUser = (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded && typeof decoded.sub === "string") {
        const role = typeof decoded.role === "string" ? decoded.role : "customer";
        return { id: decoded.sub.trim(), role: normalizeRole(role) };
      }
    } catch (_error) {
      // Fallback to legacy dev token parser.
    }
  }

  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed.id !== "string" || typeof parsed.role !== "string") {
      return null;
    }

    return { id: parsed.id.trim(), role: normalizeRole(parsed.role) };
  } catch (_error) {
    return null;
  }
};

const authenticate = (req, _res, next) => {
  if (!req.user) {
    req.user = parseBearerUser(req.headers.authorization);
  }

  if (!req.user || !req.user.id) {
    return next(new HttpError(401, "UNAUTHORIZED", "Authentication required"));
  }

  return next();
};

const authorizeRoles = (roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, "FORBIDDEN", "Insufficient permissions"));
  }

  return next();
};

module.exports = {
  ALLOWED_BID_ROLES,
  ALLOWED_EQUIPMENT_ROLES,
  ALLOWED_ORDER_CREATOR_ROLES,
  authenticate,
  authorizeRoles
};
