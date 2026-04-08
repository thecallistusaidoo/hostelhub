const rateLimit = require("express-rate-limit");

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again in 15 minutes." },
});

// Strict limiter for auth endpoints (login/signup)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please wait 15 minutes." },
});

module.exports = { apiLimiter, authLimiter };