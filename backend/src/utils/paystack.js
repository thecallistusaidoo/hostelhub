// src/utils/paystack.js
// All Paystack API calls wrapped as clean async functions.
// Uses Node's built-in https module — no extra dependencies needed.

const https = require("https");

const SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE   = "api.paystack.co";

// ── Core HTTPS helper ─────────────────────────────────────────────────────────
function paystackRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE,
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${SECRET}`,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === false) {
            reject(new Error(parsed.message || "Paystack error"));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error("Invalid Paystack response"));
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── BANK CODES for Ghana (Paystack) ─────────────────────────────────────────
// These are the official Paystack bank codes for Ghana.
// Used when creating a transfer recipient with type "ghipss" (bank account).
const GH_BANKS = {
  "GCB Bank":                   "030100",
  "Absa Bank":                  "300304",
  "Ecobank":                    "130100",
  "Stanbic Bank":               "190100",
  "Fidelity Bank":              "240100",
  "Access Bank":                "280100",
  "Agricultural Development Bank": "080100",
  "Cal Bank":                   "140100",
  "Consolidated Bank":          "510100",
  "National Investment Bank":   "360100",
  "Republic Bank":              "270100",
  "Zenith Bank":                "320100",
};

// Paystack currency code for Ghana
const GHANA_CURRENCY = "GHS";

// ── 1. VERIFY ACCOUNT NAME (Bank) ────────────────────────────────────────────
// Before creating a recipient, verify the account number matches the account name.
// This prevents sending money to wrong accounts.
async function verifyBankAccount(accountNumber, bankCode) {
  const res = await paystackRequest(
    "GET",
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
  // Returns: { account_number, account_name, bank_id }
  return res.data;
}

// ── 2. CREATE TRANSFER RECIPIENT (Bank Account) ───────────────────────────────
// Creates a Paystack recipient object for a Ghana bank account.
// recipientCode is stored in your DB and used every time you transfer to this host.
async function createBankRecipient({ accountName, accountNumber, bankCode, hostEmail, description }) {
  const res = await paystackRequest("POST", "/transferrecipient", {
    type:           "ghipss",          // Ghana Inter-bank Payment and Settlement System
    name:           accountName,
    account_number: accountNumber,
    bank_code:      bankCode,
    currency:       GHANA_CURRENCY,
    description:    description || `HostelHub payout — ${accountName}`,
    metadata: {
      hostEmail,
      platform: "HostelHub",
    },
  });
  // Returns: { recipient_code: "RCP_xxxxxxxxxxxx", id: 12345678, ... }
  return res.data;
}

// ── 3. CREATE TRANSFER RECIPIENT (Mobile Money) ───────────────────────────────
// For MTN MoMo, Vodafone Cash, AirtelTigo Money.
async function createMoMoRecipient({ accountName, momoNumber, momoNetwork, hostEmail, description }) {
  // Paystack type codes for Ghana MoMo
  const typeMap = {
    "mtn":       "mobile_money",
    "vodafone":  "mobile_money",
    "airteltigo":"mobile_money",
  };
  // Paystack bank codes for Ghana MoMo providers
  const bankCodeMap = {
    "mtn":        "MTN",
    "vodafone":   "VOD",
    "airteltigo": "ATL",
  };

  const normalizedNetwork = momoNetwork.toLowerCase().replace(/[^a-z]/g, "");
  const bankCode = bankCodeMap[normalizedNetwork] || bankCodeMap["mtn"];

  const res = await paystackRequest("POST", "/transferrecipient", {
    type:           "mobile_money",
    name:           accountName,
    account_number: momoNumber,
    bank_code:      bankCode,
    currency:       GHANA_CURRENCY,
    description:    description || `HostelHub payout — ${accountName}`,
    metadata: {
      hostEmail,
      platform: "HostelHub",
    },
  });
  return res.data;
}

// ── 4. INITIALIZE TRANSACTION (Student pays) ─────────────────────────────────
// Generates a Paystack checkout URL. Student is redirected here to pay.
// Full amount goes into YOUR Paystack account first.
async function initializeTransaction({ email, amountGHS, reference, metadata, callbackUrl }) {
  const res = await paystackRequest("POST", "/transaction/initialize", {
    email,
    amount:        Math.round(amountGHS * 100),   // convert GH₵ to pesewas
    currency:      GHANA_CURRENCY,
    reference,
    callback_url:  callbackUrl,
    metadata,
  });
  // Returns: { authorization_url, access_code, reference }
  return res.data;
}

// ── 5. VERIFY TRANSACTION (after student pays) ────────────────────────────────
// Called after student completes payment. Confirms money arrived.
async function verifyTransaction(reference) {
  const res = await paystackRequest("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
  // Returns full transaction object. Check res.data.status === "success"
  return res.data;
}

// ── 5b. LIST TRANSACTIONS ──────────────────────────────────────────────────────
async function listTransactions({ page = 1, perPage = 50 } = {}) {
  const res = await paystackRequest(
    "GET",
    `/transaction?perPage=${Number(perPage)}&page=${Number(page)}`
  );
  return res.data || [];
}

// ── 6. INITIATE TRANSFER (send 95% to host) ───────────────────────────────────
// Sends money from YOUR Paystack balance to the host's saved recipient.
// This is called AFTER you've verified the student's payment.
// The 5% platform fee stays in your balance automatically.
async function initiateTransfer({ amountGHS, recipientCode, reference, reason }) {
  const res = await paystackRequest("POST", "/transfer", {
    source:     "balance",                         // deduct from your Paystack balance
    amount:     Math.round(amountGHS * 100),       // pesewas
    recipient:  recipientCode,                     // "RCP_xxxxxxxxxxxx" stored in DB
    reason:     reason || "HostelHub host payout",
    currency:   GHANA_CURRENCY,
    reference,
  });
  // Returns: { transfer_code: "TRF_xxxxx", reference, status: "pending" }
  return res.data;
}

// ── 7. VERIFY TRANSFER STATUS ─────────────────────────────────────────────────
async function verifyTransfer(transferCode) {
  const res = await paystackRequest("GET", `/transfer/${transferCode}`);
  return res.data;
}

// ── 8. LIST BANKS (Ghana) ─────────────────────────────────────────────────────
// Fetch live list of supported banks from Paystack (useful for frontend dropdowns)
async function listBanks() {
  const res = await paystackRequest("GET", "/bank?currency=GHS&country=ghana");
  return res.data; // array of { name, code, ... }
}

// ── 9. VERIFY WEBHOOK SIGNATURE ───────────────────────────────────────────────
// Paystack signs every webhook with HMAC-SHA512 of your secret key.
// Always verify before processing.
function verifyWebhookSignature(rawBody, signatureHeader) {
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha512", SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signatureHeader;
}

module.exports = {
  GH_BANKS,
  verifyBankAccount,
  createBankRecipient,
  createMoMoRecipient,
  initializeTransaction,
  verifyTransaction,
  listTransactions,
  initiateTransfer,
  verifyTransfer,
  listBanks,
  verifyWebhookSignature,
};