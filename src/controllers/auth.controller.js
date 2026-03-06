const { validateStartAuthPayload, validateVerifyAuthPayload } = require("../validators/auth.validator");
const { startPhoneAuth, verifyPhoneAuth } = require("../services/auth.service");

const startAuthController = async (req, res) => {
  const payload = validateStartAuthPayload(req.body);
  const result = await startPhoneAuth({ phone: payload.phone, req });
  return res.status(200).json(result);
};

const verifyAuthController = async (req, res) => {
  const payload = validateVerifyAuthPayload(req.body);
  const result = await verifyPhoneAuth(payload);
  return res.status(200).json(result);
};

module.exports = { startAuthController, verifyAuthController };
