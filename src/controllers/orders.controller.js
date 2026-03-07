const { validateCreateOrderPayload } = require("../validators/orders.validator");
const { createOrder, getOrders, ORDER_VIEW_MODES } = require("../services/orders.service");
const { bidsRepository } = require("../repositories");

const serializeOrder = (order, bids = []) => ({
  id: order.id,
  equipmentCategory: order.equipmentCategory,
  city: order.city,
  address: order.address,
  paymentTypes: order.paymentTypes,
  pricingUnit: order.pricingUnit,
  workVolume: order.workVolume,
  startDateTime: order.startDateTime,
  durationHours: order.durationHours,
  expiresAt: order.expiresAt,
  expiryDateTime: order.expiresAt,
  status: order.status,
  bidCount: order.bidCount,
  creatorId: order.creatorId,
  createdAt: order.createdAt,
  bids: bids.map((b) => ({
    id: b.id,
    userId: b.userId || b.contractorId,
    contractorId: b.contractorId,
    price: b.price,
    deliveryPrice: b.deliveryPrice,
    paymentType: b.paymentType,
    comment: b.comment,
    equipmentId: b.equipmentId,
    equipmentName: b.equipmentName,
    equipmentCategory: b.equipmentCategory,
    submittedAt: b.submittedAt || b.createdAt
  }))
});

const getOrdersController = async (req, res) => {
  const requestedView = String(req.query?.view || ORDER_VIEW_MODES.ALL).trim().toLowerCase();
  const allowedViews = new Set(Object.values(ORDER_VIEW_MODES));
  const view = allowedViews.has(requestedView) ? requestedView : ORDER_VIEW_MODES.ALL;
  const orders = await getOrders(req.user, view);

  const serialized = await Promise.all(
    orders.map(async (order) => {
      const bids = await bidsRepository.findByOrderId(order.id);
      return serializeOrder(order, bids);
    })
  );

  return res.status(200).json({
    success: true,
    data: serialized
  });
};

const createOrderController = async (req, res) => {
  const payload = validateCreateOrderPayload(req.body);
  const order = await createOrder(payload, req.user.id);

  return res.status(201).json({
    success: true,
    data: serializeOrder(order, [])
  });
};

module.exports = { createOrderController, getOrdersController };
