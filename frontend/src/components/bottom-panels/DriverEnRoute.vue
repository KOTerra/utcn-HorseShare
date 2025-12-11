<script setup>
import { userStore } from '../../stores/userStores.js'
import { useRide } from '../../composables/useRide.js'

const { confirmPickup } = useRide()

const handlePickup = () => {
  confirmPickup()
}

const riderLocation = userStore.incomingRequest?.pickupLocation
</script>

<template>
  <div class="en-route-panel">
    <div class="header">
      <h3>Navigate to Passenger 🗺️</h3>
    </div>

    <div class="passenger-info">
      <div class="avatar-circle">
        {{ userStore.incomingRequest?.riderName?.charAt(0).toUpperCase() || 'P' }}
      </div>
      <div class="details">
        <p class="name">{{ userStore.incomingRequest?.riderName }}</p>
        <p class="sub-text">Waiting at pickup point...</p>
      </div>
    </div>

    <div class="action-area">
      <button class="btn pickup-btn" @click="handlePickup">
        Passenger Picked Up 
      </button>
    </div>
  </div>
</template>

<style scoped>
.en-route-panel {
  width: 100%;
  color: white;
}

.header {
  margin-bottom: 12px;
}

.header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #75cab9;
}

.passenger-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.avatar-circle {
  width: 44px;
  height: 44px;
  background: #ffd700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #222;
  font-size: 1.2rem;
}

.details .name {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
}

.details .sub-text {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.action-area {
  display: flex;
}

.pickup-btn {
  width: 100%;
  padding: 12px;
  background: #75cab9;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.pickup-btn:hover {
  background: #64b3a3;
}
</style>