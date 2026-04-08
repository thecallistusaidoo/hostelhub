"use client";
import { useState } from "react";

const AMENITIES = ["WiFi", "Water", "Electricity", "Generator", "Kitchen", "Security", "AC", "Laundry", "Parking"];
const ROOM_TYPES = ["1 in a Room", "2 in a Room", "4 in a Room"];
const LOCATIONS = ["All", "Umat", "Tarkwa"];
const GENDERS = ["All", "Mixed", "Male Only", "Female Only"];
const SORT_OPTIONS = ["Newest", "Lowest Price", "Highest Rated", "Most Viewed"];

export default function FilterSidebar({ filters, setFilters, onClose }) {
  const toggle = (key, val) => {
    setFilters(f => {
      const arr = f[key] || [];
      return {
        ...f,
        [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      };
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-base">Filters</h3>
        <button
          onClick={() => setFilters({ location: "All", gender: "All", amenities: [], roomTypes: [], minPrice: 0, maxPrice: 10000, sort: "Newest" })}
          className="text-xs text-[#1E40AF] font-semibold hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Sort */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Sort by</p>
        <select
          value={filters.sort}
          onChange={e => setFilters(f => ({...f, sort: e.target.value}))}
          className="input-field text-sm"
        >
          {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Location */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Location</p>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map(loc => (
            <button
              key={loc}
              onClick={() => setFilters(f => ({...f, location: loc}))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filters.location === loc
                  ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Gender</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map(g => (
            <button
              key={g}
              onClick={() => setFilters(f => ({...f, gender: g}))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filters.gender === g
                  ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Price Range: <span className="text-[#1E40AF]">GH₵{filters.minPrice.toLocaleString()} – GH₵{filters.maxPrice.toLocaleString()}</span>
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Min</span>
            <input
              type="range" min={0} max={10000} step={100}
              value={filters.minPrice}
              onChange={e => setFilters(f => ({...f, minPrice: Number(e.target.value)}))}
              className="flex-1 accent-[#1E40AF]"
            />
            <span>GH₵{filters.minPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Max</span>
            <input
              type="range" min={0} max={10000} step={100}
              value={filters.maxPrice}
              onChange={e => setFilters(f => ({...f, maxPrice: Number(e.target.value)}))}
              className="flex-1 accent-[#1E40AF]"
            />
            <span>GH₵{filters.maxPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Room Types */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Room Type</p>
        <div className="flex flex-col gap-2">
          {ROOM_TYPES.map(rt => (
            <label key={rt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.roomTypes || []).includes(rt)}
                onChange={() => toggle("roomTypes", rt)}
                className="accent-[#1E40AF] w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">{rt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => (
            <button
              key={a}
              onClick={() => toggle("amenities", a)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                (filters.amenities || []).includes(a)
                  ? "bg-[#1E40AF] text-white border-[#1E40AF]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF]"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
