<script setup>
import logo from '../assets/logo.png'
import { userStore } from '../stores/userStores.js'
import { computed, onMounted } from 'vue'
import { useRide } from '../composables/useRide.js'

import WelcomeMessage from './bottom-panels/WelcomeMessage.vue'
import RideSelection from './bottom-panels/RIdeSelection.vue'
import WaitingForOrders from './bottom-panels/WaitingForOrders.vue'
import FindingDrivers from './bottom-panels/FindingDrivers.vue'
import IncomingRequest from './bottom-panels/IncomingRequest.vue'
import DriverEnRoute from './bottom-panels/DriverEnRoute.vue'
import RideInProgress from './bottom-panels/RideInProgress.vue'
import RiderRideStatus from './bottom-panels/RiderRideStatus.vue'

const { requestRide, resumeRideListener } = useRide()

// If user refreshes page it should still resume this
onMounted(() => {
  resumeRideListener()
})

const currentPanel = computed(() => {
  if (!userStore.loggedIn) return 'welcome'

  if (userStore.role === 'Rider') {
    if (userStore.rideState === 'finding_drivers') return 'finding_drivers'

    // CHANGED: Added 'waiting_for_acceptance' to this list
    if (['waiting_for_acceptance', 'driver_en_route', 'ride_in_progress'].includes(userStore.rideState)) {
      return 'rider_active_ride' // Shows RiderRideStatus.vue
    }

    if (userStore.rideState === 'waiting_orders') return 'waiting_orders'

    return 'ride_selector'
  }

  if (userStore.role === 'Carriage Driver') {
    if (userStore.rideState === 'request_received') return 'incoming_request'
    if (userStore.rideState === 'driver_en_route') return 'driver_en_route'
    if (userStore.rideState === 'ride_in_progress') return 'ride_in_progress'

    return 'waiting_orders'
  }

  return 'welcome'
})

const handleRideSelection = (type) => {
  userStore.selectedRideType = type
}

const handleDriversFound = (drivers) => {
  userStore.nearbyDrivers = drivers
}

const handleRequestRide = (driver) => {
  requestRide(driver)
}

const handleBack = () => {
  userStore.rideState = 'idle'
  userStore.nearbyDrivers = []
}
</script>

<template>
  <div class="bottom-panel">

    <img :src="logo" alt="App Logo" class="logo" />

    <div class="content-area">

      <WelcomeMessage v-if="currentPanel === 'welcome'" />

      <RideSelection v-else-if="currentPanel === 'ride_selector'" @ride-selected="handleRideSelection" />

      <FindingDrivers v-else-if="currentPanel === 'finding_drivers'"
        :coords="{ lat: userStore.location[0], lng: userStore.location[1] }" @drivers-loaded="handleDriversFound"
        @request-ride="handleRequestRide" @back="handleBack" />

      <WaitingForOrders v-else-if="currentPanel === 'waiting_orders'" />

      <RiderRideStatus v-else-if="currentPanel === 'rider_active_ride'" />

      <IncomingRequest v-else-if="currentPanel === 'incoming_request'" />

      <DriverEnRoute v-else-if="currentPanel === 'driver_en_route'" />

      <RideInProgress v-else-if="currentPanel === 'ride_in_progress'" />

    </div>

  </div>
</template>

<style scoped>
.bottom-panel {
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 24px;
  z-index: 60;
  box-sizing: border-box;
  width: auto;
  min-height: 42px;
  padding: 0.675rem 0.75rem;
  border-radius: 0.5625rem;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
}

.logo {
  width: 84px;
  height: auto;
  flex: 0 0 auto;
  border-radius: 0.1rem;
  display: block;
}

.content-area {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

@media (max-width: 640px) {
  .bottom-panel {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }

  .logo {
    width: 54px;
  }
}
</style>