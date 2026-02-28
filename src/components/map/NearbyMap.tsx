"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { NearbyLocation } from '@/hooks/data/useNearbyLocations';
import Link from 'next/link';
import { getPathFromSupabaseUrl, getTransformedImageUrl } from '@/utils/image';
import { FALLBACK_IMAGES } from '@/utils/constants';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '../ui/badge';

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

// Helper component to recenter map when user location changes
const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

interface NearbyMapProps {
  userLocation: { lat: number; lng: number } | null;
  locations: NearbyLocation[];
}

export default function NearbyMap({ userLocation, locations }: NearbyMapProps) {
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

  // Default center to Ho Chi Minh City if no user location
  const centerPosition = userLocation 
    ? [userLocation.lat, userLocation.lng] as [number, number]
    : [10.7769, 106.7009] as [number, number];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer 
        center={centerPosition} 
        zoom={userLocation ? 14 : 12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div className="font-semibold text-vietnam-red-600">Vị trí của bạn</div>
              </Popup>
            </Marker>
            <RecenterAutomatically lat={userLocation.lat} lng={userLocation.lng} />
          </>
        )}

        {locations.map((loc) => {
          const imagePath = loc.main_image_url ? getPathFromSupabaseUrl(loc.main_image_url) : null;
          const imageUrl = imagePath 
            ? getTransformedImageUrl(imagePath, { width: 150, height: 100 }) 
            : FALLBACK_IMAGES.location;

          return (
            <Marker 
              key={loc.id} 
              position={[loc.latitude, loc.longitude]}
              icon={customMarkerIcon}
            >
              <Popup className="nearby-popup">
                <div className="w-[200px] flex flex-col gap-2 p-1">
                  <div className="relative w-full h-[100px] rounded overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={loc.name} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <Link href={`/place/${loc.slug}`} className="font-semibold text-sm hover:text-vietnam-red-600 transition-colors line-clamp-1">
                      {loc.name}
                    </Link>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{loc.district}</span>
                      <span className="mx-1">•</span>
                      <span className="text-vietnam-red-600 font-medium">
                        {loc.distance_km < 1 
                          ? `${Math.round(loc.distance_km * 1000)}m` 
                          : `${loc.distance_km.toFixed(1)}km`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-yellow-500 text-xs">
                        <Star className="h-3 w-3 fill-current mr-1" />
                        <span>{loc.average_rating > 0 ? loc.average_rating.toFixed(1) : 'Mới'}</span>
                        <span className="text-slate-400 ml-1">({loc.review_count})</span>
                      </div>
                      {loc.category && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {loc.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper { border-radius: 8px; }
        .leaflet-popup-content { margin: 8px; }
      `}} />
    </div>
  );
}
