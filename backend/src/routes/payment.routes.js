// backend/src/routes/payment.routes.js
// Handles Paystack payment verification and records the 5%/95% split

const express = require("express");
const router = express.Router();
const https = require("https");
const { protect, restrictTo } = require("../middleware");
const { Booking, Hostel } = require("../models");
const mongoose = require("mongoose");

// ── Payment model (add to models/index.js) ────────────────────────────────
// const paymentSchema = new mongoose.Schema({
//   reference:     { type: String, required: true, unique: true },
//   studentId:     { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
//   hostelId:      { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
//   roomName:      { type: String },
//   amountPaid:    { type: Number, required: true },  // Full GH₵ amount
//   platformFee:   { type: Number, required: true },  // 5%
//   hostPayout:    { type: Number, required: true },  // 95%
//   paystackStatus: { type: String, default: "pending" }, // success | failed
//   settled:       { type: Boolean, default: false },  // Has host been paid?
// }, { timestamps: true });
// Payment = mongoose.model("Payment", paymentSchema);

const PLATFORM_FEE_PERCENT = 5;

/**
 * POST /api/payments/initialize
 * Returns a Paystack authorization URL for redirecting the student.
 * Alternative to the inline popup (better for mobile).
 */
router.post("/initialize", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const { hostelId, roomName, amount } = req.body;
    if (!hostelId || !amount) return res.status(400).json({ message: "hostelId and amount required." });

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    const reference = `HH-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const paystackData = JSON.stringify({
      email: req.user.email,
      amount: amount * 100, // convert GH₵ to pesewas
      currency: "GHS",
      reference,
      metadata: {
        hostelId,
        hostelName: hostel.name,
        roomName,
        studentId: req.user.id,
        platformFeePercent: PLATFORM_FEE_PERCENT,
      },
    });

    // Call Paystack Initialize Transaction API
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transaction/initialize",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": paystackData.length,
      },
    };

    const paystackReq = https.request(options, paystackRes => {
      let data = "";
      paystackRes.on("data", chunk => data += chunk);
      paystackRes.on("end", () => {
        const parsed = JSON.parse(data);
        if (parsed.status) {
          res.json({
            authorizationUrl: parsed.data.authorization_url,
            reference,
            accessCode: parsed.data.access_code,
          });
        } else {
          res.status(400).json({ message: "Failed to initialize Paystack transaction." });
        }
      });
    });

    paystackReq.on("error", next);
    paystackReq.write(paystackData);
    paystackReq.end();

  } catch (err) { next(err); }
});

/**
 * POST /api/payments/verify
 * Called after Paystack popup closes with a successful reference.
 * Verifies with Paystack, records the split, and marks booking as paid.
 */
router.post("/verify", protect, async (req, res, next) => {
  try {
    const { reference, hostelId, roomName, amount } = req.body;
    if (!reference) return res.status(400).json({ message: "Payment reference required." });

    // Verify with Paystack
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    };

    const paystackRes = await new Promise((resolve, reject) => {
      const req2 = https.request(options, res2 => {
        let data = "";
        res2.on("data", chunk => data += chunk);
        res2.on("end", () => resolve(JSON.parse(data)));
      });
      req2.on("error", reject);
      req2.end();
    });

    if (!paystackRes.status || paystackRes.data.status !== "success") {
      return res.status(400).json({ message: "Payment verification failed. Please contact support." });
    }

    const paidAmount = paystackRes.data.amount / 100; // convert pesewas back to GH₵
    const platformFee = Math.round(paidAmount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    const hostPayout  = paidAmount - platformFee;

    // TODO: Save Payment record to DB
    // await Payment.create({
    //   reference,
    //   studentId: req.user.id,
    //   hostelId,
    //   roomName,
    //   amountPaid: paidAmount,
    //   platformFee,
    //   hostPayout,
    //   paystackStatus: "success",
    //   settled: false,
    // });

    // TODO: Update booking status to "paid"
    // await Booking.findOneAndUpdate(
    //   { studentId: req.user.id, hostelId, status: "approved" },
    //   { status: "paid", paymentReference: reference }
    // );

    // TODO: Trigger host payout
    // In production you would use Paystack's Transfer API to send hostPayout
    // to the host's saved bank/momo account.
    // await triggerHostPayout(hostelId, hostPayout, reference);

    res.json({
      success: true,
      message: "Payment verified successfully.",
      breakdown: {
        totalPaid: paidAmount,
        platformFee: { percent: PLATFORM_FEE_PERCENT, amount: platformFee },
        hostPayout: { percent: 100 - PLATFORM_FEE_PERCENT, amount: hostPayout },
      },
      reference,
    });

  } catch (err) { next(err); }
});

/**
 * POST /api/payments/webhook
 * Paystack calls this endpoint automatically on successful payments.
 * Add this URL in your Paystack dashboard under Webhooks.
 * IMPORTANT: This route must NOT use the protect middleware.
 */
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res, next) => {
  try {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    // Verify the webhook came from Paystack
    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid webhook signature." });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const { reference, amount, metadata } = event.data;
      const paidGHS = amount / 100;
      const platformFee = Math.round(paidGHS * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
      const hostPayout  = paidGHS - platformFee;

      console.log(`✅ Webhook: Payment ${reference} — GH₵${paidGHS} received`);
      console.log(`   Platform fee: GH₵${platformFee} | Host payout: GH₵${hostPayout}`);

      // TODO: Update database, trigger payout, send confirmation email
    }

    res.sendStatus(200);
  } catch (err) { next(err); }
});

/**
 * GET /api/payments/history — student sees their payment history
 */
router.get("/history", protect, async (req, res, next) => {
  try {
    // TODO: fetch from Payment model
    // const payments = await Payment.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.json({ payments: [], message: "Payment history endpoint ready." });
  } catch (err) { next(err); }
});

/**
 * GET /api/payments/host-earnings — host sees their earnings
 */
router.get("/host-earnings", protect, restrictTo("host"), async (req, res, next) => {
  try {
    // TODO: fetch payments for all hostels owned by this host
    // const hostels = await Hostel.find({ ownerId: req.user.id }).select("_id");
    // const hostelIds = hostels.map(h => h._id);
    // const payments = await Payment.find({ hostelId: { $in: hostelIds } }).sort({ createdAt: -1 });
    res.json({ earnings: [], message: "Host earnings endpoint ready." });
  } catch (err) { next(err); }
});

module.exports = router;

/*
═══════════════════════════════════════════════════════════════
SETUP INSTRUCTIONS
═══════════════════════════════════════════════════════════════

1. Add to your .env:
   PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx    ← from paystack.com dashboard
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx     ← for frontend

2. Add to server.js:
   const paymentRoutes = require("./routes/payment.routes");
   app.use("/api/payments", paymentRoutes);

3. Register webhook in Paystack Dashboard:
   Settings → Webhooks → Add URL:
   https://your-backend.onrender.com/api/payments/webhook

4. To trigger payouts to hosts, use Paystack Transfer API:
   https://paystack.com/docs/transfers/single-transfers/

5. Paystack test cards:
   Success: 4084 0840 8408 4081 | CVV: 408 | Expiry: any future date | OTP: 123456
   Failure: 4084 0840 8408 4081 + wrong OTP

6. For GH MoMo testing:
   MTN: 0551234987 | Vodafone: 0204321098
═══════════════════════════════════════════════════════════════
*/