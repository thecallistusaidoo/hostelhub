"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    router.push("/");
  };

  const dashboardPath = user?.role === "host" ? "/host/dashboard"
    : user?.role === "admin" ? "/admin/dashboard"
    : "/student/dashboard";

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">HH</span>
          </div>
          <span className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-gray-600 hover:text-[#1E40AF] transition">Browse</Link>

          {user ? (
            <>
              <Link href={dashboardPath}
                className="text-gray-600 hover:text-[#1E40AF] transition">
                Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <Link href={dashboardPath} className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                  <span className="text-gray-700 font-semibold text-sm">{user.name?.split(" ")[0]}</span>
                </Link>
                <button onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition">
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-[#1E40AF] transition">Sign In</Link>
              <Link href="/signup"
                className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl px-5 py-2 transition">
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <div className="w-5 h-0.5 bg-gray-600 mb-1.5"/>
          <div className="w-5 h-0.5 bg-gray-600 mb-1.5"/>
          <div className="w-5 h-0.5 bg-gray-600"/>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3 text-sm font-medium">
          <Link href="/" className="py-2 text-gray-700" onClick={() => setOpen(false)}>Browse Hostels</Link>
          {user ? (
            <>
              <Link href={dashboardPath} className="py-2 text-gray-700" onClick={() => setOpen(false)}>
                My Dashboard ({user.role})
              </Link>
              <button onClick={() => { handleLogout(); setOpen(false); }}
                className="py-2 text-left text-red-500 font-semibold">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="py-2 text-gray-700" onClick={() => setOpen(false)}>Sign In</Link>
              <Link href="/signup"
                className="bg-[#1E40AF] text-white text-center py-2.5 rounded-xl font-semibold"
                onClick={() => setOpen(false)}>
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
