<script setup>
import { ref, onMounted } from 'vue'
import logo from '../assets/logo.png'
const API_URL = import.meta.env.VITE_API_URL // Read from .env

const message = ref('Loading...')

onMounted(async () => {
  const res = await fetch(`${API_URL}/api/hello`)
  const data = await res.json()
  message.value = data.message
})
</script>

<template>
  <main class="text-center text-2xl p-6">
    <p>{{ message }}</p>
    <img
      :src="logo"
      alt="App Logo"
      class="mx-auto mt-4 w-48 h-auto rounded-2xl shadow-lg"
    />
  </main>
</template>
