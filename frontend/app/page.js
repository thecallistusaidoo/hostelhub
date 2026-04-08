"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HostelCard from "./components/HostelCard";
import FilterSidebar from "./components/FilterSidebar";
import { hostels as hostelAPI, student as studentAPI, getUser } from "./lib/api";

const DEFAULT_FILTERS = {
  location:"All", gender:"All", amenities:[],
  minPrice:0, maxPrice:10000, sort:"Newest",
};

// Stat counter card
function StatCard({ num, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl md:text-3xl font-extrabold text-white">{num}</p>
      <p className="text-blue-300/80 text-xs mt-0.5">{label}</p>
    </div>
  );
}

// Skeleton card for loading
function CardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="skeleton h-48 w-full"/>
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded-lg"/>
        <div className="skeleton h-3 w-1/2 rounded-lg"/>
        <div className="skeleton h-3 w-full rounded-lg"/>
        <div className="skeleton h-8 w-full rounded-xl mt-2"/>
      </div>
    </div>
  );
}

export default function Home() {
  const [allHostels, setAllHostels]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [search, setSearch]             = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [savedIds, setSavedIds]         = useState([]);
  const [stats, setStats]               = useState({ hostels:0, rooms:0 });

  // Load hostels from API
  const loadHostels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hostelAPI.list({ status:"approved" });
      const list = data.hostels || [];
      setAllHostels(list);
      // Correct rooms available: count from DB (rooms endpoint not called here, use priceFrom > 0 as proxy, or isAvailable)
      const availCount = list.filter(h => h.isAvailable !== false).length;
      setStats({ hostels: list.length, rooms: availCount });
    } catch {
      setAllHostels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load student's saved hostels for heart state sync
  useEffect(() => {
    loadHostels();
    const user = getUser();
    if (user?.role === "student") {
      studentAPI.me().then(d => {
        setSavedIds((d.student.savedHostels || []).map(h => (h._id || h).toString()));
      }).catch(() => {});
    }
  }, [loadHostels]);

  // Save toggle callback — syncs across all cards
  const handleSaveToggle = useCallback((hostelId, isSaved) => {
    setSavedIds(prev =>
      isSaved
        ? [...prev, hostelId.toString()]
        : prev.filter(id => id !== hostelId.toString())
    );
  }, []);

  // Client-side filter + sort
  const results = useMemo(() => {
    let list = [...allHostels];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.name?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q) ||
        h.description?.toLowerCase().includes(q) ||
        h.landmark?.toLowerCase().includes(q)
      );
    }
    if (filters.location !== "All") list = list.filter(h => h.location === filters.location);
    if (filters.gender !== "All") list = list.filter(h => h.gender === filters.gender);
    list = list.filter(h => (h.priceFrom || 0) >= filters.minPrice && (h.priceFrom || 0) <= filters.maxPrice);
    if (filters.amenities.length > 0)
      list = list.filter(h => filters.amenities.every(a => h.amenities?.includes(a)));
    if (filters.sort === "Lowest Price") list.sort((a,b) => (a.priceFrom||0) - (b.priceFrom||0));
    else if (filters.sort === "Highest Price") list.sort((a,b) => (b.priceFrom||0) - (a.priceFrom||0));
    else if (filters.sort === "Highest Rated") list.sort((a,b) => (b.hostRating||0) - (a.hostRating||0));
    else if (filters.sort === "Most Viewed") list.sort((a,b) => (b.viewsCount||0) - (a.viewsCount||0));
    else list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [allHostels, search, filters]);

  const featured = allHostels.filter(h => h.featured).slice(0, 4);
  const activeFiltersCount = (filters.location !== "All" ? 1 : 0) +
    (filters.gender !== "All" ? 1 : 0) + filters.amenities.length +
    (filters.minPrice > 0 || filters.maxPrice < 10000 ? 1 : 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="hero-gradient">
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Pill */}
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/25 px-4 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse"/>
            UMaT Verified Hostels
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Find Your Perfect<br/>
            <span className="text-[#F59E0B]">Student Hostel</span>
          </h1>
          <p className="text-blue-200/80 text-base md:text-lg mb-10 max-w-xl mx-auto">
            Browse verified hostels near UMaT campus. Compare prices, amenities, and secure your room today.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="glass-heavy rounded-2xl flex items-center overflow-hidden shadow-2xl">
              <svg className="w-5 h-5 text-[--text-muted] ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, location, landmark..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent px-4 py-4 text-sm text-[--text-primary] placeholder-[--text-muted] focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="w-8 h-8 flex items-center justify-center text-[--text-muted] hover:text-[--text-primary] mr-1 rounded-lg hover:bg-white/20 transition text-lg">
                  ×
                </button>
              )}
              <button className="btn-gold m-2 flex-shrink-0 hidden sm:inline-flex">
                Search
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 flex items-center justify-center gap-6 md:gap-12">
            <StatCard num={loading ? "—" : `${stats.hostels}`} label="Live Hostels"/>
            <div className="h-8 w-px bg-white/15"/>
            <StatCard num={loading ? "—" : `${stats.rooms}`} label="Available Hostels"/>
            <div className="h-8 w-px bg-white/15"/>
            <StatCard num="2" label="Locations"/>
          </div>
        </div>
      </section>

      {/* ══ FEATURED ══════════════════════════════════════════════════ */}
      {!loading && featured.length > 0 && !search && filters.location === "All" && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[--text-primary] text-lg flex items-center gap-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <span className="text-xl">⭐</span> Featured Hostels
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map(h => (
                <HostelCard key={h._id} hostel={h} savedIds={savedIds} onSaveToggle={handleSaveToggle}/>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ MAIN GRID ═════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto w-full px-4 pb-12 flex gap-6 flex-1">

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-20">
            <FilterSidebar filters={filters} setFilters={setFilters}/>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="font-bold text-[--text-primary]">
                {loading ? "Loading..." : `${results.length} hostel${results.length !== 1 ? "s" : ""} found`}
              </p>
              <p className="text-sm text-[--text-muted]">
                {search ? `Results for "${search}"` : filters.location === "All" ? "All locations" : filters.location}
                {activeFiltersCount > 0 && <span className="ml-2 badge-blue">{activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(activeFiltersCount > 0 || search) && (
                <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                  className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">
                  Clear all
                </button>
              )}
              <button
                className="lg:hidden btn-ghost text-sm flex items-center gap-2"
                onClick={() => setShowMobileFilter(!showMobileFilter)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                Filters {activeFiltersCount > 0 && <span className="badge-blue">{activeFiltersCount}</span>}
              </button>
            </div>
          </div>

          {/* Mobile filter panel */}
          {showMobileFilter && (
            <div className="lg:hidden mb-5 animate-fade-up">
              <FilterSidebar filters={filters} setFilters={setFilters}/>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({length:6}).map((_,i) => <CardSkeleton key={i}/>)}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map(h => (
                <HostelCard key={h._id} hostel={h} savedIds={savedIds} onSaveToggle={handleSaveToggle}/>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-16 text-center animate-fade-up">
              <span className="text-6xl block mb-4">🏚</span>
              <h3 className="text-xl font-bold text-[--text-primary] mb-2">No hostels found</h3>
              <p className="text-[--text-muted] text-sm mb-6">
                {allHostels.length === 0
                  ? "No approved hostels yet. Check back soon!"
                  : "Try different search terms or adjust your filters."}
              </p>
              {(search || activeFiltersCount > 0) && (
                <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }} className="btn-primary">
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ CTA BANNER ════════════════════════════════════════════════ */}
      <section className="py-14 relative overflow-hidden" style={{background:"linear-gradient(135deg,#D97706,#F59E0B,#FBBF24)"}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 0%, transparent 60%),"}}/>
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Own a hostel near UMaT?
          </h2>
          <p className="text-white/80 text-sm mb-6">
            Join HostelHub and reach thousands of students every semester. Listing is completely free.
          </p>
          <a href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#1E40AF] font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition shadow-xl">
            List Your Hostel Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
        </div>
      </section>

      <Footer/>
    </div>
  );
}