"use client";

import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HostelCard from "./components/HostelCard";
import LocationFilter from "./components/LocationFilter";
import hostels from "./data/hostels";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("All");

  const filteredHostels =
    selectedLocation === "All"
      ? hostels
      : hostels.filter((h) => h.location === selectedLocation);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative bg-[#1E40AF] overflow-hidden">
        {/* decorative blob */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#F59E0B]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-[#F59E0B]/20 text-[#F59E0B] text-sm font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            UMaT Student Housing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Find Your Perfect<br />
            <span className="text-[#F59E0B]">UMAT Hostel</span>
          </h1>
          <p className="mt-4 text-blue-200 text-lg max-w-xl mx-auto">
            Browse verified hostels near UMaT campus. Compare prices, amenities, and book your room with ease.
          </p>

          {/* Quick stats */}
          <div className="mt-10 flex justify-center gap-8 text-white">
            <div>
              <p className="text-3xl font-extrabold">{hostels.length}+</p>
              <p className="text-blue-300 text-sm">Listed Hostels</p>
            </div>
            <div className="border-l border-white/20" />
            <div>
              <p className="text-3xl font-extrabold">{hostels.reduce((s, h) => s + h.rooms, 0)}+</p>
              <p className="text-blue-300 text-sm">Available Rooms</p>
            </div>
            <div className="border-l border-white/20" />
            <div>
              <p className="text-3xl font-extrabold">2</p>
              <p className="text-blue-300 text-sm">Locations</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER + GRID ── */}
      <div className="max-w-5xl mx-auto w-full px-4 py-10 flex-1">

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {filteredHostels.length} hostel{filteredHostels.length !== 1 ? "s" : ""} found
            </h2>
            <p className="text-sm text-gray-400">
              {selectedLocation === "All" ? "Showing all locations" : `Filtered: ${selectedLocation}`}
            </p>
          </div>
          <LocationFilter
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />
        </div>

        {/* Cards */}
        {filteredHostels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map((hostel) => (
              <HostelCard key={hostel.id} hostel={hostel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <p className="text-5xl mb-4">🏚</p>
            <p className="text-lg font-semibold">No hostels found in this location.</p>
            <p className="text-sm">Try selecting "All" to see every listing.</p>
          </div>
        )}
      </div>

      {/* ── CTA BANNER ── */}
      <section className="bg-[#F59E0B] py-12 text-center">
        <h2 className="text-2xl font-extrabold text-white">Own a hostel near UMaT?</h2>
        <p className="text-yellow-100 mt-2">List it on HostelHub and reach thousands of students.</p>
        <a
          href="/list-your-hostel"
          className="mt-5 inline-block bg-white text-[#1E40AF] font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition"
        >
          Become a Host →
        </a>
      </section>

      <Footer />
    </main>
  );
}