const Joi = require("joi");
const { HttpError } = require("../utils/httpError");

const startSchema = Joi.object({
  phone: Joi.string().trim().required()
}).required();

const verifySchema = Joi.object({
  requestId: Joi.string().trim().guid({ version: ["uuidv4", "uuidv5"] }).required(),
  code: Joi.string().trim().pattern(/^\d{6}$/).required()
}).required();

const validatePayload = (schema, payload) => {
  const { error, value } = schema.validate(payload, { abortEarly: false, convert: true });
  if (!error) return value;

  const details = error.details.map((item) => ({
    field: item.path.join(".") || "body",
    message: item.message
  }));
  throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", details);
};

const validateStartAuthPayload = (payload) => validatePayload(startSchema, payload);
const validateVerifyAuthPayload = (payload) => validatePayload(verifySchema, payload);

module.exports = { validateStartAuthPayload, validateVerifyAuthPayload };
