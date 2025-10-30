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

const DEFAULT_LAT = 46.77 // cluj napoca
const DEFAULT_LON = 23.59
const DEFAULT_ZOOM = 13
const DEFAULT_RANGE = 3 // km

// tracks center of the last successful horse fetch
const lastFetchCenter = ref({ lat: null, lon: null });
// How far the user must move to trigger a new fetch.
const FETCH_TRIGGER_DISTANCE = DEFAULT_RANGE / 2;


const isLoggedIn = computed(() => userStore.loggedIn)
const userLocation = computed(() => userStore.location)

let map = null;
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


function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (dgr) => (dgr * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function initializeMap(lat, lon, zoom) {
  const mapInstance = L.map('map').setView([lat, lon], zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapInstance)

  // Only add the user marker if they are logged in
  if (isLoggedIn.value) {
    userMarker.value = L.marker([lat, lon]).addTo(mapInstance).bindPopup('Hello from Horse Share 🐴').openPopup()
  }

  horseMarkers.addTo(mapInstance);
  return mapInstance
}

function addHorseMarkersToMap(mapInstance, horses) {
  if (!mapInstance || !horses || !Array.isArray(horses)) { return; }
  horseMarkers.clearLayers();

  horses.forEach(horse => {
    if (horse.lat && horse.lon) {
      L.marker([horse.lat, horse.lon], { icon: horseIcon })
        .addTo(horseMarkers) // Add to the layer group
        .bindPopup(`Horse ID: ${horse.id}<br>Name: ${horse.name}`)
    }
  });
}

function addCarriagesMarkersToMap(mapInstance, drivers) {

}

/**
 * Main function to fetch horses (with backend generation handling) and display them.
 */
async function fetchAndDisplayHorses(lat, lon, range) {
  const baseURL = `${API_URL}/api/horses`;
  const apiURL = `${baseURL}/${lat}/${lon}/${range}`;

  console.log(`Fetching horses for [${lat}, ${lon}] within ${range}km...`);

  try {
    const response = await fetch(apiURL);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}. Body: ${text.substring(0, 100)}...`);
    }

    let allHorses = [];
    if (text.trim().length > 0) {
      try {
        allHorses = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned invalid JSON format.");
      }
    }

    console.log(`Fetched and ensured sufficient horses: ${allHorses.length}`);
    if (map) {
      addHorseMarkersToMap(map, allHorses);
    } else {
      console.error("Map object is not yet initialized!");
    }
    return true;
  } catch (error) {
    console.error('There was a critical problem fetching horses:', error);
    return false;
  }
}

async function fetchAndDisplayCarriages(lat, lon, range) {
  const baseURL = `${API_URL}/api/drivers`;
  const apiURL = `${baseURL}/${lat}/${lon}/${range}`;
  console.log(`Fetching horses for [${lat}, ${lon}] within ${range}km...`);

  try {
    const response = await fetch(apiURL);
    const text = response.text;
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}. Body: ${text.substring(0, 100)}...`);
    }

    let allDrivers = [];
    if (text.trim().length > 0) {
      try {
        allDrivers = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned invalid JSON format.");
      }
    }
    if (map) {
      addCarriagesMarkersToMap(map, allDriverss)
    }
    else {
      console.error('There was a critical problem fetching horses:', error);
      return false;
    }
    return true;
  }
  catch (error) {
    console.error('There was a critical problem fetching carriage drivers:', error);
    return false;
  }
}

const firstLocationUpdate = ref(true);

function updateMapWithLocation(mapInstance, lat, lon) {
  const newLatLng = [lat, lon]

  if (!userMarker.value) {
    // If marker doesn't exist ( user just logged in)
    if (userStore.role == "Rider")
      userMarker.value = L.marker(newLatLng).addTo(mapInstance);
    else if (userStore.role == "Carriage Driver")
      userMarker.value = L.marker(newLatLng, { icon: carriageIcon }).addTo(mapInstance);

  }

  if (firstLocationUpdate.value == true) {
    mapInstance.setView(newLatLng, 15);
    userMarker.value.setLatLng(newLatLng)
    userMarker.value.setPopupContent('Hello from Horse Share 🐴');
    userMarker.value.openPopup()
    firstLocationUpdate.value = false;
  }
  else {
    userMarker.value.setLatLng(newLatLng)
  }
}


//Watch the userStore for location updates
watch(
  () => userStore.location, // Only watch the location
  async (newLocation) => {
    if (isLoggedIn.value && newLocation && map) {
      const [newLat, newLon] = newLocation;

      updateMapWithLocation(map, newLat, newLon);

      // check if we need to fetch new horses
      const distance = getDistance(
        newLat, newLon,
        lastFetchCenter.value.lat, lastFetchCenter.value.lon
      );

      // fetch if the user has moved far enough from the last fetch center
      if (distance > FETCH_TRIGGER_DISTANCE) {
        console.log(`User moved ${distance.toFixed(2)}km. Triggering new horse fetch.`);

        const success = await fetchAndDisplayHorses(newLat, newLon, DEFAULT_RANGE);
        succes = success && await fetchAndDisplayCarriages(newLat, newLon, DEFAULT_RANGE);
        
        // Only update the fetch center if the new fetch was successful
        if (success) {
          lastFetchCenter.value = { lat: newLat, lon: newLon };

          map.setView([newLat, newLon], map.getZoom());
        }
      }
    }
  },
  { deep: true } // No 'immediate', onMounted will handle the initial load
)


onMounted(async () => {
  let initialLat = DEFAULT_LAT;
  let initialLon = DEFAULT_LON;

  // if user is logged in on mount, use their location for the map and fetch
  if (userStore.loggedIn && userStore.location) {
    [initialLat, initialLon] = userStore.location;
    console.log("User logged in, using user location for initial load.");
  } else {
    console.log("User not logged in, using default location for initial load.");
  }

  map = initializeMap(initialLat, initialLon, DEFAULT_ZOOM);

  // initial fetch
  const success = await fetchAndDisplayHorses(initialLat, initialLon, DEFAULT_RANGE);

  if (success) {
    lastFetchCenter.value = { lat: initialLat, lon: initialLon };
  }

  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 100);
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