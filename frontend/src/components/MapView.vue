<script setup>
import { onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const userMarker = ref(null)
const locationError = ref(null)

const DEFAULT_LAT = 46.77 //cluj napoca
const DEFAULT_LON = 23.59
const DEFAULT_ZOOM = 33


function initializeMap(lat, lon, zoom)
{
  const map = L.map('map').setView([lat, lon], zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  userMarker.value = L.marker([lat, lon]).addTo(map).bindPopup('Hello from Horse Share 🐴').openPopup()

  return map
}

function updateMapWithLocation(map, lat, lon)
{
  const newLatLng = [lat, lon]
  
  map.setView(newLatLng, 15); 

  userMarker.value.setLatLng(newLatLng)
  userMarker.value.setPopupContent('Hello from Horse Share 🐴');
  userMarker.value.openPopup()

  //userMarker.value = L.marker([lat, lon]).addTo(map).bindPopup('Hello from Horse Share 🐴').openPopup()
}

function getUsersLocation(map)
{
  if('geolocation' in navigator)
  {
    navigator.geolocation.getCurrentPosition(
      //Success callback
      (position) => {
        const {latitude, longitude} = position.coords
        updateMapWithLocation(map, latitude, longitude)
        locationError.value = null
      },
      (error) =>
      {
        console.error('Geolocation error!')
        
      }
    )
  }
  else
  {
    locationError.value = 'Geolocation not supported by your browser!'
  }
  
}

onMounted(() => {
  // Create the map
  const map = initializeMap(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);
  getUsersLocation(map)
  // Add OpenStreetMap tile layer
  

  // Example marker
  //L.marker([46.77, 23.59]).addTo(map).bindPopup('Hello from Horse Share 🐴').openPopup()
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
