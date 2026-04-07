"use client";
import { useState } from "react";
import Link from "next/link";

const TABS = ["Overview", "My Hostels", "Bookings", "Messages", "Settings"];

const MOCK_HOSTEL = {
  name: "Abitjack Hostel",
  totalRooms: 24,
  available: 12,
  views: 340,
  bookings: 5,
  pending: 2,
};

const MOCK_BOOKINGS = [
  { student: "Kwame Asante", room: "4 in a Room", date: "Apr 5, 2026", status: "Pending" },
  { student: "Abena Mensah", room: "2 in a Room", date: "Apr 3, 2026", status: "Approved" },
  { student: "Kofi Darko", room: "1 in a Room", date: "Mar 29, 2026", status: "Declined" },
  { student: "Ama Sarpong", room: "4 in a Room", date: "Mar 25, 2026", status: "Approved" },
];

const MOCK_MESSAGES = [
  { student: "Kwame Asante", msg: "Is the room still available for L200 students?", time: "1h ago", unread: true },
  { student: "Yaa Frimpong", msg: "Can I see the bathroom photos?", time: "3h ago", unread: true },
  { student: "Nana Boateng", msg: "Thank you! I will pay tomorrow.", time: "1d ago", unread: false },
];

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Declined: "bg-red-50 text-red-600",
};

export default function HostDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [rooms, setRooms] = useState([
    { name: "4 in a Room (Shared)", price: 2750, total: 8, available: 4, status: "active" },
    { name: "4 in a Room (Self-contained)", price: 3000, total: 8, available: 4, status: "active" },
    { name: "2 in a Room", price: 3000, total: 4, available: 2, status: "active" },
    { name: "1 in a Room", price: 8000, total: 4, available: 2, status: "paused" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
            <span className="ml-2 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Host</span>
          </Link>
          <div className="hidden md:flex gap-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab ? "bg-[#F59E0B] text-white" : "text-gray-500 hover:bg-amber-50"
                }`}
              >{tab}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-bold text-sm">M</div>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100 px-2">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab ? "border-[#F59E0B] text-[#F59E0B]" : "border-transparent text-gray-400"
              }`}
            >{tab}</button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* Welcome */}
        <div className="bg-[#1e3a8a] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-full opacity-10"
            style={{background:"radial-gradient(circle at right, #F59E0B, transparent)"}} />
          <p className="text-blue-200 text-sm">Host Dashboard 🏠</p>
          <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Martha Adasi</h1>
          <p className="text-blue-200 text-sm mt-1">
            <span className="text-[#F59E0B] font-bold">{MOCK_HOSTEL.pending} booking requests</span> waiting for your response.
          </p>
          <button className="mt-4 bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
            + Add New Hostel
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Views", val: MOCK_HOSTEL.views, icon: "👁", color: "blue" },
            { label: "Total Bookings", val: MOCK_HOSTEL.bookings, icon: "📋", color: "gold" },
            { label: "Rooms Available", val: MOCK_HOSTEL.available, icon: "🏠", color: "green" },
            { label: "Pending Requests", val: MOCK_HOSTEL.pending, icon: "⏳", color: "amber" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <span style={{fontSize:"22px"}}>{stat.icon}</span>
              <p className="text-2xl font-extrabold text-gray-800 mt-2">{stat.val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🏠 Manage Rooms</h2>
              <button className="btn-primary text-xs px-3 py-1.5">+ Add Room Type</button>
            </div>
            <div className="space-y-3">
              {rooms.map((room, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{room.name}</p>
                    <p className="text-xs text-gray-400">GH₵{room.price.toLocaleString()} · {room.available}/{room.total} available</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${room.status === "active" ? "bg-emerald-400" : "bg-gray-300"}`} />
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${room.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      {room.status === "active" ? "Active" : "Paused"}
                    </span>
                    <button className="text-xs text-[#1E40AF] font-semibold hover:underline">Edit</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Availability bar */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-gray-700">Occupancy Rate</span>
                <span className="text-[#1E40AF] font-bold">{Math.round(((MOCK_HOSTEL.totalRooms - MOCK_HOSTEL.available) / MOCK_HOSTEL.totalRooms) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-[#1E40AF] h-2 rounded-full" style={{width:`${((MOCK_HOSTEL.totalRooms - MOCK_HOSTEL.available) / MOCK_HOSTEL.totalRooms) * 100}%`}} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{MOCK_HOSTEL.totalRooms - MOCK_HOSTEL.available} of {MOCK_HOSTEL.totalRooms} rooms occupied</p>
            </div>
          </div>

          {/* Booking requests */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📋 Booking Requests</h2>
              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">{MOCK_HOSTEL.pending} pending</span>
            </div>
            <div className="space-y-3">
              {MOCK_BOOKINGS.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xs font-bold">
                      {b.student.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{b.student}</p>
                      <p className="text-xs text-gray-400">{b.room} · {b.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${STATUS_STYLES[b.status]}`}>{b.status}</span>
                    {b.status === "Pending" && (
                      <div className="flex gap-1">
                        <button className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition">✓</button>
                        <button className="w-6 h-6 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition">✗</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💬 Student Messages</h2>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">2 unread</span>
          </div>
          <div className="space-y-3">
            {MOCK_MESSAGES.map((m, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${m.unread ? "bg-amber-50" : "hover:bg-gray-50"}`}>
                <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {m.student.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 text-sm">{m.student}</p>
                    <span className="text-xs text-gray-400">{m.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{m.msg}</p>
                </div>
                {m.unread && <div className="w-2 h-2 bg-[#F59E0B] rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📸 Upload Hostel Images</h2>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#1E40AF] transition cursor-pointer">
            <p style={{fontSize:"32px"}}>🖼️</p>
            <p className="font-semibold text-gray-600 mt-2">Drop images here or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB each · Max 10 images</p>
            <button className="mt-4 btn-ghost text-sm">Choose Files</button>
          </div>
        </div>
      </main>
    </div>
  );
}