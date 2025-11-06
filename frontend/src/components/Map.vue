<script setup>
import { onMounted, ref, computed, watch } from 'vue'
// Changed: Use relative path for userStore
import { userStore } from "../stores/userStores.js" 
// Changed: Use relative paths for composables
import { useMap } from '../composables/useMap.js'
import { useMarkers } from '../composables/useMarkers.js'
import { useApi } from '../composables/useApi.js'
// Changed: Use relative path for constants
import {
  DEFAULT_LAT,
  DEFAULT_LON,
  DEFAULT_ZOOM,
  DEFAULT_RANGE,
  FETCH_TRIGGER_DISTANCE
} from '../composables/constants.js'

// --- Store & State ---
const isLoggedIn = computed(() => userStore.loggedIn)
const userLocation = computed(() => userStore.location)

const lastFetchCenter = ref({ lat: null, lon: null });
// ---------------------

// --- Composables ---
const {
  userMarker,
  horseMarkers,
  carriageMarkers,
  addHorseMarkersToMap,
  addCarriagesMarkersToMap,
  updateUserMarker
} = useMarkers(userStore)

const {
  map,
  initializeMap,
  setupRoutingAndSearch
} = useMap(null, null, [horseMarkers, carriageMarkers])

const {
  fetchAndDisplayHorses,
  fetchAndDisplayCarriages,
  getDistance
} = useApi(addHorseMarkersToMap, addCarriagesMarkersToMap)
// ---------------------


// --- Location Update & Data Fetching Logic ---
watch(
  () => userStore.location,
  async (newLocation) => {
    if (isLoggedIn.value && newLocation && map.value) {
      const [newLat, newLon] = newLocation;

      updateUserMarker(map.value, newLat, newLon);

      // check if a new data fetch is needed (user moved far enough)
      const distance = getDistance(
        newLat, newLon,
        lastFetchCenter.value.lat, lastFetchCenter.value.lon
      );

      if (distance > FETCH_TRIGGER_DISTANCE) {
        let success = await fetchAndDisplayHorses(newLat, newLon, DEFAULT_RANGE) &&
                      await fetchAndDisplayCarriages(newLat, newLon, DEFAULT_RANGE);

        if (success) lastFetchCenter.value = { lat: newLat, lon: newLon };
        map.value.setView([newLat, newLon], map.value.getZoom());
      }
    }
  },
  { deep: true }
)
// ---------------------------------------------


// --- Initialization ---
onMounted(async () => {
  let initialLat = DEFAULT_LAT;
  let initialLon = DEFAULT_LON;

  if (userStore.loggedIn && userStore.location) {
    [initialLat, initialLon] = userStore.location;
  }

  const mapInstance = initializeMap(initialLat, initialLon, DEFAULT_ZOOM);

  setupRoutingAndSearch(mapInstance, userMarker);

  const success = await fetchAndDisplayHorses(initialLat, initialLon, DEFAULT_RANGE);
  if (success) lastFetchCenter.value = { lat: initialLat, lon: initialLon };

  if (userStore.loggedIn && userStore.location) {
    updateUserMarker(mapInstance, initialLat, initialLon);
  }
})
// ----------------------
</script>

<template>
  <div id="map" class="w-full h-[500px] rounded-2xl shadow-lg"></div>
</template>

<style>
#map {
  height: 500px;
}
</style>