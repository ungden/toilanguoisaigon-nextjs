import L from 'leaflet';

// Tile layer config (CartoCDN Voyager - free, no API key needed)
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Default center: Ho Chi Minh City
export const HCMC_CENTER: [number, number] = [10.7769, 106.7009];

// Location marker (blue pin) - local assets instead of unpkg CDN
export const locationMarkerIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// User location marker (red dot)
export const userMarkerIcon = new L.DivIcon({
  className: 'custom-user-marker',
  html: '<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Shared popup styles injected via <style> tag
export const MAP_POPUP_STYLES = `
  .leaflet-popup-content-wrapper { border-radius: 8px; }
  .leaflet-popup-content { margin: 8px; }
`;
