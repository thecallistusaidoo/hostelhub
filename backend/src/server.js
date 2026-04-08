require("dotenv").config();
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const { attachSocket } = require("./socket");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const dns = require("dns");

const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const hostRoutes = require("./routes/host.routes");
const hostelRoutes = require("./routes/hostel.routes");
const bookingRoutes = require("./routes/booking.routes");
const messageRoutes = require("./routes/message.routes");
const adminRoutes = require("./routes/admin.routes");
const { errorHandler } = require("./middleware/index");
const { apiLimiter } = require("./middleware/rateLimit.middleware");

const app = express();

dns.setServers(["1.1.1.1", "8.8.8.8"]); // Use Cloudflare and Google DNS to avoid potential issues with local DNS resolution in some environments

// ── Security headers
app.use(helmet());

// ── CORS — allow configured origins + local dev ports
const configuredOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and local dev hosts.
    if (!origin) return callback(null, true);

    const isConfigured = configuredOrigins.includes(origin);
    const isLocalhostDev = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

    if (isConfigured || isLocalhostDev) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
}));

// ── Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Sanitize NoSQL injection (e.g. { $gt: "" })
app.use(mongoSanitize());

// ── Request logging (dev only)
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── Global rate limiting (100 req / 15 min per IP)
app.use("/api", apiLimiter);

// ── Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/hosts", hostRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

// ── Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));

// ── 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler
app.use(errorHandler);

// ── Connect DB and start server
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    const httpServer = http.createServer(app);
    attachSocket(httpServer);

    httpServer.listen(PORT, () =>
      console.log(`🚀 Server + Socket.io on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app; // exported for tests