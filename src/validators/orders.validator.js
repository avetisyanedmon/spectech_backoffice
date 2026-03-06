const Joi = require("joi");
const { HttpError } = require("../utils/httpError");

const createOrderSchema = Joi.object({
  equipmentCategory: Joi.string().trim().required(),
  city: Joi.string().trim().min(1).max(120).required(),
  street: Joi.string().trim().allow("").max(150),
  houseNumber: Joi.string().trim().allow("").max(30),
  address: Joi.string().trim().allow("").max(255),
  paymentTypes: Joi.array().items(Joi.string().trim()).min(1).required(),
  pricingUnit: Joi.string().trim().required(),
  workVolume: Joi.alternatives().try(Joi.number(), Joi.string().trim()).required(),
  startDate: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/),
  startTime: Joi.string().trim().pattern(/^\d{2}:\d{2}$/),
  startDateTime: Joi.string().trim(),
  expiryDateTime: Joi.any(),
  adDuration: Joi.alternatives().try(Joi.number(), Joi.string().trim()),
  durationHours: Joi.alternatives().try(Joi.number(), Joi.string().trim()),
  description: Joi.string().trim().min(1).max(2000).required(),
  creatorId: Joi.any().forbidden(),
  customerName: Joi.any().forbidden(),
  customerPhone: Joi.any().forbidden(),
  userId: Joi.any().forbidden()
}).required();

const validateCreateOrderPayload = (payload) => {
  const { error, value } = createOrderSchema.validate(payload, {
    abortEarly: false,
    convert: true
  });

  const details = [];

  if (error) {
    error.details.forEach((item) => {
      details.push({
        field: item.path.join(".") || "body",
        message: item.message
      });
    });
  }

  const hasAddress = !!(value?.address && value.address.trim());
  const hasStreetAndHouse = !!(
    value?.street &&
    value.street.trim() &&
    value?.houseNumber &&
    value.houseNumber.trim()
  );

  if (!hasAddress && !hasStreetAndHouse) {
    details.push({
      field: "address",
      message: "Either address or street + houseNumber is required"
    });
  }

  const hasStartDateTime = !!(value?.startDateTime && value.startDateTime.trim());
  const hasStartDateAndTime = !!(
    value?.startDate &&
    value.startDate.trim() &&
    value?.startTime &&
    value.startTime.trim()
  );

  if (!hasStartDateTime && !hasStartDateAndTime) {
    details.push({
      field: "startDateTime",
      message: "Either startDateTime or startDate + startTime is required"
    });
  }

  const hasDuration = value?.durationHours !== undefined || value?.adDuration !== undefined;
  if (!hasDuration) {
    details.push({
      field: "durationHours",
      message: "Either durationHours or adDuration is required"
    });
  }

  if (details.length > 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", details);
  }

  return value;
};

module.exports = { validateCreateOrderPayload };
