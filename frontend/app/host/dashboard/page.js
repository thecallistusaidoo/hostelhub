"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { messageAPI } from "../../lib/api";
import { getSocket, disconnectSocket } from "../../lib/socket";

// ── Mock data (replace with API calls when backend connected) ─────────────
const MOCK_HOST = { name: "Martha Adasi", initials: "MA", email: "martha@gmail.com", phone: "0544862114" };

const INITIAL_HOSTELS = [
  { id: "h1", name: "Abitjack Hostel", location: "Umat", status: "approved", views: 340, bookings: 5, totalRooms: 24, availableRooms: 12, price: 2750, gender: "Mixed", images: [] },
];

const INITIAL_ROOMS = [
  { id: "r1", hostelId: "h1", name: "4 in a Room (Shared)", price: 2750, total: 8, occupied: 4, billing: "Yearly", status: "active" },
  { id: "r2", hostelId: "h1", name: "4 in a Room (Self-contained)", price: 3000, total: 8, occupied: 4, billing: "Yearly", status: "active" },
  { id: "r3", hostelId: "h1", name: "2 in a Room", price: 4000, total: 4, occupied: 2, billing: "Yearly", status: "active" },
  { id: "r4", hostelId: "h1", name: "1 in a Room", price: 8000, total: 4, occupied: 2, billing: "Yearly", status: "paused" },
];

const INITIAL_BOOKINGS = [
  { id: "b1", student: "Kwame Asante", email: "kwame@umat.edu.gh", phone: "0244123456", room: "4 in a Room", hostel: "Abitjack Hostel", date: "Apr 5, 2026", status: "Pending", message: "I am an L300 Mining student looking for a room close to campus." },
  { id: "b2", student: "Abena Mensah", email: "abena@umat.edu.gh", phone: "0203456789", room: "2 in a Room", hostel: "Abitjack Hostel", date: "Apr 3, 2026", status: "Approved", message: "Is the room self-contained?" },
  { id: "b3", student: "Kofi Darko", email: "kofi@umat.edu.gh", phone: "0501112233", room: "1 in a Room", hostel: "Abitjack Hostel", date: "Mar 29, 2026", status: "Rejected", message: "Looking for a quiet room for studying." },
  { id: "b4", student: "Ama Sarpong", email: "ama@umat.edu.gh", phone: "0244998877", room: "4 in a Room", hostel: "Abitjack Hostel", date: "Mar 25, 2026", status: "Approved", message: "Need a room from August 2026." },
];

function formatRelativeTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

function mapThreadMessage(m, meId, meRole) {
  const mine = String(m.senderId) === String(meId);
  const from = mine
    ? (meRole === "host" ? "host" : "student")
    : (m.senderModel === "Host" ? "host" : "student");
  return { from, text: m.body, time: formatRelativeTime(m.createdAt), _id: m._id };
}

const INITIAL_CONVERSATIONS = [
  { id: "c1", partnerId: "c1", student: "Kwame Asante", studentId: "c1", partnerRole: "student", lastMsg: "Is the room still available for L200?", time: "1h ago", unread: 2,
    messages: [
      { from: "student", text: "Hello! Is the room still available for L200 students?", time: "1h ago" },
      { from: "student", text: "I am interested in the 4 in a room option.", time: "55m ago" },
    ]
  },
  { id: "c2", partnerId: "c2", student: "Yaa Frimpong", studentId: "c2", partnerRole: "student", lastMsg: "Can I see the bathroom photos?", time: "3h ago", unread: 1,
    messages: [
      { from: "student", text: "Good afternoon! Can I see photos of the bathroom?", time: "3h ago" },
    ]
  },
  { id: "c3", partnerId: "c3", student: "Nana Boateng", studentId: "c3", partnerRole: "student", lastMsg: "Thank you! I will pay tomorrow.", time: "1d ago", unread: 0,
    messages: [
      { from: "host", text: "Hello Nana, the room is confirmed for you.", time: "2d ago" },
      { from: "student", text: "Thank you so much! I will come to pay tomorrow morning.", time: "1d ago" },
    ]
  },
];

const AMENITIES_LIST = ["WiFi","Water","Electricity","Generator","Kitchen","Security","AC","Laundry","Parking","Wardrobe"];
const STATUS_STYLES = { Pending:"bg-amber-50 text-amber-700 border-amber-200", Approved:"bg-emerald-50 text-emerald-700 border-emerald-200", Rejected:"bg-red-50 text-red-600 border-red-200" };

// ── Tab icons
const TABS = [
  { id:"overview",   label:"Overview",    icon:"🏠" },
  { id:"hostels",    label:"My Hostels",  icon:"🏢" },
  { id:"bookings",   label:"Bookings",    icon:"📋" },
  { id:"messages",   label:"Messages",    icon:"💬" },
  { id:"settings",  label:"Settings",    icon:"⚙️" },
];

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ hostels, bookings, conversations, setActiveTab }) {
  const pending = bookings.filter(b => b.status === "Pending").length;
  const unread = conversations.reduce((s, c) => s + c.unread, 0);
  const totalViews = hostels.reduce((s, h) => s + h.views, 0);
  const totalRooms = hostels.reduce((s, h) => s + h.availableRooms, 0);

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-[#1e3a8a] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right,#F59E0B,transparent)"}}/>
        <p className="text-blue-200 text-sm">Host Dashboard 🏠</p>
        <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{MOCK_HOST.name}</h1>
        <p className="text-blue-200 text-sm mt-1">
          <span className="text-[#F59E0B] font-bold">{pending} booking{pending !== 1 ? "s" : ""}</span> pending ·{" "}
          <span className="text-[#F59E0B] font-bold">{unread} unread message{unread !== 1 ? "s" : ""}</span>
        </p>
        <Link href="/host/add-hostel" className="mt-4 inline-block bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
          + Add New Hostel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Views", val:totalViews, icon:"👁" },
          { label:"Active Hostels", val:hostels.filter(h=>h.status==="approved").length, icon:"🏢" },
          { label:"Rooms Available", val:totalRooms, icon:"🛏" },
          { label:"Pending Bookings", val:pending, icon:"⏳", highlight: pending > 0 },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border shadow-sm p-4 ${s.highlight ? "border-amber-200" : "border-gray-100"}`}>
            <span style={{fontSize:"22px"}}>{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-2 ${s.highlight ? "text-amber-600" : "text-gray-800"}`}>{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Recent Bookings</h2>
            <button onClick={() => setActiveTab("bookings")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {bookings.slice(0,3).map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xs font-bold">{b.student.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{b.student}</p>
                    <p className="text-xs text-gray-400">{b.room}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${STATUS_STYLES[b.status]}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Recent Messages</h2>
            <button onClick={() => setActiveTab("messages")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {conversations.slice(0,3).map(c => (
              <button key={c.id} onClick={() => setActiveTab("messages")}
                className={`flex items-start gap-3 p-3 rounded-xl w-full text-left transition ${c.unread ? "bg-amber-50" : "hover:bg-gray-50"}`}>
                <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.student.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{c.student}</p>
                  <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && <span className="bg-[#F59E0B] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MY HOSTELS TAB ───────────────────────────────────────────────────────────
function MyHostelsTab({ hostels, setHostels, rooms, setRooms }) {
  const [selectedHostel, setSelectedHostel] = useState(hostels[0]?.id || null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [newRoom, setNewRoom] = useState({ name:"", price:"", billing:"Yearly", total:1 });

  const hostel = hostels.find(h => h.id === selectedHostel);
  const hostelRooms = rooms.filter(r => r.hostelId === selectedHostel);

  const toggleRoomStatus = (roomId) => {
    setRooms(prev => prev.map(r => r.id === roomId
      ? { ...r, status: r.status === "active" ? "paused" : "active" }
      : r
    ));
  };

  const saveEditRoom = () => {
    setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...editingRoom } : r));
    setEditingRoom(null);
  };

  const addRoom = () => {
    if (!newRoom.name || !newRoom.price) return;
    setRooms(prev => [...prev, { id: `r${Date.now()}`, hostelId: selectedHostel, occupied: 0, status: "active", ...newRoom, price: Number(newRoom.price), total: Number(newRoom.total) }]);
    setNewRoom({ name:"", price:"", billing:"Yearly", total:1 });
    setShowAddRoom(false);
  };

  const saveHostelEdit = () => {
    setHostels(prev => prev.map(h => h.id === editingHostel.id ? { ...h, ...editingHostel } : h));
    setEditingHostel(null);
  };

  return (
    <div className="space-y-5">
      {/* Hostel selector + add */}
      <div className="flex items-center gap-3 flex-wrap">
        {hostels.map(h => (
          <button key={h.id} onClick={() => setSelectedHostel(h.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              selectedHostel === h.id ? "bg-[#1E40AF] text-white border-[#1E40AF]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
            }`}>
            {h.name}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${h.status === "approved" ? "bg-emerald-100 text-emerald-700" : h.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
              {h.status}
            </span>
          </button>
        ))}
        <Link href="/host/add-hostel"
          className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all">
          + Add Hostel
        </Link>
      </div>

      {hostel && (
        <>
          {/* Hostel info card */}
          {editingHostel ? (
            <div className="bg-white rounded-2xl border border-[#1E40AF] shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-gray-800">Edit Hostel Info</h2>
              {[["Hostel Name","name"],["Location","location"],["Description","description"]].map(([l, k]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editingHostel[k] || ""} onChange={e => setEditingHostel(p => ({...p, [k]: e.target.value}))}/>
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={saveHostelEdit} className="flex-1 bg-[#1E40AF] text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-[#1e3a8a] transition">Save</button>
                <button onClick={() => setEditingHostel(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm hover:border-gray-300 transition">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">{hostel.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{hostel.location} · {hostel.gender}</p>
                </div>
                <button onClick={() => setEditingHostel({...hostel})}
                  className="text-xs text-[#1E40AF] font-semibold border border-[#1E40AF] px-3 py-1.5 rounded-xl hover:bg-blue-50 transition">
                  ✏️ Edit
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[["Total Rooms", hostel.totalRooms],["Available", hostel.availableRooms],["Views", hostel.views]].map(([l,v]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-extrabold text-[#1E40AF]">{v}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>

              {/* Occupancy bar */}
              <div className="mt-4 bg-blue-50 rounded-xl p-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700">Occupancy</span>
                  <span className="text-[#1E40AF] font-bold">{Math.round(((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-[#1E40AF] h-2 rounded-full transition-all"
                    style={{width:`${((hostel.totalRooms - hostel.availableRooms) / hostel.totalRooms) * 100}%`}}/>
                </div>
                <p className="text-xs text-gray-400 mt-1">{hostel.totalRooms - hostel.availableRooms} of {hostel.totalRooms} rooms occupied</p>
              </div>
            </div>
          )}

          {/* Room management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Room Types</h2>
              <button onClick={() => setShowAddRoom(!showAddRoom)}
                className="text-xs bg-[#1E40AF] text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-[#1e3a8a] transition">
                + Add Room Type
              </button>
            </div>

            {/* Add room form */}
            {showAddRoom && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3 border border-blue-100">
                <p className="text-sm font-bold text-[#1E40AF]">New Room Type</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Room Name</label>
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="e.g. 2 in a Room" value={newRoom.name} onChange={e => setNewRoom(p => ({...p, name: e.target.value}))}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Price (GH₵)</label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="3000" value={newRoom.price} onChange={e => setNewRoom(p => ({...p, price: e.target.value}))}/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Billing</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      value={newRoom.billing} onChange={e => setNewRoom(p => ({...p, billing: e.target.value}))}>
                      <option>Yearly</option><option>Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Total Rooms</label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="4" value={newRoom.total} onChange={e => setNewRoom(p => ({...p, total: e.target.value}))}/>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addRoom} className="flex-1 bg-[#1E40AF] text-white font-semibold rounded-xl py-2 text-sm hover:bg-[#1e3a8a] transition">Add Room</button>
                  <button onClick={() => setShowAddRoom(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2 text-sm hover:border-gray-300 transition">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {hostelRooms.map(room => (
                <div key={room.id}>
                  {editingRoom?.id === room.id ? (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[["name","Room Name"],["price","Price (GH₵)"]].map(([k,l]) => (
                          <div key={k}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              value={editingRoom[k]} onChange={e => setEditingRoom(p => ({...p, [k]: e.target.value}))}/>
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Total Rooms</label>
                          <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={editingRoom.total} onChange={e => setEditingRoom(p => ({...p, total: Number(e.target.value)}))}/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Billing</label>
                          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            value={editingRoom.billing} onChange={e => setEditingRoom(p => ({...p, billing: e.target.value}))}>
                            <option>Yearly</option><option>Semester</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEditRoom} className="flex-1 bg-[#1E40AF] text-white font-semibold rounded-xl py-2 text-sm hover:bg-[#1e3a8a] transition">Save</button>
                        <button onClick={() => setEditingRoom(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2 text-sm transition">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${room.status === "active" ? "bg-emerald-400" : "bg-gray-300"}`}/>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{room.name}</p>
                          <p className="text-xs text-gray-400">GH₵{Number(room.price).toLocaleString()} / {room.billing} · {room.total - room.occupied}/{room.total} free</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRoomStatus(room.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${room.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"}`}>
                          {room.status === "active" ? "Active" : "Paused"}
                        </button>
                        <button onClick={() => setEditingRoom({...room})}
                          className="text-xs text-[#1E40AF] font-semibold hover:underline">Edit</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📸 Hostel Images</h2>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#1E40AF] transition">
              <span className="text-3xl block mb-2">🖼️</span>
              <p className="font-semibold text-gray-600 text-sm">Drop images here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB · max 10 images</p>
              <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png"/>
            </label>
          </div>
        </>
      )}
    </div>
  );
}

// ─── BOOKINGS TAB ─────────────────────────────────────────────────────────────
function BookingsTab({ bookings, setBookings }) {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = filter === "All" ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = (id, status) => {
    setBookings(prev => prev.map(b => b.id === id ? {...b, status} : b));
    if (selected?.id === id) setSelected(prev => ({...prev, status}));
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-2 flex-wrap">
        {["All","Pending","Approved","Rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? "bg-[#1E40AF] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f}
            <span className="ml-1.5 text-xs">
              ({f === "All" ? bookings.length : bookings.filter(b => b.status === f).length})
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Booking list */}
        <div className="flex-1 space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No {filter.toLowerCase()} bookings.</p>
            </div>
          )}
          {filtered.map(b => (
            <button key={b.id} onClick={() => setSelected(b)}
              className={`w-full bg-white rounded-2xl border shadow-sm p-4 text-left transition-all hover:border-[#1E40AF] ${selected?.id === b.id ? "border-[#1E40AF] ring-1 ring-[#1E40AF]/20" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold flex-shrink-0">{b.student.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-gray-800">{b.student}</p>
                    <p className="text-xs text-gray-400">{b.room} · {b.hostel}</p>
                    <p className="text-xs text-gray-400">{b.date}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 ${STATUS_STYLES[b.status]}`}>{b.status}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Booking Details</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-lg">{selected.student.charAt(0)}</div>
                <div>
                  <p className="font-bold text-gray-800">{selected.student}</p>
                  <p className="text-xs text-gray-400">{selected.email}</p>
                </div>
              </div>
              {[["Phone",selected.phone],["Room",selected.room],["Hostel",selected.hostel],["Date",selected.date]].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-semibold text-gray-700 text-right max-w-[55%]">{v}</span>
                </div>
              ))}
              {selected.message && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Student's message</p>
                  <p className="text-sm text-gray-700">"{selected.message}"</p>
                </div>
              )}
              <span className={`block text-center text-sm font-bold px-3 py-1.5 rounded-xl border ${STATUS_STYLES[selected.status]}`}>{selected.status}</span>
              {selected.status === "Pending" && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateStatus(selected.id, "Approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl py-2.5 text-sm transition">
                    ✓ Approve
                  </button>
                  <button onClick={() => updateStatus(selected.id, "Rejected")}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm transition">
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MESSAGES TAB (Socket.io + REST) ────────────────────────────────────────
function MessagesTab({ user, conversations, setConversations }) {
  const [activeConv, setActiveConv] = useState(null);
  const [reply, setReply] = useState("");
  const bottomRef = useRef(null);
  const activeConvRef = useRef(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const conv = activeConv ? conversations.find(c => c.id === activeConv) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages?.length]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const onReceive = (msg) => {
      const me = String(user.id);
      const sid = String(msg.senderId);
      const rid = String(msg.receiverId);
      if (sid !== me && rid !== me) return;

      const partnerId = sid === me ? rid : sid;
      const isMine = sid === me;
      const fromBubble = isMine
        ? "host"
        : (msg.senderModel === "Host" ? "host" : "student");

      const bubble = {
        from: fromBubble,
        text: msg.body,
        time: "Just now",
        _id: msg._id,
      };

      setConversations((prev) => {
        const open = activeConvRef.current === partnerId;
        let found = false;
        const next = prev.map((c) => {
          if (String(c.id) !== partnerId) return c;
          found = true;
          return {
            ...c,
            lastMsg: msg.body,
            time: "Just now",
            unread: open ? 0 : (c.unread || 0) + (isMine ? 0 : 1),
            messages: open ? [...(c.messages || []), bubble] : (c.messages || []),
          };
        });
        if (!found) {
          return [...next, {
            id: partnerId,
            partnerId,
            student: msg.senderModel === "Student" ? "Student" : "Host",
            studentId: partnerId,
            partnerRole: msg.senderModel === "Student" ? "student" : "host",
            lastMsg: msg.body,
            time: "Just now",
            unread: isMine ? 0 : 1,
            messages: open ? [bubble] : [],
            hostelId: msg.hostelId,
          }];
        }
        return next;
      });
    };

    socket.on("message:receive", onReceive);
    return () => { socket.off("message:receive", onReceive); };
  }, [user?.id, setConversations]);

  const openConv = async (id) => {
    setActiveConv(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));

    if (!user?.id) return;
    try {
      const { data } = await messageAPI.conversation(id);
      const mapped = (data.messages || []).map((m) =>
        mapThreadMessage(m, user.id, user.role)
      );
      setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: mapped } : c));
      getSocket()?.emit("message:read", { senderId: id });
    } catch {
      /* keep list UI */
    }
  };

  const sendReply = () => {
    if (!reply.trim() || !activeConv || !user?.id) return;
    const c = conversations.find((x) => x.id === activeConv);
    if (!c) return;

    const receiverModel = c.partnerRole === "host" ? "Host" : "Student";
    const socket = getSocket();
    const body = reply.trim();
    setReply("");

    if (socket) {
      socket.emit(
        "message:send",
        {
          receiverId: c.partnerId || c.studentId || c.id,
          receiverModel,
          hostelId: c.hostelId || undefined,
          body,
        },
        (response) => {
          if (response?.error) return;
          const md = response?.message;
          if (!md) return;
          const newMsg = {
            from: "host",
            text: md.body,
            time: "Just now",
            _id: md._id,
          };
          setConversations((prev) => prev.map((row) =>
            row.id === activeConv
              ? {
                ...row,
                messages: [...(row.messages || []), newMsg],
                lastMsg: body,
                time: "Just now",
              }
              : row
          ));
        }
      );
    } else {
      messageAPI.send({
        receiverId: c.partnerId || c.studentId || c.id,
        receiverModel,
        hostelId: c.hostelId || undefined,
        body,
      }).then(({ data }) => {
        const m = data?.data;
        if (!m) return;
        const newMsg = {
          from: "host",
          text: m.body,
          time: "Just now",
          _id: m._id,
        };
        setConversations((prev) => prev.map((row) =>
          row.id === activeConv
            ? { ...row, messages: [...(row.messages || []), newMsg], lastMsg: body, time: "Just now" }
            : row
        ));
      }).catch(() => {});
    }
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{height: 560}}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${activeConv ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-gray-100 flex-shrink-0`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Messages</h2>
            {totalUnread > 0 && <span className="bg-[#F59E0B] text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnread} new</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(c => (
              <button key={c.id} onClick={() => openConv(c.id)}
                className={`flex items-start gap-3 p-4 w-full text-left border-b border-gray-50 transition hover:bg-gray-50 ${activeConv === c.id ? "bg-blue-50" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.student.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-800 truncate">{c.student}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{c.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat pane */}
        <div className={`${activeConv ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {conv ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white">
                <button onClick={() => setActiveConv(null)} className="md:hidden text-gray-400 hover:text-gray-600 mr-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">{conv.student.charAt(0)}</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{conv.student}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"/>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {conv.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "host" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      msg.from === "host"
                        ? "bg-[#1E40AF] text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.from === "host" ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}/>
              </div>

              {/* Reply bar */}
              <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                />
                <button onClick={sendReply}
                  className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-1.5">
                  Send
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <span className="text-5xl mb-3">💬</span>
              <p className="font-semibold text-gray-500">Select a conversation</p>
              <p className="text-sm mt-1">Choose a message thread from the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [profile, setProfile] = useState({ fullName: MOCK_HOST.name, email: MOCK_HOST.email, phone: MOCK_HOST.phone });
  const [passwords, setPasswords] = useState({ current:"", newP:"", confirm:"" });
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Profile Settings</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-extrabold text-2xl">M</div>
          <div>
            <button className="text-sm text-[#1E40AF] font-semibold hover:underline">Change Photo</button>
            <p className="text-xs text-gray-400 mt-0.5">JPG or PNG, max 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["Full Name","fullName","Martha Adasi"],["Email","email","martha@gmail.com"],["Phone","phone","0544862114"]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={profile[k]} placeholder={ph} onChange={e => setProfile(p => ({...p, [k]: e.target.value}))}/>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave}
            className={`font-semibold rounded-xl px-6 py-2.5 text-sm transition ${saved ? "bg-emerald-600 text-white" : "bg-[#1E40AF] hover:bg-[#1e3a8a] text-white"}`}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Change Password</h2>
        <div className="space-y-4 max-w-sm">
          {[["Current Password","current"],["New Password","newP"],["Confirm New Password","confirm"]].map(([l,k]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
              <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={passwords[k]} onChange={e => setPasswords(p => ({...p, [k]: e.target.value}))}/>
            </div>
          ))}
          <button className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            Update Password
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="font-bold text-red-600 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign Out</h2>
        <p className="text-sm text-gray-400 mb-4">You'll need to sign in again to access your dashboard.</p>
        <button onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function HostDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [hostels, setHostels] = useState(INITIAL_HOSTELS);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "host" && parsed.role !== "admin") { router.push("/"); return; }
    setUser(parsed);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await messageAPI.inbox();
        if (cancelled) return;
        const rows = data.conversations || [];
        if (!rows.length) {
          setConversations([]);
          return;
        }
        const mapped = rows.map((row) => ({
          id: row.partnerId,
          partnerId: row.partnerId,
          student: row.partnerName || "User",
          studentId: row.partnerId,
          partnerRole: row.partnerRole || "student",
          lastMsg: row.latestMessage?.body || "",
          time: formatRelativeTime(row.latestMessage?.createdAt),
          unread: row.unreadCount || 0,
          messages: [],
          hostelId: row.latestMessage?.hostelId
            ? String(row.latestMessage.hostelId)
            : undefined,
        }));
        setConversations(mapped);
      } catch {
        if (!cancelled) setConversations(INITIAL_CONVERSATIONS);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleLogout = () => { disconnectSocket(); localStorage.clear(); router.push("/"); };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const pendingBookings = bookings.filter(b => b.status === "Pending").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Host</span>
          </div>

          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "bg-[#F59E0B] text-white" : "text-gray-500 hover:bg-amber-50 hover:text-amber-700"}`}>
                <span style={{fontSize:"13px"}}>{tab.icon}</span>
                {tab.label}
                {tab.id === "messages" && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{totalUnread}</span>
                )}
                {tab.id === "bookings" && pendingBookings > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingBookings}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-[#1E40AF] font-medium transition">Browse site</Link>
            <div className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-bold text-sm">M</div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100 bg-white">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === tab.id ? "border-[#F59E0B] text-[#F59E0B]" : "border-transparent text-gray-400"}`}>
              {tab.icon} {tab.label}
              {tab.id === "messages" && totalUnread > 0 && <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{totalUnread}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "overview"  && <OverviewTab  hostels={hostels} bookings={bookings} conversations={conversations} setActiveTab={setActiveTab}/>}
        {activeTab === "hostels"   && <MyHostelsTab  hostels={hostels} setHostels={setHostels} rooms={rooms} setRooms={setRooms}/>}
        {activeTab === "bookings"  && <BookingsTab   bookings={bookings} setBookings={setBookings}/>}
        {activeTab === "messages"  && <MessagesTab user={user} conversations={conversations} setConversations={setConversations}/>}
        {activeTab === "settings"  && <SettingsTab/>}
      </main>
    </div>
  );
}