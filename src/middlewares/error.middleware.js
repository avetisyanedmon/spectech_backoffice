const { HttpError } = require("../utils/httpError");

const notFoundHandler = (_req, _res, next) => {
  next(new HttpError(404, "NOT_FOUND", "Route not found"));
};

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || []
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected server error",
      details: []
    }
  });
};

module.exports = { notFoundHandler, errorHandler };
