require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const dns = require("dns");

// Routes
const authRoutes     = require("./routes/auth.routes");
const studentRoutes  = require("./routes/student.routes");
const hostRoutes     = require("./routes/host.routes");
const hostPayoutRoutes = require("./routes/host.payout.routes");
const hostelRoutes   = require("./routes/hostel.routes");
const bookingRoutes  = require("./routes/booking.routes");
const messageRoutes  = require("./routes/message.routes");
const adminRoutes    = require("./routes/admin.routes");
const paymentRoutes  = require("./routes/payment.routes");

const { errorHandler } = require("./middleware");
const { apiLimiter }   = require("./middleware/rateLimit.middleware");

const app = express();

dns.setServers(["1.1.1.1","8.8.8.8"])
// ── Security headers
app.use(helmet());

// ── CORS
const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server calls and non-browser tools (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
}));

// ══════════════════════════════════════════════════════════════════
// ⚠️  CRITICAL: Paystack webhook MUST be registered BEFORE express.json()
// The webhook handler needs the raw request body (Buffer) to verify
// the HMAC signature. express.json() would parse it into an object
// and break signature verification.
// ══════════════════════════════════════════════════════════════════
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/payment.routes").webhookHandler || (() => {})
);

// ── Body parsing (AFTER webhook route)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Sanitize NoSQL injection
app.use(mongoSanitize());

// ── Request logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── Rate limiting
app.use("/api", apiLimiter);

// ── Routes
app.use("/api/auth",     authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/hosts",    hostRoutes);
app.use("/api/hosts",    hostPayoutRoutes);   // payout sub-routes
app.use("/api/hostels",  hostelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/payments", paymentRoutes);      // all payment routes (webhook already registered above)

// ── Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));

// ── 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler
app.use(errorHandler);

// ── Connect DB and start
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;