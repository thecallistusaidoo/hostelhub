// ═══════════════════════════════════════════════════════════════
// middleware/auth.middleware.js
// JWT verification + role checking
// ═══════════════════════════════════════════════════════════════
const { verifyAccessToken } = require("../utils/jwt.util");

/**
 * Protect routes — verifies Bearer token in Authorization header
 */
function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated. Please log in." });
  }
  const token = header.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid. Please log in again." });
  }
}

/**
 * Role guard — call after protect()
 * Usage: restrictTo("admin") or restrictTo("host","admin")
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
}

// ═══════════════════════════════════════════════════════════════
// middleware/validate.middleware.js
// Zod request body validation
// ═══════════════════════════════════════════════════════════════
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    req.body = result.data; // replace with cleaned/coerced data
    next();
  };
}

// ═══════════════════════════════════════════════════════════════
// middleware/error.middleware.js
// Global error handler
// ═══════════════════════════════════════════════════════════════
function errorHandler(err, req, res, next) {
  console.error("❌", err.stack || err.message);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists.` });
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}

module.exports = { protect, restrictTo, validate, errorHandler };