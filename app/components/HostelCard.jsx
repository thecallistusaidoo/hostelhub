"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const AMENITY_ICONS = {
  WiFi:        { icon: "📶", label: "WiFi" },
  Water:       { icon: "💧", label: "Water" },
  Electricity: { icon: "⚡", label: "Power" },
  Generator:   { icon: "🔋", label: "Generator" },
  Kitchen:     { icon: "🍳", label: "Kitchen" },
  Security:    { icon: "🔒", label: "Security" },
  AC:          { icon: "❄️", label: "AC" },
  Laundry:     { icon: "🧺", label: "Laundry" },
  Parking:     { icon: "🚗", label: "Parking" },
  Wardrobe:    { icon: "🗄️", label: "Wardrobe" },
};

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
      {rating}
    </span>
  );
}

export default function HostelCard({ hostel }) {
  const [saved, setSaved] = useState(false);
  const available = hostel.availableRooms > 0;
  const firstRoom = hostel.roomTypes[0];

  return (
    <div className="hostel-card bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 flex flex-col">
      {/* ── Image ── */}
      <div className="relative">
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <Image
            src={hostel.images[0]}
            alt={hostel.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Price badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-[#F59E0B] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            GH₵ {hostel.price.toLocaleString()} / {hostel.pricePeriod === "Yearly" ? "yr" : "sem"}
          </span>
        </div>

        {/* Gender badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-md ${
            hostel.gender === "Female Only"
              ? "bg-pink-100 text-pink-700"
              : hostel.gender === "Male Only"
              ? "bg-blue-100 text-blue-700"
              : "bg-white text-gray-600"
          }`}>
            {hostel.gender}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 flex-1">
            {hostel.name}
          </h2>
          <StarRating rating={hostel.hostRating} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
          </svg>
          <span>{hostel.location} — {hostel.city} · {hostel.campusDistance}</span>
        </div>

        {/* Room type + availability */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">{firstRoom.name}</span>
          <span className="text-gray-300">·</span>
          {available ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              {hostel.availableRooms} rooms left
            </span>
          ) : (
            <span className="text-red-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>
              Fully Booked
            </span>
          )}
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5">
          {hostel.amenities.slice(0, 4).map((a) => (
            <span
              key={a}
              className="flex items-center gap-1 bg-blue-50 text-[#1E40AF] text-xs px-2.5 py-1 rounded-full font-medium"
            >
              <span style={{fontSize:"11px"}}>{AMENITY_ICONS[a]?.icon || "•"}</span>
              {AMENITY_ICONS[a]?.label || a}
            </span>
          ))}
          {hostel.amenities.length > 4 && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
              +{hostel.amenities.length - 4}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mt-auto" />

        {/* CTA row */}
        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/hostel/${hostel.id}`}
            className="flex-1 text-center btn-primary text-sm py-2.5"
          >
            View Details
          </Link>
          <button
            onClick={() => setSaved(!saved)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
              saved
                ? "bg-red-50 border-red-200 text-red-500"
                : "bg-gray-50 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400"
            }`}
            aria-label="Save hostel"
          >
            <svg className="w-5 h-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
