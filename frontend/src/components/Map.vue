<script setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet-routing-machine'
import { userStore } from "../stores/userStores.js"
import { useMap } from '../composables/useMap.js'
import { useMarkers } from '../composables/useMarkers.js'
import { useApi } from '../composables/useApi.js'
import { DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM, DEFAULT_RANGE, FETCH_TRIGGER_DISTANCE } from '../composables/constants.js'

const isLoggedIn = computed(() => userStore.loggedIn)
const lastFetchCenter = ref({ lat: null, lon: null });

const { userMarker, horseMarkers, carriageMarkers, addHorseMarkersToMap, addCarriagesMarkersToMap, updateUserMarker, clearAllMarkers } = useMarkers(userStore)
const { map, initializeMap, setupRoutingAndSearch, clearRoute } = useMap(null, null, [horseMarkers, carriageMarkers])
const { fetchAndDisplayHorses, fetchAndDisplayCarriages, getDistance } = useApi(addHorseMarkersToMap, addCarriagesMarkersToMap)

const onDestinationSelected = (destCoords) => {
  if (userStore.role === 'Rider' && userStore.selectedRideType === 'carriage') {
    userStore.destination = destCoords
    userStore.rideState = 'finding_drivers'
    return false
  }
  return true // default routing
}

// Watchers
watch(() => userStore.nearbyDrivers, (drivers) => {
  // Only draw route if we are in the correct state and have drivers
  if (userStore.rideState === 'finding_drivers' && drivers.length > 0 && map.value) {
    const driver = drivers[0]

    let dLat, dLon;
    if (Array.isArray(driver.location)) {
      [dLat, dLon] = driver.location
    } else {
      dLat = driver.latitude || driver.lat
      dLon = driver.longitude || driver.lon
    }

    if (dLat && dLon) {
      clearRoute()

      L.Routing.control({
        waypoints: [
          L.latLng(dLat, dLon),
          L.latLng(userStore.location[0], userStore.location[1]) // User
        ],
        lineOptions: { styles: [{ color: '#75cab9', opacity: 0.8, weight: 6 }] },
        createMarker: (i, wp) => i === 0 ? L.marker(wp.latLng, { icon: L.divIcon({ className: 'driver-start-icon', html: '🛒', iconSize: [24, 24] }) }) : null,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false
      }).addTo(map.value)
    }
  }
})

watch(() => userStore.rideState, (newState) => {
  if (newState === 'idle') clearRoute()
})

watch(() => userStore.location, async (newLocation) => {
  if (isLoggedIn.value && newLocation && map.value) {
    const [newLat, newLon] = newLocation;
    updateUserMarker(map.value, newLat, newLon);

    const distance = getDistance(newLat, newLon, lastFetchCenter.value.lat, lastFetchCenter.value.lon);

    if (distance > FETCH_TRIGGER_DISTANCE || !lastFetchCenter.value.lat) {
      if (userStore.role == "Rider") {
        let success = false;
        if (userStore.selectedRideType == "horse") {
          success = await fetchAndDisplayHorses(newLat, newLon, DEFAULT_RANGE)
        } else if (userStore.selectedRideType == "carriage") {
          success = await fetchAndDisplayCarriages(newLat, newLon, DEFAULT_RANGE);
        }

        if (success) {
          lastFetchCenter.value = { lat: newLat, lon: newLon };
        }
      }
    }
  }
}, { deep: true })

watch(() => userStore.selectedRideType, async (newRideType) => {
  if (isLoggedIn.value && map.value && userStore.role === 'Rider') {
    const [currentLat, currentLon] = userStore.location;

    clearAllMarkers();
    userStore.rideState = 'idle';
    clearRoute();

    let success = false;
    if (newRideType === "horse") {
      success = await fetchAndDisplayHorses(currentLat, currentLon, DEFAULT_RANGE);
    } else if (newRideType === "carriage") {
      success = await fetchAndDisplayCarriages(currentLat, currentLon, DEFAULT_RANGE);
    }

    if (success) lastFetchCenter.value = { lat: currentLat, lon: currentLon };
    map.value.setView([currentLat, currentLon], map.value.getZoom());
  }
});

onMounted(async () => {
  await nextTick();
  let initialLat = DEFAULT_LAT, initialLon = DEFAULT_LON;
  if (userStore.loggedIn && userStore.location) [initialLat, initialLon] = userStore.location;

  try {
    const mapInstance = initializeMap(initialLat, initialLon, DEFAULT_ZOOM);
    await nextTick();

    setupRoutingAndSearch(mapInstance, userMarker, onDestinationSelected);

    if (userStore.loggedIn && userStore.location) {
      updateUserMarker(mapInstance, initialLat, initialLon);
    }
  } catch (error) {
    console.error('Map initialization failed:', error);
  }
})
</script>

<template>
  <div id="map"></div>
</template>

<style>
.driver-start-icon {
  font-size: 20px;
  text-align: center;
  background: white;
  border-radius: 50%;
  line-height: 24px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}
</style>

<style scoped>
#map {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: #eef2f7;
}
</style>