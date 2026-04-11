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
    headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const STATUS_META = {
  pending:   { label:"Pending Review",  color:"status-pending",   icon:"⏳" },
  scheduled: { label:"Meetup Scheduled",color:"status-approved",  icon:"📅" },
  confirmed: { label:"Confirmed",       color:"bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full", icon:"✅" },
  cancelled: { label:"Cancelled",       color:"status-rejected",  icon:"✗"  },
};

const TABS = [
  { id:"dashboard",    label:"Dashboard",      icon:"🏠" },
  { id:"browse",       label:"Browse",         icon:"🔍" },
  { id:"reservations", label:"My Reservations",icon:"📋" },
  { id:"messages",     label:"Messages",       icon:"💬" },
  { id:"favourites",   label:"Favourites",     icon:"❤️" },
  { id:"settings",     label:"Settings",       icon:"⚙️" },
];

function Empty({ icon, title, sub, action }) {
  return (
    <div className="text-center py-14 px-4">
      <span className="text-5xl block mb-4">{icon}</span>
      <p className="font-bold text-[--text-primary] text-base">{title}</p>
      {sub && <p className="text-sm text-[--text-muted] mt-1">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/></div>;
}

// ─── RESERVATIONS TAB ─────────────────────────────────────────────────────────
function ReservationsTab() {
  const [reservations, setReservations] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { const d = await api("/api/reservations/mine"); setReservations(d.reservations || []); }
    catch { setReservations([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this reservation? The room will be released.")) return;
    setCancelling(id);
    try {
      await api(`/api/reservations/${id}`, "DELETE");
      setMsg({ m:"Reservation cancelled.", ok:true });
      load();
    } catch(e) { setMsg({ m:e.message, ok:false }); }
    finally { setCancelling(null); setTimeout(() => setMsg(null), 4000); }
  };

  if (!reservations) return <Spinner/>;

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200" : "bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200"}`}>
          {msg.m}
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[--text-primary]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📋 My Reservations</h2>
          <Link href="/" className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">Browse Hostels</Link>
        </div>

        {reservations.length === 0 ? (
          <Empty icon="🏠" title="No reservations yet"
            sub="Find a hostel you like and reserve it. We'll schedule a meetup to help you seal the deal."
            action={<Link href="/" className="btn-primary text-sm px-5 py-2.5">Browse Hostels →</Link>}/>
        ) : (
          <div className="space-y-4">
            {reservations.map(r => {
              const meta = STATUS_META[r.status] || STATUS_META.pending;
              const hostel = r.hostelId;
              const room   = r.roomId;
              const host   = r.hostId;

              return (
                <div key={r._id} className="glass rounded-2xl overflow-hidden border border-white/30 dark:border-white/08">
                  {/* Status bar */}
                  <div className={`px-4 py-2 flex items-center justify-between ${
                    r.status === "scheduled" ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800"
                    : r.status === "confirmed" ? "bg-blue-50/80 dark:bg-blue-900/20 border-b border-blue-100"
                    : r.status === "cancelled" ? "bg-red-50/80 dark:bg-red-900/20 border-b border-red-100"
                    : "bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800"
                  }`}>
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[--text-primary]">
                      <span>{meta.icon}</span>{meta.label}
                    </span>
                    <span className="text-xs text-[--text-muted]">
                      Reserved {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Hostel info */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0">
                        {hostel?.images?.[0] ? (
                          <img src={hostel.images[0]} alt="" className="w-full h-full object-cover rounded-xl"/>
                        ) : <span className="text-2xl">🏠</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[--text-primary] truncate">{hostel?.name}</p>
                        <p className="text-xs text-[--text-muted]">{hostel?.location} · {hostel?.city}</p>
                        <p className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold mt-0.5">
                          {room?.name} · {r.numberOfPeople} person{r.numberOfPeople !== 1 ? "s" : ""} · GH₵{room?.price?.toLocaleString()}/{room?.billing === "Semester" ? "sem" : "yr"}
                        </p>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/40 dark:bg-white/05 rounded-lg p-2">
                        <span className="text-[--text-muted] block">Host</span>
                        <span className="font-semibold text-[--text-primary]">{host?.fullName}</span>
                      </div>
                      <div className="bg-white/40 dark:bg-white/05 rounded-lg p-2">
                        <span className="text-[--text-muted] block">Host Phone</span>
                        <a href={`tel:${host?.phone}`} className="font-semibold text-[#1E40AF] dark:text-blue-300">{host?.phone}</a>
                      </div>
                    </div>

                    {/* Meetup info — shows when admin has scheduled */}
                    {r.status === "scheduled" && r.meetup?.scheduledAt && (
                      <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">📅 Meetup Scheduled</p>
                        <p className="text-sm font-bold text-[--text-primary]">
                          {new Date(r.meetup.scheduledAt).toLocaleDateString("en-GH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
                        </p>
                        <p className="text-sm text-[--text-secondary]">
                          🕐 {new Date(r.meetup.scheduledAt).toLocaleTimeString("en-GH", { hour:"2-digit", minute:"2-digit", hour12:true })}
                        </p>
                        {r.meetup.location && (
                          <p className="text-xs text-[--text-muted]">📍 {r.meetup.location}</p>
                        )}
                        {r.meetup.notes && (
                          <p className="text-xs text-[--text-muted] italic">"{r.meetup.notes}"</p>
                        )}
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          ✓ Email & SMS sent to you and the host
                        </p>
                      </div>
                    )}

                    {r.message && (
                      <div className="bg-white/30 dark:bg-white/05 rounded-lg p-2.5">
                        <p className="text-xs text-[--text-muted]">Your note: <span className="italic text-[--text-secondary]">"{r.message}"</span></p>
                      </div>
                    )}

                    {/* Actions */}
                    {["pending","scheduled"].includes(r.status) && (
                      <button onClick={() => cancel(r._id)} disabled={cancelling === r._id}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold hover:underline disabled:opacity-50 transition">
                        {cancelling === r._id ? "Cancelling..." : "Cancel Reservation"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────
function MessagesTab({ studentId }) {
  const [conversations, setConversations] = useState(null);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadInbox = useCallback(async () => {
    try { const d = await api("/api/messages/inbox"); setConversations(d.conversations || []); }
    catch { setConversations([]); }
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [thread.length]);

  const openConv = async (conv) => {
    setActive(conv);
    try { const d = await api(`/api/messages/conversation/${conv.partnerId}`); setThread(d.messages || []); loadInbox(); }
    catch { setThread([]); }
  };

  const send = async () => {
    if (!reply.trim() || !active || sending) return;
    setSending(true);
    try {
      await api("/api/messages", "POST", { receiverId:active.partnerId, receiverModel:"Host", hostelId:active.hostelId, body:reply.trim() });
      setReply("");
      const d = await api(`/api/messages/conversation/${active.partnerId}`);
      setThread(d.messages || []);
    } catch(e) { alert(e.message); }
    finally { setSending(false); }
  };

  if (!conversations) return <Spinner/>;

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{height:540}}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${active ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 border-r border-white/20 dark:border-white/08 flex-shrink-0`}>
          <div className="p-4 border-b border-white/20 dark:border-white/08">
            <h2 className="font-bold text-[--text-primary]">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[--text-muted]">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs mt-1">Chat with a host from a hostel page.</p>
              </div>
            ) : conversations.map(c => (
              <button key={c.partnerId} onClick={() => openConv(c)}
                className={`flex items-start gap-3 p-4 w-full text-left border-b border-white/10 dark:border-white/05 hover:bg-white/20 dark:hover:bg-white/05 transition ${active?.partnerId===c.partnerId ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
                  {c.partnerName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[--text-primary] truncate">{c.partnerName}</p>
                  <p className="text-xs text-[--text-muted] truncate">{c.latestMessage}</p>
                </div>
                {c.unread > 0 && <span className="w-5 h-5 bg-[#F59E0B] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{c.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className={`${active ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {active ? (
            <>
              <div className="p-4 border-b border-white/20 dark:border-white/08 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="md:hidden text-[--text-muted]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
                  {active.partnerName?.charAt(0)}
                </div>
                <p className="font-bold text-[--text-primary] text-sm">{active.partnerName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{background:"rgba(0,0,0,0.02)"}}>
                {thread.map((msg, i) => {
                  const isMe = msg.senderModel === "Student" || msg.senderId === studentId;
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? "text-white rounded-br-md" : "text-[--text-primary] rounded-bl-md border border-white/30 dark:border-white/10"}`}
                        style={isMe ? {background:"linear-gradient(135deg,#1E40AF,#2563EB)"} : {background:"var(--glass-bg)"}}>
                        <p>{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-[--text-muted]"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>
              <div className="p-4 border-t border-white/20 dark:border-white/08 flex gap-2">
                <input className="input-field flex-1" placeholder="Type a message..."
                  value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && !e.shiftKey && (e.preventDefault(),send())}/>
                <button onClick={send} disabled={sending||!reply.trim()} className="btn-primary disabled:opacity-50 px-4 py-2.5">Send</button>
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
    </div>
  );
}

// ─── FAVOURITES TAB ───────────────────────────────────────────────────────────
function FavouritesTab({ savedHostels, onUnsave }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="font-bold text-[--text-primary] mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Saved Hostels</h2>
      {savedHostels.length === 0 ? (
        <Empty icon="🏚" title="No saved hostels" sub="Tap the heart on any hostel to save it here."
          action={<Link href="/" className="btn-primary text-sm px-5 py-2.5">Browse Hostels</Link>}/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedHostels.map(h => (
            <div key={h._id} className="flex gap-3 p-4 rounded-xl border border-white/30 dark:border-white/08 hover:bg-white/20 dark:hover:bg-white/05 transition group">
              <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex-shrink-0 overflow-hidden">
                {h.images?.[0] ? <img src={h.images[0]} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/hostel/${h._id}`} className="font-bold text-sm text-[--text-primary] group-hover:text-[#1E40AF] dark:group-hover:text-blue-300 truncate block">{h.name}</Link>
                <p className="text-xs text-[--text-muted] mt-0.5">{h.location} · {h.city}</p>
                <p className="text-sm font-bold text-[#1E40AF] dark:text-blue-300 mt-1">GH₵{h.priceFrom?.toLocaleString()}<span className="text-xs font-normal text-[--text-muted]">/yr</span></p>
              </div>
              <button onClick={() => onUnsave(h._id)} className="text-red-400 hover:text-red-600 flex-shrink-0 self-start">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ profile, onLogout }) {
  const [form, setForm] = useState({ firstName:profile.firstName||"", lastName:profile.lastName||"", phone:profile.phone||"", program:profile.program||"", year:profile.year||"" });
  const [passwords, setPasswords] = useState({ current:"", newP:"", confirm:"" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const showMsg = (m,ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3000); };

  const saveProfile = async () => {
    setSaving(true);
    try { await api("/api/students/update-profile","PUT",{firstName:form.firstName,lastName:form.lastName,phone:form.phone,program:form.program,year:form.year}); showMsg("Profile saved."); }
    catch(e) { showMsg(e.message,false); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (passwords.newP !== passwords.confirm) { showMsg("Passwords do not match.",false); return; }
    if (passwords.newP.length < 8) { showMsg("Min 8 characters.",false); return; }
    try { await api("/api/students/change-password","PUT",{currentPassword:passwords.current,newPassword:passwords.newP}); setPasswords({current:"",newP:"",confirm:""}); showMsg("Password updated."); }
    catch(e) { showMsg(e.message,false); }
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-[--text-primary] mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Profile Settings</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-2xl" style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
            {form.firstName?.charAt(0)||"S"}
          </div>
          <div>
            <p className="font-bold text-[--text-primary]">{form.firstName} {form.lastName}</p>
            <p className="text-xs text-[--text-muted]">{profile.email} · {form.program} · {form.year}</p>
            <p className="text-xs text-[--text-muted] mt-0.5">UMaT ID: {profile.umatId}</p>
          </div>
        </div>
        {msg && <div className={`rounded-xl px-4 py-3 text-sm mb-4 font-semibold ${msg.ok ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>{msg.m}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["First Name","firstName","Kwame"],["Last Name","lastName","Asante"],["Phone","phone","0244xxxxxx"]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
              <input className="input-field" placeholder={ph} value={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Email (read-only)</label>
            <input className="input-field opacity-60 cursor-not-allowed" value={profile.email} readOnly/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Year</label>
            <select className="input-field" value={form.year} onChange={e => setForm(p=>({...p,year:e.target.value}))}>
              {["L100","L200","L300","L400"].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-[--text-primary] mb-5" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Change Password</h2>
        <div className="space-y-4 max-w-sm">
          {[["Current Password","current"],["New Password","newP"],["Confirm New Password","confirm"]].map(([l,k]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-[--text-secondary] mb-1">{l}</label>
              <input type="password" className="input-field" value={passwords[k]} onChange={e => setPasswords(p=>({...p,[k]:e.target.value}))}/>
            </div>
          ))}
          <button onClick={changePassword} className="btn-primary">Update Password</button>
        </div>
      </div>

      {/* Dark mode setting */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-[--text-primary] mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[--text-primary]">Dark Mode</p>
            <p className="text-xs text-[--text-muted] mt-0.5">Toggle between light and dark theme</p>
          </div>
          <DarkModeButton/>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-red-200/50 dark:border-red-800/30">
        <h2 className="font-bold text-red-500 mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign Out</h2>
        <p className="text-sm text-[--text-muted] mb-4">You'll be signed out on this device.</p>
        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition">Sign Out</button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [pendingRes, setPendingRes] = useState(0);

  const loadProfile = useCallback(async () => {
    try { const d = await api("/api/students/me"); setProfile(d.student); }
    catch { router.push("/login"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user || JSON.parse(user).role !== "student") { router.push("/login"); return; }
    loadProfile();
  }, [loadProfile, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    const allowed = ["dashboard", "browse", "reservations", "messages", "favourites", "settings"];
    if (t && allowed.includes(t)) setTab(t);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const [inboxData, resData] = await Promise.all([
          api("/api/messages/inbox"),
          api("/api/reservations/mine"),
        ]);
        setUnread((inboxData.conversations||[]).reduce((s,c) => s+c.unread, 0));
        setPendingRes((resData.reservations||[]).filter(r => r.status==="pending").length);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, []);

  const handleUnsave = async (hostelId) => {
    try { await api("/api/students/save-hostel","POST",{hostelId}); loadProfile(); }
    catch(e) { alert(e.message); }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/></div>;
  if (!profile) return null;

  const saved   = profile.savedHostels || [];
  const recent  = profile.recentViews  || [];
  const initials = `${profile.firstName?.charAt(0)||""}${profile.lastName?.charAt(0)||""}`.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-extrabold text-xl text-[#1E40AF] dark:text-blue-300" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => t.id==="browse" ? router.push("/") : setTab(t.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${tab===t.id ? "text-white" : "text-[--text-muted] hover:text-[#1E40AF] dark:hover:text-blue-300 hover:bg-white/30 dark:hover:bg-white/10"}`}
                style={tab===t.id ? {background:"linear-gradient(135deg,#1E40AF,#2563EB)"} : {}}>
                <span style={{fontSize:"13px"}}>{t.icon}</span>{t.label}
                {t.id==="messages" && unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">{unread}</span>}
                {t.id==="reservations" && pendingRes > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">{pendingRes}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DarkModeButton/>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer" style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}} onClick={() => setTab("settings")}>
              {initials}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-white/20 dark:border-white/08">
          {TABS.map(t => (
            <button key={t.id} onClick={() => t.id==="browse" ? router.push("/") : setTab(t.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${tab===t.id ? "border-[#1E40AF] text-[#1E40AF] dark:border-blue-400 dark:text-blue-400" : "border-transparent text-[--text-muted]"}`}>
              {t.icon}{t.label}
              {t.id==="messages" && unread > 0 && <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{unread}</span>}
              {t.id==="reservations" && pendingRes > 0 && <span className="bg-amber-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{pendingRes}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="glass rounded-2xl p-5 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3" style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
              {initials}
            </div>
            <p className="font-bold text-[--text-primary]">{profile.firstName} {profile.lastName}</p>
            <p className="text-[--text-muted] text-sm mt-0.5">{profile.program} · {profile.year}</p>
            <p className="text-[--text-muted] text-xs mt-0.5">{profile.umatId}</p>
          </div>
          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="font-bold text-[--text-primary] text-sm">Activity</p>
            {[["Saved Hostels",saved.length],["Recent Views",recent.length],["Unread Messages",unread]].map(([l,v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-[--text-muted]">{l}</span>
                <span className="font-bold text-[#1E40AF] dark:text-blue-300">{v}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {tab === "dashboard" && (
            <>
              <div className="hero-gradient rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right,#F59E0B,transparent)"}}/>
                <p className="text-blue-200/80 text-sm">Welcome back 👋</p>
                <h1 className="text-2xl font-extrabold mt-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{profile.firstName} {profile.lastName}</h1>
                <p className="text-blue-200/80 text-sm mt-1">
                  {saved.length > 0 && <><span className="text-[#F59E0B] font-bold">{saved.length} saved</span> · </>}
                  {pendingRes > 0 && <><span className="text-[#F59E0B] font-bold">{pendingRes} reservation{pendingRes!==1?"s":""} pending</span></>}
                  {saved.length === 0 && pendingRes === 0 && "Browse and reserve a hostel today."}
                </p>
                <button onClick={() => router.push("/")} className="mt-4 btn-gold inline-block text-sm px-5 py-2.5">Browse Hostels →</button>
              </div>

              {/* Reservations preview */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[--text-primary]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>📋 My Reservations</h2>
                  <button onClick={() => setTab("reservations")} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">View all</button>
                </div>
                {pendingRes === 0 ? <Empty icon="📋" title="No reservations yet" sub="Find a hostel and hit 'Reserve' to get started."/> : (
                  <button onClick={() => setTab("reservations")} className="w-full bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition text-left">
                    {pendingRes} reservation{pendingRes!==1?"s":""} waiting for admin to schedule a meetup. Click to view →
                  </button>
                )}
              </div>

              {/* Saved */}
              {saved.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-[--text-primary]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>❤️ Saved Hostels</h2>
                    <button onClick={() => setTab("favourites")} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">View all</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {saved.slice(0,3).map(h => (
                      <Link key={h._id} href={`/hostel/${h._id}`} className="glass rounded-xl p-3 hover:bg-white/40 dark:hover:bg-white/10 transition group">
                        <p className="font-semibold text-sm text-[--text-primary] group-hover:text-[#1E40AF] dark:group-hover:text-blue-300 line-clamp-1">{h.name}</p>
                        <p className="text-xs text-[--text-muted] mt-0.5">{h.location} · GH₵{h.priceFrom?.toLocaleString()}/yr</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "reservations" && <ReservationsTab/>}
          {tab === "messages"     && <MessagesTab studentId={profile._id}/>}
          {tab === "favourites"   && <FavouritesTab savedHostels={saved} onUnsave={handleUnsave}/>}
          {tab === "settings"     && <SettingsTab profile={profile} onLogout={handleLogout}/>}
        </div>
      </main>
    </div>
  );
}