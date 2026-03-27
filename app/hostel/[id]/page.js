"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import hostels from "../../data/hostels";

export default function HostelDetail() {
  const params = useParams();
  const hostelId = parseInt(params.id);
  const hostel = hostels.find(h => h.id === hostelId);
  const [mainImage, setMainImage] = useState(hostel?.images[0]);

  if (!hostel) return <div>Hostel not found</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex flex-col md:flex-row px-6 md:px-16 mt-6 gap-6">
        
        {/* Left: Images */}
        <div className="flex-1">
          <div className="rounded-lg overflow-hidden">
            <img src={mainImage} alt={hostel.name} className="w-full h-80 object-cover" />
          </div>
          <div className="flex gap-2 mt-2">
            {hostel.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${hostel.name}-${idx}`}
                className={`w-24 h-24 object-cover rounded cursor-pointer border-2 ${mainImage === img ? "border-purple-600" : "border-gray-300"}`}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>

          <h1 className="text-3xl font-bold mt-4">{hostel.name}</h1>
          <p className="text-gray-500">{hostel.city} • {hostel.landmark}</p>
        </div>

        {/* Right: Booking & Info */}
        <div className="flex-1 space-y-4">
          
          {/* Book a Room Card */}
          <div className="bg-white p-6 rounded-lg shadow">
            <button className="bg-purple-600 text-white px-4 py-3 rounded w-full font-semibold hover:bg-purple-700 transition">Book a Room</button>
            <div className="flex mt-4 gap-2">
              <button className="border border-gray-300 px-3 py-2 rounded w-1/2">Regular Booking</button>
              <button className="border border-gray-300 px-3 py-2 rounded w-1/2">Short & Bulk</button>
            </div>
          </div>

          {/* Hostel Info Card */}
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <div className="flex justify-between"><span>Type</span><span>{hostel.type}</span></div>
            <div className="flex justify-between"><span>Gender</span><span>{hostel.gender}</span></div>
            <div className="flex justify-between"><span>Rooms</span><span>{hostel.roomsAvailable} available</span></div>
            <div className="flex justify-between"><span>Campus Distance</span><span>{hostel.campusDistance}</span></div>
          </div>

          {/* Location Card */}
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <h2 className="font-semibold">Location</h2>
            <div className="flex justify-between"><span>City</span><span>{hostel.city}</span></div>
            <div className="flex justify-between"><span>Landmark</span><span>{hostel.landmark}</span></div>
            <div className="flex justify-between"><span>Address</span><span>{hostel.address}</span></div>
            <div className="flex justify-between"><span>GhanaPost</span><span>{hostel.ghanaPostAddress}</span></div>
          </div>

          {/* Contact Card */}
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <h2 className="font-semibold">Contact</h2>
            <div className="flex justify-between"><span>Mobile</span><span>{hostel.ownerContact}</span></div>
            <div className="flex justify-between"><span>Email</span><span>{hostel.ownerEmail}</span></div>
          </div>

          {/* Available For Students Card */}
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <h2 className="font-semibold">Available For Students From</h2>
            <ul className="list-disc pl-5">
              {hostel.availableFor.map((uni, idx) => (
                <li key={idx}>{uni}</li>
              ))}
            </ul>
          </div>

          {/* About & Amenities Card */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
              <h2 className="font-semibold">About This Hostel</h2>
              <p className="text-gray-700">{hostel.about}</p>
            </div>
            <div>
              <h2 className="font-semibold">Amenities</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {hostel.amenities.map((amenity, idx) => (
                  <li key={idx}>{amenity}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Room Types & Pricing Card */}
          <div className="bg-white p-6 rounded-lg shadow space-y-2">
            <h2 className="font-semibold">Room Types & Pricing</h2>
            <div className="space-y-2">
              {hostel.roomTypes.map((room, idx) => (
                <div key={idx} className="flex justify-between border-b pb-2">
                  <span>{room.name}</span>
                  <span className="font-semibold">GHC{room.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-purple-700 text-white p-6 text-center">
        <p>© 2026 HostelHub. All rights reserved.</p>
      </footer>
    </div>
  );
}