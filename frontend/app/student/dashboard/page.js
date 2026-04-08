"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { student as studentAPI, getUser, clearAuth } from "../../lib/api";

const TABS = [
  { id:"dashboard",   label:"Dashboard",   icon:"🏠" },
  { id:"browse",      label:"Browse",      icon:"🔍" },
  { id:"messages",    label:"Messages",    icon:"💬" },
  { id:"favourites",  label:"Favourites",  icon:"❤️" },
  { id:"settings",    label:"Settings",    icon:"⚙️" },
];

// ── Empty states ──────────────────────────────────────────────────────────────
function Empty({ icon, title, subtitle, action }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <span className="text-5xl block mb-4">{icon}</span>
      <p className="font-semibold text-gray-600 text-base">{title}</p>
      {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── MESSAGES TAB ──────────────────────────────────────────────────────────────
function MessagesTab({ studentId, initialPartnerId, initialPartnerName, initialHostelId, initialHostelName }) {
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadInbox = useCallback(async () => {
    try {
      const data = await studentAPI.inbox();
      setConversations(data.conversations || []);
    } catch { setConversations([]); }
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    if (initialPartnerId) {
      const target = {
        partnerId: initialPartnerId,
        partnerName: initialPartnerName || "Host",
        hostelId: initialHostelId,
        hostelName: initialHostelName,
      };
      setActive(target);
      openConversation(target);
    }
  }, [initialPartnerId, initialPartnerName, initialHostelId, initialHostelName]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread.length]);

  const openConversation = async (conv) => {
    setActive(conv);
    try {
      const data = await studentAPI.conversation(conv.partnerId);
      setThread(data.messages || []);
      // refresh inbox to clear unread badge
      loadInbox();
    } catch { setThread([]); }
  };

  const send = async () => {
    if (!reply.trim() || !active || sending) return;
    setSending(true);
    try {
      await studentAPI.sendMessage({
        receiverId: active.partnerId,
        receiverModel: "Host",
        hostelId: active.hostelId,
        body: reply.trim(),
      });
      setReply("");
      const data = await studentAPI.conversation(active.partnerId);
      setThread(data.messages || []);
    } catch(e) { alert(e.message); }
    finally { setSending(false); }
  };

  if (conversations === null) return <div className="flex items-center justify-center py-20"><div className="w-7 h-7 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{height:540}}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-gray-100 flex-shrink-0`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs mt-1">Message a host from a hostel page.</p>
              </div>
            ) : conversations.map(c => (
              <button key={c.partnerId} onClick={() => openConversation(c)}
                className={`flex items-start gap-3 p-4 w-full text-left border-b border-gray-50 hover:bg-gray-50 transition ${active?.partnerId === c.partnerId ? "bg-blue-50" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {c.partnerName?.charAt(0) || "H"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-800 truncate">{c.partnerName}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                      {new Date(c.latestTime).toLocaleDateString()}
                    </span>
                  </div>
                  {c.hostelName && <p className="text-xs text-gray-400 truncate">{c.hostelName}</p>}
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.latestMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat pane */}
        <div className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {active ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm">
                  {active.partnerName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{active.partnerName}</p>
                  {active.hostelName && <p className="text-xs text-gray-400">{active.hostelName}</p>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {thread.map((msg, i) => {
                  const isMe = msg.senderId === studentId || msg.senderModel === "Student";
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "bg-[#1E40AF] text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"}`}>
                        <p>{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>
              <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Type a message..." value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}/>
                <button onClick={send} disabled={sending || !reply.trim()}
                  className="bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <span className="text-5xl mb-3">💬</span>
              <p className="font-semibold text-gray-500">Select a conversation</p>
              <p className="text-sm mt-1 text-center px-6">Or go to a hostel page and click "Chat with Host" to start one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FAVOURITES TAB ────────────────────────────────────────────────────────────
function FavouritesTab({ savedHostels, onUnsave }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Saved Hostels</h2>
      {savedHostels.length === 0 ? (
        <Empty icon="🏚" title="No saved hostels yet" subtitle="Tap the heart icon on any hostel to save it here."
          action={<Link href="/" className="text-sm text-[#1E40AF] font-semibold hover:underline">Browse Hostels →</Link>}/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedHostels.map(h => (
            <div key={h._id} className="flex gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#1E40AF] hover:bg-blue-50 transition group">
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">🏠</div>
              <div className="flex-1 min-w-0">
                <Link href={`/hostel/${h._id}`} className="font-bold text-sm text-gray-800 group-hover:text-[#1E40AF] truncate block">{h.name}</Link>
                <p className="text-xs text-gray-400 mt-0.5">{h.location} · {h.city}</p>
                <p className="text-sm font-bold text-[#1E40AF] mt-1">GH₵{h.priceFrom?.toLocaleString()}<span className="text-xs font-normal text-gray-400">/yr</span></p>
              </div>
              <button onClick={() => onUnsave(h._id)} className="text-red-400 hover:text-red-600 flex-shrink-0 self-start" title="Remove">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SETTINGS TAB ──────────────────────────────────────────────────────────────
function SettingsTab({ profile, onLogout }) {
  const [form, setForm] = useState({
    firstName: profile.firstName || "",
    lastName:  profile.lastName  || "",
    email:     profile.email     || "",
    phone:     profile.phone     || "",
    program:   profile.program   || "",
    year:      profile.year      || "",
  });
  const [passwords, setPasswords] = useState({ current:"", newP:"", confirm:"" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);

  const showMsg = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3000); };
  const showPwMsg = (m, ok=true) => { setPwMsg({m,ok}); setTimeout(()=>setPwMsg(null),3000); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await studentAPI.updateProfile({ firstName:form.firstName, lastName:form.lastName, phone:form.phone, program:form.program, year:form.year });
      showMsg("Profile saved successfully.");
    } catch(e) { showMsg(e.message, false); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current) { showPwMsg("Enter your current password", false); return; }
    if (passwords.newP.length < 8) { showPwMsg("New password must be at least 8 characters", false); return; }
    if (passwords.newP !== passwords.confirm) { showPwMsg("Passwords do not match", false); return; }
    setPwSaving(true);
    try {
      await studentAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.newP });
      setPasswords({ current:"", newP:"", confirm:"" });
      showPwMsg("Password updated.");
    } catch(e) { showPwMsg(e.message, false); }
    finally { setPwSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Profile Settings</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-extrabold text-2xl">
            {form.firstName?.charAt(0) || "S"}
          </div>
          <div>
            <p className="font-bold text-gray-800">{form.firstName} {form.lastName}</p>
            <p className="text-xs text-gray-400">{form.email} · {form.program} · {form.year}</p>
            <p className="text-xs text-gray-400 mt-0.5">UMaT ID: {profile.umatId}</p>
          </div>
        </div>
        {msg && <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.m}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["First Name","firstName","Kwame"],["Last Name","lastName","Asante"],["Phone","phone","0244xxxxxx"]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form[k]} placeholder={ph} onChange={e => setForm(p => ({...p, [k]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email (read-only)</label>
            <input className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              value={form.email} readOnly/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
              value={form.year} onChange={e => setForm(p => ({...p, year:e.target.value}))}>
              {["L100","L200","L300","L400"].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={saving}
            className="bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Change Password</h2>
        {pwMsg && <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${pwMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{pwMsg.m}</div>}
        <div className="space-y-4 max-w-sm">
          {[["Current Password","current","off"],["New Password","newP","new-password"],["Confirm New Password","confirm","new-password"]].map(([l,k,auto]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{l}</label>
              <input type="password" autoComplete={auto} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={passwords[k]} onChange={e => setPasswords(p => ({...p, [k]:e.target.value}))}/>
            </div>
          ))}
          <button onClick={changePassword} disabled={pwSaving}
            className="bg-[#1E40AF] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
            {pwSaving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="font-bold text-red-600 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign Out</h2>
        <p className="text-sm text-gray-400 mb-4">You'll be signed out of your account on this device.</p>
        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const hostId = searchParams.get("hostId");
  const hostName = searchParams.get("hostName");
  const hostelId = searchParams.get("hostelId");
  const hostelName = searchParams.get("hostelName");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const data = await studentAPI.me();
      setProfile(data.student);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "dashboard");
  }, [searchParams]);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "student") { router.push("/login"); return; }
    loadProfile();
  }, [loadProfile, router]);

  // Poll unread count every 30s
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await studentAPI.inbox();
        const count = (data.conversations || []).reduce((s, c) => s + c.unread, 0);
        setUnreadCount(count);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUnsave = async (hostelId) => {
    try {
      const data = await studentAPI.saveHostel(hostelId);
      // Refresh profile to update savedHostels
      loadProfile();
    } catch(e) { alert(e.message); }
  };

  const handleLogout = async () => {
    try { await studentAPI.me && fetch; } catch {}
    clearAuth();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!profile) return null;

  const savedHostels = profile.savedHostels || [];
  const recentViews  = profile.recentViews  || [];
  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase();

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
              <button key={tab.id} onClick={() => tab.id === "browse" ? router.push("/") : setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "bg-[#1E40AF] text-white" : "text-gray-500 hover:text-[#1E40AF] hover:bg-blue-50"}`}>
                <span style={{fontSize:"13px"}}>{tab.icon}</span>{tab.label}
                {tab.id === "messages" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm cursor-pointer" onClick={() => setActiveTab("settings")}>
            {initials}
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100 bg-white">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => tab.id === "browse" ? router.push("/") : setActiveTab(tab.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === tab.id ? "border-[#1E40AF] text-[#1E40AF]" : "border-transparent text-gray-400"}`}>
              {tab.icon}{tab.label}
              {tab.id === "messages" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3">{initials}</div>
            <p className="font-bold text-gray-800">{profile.firstName} {profile.lastName}</p>
            <p className="text-gray-400 text-sm mt-0.5">{profile.program} · {profile.year}</p>
            <p className="text-gray-400 text-xs mt-0.5">{profile.umatId}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="font-bold text-gray-800 text-sm">Activity</p>
            {[["Saved Hostels", savedHostels.length],["Recent Views", recentViews.length],["Unread Messages", unreadCount]].map(([l,v]) => (
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
              {/* Welcome banner */}
              <div className="bg-[#1E40AF] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right, #F59E0B, transparent)"}}/>
                <p className="text-blue-200 text-sm">Welcome back 👋</p>
                <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{profile.firstName} {profile.lastName}</h1>
                <p className="text-blue-200 text-sm mt-1">
                  {savedHostels.length > 0
                    ? <><span className="text-[#F59E0B] font-bold">{savedHostels.length} saved hostel{savedHostels.length !== 1 ? "s" : ""}</span> in your favourites.</>
                    : "Start browsing and save hostels you like."}
                  {unreadCount > 0 && <> · <span className="text-[#F59E0B] font-bold">{unreadCount} unread message{unreadCount !== 1 ? "s" : ""}</span>.</>}
                </p>
                <button onClick={() => router.push("/")} className="mt-4 bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
                  Browse Hostels →
                </button>
              </div>

              {/* Saved hostels preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Saved Hostels</h2>
                  {savedHostels.length > 0 && <button onClick={() => setActiveTab("favourites")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>}
                </div>
                {savedHostels.length === 0 ? (
                  <Empty icon="🏚" title="No saved hostels" subtitle="Tap the heart icon on any hostel to save it."
                    action={<Link href="/" className="text-sm text-[#1E40AF] font-semibold hover:underline">Browse Hostels</Link>}/>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {savedHostels.slice(0,3).map(h => (
                      <Link key={h._id} href={`/hostel/${h._id}`} className="block bg-gray-50 rounded-xl p-3 hover:bg-blue-50 transition group">
                        <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF] line-clamp-1">{h.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{h.location} · GH₵{h.priceFrom?.toLocaleString()}/yr</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recently viewed */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>🕐 Recently Viewed</h2>
                {recentViews.length === 0 ? (
                  <Empty icon="👀" title="Nothing viewed yet" subtitle="Hostels you browse will appear here."/>
                ) : (
                  <div className="space-y-2">
                    {recentViews.slice(0,5).map(h => (
                      <Link key={h._id} href={`/hostel/${h._id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition group">
                        <div>
                          <p className="font-semibold text-sm text-gray-800 group-hover:text-[#1E40AF]">{h.name}</p>
                          <p className="text-xs text-gray-400">{h.location}</p>
                        </div>
                        <span className="text-sm font-bold text-[#1E40AF]">GH₵{h.priceFrom?.toLocaleString()}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>💬 Messages</h2>
                  <button onClick={() => setActiveTab("messages")} className="text-xs text-[#1E40AF] font-semibold hover:underline">View all</button>
                </div>
                {unreadCount === 0 ? (
                  <Empty icon="💬" title="No messages" subtitle="Chat with a host from any hostel detail page."/>
                ) : (
                  <button onClick={() => setActiveTab("messages")}
                    className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-[#1E40AF] font-semibold hover:bg-blue-100 transition text-left">
                    You have {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}. Click to view →
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === "messages"   && <MessagesTab studentId={profile._id}
              initialPartnerId={hostId}
              initialPartnerName={hostName}
              initialHostelId={hostelId}
              initialHostelName={hostelName}
          />}
          {activeTab === "favourites" && <FavouritesTab savedHostels={savedHostels} onUnsave={handleUnsave}/>}
          {activeTab === "settings"   && <SettingsTab profile={profile} onLogout={handleLogout}/>}
        </div>
      </main>
    </div>
  );
}