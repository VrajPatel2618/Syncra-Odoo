"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapModalProps {
  currentLat?: number;
  currentLng?: number;
  destLat: number;
  destLng: number;
  destCity: string;
  title: string;
  onClose: () => void;
}

export default function MapModal({ currentLat, currentLng, destLat, destLng, destCity, title, onClose }: MapModalProps) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  // Center on current location if available, otherwise destination
  const centerLat = currentLat || destLat;
  const centerLng = currentLng || destLng;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-stone-900 border border-stone-700 p-4 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col h-[75vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Delivery Map: {title}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white px-3 py-1 bg-stone-800 rounded-md">
            Close
          </button>
        </div>
        
        <div className="flex-1 rounded-lg overflow-hidden border border-stone-700 bg-stone-800 relative z-0">
          <MapContainer center={[centerLat, centerLng]} zoom={currentLat ? 10 : 12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {currentLat && currentLng && (
              <Marker position={[currentLat, currentLng]}>
                <Popup>
                  <strong className="text-stone-900">🚚 Live Location</strong><br/>
                  Coordinates: {currentLat}, {currentLng}
                </Popup>
              </Marker>
            )}
            <Marker position={[destLat, destLng]}>
              <Popup>
                <strong className="text-stone-900">🏠 Delivery Destination</strong><br/>
                Customer City: {destCity}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
