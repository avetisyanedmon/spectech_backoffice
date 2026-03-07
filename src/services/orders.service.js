const { randomUUID } = require("crypto");
const { ordersRepository, bidsRepository } = require("../repositories");
const {
  EQUIPMENT_CATEGORY_MAP,
  PRICING_UNIT_MAP,
  PAYMENT_TYPE_MAP
} = require("../constants/orders.constants");
const { HttpError } = require("../utils/httpError");
const ORDER_VIEW_MODES = {
  ALL: "all",
  MINE: "mine",
  MARKETPLACE: "marketplace",
  PENDING: "pending"
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase();

const parsePositiveNumber = (value, field) => {
  const normalized = typeof value === "string" ? value.replace(",", ".").trim() : value;
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", [
      { field, message: `${field} must be a positive number` }
    ]);
  }

  return parsed;
};

const parsePositiveInteger = (value, field) => {
  const parsed = parsePositiveNumber(value, field);
  if (!Number.isInteger(parsed)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", [
      { field, message: `${field} must be a positive integer` }
    ]);
  }
  return parsed;
};

const mapEnumValue = (value, mapping, fieldName) => {
  const mapped = mapping[normalizeKey(value)];
  if (!mapped) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", [
      { field: fieldName, message: `Unknown ${fieldName} value: ${value}` }
    ]);
  }
  return mapped;
};

const buildStartDateTime = (payload) => {
  if (payload.startDateTime) {
    const parsed = new Date(payload.startDateTime);
    if (Number.isNaN(parsed.getTime())) {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", [
        { field: "startDateTime", message: "startDateTime is not a valid datetime" }
      ]);
    }
    return parsed;
  }

  const combined = `${payload.startDate}T${payload.startTime}:00`;
  const parsed = new Date(combined);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid request payload", [
      { field: "startDate/startTime", message: "Invalid startDate/startTime value" }
    ]);
  }
  return parsed;
};

const buildAddress = (payload) => {
  if (payload.address && payload.address.trim()) {
    return payload.address.trim();
  }

  return `${payload.street.trim()}, д. ${payload.houseNumber.trim()}`;
};

const createOrder = async (payload, creatorId) => {
  const equipmentCategory = mapEnumValue(
    payload.equipmentCategory,
    EQUIPMENT_CATEGORY_MAP,
    "equipmentCategory"
  );
  const pricingUnit = mapEnumValue(payload.pricingUnit, PRICING_UNIT_MAP, "pricingUnit");
  const paymentTypes = payload.paymentTypes.map((type) =>
    mapEnumValue(type, PAYMENT_TYPE_MAP, "paymentTypes")
  );

  const workVolume = parsePositiveNumber(payload.workVolume, "workVolume");
  const durationHours = parsePositiveInteger(
    payload.durationHours ?? payload.adDuration,
    "durationHours"
  );

  const startDateTimeDate = buildStartDateTime(payload);
  const expiresAtDate = new Date(startDateTimeDate.getTime() + durationHours * 60 * 60 * 1000);
  const createdAtDate = new Date();

  const normalizedOrder = {
    id: randomUUID(),
    creatorId,
    equipmentCategory,
    city: payload.city.trim(),
    address: buildAddress(payload),
    paymentTypes,
    pricingUnit,
    workVolume,
    startDateTime: startDateTimeDate.toISOString(),
    durationHours,
    expiresAt: expiresAtDate.toISOString(),
    description: payload.description.trim(),
    status: "open",
    bidCount: 0,
    createdAt: createdAtDate.toISOString(),
    updatedAt: createdAtDate.toISOString()
  };

  return await ordersRepository.create(normalizedOrder);
};

const getOrders = async (user, viewMode = ORDER_VIEW_MODES.ALL) => {
  const allOrders = await ordersRepository.findAll();

  if (viewMode === ORDER_VIEW_MODES.MINE) {
    return allOrders.filter((order) => order.creatorId === user.id);
  }

  if (viewMode === ORDER_VIEW_MODES.MARKETPLACE) {
    return allOrders.filter((order) => order.creatorId !== user.id);
  }

  if (viewMode === ORDER_VIEW_MODES.PENDING) {
    const orderIdsWithBid = await bidsRepository.findOrderIdsByContractorId(user.id);
    const orderIdSet = new Set(orderIdsWithBid);
    return allOrders.filter(
      (order) => order.creatorId !== user.id && orderIdSet.has(order.id)
    );
  }

  return allOrders;
};

module.exports = { createOrder, getOrders, ORDER_VIEW_MODES };
