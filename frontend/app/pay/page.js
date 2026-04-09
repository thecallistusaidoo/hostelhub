"use client";
export const dynamic = "force-dynamic";
// app/pay/page.js
// Student payment page powered by Paystack
// Install: npm install @paystack/inline-js (or use their CDN script)
//
// URL params: /pay?hostelId=1&roomName=2+in+a+Room&amount=3000&billing=Yearly

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PLATFORM_FEE_PERCENT = 5;

export default function PaymentPage() {
  const router = useRouter();
  const [queryParams, setQueryParams] = useState(null);

  useEffect(() => {
    setQueryParams(new URLSearchParams(window.location.search));
  }, []);

  const hostelId   = queryParams?.get("hostelId") || "1";
  const roomId     = queryParams?.get("roomId") || "";
  const roomName   = queryParams?.get("roomName") || "Room";
  const amount     = Number(queryParams?.get("amount") || 0);
  const billing    = queryParams?.get("billing") || "Yearly";
  const hostelName = queryParams?.get("hostelName") || "Hostel";

  const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const hostPayout  = amount - platformFee;

  const [user, setUser] = useState(null);
  const [step, setStep] = useState("review"); // "review" | "paying" | "success" | "failed"
  const [reference, setReference] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    setReference(`HH-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`);
  }, []);

  const initializePaystack = async () => {
    if (!hostelId || !roomId || amount <= 0) {
      alert("Please select a valid room and amount before proceeding to payment.");
      return;
    }

    setStep("paying");

    // First, create a booking if not exists
    try {
      const bookRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ hostelId, roomId, message: `Booking for ${roomName}` }),
      });
      if (!bookRes.ok) {
        const err = await bookRes.json();
        alert("Failed to create booking: " + err.message);
        setStep("review");
        return;
      }
    } catch {
      alert("Failed to create booking. Please try again.");
      setStep("review");
      return;
    }

    // Load Paystack inline script dynamically
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => {
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx",
        email: user?.email || "student@umat.edu.gh",
        amount: amount * 100, // Paystack uses pesewas (GH₵1 = 100 pesewas)
        currency: "GHS",
        ref: reference,
        metadata: {
          hostelId,
          roomId,
          hostelName,
          roomName,
          studentId: user?.id,
          platformFeePercent: PLATFORM_FEE_PERCENT,
          hostPayout,
        },
        callback: (response) => {
          // Payment successful — verify on backend
          verifyPayment(response.reference);
        },
        onClose: () => {
          setStep("review");
        },
      });
      handler.openIframe();
    };
    document.body.appendChild(script);
  };

  const verifyPayment = async (ref) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ reference: ref, hostelId, roomId, roomName, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("success");
      } else {
        setStep("failed");
      }
    } catch {
      setStep("failed");
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3 h-14">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E40AF] font-medium transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <span className="text-gray-200">|</span>
          <Link href="/" className="font-extrabold text-lg text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
            Secure Payment
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">

        {/* SUCCESS STATE */}
        {step === "success" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Payment Successful!</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-1">Your payment of <strong className="text-[#1E40AF]">GH₵{amount.toLocaleString()}</strong> has been received.</p>
            <p className="text-gray-400 text-xs mb-6">Reference: <span className="font-mono font-semibold">{reference}</span></p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Payment Summary</p>
              {[
                ["Hostel", hostelName],
                ["Room Type", roomName],
                ["Billing Period", billing],
                ["Amount Paid", `GH₵${amount.toLocaleString()}`],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-semibold text-gray-700">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-[#1E40AF] mb-6 text-left">
              ✅ The host has been notified. They will contact you within 24 hours to arrange move-in.
            </div>

            <div className="flex gap-3">
              <Link href="/student/dashboard" className="flex-1 text-center bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-bold rounded-xl py-3 transition">
                Go to Dashboard
              </Link>
              <Link href="/" className="flex-1 text-center border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 hover:border-gray-300 transition">
                Browse More
              </Link>
            </div>
          </div>
        )}

        {/* FAILED STATE */}
        {step === "failed" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Payment Failed</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">We couldn't process your payment. Please try again or contact support.</p>

            <div className="flex gap-3">
              <button onClick={() => setStep("review")} className="flex-1 text-center bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-bold rounded-xl py-3 transition">
                Try Again
              </button>
              <Link href="/student/dashboard" className="flex-1 text-center border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 hover:border-gray-300 transition">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* REVIEW + PAY STATE */}
        {(step === "review" || step === "paying") && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Complete Your Booking</h1>
              <p className="text-gray-400 text-sm mt-1">Review your order then pay securely with Paystack.</p>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Order Summary</h2>

              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1E40AF] flex items-center justify-center text-white text-xl flex-shrink-0">🏠</div>
                <div>
                  <p className="font-bold text-gray-800">{hostelName}</p>
                  <p className="text-sm text-gray-500">{roomName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Billed {billing}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Room price</span>
                  <span className="font-semibold text-gray-800">GH₵{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                  <span className="text-gray-500">Included</span>
                </div>
                <div className="flex justify-between text-base font-extrabold border-t border-gray-100 pt-2 mt-2">
                  <span className="text-gray-800">Total to pay</span>
                  <span className="text-[#1E40AF]">GH₵{amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payer info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Your Information</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {[["Name", user.name],["Email", user.email],["Reference", reference]].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-gray-700 font-mono text-xs">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paystack button */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Payment secured by Paystack · All major cards, Mobile Money accepted
              </div>

              <button
                onClick={initializePaystack}
                disabled={step === "paying" || amount === 0}
                className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-extrabold rounded-xl py-4 text-lg transition active:scale-95 flex items-center justify-center gap-3"
              >
                {step === "paying" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Opening payment...
                  </>
                ) : (
                  <>
                    Pay GH₵{amount.toLocaleString()} with Paystack
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                By paying you agree to HostelHub's terms. Refunds are subject to host approval.
              </p>
            </div>

            {/* Paystack logo */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Powered by</span>
              <span className="font-bold text-[#00C3F7]">Paystack</span>
              <span>· Accepted: Visa · Mastercard · MTN MoMo · Vodafone · AirtelTigo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}