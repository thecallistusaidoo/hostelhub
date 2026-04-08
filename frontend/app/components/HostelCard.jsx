"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function HostelCard({ hostel }) {
  const [saved, setSaved] = useState(false);

  return (
    <Link href={`/hostel/${hostel.id}`} className="group block">
      <div className="hostel-card bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer">

        {/* ── Image ── */}
        <div className="relative h-52 w-full bg-gray-100 overflow-hidden">
          <Image
            src={hostel.images[0]}
            alt={hostel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Price badge — top left over image */}
          <div className="absolute top-3 left-3">
            <span className="bg-[#F59E0B] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              GH₵ {hostel.price.toLocaleString()} / {hostel.pricePeriod === "Yearly" ? "yr" : "sem"}
            </span>
          </div>
          {/* Save heart — top right */}
          <button
            onClick={e => { e.preventDefault(); setSaved(s => !s); }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${
              saved ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-400"
            }`}
          >
            <svg className="w-4 h-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>

        {/* ── Card Body ── */}
        <div className="p-4 space-y-2">
          {/* Name */}
          <h2 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-[#1E40AF] transition-colors">
            {hostel.name}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <svg className="w-4 h-4 flex-shrink-0 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            <span>{hostel.location} — {hostel.city}</span>
          </div>

          {/* Rating + Gender */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {hostel.hostRating}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              hostel.gender === "Female Only" ? "bg-pink-50 text-pink-600"
              : hostel.gender === "Male Only" ? "bg-blue-50 text-blue-700"
              : "bg-gray-100 text-gray-500"
            }`}>
              {hostel.gender}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
            {hostel.description}
          </p>

          {/* Bottom CTA row */}
          <div className="pt-1 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs text-[#1E40AF] font-semibold group-hover:underline">
              View Details →
            </span>
            <span className={`text-xs font-semibold ${hostel.availableRooms > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {hostel.availableRooms > 0 ? "Available" : "Fully Booked"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
