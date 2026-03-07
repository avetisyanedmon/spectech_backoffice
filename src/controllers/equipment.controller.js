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

const createEquipmentController = async (req, res) => {
  const payload = validateCreateEquipmentPayload(req.body);
  const equipment = await createEquipment(payload, req.user.id);

  return res.status(201).json({
    success: true,
    data: serializeEquipment(equipment)
  });
};

const getEquipmentController = async (req, res) => {
  const items = await getEquipmentForUser(req.user.id);

  return res.status(200).json({
    success: true,
    data: items.map(serializeEquipment)
  });
};

module.exports = { createEquipmentController, getEquipmentController };
