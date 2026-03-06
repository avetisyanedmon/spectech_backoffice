const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { startAuthController, verifyAuthController } = require("../controllers/auth.controller");

const authRouter = express.Router();

authRouter.post("/start", asyncHandler(startAuthController));
authRouter.post("/verify", asyncHandler(verifyAuthController));

module.exports = { authRouter };
