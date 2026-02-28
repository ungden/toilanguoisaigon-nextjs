"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons in Next.js
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user location
const userIcon = new L.DivIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

interface PlaceMapProps {
  latitude: number;
  longitude: number;
  name: string;
  userLocation?: { lat: number; lng: number } | null;
}

export default function PlaceMap({ latitude, longitude, name, userLocation }: PlaceMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200">
        <span className="text-slate-400">Đang tải bản đồ...</span>
      </div>
    );
  }

  // Calculate bounds if we have both locations to ensure both are visible
  const bounds = userLocation 
    ? L.latLngBounds([
        [latitude, longitude],
        [userLocation.lat, userLocation.lng]
      ]).pad(0.2) // Add 20% padding around the bounds
    : undefined;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={bounds ? undefined : [latitude, longitude]} 
        bounds={bounds}
        zoom={15} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={[latitude, longitude]} icon={customMarkerIcon}>
          <Popup>
            <div className="font-semibold text-vietnam-blue-800">{name}</div>
          </Popup>
        </Marker>

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="font-semibold text-vietnam-red-600">Vị trí của bạn</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper { border-radius: 8px; }
        .leaflet-popup-content { margin: 8px; }
      `}} />
    </div>
  );
}
