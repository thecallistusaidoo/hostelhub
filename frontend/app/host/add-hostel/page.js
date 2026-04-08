"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { host as hostAPI, getUser } from "../../lib/api";

const AMENITIES_LIST = ["WiFi","Water","Electricity","Generator","Kitchen","Security","AC","Laundry","Parking","Wardrobe"];
const LOCATIONS = ["Umat (Near Campus)","Tarkwa Town","Nyankomasi","Bogoso","Other"];

export default function AddHostelPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const user = useMemo(() => getUser(), []);
  const [form, setForm] = useState({
    name:"", location:"", address:"", ghanaPost:"", landmark:"", campusDistance:"",
    description:"", gender:"Mixed", amenities:[], priceFrom:"", priceTo:"",
    ownershipDoc:null, additionalImages:[],
  });

  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const toggleAmenity = (a) => set("amenities", form.amenities.includes(a) ? form.amenities.filter(x=>x!==a) : [...form.amenities,a]);

  const handleSubmit = async () => {
    setError(null);
    if (!user || user.role !== "host") {
      router.push("/login");
      return;
    }
    if (!form.name || !form.location || !form.description) {
      setError("Please fill hostel name, location, and description.");
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("location", form.location);
    fd.append("address", form.address || "");
    fd.append("ghanaPost", form.ghanaPost || "");
    fd.append("landmark", form.landmark || "");
    fd.append("campusDistance", form.campusDistance || "");
    fd.append("description", form.description);
    fd.append("gender", form.gender || "Mixed");
    fd.append("amenities", JSON.stringify(form.amenities || []));
    fd.append("priceFrom", form.priceFrom || "");
    fd.append("priceTo", form.priceTo || "");

    // Backend expects: images + documents
    if (form.additionalImages?.length) {
      Array.from(form.additionalImages).forEach((file) => fd.append("images", file));
    }
    if (form.ownershipDoc?.length) {
      Array.from(form.ownershipDoc).forEach((file) => fd.append("documents", file));
    }

    setSubmitting(true);
    try {
      await hostAPI.addHostel(fd);
      setSubmitted(true);
    } catch (e) {
      setError(e.message || "Failed to submit hostel.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel Submitted!
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Thank you! Your hostel listing has been submitted and is <strong className="text-amber-600">pending review</strong>.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Our agent will schedule a physical check-up at your property to verify ownership and building condition. Once approved, your hostel will go live on HostelHub.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">What happens next?</p>
            <ul className="space-y-1.5 text-xs text-amber-800">
              <li>📋 Admin reviews your documents</li>
              <li>🏠 Agent visits your property</li>
              <li>✅ Hostel gets approved and listed</li>
              <li>📱 You'll be notified via email/SMS</li>
            </ul>
          </div>
          <Link href="/host/dashboard" className="block w-full text-center bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl py-3 transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-extrabold text-xl text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Hostel<span className="text-[#F59E0B]">Hub</span>
          </Link>
          <Link href="/host/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Back to Dashboard</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step >= s ? "bg-[#1E40AF] text-white" : "bg-gray-100 text-gray-400"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 flex-1 transition-all ${step > s ? "bg-[#1E40AF]" : "bg-gray-200"}`}/>}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 -mt-6 mb-6">
          <span className="text-[#1E40AF] font-semibold">Hostel Info</span>
          <span className={step >= 2 ? "text-[#1E40AF] font-semibold" : ""}>Amenities & Pricing</span>
          <span className={step >= 3 ? "text-[#1E40AF] font-semibold" : ""}>Proof & Submit</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* STEP 1 — Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-extrabold text-gray-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Hostel Information</h1>
                <p className="text-gray-400 text-sm mt-1">Tell us the basic details about your hostel.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hostel Name *</label>
                <input className="input-field" placeholder="e.g. Abitjack Hostel" value={form.name} onChange={e => set("name", e.target.value)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location *</label>
                  <select className="input-field" value={form.location} onChange={e => set("location", e.target.value)}>
                    <option value="">Select...</option>
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender Policy</label>
                  <select className="input-field" value={form.gender} onChange={e => set("gender", e.target.value)}>
                    {["Mixed","Male Only","Female Only"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address *</label>
                <input className="input-field" placeholder="e.g. Odobikese St." value={form.address} onChange={e => set("address", e.target.value)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">GhanaPost GPS</label>
                  <input className="input-field" placeholder="e.g. CE-150-9723" value={form.ghanaPost} onChange={e => set("ghanaPost", e.target.value)}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Distance to Campus</label>
                  <input className="input-field" placeholder="e.g. 5 mins walk" value={form.campusDistance} onChange={e => set("campusDistance", e.target.value)}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nearest Landmark *</label>
                <input className="input-field" placeholder="e.g. Behind Radio Peace FM" value={form.landmark} onChange={e => set("landmark", e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea className="input-field h-28 resize-none" placeholder="Describe your hostel — facilities, environment, who it's suitable for..." value={form.description} onChange={e => set("description", e.target.value)}/>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl px-8 py-3 transition">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Amenities & Pricing */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-extrabold text-gray-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Amenities & Pricing</h1>
                <p className="text-gray-400 text-sm mt-1">Select what your hostel offers and set your price range.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Amenities Available</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(a => (
                    <button key={a} onClick={() => toggleAmenity(a)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                        form.amenities.includes(a)
                          ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Price Range (GH₵ per year)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <input className="input-field" type="number" placeholder="e.g. 2500" value={form.priceFrom} onChange={e => set("priceFrom", e.target.value)}/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <input className="input-field" type="number" placeholder="e.g. 5000" value={form.priceTo} onChange={e => set("priceTo", e.target.value)}/>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setStep(1)} className="border border-gray-200 text-gray-600 font-semibold rounded-xl px-6 py-3 transition hover:border-gray-300 bg-white">← Back</button>
                <button onClick={() => setStep(3)} className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-semibold rounded-xl px-8 py-3 transition">Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Proof & Submit */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl font-extrabold text-gray-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Proof of Ownership</h1>
                <p className="text-gray-400 text-sm mt-1">Upload documents to verify you own or manage this hostel.</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">📋 Required Documents</p>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• Title deed or land certificate</li>
                  <li>• Building permit or occupancy certificate</li>
                  <li>• Your Ghana Card or valid ID</li>
                  <li>• (Optional) Utility bill with address</li>
                </ul>
              </div>

              {/* Document upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Ownership Document(s) *</label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#1E40AF] transition">
                  <span className="text-3xl block mb-2">📄</span>
                  <p className="text-sm font-semibold text-gray-600">Click to upload documents</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 5MB each</p>
                  <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => set("ownershipDoc", e.target.files)}/>
                </label>
                {form.ownershipDoc && (
                  <p className="text-xs text-emerald-600 font-semibold mt-2">✓ {form.ownershipDoc.length} file(s) selected</p>
                )}
              </div>

              {/* Hostel images */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Hostel Images</label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#1E40AF] transition">
                  <span className="text-3xl block mb-2">🖼️</span>
                  <p className="text-sm font-semibold text-gray-600">Upload hostel photos</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 10 images · 5MB each</p>
                  <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png"
                    onChange={e => set("additionalImages", e.target.files)}/>
                </label>
                {form.additionalImages?.length > 0 && (
                  <p className="text-xs text-emerald-600 font-semibold mt-2">✓ {form.additionalImages.length} image(s) selected</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-[#1E40AF] leading-relaxed">
                  By submitting, you confirm all information is accurate. Our team will review your submission and contact you to schedule a property inspection before your hostel goes live.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setStep(2)} className="border border-gray-200 text-gray-600 font-semibold rounded-xl px-6 py-3 transition hover:border-gray-300 bg-white">← Back</button>
                <button onClick={handleSubmit} disabled={submitting} className="bg-[#F59E0B] hover:bg-amber-500 disabled:opacity-60 text-white font-bold rounded-xl px-8 py-3 transition">
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}