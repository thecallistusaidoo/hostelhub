"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect immediately
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      redirectByRole(parsed.role);
    }
  }, []);

  function redirectByRole(role) {
    const intended = sessionStorage.getItem("redirectAfterLogin");
    sessionStorage.removeItem("redirectAfterLogin");
    if (intended) { router.push(intended); return; }
    if (role === "student") router.push("/student/dashboard");
    else if (role === "host") router.push("/host/dashboard");
    else if (role === "admin") router.push("/admin/dashboard");
    else router.push("/");
  }

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage")); // notify Navbar

      redirectByRole(data.user.role);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Top bar with back button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 h-14 flex items-center gap-3 transition-colors duration-300">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#1E40AF] font-medium transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <Link href="/" className="font-extrabold text-lg text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Hostel<span className="text-[#F59E0B]">Hub</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Welcome back
            </h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Sign in — works for students, hosts and admins.</p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                <input className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  type="email" placeholder="you@gmail.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}/>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#1E40AF] dark:text-blue-400 font-semibold hover:underline">Forgot password?</Link>
                </div>
                <input className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  type="password" placeholder="Your password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}/>
              </div>

              <button onClick={handleLogin} disabled={loading}
                className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl py-3 text-base transition disabled:opacity-60">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-5">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#1E40AF] dark:text-blue-400 font-semibold hover:underline">Sign up free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}