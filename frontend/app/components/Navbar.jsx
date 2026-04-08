"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen]   = useState(false);
  const [user, setUser]   = useState(null);
  const [dark, setDark]   = useState(false);
  const router = useRouter();

  // Hydrate user from localStorage
  useEffect(() => {
    const load = () => {
      const s = localStorage.getItem("user");
      setUser(s ? JSON.parse(s) : null);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  // Hydrate dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      const storedUser   = JSON.parse(localStorage.getItem("user") || "{}");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken, role: storedUser.role }),
      });
    } catch {}
    localStorage.clear();
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  const dashPath = user?.role === "host" ? "/host/dashboard"
    : user?.role === "admin" ? "/admin/dashboard"
    : "/student/dashboard";

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <nav className="glass-nav sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="HostelHub"
              fill
              className="object-contain rounded-lg"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <span className="font-extrabold text-xl text-[#1E40AF] dark:text-blue-300 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-3 py-2 rounded-xl text-sm font-medium text-[--text-secondary] hover:text-[#1E40AF] dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all">
            Browse
          </Link>
          {user && (
            <Link href={dashPath} className="px-3 py-2 rounded-xl text-sm font-medium text-[--text-secondary] hover:text-[#1E40AF] dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all">
              Dashboard
            </Link>
          )}
        </div>

        {/* ── Right actions ── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className={`dark-toggle ${dark ? "active" : ""}`}
            aria-label="Toggle dark mode"
          >
            <span className="sr-only">Dark mode</span>
          </button>
          <span className="text-xs text-[--text-muted]">{dark ? "🌙" : "☀️"}</span>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href={dashPath} className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md"
                  style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
                  {initials}
                </div>
                <span className="text-sm font-semibold text-[--text-primary]">{user.name?.split(" ")[0]}</span>
              </Link>
              <button onClick={handleLogout}
                className="text-xs text-[--text-muted] hover:text-red-500 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-200 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[--text-secondary] hover:text-[#1E40AF] dark:hover:text-blue-300 transition-all">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-sm px-5 py-2">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile row ── */}
        <div className="md:hidden flex items-center gap-3">
          <button onClick={toggleDark} className={`dark-toggle ${dark ? "active" : ""}`} aria-label="Toggle dark mode"/>
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/10 transition"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-[--text-primary] transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`}/>
            <span className={`block w-5 h-0.5 bg-[--text-primary] transition-all duration-300 ${open ? "opacity-0" : ""}`}/>
            <span className={`block w-5 h-0.5 bg-[--text-primary] transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`}/>
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div className="md:hidden glass-heavy border-t border-white/20 dark:border-white/05 px-4 py-4 flex flex-col gap-2 text-sm font-medium animate-fade-up">
          <Link href="/" className="px-3 py-2.5 rounded-xl text-[--text-primary] hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition" onClick={() => setOpen(false)}>
            🔍 Browse Hostels
          </Link>
          {user ? (
            <>
              <Link href={dashPath} className="px-3 py-2.5 rounded-xl text-[--text-primary] hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition" onClick={() => setOpen(false)}>
                🏠 My Dashboard
              </Link>
              <button onClick={() => { handleLogout(); setOpen(false); }}
                className="px-3 py-2.5 rounded-xl text-left text-red-500 hover:bg-red-50/60 dark:hover:bg-red-900/20 font-semibold transition">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2.5 rounded-xl text-[--text-primary] hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition" onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary text-center py-3 rounded-xl" onClick={() => setOpen(false)}>
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}