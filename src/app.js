const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { apiRouter } = require("./routes");
const { openApiSpec } = require("./docs/openapi");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/error.middleware");

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "false" ? false : true);
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:4028")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, " "))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = origin.trim().replace(/\/+$/, "");
  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const url = new URL(normalizedOrigin);
    // Allow localhost/127.0.0.1 dev origins on any port.
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    );
  } catch (_error) {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools and configured/dev frontend origins.
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api", apiRouter);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
