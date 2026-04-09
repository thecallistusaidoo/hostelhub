// This replaces the payout section in host.routes.js
// Add this to your existing host.routes.js file

const express = require("express");
const router = express.Router();
const { Host } = require("../models");
const { protect, restrictTo } = require("../middleware");
const paystack = require("../utils/paystack");

// All host payout routes require auth
router.use(protect, restrictTo("host"));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hosts/payout-status
// Returns whether this host has a Paystack recipient set up
// ─────────────────────────────────────────────────────────────────────────────
router.get("/payout-status", async (req, res, next) => {
  try {
    const host = await Host.findById(req.user.id).select(
      "payoutMethod bankName accountName accountNumber momoNetwork momoNumber paystackRecipientCode payoutSetupComplete"
    );
    if (!host) return res.status(404).json({ message: "Host not found." });

    res.json({
      payoutSetupComplete: host.payoutSetupComplete,
      paystackRecipientCode: host.paystackRecipientCode || null,
      payoutMethod: host.payoutMethod,
      // Return masked account info for display
      accountSummary: host.payoutSetupComplete
        ? host.payoutMethod === "bank"
          ? `${host.bankName} — ${host.accountName} (${host.accountNumber?.slice(-4).padStart(host.accountNumber.length, "*")})`
          : `${host.momoNetwork} — ${host.accountName} (${host.momoNumber?.slice(-4).padStart(host.momoNumber.length, "*")})`
        : null,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hosts/banks
// Returns list of supported Ghana banks from Paystack (live data)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/banks", async (req, res, next) => {
  try {
    const banks = await paystack.listBanks();
    res.json({ banks });
  } catch (err) {
    // Fallback to hardcoded list if API call fails
    res.json({
      banks: Object.entries(paystack.GH_BANKS).map(([name, code]) => ({ name, code })),
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/hosts/payout/verify-account
// Verifies a bank account number and returns the account name from Paystack.
// Call this when the host enters their account number so they can confirm
// the name before saving.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/payout/verify-account", async (req, res, next) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ message: "accountNumber and bankCode required." });
    }

    const accountData = await paystack.verifyBankAccount(accountNumber, bankCode);
    // Returns { account_number, account_name, bank_id }
    res.json({
      accountName:   accountData.account_name,
      accountNumber: accountData.account_number,
    });
  } catch (err) {
    // Paystack throws error if account not found
    res.status(400).json({ message: "Could not verify account. Check the account number and bank." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/hosts/payout/setup
// Host submits their payout details → we create a Paystack Transfer Recipient
// → store the recipientCode in the database.
//
// This is the KEY endpoint. After this runs, the host has a recipientCode
// and all future payouts go directly to them automatically.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/payout/setup", async (req, res, next) => {
  try {
    const host = await Host.findById(req.user.id);
    if (!host) return res.status(404).json({ message: "Host not found." });

    const { payoutMethod, bankName, bankCode, accountNumber, accountName, momoNetwork, momoNumber } = req.body;

    if (!payoutMethod) return res.status(400).json({ message: "payoutMethod required (bank or momo)." });

    let recipientData;

    if (payoutMethod === "bank") {
      if (!bankCode || !accountNumber || !accountName) {
        return res.status(400).json({ message: "bankCode, accountNumber, and accountName required for bank payout." });
      }

      // Create Paystack recipient for bank account
      recipientData = await paystack.createBankRecipient({
        accountName,
        accountNumber,
        bankCode,
        hostEmail: host.email,
        description: `HostelHub — ${host.fullName}`,
      });

      // Save bank details to host document
      host.payoutMethod   = "bank";
      host.bankName       = bankName || "";
      host.bankCode       = bankCode;
      host.accountNumber  = accountNumber;
      host.accountName    = accountName;

    } else if (payoutMethod === "momo") {
      if (!momoNetwork || !momoNumber || !accountName) {
        return res.status(400).json({ message: "momoNetwork, momoNumber, and accountName required for MoMo payout." });
      }

      // Create Paystack recipient for Mobile Money
      recipientData = await paystack.createMoMoRecipient({
        accountName,
        momoNumber,
        momoNetwork,
        hostEmail: host.email,
        description: `HostelHub — ${host.fullName}`,
      });

      // Save MoMo details
      host.payoutMethod  = "momo";
      host.momoNetwork   = momoNetwork;
      host.momoNumber    = momoNumber;
      host.accountName   = accountName;

    } else {
      return res.status(400).json({ message: "payoutMethod must be bank or momo." });
    }

    // ── Store the Paystack recipient code ──────────────────────────────────
    // This is the permanent code used for all future transfers to this host.
    host.paystackRecipientCode = recipientData.recipient_code;  // "RCP_xxxxxxxxxxxx"
    host.paystackRecipientId   = recipientData.id;
    host.payoutSetupComplete   = true;

    await host.save({ validateBeforeSave: false });

    res.json({
      message: "Payout account set up successfully. You will now receive automatic payouts.",
      recipientCode: host.paystackRecipientCode,
      payoutMethod,
    });

  } catch (err) {
    // Paystack API errors have descriptive messages
    if (err.message?.includes("Paystack")) {
      return res.status(400).json({ message: `Paystack error: ${err.message}` });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/hosts/payout/setup
// Host wants to change their payout account — remove current recipient
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/payout/setup", async (req, res, next) => {
  try {
    await Host.findByIdAndUpdate(req.user.id, {
      $set: {
        payoutMethod: "",
        bankName: "", bankCode: "", accountNumber: "", accountName: "",
        momoNetwork: "", momoNumber: "",
        paystackRecipientCode: "",
        paystackRecipientId: null,
        payoutSetupComplete: false,
      },
    });
    res.json({ message: "Payout account removed. Please set up a new one." });
  } catch (err) { next(err); }
});

module.exports = router;