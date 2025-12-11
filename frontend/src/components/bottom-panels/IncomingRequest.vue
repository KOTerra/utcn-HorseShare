<script setup>
import { userStore } from '../../stores/userStores.js'
import { useRide } from '../../composables/useRide.js'

const { acceptRide } = useRide()

const handleAccept = () => {
  acceptRide()
}

const handleDecline = () => {
    alert("Decline logic not implemented on server yet.")
}
</script>

<template>
  <div class="request-panel">
    <div class="request-header">
      <h3>New Ride Request 🐴</h3>
      <span class="price-badge">{{ userStore.incomingRequest?.price }} RON</span>
    </div>

    <div class="passenger-info">
      <div class="avatar-circle">
        {{ userStore.incomingRequest?.riderName?.charAt(0).toUpperCase() || 'U' }}
      </div>
      <div class="details">
        <p class="name">{{ userStore.incomingRequest?.riderName }}</p>
        <p class="sub-text">Pickup: Current Location</p>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn decline" @click="handleDecline">Decline</button>
      <button class="btn accept" @click="handleAccept">Accept Ride</button>
    </div>
  </div>
</template>

<style scoped>
.request-panel {
  width: 100%;
  color: white;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.request-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.price-badge {
  background: #ffd700;
  color: #000;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.passenger-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  background: #75cab9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #222;
}

.details .name {
  margin: 0;
  font-weight: 600;
}

.details .sub-text {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn.accept {
  background: #75cab9;
  color: #1a1a1a;
}

.btn.decline {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
</style>