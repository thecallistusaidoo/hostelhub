export default function LocationFilter({ selectedLocation, setSelectedLocation }) {
  const locations = ["All", "Tarkwa", "Ehostel Area", "Umat Junction", "Nyankomasi"];

  return (
    <div className="flex gap-3 overflow-x-auto">
      {locations.map((loc) => (
        <button
          key={loc}
          onClick={() => setSelectedLocation(loc)}
          className={`px-4 py-2 rounded-full border ${
            selectedLocation === loc
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}