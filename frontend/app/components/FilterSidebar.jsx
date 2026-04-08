"use client";
import { useState } from "react";

const AMENITIES = ["WiFi","Water","Electricity","Generator","Kitchen","Security","AC","Laundry","Parking","Wardrobe"];
const LOCATIONS = ["All","Umat","Tarkwa"];
const GENDERS   = ["All","Mixed","Male Only","Female Only"];
const SORT_OPT  = ["Newest","Lowest Price","Highest Price","Highest Rated","Most Viewed"];

export default function FilterSidebar({ filters, setFilters }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = (k, v) => {
    setFilters(f => {
      const arr = f[k] || [];
      return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
    });
  };
  const toggleSection = (s) => setCollapsed(p => ({...p, [s]: !p[s]}));

  const Section = ({ id, title, children }) => (
    <div className="border-b border-white/20 dark:border-white/08 last:border-0 pb-4 mb-4 last:mb-0 last:pb-0">
      <button onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full text-left mb-3 group">
        <span className="text-xs font-bold text-[--text-primary] uppercase tracking-widest group-hover:text-[#1E40AF] dark:group-hover:text-blue-300 transition-colors">
          {title}
        </span>
        <svg className={`w-4 h-4 text-[--text-muted] transition-transform duration-200 ${collapsed[id] ? "" : "rotate-180"}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {!collapsed[id] && <div className="animate-fade-up">{children}</div>}
    </div>
  );

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
        active
          ? "text-white border-[#1E40AF]"
          : "border-white/30 dark:border-white/10 text-[--text-secondary] hover:border-[#1E40AF] hover:text-[#1E40AF] dark:hover:text-blue-300"
      }`}
      style={active ? {background:"linear-gradient(135deg,#1E40AF,#2563EB)",boxShadow:"0 2px 8px rgba(30,64,175,0.30)"} : {}}>
      {label}
    </button>
  );

  const reset = () => setFilters({ location:"All", gender:"All", amenities:[], minPrice:0, maxPrice:10000, sort:"Newest" });
  const activeCount = (filters.location !== "All" ? 1 : 0) + (filters.gender !== "All" ? 1 : 0) +
    filters.amenities.length + (filters.minPrice > 0 || filters.maxPrice < 10000 ? 1 : 0);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[--text-primary] text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1E40AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="badge-blue">{activeCount}</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button onClick={reset} className="text-xs text-[#1E40AF] dark:text-blue-300 font-semibold hover:underline">
            Clear all
          </button>
        )}
      </div>

      <Section id="sort" title="Sort By">
        <select value={filters.sort} onChange={e => setFilters(f => ({...f, sort:e.target.value}))}
          className="input-field text-xs">
          {SORT_OPT.map(o => <option key={o}>{o}</option>)}
        </select>
      </Section>

      <Section id="location" title="Location">
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map(l => <Pill key={l} label={l === "All" ? "🏘 All" : l === "Umat" ? "🎓 Near UMaT" : "🏙 Tarkwa"} active={filters.location === l} onClick={() => setFilters(f => ({...f, location:l}))}/>)}
        </div>
      </Section>

      <Section id="gender" title="Gender">
        <div className="flex flex-wrap gap-2">
          {GENDERS.map(g => <Pill key={g} label={g} active={filters.gender === g} onClick={() => setFilters(f => ({...f, gender:g}))}/>)}
        </div>
      </Section>

      <Section id="price" title="Price Range">
        <p className="text-xs text-[--text-muted] mb-3">
          GH₵{filters.minPrice.toLocaleString()} – GH₵{filters.maxPrice.toLocaleString()}
        </p>
        <div className="space-y-3">
          {[["Min","minPrice",0],["Max","maxPrice",10000]].map(([l,k,def]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-[--text-muted] w-8">{l}</span>
              <input type="range" min={0} max={10000} step={100}
                value={filters[k]}
                onChange={e => setFilters(f => ({...f, [k]:Number(e.target.value)}))}
                className="flex-1 accent-[#1E40AF] h-1 rounded-full"/>
              <span className="text-xs text-[--text-muted] w-14 text-right">GH₵{Number(filters[k]).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="amenities" title="Amenities">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => (
            <Pill key={a} label={a} active={(filters.amenities||[]).includes(a)} onClick={() => toggle("amenities", a)}/>
          ))}
        </div>
      </Section>
    </div>
  );
}