"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [reference, setReference] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    setReference(ref || "");
    if (!ref) {
      setStatus("failed");
      setMessage("Missing payment reference.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reference: ref }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage(data?.message || "Payment verified successfully.");
          return;
        }
        setStatus("failed");
        setMessage(data?.message || "Payment verification failed.");
      } catch (err) {
        setStatus("failed");
        setMessage("Payment verification failed. Please contact support with your reference.");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="w-12 h-12 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Verifying Payment</h1>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Payment Successful</h1>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Payment Failed</h1>
          </>
        )}

        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {reference && <p className="text-xs text-gray-400 mb-6">Reference: {reference}</p>}

        <div className="flex gap-3">
          <Link
            href="/student/dashboard"
            className="flex-1 text-center bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-bold rounded-xl py-3 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="flex-1 text-center border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 hover:border-gray-300 transition"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
