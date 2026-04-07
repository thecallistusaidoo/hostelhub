"use client";
import { useState } from "react";
import Link from "next/link";

const LOCATIONS = ["Umat (Near Campus)", "Tarkwa Town", "Nyankomasi", "Bogoso", "Other"];

export default function HostSignup() {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "",
    hostelName: "", location: "",
  });
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-96 bg-[#1e3a8a] text-white p-10 justify-between">
        <div>
          <Link href="/" className="font-extrabold text-2xl" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <div className="mt-16 space-y-5">
            <h2 className="text-3xl font-extrabold leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              List your hostel.<br/>Reach more students.
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Join verified hostel owners on HostelHub and fill your rooms faster every semester.
            </p>
            {["Free to list your hostel", "Manage bookings in one place", "Chat directly with students", "Track views and earnings"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="text-sm text-blue-100">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs">For hostel owners · UMaT area, Tarkwa</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <Link href="/" className="font-extrabold text-2xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-xl font-extrabold text-gray-900 mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Create Host Account
            </h1>
            <p className="text-gray-400 text-sm mb-6">Fill in your details to start listing.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input className="input-field" placeholder="Martha Adasi" value={form.fullName} onChange={e => set("fullName", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input className="input-field" type="email" placeholder="you@gmail.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input className="input-field" type="tel" placeholder="0244xxxxxx" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm</label>
                  <input className="input-field" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Hostel Info</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hostel Name</label>
                    <input className="input-field" placeholder="e.g. Abitjack Hostel" value={form.hostelName} onChange={e => set("hostelName", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                    <select className="input-field" value={form.location} onChange={e => set("location", e.target.value)}>
                      <option value="">Select location...</option>
                      {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <Link href="/host/dashboard" className="block w-full text-center btn-gold py-3 text-base">
                Create Host Account
              </Link>
            </div>

            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{" "}
              <Link href="/host/login" className="text-[#1E40AF] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}