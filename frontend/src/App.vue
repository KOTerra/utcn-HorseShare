<script setup>
import HelloMessage from './components/HelloMessage.vue'
import MapView from './components/Map.vue'
import Auth from './components/Auth.vue'
</script>

<template>
  <main class="text-center text-2xl p-6 space-y-6">
    <MapView />
    <Auth />
    <HelloMessage />

  </main>
</template>
