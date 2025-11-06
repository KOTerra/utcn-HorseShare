// src/composables/useMarkers.js

import { ref, computed } from 'vue'
import L from 'leaflet'
import horseIconUrl from '../assets/horseIcon.png' 
import carriageIconUrl from '../assets/horseCarriageIcon.png' 

// --- Marker Icons ---
const horseIcon = L.icon({
  iconUrl: horseIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
})

export const carriageIcon = L.icon({ 
  iconUrl: carriageIconUrl,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60]
})
// ----------------------

export function useMarkers(userStore) {
  const userMarker = ref(null)
  const horseMarkers = L.layerGroup();
  const carriageMarkers = L.layerGroup();
  const firstLocationUpdate = ref(true);

  const addHorseMarkersToMap = (horses) => {
    horseMarkers.clearLayers();

    horses.forEach(horse => {
      const [lat, lon] = horse.location;
      L.marker([lat, lon], { icon: horseIcon })
        .addTo(horseMarkers)
        .bindPopup(`Horse ID: ${horse.id || 'N/A'}<br>Name: ${horse.name || 'Unknown'}`);
    });
  }

  const addCarriagesMarkersToMap = (drivers) => {
    carriageMarkers.clearLayers();

    drivers.forEach(driver => {
      const [lat, lon] = driver.location;
      L.marker([lat, lon], { icon: carriageIcon })
        .addTo(carriageMarkers)
        .bindPopup(`Driver ID: ${driver.id || 'N/A'}<br>Name: ${driver.name || 'Unknown'}`);
    });
  }

  const updateUserMarker = (mapInstance, lat, lon) => {
    const newLatLng = [lat, lon];
    const userRole = userStore.role;

    if (!userMarker.value) {
      // Create user marker if it doesn't exist
      if (userRole === "Rider") {
        userMarker.value = L.marker(newLatLng).addTo(mapInstance);
      } else if (userRole === "Carriage Driver") {
        userMarker.value = L.marker(newLatLng, { icon: carriageIcon }).addTo(mapInstance);
      }
    }

    if (userMarker.value) {
      // Update marker location and initial view/popup
      userMarker.value.setLatLng(newLatLng);

      if (firstLocationUpdate.value) {
        mapInstance.setView(newLatLng, 15);
        userMarker.value.setPopupContent('Hello from Horse Share 🐴📍');
        userMarker.value.openPopup();
        firstLocationUpdate.value = false;
      }
    }
  }

  return {
    userMarker,
    horseMarkers,
    carriageMarkers,
    addHorseMarkersToMap,
    addCarriagesMarkersToMap,
    updateUserMarker,
  }
}