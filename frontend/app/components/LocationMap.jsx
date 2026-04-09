"use client";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { useRef, useEffect, useState } from "react";

const render = (status) => {
  if (status === Status.LOADING) return <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl"><div className="w-6 h-6 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin"/></div>;
  if (status === Status.FAILURE) return <div className="flex items-center justify-center h-64 bg-red-50 rounded-xl"><p className="text-red-600 text-sm">Failed to load map</p></div>;
  return null;
};

function MyMapComponent({ center, zoom, onLocationSelect, selectedLocation }) {
  const ref = useRef();
  const [map, setMap] = useState();
  const [marker, setMarker] = useState();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setMap(newMap);

      // Add click listener to select location
      newMap.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        onLocationSelect({ lat, lng });

        // Update or create marker
        if (marker) {
          marker.setPosition(event.latLng);
        } else {
          const newMarker = new window.google.maps.Marker({
            position: event.latLng,
            map: newMap,
            draggable: true,
          });
          setMarker(newMarker);

          // Add drag listener
          newMarker.addListener("dragend", (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            onLocationSelect({ lat, lng });
          });
        }
      });
    }
  }, [ref, map, center, zoom, onLocationSelect, marker]);

  // Update marker position when selectedLocation changes
  useEffect(() => {
    if (map && selectedLocation && marker) {
      const position = new window.google.maps.LatLng(selectedLocation.lat, selectedLocation.lng);
      marker.setPosition(position);
      map.setCenter(position);
    }
  }, [map, selectedLocation, marker]);

  return <div ref={ref} className="w-full h-64 rounded-xl" />;
}

export default function LocationMap({ onLocationSelect, selectedLocation }) {
  const center = selectedLocation || { lat: 4.9036, lng: -1.7749 }; // Tarkwa, Ghana coordinates
  const zoom = 15;

  return (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDummyKeyForDevelopment"} render={render}>
      <MyMapComponent center={center} zoom={zoom} onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} />
    </Wrapper>
  );
}