const buildBearerToken = (user) =>
  `Bearer ${Buffer.from(JSON.stringify(user)).toString("base64url")}`;

module.exports = { buildBearerToken };
