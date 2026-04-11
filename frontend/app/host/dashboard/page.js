"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkModeButton } from "../../lib/useDarkMode";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function api(path, method = "GET", body = null) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const TABS = [
  { id: "overview",      label: "Overview",       icon: "🏠" },
  { id: "hostels",       label: "My Hostels",     icon: "🏢" },
  { id: "reservations",  label: "Reservations",   icon: "📋" },
  { id: "messages",      label: "Messages",       icon: "💬" },
  { id: "settings",      label: "Settings",       icon: "⚙️" },
];

const RES_STATUS = {
  pending:   { label: "Pending",         cls: "status-pending"  },
  scheduled: { label: "Meetup Scheduled",cls: "status-approved" },
  confirmed: { label: "Confirmed",       cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full" },
  cancelled: { label: "Cancelled",       cls: "status-rejected" },
};

function Spinner() {
  return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/></div>;
}
function Empty({ icon, title, sub }) {
  return (
    <div className="text-center py-14 px-4">
      <span className="text-5xl block mb-3">{icon}</span>
      <p className="font-semibold text-[--text-primary]">{title}</p>
      {sub && <p className="text-sm text-[--text-muted] mt-1">{sub}</p>}
    </div>
  );
}
function Card({ children, className = "" }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewTab({ hostels, reservations, messages, hostProfile, setActiveTab }) {
  const pendingRes = reservations.filter(r => r.status === "pending").length;
  const scheduledRes = reservations.filter(r => r.status === "scheduled").length;
  const unread = messages.filter(m => !m.read && m.receiverModel === "Host").length;
  const views = hostels.reduce((s, h) => s + (h.viewsCount || 0), 0);
  const approvedHostels = hostels.filter(h => h.status === "approved").length;
  const pendingHostels = hostels.filter(h => h.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="hero-gradient rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{ background: "radial-gradient(circle at right,#F59E0B,transparent)" }} />
        <p className="text-blue-200/80 text-sm">Host Dashboard 🏠</p>
        <h1 className="text-2xl font-extrabold mt-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Welcome, {hostProfile.fullName?.split(" ")[0]}
        </h1>
        <p className="text-blue-200/80 text-sm mt-1">
          {pendingRes > 0 && <><span className="text-[#F59E0B] font-bold">{pendingRes} new reservation{pendingRes !== 1 ? "s" : ""}</span> pending admin scheduling</>}
          {pendingRes > 0 && (unread > 0) && " · "}
          {unread > 0 && <><span className="text-[#F59E0B] font-bold">{unread} unread message{unread !== 1 ? "s" : ""}</span></>}
          {pendingRes === 0 && unread === 0 && <span className="text-emerald-300">All caught up! ✓</span>}
          {pendingHostels > 0 && <> · <span className="text-amber-300">{pendingHostels} hostel{pendingHostels !== 1 ? "s" : ""} awaiting admin approval</span></>}
        </p>
        <Link href="/host/add-hostel" className="mt-4 inline-block btn-gold text-sm px-5 py-2.5">
          + Add New Hostel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total Views",        v: views,          icon: "👁️" },
          { l: "Live Hostels",       v: approvedHostels, icon: "🏢" },
          { l: "Total Reservations", v: reservations.length, icon: "📋" },
          { l: "Pending Meetup",     v: pendingRes,     icon: "⏳", hi: pendingRes > 0 },
        ].map(s => (
          <Card key={s.l} className={`p-4 cursor-pointer hover:shadow-lg transition ${s.hi ? "border border-amber-300 dark:border-amber-700" : ""}`}
            onClick={() => s.hi && setActiveTab("reservations")}>
            <span style={{ fontSize: "20px" }}>{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-2 ${s.hi ? "text-amber-500" : "text-[--text-primary]"}`}>{s.v}</p>
            <p className="text-xs text-[--text-muted] mt-0.5">{s.l}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent reservations */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[--text-primary]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Recent Reservations</h2>
            <button onClick={() => setActiveTab("reservations")} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">View all</button>
          </div>
          {reservations.length === 0
            ? <Empty icon="📋" title="No reservations yet" sub="When students reserve your hostel, they'll appear here."/>
            : reservations.slice(0, 3).map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-white/30 dark:bg-white/05 rounded-xl mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)" }}>
                    {r.studentId?.firstName?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[--text-primary]">{r.studentId?.firstName} {r.studentId?.lastName}</p>
                    <p className="text-xs text-[--text-muted]">{r.roomId?.name} · {r.numberOfPeople} person{r.numberOfPeople !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <span className={RES_STATUS[r.status]?.cls}>{RES_STATUS[r.status]?.label}</span>
              </div>
            ))
          }
        </Card>

        {/* Recent messages */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[--text-primary]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Recent Messages</h2>
            <button onClick={() => setActiveTab("messages")} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">View all</button>
          </div>
          {messages.length === 0
            ? <Empty icon="💬" title="No messages yet"/>
            : messages.slice(0, 3).map(m => (
              <div key={m._id} className={`flex items-start gap-3 p-3 rounded-xl mb-2 ${!m.read ? "bg-amber-50/60 dark:bg-amber-900/20" : "bg-white/20 dark:bg-white/05"}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)" }}>
                  {(m.senderId?.firstName || "S").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[--text-primary]">
                    {m.senderId?.firstName ? `${m.senderId.firstName} ${m.senderId.lastName}` : "Student"}
                  </p>
                  <p className="text-xs text-[--text-muted] truncate">{m.body}</p>
                </div>
                {!m.read && <div className="w-2 h-2 bg-[#F59E0B] rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            ))
          }
        </Card>
      </div>

      {/* Hostel status list */}
      {hostels.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[--text-primary]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>My Hostels</h2>
            <button onClick={() => setActiveTab("hostels")} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">Manage</button>
          </div>
          <div className="space-y-2">
            {hostels.map(h => (
              <div key={h._id} className="flex items-center justify-between p-3 bg-white/20 dark:bg-white/05 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-[--text-primary]">{h.name}</p>
                  <p className="text-xs text-[--text-muted]">{h.location} · GH₵{h.priceFrom?.toLocaleString()}/yr · {h.viewsCount || 0} views</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  h.status === "approved" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                  : h.status === "pending" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200"
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200"
                }`}>{h.status}</span>
              </div>
            ))}
          </div>
        </Card>
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
  const [newRoom, setNewRoom] = useState({ name: "", price: "", billing: "Yearly", totalRooms: 1 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const showMsg = (m, ok = true) => { setMsg({ m, ok }); setTimeout(() => setMsg(null), 3000); };

  const hostel = hostels.find(h => h._id === selectedId);
  const hostelRooms = rooms.filter(r => {
    const hid = r.hostelId?._id || r.hostelId;
    return hid?.toString() === selectedId;
  });

  const saveHostelEdit = async () => {
    setSaving(true);
    try {
      await api(`/api/hosts/hostels/${editingHostel._id}`, "PUT", {
        name: editingHostel.name, location: editingHostel.location,
        gender: editingHostel.gender, campusDistance: editingHostel.campusDistance,
        landmark: editingHostel.landmark, description: editingHostel.description,
      });
      setEditingHostel(null); showMsg("Hostel updated."); reload();
    } catch (e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const saveRoom = async () => {
    setSaving(true);
    try {
      await api(`/api/hosts/rooms/${editingRoom._id}`, "PUT", {
        name: editingRoom.name, price: Number(editingRoom.price),
        billing: editingRoom.billing, capacity: Number(editingRoom.capacity || editingRoom.totalRooms),
      });
      setEditingRoom(null); showMsg("Room updated."); reload();
    } catch (e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const addRoom = async () => {
    if (!newRoom.name || !newRoom.price) return;
    setSaving(true);
    try {
      await api("/api/hosts/rooms", "POST", {
        hostelId: selectedId, name: newRoom.name,
        price: Number(newRoom.price), billing: newRoom.billing,
        capacity: Number(newRoom.totalRooms),
      });
      setNewRoom({ name: "", price: "", billing: "Yearly", totalRooms: 1 });
      setShowAddRoom(false); showMsg("Room added."); reload();
    } catch (e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const toggleRoomStatus = async (room) => {
    const newStatus = room.status === "available" ? "inactive" : "available";
    try { await api(`/api/hosts/rooms/${room._id}`, "PUT", { status: newStatus }); showMsg(`Room ${newStatus === "available" ? "activated" : "paused"}.`); reload(); }
    catch (e) { showMsg(e.message, false); }
  };

  if (hostels.length === 0) return (
    <Card className="p-12 text-center space-y-4">
      <span className="text-5xl block">🏠</span>
      <h2 className="font-bold text-[--text-primary] text-lg">No hostels yet</h2>
      <p className="text-[--text-muted] text-sm">Submit your hostel for admin review.</p>
      <Link href="/host/add-hostel" className="inline-block btn-gold px-6 py-3 text-sm">+ Add Your First Hostel</Link>
    </Card>
  );

  const inputCls = "w-full border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/05 rounded-xl px-4 py-2.5 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-[--text-muted]";

  return (
    <div className="space-y-5">
      {msg && <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200" : "bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200"}`}>{msg.m}</div>}

      {/* Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {hostels.map(h => (
          <button key={h._id} onClick={() => setSelectedId(h._id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${selectedId === h._id ? "text-white border-transparent" : "border-white/30 dark:border-white/10 text-[--text-secondary] hover:border-[#1E40AF]/50"}`}
            style={selectedId === h._id ? { background: "linear-gradient(135deg,#1E40AF,#2563EB)" } : {}}>
            {h.name}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${h.status === "approved" ? "bg-emerald-100 text-emerald-700" : h.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{h.status}</span>
          </button>
        ))}
        <Link href="/host/add-hostel" className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-white/30 dark:border-white/15 text-[--text-muted] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all">
          + Add Hostel
        </Link>
      </div>

      {hostel && (
        <>
          {hostel.status === "pending" && (
            <div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300">Under Admin Review</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Your hostel is pending approval. You'll be notified once it goes live.</p>
              </div>
            </div>
          )}
          {hostel.status === "rejected" && (
            <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-bold text-red-700 dark:text-red-400">Rejected</p>
                {hostel.rejectionReason && <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">Reason: {hostel.rejectionReason}</p>}
              </div>
            </div>
          )}

          {/* Hostel info */}
          {editingHostel ? (
            <Card className="p-5 space-y-4 border-2 border-[#1E40AF]">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[--text-primary]">Edit Hostel Info</h2>
                <button onClick={() => setEditingHostel(null)} className="text-[--text-muted] text-xl hover:text-[--text-primary]">×</button>
              </div>
              {[["Hostel Name","name"],["Location","location"],["Nearest Landmark","landmark"],["Distance to Campus","campusDistance"]].map(([l, k]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
                  <input className={inputCls} value={editingHostel[k] || ""} onChange={e => setEditingHostel(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Description</label>
                <textarea className={`${inputCls} h-20 resize-none`} value={editingHostel.description || ""} onChange={e => setEditingHostel(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={saveHostelEdit} disabled={saving} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
                <button onClick={() => setEditingHostel(null)} className="flex-1 btn-ghost py-2.5 text-sm">Cancel</button>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-[--text-primary] text-lg">{hostel.name}</h2>
                  <p className="text-sm text-[--text-muted] mt-0.5">{hostel.location} · {hostel.gender} · {hostel.campusDistance}</p>
                  {hostel.landmark && <p className="text-xs text-[--text-muted] mt-0.5">📍 Near {hostel.landmark}</p>}
                </div>
                <button onClick={() => setEditingHostel({ ...hostel })}
                  className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold border border-[#1E40AF]/30 dark:border-blue-400/30 px-3 py-1.5 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition">
                  ✏️ Edit
                </button>
              </div>
              {hostel.description && <p className="text-sm text-[--text-secondary] mt-3 line-clamp-2">{hostel.description}</p>}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[["Price from", `GH₵${hostel.priceFrom?.toLocaleString() || 0}`], ["Views", hostel.viewsCount || 0], ["Rating", hostel.hostRating || "N/A"]].map(([l, v]) => (
                  <div key={l} className="bg-white/30 dark:bg-white/05 rounded-xl p-3 text-center">
                    <p className="text-base font-extrabold text-[#1E40AF] dark:text-blue-300">{v}</p>
                    <p className="text-xs text-[--text-muted] mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Rooms */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[--text-primary]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Room Types</h2>
              <button onClick={() => setShowAddRoom(!showAddRoom)} className="btn-primary text-xs px-3 py-1.5">+ Add Room</button>
            </div>

            {showAddRoom && (
              <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800 space-y-3">
                <p className="text-sm font-bold text-[#1E40AF] dark:text-blue-300">New Room Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["name", "Room Name", "text", "e.g. 2 in a Room"], ["price", "Price (GH₵)", "number", "3000"]].map(([k, l, t, ph]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
                      <input type={t} className={inputCls} placeholder={ph} value={newRoom[k]} onChange={e => setNewRoom(p => ({ ...p, [k]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Billing</label>
                    <select className={inputCls} value={newRoom.billing} onChange={e => setNewRoom(p => ({ ...p, billing: e.target.value }))}>
                      <option>Yearly</option><option>Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Number of Rooms</label>
                    <input type="number" min={1} className={inputCls} value={newRoom.totalRooms} onChange={e => setNewRoom(p => ({ ...p, totalRooms: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addRoom} disabled={saving} className="flex-1 btn-primary py-2 text-sm disabled:opacity-60">{saving ? "Adding..." : "Add Room Type"}</button>
                  <button onClick={() => setShowAddRoom(false)} className="flex-1 btn-ghost py-2 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {hostelRooms.length === 0 ? <Empty icon="🛏️" title="No rooms added yet" sub="Add room types so students can see pricing and reserve." /> :
              hostelRooms.map(room => (
                <div key={room._id} className="mb-3">
                  {editingRoom?._id === room._id ? (
                    <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[["name", "Room Name"], ["price", "Price (GH₵)"]].map(([k, l]) => (
                          <div key={k}>
                            <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
                            <input className={inputCls} value={editingRoom[k]} onChange={e => setEditingRoom(p => ({ ...p, [k]: e.target.value }))} />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Total Rooms</label>
                          <input type="number" min={1} className={inputCls} value={editingRoom.capacity || editingRoom.totalRooms || 1} onChange={e => setEditingRoom(p => ({ ...p, capacity: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Billing</label>
                          <select className={inputCls} value={editingRoom.billing} onChange={e => setEditingRoom(p => ({ ...p, billing: e.target.value }))}>
                            <option>Yearly</option><option>Semester</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveRoom} disabled={saving} className="flex-1 btn-primary py-2 text-sm disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
                        <button onClick={() => setEditingRoom(null)} className="flex-1 btn-ghost py-2 text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-white/20 dark:bg-white/05 rounded-xl border border-white/20 dark:border-white/08 hover:border-white/40 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${room.status === "available" ? "bg-emerald-400" : "bg-gray-300"}`} />
                        <div>
                          <p className="font-semibold text-sm text-[--text-primary]">{room.name}</p>
                          <p className="text-xs text-[--text-muted]">
                            GH₵{Number(room.price).toLocaleString()} / {room.billing} · {(room.capacity || room.totalRooms || 0) - (room.reservedRooms || room.currentOccupancy || 0)}/{room.capacity || room.totalRooms || 0} available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRoomStatus(room)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${room.status === "available" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-white/20 text-[--text-muted] border-white/20 hover:bg-emerald-50 hover:text-emerald-600"}`}>
                          {room.status === "available" ? "Active" : "Paused"}
                        </button>
                        <button onClick={() => setEditingRoom({ ...room })} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">Edit</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </Card>
        </>
      )}
    </div>
  );
}

// ── RESERVATIONS TAB (Host view — read-only, admin schedules) ────────────────
function ReservationsTab({ reservations }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = filter === "all" ? reservations : reservations.filter(r => r.status === filter);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="glass rounded-xl p-4 flex items-start gap-3 border border-blue-200/40 dark:border-blue-800/30">
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <div>
          <p className="text-sm font-semibold text-[--text-primary]">How reservations work</p>
          <p className="text-xs text-[--text-muted] mt-0.5 leading-relaxed">
            When a student reserves your hostel, the admin reviews it and contacts you to agree on a meetup time. The admin then schedules the meetup and notifies the student by email and SMS. You can chat with interested students through the Messages tab.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass rounded-2xl p-4 flex gap-2 flex-wrap">
        {[["all", "All"], ["pending", "Pending"], ["scheduled", "Scheduled"], ["confirmed", "Confirmed"], ["cancelled", "Cancelled"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === v ? "text-white" : "text-[--text-muted] hover:text-[--text-primary] hover:bg-white/20 dark:hover:bg-white/10"}`}
            style={filter === v ? { background: "linear-gradient(135deg,#1E40AF,#2563EB)" } : {}}>
            {l} <span className="ml-1 text-xs opacity-70">({v === "all" ? reservations.length : reservations.filter(r => r.status === v).length})</span>
          </button>
        ))}
      </div>

      {/* List + detail */}
      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-1 space-y-3">
          {filtered.length === 0
            ? <Card className="p-12 text-center"><Empty icon="📋" title={`No ${filter !== "all" ? filter : ""} reservations`} /></Card>
            : filtered.map(r => (
              <button key={r._id} onClick={() => setSelected(r)}
                className={`w-full glass rounded-2xl p-4 text-left transition-all hover:shadow-lg ${selected?._id === r._id ? "border-2 border-[#1E40AF] dark:border-blue-400" : "border border-white/20 dark:border-white/08"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)" }}>
                      {r.studentId?.firstName?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p className="font-bold text-[--text-primary] text-sm">{r.studentId?.firstName} {r.studentId?.lastName}</p>
                      <p className="text-xs text-[--text-muted]">{r.roomId?.name} · {r.numberOfPeople} person{r.numberOfPeople !== 1 ? "s" : ""} · {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={RES_STATUS[r.status]?.cls}>{RES_STATUS[r.status]?.label}</span>
                </div>
                {r.status === "scheduled" && r.meetup?.scheduledAt && (
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    📅 Meetup: {new Date(r.meetup.scheduledAt).toLocaleDateString("en-GH", { weekday: "short", day: "numeric", month: "short" })} at {new Date(r.meetup.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                )}
              </button>
            ))
          }
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-72 flex-shrink-0">
            <Card className="sticky top-20 overflow-hidden">
              <div className="bg-white/30 dark:bg-white/05 border-b border-white/20 dark:border-white/08 px-5 py-4 flex items-center justify-between">
                <h3 className="font-bold text-[--text-primary]">Reservation Details</h3>
                <button onClick={() => setSelected(null)} className="text-[--text-muted] text-xl hover:text-[--text-primary] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition">×</button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "65vh" }}>
                <span className={`inline-block ${RES_STATUS[selected.status]?.cls}`}>{RES_STATUS[selected.status]?.label}</span>

                <div>
                  <p className="text-xs font-bold text-[--text-muted] uppercase tracking-wide mb-2">Student</p>
                  <div className="space-y-1.5">
                    {[["Name", `${selected.studentId?.firstName} ${selected.studentId?.lastName}`], ["Email", selected.studentId?.email], ["Phone", selected.studentId?.phone], ["UMaT ID", selected.studentId?.umatId]].map(([l, v]) => v && (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-[--text-muted]">{l}</span>
                        <span className="font-semibold text-[--text-primary] text-right max-w-[60%] break-words">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[--text-muted] uppercase tracking-wide mb-2">Reservation</p>
                  <div className="space-y-1.5">
                    {[["Room", selected.roomId?.name], ["Price", selected.roomId?.price ? `GH₵${selected.roomId.price.toLocaleString()}/${selected.roomId.billing === "Semester" ? "sem" : "yr"}` : "—"], ["# People", `${selected.numberOfPeople} person${selected.numberOfPeople !== 1 ? "s" : ""}`], ["Reserved on", new Date(selected.createdAt).toLocaleDateString()]].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-[--text-muted]">{l}</span>
                        <span className="font-semibold text-[--text-primary]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.message && (
                  <div className="bg-white/20 dark:bg-white/05 rounded-xl p-3">
                    <p className="text-xs font-bold text-[--text-muted] mb-1">Student's message</p>
                    <p className="text-sm text-[--text-secondary] italic">"{selected.message}"</p>
                  </div>
                )}

                {selected.status === "scheduled" && selected.meetup?.scheduledAt && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Scheduled Meetup</p>
                    <p className="text-sm font-bold text-[--text-primary]">{new Date(selected.meetup.scheduledAt).toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    <p className="text-sm text-[--text-secondary]">{new Date(selected.meetup.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                    {selected.meetup.location && <p className="text-xs text-[--text-muted] mt-1">📍 {selected.meetup.location}</p>}
                    {selected.meetup.notes && <p className="text-xs text-[--text-muted] mt-1 italic">"{selected.meetup.notes}"</p>}
                  </div>
                )}

                <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3">
                  <p className="text-xs text-[--text-muted] leading-relaxed">
                    The admin will contact you to agree on a meetup time, then schedule it and notify the student. Use <strong>Messages</strong> to chat with the student directly.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────
function MessagesTab({ hostId }) {
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadInbox = useCallback(async () => {
    try {
      const data = await api("/api/hosts/messages");
      const seen = new Set();
      const convs = [];
      for (const m of (data.messages || [])) {
        const partner = m.senderId?._id === hostId ? m.receiverId : m.senderId;
        if (!partner || seen.has(partner._id)) continue;
        seen.add(partner._id);
        const unread = (data.messages || []).filter(msg => msg.senderId?._id === partner._id && !msg.read).length;
        convs.push({ partnerId: partner._id, partnerName: partner.firstName ? `${partner.firstName} ${partner.lastName}` : partner.fullName || "Student", latestMessage: m.body, unread });
      }
      setConversations(convs);
    } catch { setConversations([]); }
  }, [hostId]);

  useEffect(() => { loadInbox(); }, [loadInbox]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread.length]);

  const openConv = async (conv) => {
    setActive(conv);
    try { const d = await api(`/api/messages/conversation/${conv.partnerId}`); setThread(d.messages || []); loadInbox(); }
    catch { setThread([]); }
  };

  const send = async () => {
    if (!reply.trim() || !active || sending) return;
    setSending(true);
    try {
      await api("/api/hosts/messages", "POST", { receiverId: active.partnerId, receiverModel: "Student", body: reply.trim() });
      setReply("");
      const d = await api(`/api/messages/conversation/${active.partnerId}`);
      setThread(d.messages || []);
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  if (!conversations) return <Spinner />;

  return (
    <Card className="overflow-hidden" style={{ height: 540 }}>
      <div className="flex h-full">
        <div className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-white/20 dark:border-white/08 flex-shrink-0`}>
          <div className="p-4 border-b border-white/20 dark:border-white/08">
            <h2 className="font-bold text-[--text-primary]">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0
              ? <div className="p-6 text-center text-[--text-muted]"><p className="text-4xl mb-2">💬</p><p className="text-sm">No messages yet.</p></div>
              : conversations.map(c => (
                <button key={c.partnerId} onClick={() => openConv(c)}
                  className={`flex items-start gap-3 p-4 w-full text-left border-b border-white/10 dark:border-white/05 hover:bg-white/20 dark:hover:bg-white/05 transition ${active?.partnerId === c.partnerId ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)" }}>
                    {c.partnerName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[--text-primary] truncate">{c.partnerName}</p>
                    <p className="text-xs text-[--text-muted] truncate">{c.latestMessage}</p>
                  </div>
                  {c.unread > 0 && <span className="w-5 h-5 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>}
                </button>
              ))
            }
          </div>
        </div>

        <div className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {active ? (
            <>
              <div className="p-4 border-b border-white/20 dark:border-white/08 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="md:hidden text-[--text-muted]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)" }}>{active.partnerName?.charAt(0)}</div>
                <p className="font-bold text-[--text-primary] text-sm">{active.partnerName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/5 dark:bg-black/10">
                {thread.map((msg, i) => {
                  const isMe = msg.senderModel === "Host";
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "text-white rounded-br-md" : "text-[--text-primary] rounded-bl-md border border-white/30 dark:border-white/10"}`}
                        style={isMe ? { background: "linear-gradient(135deg,#1E40AF,#2563EB)" } : { background: "var(--glass-bg)" }}>
                        <p>{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-[--text-muted]"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-white/20 dark:border-white/08 flex gap-2">
                <input className="input-field flex-1" placeholder="Type your reply..." value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())} />
                <button onClick={send} disabled={sending || !reply.trim()} className="btn-primary disabled:opacity-50 px-4 py-2.5">Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[--text-muted]">
              <span className="text-5xl mb-3">💬</span>
              <p className="font-semibold text-[--text-secondary]">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsTab({ hostProfile, reload, onLogout }) {
  const [form, setForm] = useState({ fullName: hostProfile.fullName || "", email: hostProfile.email || "", phone: hostProfile.phone || "" });
  const [passwords, setPasswords] = useState({ current: "", newP: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const showMsg = (m, ok = true) => { setMsg({ m, ok }); setTimeout(() => setMsg(null), 3000); };
  const showPwMsg = (m, ok = true) => { setPwMsg({ m, ok }); setTimeout(() => setPwMsg(null), 3000); };

  const saveProfile = async () => {
    setSaving(true);
    try { await api("/api/hosts/update-profile", "PUT", { fullName: form.fullName, phone: form.phone }); showMsg("Profile saved."); reload(); }
    catch (e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current) { showPwMsg("Enter your current password", false); return; }
    if (passwords.newP.length < 8) { showPwMsg("Min 8 characters", false); return; }
    if (passwords.newP !== passwords.confirm) { showPwMsg("Passwords don't match", false); return; }
    setPwSaving(true);
    try { await api("/api/hosts/change-password", "PUT", { currentPassword: passwords.current, newPassword: passwords.newP }); setPasswords({ current: "", newP: "", confirm: "" }); showPwMsg("Password updated."); }
    catch (e) { showPwMsg(e.message, false); }
    finally { setPwSaving(false); }
  };

  const inputCls = "w-full border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/05 rounded-xl px-4 py-3 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="font-bold text-[--text-primary] mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Profile Settings</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-2xl" style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)" }}>
            {form.fullName?.charAt(0) || "H"}
          </div>
          <div>
            <p className="font-bold text-[--text-primary]">{form.fullName}</p>
            <p className="text-xs text-[--text-muted]">{form.email}</p>
          </div>
        </div>
        {msg && <div className={`rounded-xl px-4 py-3 text-sm font-semibold mb-4 ${msg.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>{msg.m}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["Full Name", "fullName", "Martha Adasi"], ["Phone", "phone", "0244xxxxxx"]].map(([l, k, ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
              <input className={inputCls} placeholder={ph} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Email (read-only)</label>
            <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={form.email} readOnly />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-[--text-primary] mb-5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Change Password</h2>
        {pwMsg && <div className={`rounded-xl px-4 py-3 text-sm font-semibold mb-4 ${pwMsg.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>{pwMsg.m}</div>}
        <div className="space-y-4 max-w-sm">
          {[["Current Password", "current"], ["New Password", "newP"], ["Confirm New Password", "confirm"]].map(([l, k]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
              <input type="password" className={inputCls} value={passwords[k]} onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <button onClick={changePassword} disabled={pwSaving} className="btn-primary disabled:opacity-60">{pwSaving ? "Updating..." : "Update Password"}</button>
        </div>
      </Card>

      {/* Dark mode */}
      <Card className="p-6">
        <h2 className="font-bold text-[--text-primary] mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[--text-primary]">Dark Mode</p>
            <p className="text-xs text-[--text-muted] mt-0.5">Toggle between light and dark theme</p>
          </div>
          <DarkModeButton />
        </div>
      </Card>

      <Card className="p-6 border border-red-200/50 dark:border-red-800/30">
        <h2 className="font-bold text-red-500 mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Sign Out</h2>
        <p className="text-sm text-[--text-muted] mb-4">You'll be signed out on this device.</p>
        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">Sign Out</button>
      </Card>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function HostDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [hostProfile, setHostProfile] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [profileData, myData, resData] = await Promise.all([
        api("/api/hosts/me"),
        api("/api/hosts/my-hostels"),
        api("/api/reservations/host"),
      ]);
      setHostProfile(profileData.host);
      setHostels(myData.hostels || []);
      setRooms(myData.rooms || []);
      setMessages(myData.messages || []);
      setReservations(resData.reservations || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "host") { router.push("/login"); return; }
    loadData();
  }, [loadData, router]);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin" /></div>;
  if (!hostProfile) return null;

  const totalUnread = messages.filter(m => !m.read && m.receiverModel === "Host").length;
  const pendingRes = reservations.filter(r => r.status === "pending").length;
  const scheduledRes = reservations.filter(r => r.status === "scheduled").length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-xl text-[#1E40AF] dark:text-blue-300" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">Host</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "text-white" : "text-[--text-muted] hover:text-[--text-primary] hover:bg-white/20 dark:hover:bg-white/10"}`}
                style={activeTab === tab.id ? { background: "linear-gradient(135deg,#F59E0B,#FBBF24)" } : {}}>
                <span style={{ fontSize: "13px" }}>{tab.icon}</span>{tab.label}
                {tab.id === "messages" && totalUnread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">{totalUnread}</span>}
                {tab.id === "reservations" && (pendingRes + scheduledRes) > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">{pendingRes + scheduledRes}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DarkModeButton />
            <Link href="/" className="text-xs text-[--text-muted] hover:text-[#1E40AF] dark:hover:text-blue-300 font-medium transition hidden sm:block">Browse</Link>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer" style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)" }} onClick={() => setActiveTab("settings")}>
              {hostProfile.fullName?.charAt(0) || "H"}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-white/20 dark:border-white/08">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === tab.id ? "border-[#F59E0B] text-[#F59E0B]" : "border-transparent text-[--text-muted]"}`}>
              {tab.icon}{tab.label}
              {tab.id === "messages" && totalUnread > 0 && <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalUnread}</span>}
              {tab.id === "reservations" && (pendingRes + scheduledRes) > 0 && <span className="bg-amber-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{pendingRes + scheduledRes}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "overview"     && <OverviewTab hostels={hostels} reservations={reservations} messages={messages} hostProfile={hostProfile} setActiveTab={setActiveTab} />}
        {activeTab === "hostels"      && <MyHostelsTab hostels={hostels} rooms={rooms} reload={loadData} />}
        {activeTab === "reservations" && <ReservationsTab reservations={reservations} />}
        {activeTab === "messages"     && <MessagesTab hostId={hostProfile._id} />}
        {activeTab === "settings"     && <SettingsTab hostProfile={hostProfile} reload={loadData} onLogout={handleLogout} />}
      </main>
    </div>
  );
}