"use client";
import { useState } from "react";
import Link from "next/link";

const PROGRAMS = [
  "Mining Engineering", "Geological Engineering", "Metallurgical Engineering",
  "Civil Engineering", "Electrical Engineering", "Computer Science & Engineering",
  "Environmental & Safety Engineering", "Mathematics", "Physics",
];

export default function StudentSignup() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", studentId: "",
    program: "", year: "",
  });
  const [step, setStep] = useState(1);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-96 bg-[#1E40AF] text-white p-10 justify-between">
        <div>
          <Link href="/" className="font-extrabold text-2xl" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <div className="mt-16 space-y-6">
            <h2 className="text-3xl font-extrabold leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Find your perfect<br/>UMaT hostel
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Join thousands of UMaT students who found their ideal accommodation through HostelHub.
            </p>
            {["Browse verified hostels", "Compare prices & amenities", "Chat directly with hosts", "Secure your room fast"].map(f => (
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
        <p className="text-blue-300 text-xs">UMaT students only · Tarkwa, Ghana</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <Link href="/" className="font-extrabold text-2xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s ? "bg-[#1E40AF] text-white" : "bg-gray-100 text-gray-400"
                  }`}>{s}</div>
                  {s === 1 && <div className={`h-0.5 w-12 transition-all ${step >= 2 ? "bg-[#1E40AF]" : "bg-gray-200"}`} />}
                </div>
              ))}
              <span className="text-xs text-gray-400 ml-1">Step {step} of 2</span>
            </div>

            <h1 className="text-xl font-extrabold text-gray-900 mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {step === 1 ? "Create your account" : "UMaT Student Info"}
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              {step === 1 ? "Enter your personal details below." : "Help us verify your student status."}
            </p>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                    <input className="input-field" placeholder="Kwame" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                    <input className="input-field" placeholder="Asante" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <input className="input-field" type="email" placeholder="kwame@umat.edu.gh" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input className="input-field" type="tel" placeholder="0244xxxxxx" value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <input className="input-field" type="password" placeholder="At least 8 characters" value={form.password} onChange={e => set("password", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password</label>
                  <input className="input-field" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
                </div>
                <button onClick={() => setStep(2)} className="btn-primary w-full py-3 text-base">
                  Continue →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">UMaT Student ID</label>
                  <input className="input-field" placeholder="e.g. UMaT/2021/CS/001" value={form.studentId} onChange={e => set("studentId", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Program of Study</label>
                  <select className="input-field" value={form.program} onChange={e => set("program", e.target.value)}>
                    <option value="">Select program...</option>
                    {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Year of Study</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["L100", "L200", "L300", "L400"].map(y => (
                      <button
                        key={y}
                        onClick={() => set("year", y)}
                        className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                          form.year === y
                            ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3">← Back</button>
                  <Link href="/student/dashboard" className="btn-primary flex-1 py-3 text-center text-base">
                    Create Account
                  </Link>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{" "}
              <Link href="/student/login" className="text-[#1E40AF] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}