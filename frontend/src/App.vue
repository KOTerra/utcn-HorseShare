<script setup>
import { ref, onMounted } from 'vue'

const message = ref('Loading...')

onMounted(async () => {
  const res = await fetch('http://localhost:8000/api/hello')
  const data = await res.json()
  message.value = data.message
})
</script>

<template>
  <main class="text-center text-2xl p-6">
    {{ message }}
  </main>
</template>
