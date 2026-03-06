const express = require("express");
const { ordersRouter } = require("./orders.routes");
const { equipmentRouter } = require("./equipment.routes");
const { authRouter } = require("./auth.routes");

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

apiRouter.use("/orders", ordersRouter);
apiRouter.use("/equipment", equipmentRouter);
apiRouter.use("/auth", authRouter);

module.exports = { apiRouter };
