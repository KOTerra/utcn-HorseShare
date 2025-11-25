
import L from 'leaflet'

export const DEFAULT_LAT = 46.77 // Cluj Napoca
export const DEFAULT_LON = 23.59
export const DEFAULT_ZOOM = 13
export const DEFAULT_RANGE = 5000 // m

export const FETCH_TRIGGER_DISTANCE = 500; 

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});