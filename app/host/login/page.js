"use client";
import { useState } from "react";
import Link from "next/link";

export default function HostLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-extrabold text-3xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <p className="text-gray-400 text-sm mt-1">Host Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Host badge */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-5">
            <span style={{fontSize:"16px"}}>🏠</span>
            <p className="text-sm font-semibold text-amber-700">Hostel Owner Access</p>
          </div>

          <h1 className="text-xl font-extrabold text-gray-900 mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Welcome back, Host</h1>
          <p className="text-gray-400 text-sm mb-6">Sign in to manage your hostel listings</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input className="input-field" type="email" placeholder="you@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <Link href="#" className="text-xs text-[#1E40AF] font-semibold hover:underline">Forgot password?</Link>
              </div>
              <input className="input-field" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <Link href="/host/dashboard" className="block w-full text-center btn-gold py-3 text-base">
              Sign In as Host
            </Link>
          </div>

          <p className="text-center text-sm text-gray-400 mt-5">
            Not a host yet?{" "}
            <Link href="/host/signup" className="text-[#F59E0B] font-semibold hover:underline">List your hostel →</Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            Are you a student?{" "}
            <Link href="/student/login" className="text-[#1E40AF] font-semibold hover:underline">Student login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}