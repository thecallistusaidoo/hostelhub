"use client";
import { useState } from "react";
import Link from "next/link";
import hostels from "../../data/hostels";

const TABS = ["Dashboard", "Browse Hostels", "Messages", "Favorites", "Settings"];

const MOCK_MESSAGES = [
  { host: "Martha Adasi", hostel: "Abitjack Hostel", msg: "Your booking request has been received!", time: "2h ago", unread: true },
  { host: "Kwame Asante", hostel: "Campus View Suites", msg: "Room is still available. When can you pay?", time: "1d ago", unread: false },
];

const MOCK_RECENT = [1, 3, 8];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const savedHostels = hostels.slice(0, 3);
  const recentHostels = MOCK_RECENT.map(id => hostels.find(h => h.id === id));
  const recommended = hostels.filter(h => h.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-[#1E40AF] text-white"
                    : "text-gray-500 hover:text-[#1E40AF] hover:bg-blue-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Profile */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">K</div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F59E0B] rounded-full border-2 border-white"></span>
            </div>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100 px-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab ? "border-[#1E40AF] text-[#1E40AF]" : "border-transparent text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3">K</div>
            <p className="font-bold text-gray-800 text-lg">Kwame Asante</p>
            <p className="text-gray-400 text-sm">Mining Engineering · L300</p>
            <p className="text-gray-400 text-xs mt-0.5">UMaT/2022/ME/045</p>
            <div className="mt-3 flex justify-center">
              <span className="bg-blue-50 text-[#1E40AF] text-xs font-semibold px-3 py-1 rounded-full">Free Plan</span>
            </div>
            <button className="w-full btn-gold mt-4 text-sm py-2">Upgrade to Premium</button>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="font-bold text-gray-800 text-sm">My Activity</p>
            {[
              { label: "Saved Hostels", val: 3 },
              { label: "Booking Requests", val: 1 },
              { label: "Unread Messages", val: 1 },
              { label: "Recent Views", val: 8 },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-bold text-[#1E40AF]">{val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Welcome banner */}
          <div className="bg-[#1E40AF] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-40 h-full opacity-10"
              style={{background:"radial-gradient(circle at right, #F59E0B, transparent)"}} />
            <p className="text-blue-200 text-sm font-medium">Good morning 👋</p>
            <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Kwame Asante</h1>
            <p className="text-blue-200 text-sm mt-1">You have <span className="text-[#F59E0B] font-bold">1 unread message</span> and <span className="text-[#F59E0B] font-bold">3 saved hostels</span>.</p>
            <Link href="/" className="inline-block mt-4 bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              Browse Hostels →
            </Link>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Messages from Hosts</h2>
              <Link href="#" className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {MOCK_MESSAGES.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition cursor-pointer ${m.unread ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                  <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {m.host.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 text-sm">{m.host}</p>
                      <span className="text-xs text-gray-400">{m.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{m.hostel} · {m.msg}</p>
                  </div>
                  {m.unread && <div className="w-2 h-2 bg-[#F59E0B] rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          </div>

          {/* Saved Hostels */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Saved Hostels</h2>
              <Link href="/" className="text-xs text-[#1E40AF] font-semibold hover:underline">Browse more</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {savedHostels.map(h => (
                <Link key={h.id} href={`/hostel/${h.id}`} className="block bg-gray-50 rounded-xl p-3 hover:bg-blue-50 transition group">
                  <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF] line-clamp-1">{h.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{h.location} · GH₵{h.price.toLocaleString()}/yr</p>
                  <span className={`text-xs font-semibold mt-1 inline-block ${h.availableRooms > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {h.availableRooms > 0 ? `${h.availableRooms} rooms left` : "Fully Booked"}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Views */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 Recently Viewed</h2>
            <div className="space-y-2">
              {recentHostels.map(h => h && (
                <Link key={h.id} href={`/hostel/${h.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition group">
                  <div>
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF]">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.location} · {h.campusDistance}</p>
                  </div>
                  <span className="text-sm font-bold text-[#1E40AF]">GH₵{h.price.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recommended */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✨ Recommended For You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommended.map(h => (
                <Link key={h.id} href={`/hostel/${h.id}`} className="block bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 border border-blue-100 hover:border-[#1E40AF] transition group">
                  <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF] line-clamp-1">{h.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{h.campusDistance}</p>
                  <p className="text-sm font-bold text-[#1E40AF] mt-1">GH₵{h.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/yr</span></p>
                  <p className="text-xs text-amber-500 font-semibold">★ {h.hostRating}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}