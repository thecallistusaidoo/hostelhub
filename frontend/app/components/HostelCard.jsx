"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const AMENITY_ICONS = {
  WiFi:"📶", Water:"💧", Electricity:"⚡", Generator:"🔋",
  Kitchen:"🍳", Security:"🔒", AC:"❄️", Laundry:"🧺",
  Parking:"🚗", Wardrobe:"🗄️",
};

async function toggleSave(hostelId) {
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/students/save-hostel`, {
    method: "POST",
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
    body: JSON.stringify({ hostelId }),
  });
}

export default function HostelCard({ hostel, savedIds = [], onSaveToggle }) {
  const [saved, setSaved]     = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const id = hostel._id || hostel.id?.toString();
    setSaved(savedIds.map(String).includes(String(id)));
  }, [savedIds, hostel._id, hostel.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const user = localStorage.getItem("user");
    if (!user) { window.location.href = "/login"; return; }
    const id = hostel._id || hostel.id?.toString();
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(id);
      onSaveToggle?.(id, next);
    } catch { setSaved(!next); }
  };

  const id       = hostel._id || hostel.id;
  const price    = hostel.priceFrom || hostel.price || 0;
  const image    = hostel.images?.[0];
  const rating   = hostel.hostRating;
  const gender   = hostel.gender;

  // ── Real available rooms count ────────────────────────────────────────────
  // totalAvailableRooms = sum of (totalRooms - reservedRooms) across all room types
  // This comes from the API (hostel.routes.js enriches each hostel with this field)
  const availRooms = hostel.totalAvailableRooms;
  const hasCount   = typeof availRooms === "number";
  const isAvail    = hasCount ? availRooms > 0 : hostel.isAvailable !== false;

  // Urgency colour coding
  const urgencyColor = !hasCount ? "text-gray-400"
    : availRooms === 0   ? "text-red-500 dark:text-red-400"
    : availRooms <= 3    ? "text-orange-500 dark:text-orange-400"
    : availRooms <= 8    ? "text-amber-500 dark:text-amber-400"
    :                      "text-emerald-600 dark:text-emerald-400";

  const urgencyBg = !hasCount ? "bg-gray-100/60 dark:bg-gray-800/40"
    : availRooms === 0   ? "bg-red-50/80 dark:bg-red-900/20"
    : availRooms <= 3    ? "bg-orange-50/80 dark:bg-orange-900/20"
    : availRooms <= 8    ? "bg-amber-50/80 dark:bg-amber-900/20"
    :                      "bg-emerald-50/80 dark:bg-emerald-900/20";

  return (
    <Link href={`/hostel/${id}`} className="group block h-full">
      <div className="hostel-card rounded-2xl overflow-hidden flex flex-col h-full">

        {/* ── Image ── */}
        <div className="relative h-48 w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 overflow-hidden flex-shrink-0">
          {image && !imgError ? (
            <Image src={image} alt={hostel.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}/>
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <span className="text-6xl">🏠</span>
            </div>
          )}

          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"/>

          {/* Price badge */}
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg"
              style={{background:"linear-gradient(135deg,#F59E0B,#FBBF24)"}}>
              GH₵{price.toLocaleString()}<span className="opacity-80 font-normal">/yr</span>
            </span>
          </div>

          {/* Save heart */}
          <button onClick={handleSave} aria-label={saved ? "Unsave" : "Save hostel"}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 backdrop-blur-sm ${
              saved ? "bg-red-500 text-white scale-110" : "bg-white/80 text-gray-400 hover:text-red-400 hover:scale-110"
            }`}>
            <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          {/* ── ROOMS AVAILABLE BADGE — bottom of image ── */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${urgencyBg} ${urgencyColor} border border-white/20`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                !hasCount ? "bg-gray-400" : availRooms === 0 ? "bg-red-500" : availRooms <= 3 ? "bg-orange-500 animate-pulse" : availRooms <= 8 ? "bg-amber-500" : "bg-emerald-500"
              }`}/>
              {!hasCount ? "Check availability"
                : availRooms === 0 ? "Fully reserved"
                : availRooms === 1 ? "1 room left!"
                : `${availRooms} rooms available`}
            </div>
            {rating > 0 && (
              <span className="flex items-center gap-1 text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                <svg className="w-3 h-3 fill-[#F59E0B]" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                {rating}
              </span>
            )}
          </div>
        </div>

        {/* ── Card body ── */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Name */}
          <h2 className="font-bold text-[--text-primary] text-sm leading-snug line-clamp-1 group-hover:text-[#1E40AF] dark:group-hover:text-blue-300 transition-colors">
            {hostel.name}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-[--text-muted]">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#1E40AF] dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            {hostel.location} — {hostel.city}
            {hostel.campusDistance && <span className="text-[--text-muted]"> · {hostel.campusDistance}</span>}
          </div>

          {/* Gender */}
          {gender && (
            <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              gender === "Female Only" ? "bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
              : gender === "Male Only" ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "bg-gray-100/80 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
            }`}>
              {gender}
            </span>
          )}

          {/* Amenities */}
          {hostel.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hostel.amenities.slice(0, 3).map(a => (
                <span key={a} className="badge-blue flex items-center gap-0.5">
                  <span style={{fontSize:"10px"}}>{AMENITY_ICONS[a] || "•"}</span>{a}
                </span>
              ))}
              {hostel.amenities.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100/60 dark:bg-gray-800/40 text-[--text-muted]">
                  +{hostel.amenities.length - 3}
                </span>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="pt-2 border-t border-white/20 dark:border-white/08 flex items-center justify-between mt-auto">
            <span className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold group-hover:underline flex items-center gap-1">
              View & Reserve
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </span>
            <span className="text-xs text-[--text-muted]">{hostel.viewsCount ? `${hostel.viewsCount} views` : ""}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}