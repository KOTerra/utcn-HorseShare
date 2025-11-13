<template>
  <div class="w-full h-screen overflow-hidden relative">
    <MapView />

    <!-- Overlay components - positioned outside map context -->
    <div class="fixed top-6 right-6 z-50 pointer-events-auto">
      <Auth />
    </div>

    <!-- HelloMessage: the component is fixed itself -->
    <HelloMessage />
  </div>
</template>

<script setup>
import MapView from './components/Map.vue'
import Auth from './components/Auth.vue'
import HelloMessage from './components/BottomPannel.vue'
</script>
