const Joi = require("joi");
const { HttpError } = require("../utils/httpError");

const createBidSchema = Joi.object({
  price: Joi.number().positive().required(),
  deliveryPrice: Joi.number().min(0).required(),
  paymentType: Joi.string().trim().required(),
  comment: Joi.string().trim().allow("").optional(),
  equipmentId: Joi.string().trim().allow("").optional(),
  equipmentName: Joi.string().trim().allow("").optional(),
  equipmentCategory: Joi.string().trim().allow("").optional()
}).unknown(false);

const validateCreateBidPayload = (body) => {
  const { error, value } = createBidSchema.validate(body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path[0], message: d.message }));
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid bid payload", details);
  }
  return value;
};

module.exports = { validateCreateBidPayload };
