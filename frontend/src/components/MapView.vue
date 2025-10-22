<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import horseIconUrl from '../assets/horseIcon.png'
import carriageIconUrl from '../assets/horseCarriageIcon.png'
import { userStore } from "../stores/userStores.js"
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png'

const API_URL = import.meta.env.VITE_API_URL;

// --- Leaflet Configuration ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// -----------------------------

const userMarker = ref(null)
const locationError = ref(null)

const DEFAULT_LAT = 46.77 // cluj napoca
const DEFAULT_LON = 23.59
const DEFAULT_ZOOM = 13 // A sensible default zoom level
const DEFAULT_RANGE = 5 // Kilometers
const DEFAULT_HORSE_COUNT = 25 // Target count (used by the backend)

const isLoggedIn = computed(() => userStore.loggedIn)
const userEmail = computed(() => userStore.email)
const userLocation = computed(() => userStore.location)



let map = null; // Map instance
let horseMarkers = L.layerGroup(); // Group to manage and clear horse markers easily

const horseIcon = L.icon({
  iconUrl: horseIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
})

const carriageIcon = L.icon({
  iconUrl: carriageIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
})


function initializeMap(lat, lon, zoom) {
  const mapInstance = L.map('map').setView([lat, lon], zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapInstance)

  userMarker.value = L.marker([lat, lon]).addTo(mapInstance).bindPopup('Hello from Horse Share 🐴').openPopup()
  horseMarkers.addTo(mapInstance);

  return mapInstance
}

/**
 * Adds an array of horse objects to the map as markers.
 * Clears existing horse markers first.
 * @param {L.Map} mapInstance - The Leaflet map instance.
 * @param {Array<Object>} horses - Array of horse objects, each should have lat, lon, and id.
 */
function addHorseMarkersToMap(mapInstance, horses) {
    if (!mapInstance || !horses || !Array.isArray(horses)) return;
    horseMarkers.clearLayers();

    horses.forEach(horse => {
        if (horse.lat && horse.lon) {
            L.marker([horse.lat, horse.lon], { icon: horseIcon })
                .addTo(horseMarkers) // Add to the layer group
                .bindPopup(`Horse ID: ${horse.id || 'N/A'}<br>Name: ${horse.name || 'Unknown'}`) 
        }
    });
    console.log(`📍 Successfully added ${horses.length} horse markers to the map.`);
}

/**
 * Main function to fetch horses (with backend generation handling) and display them.
 */
async function fetchAndDisplayHorses() {
    // The backend endpoint now handles checking for the DEFAULT_HORSE_COUNT and generating if needed.
    const baseURL = `${API_URL}/api/horses`;
    const apiURL = `${baseURL}/${DEFAULT_LAT}/${DEFAULT_LON}/${DEFAULT_RANGE}`;

    try {
        const response = await fetch(apiURL);
        const text = await response.text();
        
        console.log("Raw API Response Text:", text);

        // 1. Check HTTP Status
        if (!response.ok) {
             throw new Error(`HTTP error! Status: ${response.status}. Body: ${text.substring(0, 100)}...`);
        }
        
        let allHorses = [];

        // 2. Check Content and Parse JSON
        if (text.trim().length > 0) {
            try {
                allHorses = JSON.parse(text);
                
                if (!Array.isArray(allHorses)) {
                    console.warn("API response was not an array (Server sent non-array data). Using empty list.");
                    allHorses = [];
                }
            } catch (e) {
                console.error("❌ Failed to parse JSON body:", e);
                console.error("Raw response text that failed to parse:", text);
                throw new Error("Server returned invalid JSON format.");
            }
        } else {
             console.log("Response body was empty. Assuming 0 existing horses.");
        }
        
        // 3. Display
        console.log(`Fetched and ensured sufficient horses: ${allHorses.length}`);
        
        if (map) {
             addHorseMarkersToMap(map, allHorses);
        } else {
             console.error("Map object is not yet initialized!");
        }

    } catch (error) {
        console.error('There was a critical problem fetching horses:', error);
    }
}


function updateMapWithLocation(mapInstance, lat, lon) {
  const newLatLng = [lat, lon]

  mapInstance.setView(newLatLng, 15);

  userMarker.value.setLatLng(newLatLng)
  userMarker.value.setPopupContent('Hello from Horse Share 🐴');
  userMarker.value.openPopup()
}


//Watch the userStore for login + location updates
watch(
  () => [userStore.loggedIn, userStore.location],
  ([loggedIn, location]) => {
    if (loggedIn && location) {
      const [lat, lon] = location
      if (map) {
        updateMapWithLocation(map, lat, lon)
      }
    }
  },
  { immediate: true, deep: true }
)


onMounted(async () => {
  map = initializeMap(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);
  
  await fetchAndDisplayHorses();
})
</script>

<template>
  <div id="map" class="w-full h-[500px] rounded-2xl shadow-lg"></div>
</template>

<style>
#map {
  height: 500px;
}
</style>