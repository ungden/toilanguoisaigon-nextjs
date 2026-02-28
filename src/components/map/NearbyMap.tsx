"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { NearbyLocation } from '@/hooks/data/useNearbyLocations';
import Link from 'next/link';
import { getPathFromSupabaseUrl, getTransformedImageUrl } from '@/utils/image';
import { FALLBACK_IMAGES } from '@/utils/constants';
import { formatDistance } from '@/utils/geo';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  locationMarkerIcon,
  userMarkerIcon,
  TILE_URL,
  TILE_ATTRIBUTION,
  HCMC_CENTER,
  MAP_POPUP_STYLES,
} from './map-utils';

// Helper component to recenter map when user location changes
const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

// Helper component to auto-fit bounds when locations change
const FitBounds = ({ userLocation, locations }: { userLocation: { lat: number; lng: number } | null; locations: NearbyLocation[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const points: L.LatLngExpression[] = locations.map((loc) => [loc.latitude, loc.longitude]);
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points).pad(0.1);
      map.fitBounds(bounds, { maxZoom: 16 });
    }
  }, [map, userLocation, locations]);

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

  // Memoize center position to avoid unnecessary re-renders
  const centerPosition = useMemo<[number, number]>(
    () => userLocation ? [userLocation.lat, userLocation.lng] : HCMC_CENTER,
    [userLocation]
  );

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border border-slate-200">
        <span className="text-slate-400">Đang tải bản đồ...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer 
        center={centerPosition} 
        zoom={userLocation ? 14 : 12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon}>
              <Popup>
                <div className="font-semibold text-vietnam-red-600">Vị trí của bạn</div>
              </Popup>
            </Marker>
            <RecenterAutomatically lat={userLocation.lat} lng={userLocation.lng} />
          </>
        )}

        {/* Auto-fit map bounds to show all markers */}
        <FitBounds userLocation={userLocation} locations={locations} />

        {locations.map((loc) => {
          const imagePath = loc.main_image_url ? getPathFromSupabaseUrl(loc.main_image_url) : null;
          const imageUrl = imagePath 
            ? getTransformedImageUrl(imagePath, { width: 150, height: 100 }) 
            : FALLBACK_IMAGES.location;

          return (
            <Marker 
              key={loc.id} 
              position={[loc.latitude, loc.longitude]}
              icon={locationMarkerIcon}
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
                        {formatDistance(loc.distance_km)}
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
      <style dangerouslySetInnerHTML={{ __html: MAP_POPUP_STYLES }} />
    </div>
  );
}
