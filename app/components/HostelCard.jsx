"use client";
import Link from "next/link";
import Image from "next/image";

const amenityIcons = {
  WiFi: "📶",
  "Water Supply": "💧",
  Generator: "⚡",
  Kitchen: "🍳",
  Security: "🔒",
  CCTV: "📷",
  Parking: "🚗",
  Laundry: "🧺",
};

export default function HostelCard({ hostel }) {
  const stars = Math.round(hostel.rating);

  return (
    <Link href={`/hostel/${hostel.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1">

        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={hostel.image}
            alt={hostel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Type badge */}
          <span className="absolute top-3 left-3 bg-white/90 text-[#1E40AF] text-xs font-bold px-3 py-1 rounded-full shadow">
            {hostel.type}
          </span>

          {/* Rating badge */}
          <span className="absolute top-3 right-3 bg-[#F59E0B] text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
            ★ {hostel.rating}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">

          {/* Name + Location */}
          <div>
            <h2 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#1E40AF] transition-colors">
              {hostel.name}
            </h2>
            <p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {hostel.location}, UMaT
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
            {hostel.description}
          </p>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5">
            {hostel.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="text-xs bg-blue-50 text-[#1E40AF] px-2 py-1 rounded-full font-medium"
              >
                {amenityIcons[a] || "•"} {a}
              </span>
            ))}
            {hostel.amenities.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                +{hostel.amenities.length - 3} more
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Price + Button */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-[#1E40AF]">
                GH₵{hostel.price.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 ml-1">/yr</span>
            </div>

            <button className="bg-[#1E40AF] hover:bg-[#1e3a8a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-200 flex items-center gap-1.5">
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Rooms available */}
          <p className="text-xs text-emerald-600 font-semibold">
            {hostel.rooms > 0 ? `✓ ${hostel.rooms} rooms available` : "❌ No rooms available"}
          </p>
        </div>
      </div>
    </Link>
  );
}
