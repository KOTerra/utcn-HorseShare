<script setup>
import MapView from './components/Map.vue'
import Auth from './components/Auth.vue'
import BottomPanel from './components/BottomPanel.vue'
</script>

<template>
  <div class="w-full h-screen overflow-hidden relative">
    <MapView />

    <div class="fixed top-6 right-6 z-50 pointer-events-auto">
      <Auth />
    </div>

    <BottomPanel />
  </div>
</template>