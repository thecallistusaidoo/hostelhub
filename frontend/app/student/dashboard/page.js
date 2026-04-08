"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import hostels from "../../data/hostels";
import { messageAPI } from "../../lib/api";
import { getSocket, disconnectSocket } from "../../lib/socket";

const TABS = [
  { id:"dashboard", label:"Dashboard", icon:"🏠" },
  { id:"browse", label:"Browse Hostels", icon:"🔍" },
  { id:"messages", label:"Messages", icon:"💬" },
  { id:"favourites", label:"Favourites", icon:"❤️" },
  { id:"settings", label:"Settings", icon:"⚙️" },
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

function mapThreadMessageStudent(m, meId) {
  const mine = String(m.senderId) === String(meId);
  const from = mine ? "student" : (m.senderModel === "Host" ? "host" : "student");
  return { from, text: m.body, time: formatRelativeTime(m.createdAt), _id: m._id };
}

const MOCK_MESSAGES = [
  { id: "demo1", partnerId: "demo1", host: "Martha Adasi", hostel: "—", preview: "Demo thread", time: "2h ago", unread: true, partnerRole: "host",
    messages: [
      { from: "host", text: "Hello! Your booking request has been received.", time: "2h ago" },
      { from: "student", text: "Thank you! When can I inspect?", time: "1h ago" },
    ],
  },
];

const SAVED_IDS = [1, 3, 8, 10];

// ── MESSAGES TAB (Socket.io + REST) ─────────────────────────────────────────
function MessagesTab({ user, conversations, setConversations }) {
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const activeRef = useRef(null);
  useEffect(() => { activeRef.current = active; }, [active]);

  const conv = active ? conversations.find(m => String(m.id) === String(active)) : null;

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
        ? "student"
        : (msg.senderModel === "Host" ? "host" : "student");
      const bubble = { from: fromBubble, text: msg.body, time: "Just now", _id: msg._id };
      const open = String(activeRef.current) === partnerId;

      setConversations((prev) => {
        let found = false;
        const next = prev.map((c) => {
          if (String(c.id) !== partnerId) return c;
          found = true;
          return {
            ...c,
            preview: msg.body,
            lastMsg: msg.body,
            time: "Just now",
            unread: open ? false : (c.unread || 0) + (isMine ? 0 : 1),
            messages: open ? [...(c.messages || []), bubble] : (c.messages || []),
          };
        });
        if (!found) {
          return [...next, {
            id: partnerId,
            partnerId,
            host: msg.senderModel === "Host" ? "Host" : "Student",
            hostel: "—",
            preview: msg.body,
            lastMsg: msg.body,
            partnerRole: "host",
            time: "Just now",
            unread: isMine ? false : true,
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
    setActive(id);
    setConversations((prev) => prev.map((c) =>
      String(c.id) === String(id) ? { ...c, unread: false } : c
    ));
    if (!user?.id) return;
    try {
      const { data } = await messageAPI.conversation(id);
      const mapped = (data.messages || []).map((m) => mapThreadMessageStudent(m, user.id));
      setConversations((prev) => prev.map((c) =>
        String(c.id) === String(id) ? { ...c, messages: mapped } : c
      ));
      getSocket()?.emit("message:read", { senderId: id });
    } catch { /* noop */ }
  };

  const send = () => {
    if (!reply.trim() || !active || !user?.id) return;
    const c = conversations.find((x) => String(x.id) === String(active));
    if (!c) return;
    const body = reply.trim();
    setReply("");
    const receiverModel = "Host";
    const socket = getSocket();
    const receiverId = c.partnerId || c.id;

    if (socket) {
      socket.emit(
        "message:send",
        { receiverId, receiverModel, hostelId: c.hostelId || undefined, body },
        (response) => {
          if (response?.error) return;
          const md = response?.message;
          if (!md) return;
          const newMsg = { from: "student", text: md.body, time: "Just now", _id: md._id };
          setConversations((prev) => prev.map((row) =>
            String(row.id) === String(active)
              ? { ...row, messages: [...(row.messages || []), newMsg], preview: body, lastMsg: body, time: "Just now" }
              : row
          ));
        }
      );
    } else {
      messageAPI.send({
        receiverId,
        receiverModel,
        hostelId: c.hostelId || undefined,
        body,
      }).then(({ data }) => {
        const m = data?.data;
        if (!m) return;
        const newMsg = { from: "student", text: m.body, time: "Just now", _id: m._id };
        setConversations((prev) => prev.map((row) =>
          String(row.id) === String(active)
            ? { ...row, messages: [...(row.messages || []), newMsg], preview: body, lastMsg: body, time: "Just now" }
            : row
        ));
      }).catch(() => {});
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{minHeight:500}}>
      <div className="flex h-full" style={{minHeight:500}}>
        <div className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-gray-100 flex-shrink-0`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Messages</h2>
          </div>
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No conversations yet. Contact a host from a hostel page.</p>
          )}
          {conversations.map(m => (
            <button key={m.id} onClick={() => openConv(m.id)}
              className={`flex items-start gap-3 p-4 border-b border-gray-50 text-left hover:bg-gray-50 transition w-full ${String(active) === String(m.id) ? "bg-blue-50" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {m.host.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm text-gray-800 truncate">{m.host}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{m.time}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{m.hostel}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{m.preview || m.lastMsg}</p>
              </div>
              {m.unread ? <div className="w-2 h-2 bg-[#F59E0B] rounded-full mt-1 flex-shrink-0"/> : null}
            </button>
          ))}
        </div>

        <div className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {conv ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="md:hidden text-gray-400 hover:text-gray-600 mr-1">←</button>
                <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">{conv.host.charAt(0)}</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{conv.host}</p>
                  <p className="text-xs text-gray-400">{conv.hostel}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxHeight:320}}>
                {(conv.messages || []).map((msg, i) => (
                  <div key={msg._id || i} className={`flex ${msg.from === "student" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.from === "student"
                        ? "bg-[#1E40AF] text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.from === "student" ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Type a message..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button type="button" onClick={send} className="bg-[#1E40AF] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e3a8a] transition">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
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

// ── FAVOURITES TAB ────────────────────────────────────────────────────────────
function FavouritesTab() {
  const saved = hostels.filter(h => SAVED_IDS.includes(h.id));
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Your Saved Hostels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {saved.map(h => (
            <Link key={h.id} href={`/hostel/${h.id}`}
              className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#1E40AF] hover:bg-blue-50 transition group">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl">🏠</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800 group-hover:text-[#1E40AF] truncate">{h.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{h.location} · {h.city}</p>
                <p className="text-sm font-bold text-[#1E40AF] mt-1">GH₵{h.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/yr</span></p>
                <span className={`text-xs font-semibold ${h.availableRooms > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {h.availableRooms > 0 ? `${h.availableRooms} rooms left` : "Fully Booked"}
                </span>
              </div>
              <button onClick={e => e.preventDefault()} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
            </Link>
          ))}
        </div>
        {saved.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <span className="text-5xl block mb-3">🏚</span>
            <p>You haven't saved any hostels yet.</p>
            <Link href="/" className="mt-3 inline-block text-sm text-[#1E40AF] font-semibold hover:underline">Browse Hostels →</Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [profile, setProfile] = useState({ firstName:"Kwame", lastName:"Asante", email:"kwame@umat.edu.gh", phone:"0244xxxxxx", program:"Mining Engineering", year:"L300" });
  const [passwords, setPasswords] = useState({ current:"", newP:"", confirm:"" });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-5">
      {/* Profile settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Profile Settings</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-extrabold text-2xl">K</div>
          <div>
            <button className="text-sm text-[#1E40AF] font-semibold hover:underline">Change Photo</button>
            <p className="text-xs text-gray-400 mt-0.5">JPG or PNG, max 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label:"First Name", key:"firstName", placeholder:"Kwame" },
            { label:"Last Name", key:"lastName", placeholder:"Asante" },
            { label:"Email Address", key:"email", placeholder:"you@gmail.com", type:"email" },
            { label:"Phone Number", key:"phone", placeholder:"0244xxxxxx" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
              <input type={f.type || "text"} className="input-field" value={profile[f.key]} placeholder={f.placeholder}
                onChange={e => setProfile(p => ({...p, [f.key]: e.target.value}))}/>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Change Password</h2>
        <div className="space-y-4 max-w-sm">
          {[
            { label:"Current Password", key:"current" },
            { label:"New Password", key:"newP" },
            { label:"Confirm New Password", key:"confirm" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
              <input type="password" className="input-field" value={passwords[f.key]}
                onChange={e => setPasswords(p => ({...p, [f.key]: e.target.value}))}/>
            </div>
          ))}
          <button className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            Update Password
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Notifications</h2>
        <div className="space-y-4">
          {[
            { label:"New messages from hosts", sub:"Get notified when a host replies to you" },
            { label:"Booking status updates", sub:"Know when your booking is approved or declined" },
            { label:"New hostels in your area", sub:"Discover newly listed hostels near UMaT" },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">{n.label}</p>
                <p className="text-xs text-gray-400">{n.sub}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer"/>
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1E40AF]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="font-bold text-red-600 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Danger Zone</h2>
        <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all your data. This cannot be undone.</p>
        <button className="border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-xl px-5 py-2.5 text-sm transition">
          Delete My Account
        </button>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState(MOCK_MESSAGES);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!raw || !token) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.role !== "student") return;
      setUser(parsed);
    } catch { /* noop */ }
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
          host: row.partnerName || "Host",
          hostel: "—",
          preview: row.latestMessage?.body || "",
          lastMsg: row.latestMessage?.body || "",
          partnerRole: row.partnerRole || "host",
          time: formatRelativeTime(row.latestMessage?.createdAt),
          unread: (row.unreadCount || 0) > 0,
          messages: [],
          hostelId: row.latestMessage?.hostelId
            ? String(row.latestMessage.hostelId)
            : undefined,
        }));
        setConversations(mapped);
      } catch {
        if (!cancelled) setConversations(MOCK_MESSAGES);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const saved = hostels.filter(h => SAVED_IDS.includes(h.id));
  const recent = [hostels[0], hostels[2], hostels[7]];
  const recommended = hostels.filter(h => h.featured).slice(0,3);

  const displayUser = user
    ? {
      name: user.name || "Student",
      initials: (user.name || "S").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
      program: "—",
      year: "—",
      id: user.email || "",
    }
    : { name:"Kwame Asante", initials:"KA", program:"Mining Engineering", year:"L300", id:"Guest" };

  const unreadMsgCount = conversations.filter((c) => c.unread).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => tab.id === "browse" ? window.location.href="/" : setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id ? "bg-[#1E40AF] text-white" : "text-gray-500 hover:text-[#1E40AF] hover:bg-blue-50"
                }`}>
                <span style={{fontSize:"13px"}}>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm cursor-pointer">
            {displayUser.initials}
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => tab.id === "browse" ? window.location.href="/" : setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id ? "border-[#1E40AF] text-[#1E40AF]" : "border-transparent text-gray-400"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3">
              {displayUser.initials}
            </div>
            <p className="font-bold text-gray-800">{displayUser.name}</p>
            <p className="text-gray-400 text-sm mt-0.5">{displayUser.program} · {displayUser.year}</p>
            <p className="text-gray-400 text-xs mt-0.5">{displayUser.id}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="font-bold text-gray-800 text-sm">Activity</p>
            {[["Saved Hostels", saved.length],["Unread Messages", unreadMsgCount],["Recent Views",3]].map(([l,v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-gray-500">{l}</span>
                <span className="font-bold text-[#1E40AF]">{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {activeTab === "dashboard" && (
            <>
              {/* Welcome */}
              <div className="bg-[#1E40AF] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right, #F59E0B, transparent)"}}/>
                <p className="text-blue-200 text-sm">Good morning 👋</p>
                <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{displayUser.name}</h1>
                <p className="text-blue-200 text-sm mt-1">You have <span className="text-[#F59E0B] font-bold">{unreadMsgCount} unread message{unreadMsgCount !== 1 ? "s" : ""}</span> and <span className="text-[#F59E0B] font-bold">{saved.length} saved hostels</span>.</p>
                <button onClick={() => window.location.href="/"} className="mt-4 bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
                  Browse Hostels →
                </button>
              </div>

              {/* Messages preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Recent Messages</h2>
                  <button onClick={() => setActiveTab("messages")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
                </div>
                {conversations.slice(0,2).map(m => (
                  <button key={m.id} onClick={() => setActiveTab("messages")}
                    className={`flex items-start gap-3 p-3 rounded-xl w-full text-left transition mb-2 ${m.unread ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{m.host.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800 text-sm">{m.host}</p>
                        <span className="text-xs text-gray-400">{m.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.hostel} · {m.preview || m.lastMsg}</p>
                    </div>
                    {m.unread ? <div className="w-2 h-2 bg-[#F59E0B] rounded-full mt-1.5 flex-shrink-0"/> : null}
                  </button>
                ))}
              </div>

              {/* Saved */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Saved Hostels</h2>
                  <button onClick={() => setActiveTab("favourites")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {saved.slice(0,3).map(h => (
                    <Link key={h.id} href={`/hostel/${h.id}`} className="block bg-gray-50 rounded-xl p-3 hover:bg-blue-50 transition group">
                      <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF] line-clamp-1">{h.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.location} · GH₵{h.price.toLocaleString()}/yr</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 Recently Viewed</h2>
                <div className="space-y-2">
                  {recent.map(h => (
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
                <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✨ Recommended</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {recommended.map(h => (
                    <Link key={h.id} href={`/hostel/${h.id}`} className="block bg-blue-50 rounded-xl p-3 border border-blue-100 hover:border-[#1E40AF] transition group">
                      <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF] line-clamp-1">{h.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.campusDistance}</p>
                      <p className="text-sm font-bold text-[#1E40AF] mt-1">GH₵{h.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/yr</span></p>
                      <p className="text-xs text-amber-500 font-semibold">★ {h.hostRating}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "messages" && (
            <MessagesTab
              user={user}
              conversations={conversations}
              setConversations={setConversations}
            />
          )}
          {activeTab === "favourites" && <FavouritesTab/>}
          {activeTab === "settings" && <SettingsTab/>}
        </div>
      </main>
    </div>
  );
}