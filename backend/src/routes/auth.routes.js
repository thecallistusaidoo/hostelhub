const express = require("express");
const router = express.Router();
const { Student, Host } = require("../models");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt.util");
const { validate } = require("../middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const { signupStudentSchema, signupHostSchema, loginSchema } = require("../utils/validation");

// ── Helper: build token payload
const makePayload = (user, role) => ({ id: user._id, role, email: user.email });

// ── Helper: send auth response
async function sendAuthResponse(res, user, role) {
  const payload = makePayload(user, role);
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store hashed refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      role,
      email: user.email,
      name: role === "host"
        ? user.fullName
        : `${user.firstName} ${user.lastName}`,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/signup-student
// ─────────────────────────────────────────────────────────────
router.post("/signup-student", authLimiter, validate(signupStudentSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, umatId, program, year } = req.body;

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const existingUmatId = await Student.findOne({ umatId });
    if (existingUmatId) {
      return res.status(400).json({ message: "UMaT ID already registered." });
    }

    const student = await Student.create({ firstName, lastName, email, phone, password, umatId, program, year });
    await sendAuthResponse(res, student, "student");
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/signup-host
// ─────────────────────────────────────────────────────────────
router.post("/signup-host", authLimiter, validate(signupHostSchema), async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const exists = await Host.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered." });

    const host = await Host.create({ fullName, email, phone, password });
    await sendAuthResponse(res, host, "host");
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login  (works for student, host, admin)
// ─────────────────────────────────────────────────────────────
router.post("/login", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Try student first
    let user = await Student.findOne({ email }).select("+password");
    let role = "student";

    if (!user) {
      user = await Host.findOne({ email }).select("+password");
      role = "host";
    }

    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password." });

    // Student accounts can be promoted to admin in the DB (see admin.routes.js)
    if (role === "student" && user.role === "admin") {
      role = "admin";
    }

    await sendAuthResponse(res, user, role);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// ─────────────────────────────────────────────────────────────
router.post("/refresh-token", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token required." });

    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check stored token matches
    let user, role;
    if (decoded.role === "host") {
      user = await Host.findById(decoded.id).select("+refreshToken");
      role = "host";
    } else {
      user = await Student.findById(decoded.id).select("+refreshToken");
      role = user?.role === "admin" ? "admin" : "student";
    }

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken(makePayload(user, role));
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Refresh token expired. Please log in again." });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken, role } = req.body;
    if (refreshToken && role) {
      const Model = role === "host" ? Host : Student;
      await Model.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }
    res.json({ message: "Logged out successfully." });
  } catch (err) { next(err); }
});

module.exports = router;