"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
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
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-[#1E40AF] transition">Browse</Link>
          <Link href="/list-your-hostel" className="hover:text-[#1E40AF] transition">Become a Host</Link>
          <Link href="/student/login" className="hover:text-[#1E40AF] transition">Student Login</Link>
          <Link href="/host/login" className="hover:text-[#1E40AF] transition">Host Login</Link>
          <Link href="/student/signup" className="btn-primary">Sign Up Free</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
          <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
          <div className="w-5 h-0.5 bg-gray-600"></div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3 text-sm font-medium">
          <Link href="/" className="py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Browse Hostels</Link>
          <Link href="/list-your-hostel" className="py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Become a Host</Link>
          <Link href="/student/login" className="py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Student Login</Link>
          <Link href="/host/login" className="py-2 text-gray-700" onClick={() => setMobileOpen(false)}>Host Login</Link>
          <Link href="/student/signup" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>Sign Up Free</Link>
        </div>
      )}
    </nav>
  );
}
