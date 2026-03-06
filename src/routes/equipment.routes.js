const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  authenticate,
  authorizeRoles,
  ALLOWED_EQUIPMENT_ROLES
} = require("../middlewares/auth.middleware");
const {
  createEquipmentController,
  getEquipmentController
} = require("../controllers/equipment.controller");

const equipmentRouter = express.Router();

equipmentRouter.post(
  "/",
  authenticate,
  authorizeRoles(ALLOWED_EQUIPMENT_ROLES),
  asyncHandler(createEquipmentController)
);

equipmentRouter.get(
  "/",
  authenticate,
  authorizeRoles(ALLOWED_EQUIPMENT_ROLES),
  asyncHandler(getEquipmentController)
);

module.exports = { equipmentRouter };
