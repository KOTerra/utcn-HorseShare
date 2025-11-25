<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  coords: { type: Object, required: true }
})

const emit = defineEmits(['drivers-loaded', 'request-ride', 'back'])
const API_URL = import.meta.env.VITE_API_URL

const isLoading = ref(true)
const drivers = ref([])
const error = ref(null)

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; //  meters
}

const fetchDrivers = async () => {
  try {
    const range = 5000
    const { lat, lng } = props.coords

    const response = await fetch(`${API_URL}/api/drivers/${lat}/${lng}/${range}`)

    if (!response.ok) throw new Error(`Server returned ${response.status}`)

    const rawData = await response.json()

    // calculate distance for each driver 
    const processedData = rawData.map(driver => {
      let dist = 0;

      // handle coordinate format [lat, lon]
      if (driver.location && Array.isArray(driver.location) && driver.location.length === 2) {
        dist = calculateDistance(
          props.coords.lat, props.coords.lng,
          driver.location[0], driver.location[1]
        );
      }
      else if (driver.lat && driver.lon) {
        dist = calculateDistance(
          props.coords.lat, props.coords.lng,
          driver.lat, driver.lon
        );
      }

      return { ...driver, distance: dist };
    });

    setTimeout(() => {
      processedData.sort((a, b) => a.distance - b.distance);

      drivers.value = processedData
      isLoading.value = false
      emit('drivers-loaded', processedData)
    }, 1500)

  } catch (err) {
    console.error("Fetch error:", err)
    error.value = "Could not find drivers."
    isLoading.value = false
  }
}

const handleRequest = (driver) => {
  emit('request-ride', driver)
}

const goBack = () => {
  emit('back')
}

onMounted(() => { fetchDrivers() })
</script>

<template>
  <div class="drivers-panel">

    <div class="panel-header">
      <button class="back-btn" @click="goBack" title="Back to selection">←</button>
      <span v-if="isLoading">Searching...</span>
      <span v-else-if="error">Error</span>
      <span v-else>Found {{ drivers.length }} Drivers</span>
    </div>

    <div v-if="isLoading" class="status-message">
      <div class="spinner"></div>
      <span>Connecting to nearest drivers...</span>
    </div>

    <div v-else-if="error" class="error-message">⚠️ {{ error }}</div>

    <div v-else class="drivers-list">
      <div v-for="(driver, index) in drivers" :key="index" class="driver-card">
        <div class="driver-icon">🛒</div>
        <div class="driver-info">
          <span class="driver-name">{{ driver.name || 'Carriage Driver' }}</span>
          <span class="driver-dist">~{{ Math.round(driver.distance) }}m away</span>
        </div>
        <button class="request-btn" @click="handleRequest(driver)">Request</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drivers-panel {
  width: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
}

.driver-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 12px;
  border-radius: 8px;
  gap: 12px;
}

.driver-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.driver-name {
  font-size: 0.95rem;
  font-weight: 600;
}

.driver-dist {
  font-size: 0.8rem;
  opacity: 0.8;
}

.request-btn {
  background: rgb(117, 202, 185);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  color: #1a1a1a;
  transition: transform 0.1s;
}

.request-btn:active {
  transform: scale(0.95);
}

.error-message {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 0.9rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>