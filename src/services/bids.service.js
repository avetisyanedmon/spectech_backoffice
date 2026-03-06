const { randomUUID } = require("crypto");
const { HttpError } = require("../utils/httpError");
const { ordersRepository } = require("../repositories/orders.repository");
const { bidsRepository } = require("../repositories/bids.repository");

const createBid = (payload, contractorId) => {
  const { orderId, price, deliveryPrice, paymentType, comment, equipmentId, equipmentName, equipmentCategory } =
    payload;

  const order = ordersRepository.findById(orderId);
  if (!order) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (order.creatorId === contractorId) {
    throw new HttpError(400, "CANNOT_BID_OWN_ORDER", "You cannot submit a bid on your own order");
  }

  if (order.status !== "open") {
    throw new HttpError(400, "ORDER_NOT_OPEN", "Order is not accepting bids");
  }

  const expiresAt = new Date(order.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || new Date() > expiresAt) {
    throw new HttpError(400, "ORDER_EXPIRED", "Order has expired");
  }

  const existingBids = bidsRepository.findByOrderId(orderId);
  const alreadyBid = existingBids.some((b) => b.contractorId === contractorId);
  if (alreadyBid) {
    throw new HttpError(400, "ALREADY_BID", "You have already submitted a bid for this order");
  }

  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid price", [
      { field: "price", message: "Price must be a positive number" }
    ]);
  }

  const deliveryPriceNum = Number(deliveryPrice);
  if (!Number.isFinite(deliveryPriceNum) || deliveryPriceNum < 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Invalid delivery price", [
      { field: "deliveryPrice", message: "Delivery price must be a non-negative number" }
    ]);
  }

  const paymentTypeStr = String(paymentType || "").trim();
  if (!paymentTypeStr) {
    throw new HttpError(400, "VALIDATION_ERROR", "Payment type is required", [
      { field: "paymentType", message: "Payment type is required" }
    ]);
  }

  const now = new Date().toISOString();
  const bid = {
    id: randomUUID(),
    orderId,
    contractorId,
    price: priceNum,
    deliveryPrice: Number.isFinite(deliveryPriceNum) ? deliveryPriceNum : 0,
    paymentType: paymentTypeStr,
    comment: String(comment || "").trim() || null,
    equipmentId: equipmentId ? String(equipmentId).trim() : null,
    equipmentName: equipmentName ? String(equipmentName).trim() : null,
    equipmentCategory: equipmentCategory ? String(equipmentCategory).trim() : null,
    createdAt: now,
    updatedAt: now
  };

  bidsRepository.create(bid);
  ordersRepository.incrementBidCount(orderId);

  return {
    ...bid,
    userId: contractorId,
    submittedAt: now
  };
};

module.exports = { createBid };
