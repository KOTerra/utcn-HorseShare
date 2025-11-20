<script setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { userStore } from "../stores/userStores.js"
import { useMap } from '../composables/useMap.js'
import { useMarkers } from '../composables/useMarkers.js'
import { useApi } from '../composables/useApi.js'
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
        if (userStore.role == "Rider") {
          let success = await fetchAndDisplayHorses(newLat, newLon, DEFAULT_RANGE)
            && await fetchAndDisplayCarriages(newLat, newLon, DEFAULT_RANGE);

          if (success) lastFetchCenter.value = { lat: newLat, lon: newLon };
          map.value.setView([newLat, newLon], map.value.getZoom());
        }
      }
    }
  },
  { deep: true }
)
// ---------------------------------------------


// --- Initialization ---
onMounted(async () => {
  // Wait for DOM to be fully rendered
  await nextTick();

  let initialLat = DEFAULT_LAT;
  let initialLon = DEFAULT_LON;

  if (userStore.loggedIn && userStore.location) {
    [initialLat, initialLon] = userStore.location;
  }

  try {
    const mapInstance = initializeMap(initialLat, initialLon, DEFAULT_ZOOM);

    // Give Leaflet time to render
    await nextTick();

    setupRoutingAndSearch(mapInstance, userMarker);
    if (userStore.loggedIn && userStore.location) {
      updateUserMarker(mapInstance, initialLat, initialLon);
    }
  } catch (error) {
    console.error('Map initialization failed:', error);
  }
})
// ----------------------
</script>

<template>
  <div id="map"></div>
</template>

<style scoped>
/* Keep map layout local so it always fills the viewport and won't be accidentally
   overridden by other global styles. This places the map behind overlays. */
#map {
  position: fixed;
  inset: 0;
  /* top:0; right:0; bottom:0; left:0 */
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: #eef2f7;
  /* light background while tiles load */
}
</style>
