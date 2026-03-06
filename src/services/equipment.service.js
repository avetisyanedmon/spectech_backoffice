const { randomUUID } = require("crypto");
const { equipmentRepository } = require("../repositories/equipment.repository");

const serializeInput = (payload) => ({
  name: payload.name.trim(),
  category: payload.category.trim(),
  characteristics: payload.characteristics.trim(),
  additionalEquipment: payload.additionalEquipment ? payload.additionalEquipment.trim() : "",
  photos: Array.isArray(payload.photos)
    ? payload.photos.map((photo) => String(photo).trim()).filter(Boolean)
    : []
});

const createEquipment = (payload, ownerId) => {
  const normalized = serializeInput(payload);
  const now = new Date().toISOString();

  return equipmentRepository.create({
    id: randomUUID(),
    ownerId,
    name: normalized.name,
    category: normalized.category,
    characteristics: normalized.characteristics,
    additionalEquipment: normalized.additionalEquipment,
    photos: normalized.photos,
    createdAt: now,
    updatedAt: now
  });
};

const getEquipmentForUser = (ownerId) =>
  equipmentRepository
    .findByOwnerId(ownerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

module.exports = { createEquipment, getEquipmentForUser };
