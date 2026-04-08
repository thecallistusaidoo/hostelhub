"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { admin as adminAPI, hostels as hostelsAPI, student as studentAPI, getUser } from "../../lib/api";

const AMENITY_ICONS = {
  WiFi:"📶", Water:"💧", Electricity:"⚡", Generator:"🔋",
  Kitchen:"🍳", Security:"🔒", AC:"❄️", Laundry:"🧺",
  Parking:"🚗", Wardrobe:"🗄️",
};

function StarRating({ rating, size = "md" }) {
  const full = Math.floor(Number(rating || 0));
  return (
    <div className={`flex items-center gap-0.5 ${size === "sm" ? "text-xs" : "text-sm"}`}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} ${i < full ? "text-amber-400" : "text-gray-200"} fill-current`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="ml-1 font-semibold text-gray-700">{Number(rating || 0).toFixed(1)}</span>
    </div>
  );
}

export default function HostelDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mainImage, setMainImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  const user = useMemo(() => getUser(), []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = user?.role === "admin"
          ? await adminAPI.hostelDetail(id)
          : await hostelsAPI.detail(id);
        if (!alive) return;
        setHostel(data.hostel);
        setRooms(data.rooms || []);
        if (user?.role === "student") studentAPI.trackView(id).catch(() => {});
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Failed to load hostel.");
        setHostel(null);
        setRooms([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id, user?.role]);

  const mapped = useMemo(() => {
    if (!hostel) return null;

    const roomTypes = rooms.map(r => ({
      name: r.name,
      price: Number(r.price || 0),
      billing: r.billing || "Yearly",
      available: (r.status || "available") === "available",
    }));

    const availableRooms = roomTypes.filter(r => r.available).length;
    const totalRooms = roomTypes.length || 1;

    return {
      ...hostel,
      id: hostel._id,
      price: Number(hostel.priceFrom || 0),
      pricePeriod: "Yearly",
      images: Array.isArray(hostel.images) && hostel.images.length ? hostel.images : [],
      amenities: Array.isArray(hostel.amenities) ? hostel.amenities : [],
      rules: Array.isArray(hostel.rules) ? hostel.rules : [],
      views: hostel.viewsCount || 0,
      hostId: hostel.ownerId?._id || hostel.ownerId || null,
      hostName: hostel.ownerId?.fullName || "Host",
      hostPhone: hostel.ownerId?.phone || "",
      hostEmail: hostel.ownerId?.email || "",
      hostResponseTime: "Usually within 2 hours",
      roomTypes,
      availableRooms,
      totalRooms,
    };
  }, [hostel, rooms]);

  // Derive displayed price from selected room, fallback to base price
  const displayPrice = mapped && selectedRoom !== null
    ? mapped.roomTypes[selectedRoom]?.price
    : mapped?.price;
  const displayBilling = mapped && selectedRoom !== null
    ? mapped.roomTypes[selectedRoom]?.billing
    : mapped?.pricePeriod;
  const displayRoomName = mapped && selectedRoom !== null
    ? mapped.roomTypes[selectedRoom]?.name
    : null;
  const roomIsAvailable = mapped && selectedRoom !== null
    ? Boolean(mapped.roomTypes[selectedRoom]?.available)
    : mapped?.availableRooms > 0;

  const handleBook = () => {
    if (!user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      }
      router.push("/login");
      return;
    }

    if (!mapped) {
      setError("Hostel data is unavailable. Please try again.");
      return;
    }

    // Keep the mock-style toast, but actually go to real payment
    setShowBookingSuccess(true);
    setTimeout(() => setShowBookingSuccess(false), 2000);

    router.push(
      `/pay?hostelId=${encodeURIComponent(mapped._id)}&hostelName=${encodeURIComponent(mapped.name)}&roomName=${encodeURIComponent(displayRoomName || "Room")}&amount=${encodeURIComponent(String(displayPrice || 0))}&billing=${encodeURIComponent(displayBilling || "Yearly")}`
    );
  };

  const handleChat = () => {
    if (!user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      }
      router.push("/login");
      return;
    }

    const query = new URLSearchParams();
    query.set("tab", "messages");
    if (mapped?.hostId) query.set("hostId", mapped.hostId);
    if (mapped?.hostName) query.set("hostName", mapped.hostName);
    query.set("hostelId", mapped._id);
    query.set("hostelName", mapped.name);

    router.push(`/student/dashboard?${query.toString()}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!mapped) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl mb-4">🏚</p>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Hostel not found</h1>
        <p className="text-sm text-gray-500">{error || "This hostel may be unavailable or not yet approved."}</p>
        <button onClick={() => router.back()} className="mt-4 inline-block bg-[#1E40AF] text-white font-semibold rounded-xl px-6 py-3 hover:bg-[#1e3a8a] transition">
          ← Go Back
        </button>
      </div>
    </div>
  );

  const safeImages = mapped.images.length ? mapped.images : ["/images/hostels/campus1.png"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Sticky top bar with back button ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E40AF] font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <span className="text-gray-200">|</span>
            <Link href="/" className="font-extrabold text-lg text-[#1E40AF]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Hostel<span className="text-[#F59E0B]">Hub</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Save button */}
            <button
              onClick={async () => {
                if (!user) {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
                  }
                  router.push("/login");
                  return;
                }

                try {
                  await studentAPI.saveHostel(id);
                  setSaved(s => !s);
                } catch (e) {
                  console.error(e);
                  setError(e.message || "Unable to update favourites.");
                }
              }}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                saved ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:text-red-400"
              }`}
            >
              <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              {saved ? "Saved" : "Save"}
            </button>

            {user ? (
              <Link href={user.role === "host" ? "/host/dashboard" : "/student/dashboard"}
                className="text-sm font-semibold text-[#1E40AF] border border-[#1E40AF] px-3 py-1.5 rounded-xl hover:bg-blue-50 transition">
                My Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold bg-[#1E40AF] text-white px-4 py-1.5 rounded-xl hover:bg-[#1e3a8a] transition">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Booking success toast */}
      {showBookingSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-bounce">
          ✓ Redirecting to payment...
        </div>
      )}

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto w-full px-4 py-3">
        <p className="text-xs text-gray-400">
          <Link href="/" className="hover:text-[#1E40AF]">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-600 font-medium">{mapped.name}</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Photo Carousel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-72 md:h-[420px] bg-gray-100">
                <Image src={safeImages[mainImage]} alt={mapped.name} fill className="object-cover"/>
                {safeImages.length > 1 && (
                  <>
                    <button onClick={() => setMainImage(i => (i - 1 + safeImages.length) % safeImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-2.5 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button onClick={() => setMainImage(i => (i + 1) % safeImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-2.5 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  {mainImage + 1} / {safeImages.length}
                </div>
              </div>
              <div className="flex gap-2 p-3 overflow-x-auto">
                {safeImages.map((img, idx) => (
                  <button key={idx} onClick={() => setMainImage(idx)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${mainImage === idx ? "border-[#1E40AF]" : "border-transparent hover:border-gray-300"}`}>
                    <Image src={img} alt="" fill className="object-cover"/>
                  </button>
                ))}
              </div>
            </div>

            {/* Name + Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {mapped.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                    <svg className="w-4 h-4 text-[#1E40AF] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    {mapped.location} — {mapped.city} · {mapped.landmark}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#1E40AF]">GH₵{Number(mapped.price || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">starting from / yr</p>
                </div>
              </div>
              <StarRating rating={mapped.hostRating}/>
              <div className="flex flex-wrap gap-2">
                {[
                  { text: mapped.type || "Private", cls: "bg-blue-50 text-[#1E40AF]" },
                  { text: mapped.gender, cls: mapped.gender === "Female Only" ? "bg-pink-50 text-pink-600" : mapped.gender === "Male Only" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600" },
                  { text: `🚶 ${mapped.campusDistance || "Distance N/A"}`, cls: "bg-gray-100 text-gray-600" },
                  { text: `${mapped.availableRooms} room type${mapped.availableRooms === 1 ? "" : "s"} available`, cls: "bg-green-50 text-green-600" },
                ].map(b => (
                  <span key={b.text} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${b.cls}`}>{b.text}</span>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{mapped.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>What's Included</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mapped.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5">
                    <span style={{fontSize:"17px"}}>{AMENITY_ICONS[a] || "•"}</span>
                    <span className="text-sm font-medium text-[#1E40AF]">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Room Types — clicking updates sidebar price ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-1" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Room Types & Pricing</h2>
              <p className="text-xs text-gray-400 mb-4">Select a room type to update the price and pay.</p>
              <div className="space-y-3">
                {mapped.roomTypes.map((room, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRoom(selectedRoom === idx ? null : idx)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRoom === idx
                        ? "border-[#1E40AF] bg-blue-50 shadow-sm"
                        : "border-gray-100 bg-gray-50 hover:border-[#1E40AF]/30 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedRoom === idx ? "border-[#1E40AF] bg-[#1E40AF]" : "border-gray-300"
                      }`}>
                        {selectedRoom === idx && <div className="w-2 h-2 bg-white rounded-full"/>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{room.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Billed {room.billing}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#1E40AF] text-base">GH₵{Number(room.price || 0).toLocaleString()}</p>
                      <span className={`text-xs font-semibold ${room.available ? "text-emerald-600" : "text-red-500"}`}>
                        {room.available ? "✓ Available" : "✗ Fully Booked"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            {mapped.rules.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>House Rules</h2>
                <ul className="space-y-2">
                  {mapped.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-[#F59E0B] mt-0.5 flex-shrink-0">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Location</h2>
              <div className="bg-blue-50 rounded-xl h-48 flex flex-col items-center justify-center gap-2 border border-blue-100">
                <svg className="w-10 h-10 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <p className="font-bold text-[#1E40AF]">{mapped.address || "Address not set"}</p>
                <p className="text-sm text-gray-500">{mapped.landmark || ""}</p>
                <p className="text-xs text-gray-400">{mapped.ghanaPost ? `GhanaPost: ${mapped.ghanaPost}` : ""}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR — price updates when room selected ── */}
          <div className="lg:w-80 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-16 space-y-4">

              {/* Dynamic price */}
              <div className="transition-all duration-300">
                {selectedRoom !== null ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-[#1E40AF] text-white px-2 py-0.5 rounded-full font-semibold">Selected</span>
                      <span className="text-xs text-gray-500">{displayRoomName}</span>
                    </div>
                    <p className="text-3xl font-extrabold text-[#1E40AF]">GH₵{Number(displayPrice || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">per {displayBilling === "Yearly" ? "year" : "semester"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mb-1">Starting from</p>
                    <p className="text-3xl font-extrabold text-[#1E40AF]">GH₵{Number(mapped.price || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">per year</p>
                  </>
                )}
              </div>

              {/* Room hint */}
              {selectedRoom === null && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 font-medium">
                  👆 Select a room type above to see exact pricing
                </div>
              )}

              {/* Availability bar (using room-type availability) */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Room types left</span>
                  <span className={`font-semibold ${mapped.availableRooms > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {mapped.availableRooms} of {mapped.totalRooms}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{width:`${(mapped.availableRooms / mapped.totalRooms) * 100}%`}}/>
                </div>
              </div>

              {/* CTA buttons */}
              <button
                onClick={handleBook}
                disabled={!roomIsAvailable}
                className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${
                  roomIsAvailable
                    ? "bg-[#1E40AF] hover:bg-[#1e3a8a] text-white shadow-md hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {!user ? "Sign In to Book" : selectedRoom !== null ? `Pay for ${mapped.roomTypes[selectedRoom].name}` : "Pay Now"}
              </button>

              <button
                onClick={handleChat}
                className="w-full py-2.5 rounded-xl font-semibold text-sm border border-gray-200 hover:border-[#1E40AF] text-gray-600 hover:text-[#1E40AF] bg-white transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                {!user ? "Sign In to Chat" : "Chat with Host"}
              </button>

              {!user && (
                <p className="text-xs text-center text-gray-400">
                  <Link href="/signup" className="text-[#1E40AF] font-semibold hover:underline">Create a free account</Link> to pay or chat
                </p>
              )}
            </div>

            {/* Host card (mapped from ownerId) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Hosted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xl">
                  {mapped.hostName?.charAt(0) || "H"}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{mapped.hostName}</p>
                  <StarRating rating={mapped.hostRating} size="sm"/>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  {mapped.hostPhone ? (
                    <a href={`tel:${mapped.hostPhone}`} className="text-[#1E40AF] font-semibold">{mapped.hostPhone}</a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Response time</span>
                  <span className="text-gray-700 text-xs">{mapped.hostResponseTime}</span>
                </div>
              </div>
            </div>

            {/* Quick details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Hostel Details</h3>
              {[
                ["Type", mapped.type || "Private"],
                ["Gender", mapped.gender],
                ["Location", mapped.location],
                ["Distance to campus", mapped.campusDistance || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-gray-400">{l}</span>
                  <span className="text-gray-800 font-medium text-right max-w-[55%] break-words">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

