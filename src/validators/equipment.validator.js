const Joi = require("joi");
const { HttpError } = require("../utils/httpError");
const { EQUIPMENT_CATEGORIES } = require("../constants/equipment.constants");

const createEquipmentSchema = Joi.object({
  ownerId: Joi.any().forbidden(),
  userId: Joi.any().forbidden(),
  name: Joi.string().trim().min(1).max(120).required(),
  category: Joi.string()
    .trim()
    .valid(...EQUIPMENT_CATEGORIES)
    .required(),
  characteristics: Joi.string().trim().min(1).max(2000).required(),
  additionalEquipment: Joi.string().trim().allow("").max(1000),
  photos: Joi.array().items(Joi.string().trim().max(100000)).max(4).default([])
}).required();

const validateCreateEquipmentPayload = (payload) => {
  const { error, value } = createEquipmentSchema.validate(payload, {
    abortEarly: false,
    convert: true
  });

  if (!error) {
    return value;
  }

  const details = error.details.map((item) => ({
    field: item.path.join(".") || "body",
    message: item.message
  }));

  throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", details);
};

module.exports = { validateCreateEquipmentPayload };
