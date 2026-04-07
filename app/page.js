"use client";
import { useState, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HostelCard from "./components/HostelCard";
import FilterSidebar from "./components/FilterSidebar";
import hostels from "./data/hostels";

const DEFAULT_FILTERS = {
  location: "All",
  gender: "All",
  amenities: [],
  roomTypes: [],
  minPrice: 0,
  maxPrice: 10000,
  sort: "Newest",
};

export default function Home() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const results = useMemo(() => {
    let list = [...hostels];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q)
      );
    }

    if (filters.location !== "All") list = list.filter(h => h.location === filters.location);
    if (filters.gender !== "All") list = list.filter(h => h.gender === filters.gender);
    list = list.filter(h => h.price >= filters.minPrice && h.price <= filters.maxPrice);

    if (filters.amenities.length > 0) {
      list = list.filter(h => filters.amenities.every(a => h.amenities.includes(a)));
    }

    if (filters.sort === "Lowest Price") list.sort((a, b) => a.price - b.price);
    else if (filters.sort === "Highest Rated") list.sort((a, b) => b.hostRating - a.hostRating);
    else if (filters.sort === "Most Viewed") list.sort((a, b) => b.views - a.views);

    return list;
  }, [filters, search]);

  const featured = hostels.filter(h => h.featured);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-[#1E40AF] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:"radial-gradient(circle at 20% 50%, #F59E0B 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)"}} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <span className="inline-block bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            UMaT Verified Hostels
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Find Your Perfect<br/>
            <span className="text-[#F59E0B]">Student Hostel</span>
          </h1>
          <p className="text-blue-200 text-base mb-8 max-w-xl mx-auto">
            Browse verified hostels near UMaT campus. Compare prices, amenities, and secure your room today.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by hostel name, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] text-gray-800"
            />
          </div>

          {/* Stats */}
          <div className="mt-8 flex justify-center gap-10">
            {[
              { num: `${hostels.length}+`, label: "Listed Hostels" },
              { num: `${hostels.reduce((s,h)=>s+h.availableRooms,0)}+`, label: "Rooms Available" },
              { num: "2", label: "Locations" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{s.num}</p>
                <p className="text-blue-300 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ── */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              ⭐ Featured Hostels
            </h2>
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-sm text-[#1E40AF] font-semibold hover:underline">See all</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {featured.map(h => (
              <div key={h.id} className="min-w-[280px]">
                <HostelCard hostel={h} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto w-full px-4 py-8 flex gap-6 flex-1">

        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        {/* Cards */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="font-bold text-gray-800">{results.length} hostel{results.length !== 1 ? "s" : ""} found</p>
              <p className="text-sm text-gray-400">
                {filters.location === "All" ? "All locations" : filters.location}
                {search ? ` · "${search}"` : ""}
              </p>
            </div>
            <button
              className="lg:hidden btn-ghost flex items-center gap-2 text-sm"
              onClick={() => setShowMobileFilter(!showMobileFilter)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Filters
            </button>
          </div>

          {/* Mobile filters */}
          {showMobileFilter && (
            <div className="lg:hidden mb-5">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </div>
          )}

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map(h => <HostelCard key={h.id} hostel={h} />)}
            </div>
          ) : (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-4">🏚</p>
              <p className="text-lg font-semibold text-gray-600">No hostels match your filters.</p>
              <p className="text-sm">Try adjusting filters or clearing your search.</p>
              <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }} className="mt-4 btn-primary">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="bg-[#F59E0B] py-12 text-center">
        <h2 className="text-2xl font-extrabold text-white" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Own a hostel near UMaT?
        </h2>
        <p className="text-yellow-100 mt-2 text-sm">Join HostelHub and reach thousands of students every semester.</p>
        <a href="/host/signup" className="mt-5 inline-block bg-white text-[#1E40AF] font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition shadow">
          List Your Hostel Free →
        </a>
      </section>

      <Footer />
    </main>
  );
}