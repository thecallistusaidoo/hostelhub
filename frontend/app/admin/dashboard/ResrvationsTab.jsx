// app/admin/dashboard/_ReservationsTab.jsx
// Drop this into the admin dashboard as a new "Reservations" tab.
// Admin can see all reservations, schedule meetups (sends SMS+email to student+host),
// confirm or cancel reservations.
"use client";
import { useState, useEffect, useCallback } from "react";

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

const STATUS_COLORS = {
  pending:   "status-pending",
  scheduled: "status-approved",
  confirmed: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full",
  cancelled: "status-rejected",
};
const STATUS_LABELS = { pending:"⏳ Pending", scheduled:"📅 Scheduled", confirmed:"✅ Confirmed", cancelled:"✗ Cancelled" };

function Spinner() { return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/></div>; }

export default function ReservationsTab({ onUpdated }) {
  const [reservations, setReservations] = useState(null);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [meetupForm, setMeetupForm] = useState({ scheduledAt:"", location:"", notes:"" });
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),5000); };

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/reservations/admin/all${filter !== "all" ? `?status=${filter}` : ""}`);
      setReservations(d.reservations || []);
      setCounts(d.counts || {});
    } catch { setReservations([]); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Pre-fill meetup location from hostel address
  const openSchedule = (reservation) => {
    setSelected(reservation);
    setScheduling(true);
    setMeetupForm({
      scheduledAt: "",
      location: reservation.hostelId?.address || reservation.hostelId?.landmark || reservation.hostelId?.name || "",
      notes: "",
    });
  };

  const handleSchedule = async () => {
    if (!meetupForm.scheduledAt) { showToast("Please select a date and time.", "error"); return; }
    setActing(true);
    try {
      const d = await api(`/api/reservations/admin/${selected._id}/schedule`, "PUT", meetupForm);
      showToast(`✓ Meetup scheduled. ${d.notificationsSent ? "Email & SMS sent to student and host." : "Notifications failed — check logs."}`);
      setScheduling(false);
      setSelected(null);
      await load();
      onUpdated?.();
    } catch(e) { showToast(e.message, "error"); }
    finally { setActing(false); }
  };

  const handleConfirm = async (id) => {
    setActing(true);
    try {
      await api(`/api/reservations/admin/${id}/confirm`, "PUT");
      showToast("Reservation confirmed.");
      setSelected(null);
      await load();
      onUpdated?.();
    } catch(e) { showToast(e.message, "error"); }
    finally { setActing(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation? The room slot will be freed.")) return;
    setActing(true);
    try {
      await api(`/api/reservations/admin/${id}/cancel`, "PUT");
      showToast("Reservation cancelled.", "error");
      setSelected(null);
      await load();
      onUpdated?.();
    } catch(e) { showToast(e.message, "error"); }
    finally { setActing(false); }
  };

  const handleResend = async (id) => {
    setActing(true);
    try {
      const d = await api(`/api/reservations/admin/${id}/resend-notification`, "POST");
      showToast(d.message);
      await load();
      onUpdated?.();
    } catch(e) { showToast(e.message, "error"); }
    finally { setActing(false); }
  };

  if (!reservations) return <Spinner/>;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          {toast.type === "error" ? "✗" : "✓"} {toast.msg}
        </div>
      )}

      {/* Filter tabs + counts */}
      <div className="glass rounded-2xl p-4 flex gap-2 flex-wrap">
        {[["all","All"],["pending","Pending"],["scheduled","Scheduled"],["confirmed","Confirmed"],["cancelled","Cancelled"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter===v ? "text-white" : "text-[--text-muted] hover:text-[--text-primary] hover:bg-white/30 dark:hover:bg-white/10"}`}
            style={filter===v ? {background:"linear-gradient(135deg,#1E40AF,#2563EB)"} : {}}>
            {l}
            <span className="ml-1.5 text-xs opacity-70">
              ({v==="all"
                ? (counts.pending||0)+(counts.scheduled||0)+(counts.confirmed||0)+(counts.cancelled||0)
                : counts[v]||0})
            </span>
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l:"Pending",   v:counts.pending||0,   icon:"⏳", hi:true },
          { l:"Scheduled", v:counts.scheduled||0, icon:"📅" },
          { l:"Confirmed", v:counts.confirmed||0, icon:"✅" },
          { l:"Cancelled", v:counts.cancelled||0, icon:"✗"  },
        ].map(s => (
          <div key={s.l} className={`glass rounded-2xl p-4 ${s.hi && s.v > 0 ? "border border-amber-300 dark:border-amber-700" : ""}`}>
            <span style={{fontSize:"18px"}}>{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-1 ${s.hi && s.v > 0 ? "text-amber-600 dark:text-amber-400" : "text-[--text-primary]"}`}>{s.v}</p>
            <p className="text-xs text-[--text-muted] mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Scheduling modal */}
      {scheduling && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.5)"}}>
          <div className="glass-heavy rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[--text-primary] text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                📅 Schedule Meetup
              </h3>
              <button onClick={() => setScheduling(false)} className="text-[--text-muted] hover:text-[--text-primary] text-2xl">×</button>
            </div>

            {/* Summary */}
            <div className="bg-white/30 dark:bg-white/05 rounded-xl p-4 space-y-1.5 text-sm">
              <p><span className="text-[--text-muted]">Student:</span> <span className="font-semibold text-[--text-primary]">{selected.studentId?.firstName} {selected.studentId?.lastName}</span></p>
              <p><span className="text-[--text-muted]">Phone:</span> <span className="font-semibold text-[--text-primary]">{selected.studentId?.phone}</span></p>
              <p><span className="text-[--text-muted]">Hostel:</span> <span className="font-semibold text-[--text-primary]">{selected.hostelId?.name}</span></p>
              <p><span className="text-[--text-muted]">Room:</span> <span className="font-semibold text-[--text-primary]">{selected.roomId?.name} × {selected.numberOfPeople} person{selected.numberOfPeople!==1?"s":""}</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Date & Time *</label>
                <input type="datetime-local"
                  className="input-field"
                  min={new Date().toISOString().slice(0,16)}
                  value={meetupForm.scheduledAt}
                  onChange={e => setMeetupForm(p=>({...p,scheduledAt:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Meeting Location</label>
                <input className="input-field" placeholder="e.g. At the hostel main entrance"
                  value={meetupForm.location} onChange={e => setMeetupForm(p=>({...p,location:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[--text-secondary] mb-1">Notes (optional)</label>
                <textarea className="input-field h-20 resize-none" placeholder="Any instructions for student or host..."
                  value={meetupForm.notes} onChange={e => setMeetupForm(p=>({...p,notes:e.target.value}))}/>
              </div>
            </div>

            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
              📧📱 When you confirm, an <strong>email and SMS</strong> will automatically be sent to both the student and the host with the meetup details.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setScheduling(false)} className="btn-ghost py-3 text-sm">Cancel</button>
              <button onClick={handleSchedule} disabled={acting || !meetupForm.scheduledAt}
                className="btn-primary py-3 text-sm disabled:opacity-60">
                {acting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Scheduling...
                  </span>
                ) : "Schedule & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation list + detail */}
      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-1 space-y-3">
          {reservations.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <span className="text-5xl block mb-3">📋</span>
              <p className="font-bold text-[--text-primary]">No {filter !== "all" ? filter : ""} reservations</p>
            </div>
          ) : reservations.map(r => (
            <button key={r._id} onClick={() => { setSelected(r); setScheduling(false); }}
              className={`w-full glass rounded-2xl p-4 text-left transition-all hover:shadow-lg ${selected?._id===r._id ? "border-2 border-[#1E40AF] dark:border-blue-400" : "border border-white/20 dark:border-white/08"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{background:"linear-gradient(135deg,#1E40AF,#2563EB)"}}>
                    {r.studentId?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[--text-primary] text-sm">{r.studentId?.firstName} {r.studentId?.lastName}</p>
                    <p className="text-xs text-[--text-muted]">{r.hostelId?.name} · {r.roomId?.name}</p>
                    <p className="text-xs text-[--text-muted]">{r.numberOfPeople} person{r.numberOfPeople!==1?"s":""} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</span>
              </div>
              {r.status === "scheduled" && r.meetup?.scheduledAt && (
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  📅 {new Date(r.meetup.scheduledAt).toLocaleDateString("en-GH",{weekday:"short",day:"numeric",month:"short"})} at {new Date(r.meetup.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:true})}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && !scheduling && (
          <div className="lg:w-80 flex-shrink-0">
            <div className="glass rounded-2xl sticky top-20 overflow-hidden">
              <div className="bg-white/30 dark:bg-white/05 border-b border-white/20 dark:border-white/08 px-5 py-4 flex items-center justify-between">
                <h3 className="font-bold text-[--text-primary]">Reservation Details</h3>
                <button onClick={() => setSelected(null)} className="text-[--text-muted] hover:text-[--text-primary] text-xl w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/30 dark:hover:bg-white/10 transition">×</button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto" style={{maxHeight:"70vh"}}>

                <span className={`inline-block ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>

                {/* Student */}
                <div>
                  <p className="text-xs font-bold text-[--text-muted] uppercase tracking-wide mb-2">Student</p>
                  <div className="space-y-1.5">
                    {[
                      ["Name",    `${selected.studentId?.firstName} ${selected.studentId?.lastName}`],
                      ["Email",   selected.studentId?.email],
                      ["Phone",   selected.studentId?.phone],
                      ["UMaT ID", selected.studentId?.umatId],
                    ].map(([l,v]) => v && (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-[--text-muted]">{l}</span>
                        <span className="font-semibold text-[--text-primary] text-right max-w-[60%] break-words">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reservation */}
                <div>
                  <p className="text-xs font-bold text-[--text-muted] uppercase tracking-wide mb-2">Reservation</p>
                  <div className="space-y-1.5">
                    {[
                      ["Hostel",   selected.hostelId?.name],
                      ["Location", selected.hostelId?.location],
                      ["Room",     selected.roomId?.name],
                      ["Price",    selected.roomId?.price ? `GH₵${selected.roomId.price.toLocaleString()}/${selected.roomId.billing==="Semester"?"sem":"yr"}` : "—"],
                      ["# People", `${selected.numberOfPeople} person${selected.numberOfPeople!==1?"s":""}`],
                    ].map(([l,v]) => v && (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-[--text-muted]">{l}</span>
                        <span className="font-semibold text-[--text-primary] text-right">{v}</span>
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

                {/* Meetup info */}
                {selected.meetup?.scheduledAt && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">Meetup</p>
                    <p className="text-sm font-bold text-[--text-primary]">{new Date(selected.meetup.scheduledAt).toLocaleDateString("en-GH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                    <p className="text-sm text-[--text-secondary]">{new Date(selected.meetup.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:true})}</p>
                    {selected.meetup.location && <p className="text-xs text-[--text-muted] mt-1">📍 {selected.meetup.location}</p>}
                    <p className={`text-xs mt-2 font-semibold ${selected.meetup.notificationSent ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                      {selected.meetup.notificationSent ? "✓ Notifications sent" : "⚠ Notifications not sent"}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1 border-t border-white/20 dark:border-white/08">
                  {selected.status === "pending" && (
                    <button onClick={() => openSchedule(selected)} className="w-full btn-primary py-3 text-sm">
                      📅 Schedule Meetup & Notify
                    </button>
                  )}
                  {selected.status === "scheduled" && (
                    <>
                      <button onClick={() => handleConfirm(selected._id)} disabled={acting} className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                        style={{background:"linear-gradient(135deg,#059669,#10B981)"}}>
                        {acting ? "..." : "✅ Mark as Confirmed"}
                      </button>
                      <button onClick={() => openSchedule(selected)} className="w-full btn-ghost py-2.5 text-sm">
                        ✏️ Reschedule
                      </button>
                      <button onClick={() => handleResend(selected._id)} disabled={acting} className="w-full text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline disabled:opacity-50">
                        Resend notifications
                      </button>
                    </>
                  )}
                  {["pending","scheduled"].includes(selected.status) && (
                    <button onClick={() => handleCancel(selected._id)} disabled={acting}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60">
                      {acting ? "..." : "✗ Cancel Reservation"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}