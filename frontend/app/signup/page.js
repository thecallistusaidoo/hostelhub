"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PROGRAMS = [
  "Mining Engineering","Geological Engineering","Metallurgical Engineering",
  "Civil Engineering","Electrical Engineering","Computer Science & Engineering",
  "Environmental & Safety Engineering","Mathematics","Physics",
];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState(null); // "student" | "host"
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName:"", lastName:"", fullName:"",
    email:"", phone:"", password:"", confirmPassword:"",
    studentId:"", program:"", year:"",
  });

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const endpoint = role === "student" ? "/api/auth/signup-student" : "/api/auth/signup-host";
      const body = role === "student"
        ? { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone,
            password: form.password, umatId: form.studentId, program: form.program, year: form.year }
        : { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;

      if (!res.ok) {
        const detailed = Array.isArray(data?.errors) && data.errors.length
          ? data.errors.join(", ")
          : (data?.message || "Signup failed");
        throw new Error(detailed);
      }
      if (!data) throw new Error("Invalid server response. Check backend API URL.");
      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push(role === "student" ? "/student/dashboard" : "/host/dashboard");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Step 0 — choose role
  if (!role) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-extrabold text-3xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your free account</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            I am a...
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Choose your account type to get started.</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole("student")}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#1E40AF] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
            >
              <span className="text-4xl">🎓</span>
              <div className="text-center">
                <p className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#1E40AF]">Student</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Find & book a hostel</p>
              </div>
            </button>
            <button
              onClick={() => setRole("host")}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-[#F59E0B] hover:bg-amber-50 dark:hover:bg-yellow-900/20 transition group"
            >
              <span className="text-4xl">🏠</span>
              <div className="text-center">
                <p className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#F59E0B]">Host</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">List your hostel</p>
              </div>
            </button>
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1E40AF] dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      {/* Left panel */}
      <div className={`hidden lg:flex flex-col w-96 text-white p-10 justify-between ${role === "host" ? "bg-[#1e3a8a] dark:bg-[#1a2554]" : "bg-[#1E40AF] dark:bg-[#1e3a8a]"} transition-colors duration-300`}>
        <div>
          <Link href="/" className="font-extrabold text-2xl" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <div className="mt-16 space-y-5">
            <h2 className="text-3xl font-extrabold leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {role === "student" ? "Find your perfect UMaT hostel" : "List your hostel. Reach more students."}
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              {role === "student"
                ? "Join thousands of UMaT students who found their ideal accommodation through HostelHub."
                : "Join verified hostel owners on HostelHub and fill your rooms faster every semester."}
            </p>
            {(role === "student"
              ? ["Browse verified hostels","Compare prices & amenities","Chat directly with hosts","Secure your room fast"]
              : ["Free to list your hostel","See reservations in one place","Chat directly with students","Track views & inquiries"]
            ).map(f => (
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
        <button onClick={() => { setRole(null); setStep(1); }} className="text-blue-300 text-sm hover:text-white transition text-left">
          ← Change account type
        </button>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-2xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
            <button onClick={() => { setRole(null); setStep(1); }} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Role badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 ${
              role === "student" ? "bg-blue-50 text-[#1E40AF]" : "bg-amber-50 text-amber-700"
            }`}>
              {role === "student" ? "🎓 Student Account" : "🏠 Host Account"}
            </div>

            {/* Step indicator (student has 2 steps) */}
            {role === "student" && (
              <div className="flex items-center gap-2 mb-5">
                {[1,2].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? "bg-[#1E40AF] text-white" : "bg-gray-100 text-gray-400"
                    }`}>{s}</div>
                    {s === 1 && <div className={`h-0.5 w-10 transition-all ${step >= 2 ? "bg-[#1E40AF]" : "bg-gray-200"}`}/>}
                  </div>
                ))}
                <span className="text-xs text-gray-400 ml-1">Step {step} of 2</span>
              </div>
            )}

            <h1 className="text-xl font-extrabold text-gray-900 mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {role === "student" && step === 2 ? "UMaT Student Info" : "Create your account"}
            </h1>
            <p className="text-gray-400 text-sm mb-5">
              {role === "student" && step === 2 ? "Tell us about your studies." : "Fill in your details below."}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {/* STUDENT STEP 1 / HOST (single step) */}
            {(role === "host" || (role === "student" && step === 1)) && (
              <div className="space-y-4">
                {role === "student" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                      <input className="input-field" placeholder="Kwame" value={form.firstName} onChange={e => set("firstName", e.target.value)}/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                      <input className="input-field" placeholder="Asante" value={form.lastName} onChange={e => set("lastName", e.target.value)}/>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <input className="input-field" placeholder="Martha Adasi" value={form.fullName} onChange={e => set("fullName", e.target.value)}/>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <input className="input-field" type="email" placeholder="you@gmail.com" value={form.email} onChange={e => set("email", e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input className="input-field" type="tel" placeholder="0244xxxxxx" value={form.phone} onChange={e => set("phone", e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <input className="input-field" type="password" placeholder="At least 8 characters" value={form.password} onChange={e => set("password", e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password</label>
                  <input className="input-field" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}/>
                </div>

                {role === "student" ? (
                  <button onClick={() => setStep(2)} className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl py-3 transition">
                    Continue →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="w-full bg-[#F59E0B] hover:bg-amber-500 text-white font-semibold rounded-xl py-3 transition disabled:opacity-60">
                    {loading ? "Creating account..." : "Create Host Account"}
                  </button>
                )}
              </div>
            )}

            {/* STUDENT STEP 2 */}
            {role === "student" && step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">UMaT Student ID</label>
                  <input className="input-field" placeholder="e.g. UMaT/2022/ME/045" value={form.studentId} onChange={e => set("studentId", e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Program of Study</label>
                  <select className="input-field" value={form.program} onChange={e => set("program", e.target.value)}>
                    <option value="">Select program...</option>
                    {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Year of Study</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["L100","L200","L300","L400"].map(y => (
                      <button key={y} onClick={() => set("year", y)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          form.year === y ? "bg-[#1E40AF] text-white border-[#1E40AF]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
                        }`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 hover:border-[#1E40AF] text-gray-600 font-semibold rounded-xl py-3 transition bg-white">
                    ← Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl py-3 transition disabled:opacity-60">
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1E40AF] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}