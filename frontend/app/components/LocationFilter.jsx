"use client";

const LOCATIONS = ["All", "Umat", "Tarkwa"];

export default function LocationFilter({ selectedLocation, setSelectedLocation }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-gray-500 mr-1">Filter by:</span>
      {LOCATIONS.map((loc) => (
        <button
          key={loc}
          onClick={() => setSelectedLocation(loc)}
          className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
            selectedLocation === loc
              ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-md shadow-blue-200"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#1E40AF] hover:text-[#1E40AF]"
          }`}
        >
          {loc === "All" ? "🏘 All Hostels" : loc === "Umat" ? "🎓 Near UMaT" : "🏙 Tarkwa Town"}
        </button>
      ))}
    </div>
  );
}
