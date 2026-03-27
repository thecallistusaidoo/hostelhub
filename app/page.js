"use client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HostelCard from "./components/HostelCard";
import LocationFilter from "./components/LocationFilter";
import hostels from "./data/hostels";
import { useState } from "react";

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("All");

  const filteredHostels =
    selectedLocation === "All"
      ? hostels
      : hostels.filter((h) => h.location === selectedLocation);

  return (
    <main>
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-blue-600 text-white py-20 text-center">
        <h1 className="text-4xl font-bold">Find Your Perfect Hostel at UMaT</h1>
        <p className="mt-3 text-lg">Search, explore, and book hostels easily.</p>
      </section>

      {/* FILTERS */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <LocationFilter
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
      </div>

      {/* HOSTEL CARDS */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-10 px-4">
        {filteredHostels.map((hostel) => (
          <HostelCard key={hostel.id} hostel={hostel} />
        ))}
      </div>

      <Footer />
    </main>
  );
}