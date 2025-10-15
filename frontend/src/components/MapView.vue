<script setup>
import { onMounted, ref, computed , watch} from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import horseIconUrl from '../assets/horseIcon.png'
import carriageIconUrl from '../assets/horseCarriageIcon.png'
import { userStore } from "../stores/userStores.js"


const userMarker = ref(null)
const locationError = ref(null)

const DEFAULT_LAT = 46.77 //cluj napoca
const DEFAULT_LON = 23.59
const DEFAULT_ZOOM = 33

const isLoggedIn = computed(() => userStore.loggedIn)
const userEmail = computed(() => userStore.email)
const userLocation = computed(() => userStore.location)

let map = ref(null);

//TEST - To move to backend
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
  const map = L.map('map').setView([lat, lon], zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  userMarker.value = L.marker([lat, lon]).addTo(map).bindPopup('Hello from Horse Share 🐴').openPopup()

  return map
}

function updateMapWithLocation(map, lat, lon) {
  const newLatLng = [lat, lon]

  map.setView(newLatLng, 15);

  userMarker.value.setLatLng(newLatLng)
  userMarker.value.setPopupContent('Hello from Horse Share 🐴');
  userMarker.value.openPopup()
}


//TODO - TEST - Must move to backend
function generateRandomHorses(map, count = 5, centerLat = DEFAULT_LAT, centerLon = DEFAULT_LON, radiusKm = 5) {
  const earthRadiusKm = 6371;
  const radiusDegrees = radiusKm / earthRadiusKm * (180 / Math.PI);

  for (let i = 0; i < count; i++) {
    const distance = Math.random() * radiusDegrees;
    const angle = Math.random() * 2 * Math.PI;

    const lat = centerLat + distance * Math.cos(angle)
    const lon = centerLon + distance * Math.sin(angle)

    if (lat > -90 && lat < 90 && lon > -180 && lon < 180) {
      L.marker([lat, lon], { icon: horseIcon }).addTo(map).bindPopup("Sunt un cal RANDOM!")
    }
  }
}

//Watch the userStore for login + location updates
watch(
  () => [userStore.loggedIn, userStore.location],
  ([loggedIn, location]) => {
    if (loggedIn && location) {
      const [lat, lon] = location
      updateMapWithLocation(map, lat, lon)
    }
  },
  { immediate: true, deep: true }
)


onMounted(() => {
  // Create the map
  map = initializeMap(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);
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
