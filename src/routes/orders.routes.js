const express = require("express");
const { createOrderController, getOrdersController } = require("../controllers/orders.controller");
const { createBidController } = require("../controllers/bids.controller");
const {
  authenticate,
  authorizeRoles,
  ALLOWED_ORDER_CREATOR_ROLES,
  ALLOWED_BID_ROLES
} = require("../middlewares/auth.middleware");
const { asyncHandler } = require("../utils/asyncHandler");

const ordersRouter = express.Router();

ordersRouter.get(
  "/",
  authenticate,
  authorizeRoles(ALLOWED_ORDER_CREATOR_ROLES),
  asyncHandler(getOrdersController)
);

ordersRouter.post(
  "/",
  authenticate,
  authorizeRoles(ALLOWED_ORDER_CREATOR_ROLES),
  asyncHandler(createOrderController)
);

ordersRouter.post(
  "/:orderId/bids",
  authenticate,
  authorizeRoles(ALLOWED_BID_ROLES),
  asyncHandler(createBidController)
);

module.exports = { ordersRouter };
