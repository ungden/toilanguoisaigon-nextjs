"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  locationMarkerIcon,
  userMarkerIcon,
  TILE_URL,
  TILE_ATTRIBUTION,
  MAP_POPUP_STYLES,
} from './map-utils';

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
      ]).pad(0.2)
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
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        
        <Marker position={[latitude, longitude]} icon={locationMarkerIcon}>
          <Popup>
            <div className="font-semibold text-vietnam-blue-800">{name}</div>
          </Popup>
        </Marker>

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
            <Popup>
              <div className="font-semibold text-vietnam-red-600">Vị trí của bạn</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <style dangerouslySetInnerHTML={{ __html: MAP_POPUP_STYLES }} />
    </div>
  );
}
