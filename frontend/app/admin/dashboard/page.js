"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_PENDING_HOSTELS = [
  { id:"ph1", name:"Sunshine Hostel", host:"Kojo Mensah", email:"kojo@gmail.com", phone:"0241234567",
    location:"Umat", gender:"Mixed", submittedAt:"Apr 6, 2026", description:"A brand new hostel near the main UMaT gate with 20 rooms.",
    amenities:["WiFi","Water","Electricity","Security"], priceFrom:3000, priceTo:5000, docs:["deed.pdf","ghana-card.jpg"] },
  { id:"ph2", name:"Blue Ridge Lodge", host:"Akosua Amponsah", email:"akosua@gmail.com", phone:"0209988776",
    location:"Tarkwa", gender:"Female Only", submittedAt:"Apr 5, 2026", description:"Female-only hostel on the Takoradi road with 12 rooms.",
    amenities:["Water","Electricity","Security","Laundry"], priceFrom:2500, priceTo:3500, docs:["ownership.pdf"] },
  { id:"ph3", name:"Scholar's Retreat", host:"Kwabena Boateng", email:"kwabena@gmail.com", phone:"0277001234",
    location:"Umat", gender:"Mixed", submittedAt:"Apr 3, 2026", description:"Study-focused hostel 2 mins from the UMaT library.",
    amenities:["WiFi","Water","Generator","Electricity","Security"], priceFrom:3800, priceTo:6000, docs:["title-deed.pdf","permit.jpg"] },
];

const MOCK_APPROVED_HOSTELS = [
  { id:"ah1", name:"Abitjack Hostel", host:"Martha Adasi", location:"Umat", status:"approved", views:340, bookings:5, featured:true, approvedAt:"Mar 1, 2026" },
  { id:"ah2", name:"Campus View Suites", host:"Kwame Asante", location:"Umat", status:"approved", views:780, bookings:12, featured:true, approvedAt:"Feb 20, 2026" },
  { id:"ah3", name:"Green Valley Lodge", host:"Abena Owusu", location:"Umat", status:"approved", views:520, bookings:8, featured:false, approvedAt:"Feb 15, 2026" },
  { id:"ah4", name:"Goldfields Hostel", host:"Ama Boateng", location:"Tarkwa", status:"approved", views:430, bookings:6, featured:false, approvedAt:"Jan 30, 2026" },
];

const MOCK_STUDENTS = [
  { id:"s1", name:"Kwame Asante", email:"kwame@umat.edu.gh", phone:"0244123456", program:"Mining Engineering", year:"L300", savedHostels:3, joinedAt:"Feb 2026" },
  { id:"s2", name:"Abena Mensah", email:"abena@umat.edu.gh", phone:"0203456789", program:"Civil Engineering", year:"L200", savedHostels:1, joinedAt:"Mar 2026" },
  { id:"s3", name:"Kofi Darko", email:"kofi@umat.edu.gh", phone:"0501112233", program:"Computer Science", year:"L400", savedHostels:5, joinedAt:"Jan 2026" },
  { id:"s4", name:"Ama Sarpong", email:"ama@umat.edu.gh", phone:"0244998877", program:"Mathematics", year:"L100", savedHostels:2, joinedAt:"Apr 2026" },
];

const MOCK_HOSTS = [
  { id:"h1", name:"Martha Adasi", email:"martha@gmail.com", phone:"0544862114", hostels:1, totalViews:340, joinedAt:"Jan 2026", verified:true },
  { id:"h2", name:"Kwame Asante", email:"kwame.host@gmail.com", phone:"0557891234", hostels:1, totalViews:780, joinedAt:"Feb 2026", verified:true },
  { id:"h3", name:"Kojo Mensah", email:"kojo@gmail.com", phone:"0241234567", hostels:0, totalViews:0, joinedAt:"Apr 2026", verified:false },
];

const TABS = [
  { id:"dashboard", label:"Dashboard",    icon:"📊" },
  { id:"pending",   label:"Pending",      icon:"⏳" },
  { id:"hostels",   label:"All Hostels",  icon:"🏢" },
  { id:"students",  label:"Students",     icon:"🎓" },
  { id:"hosts",     label:"Hosts",        icon:"🏠" },
];

// ─── ADMIN OVERVIEW ───────────────────────────────────────────────────────────
function AdminOverview({ pending, approved, students, hosts, setActiveTab }) {
  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1E40AF] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-full opacity-10" style={{background:"radial-gradient(circle at right,#F59E0B,transparent)"}}/>
        <div className="relative">
          <span className="text-xs font-bold bg-[#F59E0B] text-white px-3 py-1 rounded-full">ADMIN PANEL</span>
          <h1 className="text-2xl font-extrabold mt-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>HostelHub Admin</h1>
          <p className="text-blue-200 text-sm mt-1">
            <span className="text-[#F59E0B] font-bold">{pending.length} hostel{pending.length !== 1 ? "s" : ""}</span> awaiting your approval.
          </p>
          {pending.length > 0 && (
            <button onClick={() => setActiveTab("pending")}
              className="mt-4 inline-block bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
              Review Pending →
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Total Students", val:students.length, icon:"🎓", sub:"registered" },
          { label:"Total Hosts", val:hosts.length, icon:"🏠", sub:"registered" },
          { label:"Live Hostels", val:approved.length, icon:"✅", sub:"approved" },
          { label:"Pending Review", val:pending.length, icon:"⏳", sub:"awaiting approval", highlight:pending.length > 0 },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border shadow-sm p-5 ${s.highlight ? "border-amber-200" : "border-gray-100"}`}>
            <span style={{fontSize:"24px"}}>{s.icon}</span>
            <p className={`text-3xl font-extrabold mt-2 ${s.highlight ? "text-amber-600" : "text-gray-800"}`}>{s.val}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick overview table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Top Performing Hostels</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Hostel</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Host</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Location</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Views</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Bookings</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {approved.sort((a,b) => b.views - a.views).map(h => (
                <tr key={h.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 font-semibold text-gray-800">{h.name}</td>
                  <td className="py-3 text-gray-500">{h.host}</td>
                  <td className="py-3 text-gray-500">{h.location}</td>
                  <td className="py-3 font-semibold text-[#1E40AF]">{h.views}</td>
                  <td className="py-3 font-semibold text-gray-700">{h.bookings}</td>
                  <td className="py-3">{h.featured ? <span className="text-amber-500 font-bold">⭐ Yes</span> : <span className="text-gray-300">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PENDING HOSTELS ──────────────────────────────────────────────────────────
function PendingHostelsTab({ pending, setPending, approved, setApproved }) {
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (hostel) => {
    setPending(prev => prev.filter(h => h.id !== hostel.id));
    setApproved(prev => [...prev, { ...hostel, status:"approved", views:0, bookings:0, featured:false, approvedAt:"Today" }]);
    setSelected(null);
    showToast(`"${hostel.name}" approved and is now live!`);
  };

  const handleReject = (hostel) => {
    if (!rejectReason.trim()) return;
    setPending(prev => prev.filter(h => h.id !== hostel.id));
    setSelected(null);
    setShowRejectInput(false);
    setRejectReason("");
    showToast(`"${hostel.name}" rejected. Host will be notified.`, "error");
  };

  if (pending.length === 0 && !selected) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
      <span className="text-5xl block mb-4">✅</span>
      <h2 className="text-xl font-bold text-gray-700">All clear!</h2>
      <p className="text-gray-400 mt-2">No hostels pending review at the moment.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-600"}`}>
          {toast.type === "error" ? "✗" : "✓"} {toast.msg}
        </div>
      )}

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* List */}
        <div className="flex-1 space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700 font-medium flex items-center gap-2">
            ⏳ <span>{pending.length} hostel{pending.length !== 1 ? "s" : ""} waiting for your review and approval.</span>
          </div>
          {pending.map(h => (
            <button key={h.id} onClick={() => { setSelected(h); setShowRejectInput(false); setRejectReason(""); }}
              className={`w-full bg-white rounded-2xl border shadow-sm p-5 text-left transition-all hover:border-[#1E40AF] ${selected?.id === h.id ? "border-[#1E40AF] ring-1 ring-[#1E40AF]/20" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-800 text-base">{h.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">by {h.host} · {h.location} · {h.gender}</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted {h.submittedAt}</p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">Pending</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{h.description}</p>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Review Hostel</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              <div>
                <p className="text-lg font-extrabold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{selected.location} · {selected.gender}</p>
              </div>

              <div className="space-y-2">
                {[["Host", selected.host],["Email", selected.email],["Phone", selected.phone],["Submitted", selected.submittedAt]].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-gray-700 text-right max-w-[55%] break-all">{v}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.amenities.map(a => (
                    <span key={a} className="bg-blue-50 text-[#1E40AF] text-xs font-semibold px-2.5 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Price Range</p>
                <p className="text-sm font-bold text-[#1E40AF]">GH₵{selected.priceFrom?.toLocaleString()} – GH₵{selected.priceTo?.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Submitted Documents</p>
                <div className="space-y-1.5">
                  {selected.docs?.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                      <span className="text-lg">{doc.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                      <span className="text-xs text-gray-600 font-medium">{doc}</span>
                      <button className="ml-auto text-xs text-[#1E40AF] font-semibold hover:underline">View</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              {!showRejectInput ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => handleApprove(selected)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 text-sm transition flex items-center justify-center gap-1.5">
                    ✓ Approve
                  </button>
                  <button onClick={() => setShowRejectInput(true)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-3 text-sm transition flex items-center justify-center gap-1.5">
                    ✗ Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for rejection *</label>
                    <textarea
                      className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 h-20 resize-none"
                      placeholder="E.g. Documents are incomplete. Please resubmit with a valid title deed."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleReject(selected)} disabled={!rejectReason.trim()}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl py-2.5 text-sm transition">
                      Confirm Reject
                    </button>
                    <button onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
                      className="border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm hover:border-gray-300 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ALL HOSTELS TAB ──────────────────────────────────────────────────────────
function AllHostelsTab({ approved, setApproved }) {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const toggleFeatured = (id) => {
    setApproved(prev => prev.map(h => h.id === id ? {...h, featured: !h.featured} : h));
    const h = approved.find(h => h.id === id);
    showToast(`"${h.name}" ${h.featured ? "unfeatured" : "featured"}.`);
  };

  const handleRemove = (id) => {
    const h = approved.find(h => h.id === id);
    if (confirm(`Remove "${h.name}" from the platform?`)) {
      setApproved(prev => prev.filter(h => h.id !== id));
      showToast(`"${h.name}" removed.`);
    }
  };

  const filtered = approved.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.host.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E40AF] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">✓ {toast}</div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search hostel name or host..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Hostel","Host","Location","Views","Bookings","Featured","Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-800">{h.name}</td>
                  <td className="px-4 py-3 text-gray-500">{h.host}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-[#1E40AF] text-xs font-semibold px-2 py-1 rounded-full">{h.location}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1E40AF]">{h.views}</td>
                  <td className="px-4 py-3 text-gray-700">{h.bookings}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleFeatured(h.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${h.featured ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"}`}>
                      {h.featured ? "⭐ Featured" : "Not Featured"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/hostel/${h.id}`} target="_blank" className="text-xs text-[#1E40AF] font-semibold hover:underline">View</Link>
                      <button onClick={() => handleRemove(h.id)} className="text-xs text-red-500 font-semibold hover:underline">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB (Students or Hosts) ───────────────────────────────────────────
function UsersTab({ users, type }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u => (u.name || u.fullName).toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={`Search ${type}s...`} value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">{filtered.length} {type}{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${type === "student" ? "bg-[#1E40AF]" : "bg-[#F59E0B]"}`}>
                  {(u.name || u.fullName).charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{u.name || u.fullName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {type === "student" && (
                  <>
                    <span className="hidden sm:block">{u.program} · {u.year}</span>
                    <span>Joined {u.joinedAt}</span>
                  </>
                )}
                {type === "host" && (
                  <>
                    <span>{u.hostels} hostel{u.hostels !== 1 ? "s" : ""}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${u.verified ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                      {u.verified ? "Verified" : "Unverified"}
                    </span>
                  </>
                )}
                <button className="text-red-400 hover:text-red-600 font-semibold hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [pending, setPending] = useState(MOCK_PENDING_HOSTELS);
  const [approved, setApproved] = useState(MOCK_APPROVED_HOSTELS);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") { router.push("/"); return; }
    setUser(parsed);
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">ADMIN</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "bg-[#1E40AF] text-white" : "text-gray-500 hover:bg-blue-50 hover:text-[#1E40AF]"}`}>
                <span style={{fontSize:"13px"}}>{tab.icon}</span> {tab.label}
                {tab.id === "pending" && pending.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{pending.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-[#1E40AF] font-medium transition">View site</Link>
            <button onClick={() => { localStorage.clear(); router.push("/"); }}
              className="text-xs text-red-400 hover:text-red-600 font-semibold border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-xl transition">
              Log out
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-gray-100">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === tab.id ? "border-[#1E40AF] text-[#1E40AF]" : "border-transparent text-gray-400"}`}>
              {tab.icon} {tab.label}
              {tab.id === "pending" && pending.length > 0 && (
                <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{pending.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "dashboard" && <AdminOverview pending={pending} approved={approved} students={MOCK_STUDENTS} hosts={MOCK_HOSTS} setActiveTab={setActiveTab}/>}
        {activeTab === "pending"   && <PendingHostelsTab pending={pending} setPending={setPending} approved={approved} setApproved={setApproved}/>}
        {activeTab === "hostels"   && <AllHostelsTab approved={approved} setApproved={setApproved}/>}
        {activeTab === "students"  && <UsersTab users={MOCK_STUDENTS} type="student"/>}
        {activeTab === "hosts"     && <UsersTab users={MOCK_HOSTS} type="host"/>}
      </main>
    </div>
  );
}