const { validateCreateEquipmentPayload } = require("../validators/equipment.validator");
const { createEquipment, getEquipmentForUser } = require("../services/equipment.service");

const serializeEquipment = (item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  characteristics: item.characteristics,
  additionalEquipment: item.additionalEquipment || "",
  photos: Array.isArray(item.photos) ? item.photos : [],
  ownerId: item.ownerId,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

const createEquipmentController = (req, res) => {
  const payload = validateCreateEquipmentPayload(req.body);
  const equipment = createEquipment(payload, req.user.id);

  return res.status(201).json({
    success: true,
    data: serializeEquipment(equipment)
  });
};

const getEquipmentController = (req, res) => {
  const items = getEquipmentForUser(req.user.id);

  return res.status(200).json({
    success: true,
    data: items.map(serializeEquipment)
  });
};

module.exports = { createEquipmentController, getEquipmentController };
