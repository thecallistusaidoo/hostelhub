"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { student as studentAPI, getUser } from "../lib/api";

const AMENITY_ICONS = {
  WiFi:"📶", Water:"💧", Electricity:"⚡", Generator:"🔋",
  Kitchen:"🍳", Security:"🔒", AC:"❄️", Laundry:"🧺",
  Parking:"🚗", Wardrobe:"🗄️",
};

function StarRating({ rating }) {
  if (!rating) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-[#F59E0B]">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
      {rating}
    </span>
  );
}

export default function HostelCard({ hostel, savedIds = [], onSaveToggle }) {
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isLoggedIn = !!getUser();

  // Sync saved state from parent
  useEffect(() => {
    const id = hostel._id || hostel.id?.toString();
    setSaved(savedIds.map(String).includes(String(id)));
  }, [savedIds, hostel._id, hostel.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    const id = hostel._id || hostel.id?.toString();
    const next = !saved;
    setSaved(next);
    try {
      await studentAPI.saveHostel(id);
      onSaveToggle?.(id, next);
    } catch { setSaved(!next); }
  };

  const id       = hostel._id || hostel.id;
  const price    = hostel.priceFrom || hostel.price || 0;
  const period   = hostel.pricePeriod === "Semester" ? "sem" : "yr";
  const location = hostel.location || "UMaT";
  const city     = hostel.city || "Tarkwa";
  const image    = hostel.images?.[0];
  const rating   = hostel.hostRating;
  const gender   = hostel.gender;
  // Fix: rooms available from real API data
  const roomsAvail = hostel.availableRooms ?? hostel.roomsAvailable;
  const hasRooms  = typeof roomsAvail === "number" ? roomsAvail > 0 : hostel.isAvailable !== false;

  return (
    <Link href={`/hostel/${id}`} className="group block">
      <div className="hostel-card rounded-2xl overflow-hidden h-full flex flex-col">

        {/* ── Image ── */}
        <div className="relative h-48 w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 overflow-hidden flex-shrink-0">
          {image && !imgError ? (
            <Image
              src={image}
              alt={hostel.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-30">🏠</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"/>

          {/* Price badge */}
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
              style={{background:"linear-gradient(135deg,#F59E0B,#FBBF24)"}}>
              GH₵ {price.toLocaleString()}<span className="opacity-75">/{period}</span>
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 backdrop-blur-sm ${
              saved
                ? "bg-red-500 text-white scale-110"
                : "bg-white/80 text-gray-400 hover:text-red-400 hover:scale-110"
            }`}
            aria-label={saved ? "Unsave" : "Save hostel"}
          >
            <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">

          {/* Name + rating */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-bold text-[--text-primary] text-sm leading-snug line-clamp-1 flex-1 group-hover:text-[#1E40AF] dark:group-hover:text-blue-300 transition-colors">
              {hostel.name}
            </h2>
            <StarRating rating={rating}/>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-[--text-muted]">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#1E40AF] dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            {location}
          </div>

          {/* Gender badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {gender && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                gender === "Female Only" ? "bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                : gender === "Male Only" ? "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-gray-100/80 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
              }`}>
                {gender}
              </span>
            )}
          </div>

          {/* Amenities */}
          {hostel.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hostel.amenities.slice(0, 3).map(a => (
                <span key={a} className="badge-blue flex items-center gap-0.5">
                  <span style={{fontSize:"10px"}}>{AMENITY_ICONS[a] || "•"}</span>
                  {a}
                </span>
              ))}
              {hostel.amenities.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100/60 dark:bg-gray-800/40 text-[--text-muted]">
                  +{hostel.amenities.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Availability */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasRooms ? "bg-emerald-400" : "bg-red-400"}`}/>
            <span className={hasRooms ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-red-500 font-semibold"}>
              {hasRooms ? "Available" : "Fully Booked"}
            </span>
          </div>

          {/* Bottom CTA */}
          <div className="pt-2 border-t border-white/30 dark:border-white/10 flex items-center justify-between mt-auto">
            <span className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold group-hover:underline flex items-center gap-1">
              View Details
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </span>
            <span className="text-xs text-[--text-muted]">
              {hostel.viewsCount ? `${hostel.viewsCount} views` : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}