<script setup>
import logo from '../assets/logo.png'
import { userStore } from '../stores/userStores.js'

// Import the sub-components
import WelcomeMessage from './bottom-panels/WelcomeMessage.vue'
import RideSelector from './bottom-panels/RideSelection.vue'
import WaitingForOrders from './bottom-panels/WaitingForOrders.vue'

const handleRideSelection = (type) => {
  console.log('User selected ride type:', type)
  // You can add logic here to update the map markers or calculate prices
}
</script>

<template>
  <div class="bottom-panel">

    <img :src="logo" alt="App Logo" class="logo" />

    <div class="content-area">

      <WelcomeMessage v-if="!userStore.loggedIn" />

      <RideSelector v-else-if="userStore.role === 'Rider'" @ride-selected="handleRideSelection" />

      <WaitingForOrders v-else-if="userStore.role === 'Carriage Driver'" />
    </div>

  </div>
</template>

<style scoped>
.bottom-panel {
  /* Fixed Positioning */
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 24px;
  z-index: 60;

  /* Glassmorphism */
  box-sizing: border-box;
  width: auto;
  min-height: 42px;
  padding: 0.675rem 0.75rem;
  border-radius: 0.5625rem;

  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);

  /* Flex Layout */
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