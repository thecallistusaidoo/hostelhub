// src/routes/payment.routes.js
// Complete Paystack payment flow for HostelHub:
//  1. Student pays full amount → hits YOUR Paystack account
//  2. Backend verifies → initiates 95% transfer to host's recipient code
//  3. 5% platform fee stays in your Paystack balance automatically
//  4. Webhook confirms transfers and marks payments settled

const express  = require("express");
const router   = express.Router();
const { protect, restrictTo } = require("../middleware");
const { Host, Hostel, Booking, Payment } = require("../models");
const paystack = require("../utils/paystack");

const PLATFORM_FEE_PERCENT = 5;
const PAYSTACK_GATEWAY_FEE_PERCENT = 1.95;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/initialize
// Student initiates payment — creates a Paystack checkout URL.
// The full GH₵ amount goes to YOUR Paystack account first.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/initialize", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const { hostelId, roomId, roomName, amountGHS, bookingId } = req.body;

    if (!hostelId || !amountGHS || amountGHS <= 0) {
      return res.status(400).json({ message: "hostelId and amountGHS required." });
    }

    // Load hostel and its owner
    const hostel = await Hostel.findById(hostelId).populate("ownerId");
    if (!hostel) return res.status(404).json({ message: "Hostel not found." });

    const host = hostel.ownerId;

    // Warn if host hasn't set up payout — payment still works but transfer will be queued
    const payoutReady = host?.payoutSetupComplete && host?.paystackRecipientCode;

    // Calculate split: Paystack fee first, then platform/host split
    const gatewayFee = parseFloat((amountGHS * PAYSTACK_GATEWAY_FEE_PERCENT / 100).toFixed(2));
    const netAfterGateway = parseFloat((amountGHS - gatewayFee).toFixed(2));
    const platformFee = parseFloat((netAfterGateway * PLATFORM_FEE_PERCENT / 100).toFixed(2));
    const hostPayout = parseFloat((netAfterGateway - platformFee).toFixed(2));

    // Generate a unique reference
    const reference = `HH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Initialize the Paystack transaction
    const txData = await paystack.initializeTransaction({
      email:       req.user.email,
      amountGHS,
      reference,
      callbackUrl: `${process.env.FRONTEND_URL}/payment/callback?ref=${reference}`,
      metadata: {
        hostelId:         hostelId.toString(),
        hostelName:       hostel.name,
        hostId:           host._id.toString(),
        roomId:           roomId?.toString() || "",
        roomName:         roomName || "",
        studentId:        req.user.id,
        bookingId:        bookingId?.toString() || "",
        gatewayFee:       gatewayFee.toString(),
        netAfterGateway:  netAfterGateway.toString(),
        platformFee:      platformFee.toString(),
        hostPayout:       hostPayout.toString(),
        paystackRecipientCode: host?.paystackRecipientCode || "",
        custom_fields: [
          { display_name:"Hostel",   variable_name:"hostel_name", value: hostel.name },
          { display_name:"Room",     variable_name:"room_name",   value: roomName || "—" },
          { display_name:"Your Cut", variable_name:"platform_fee",value: `GH₵${platformFee}` },
        ],
      },
    });

    // Create a pending Payment record in DB
    await Payment.create({
      reference,
      studentId:         req.user.id,
      hostelId,
      hostId:            host._id,
      bookingId:         bookingId || undefined,
      roomName:          roomName || "",
      amountPaid:        amountGHS,
      amountPaidPesewas: Math.round(amountGHS * 100),
      gatewayFeePercent: PAYSTACK_GATEWAY_FEE_PERCENT,
      gatewayFee,
      netAfterGateway,
      platformFeePercent:PLATFORM_FEE_PERCENT,
      platformFee,
      hostPayout,
      paystackChargeStatus: "pending",
      currency: "GHS",
    });

    res.json({
      authorizationUrl: txData.authorization_url,
      accessCode:       txData.access_code,
      reference,
      payoutReady,  // frontend can warn if host hasn't set up payout
      breakdown: {
        totalPaid: amountGHS,
        gatewayFee: { percent: PAYSTACK_GATEWAY_FEE_PERCENT, amount: gatewayFee },
        netAfterGateway,
        platformFee: { percent: PLATFORM_FEE_PERCENT, amount: platformFee },
        hostPayout: { amount: hostPayout },
      },
    });

  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Called after Paystack popup/redirect completes.
// Verifies the charge, then automatically transfers 95% to the host.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/verify", protect, async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: "reference required." });

    // Find our pending payment record
    const payment = await Payment.findOne({ reference });
    if (!payment) return res.status(404).json({ message: "Payment record not found." });

    // Don't double-process
    if (payment.paystackChargeStatus === "success") {
      return res.json({ message: "Payment already verified.", payment });
    }

    // ── Step 1: Verify with Paystack that charge succeeded ─────────────────
    const txData = await paystack.verifyTransaction(reference);

    if (txData.status !== "success") {
      payment.paystackChargeStatus = "failed";
      payment.chargeFailureReason = txData.gateway_response || txData.status || "Payment failed";
      payment.paystackGatewayResponse = txData.gateway_response || "";
      payment.paystackChannel = txData.channel || "";
      await payment.save();
      if (payment.bookingId) {
        await Booking.findByIdAndUpdate(payment.bookingId, {
          paymentStatus: "failed",
          paymentFailureReason: payment.chargeFailureReason,
          paymentRef: reference,
        });
      }
      return res.status(400).json({ message: `Payment not successful. Status: ${txData.status}` });
    }

    // Confirm the amount matches (prevent tampering)
    const paidPesewas = txData.amount;
    if (paidPesewas !== payment.amountPaidPesewas) {
      return res.status(400).json({
        message: `Amount mismatch. Expected ${payment.amountPaidPesewas} pesewas, got ${paidPesewas}.`,
      });
    }

    // Mark charge as successful
    payment.paystackChargeStatus = "success";
    payment.paystackGatewayResponse = txData.gateway_response || "";
    payment.paystackChannel = txData.channel || "";
    payment.paidAt = txData.paid_at ? new Date(txData.paid_at) : new Date();
    payment.chargeFailureReason = "";
    await payment.save();

    // Update booking to "paid" if linked
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        status: "paid",
        paymentRef: reference,
        amount: payment.amountPaid,
        currency: payment.currency || "GHS",
        paymentStatus: "success",
        paymentFailureReason: "",
      });
    }

    // ── Step 2: Transfer 95% to host ───────────────────────────────────────
    const host = await Host.findById(payment.hostId).select(
      "paystackRecipientCode payoutSetupComplete fullName"
    );

    if (!host?.payoutSetupComplete || !host?.paystackRecipientCode) {
      // Host hasn't set up payout yet — payment recorded, transfer queued manually
      payment.transferStatus = "pending";
      await payment.save();

      return res.json({
        message: "Payment verified. Host payout is pending — host needs to set up their payout account.",
        settled: false,
        payment,
      });
    }

    // Initiate transfer — this takes money FROM your Paystack balance and sends to host
    const transferRef = `HH-TRF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const transferData = await paystack.initiateTransfer({
      amountGHS:      payment.hostPayout,
      recipientCode:  host.paystackRecipientCode,    // "RCP_xxxxxxxxxxxx" stored in DB
      reference:      transferRef,
      reason: `HostelHub payout — ${payment.roomName || "Room booking"} at ${
        (await Hostel.findById(payment.hostelId).select("name"))?.name || "hostel"
      }`,
    });

    // Update payment record with transfer details
    payment.transferReference = transferRef;
    payment.transferCode      = transferData.transfer_code;   // "TRF_xxxxxxxx"
    payment.transferStatus    = transferData.status;          // usually "pending" initially
    if (transferData.status === "success") {
      payment.settled   = true;
      payment.settledAt = new Date();
    }
    await payment.save();

    res.json({
      message: "Payment verified and host payout initiated.",
      settled:   transferData.status === "success",
      breakdown: {
        totalPaid: payment.amountPaid,
        gatewayFee: { percent: payment.gatewayFeePercent || PAYSTACK_GATEWAY_FEE_PERCENT, amount: payment.gatewayFee || 0 },
        netAfterGateway: payment.netAfterGateway || payment.amountPaid,
        platformFee: { percent: PLATFORM_FEE_PERCENT, amount: payment.platformFee },
        hostPayout: { amount: payment.hostPayout, transferCode: transferData.transfer_code },
      },
      payment,
    });

  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Paystack calls this automatically for both charge and transfer events.
// Add this URL in Paystack dashboard: Settings → Webhooks
// URL: https://your-backend.com/api/payments/webhook
//
// ⚠️  This route uses express.raw() — DO NOT add express.json() before it
//     in your server.js. Mount it BEFORE the global json middleware.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // ── Always respond 200 immediately so Paystack doesn't retry
    res.sendStatus(200);

    try {
      // Verify the webhook came from Paystack
      const signature = req.headers["x-paystack-signature"];
      if (!paystack.verifyWebhookSignature(req.body, signature)) {
        console.warn("⚠️  Invalid Paystack webhook signature — ignored");
        return;
      }

      const event = JSON.parse(req.body.toString());
      console.log(`📦 Paystack webhook: ${event.event}`);

      // ── EVENT: charge.success ─────────────────────────────────────────
      // Money has hit your Paystack account from a student payment.
      if (event.event === "charge.success") {
        const { reference, amount, metadata } = event.data;
        const payment = await Payment.findOne({ reference });
        if (!payment || payment.paystackChargeStatus === "success") return;

        payment.paystackChargeStatus = "success";
        payment.paystackGatewayResponse = event.data.gateway_response || "";
        payment.paystackChannel = event.data.channel || "";
        payment.paidAt = event.data.paid_at ? new Date(event.data.paid_at) : new Date();
        payment.chargeFailureReason = "";
        await payment.save();

        // If booking exists, mark as paid
        if (payment.bookingId) {
          await Booking.findByIdAndUpdate(payment.bookingId, {
            status: "paid",
            paymentRef: reference,
            amount: payment.amountPaid,
            currency: payment.currency || "GHS",
            paymentStatus: "success",
            paymentFailureReason: "",
          });
        }

        // Attempt transfer if host has payout set up
        const host = await Host.findById(payment.hostId).select(
          "paystackRecipientCode payoutSetupComplete"
        );
        if (host?.payoutSetupComplete && host?.paystackRecipientCode) {
          try {
            const transferRef = `HH-TRF-WH-${Date.now()}`;
            const hostel = await Hostel.findById(payment.hostelId).select("name");
            const transferData = await paystack.initiateTransfer({
              amountGHS:     payment.hostPayout,
              recipientCode: host.paystackRecipientCode,
              reference:     transferRef,
              reason:        `HostelHub payout — ${hostel?.name || "hostel booking"}`,
            });
            payment.transferReference = transferRef;
            payment.transferCode      = transferData.transfer_code;
            payment.transferStatus    = transferData.status;
            if (transferData.status === "success") {
              payment.settled   = true;
              payment.settledAt = new Date();
            }
            await payment.save();
            console.log(`✅ Transfer initiated: ${transferData.transfer_code} — GH₵${payment.hostPayout} to host`);
          } catch (transferErr) {
            console.error("❌ Transfer failed:", transferErr.message);
            payment.transferStatus = "failed";
            payment.transferFailureReason = transferErr.message || "Transfer initiation failed";
            await payment.save();
          }
        }
      }

      // ── EVENT: charge.failed ──────────────────────────────────────────
      if (event.event === "charge.failed") {
        const { reference, gateway_response, channel } = event.data;
        const payment = await Payment.findOne({ reference });
        if (!payment) return;
        payment.paystackChargeStatus = "failed";
        payment.paystackGatewayResponse = gateway_response || "";
        payment.paystackChannel = channel || "";
        payment.chargeFailureReason = gateway_response || "Payment failed";
        await payment.save();
        if (payment.bookingId) {
          await Booking.findByIdAndUpdate(payment.bookingId, {
            paymentStatus: "failed",
            paymentFailureReason: payment.chargeFailureReason,
            paymentRef: reference,
          });
        }
      }

      // ── EVENT: transfer.success ───────────────────────────────────────
      // Paystack confirmed the money reached the host's bank/MoMo.
      if (event.event === "transfer.success") {
        const { reference, transfer_code } = event.data;
        await Payment.findOneAndUpdate(
          { transferReference: reference },
          { transferStatus: "success", settled: true, settledAt: new Date() }
        );
        console.log(`✅ Transfer confirmed: ${transfer_code}`);
      }

      // ── EVENT: transfer.failed ────────────────────────────────────────
      // Transfer to host failed (wrong account, network issue, etc.)
      if (event.event === "transfer.failed") {
        const { reference, failure_reason } = event.data;
        await Payment.findOneAndUpdate(
          { transferReference: reference },
          { transferStatus: "failed", transferFailureReason: failure_reason || "Transfer failed" }
        );
        console.error(`❌ Transfer failed: ${reference} — ${failure_reason}`);
        // TODO: send notification to admin and host
      }

      // ── EVENT: transfer.reversed ──────────────────────────────────────
      // Transfer was reversed (money returned to your Paystack balance).
      if (event.event === "transfer.reversed") {
        const { reference } = event.data;
        await Payment.findOneAndUpdate(
          { transferReference: reference },
          { transferStatus: "reversed", settled: false }
        );
        console.warn(`⚠️  Transfer reversed: ${reference}`);
      }

    } catch (err) {
      console.error("Webhook processing error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/history
// Student sees their own payment history
// ─────────────────────────────────────────────────────────────────────────────
router.get("/history", protect, restrictTo("student"), async (req, res, next) => {
  try {
    const payments = await Payment.find({ studentId: req.user.id, paystackChargeStatus: "success" })
      .populate("hostelId", "name location")
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/host-earnings
// Host sees their earnings and transfer statuses
// ─────────────────────────────────────────────────────────────────────────────
router.get("/host-earnings", protect, restrictTo("host"), async (req, res, next) => {
  try {
    const payments = await Payment.find({
      hostId: req.user.id,
      paystackChargeStatus: "success",
    })
      .populate("studentId", "firstName lastName")
      .populate("hostelId", "name")
      .sort({ createdAt: -1 });

    const totalEarned  = payments.filter(p => p.settled).reduce((s, p) => s + p.hostPayout, 0);
    const totalPending = payments.filter(p => !p.settled).reduce((s, p) => s + p.hostPayout, 0);

    res.json({ payments, totalEarned, totalPending });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/retry-transfer/:paymentId
// Admin manually retries a failed transfer
// ─────────────────────────────────────────────────────────────────────────────
router.post("/retry-transfer/:paymentId", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found." });
    if (payment.settled) return res.status(400).json({ message: "Already settled." });
    if (payment.paystackChargeStatus !== "success") return res.status(400).json({ message: "Charge not verified." });

    const host = await Host.findById(payment.hostId).select("paystackRecipientCode payoutSetupComplete fullName");
    if (!host?.paystackRecipientCode) return res.status(400).json({ message: "Host has no payout account." });

    const hostel = await Hostel.findById(payment.hostelId).select("name");
    const transferRef = `HH-TRF-RETRY-${Date.now()}`;

    const transferData = await paystack.initiateTransfer({
      amountGHS:     payment.hostPayout,
      recipientCode: host.paystackRecipientCode,
      reference:     transferRef,
      reason:        `HostelHub retry payout — ${hostel?.name}`,
    });

    payment.transferReference = transferRef;
    payment.transferCode      = transferData.transfer_code;
    payment.transferStatus    = transferData.status;
    if (transferData.status === "success") { payment.settled = true; payment.settledAt = new Date(); }
    await payment.save();

    res.json({ message: "Transfer retried.", transferData });
  } catch (err) { next(err); }
});

module.exports = router;