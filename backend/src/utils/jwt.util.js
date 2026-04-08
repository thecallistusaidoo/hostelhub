const jwt = require("jsonwebtoken");

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

/**
 * Generate a short-lived access token (15 min default)
 */
function generateAccessToken(payload) {
  const secret = getAccessSecret();
  if (!secret) throw new Error("JWT_ACCESS_SECRET (or JWT_SECRET) is not configured");
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
}

/**
 * Generate a long-lived refresh token (7 days default)
 */
function generateRefreshToken(payload) {
  const secret = getRefreshSecret();
  if (!secret) throw new Error("JWT_REFRESH_SECRET (or JWT_SECRET) is not configured");
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
}

/**
 * Verify an access token — throws if invalid/expired
 */
function verifyAccessToken(token) {
  const secret = getAccessSecret();
  if (!secret) throw new Error("JWT_ACCESS_SECRET (or JWT_SECRET) is not configured");
  return jwt.verify(token, secret);
}

/**
 * Verify a refresh token — throws if invalid/expired
 */
function verifyRefreshToken(token) {
  const secret = getRefreshSecret();
  if (!secret) throw new Error("JWT_REFRESH_SECRET (or JWT_SECRET) is not configured");
  return jwt.verify(token, secret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};