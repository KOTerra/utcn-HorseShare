<script setup>
import { onMounted, ref, computed, watch, nextTick, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet-routing-machine'
import { userStore } from "../stores/userStores.js"
import { useMap } from '../composables/useMap.js'
import { useMarkers } from '../composables/useMarkers.js'
import { useApi } from '../composables/useApi.js'
import {
  DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM,
  DEFAULT_RANGE, FETCH_TRIGGER_DISTANCE
} from '../composables/constants.js'



const isLoggedIn = computed(() => userStore.loggedIn)
const lastFetchCenter = ref({ lat: null, lon: null })
const routingControl = shallowRef(null)



const {
  userMarker, horseMarkers, carriageMarkers,
  addHorseMarkersToMap, addCarriagesMarkersToMap,
  updateUserMarker, clearAllMarkers
} = useMarkers(userStore)

const {
  map, initializeMap, setupRoutingAndSearch
} = useMap(null, null, [horseMarkers, carriageMarkers])

const {
  fetchAndDisplayHorses, fetchAndDisplayCarriages, getDistance
} = useApi(addHorseMarkersToMap, addCarriagesMarkersToMap)



const getLatLon = (input) => {
  if (!input) return null
  if (Array.isArray(input) && input.length >= 2)
    return L.latLng(input[0], input[1])
  if (input.lat && input.lon)
    return L.latLng(input.lat, input.lon)
  if (input.lat && input.lng)
    return L.latLng(input.lat, input.lng)
  if (input.latitude && input.longitude)
    return L.latLng(input.latitude, input.longitude)
  return null
}


// INVISIBLE MARKER (fixes LRM zoom break issue) 
const emptyMarkerIcon = L.divIcon({
  className: 'empty-marker',
  html: '',
  iconSize: [0, 0]
})


// Route Management
const initRouting = () => {
  if (!map.value) return

  routingControl.value = L.Routing.control({
    waypoints: [],
    draggableWaypoints: false,
    addWaypoints: false,
    routeWhileDragging: false,

    fitSelectedRoutes: false, 
    showAlternatives: false,

    lineOptions: {
      styles: [{ color: '#75cab9', opacity: 0.9, weight: 6 }],
      extendToWaypoints: false,
      missingRouteTolerance: 10
    },

    createMarker: (i, wp, nWps) => {
      if (i === 0) {
        return L.marker(wp.latLng, { icon: emptyMarkerIcon })
      }
      return L.marker(wp.latLng, {
        icon: L.divIcon({
          className: 'custom-route-icon',
          html: routingControl.value.__currentEmoji || '📍',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      })
    }
  })

  routingControl.value.addTo(map.value)
}



const drawRoute = (startCoords, endCoords, emoji) => {
  if (!map.value || !startCoords || !endCoords) return

  if (!routingControl.value) initRouting()

  routingControl.value.__currentEmoji = emoji

  routingControl.value.setWaypoints([
    startCoords,
    endCoords
  ])
}



const clearRoute = () => {
  if (routingControl.value) {
    routingControl.value.setWaypoints([])
  }
}


// --- WATCHERS ---
watch(
  () => [userStore.rideState, userStore.incomingRequest, userStore.location],
  () => {
    if (!userStore.loggedIn || !map.value) return
    const myLoc = getLatLon(userStore.location)
    if (!myLoc) return

    if (userStore.role === 'Rider' &&
        userStore.rideState === 'finding_drivers' &&
        userStore.nearbyDrivers?.length > 0) {

      const driverLoc = getLatLon(
        userStore.nearbyDrivers[0]?.location || userStore.nearbyDrivers[0]
      )

      if (driverLoc) drawRoute(driverLoc, myLoc, '🛒')
      return
    }

    if (userStore.role === 'Carriage Driver' &&
        userStore.rideState === 'driver_en_route') {

      const pickup = getLatLon(userStore.incomingRequest?.pickupLocation)
      if (pickup) drawRoute(myLoc, pickup, '🙋')
      return
    }

    // Driver going to destination
    if (userStore.role === 'Carriage Driver' &&
        userStore.rideState === 'ride_in_progress') {

      const dest = getLatLon(userStore.incomingRequest?.destination)
      if (dest) drawRoute(myLoc, dest, '🏁')
      return
    }

    // Idle → clear route
    if (['idle', 'waiting_for_acceptance', 'request_received']
      .includes(userStore.rideState)) {

      clearRoute()
    }
  },
  { deep: true, immediate: true }
)



watch(() => userStore.loggedIn, (loggedIn) => {
  if (!loggedIn) {
    clearRoute()
    clearAllMarkers()
  }
})


watch(() => userStore.location, async (loc) => {
  if (isLoggedIn.value && loc && map.value) {
    const [newLat, newLon] = loc
    updateUserMarker(map.value, newLat, newLon)

    const dist = getDistance(
      newLat, newLon,
      lastFetchCenter.value.lat, lastFetchCenter.value.lon
    )

    if (dist > FETCH_TRIGGER_DISTANCE || !lastFetchCenter.value.lat) {
      if (userStore.role === "Rider") {
        let ok = false
        if (userStore.selectedRideType === "horse")
          ok = await fetchAndDisplayHorses(newLat, newLon, DEFAULT_RANGE)
        else if (userStore.selectedRideType === "carriage")
          ok = await fetchAndDisplayCarriages(newLat, newLon, DEFAULT_RANGE)

        if (ok) lastFetchCenter.value = { lat: newLat, lon: newLon }
      }
    }
  }
}, { deep: true })


watch(() => userStore.selectedRideType, async (newType) => {
  if (isLoggedIn.value && map.value && userStore.role === 'Rider') {
    const [lat, lon] = userStore.location
    clearAllMarkers()
    clearRoute()

    let ok = false
    if (newType === 'horse') ok = await fetchAndDisplayHorses(lat, lon, DEFAULT_RANGE)
    else if (newType === 'carriage') ok = await fetchAndDisplayCarriages(lat, lon, DEFAULT_RANGE)

    if (ok) lastFetchCenter.value = { lat, lon }
  }
})



const onDestinationSelected = (destCoords) => {
  if (userStore.role === 'Rider' && userStore.selectedRideType === 'carriage') {
    userStore.destination = destCoords
    userStore.rideState = 'finding_drivers'
    return false
  }
  return true
}



onMounted(async () => {
  await nextTick()

  let lat = DEFAULT_LAT, lon = DEFAULT_LON
  if (userStore.loggedIn && userStore.location?.length === 2) {
    [lat, lon] = userStore.location
  }

  try {
    const mapInstance = initializeMap(lat, lon, DEFAULT_ZOOM)
    await nextTick()

    setupRoutingAndSearch(mapInstance, userMarker, onDestinationSelected)

    if (userStore.loggedIn)
      updateUserMarker(mapInstance, lat, lon)

  } catch (err) {
    console.error('Map init failed:', err)
  }
})
</script>

<template>
  <div id="map"></div>
</template>

<style>
.custom-route-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  border: 2px solid #75cab9;
  font-size: 20px;
}

.empty-marker {
  width: 0;
  height: 0;
  background: none;
  border: none;
}
</style>

<style scoped>
#map {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: #eef2f7;
}
</style>
