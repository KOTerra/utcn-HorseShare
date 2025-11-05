<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import horseIconUrl from '../assets/horseIcon.png'
import carriageIconUrl from '../assets/horseCarriageIcon.png'
import { userStore } from "../stores/userStores.js"
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png'

// --- Leaflet Routing & Search ---
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'
import 'leaflet-control-geocoder'
// ---------------------------------

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

const DEFAULT_LAT = 46.77 // Cluj Napoca
const DEFAULT_LON = 23.59
const DEFAULT_ZOOM = 13
const DEFAULT_RANGE = 3 // km

const lastFetchCenter = ref({ lat: null, lon: null });
const FETCH_TRIGGER_DISTANCE = DEFAULT_RANGE / 2;

const isLoggedIn = computed(() => userStore.loggedIn)
const userLocation = computed(() => userStore.location)

let map = null;
let horseMarkers = L.layerGroup();
let carriageMarkers = L.layerGroup();
let routingControl = null;

const horseIcon = L.icon({
  iconUrl: horseIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
})

const carriageIcon = L.icon({
  iconUrl: carriageIconUrl,
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60]
})

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

  if (isLoggedIn.value) {
    userMarker.value = L.marker([lat, lon]).addTo(mapInstance).bindPopup('Hello from Horse Share 🐴').openPopup()
  }

  horseMarkers.addTo(mapInstance);
  carriageMarkers.addTo(mapInstance);

  // --- SEARCH BAR & ROUTING ---
  const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    collapsed: false,
    placeholder: 'Search location...'
  })
    .on('markgeocode', function(e) {
      const destLatLng = e.geocode.center;

      if (routingControl) mapInstance.removeControl(routingControl);

      if (userMarker.value) {
        routingControl = L.Routing.control({
          waypoints: [
            userMarker.value.getLatLng(),
            destLatLng
          ],
          routeWhileDragging: true
        }).addTo(mapInstance);
      }

      mapInstance.fitBounds(L.latLngBounds([userMarker.value.getLatLng(), destLatLng]));
    })
    .addTo(mapInstance);
  // -----------------------------

  return mapInstance
}

function addHorseMarkersToMap(horses) {
  if (horseMarkers) horseMarkers.clearLayers();

  horses.forEach(horse => {
    const [lat, lon] = horse.location;

    L.marker([lat, lon], { icon: horseIcon })
      .addTo(horseMarkers)
      .bindPopup(`Horse ID: ${horse.id || 'N/A'}<br>Name: ${horse.name || 'Unknown'}`);
  });
}

function addCarriagesMarkersToMap(drivers) {
  if (carriageMarkers) carriageMarkers.clearLayers();

  drivers.forEach(driver => {
    const [lat, lon] = driver.location;

    L.marker([lat, lon], { icon: carriageIcon })
      .addTo(carriageMarkers)
      .bindPopup(`Driver ID: ${driver.id || 'N/A'}<br>Name: ${driver.name || 'Unknown'}`);
  });
}

async function fetchAndDisplayHorses(lat, lon, range) {
  const baseURL = `${API_URL}/api/horses`;
  const apiURL = `${baseURL}/${lat}/${lon}/${range}`;

  try {
    const response = await fetch(apiURL);
    const text = await response.text();

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}. Body: ${text.substring(0, 100)}...`);

    let allHorses = [];
    if (text.trim().length > 0) {
      allHorses = JSON.parse(text);
    }

    if (map) addHorseMarkersToMap(allHorses);
    return true;
  } catch (error) {
    console.error('There was a critical problem fetching horses:', error);
    return false;
  }
}

async function fetchAndDisplayCarriages(lat, lon, range) {
  const baseURL = `${API_URL}/api/drivers`;
  const apiURL = `${baseURL}/${lat}/${lon}/${range}`;

  try {
    const response = await fetch(apiURL);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}. Body: ${await response.text().substring(0,100)}...`);

    const allDrivers = await response.json();
    if (map) addCarriagesMarkersToMap(allDrivers);
    return true;
  } catch (error) {
    console.error('There was a critical problem fetching carriage drivers:', error);
    return false;
  }
}

const firstLocationUpdate = ref(true);

function updateMapWithLocation(mapInstance, lat, lon) {
  const newLatLng = [lat, lon]

  if (!userMarker.value) {
    if (userStore.role == "Rider")
      userMarker.value = L.marker(newLatLng).addTo(mapInstance);
    else if (userStore.role == "Carriage Driver")
      userMarker.value = L.marker(newLatLng, { icon: carriageIcon }).addTo(mapInstance);
  }

  if (firstLocationUpdate.value) {
    mapInstance.setView(newLatLng, 15);
    userMarker.value.setLatLng(newLatLng)
    userMarker.value.setPopupContent('Hello from Horse Share 🐴');
    userMarker.value.openPopup()
    firstLocationUpdate.value = false;
  } else {
    userMarker.value.setLatLng(newLatLng)
  }
}

watch(
  () => userStore.location,
  async (newLocation) => {
    if (isLoggedIn.value && newLocation && map) {
      const [newLat, newLon] = newLocation;

      updateMapWithLocation(map, newLat, newLon);

      const distance = getDistance(
        newLat, newLon,
        lastFetchCenter.value.lat, lastFetchCenter.value.lon
      );

      if (distance > FETCH_TRIGGER_DISTANCE) {
        let success = await fetchAndDisplayHorses(newLat, newLon, DEFAULT_RANGE) &&
                      await fetchAndDisplayCarriages(newLat, newLon, DEFAULT_RANGE);

        if (success) lastFetchCenter.value = { lat: newLat, lon: newLon };
        map.setView([newLat, newLon], map.getZoom());
      }
    }
  },
  { deep: true }
)

onMounted(async () => {
  let initialLat = DEFAULT_LAT;
  let initialLon = DEFAULT_LON;

  if (userStore.loggedIn && userStore.location) {
    [initialLat, initialLon] = userStore.location;
  }

  map = initializeMap(initialLat, initialLon, DEFAULT_ZOOM);

  const success = await fetchAndDisplayHorses(initialLat, initialLon, DEFAULT_RANGE);
  if (success) lastFetchCenter.value = { lat: initialLat, lon: initialLon };

  setTimeout(() => {
    if (map) map.invalidateSize();
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
