"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { admin as adminAPI, getUser, clearAuth } from "../../lib/api";

const TABS = [
  { id:"dashboard", label:"Dashboard",   icon:"📊" },
  { id:"pending",   label:"Pending",     icon:"⏳" },
  { id:"hostels",   label:"All Hostels", icon:"🏢" },
  { id:"students",  label:"Students",    icon:"🎓" },
  { id:"hosts",     label:"Hosts",       icon:"🏠" },
  { id:"payments",  label:"Payments",    icon:"💰" },
];

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
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
      {toast.type === "error" ? "✗" : "✓"} {toast.msg}
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function DashboardTab({ stats, setActiveTab }) {
  if (!stats) return <div className="flex justify-center py-20"><Spinner/></div>;
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1E40AF] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right,#F59E0B,transparent)"}}/>
        <div className="relative">
          <span className="text-xs font-bold bg-[#F59E0B] text-white px-3 py-1 rounded-full">ADMIN PANEL</span>
          <h1 className="text-2xl font-extrabold mt-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>HostelHub Admin</h1>
          <p className="text-blue-200 text-sm mt-1">
            {stats.pendingHostels > 0
              ? <><span className="text-[#F59E0B] font-bold">{stats.pendingHostels} hostel{stats.pendingHostels!==1?"s":""}</span> awaiting approval.</>
              : <span className="text-emerald-300">No pending hostels. ✓</span>}
          </p>
          {stats.pendingHostels > 0 && (
            <button onClick={() => setActiveTab("pending")} className="mt-4 inline-block bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              Review Pending ({stats.pendingHostels}) →
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:"Students", v:stats.students, icon:"🎓" },
          { l:"Hosts", v:stats.hosts, icon:"🏠" },
          { l:"Live Hostels", v:stats.approvedHostels, icon:"✅" },
          { l:"Pending Review", v:stats.pendingHostels, icon:"⏳", hi:stats.pendingHostels>0 },
        ].map(s => (
          <div key={s.l} className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition ${s.hi ? "border-amber-300" : "border-gray-100"}`}
            onClick={() => s.hi && setActiveTab("pending")}>
            <span style={{fontSize:"24px"}}>{s.icon}</span>
            <p className={`text-3xl font-extrabold mt-2 ${s.hi ? "text-amber-600" : "text-gray-800"}`}>{s.v}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {(stats.totalRevenue > 0 || stats.totalPaidOut > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <span style={{fontSize:"22px"}}>💰</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">GH₵{stats.totalRevenue?.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Platform Revenue (5% fee)</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <span style={{fontSize:"22px"}}>🏦</span>
            <p className="text-2xl font-extrabold text-[#1E40AF] mt-2">GH₵{stats.totalPaidOut?.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">Paid Out to Hosts (95%)</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PENDING ───────────────────────────────────────────────────────────────────
function PendingTab({ reload }) {
  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    try { const data = await adminAPI.pendingHostels(); setPending(data.hostels || []); }
    catch { setPending([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (hostel) => {
    setActing(true);
    try {
      await adminAPI.approve(hostel._id);
      setPending(prev => prev.filter(h => h._id !== hostel._id));
      setSelected(null);
      showToast(`"${hostel.name}" approved and is now live!`);
      reload();
    } catch(e) { showToast(e.message, "error"); }
    finally { setActing(false); }
  };

  const handleReject = async (hostel) => {
    if (!rejectReason.trim()) return;
    setActing(true);
    try {
      await adminAPI.reject(hostel._id, rejectReason);
      setPending(prev => prev.filter(h => h._id !== hostel._id));
      setSelected(null); setShowReject(false); setRejectReason("");
      showToast(`"${hostel.name}" rejected.`, "error");
      reload();
    } catch(e) { showToast(e.message, "error"); }
    finally { setActing(false); }
  };

  if (pending === null) return <div className="flex justify-center py-20"><Spinner/></div>;

  if (pending.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
      <span className="text-5xl block mb-4">✅</span>
      <h2 className="text-xl font-bold text-gray-700">All clear!</h2>
      <p className="text-gray-400 mt-2">No hostels pending review right now.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Toast toast={toast}/>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium flex items-center gap-2">
        ⏳ {pending.length} hostel{pending.length!==1?"s":""} awaiting review. Click a card to review.
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        <div className="flex-1 space-y-3">
          {pending.map(h => (
            <button key={h._id} onClick={() => { setSelected(h); setShowReject(false); setRejectReason(""); }}
              className={`w-full bg-white rounded-2xl border shadow-sm p-5 text-left transition-all hover:shadow-md ${selected?._id===h._id ? "border-[#1E40AF] ring-2 ring-[#1E40AF]/20" : "border-gray-100 hover:border-[#1E40AF]/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 text-base">{h.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">By <span className="font-semibold">{h.ownerId?.fullName}</span> · {h.location} · {h.gender}</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted {new Date(h.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full flex-shrink-0">⏳ Pending</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{h.description}</p>
              {h.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {h.amenities.slice(0,4).map(a => (
                    <span key={a} className="bg-blue-50 text-[#1E40AF] text-xs px-2 py-0.5 rounded-full font-medium">{a}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        {selected && (
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-20 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Review Hostel</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition">×</button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto" style={{maxHeight:"70vh"}}>
                <div>
                  <p className="text-lg font-extrabold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{selected.location} · {selected.gender}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {[
                    ["Host", selected.ownerId?.fullName],
                    ["Email", selected.ownerId?.email],
                    ["Phone", selected.ownerId?.phone],
                    ["Submitted", new Date(selected.createdAt).toLocaleDateString()],
                    ["Price", selected.priceFrom ? `GH₵${selected.priceFrom.toLocaleString()} – GH₵${selected.priceTo?.toLocaleString()}` : "Not set"],
                    ["Distance", selected.campusDistance || "Not set"],
                    ["Address", selected.address || "Not set"],
                  ].map(([l,v]) => v && (
                    <div key={l} className="flex justify-between text-sm">
                      <span className="text-gray-400">{l}</span>
                      <span className="font-semibold text-gray-700 text-right max-w-[60%] break-words">{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.description}</p>
                </div>
                {selected.amenities?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.amenities.map(a => <span key={a} className="bg-blue-50 text-[#1E40AF] text-xs font-semibold px-2.5 py-1 rounded-full">{a}</span>)}
                    </div>
                  </div>
                )}
                {selected.ownershipDocs?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Documents ({selected.ownershipDocs.length})</p>
                    <div className="space-y-2">
                      {selected.ownershipDocs.map((doc, i) => (
                        <a key={i} href={doc}
                          className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-[#1E40AF] transition">
                          <span className="text-xl">{doc.includes(".pdf") ? "📄" : "🖼️"}</span>
                          <span className="text-xs text-[#1E40AF] font-medium hover:underline">View Document {i+1} ↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selected.images?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Images ({selected.images.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selected.images.slice(0,4).map((img, i) => (
                        <a key={i} href={img}>
                          <img src={img} alt="" className="w-full h-20 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition"/>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="border-t border-gray-100 pt-4">
                  {!showReject ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleApprove(selected)} disabled={acting}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                        {acting ? "..." : "Approve"}
                      </button>
                      <button onClick={() => setShowReject(true)} disabled={acting}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Reason for rejection <span className="text-red-500">*</span></label>
                        <textarea autoFocus
                          className="w-full border border-red-200 focus:border-red-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 h-24 resize-none"
                          placeholder="E.g. Documents are incomplete. Please resubmit with a valid title deed."
                          value={rejectReason} onChange={e => setRejectReason(e.target.value)}/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleReject(selected)} disabled={!rejectReason.trim() || acting}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold rounded-xl py-2.5 text-sm transition-all">
                          {acting ? "..." : "Confirm Reject"}
                        </button>
                        <button onClick={() => { setShowReject(false); setRejectReason(""); }}
                          className="border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm hover:border-gray-300 transition bg-white">
                          Cancel
                        </button>
                      </div>
                    </div>
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

// ── ALL HOSTELS ───────────────────────────────────────────────────────────────
function AllHostelsTab() {
  const [hostels, setHostels] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  const load = useCallback(async (s="") => {
    try { const data = await adminAPI.allHostels(s ? { search:s } : {}); setHostels(data.hostels || []); }
    catch { setHostels([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 400);
    return () => clearTimeout(t);
  }, [search, load]);

  const toggleFeatured = async (h) => {
    try {
      await adminAPI.feature(h._id);
      setHostels(prev => prev.map(x => x._id===h._id ? {...x, featured:!x.featured} : x));
      showToast(`"${h.name}" ${h.featured ? "unfeatured" : "featured"}.`);
    } catch(e) { showToast(e.message, "error"); }
  };

  const removeHostel = async (h) => {
    if (!window.confirm(`Remove "${h.name}" permanently?`)) return;
    try {
      await adminAPI.removeHostel(h._id);
      setHostels(prev => prev.filter(x => x._id !== h._id));
      showToast(`"${h.name}" removed.`, "error");
    } catch(e) { showToast(e.message, "error"); }
  };

  const approveHostel = async (h) => {
    if (!window.confirm(`Approve "${h.name}" and make it live?`)) return;
    try {
      await adminAPI.approve(h._id);
      setHostels(prev => prev.map(x => x._id === h._id ? { ...x, status: "approved", rejectionReason: null } : x));
      showToast(`"${h.name}" approved and is now live!`);
    } catch (e) { showToast(e.message, "error"); }
  };

  const rejectHostel = async (h) => {
    const reason = window.prompt(`Reject "${h.name}". Please provide a reason:`);
    if (!reason || !reason.trim()) return;
    try {
      await adminAPI.reject(h._id, reason.trim());
      setHostels(prev => prev.map(x => x._id === h._id ? { ...x, status: "rejected", rejectionReason: reason.trim() } : x));
      showToast(`"${h.name}" rejected.`, "error");
    } catch (e) { showToast(e.message, "error"); }
  };

  const updateRating = async (h, newRating) => {
    try {
      await adminAPI.rating(h._id, newRating);
      setHostels(prev => prev.map(x => x._id === h._id ? { ...x, hostRating: newRating } : x));
      showToast(`"${h.name}" rating set to ${newRating}.`);
    } catch (e) { showToast(e.message, "error"); }
  };

  if (hostels === null) return <div className="flex justify-center py-20"><Spinner/></div>;

  return (
    <div className="space-y-4">
      <Toast toast={toast}/>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search hostel name..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{hostels.length} hostel{hostels.length!==1?"s":""}</span>
      </div>

      {hostels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <Empty icon="🏢" title="No hostels found" sub="No approved hostels yet."/>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Hostel","Host","Location","Status","Views","Rating","Featured","Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hostels.map(h => (
                  <tr key={h._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-gray-800">{h.name}</td>
                    <td className="px-4 py-3 text-gray-500">{h.ownerId?.fullName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-[#1E40AF] text-xs font-semibold px-2 py-1 rounded-full">{h.location}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        h.status==="approved" ? "bg-emerald-50 text-emerald-700"
                        : h.status==="pending" ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                      }`}>{h.status}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1E40AF]">{h.viewsCount||0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => updateRating(h, star)}
                            className={`text-lg transition-all ${star <= (h.hostRating || 0) ? "text-[#F59E0B]" : "text-gray-300 hover:text-[#F59E0B]"}`}
                            title={`Rate ${star}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {h.status === "approved" && (
                        <button onClick={() => toggleFeatured(h)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${h.featured ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-white" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"}`}>
                          {h.featured ? "⭐ Featured" : "Set Featured"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/hostel/${h._id}`} className="text-xs text-[#1E40AF] font-bold hover:underline">
                          View ↗
                        </Link>
                        {h.status === "pending" && (
                          <>
                            <button onClick={() => approveHostel(h)} className="text-xs text-emerald-700 font-bold hover:underline">
                              Approve
                            </button>
                            <button onClick={() => rejectHostel(h)} className="text-xs text-red-500 font-bold hover:underline">
                              Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => removeHostel(h)} className="text-xs text-red-400 font-semibold hover:text-red-600 hover:underline">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── USERS TAB (students or hosts) ─────────────────────────────────────────────
function UsersTab({ type }) {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const showToast = (msg, t="success") => { setToast({msg,type:t}); setTimeout(()=>setToast(null),2500); };

  const load = useCallback(async (s="") => {
    try {
      const data = type === "student" ? await adminAPI.students(s) : await adminAPI.hosts(s);
      setUsers(type === "student" ? data.students : data.hosts);
    } catch { setUsers([]); }
  }, [type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => load(search), 400); return () => clearTimeout(t); }, [search, load]);

  const remove = async (u) => {
    const name = u.firstName ? `${u.firstName} ${u.lastName}` : u.fullName;
    if (!window.confirm(`Remove ${name} from the platform?`)) return;
    try {
      if (type === "student") await adminAPI.removeStudent(u._id);
      else await adminAPI.removeHost(u._id);
      setUsers(prev => prev.filter(x => x._id !== u._id));
      showToast(`${name} removed.`, "error");
    } catch(e) { showToast(e.message, "error"); }
  };

  const toggleVerify = async (u) => {
    try {
      await adminAPI.verifyHost(u._id);
      setUsers(prev => prev.map(x => x._id===u._id ? {...x, verified:!x.verified} : x));
      showToast(`Host ${u.verified ? "unverified" : "verified"}.`);
    } catch(e) { showToast(e.message, "error"); }
  };

  if (users === null) return <div className="flex justify-center py-20"><Spinner/></div>;

  return (
    <div className="space-y-4">
      <Toast toast={toast}/>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={`Search ${type}s by name or email...`} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <Empty icon={type==="student" ? "🎓" : "🏠"} title={`No ${type}s registered yet`} sub={`${type === "student" ? "Students" : "Hosts"} who sign up will appear here.`}/>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{users.length} {type}{users.length!==1?"s":""}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {users.map(u => {
              const name = u.firstName ? `${u.firstName} ${u.lastName}` : u.fullName;
              return (
                <div key={u._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${type==="student" ? "bg-[#1E40AF]" : "bg-[#F59E0B]"}`}>
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{name}</p>
                      <p className="text-xs text-gray-400">{u.email} · {u.phone}</p>
                      {type === "student" && <p className="text-xs text-gray-400">{u.program} · {u.year} · {u.umatId}</p>}
                      {type === "host" && <p className="text-xs text-gray-400">{u.hostelIds?.length||0} hostel{u.hostelIds?.length!==1?"s":""}  · Joined {new Date(u.createdAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {type === "host" && (
                      <button onClick={() => toggleVerify(u)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${u.verified ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-white" : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"}`}>
                        {u.verified ? "✓ Verified" : "Verify"}
                      </button>
                    )}
                    <button onClick={() => remove(u)} className="text-xs text-red-400 font-semibold hover:text-red-600 hover:underline">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
function PaymentsTab({ stats }) {
  const [payments, setPayments] = useState(null);
  const [chargeFilter, setChargeFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const params = {};
    if (chargeFilter !== "all") params.chargeStatus = chargeFilter;
    params.includePaystack = "true";
    adminAPI.payments(params).then(d => setPayments(d.payments || [])).catch(() => setPayments([]));
  }, [chargeFilter]);

  const openPayment = async (paymentRef) => {
    try {
      setLoadingDetail(true);
      const data = await adminAPI.paymentByReference(paymentRef);
      setSelectedPayment(data.payment || null);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (payments === null) return <div className="flex justify-center py-20"><Spinner/></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { l:"Platform Revenue (after Paystack 1.95%)", v:`GH₵${stats?.totalRevenue?.toLocaleString()||0}`, icon:"💰", color:"text-emerald-600" },
          { l:"Paid Out to Hosts (after all fees)", v:`GH₵${stats?.totalPaidOut?.toLocaleString()||0}`, icon:"🏦", color:"text-[#1E40AF]" },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <span style={{fontSize:"22px"}}>{s.icon}</span>
            <p className={`text-2xl font-extrabold mt-2 ${s.color}`}>{s.v}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: "All" },
          { id: "success", label: "Successful Charges" },
          { id: "pending", label: "Pending Charges" },
          { id: "failed", label: "Failed Charges" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setChargeFilter(opt.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              chargeFilter === opt.id
                ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                : "bg-white text-gray-500 border-gray-200 hover:border-[#1E40AF] hover:text-[#1E40AF]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <Empty icon="💰" title="No payments yet" sub="Payments from students will appear here once processed."/>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Student","Hostel","Amount Paid","Paystack Fee","Platform Fee","Host Payout","Date","Status"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openPayment(p.reference)}>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {(p.studentId?.firstName || p.studentId?.lastName) ? `${p.studentId?.firstName || ""} ${p.studentId?.lastName || ""}`.trim() : (p.studentId?.email || "—")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.hostelId?.name || "—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">GH₵{p.amountPaid?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-amber-600 font-semibold">GH₵{(p.gatewayFee || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">GH₵{p.platformFee?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#1E40AF] font-semibold">GH₵{p.hostPayout?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.paystackChargeStatus === "success" ? "bg-emerald-50 text-emerald-700"
                          : p.paystackChargeStatus === "failed" ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }`}>
                        {p.paystackChargeStatus === "success" ? "✓ Charge Success" : p.paystackChargeStatus === "failed" ? "✗ Charge Failed" : "⏳ Charge Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loadingDetail && <div className="text-xs text-gray-400">Loading transaction details...</div>}

      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-100 shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-gray-900">Transaction Detail</h3>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">Reference:</span> <span className="font-mono">{selectedPayment.reference}</span></p>
              <p><span className="text-gray-400">Source:</span> {selectedPayment.source || "platform"}</p>
              <p><span className="text-gray-400">Student:</span> {(selectedPayment.studentId?.firstName || selectedPayment.studentId?.lastName) ? `${selectedPayment.studentId?.firstName || ""} ${selectedPayment.studentId?.lastName || ""}`.trim() : "—"} ({selectedPayment.studentId?.email || "—"})</p>
              <p><span className="text-gray-400">Host:</span> {selectedPayment.hostId?.fullName || "—"} ({selectedPayment.hostId?.email || "—"})</p>
              <p><span className="text-gray-400">Hostel:</span> {selectedPayment.hostelId?.name || "—"}</p>
              <p><span className="text-gray-400">Amount Paid:</span> GH₵{selectedPayment.amountPaid?.toLocaleString()}</p>
              <p><span className="text-gray-400">Paystack Fee (1.95%):</span> GH₵{(selectedPayment.gatewayFee || 0).toLocaleString()}</p>
              <p><span className="text-gray-400">Net After Paystack:</span> GH₵{(selectedPayment.netAfterGateway || selectedPayment.amountPaid || 0).toLocaleString()}</p>
              <p><span className="text-gray-400">Platform Fee:</span> GH₵{selectedPayment.platformFee?.toLocaleString()}</p>
              <p><span className="text-gray-400">Host Payout:</span> GH₵{selectedPayment.hostPayout?.toLocaleString()}</p>
              <p><span className="text-gray-400">Charge Status:</span> {selectedPayment.paystackChargeStatus}</p>
              <p><span className="text-gray-400">Charge Failure Reason:</span> {selectedPayment.chargeFailureReason || "—"}</p>
              <p><span className="text-gray-400">Gateway Response:</span> {selectedPayment.paystackGatewayResponse || "—"}</p>
              <p><span className="text-gray-400">Transfer Status:</span> {selectedPayment.transferStatus || "—"}</p>
              <p><span className="text-gray-400">Transfer Failure Reason:</span> {selectedPayment.transferFailureReason || "—"}</p>
              <p><span className="text-gray-400">Transfer Code:</span> {selectedPayment.transferCode || "—"}</p>
              <p><span className="text-gray-400">Booking ID:</span> {selectedPayment.bookingId?._id || "—"}</p>
              <p><span className="text-gray-400">Booking Payment Status:</span> {selectedPayment.bookingId?.paymentStatus || "—"}</p>
              <p><span className="text-gray-400">Created:</span> {new Date(selectedPayment.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    try { const data = await adminAPI.dashboard(); setStats(data.stats); }
    catch {}
  }, []);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "admin") { router.push("/login"); return; }
    setUser(u);
    loadStats();
  }, [router, loadStats]);

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Spinner/></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
            <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2.5 py-1 rounded-full tracking-wide">ADMIN</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab===tab.id ? "bg-[#1E40AF] text-white" : "text-gray-500 hover:bg-blue-50 hover:text-[#1E40AF]"}`}>
                <span style={{fontSize:"13px"}}>{tab.icon}</span>{tab.label}
                {tab.id==="pending" && stats?.pendingHostels > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {stats.pendingHostels}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-[#1E40AF] font-medium transition">View site ↗</Link>
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-600 font-semibold border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-xl transition">
              Log out
            </button>
          </div>
        </div>
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab===tab.id ? "border-[#1E40AF] text-[#1E40AF]" : "border-transparent text-gray-400"}`}>
              {tab.icon}{tab.label}
              {tab.id==="pending" && stats?.pendingHostels > 0 && (
                <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">{stats.pendingHostels}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "dashboard" && <DashboardTab stats={stats} setActiveTab={setActiveTab}/>}
        {activeTab === "pending"   && <PendingTab reload={loadStats}/>}
        {activeTab === "hostels"   && <AllHostelsTab/>}
        {activeTab === "students"  && <UsersTab type="student"/>}
        {activeTab === "hosts"     && <UsersTab type="host"/>}
        {activeTab === "payments"  && <PaymentsTab stats={stats}/>}
      </main>
    </div>
  );
}