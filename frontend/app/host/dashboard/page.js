"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { host as hostAPI, getUser, clearAuth } from "../../lib/api";

const TABS = [
  { id:"overview",  label:"Overview",   icon:"🏠" },
  { id:"hostels",   label:"My Hostels", icon:"🏢" },
  { id:"bookings",  label:"Bookings",   icon:"📋" },
  { id:"messages",  label:"Messages",   icon:"💬" },
  { id:"payments",  label:"Payments",   icon:"💰" },
  { id:"settings",  label:"Settings",   icon:"⚙️" },
];

const STATUS_COLORS = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

function Spinner() { return <div className="w-7 h-7 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mx-auto"/>; }
function Empty({ icon, title, sub }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <span className="text-5xl block mb-3">{icon}</span>
      <p className="font-semibold text-gray-600">{title}</p>
      {sub && <p className="text-sm mt-1">{sub}</p>}
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewTab({ dashData, setActiveTab, setInitialPartnerId }) {
  const { hostels, bookings, messages } = dashData;
  const pending  = bookings.filter(b => b.status === "pending").length;
  const unread   = messages.filter(m => !m.read && m.receiverModel === "Host").length;
  const views    = hostels.reduce((s,h) => s + (h.viewsCount||0), 0);
  const approved = hostels.filter(h => h.status === "approved").length;
  const pendingH = hostels.filter(h => h.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="bg-[#1e3a8a] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right,#F59E0B,transparent)"}}/>
        <p className="text-blue-200 text-sm">Host Dashboard</p>
        <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Welcome back</h1>
        <p className="text-blue-200 text-sm mt-1">
          {pending > 0 && <><span className="text-[#F59E0B] font-bold">{pending} booking request{pending !== 1 ? "s" : ""}</span> pending</>}
          {pending > 0 && unread > 0 && " · "}
          {unread > 0 && <><span className="text-[#F59E0B] font-bold">{unread} unread message{unread !== 1 ? "s" : ""}</span></>}
          {pending === 0 && unread === 0 && <span className="text-emerald-300">All caught up! ✓</span>}
          {pendingH > 0 && <> · <span className="text-amber-300">{pendingH} hostel{pendingH !== 1 ? "s" : ""} awaiting admin approval</span></>}
        </p>
        <Link href="/host/add-hostel" className="mt-4 inline-block bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
          + Add New Hostel
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:"Total Views", v:views, icon:"👁️" },
          { l:"Live Hostels", v:approved, icon:"🏢" },
          { l:"All Bookings", v:bookings.length, icon:"📋" },
          { l:"Pending Bookings", v:pending, icon:"⏳", hi:pending > 0 },
        ].map(s => (
          <div key={s.l} className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition ${s.hi ? "border-amber-200" : "border-gray-100"}`}
            onClick={() => s.hi && setActiveTab("bookings")}>
            <span style={{fontSize:"22px"}}>{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-2 ${s.hi ? "text-amber-600" : "text-gray-800"}`}>{s.v}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Recent Bookings</h2>
            <button onClick={() => setActiveTab("bookings")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
          </div>
          {bookings.length === 0 ? <Empty icon="📋" title="No bookings yet"/> : bookings.slice(0,3).map(b => (
            <div key={b._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xs font-bold">
                  {b.studentId?.firstName?.charAt(0) || "S"}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{b.studentId?.firstName} {b.studentId?.lastName}</p>
                  <p className="text-xs text-gray-400">{b.roomId?.name || "Room"}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${STATUS_COLORS[b.status]}`}>{b.status}</span>
            </div>
          ))}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Recent Messages</h2>
            <button onClick={() => setActiveTab("messages")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
          </div>
          {messages.length === 0 ? <Empty icon="💬" title="No messages yet"/> : messages.slice(0,3).map(m => (
            <div key={m._id} onClick={() => { setInitialPartnerId(m.senderId._id); setActiveTab("messages"); }} className={`flex items-start gap-3 p-3 rounded-xl mb-2 cursor-pointer ${!m.read ? "bg-amber-50" : "bg-gray-50"} hover:bg-gray-100 transition`}>
              <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(m.senderId?.firstName || m.senderId?.fullName || "S").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800">
                  {m.senderId?.firstName ? `${m.senderId.firstName} ${m.senderId.lastName}` : m.senderId?.fullName || "Student"}
                </p>
                <p className="text-xs text-gray-500 truncate">{m.body}</p>
              </div>
              {!m.read && <div className="w-2 h-2 bg-[#F59E0B] rounded-full flex-shrink-0 mt-1.5"/>}
            </div>
          ))}
        </div>
      </div>

      {/* Hostel status list */}
      {hostels.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">My Hostels</h2>
            <button onClick={() => setActiveTab("hostels")} className="text-xs text-[#1E40AF] font-semibold hover:underline">Manage</button>
          </div>
          <div className="space-y-2">
            {hostels.map(h => (
              <div key={h._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{h.name}</p>
                  <p className="text-xs text-gray-400">{h.location} · GH₵{h.priceFrom?.toLocaleString()}/yr · {h.viewsCount} views</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[h.status]}`}>{h.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MY HOSTELS ────────────────────────────────────────────────────────────────
function MyHostelsTab({ hostels, rooms, reload }) {
  const [selectedId, setSelectedId] = useState(hostels[0]?._id || null);
  const [editingHostel, setEditingHostel] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name:"", price:"", billing:"Yearly", capacity:1 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3000); };

  const hostel = hostels.find(h => h._id === selectedId);
  const hostelRooms = rooms.filter(r => r.hostelId === selectedId || r.hostelId?._id === selectedId || r.hostelId?.toString() === selectedId);

  const saveHostelEdit = async () => {
    setSaving(true);
    try {
      await hostAPI.updateHostel(editingHostel._id, {
        name: editingHostel.name,
        location: editingHostel.location,
        gender: editingHostel.gender,
        campusDistance: editingHostel.campusDistance,
        landmark: editingHostel.landmark,
        description: editingHostel.description,
      });
      setEditingHostel(null);
      showMsg("Hostel updated.");
      reload();
    } catch(e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const saveRoom = async () => {
    setSaving(true);
    try {
      await hostAPI.updateRoom(editingRoom._id, {
        name: editingRoom.name,
        price: Number(editingRoom.price),
        billing: editingRoom.billing,
        capacity: Number(editingRoom.capacity),
        status: editingRoom.status,
      });
      setEditingRoom(null);
      showMsg("Room updated.");
      reload();
    } catch(e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const addRoom = async () => {
    if (!newRoom.name || !newRoom.price) return;
    setSaving(true);
    try {
      await hostAPI.addRoom({ hostelId: selectedId, name: newRoom.name, price: Number(newRoom.price), billing: newRoom.billing, capacity: Number(newRoom.capacity) });
      setNewRoom({ name:"", price:"", billing:"Yearly", capacity:1 });
      setShowAddRoom(false);
      showMsg("Room added.");
      reload();
    } catch(e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const toggleRoomStatus = async (room) => {
    const newStatus = room.status === "available" ? "inactive" : "available";
    try {
      await hostAPI.updateRoom(room._id, { status: newStatus });
      showMsg(`Room ${newStatus === "available" ? "activated" : "paused"}.`);
      reload();
    } catch(e) { showMsg(e.message, false); }
  };

  if (hostels.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
      <span className="text-5xl block">🏠</span>
      <h2 className="font-bold text-gray-700 text-lg">No hostels yet</h2>
      <p className="text-gray-400 text-sm">Add your hostel and submit it for admin review.</p>
      <Link href="/host/add-hostel" className="inline-block bg-[#F59E0B] hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl transition">
        + Add Your First Hostel
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.m}</div>}

      {/* Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {hostels.map(h => (
          <button key={h._id} onClick={() => setSelectedId(h._id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedId===h._id ? "bg-[#1E40AF] text-white border-[#1E40AF]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"}`}>
            {h.name}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${h.status==="approved" ? "bg-emerald-100 text-emerald-700" : h.status==="pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
              {h.status}
            </span>
          </button>
        ))}
        <Link href="/host/add-hostel" className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all">
          + Add Hostel
        </Link>
      </div>

      {hostel && (
        <>
          {/* Status banner for pending */}
          {hostel.status === "pending" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-bold text-amber-800">Under Review</p>
                <p className="text-sm text-amber-700 mt-0.5">This hostel is pending admin approval. You'll be notified once it's approved and goes live on the platform.</p>
              </div>
            </div>
          )}
          {hostel.status === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-bold text-red-700">Rejected</p>
                {hostel.rejectionReason && <p className="text-sm text-red-600 mt-0.5">Reason: {hostel.rejectionReason}</p>}
                <p className="text-sm text-red-600 mt-1">Please contact support or submit a new hostel with the required documents.</p>
              </div>
            </div>
          )}

          {/* Hostel info card */}
          {editingHostel ? (
            <div className="bg-white rounded-2xl border-2 border-[#1E40AF] shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800">Edit Hostel Info</h2>
                <button onClick={() => setEditingHostel(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              {[["Hostel Name","name"],["Location","location"],["Nearest Landmark","landmark"],["Distance to Campus","campusDistance"]].map(([l,k]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editingHostel[k]||""} onChange={e => setEditingHostel(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gender Policy</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  value={editingHostel.gender} onChange={e => setEditingHostel(p=>({...p,gender:e.target.value}))}>
                  {["Mixed","Male Only","Female Only"].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-24 resize-none"
                  value={editingHostel.description||""} onChange={e => setEditingHostel(p=>({...p,description:e.target.value}))}/>
              </div>
              <div className="flex gap-3">
                <button onClick={saveHostelEdit} disabled={saving} className="flex-1 bg-[#1E40AF] text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-[#1e3a8a] disabled:opacity-60 transition">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditingHostel(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm transition">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">{hostel.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{hostel.location} · {hostel.gender} · {hostel.campusDistance}</p>
                  {hostel.landmark && <p className="text-xs text-gray-400 mt-0.5">Near {hostel.landmark}</p>}
                </div>
                <button onClick={() => setEditingHostel({...hostel})}
                  className="text-xs text-[#1E40AF] font-semibold border border-[#1E40AF] px-3 py-1.5 rounded-xl hover:bg-blue-50 transition">
                  ✏️ Edit
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">{hostel.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[["Price from",`GH₵${hostel.priceFrom?.toLocaleString()}`],["Views",hostel.viewsCount||0],["Rating",hostel.hostRating||"N/A"]].map(([l,v]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-extrabold text-[#1E40AF]">{v}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Room Types</h2>
              <button onClick={() => setShowAddRoom(!showAddRoom)} className="text-xs bg-[#1E40AF] text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-[#1e3a8a] transition">+ Add Room</button>
            </div>

            {showAddRoom && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100 space-y-3">
                <p className="text-sm font-bold text-[#1E40AF]">New Room Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["name","Room Name","text","e.g. 2 in a Room"],["price","Price (GH₵)","number","3000"]].map(([k,l,t,ph]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                      <input type={t} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder={ph} value={newRoom[k]} onChange={e => setNewRoom(p=>({...p,[k]:e.target.value}))}/>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Billing</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      value={newRoom.billing} onChange={e => setNewRoom(p=>({...p,billing:e.target.value}))}>
                      <option>Yearly</option><option>Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Number of Rooms</label>
                    <input type="number" min={1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={newRoom.capacity} onChange={e => setNewRoom(p=>({...p,capacity:e.target.value}))}/>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addRoom} disabled={saving} className="flex-1 bg-[#1E40AF] text-white font-semibold rounded-xl py-2 text-sm hover:bg-[#1e3a8a] disabled:opacity-60 transition">
                    {saving ? "Adding..." : "Add Room Type"}
                  </button>
                  <button onClick={() => setShowAddRoom(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2 text-sm transition">Cancel</button>
                </div>
              </div>
            )}

            {hostelRooms.length === 0 ? (
              <Empty icon="🛏️" title="No rooms added yet" sub="Add room types so students can see pricing."/>
            ) : hostelRooms.map(room => (
              <div key={room._id}>
                {editingRoom?._id === room._id ? (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      {[["name","Room Name"],["price","Price (GH₵)"]].map(([k,l]) => (
                        <div key={k}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
                          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={editingRoom[k]} onChange={e => setEditingRoom(p=>({...p,[k]:e.target.value}))}/>
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity</label>
                        <input type="number" min={1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          value={editingRoom.capacity} onChange={e => setEditingRoom(p=>({...p,capacity:Number(e.target.value)}))}/>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Billing</label>
                        <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                          value={editingRoom.billing} onChange={e => setEditingRoom(p=>({...p,billing:e.target.value}))}>
                          <option>Yearly</option><option>Semester</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveRoom} disabled={saving} className="flex-1 bg-[#1E40AF] text-white font-semibold rounded-xl py-2 text-sm hover:bg-[#1e3a8a] disabled:opacity-60 transition">
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={() => setEditingRoom(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold rounded-xl py-2 text-sm transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${room.status==="available" ? "bg-emerald-400" : "bg-gray-300"}`}/>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{room.name}</p>
                        <p className="text-xs text-gray-400">GH₵{Number(room.price).toLocaleString()} / {room.billing} · {room.capacity - room.currentOccupancy}/{room.capacity} available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRoomStatus(room)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${room.status==="available" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"}`}>
                        {room.status === "available" ? "Active" : "Paused"}
                      </button>
                      <button onClick={() => setEditingRoom({...room})} className="text-xs text-[#1E40AF] font-semibold hover:underline">Edit</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
function BookingsTab({ bookings, reload }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState(null);
  const showMsg = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3000); };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await hostAPI.updateBooking(id, status);
      showMsg(`Booking ${status}.`, status !== "rejected");
      if (selected?._id === id) setSelected(prev => ({...prev, status}));
      reload();
    } catch(e) { showMsg(e.message, false); }
    finally { setUpdating(false); }
  };

  return (
    <div className="space-y-4">
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.m}</div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-2 flex-wrap">
        {["all","pending","approved","rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${filter===f ? "bg-[#1E40AF] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f} ({f==="all" ? bookings.length : bookings.filter(b=>b.status===f).length})
          </button>
        ))}
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center"><Empty icon="📋" title={`No ${filter} bookings`}/></div>
          ) : filtered.map(b => (
            <button key={b._id} onClick={() => setSelected(b)}
              className={`w-full bg-white rounded-2xl border shadow-sm p-4 text-left transition-all hover:border-[#1E40AF] ${selected?._id===b._id ? "border-[#1E40AF] ring-1 ring-[#1E40AF]/20" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {b.studentId?.firstName?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{b.studentId?.firstName} {b.studentId?.lastName}</p>
                    <p className="text-xs text-gray-400">{b.roomId?.name || "Room"} · {new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 ${STATUS_COLORS[b.status]}`}>{b.status}</span>
              </div>
              {b.message && <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">"{b.message}"</p>}
            </button>
          ))}
        </div>

        {selected && (
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-20 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Booking Details</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-lg">
                    {selected.studentId?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{selected.studentId?.firstName} {selected.studentId?.lastName}</p>
                    <p className="text-xs text-gray-400">{selected.studentId?.email}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {[
                    ["Phone", selected.studentId?.phone],
                    ["Program", selected.studentId?.program],
                    ["Year", selected.studentId?.year],
                    ["Room", selected.roomId?.name || "Not specified"],
                    ["Price", selected.roomId?.price ? `GH₵${selected.roomId.price.toLocaleString()}` : "—"],
                    ["Date", new Date(selected.createdAt).toLocaleDateString()],
                  ].map(([l,v]) => v && (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-400">{l}</span>
                      <span className="font-semibold text-gray-700 text-right max-w-[55%]">{v}</span>
                    </div>
                  ))}
                </div>
                {selected.message && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-500 mb-1">Student's message</p>
                    <p className="text-sm text-gray-700 italic">"{selected.message}"</p>
                  </div>
                )}
                <span className={`block text-center text-sm font-bold px-3 py-1.5 rounded-xl border ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
                {selected.status === "pending" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateStatus(selected._id, "approved")} disabled={updating}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm transition flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      Approve
                    </button>
                    <button onClick={() => updateStatus(selected._id, "rejected")} disabled={updating}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm transition flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────
function MessagesTab({ hostId, initialPartnerId }) {
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadInbox = useCallback(async () => {
    try {
      const data = await hostAPI.messages();
      // Group by sender
      const seen = new Set();
      const convs = [];
      for (const m of (data.messages || [])) {
        const partner = m.senderId?._id === hostId ? m.receiverId : m.senderId;
        if (!partner || seen.has(partner._id)) continue;
        seen.add(partner._id);
        const unread = (data.messages||[]).filter(msg => msg.senderId?._id === partner._id && !msg.read).length;
        convs.push({
          partnerId: partner._id,
          partnerName: partner.firstName ? `${partner.firstName} ${partner.lastName}` : partner.fullName || "Student",
          latestMessage: m.body,
          latestTime: m.createdAt,
          unread,
        });
      }
      setConversations(convs);
    } catch { setConversations([]); }
  }, [hostId]);

  useEffect(() => { loadInbox(); }, [loadInbox]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [thread.length]);
  useEffect(() => {
    if (initialPartnerId && conversations) {
      const target = conversations.find(c => c.partnerId === initialPartnerId);
      if (target) openConv(target);
    }
  }, [initialPartnerId, conversations]);

  const openConv = async (conv) => {
    setActive(conv);
    try {
      const data = await hostAPI.conversation(conv.partnerId);
      setThread(data.messages || []);
      loadInbox();
    } catch { setThread([]); }
  };

  const send = async () => {
    if (!reply.trim() || !active || sending) return;
    setSending(true);
    try {
      await hostAPI.sendMessage({ receiverId: active.partnerId, receiverModel: "Student", body: reply.trim() });
      setReply("");
      const data = await hostAPI.conversation(active.partnerId);
      setThread(data.messages || []);
    } catch(e) { alert(e.message); }
    finally { setSending(false); }
  };

  if (conversations === null) return <div className="flex items-center justify-center py-20"><Spinner/></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{height:540}}>
      <div className="flex h-full">
        <div className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-gray-100 flex-shrink-0`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400"><p className="text-4xl mb-2">💬</p><p className="text-sm">No messages yet.</p></div>
            ) : conversations.map(c => (
              <button key={c.partnerId} onClick={() => openConv(c)}
                className={`flex items-start gap-3 p-4 w-full text-left border-b border-gray-50 hover:bg-gray-50 transition ${active?.partnerId===c.partnerId ? "bg-blue-50" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{c.partnerName?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{c.partnerName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.latestMessage}</p>
                </div>
                {c.unread > 0 && <span className="w-5 h-5 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {active ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="md:hidden text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">{active.partnerName?.charAt(0)}</div>
                <p className="font-bold text-gray-800 text-sm">{active.partnerName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {thread.map((msg, i) => {
                  const isMe = msg.senderModel === "Host";
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "bg-[#1E40AF] text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"}`}>
                        <p>{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>
              <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Type your reply..." value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && !e.shiftKey && (e.preventDefault(), send())}/>
                <button onClick={send} disabled={sending||!reply.trim()}
                  className="bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <span className="text-5xl mb-3">💬</span>
              <p className="font-semibold text-gray-500">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
function PaymentsTab({ hostProfile, reload }) {
  const [form, setForm] = useState({
    payoutMethod: hostProfile.payoutMethod || "",
    bankName: hostProfile.bankName || "",
    accountNumber: hostProfile.accountNumber || "",
    accountName: hostProfile.accountName || "",
    momoNetwork: hostProfile.momoNetwork || "",
    momoNumber: hostProfile.momoNumber || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const showMsg = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3000); };

  const save = async () => {
    setSaving(true);
    try {
      await hostAPI.updateProfile(form);
      showMsg("Payment information saved.");
      reload();
    } catch(e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.m}</div>}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl">ℹ️</span>
        <div>
          <p className="text-sm font-bold text-[#1E40AF]">Payout Structure</p>
          <p className="text-xs text-gray-600 mt-0.5">When a student pays, <strong>5%</strong> is kept by HostelHub as a platform fee. You receive <strong>95%</strong> directly to your account below.</p>
          <p className="text-xs text-gray-500 mt-1">Example: Student pays GH₵3,000 → You receive GH₵2,850</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💳 Payout Account</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Preferred Method</label>
          <div className="grid grid-cols-2 gap-3">
            {[["bank","🏦 Bank Transfer"],["momo","📱 Mobile Money"]].map(([v,l]) => (
              <button key={v} onClick={() => setForm(p=>({...p,payoutMethod:v}))}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${form.payoutMethod===v ? "border-[#1E40AF] bg-blue-50 text-[#1E40AF]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {form.payoutMethod === "bank" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Name *</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.bankName} onChange={e => setForm(p=>({...p,bankName:e.target.value}))}>
                <option value="">Select bank...</option>
                {["GCB Bank","Absa Bank","Ecobank","Stanbic Bank","Fidelity Bank","Access Bank","Agricultural Development Bank","Cal Bank","Consolidated Bank","National Investment Bank"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Account Number *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your account number" value={form.accountNumber} onChange={e => setForm(p=>({...p,accountNumber:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Account Name *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Full name on account" value={form.accountName} onChange={e => setForm(p=>({...p,accountName:e.target.value}))}/>
            </div>
          </div>
        )}

        {form.payoutMethod === "momo" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Network *</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.momoNetwork} onChange={e => setForm(p=>({...p,momoNetwork:e.target.value}))}>
                <option value="">Select network...</option>
                <option>MTN MoMo</option><option>Vodafone Cash</option><option>AirtelTigo Money</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">MoMo Number *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="0244xxxxxx" value={form.momoNumber} onChange={e => setForm(p=>({...p,momoNumber:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Account Name *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Name registered on MoMo" value={form.accountName} onChange={e => setForm(p=>({...p,accountName:e.target.value}))}/>
            </div>
          </div>
        )}

        {form.payoutMethod && (
          <button onClick={save} disabled={saving}
            className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold rounded-xl py-3 transition">
            {saving ? "Saving..." : "Save Payment Information"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsTab({ hostProfile, reload, onLogout }) {
  const [form, setForm] = useState({ fullName: hostProfile.fullName||"", email: hostProfile.email||"", phone: hostProfile.phone||"" });
  const [passwords, setPasswords] = useState({ current:"", newP:"", confirm:"" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const showMsg = (m,ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3000); };
  const showPwMsg = (m,ok=true) => { setPwMsg({m,ok}); setTimeout(()=>setPwMsg(null),3000); };

  const saveProfile = async () => {
    setSaving(true);
    try { await hostAPI.updateProfile({ fullName:form.fullName, phone:form.phone }); showMsg("Profile saved."); reload(); }
    catch(e) { showMsg(e.message,false); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current) { showPwMsg("Enter your current password",false); return; }
    if (passwords.newP.length < 8) { showPwMsg("Min 8 characters",false); return; }
    if (passwords.newP !== passwords.confirm) { showPwMsg("Passwords don't match",false); return; }
    setPwSaving(true);
    try { await hostAPI.changePassword({ currentPassword:passwords.current, newPassword:passwords.newP }); setPasswords({current:"",newP:"",confirm:""}); showPwMsg("Password updated."); }
    catch(e) { showPwMsg(e.message,false); }
    finally { setPwSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Profile Settings</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-extrabold text-2xl">
            {form.fullName?.charAt(0)||"H"}
          </div>
          <div>
            <p className="font-bold text-gray-800">{form.fullName}</p>
            <p className="text-xs text-gray-400">{form.email}</p>
          </div>
        </div>
        {msg && <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.m}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={form.fullName} onChange={e => setForm(p=>({...p,fullName:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email (read-only)</label>
            <input className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" value={form.email} readOnly/>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Change Password</h2>
        {pwMsg && <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${pwMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{pwMsg.m}</div>}
        <div className="space-y-4 max-w-sm">
          {[["Current Password","current"],["New Password","newP"],["Confirm New Password","confirm"]].map(([l,k]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
              <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={passwords[k]} onChange={e => setPasswords(p=>({...p,[k]:e.target.value}))}/>
            </div>
          ))}
          <button onClick={changePassword} disabled={pwSaving} className="bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            {pwSaving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="font-bold text-red-600 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign Out</h2>
        <p className="text-sm text-gray-400 mb-4">You'll be signed out on this device.</p>
        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">Sign Out</button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HostDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashData, setDashData] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialPartnerId, setInitialPartnerId] = useState(searchParams.get("partnerId") || null);

  const loadData = useCallback(async () => {
    try {
      const [profileData, myData] = await Promise.all([hostAPI.me(), hostAPI.myData()]);
      setHostProfile(profileData.host);
      setDashData({
        hostels: myData.hostels || [],
        rooms:   myData.rooms   || [],
        bookings:myData.bookings|| [],
        messages:myData.messages|| [],
      });
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "host") { router.push("/login"); return; }
    loadData();
  }, [loadData, router]);

  const handleLogout = async () => {
    clearAuth();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><Spinner/></div>
  );

  if (!dashData || !hostProfile) return null;

  const totalUnread = dashData.messages.filter(m => !m.read && m.receiverModel === "Host").length;
  const pendingBookings = dashData.bookings.filter(b => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Host</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab===tab.id ? "bg-[#F59E0B] text-white" : "text-gray-500 hover:bg-amber-50 hover:text-amber-700"}`}>
                <span style={{fontSize:"13px"}}>{tab.icon}</span>{tab.label}
                {tab.id==="messages" && totalUnread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{totalUnread}</span>}
                {tab.id==="bookings" && pendingBookings > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{pendingBookings}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-[#1E40AF] font-medium transition">Browse</Link>
            <div className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center text-white font-bold text-sm cursor-pointer" onClick={() => setActiveTab("settings")}>
              {hostProfile.fullName?.charAt(0)||"H"}
            </div>
          </div>
        </div>
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100 bg-white">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab===tab.id ? "border-[#F59E0B] text-[#F59E0B]" : "border-transparent text-gray-400"}`}>
              {tab.icon}{tab.label}
              {tab.id==="messages" && totalUnread > 0 && <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalUnread}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "overview"  && <OverviewTab  dashData={dashData} setActiveTab={setActiveTab} setInitialPartnerId={setInitialPartnerId}/>}
        {activeTab === "hostels"   && <MyHostelsTab hostels={dashData.hostels} rooms={dashData.rooms} reload={loadData}/>}
        {activeTab === "bookings"  && <BookingsTab  bookings={dashData.bookings} reload={loadData}/>}
        {activeTab === "messages"  && <MessagesTab  hostId={hostProfile._id} initialPartnerId={initialPartnerId}/>}
        {activeTab === "payments"  && <PaymentsTab  hostProfile={hostProfile} reload={loadData}/>}
        {activeTab === "settings"  && <SettingsTab  hostProfile={hostProfile} reload={loadData} onLogout={handleLogout}/>}
      </main>
    </div>
  );
}