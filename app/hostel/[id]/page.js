"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import hostels from "../../data/hostels";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const AMENITY_ICONS = {
  WiFi: "📶", Water: "💧", Electricity: "⚡", Generator: "🔋",
  Kitchen: "🍳", Security: "🔒", AC: "❄️", Laundry: "🧺",
  Parking: "🚗", Wardrobe: "🗄️",
};

function StarRating({ rating, size = "md" }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className={`flex items-center gap-0.5 ${size === "sm" ? "text-xs" : "text-sm"}`}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} ${i < full ? "text-amber-400" : "text-gray-200"} fill-current`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="ml-1 font-semibold text-gray-700">{rating}</span>
    </div>
  );
}

export default function HostelDetail() {
  const params = useParams();
  const hostel = hostels.find(h => h.id === parseInt(params.id));
  const [mainImage, setMainImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);

  if (!hostel) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">🏚</p>
        <h1 className="text-2xl font-bold text-gray-700">Hostel not found</h1>
        <Link href="/" className="mt-4 inline-block btn-primary">Back to listings</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto w-full px-4 py-3">
        <p className="text-sm text-gray-400">
          <Link href="/" className="hover:text-[#1E40AF]">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700 font-medium">{hostel.name}</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 pb-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Photo Carousel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-72 md:h-96 bg-gray-100">
                <Image
                  src={hostel.images[mainImage]}
                  alt={hostel.name}
                  fill
                  className="object-cover"
                />
                {/* Nav arrows */}
                {hostel.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setMainImage(i => (i - 1 + hostel.images.length) % hostel.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow rounded-full p-2 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setMainImage(i => (i + 1) % hostel.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow rounded-full p-2 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2 p-3 overflow-x-auto">
                {hostel.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(idx)}
                    className={`relative w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${
                      mainImage === idx ? "border-[#1E40AF]" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Hostel Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {hostel.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
                    <svg className="w-4 h-4 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    {hostel.location} — {hostel.city} · {hostel.landmark}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#1E40AF]">GH₵{hostel.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">per {hostel.pricePeriod === "Yearly" ? "year" : "semester"}</p>
                </div>
              </div>

              <StarRating rating={hostel.hostRating} />

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-50 text-[#1E40AF] text-xs font-semibold px-3 py-1.5 rounded-full">{hostel.type}</span>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  hostel.gender === "Female Only" ? "bg-pink-50 text-pink-600"
                  : hostel.gender === "Male Only" ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-600"
                }`}>{hostel.gender}</span>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                  🚶 {hostel.campusDistance}
                </span>
                <span className="bg-green-50 text-green-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {hostel.availableRooms} rooms available
                </span>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">{hostel.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>What's Included</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hostel.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5">
                    <span style={{fontSize:"18px"}}>{AMENITY_ICONS[a] || "•"}</span>
                    <span className="text-sm font-medium text-[#1E40AF]">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Room Types & Pricing</h2>
              <div className="space-y-3">
                {hostel.roomTypes.map((room, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRoom(idx)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRoom === idx
                        ? "border-[#1E40AF] bg-blue-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{room.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Billed {room.billing}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-[#1E40AF]">GH₵{room.price.toLocaleString()}</p>
                      <span className={`text-xs font-semibold ${room.available ? "text-emerald-600" : "text-red-500"}`}>
                        {room.available ? "✓ Available" : "✗ Fully Booked"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>House Rules</h2>
              <ul className="space-y-2">
                {hostel.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Static Map placeholder */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Location</h2>
              <div className="bg-blue-50 rounded-xl h-48 flex flex-col items-center justify-center gap-2 border border-blue-100">
                <svg className="w-8 h-8 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <p className="font-semibold text-[#1E40AF] text-sm">{hostel.address}</p>
                <p className="text-xs text-gray-500">GhanaPost: {hostel.ghanaPost}</p>
                <p className="text-xs text-gray-500">{hostel.landmark}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="lg:w-80 flex-shrink-0 space-y-5">

            {/* Booking card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-20 space-y-4">
              <div>
                <p className="text-2xl font-extrabold text-[#1E40AF]">GH₵{hostel.price.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Starting price per {hostel.pricePeriod === "Yearly" ? "year" : "semester"}</p>
              </div>

              {/* Room selector shortcut */}
              {selectedRoom !== null && (
                <div className="bg-blue-50 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-[#1E40AF]">Selected: {hostel.roomTypes[selectedRoom].name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">GH₵{hostel.roomTypes[selectedRoom].price.toLocaleString()} / {hostel.roomTypes[selectedRoom].billing}</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2">
                <div className="flex justify-between text-gray-500">
                  <span>Rooms left</span>
                  <span className="font-semibold text-emerald-600">{hostel.availableRooms} of {hostel.totalRooms}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{width: `${(hostel.availableRooms / hostel.totalRooms) * 100}%`}}
                  />
                </div>
              </div>

              <Link href="/student/login" className="block w-full text-center btn-primary py-3 text-base">
                Book Now
              </Link>
              <Link href="/student/login" className="block w-full text-center btn-ghost py-3 text-sm">
                💬 Chat with Host
              </Link>
            </div>

            {/* Host card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Hosted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1E40AF] flex items-center justify-center text-white font-bold text-lg">
                  {hostel.hostName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{hostel.hostName}</p>
                  <StarRating rating={hostel.hostRating} size="sm" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <a href={`tel:${hostel.hostPhone}`} className="text-[#1E40AF] font-semibold">{hostel.hostPhone}</a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Response</span>
                  <span className="text-gray-700 text-xs">{hostel.hostResponseTime}</span>
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="font-bold text-gray-800 text-sm">Hostel Details</h3>
              {[
                { label: "Type", value: hostel.type },
                { label: "Gender", value: hostel.gender },
                { label: "Location", value: hostel.location },
                { label: "Campus Distance", value: hostel.campusDistance },
                { label: "Total Views", value: `${hostel.views} views` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-800 font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}