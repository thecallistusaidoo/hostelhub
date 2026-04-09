// app/host/dashboard/_PaymentsTab.jsx
// Drop this component into the host dashboard's payments tab.
// It handles the full payout setup flow:
//   1. Host selects bank or MoMo
//   2. Enters account details
//   3. For bank: we verify the account name live via Paystack
//   4. Host confirms and submits
//   5. Backend creates Paystack recipient and stores the code
"use client";
import { useState, useEffect } from "react";
import { host as hostAPI } from "../../lib/api";

// API calls specific to payout
async function callAPI(path, method = "GET", body = null) {
  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const MOMO_NETWORKS = [
  { value: "mtn",         label: "MTN MoMo",          color: "#FFD700" },
  { value: "vodafone",    label: "Vodafone Cash",      color: "#E60000" },
  { value: "airteltigo", label: "AirtelTigo Money",   color: "#0072BC" },
];
const PAYSTACK_GATEWAY_FEE_PERCENT = 1.95;
const PLATFORM_FEE_PERCENT = 5;

export default function PaymentsTab({ hostProfile, reload }) {
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [banks, setBanks] = useState([]);
  const [method, setMethod] = useState("bank");
  const [form, setForm] = useState({
    bankCode: "", bankName: "", accountNumber: "", accountName: "",
    momoNetwork: "", momoNumber: "", momoAccountName: "",
  });
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [earnings, setEarnings] = useState(null);

  const showMsg = (m, ok = true) => { setMsg({ m, ok }); setTimeout(() => setMsg(null), 5000); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Load payout status and bank list
  useEffect(() => {
    callAPI("/api/hosts/payout-status")
      .then(d => setPayoutStatus(d))
      .catch(() => {});

    callAPI("/api/hosts/banks")
      .then(d => setBanks(d.banks || []))
      .catch(() => setBanks(Object.entries({
        "GCB Bank":"030100","Absa Bank":"300304","Ecobank":"130100",
        "Stanbic Bank":"190100","Fidelity Bank":"240100","Access Bank":"280100",
        "Agricultural Development Bank":"080100","Cal Bank":"140100",
        "Consolidated Bank":"510100","National Investment Bank":"360100",
      }).map(([name,code]) => ({ name, code }))));

    callAPI("/api/payments/host-earnings")
      .then(d => setEarnings(d))
      .catch(() => {});
  }, []);

  // Live account name verification for bank accounts
  const verifyAccount = async () => {
    if (!form.accountNumber || !form.bankCode) {
      showMsg("Enter account number and select a bank first.", false);
      return;
    }
    setVerifying(true);
    setVerifiedName("");
    try {
      const data = await callAPI("/api/hosts/payout/verify-account", "POST", {
        accountNumber: form.accountNumber,
        bankCode: form.bankCode,
      });
      setVerifiedName(data.accountName);
      set("accountName", data.accountName);
      showMsg(`✓ Account verified: ${data.accountName}`);
    } catch (e) {
      showMsg(e.message || "Could not verify account. Check the number and bank.", false);
    } finally {
      setVerifying(false);
    }
  };

  // Submit payout setup — creates Paystack recipient on backend
  const handleSetup = async () => {
    if (method === "bank") {
      if (!form.bankCode) { showMsg("Please select a bank.", false); return; }
      if (!form.accountNumber) { showMsg("Please enter your account number.", false); return; }
      if (!form.accountName && !verifiedName) { showMsg("Please verify your account first.", false); return; }
    } else {
      if (!form.momoNetwork) { showMsg("Please select your mobile network.", false); return; }
      if (!form.momoNumber || form.momoNumber.length < 10) { showMsg("Please enter a valid MoMo number.", false); return; }
      if (!form.momoAccountName) { showMsg("Please enter the name registered on your MoMo account.", false); return; }
    }

    setSaving(true);
    try {
      const body = method === "bank"
        ? { payoutMethod:"bank", bankName:form.bankName, bankCode:form.bankCode,
            accountNumber:form.accountNumber, accountName:form.accountName || verifiedName }
        : { payoutMethod:"momo", momoNetwork:form.momoNetwork,
            momoNumber:form.momoNumber, accountName:form.momoAccountName };

      const data = await callAPI("/api/hosts/payout/setup", "POST", body);
      showMsg("✓ Payout account set up! You will now receive automatic payouts after each booking.");

      // Reload status
      const updated = await callAPI("/api/hosts/payout-status");
      setPayoutStatus(updated);
      setEditing(false);
      reload?.();
    } catch (e) {
      showMsg(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove your payout account? You won't receive automatic payouts until you set it up again.")) return;
    try {
      await callAPI("/api/hosts/payout/setup", "DELETE");
      const updated = await callAPI("/api/hosts/payout-status");
      setPayoutStatus(updated);
      setEditing(false);
      showMsg("Payout account removed.");
    } catch (e) { showMsg(e.message, false); }
  };

  const totalEarned  = earnings?.totalEarned  || 0;
  const totalPending = earnings?.totalPending || 0;
  const payments     = earnings?.payments     || [];

  return (
    <div className="space-y-5">
      {/* Toast */}
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {msg.m}
        </div>
      )}

      {/* Earnings summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { l:"Total Earned (After fees)", v:`GH₵${totalEarned.toLocaleString()}`,  icon:"💰", c:"text-emerald-600" },
          { l:"Pending Payout",     v:`GH₵${totalPending.toLocaleString()}`, icon:"⏳", c:"text-amber-600" },
          { l:"Total Transactions", v:payments.length,                        icon:"📊", c:"text-gray-800" },
        ].map(s => (
          <div key={s.l} className="glass rounded-2xl p-5">
            <span style={{fontSize:"22px"}}>{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-2 ${s.c}`}>{s.v}</p>
            <p className="text-xs text-[--text-muted] mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Fee explanation */}
      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
          <span className="text-white text-lg">ℹ️</span>
        </div>
        <div>
          <p className="font-bold text-[--text-primary] text-sm">How Payments Work</p>
          <p className="text-xs text-[--text-muted] mt-1 leading-relaxed">
            Students pay the full amount through Paystack. The money arrives in the HostelHub Paystack account.
            Paystack first deducts <strong className="text-[--text-primary]">{PAYSTACK_GATEWAY_FEE_PERCENT}%</strong>.
            Then HostelHub takes <strong className="text-[--text-primary]">{PLATFORM_FEE_PERCENT}%</strong> from the remaining amount,
            and the rest is automatically transferred to your bank or MoMo account after each verified payment.
            No action needed from you — set up your account once and get paid automatically.
          </p>
          <p className="text-xs text-[--text-muted] mt-2">
            Example: Student pays <strong className="text-[--text-primary]">GH₵3,000</strong> →
            Paystack fee <strong className="text-amber-600">GH₵58.50</strong> →
            platform fee <strong className="text-emerald-600">GH₵147.08</strong> →
            host payout <strong className="text-[#1E40AF]">GH₵2,794.42</strong>
          </p>
        </div>
      </div>

      {/* Payout account setup */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/20 dark:border-white/08 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[--text-primary]">💳 Payout Account</h2>
            <p className="text-xs text-[--text-muted] mt-0.5">Where should we send your payout after Paystack and platform fees?</p>
          </div>
          {payoutStatus?.payoutSetupComplete && !editing && (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(true)}
                className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold border border-[#1E40AF]/30 px-3 py-1.5 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition">
                ✏️ Change
              </button>
              <button onClick={handleRemove}
                className="text-xs text-red-400 font-semibold hover:text-red-600 transition">
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="p-5">
          {/* Already set up */}
          {payoutStatus?.payoutSetupComplete && !editing ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[--text-primary] text-sm">Payout account active ✓</p>
                <p className="text-xs text-[--text-muted] mt-0.5">{payoutStatus.accountSummary}</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Paystack Recipient: <span className="font-mono">{payoutStatus.paystackRecipientCode}</span>
                </p>
              </div>
            </div>
          ) : (
            /* Setup form */
            <div className="space-y-4">
              {/* Method toggle */}
              <div>
                <label className="block text-xs font-semibold text-[--text-secondary] mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[["bank","🏦 Bank Transfer"],["momo","📱 Mobile Money"]].map(([v,l]) => (
                    <button key={v} onClick={() => { setMethod(v); setVerifiedName(""); }}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        method === v
                          ? "text-white border-[#1E40AF]"
                          : "border-white/30 dark:border-white/10 text-[--text-secondary] hover:border-[#1E40AF]/50"
                      }`}
                      style={method === v ? {background:"linear-gradient(135deg,#1E40AF,#2563EB)"} : {}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank form */}
              {method === "bank" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Select Bank *</label>
                    <select className="input-field"
                      value={form.bankCode}
                      onChange={e => {
                        const selected = banks.find(b => b.code === e.target.value);
                        set("bankCode", e.target.value);
                        set("bankName", selected?.name || "");
                        setVerifiedName("");
                        set("accountName", "");
                      }}>
                      <option value="">Choose your bank...</option>
                      {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Account Number *</label>
                    <div className="flex gap-2">
                      <input className="input-field flex-1"
                        placeholder="Enter your account number"
                        value={form.accountNumber}
                        onChange={e => { set("accountNumber", e.target.value); setVerifiedName(""); set("accountName",""); }}
                        maxLength={20}/>
                      <button onClick={verifyAccount} disabled={verifying || !form.bankCode || !form.accountNumber}
                        className="flex-shrink-0 btn-primary disabled:opacity-50 text-xs px-4">
                        {verifying ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Verifying
                          </span>
                        ) : "Verify"}
                      </button>
                    </div>
                  </div>

                  {/* Verified account name */}
                  {verifiedName && (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                      <div>
                        <p className="text-xs text-emerald-600 font-semibold">Account verified</p>
                        <p className="text-sm font-bold text-[--text-primary]">{verifiedName}</p>
                      </div>
                    </div>
                  )}

                  {!verifiedName && (
                    <p className="text-xs text-[--text-muted]">
                      Click "Verify" to confirm your account name before saving.
                    </p>
                  )}
                </div>
              )}

              {/* MoMo form */}
              {method === "momo" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-2">Mobile Network *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {MOMO_NETWORKS.map(n => (
                        <button key={n.value} onClick={() => set("momoNetwork", n.value)}
                          className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                            form.momoNetwork === n.value
                              ? "text-white border-transparent"
                              : "border-white/30 dark:border-white/10 text-[--text-secondary] hover:border-gray-300"
                          }`}
                          style={form.momoNetwork === n.value ? { background: n.color, borderColor: n.color } : {}}>
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-1">MoMo Number *</label>
                    <input className="input-field" placeholder="e.g. 0244xxxxxx" type="tel"
                      value={form.momoNumber} onChange={e => set("momoNumber", e.target.value)} maxLength={12}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Name on MoMo Account *</label>
                    <input className="input-field" placeholder="Full name as registered on your MoMo"
                      value={form.momoAccountName} onChange={e => set("momoAccountName", e.target.value)}/>
                    <p className="text-xs text-[--text-muted] mt-1">Must match the name registered with your mobile network.</p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                {editing && (
                  <button onClick={() => setEditing(false)}
                    className="flex-1 btn-ghost text-sm py-3">
                    Cancel
                  </button>
                )}
                <button onClick={handleSetup} disabled={saving}
                  className="flex-1 btn-primary text-sm py-3 disabled:opacity-60">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Setting up...
                    </span>
                  ) : "Save Payout Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/20 dark:border-white/08">
          <h2 className="font-bold text-[--text-primary]">Transaction History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-10 text-center text-[--text-muted]">
            <span className="text-4xl block mb-3">💰</span>
            <p className="font-semibold text-[--text-secondary]">No payments yet</p>
            <p className="text-sm mt-1">Payments from students will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/30 dark:bg-black/20 border-b border-white/20">
                <tr>
                  {["Student","Room","Amount Paid","Paystack Fee","Platform Fee","Your Payout","Date","Status"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[--text-muted] px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/05">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-white/20 dark:hover:bg-white/05 transition">
                    <td className="px-4 py-3 font-semibold text-[--text-primary]">
                      {p.studentId?.firstName} {p.studentId?.lastName}
                    </td>
                    <td className="px-4 py-3 text-[--text-secondary]">{p.roomName || p.hostelId?.name}</td>
                    <td className="px-4 py-3 font-bold text-[--text-primary]">GH₵{p.amountPaid?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-amber-600 font-semibold">GH₵{(p.gatewayFee || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-[--text-muted]">GH₵{p.platformFee?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">GH₵{p.hostPayout?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[--text-muted]">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {p.settled ? (
                        <span className="status-approved">✓ Paid out</span>
                      ) : p.transferStatus === "failed" ? (
                        <span className="status-rejected">✗ Failed</span>
                      ) : (
                        <span className="status-pending">⏳ Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}