// src/constants.js

import L from 'leaflet'

// Default Coordinates & Zoom
export const DEFAULT_LAT = 46.77 // Cluj Napoca
export const DEFAULT_LON = 23.59
export const DEFAULT_ZOOM = 13
export const DEFAULT_RANGE = 3 // km

// Marker Fetching Logic
export const FETCH_TRIGGER_DISTANCE = DEFAULT_RANGE / 2;

// Leaflet Default Marker Fix (Important for Webpack/Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});