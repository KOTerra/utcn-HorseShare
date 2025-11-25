<script setup>
import { ref, onMounted } from 'vue'

const API_URL = import.meta.env.VITE_API_URL
const message = ref('Loading... 🐴')

onMounted(async () => {
  try {
    const res = await fetch(`${API_URL}/api/hello`)
    const data = await res.json()
    message.value = data.message
  } catch (error) {
    message.value = 'Welcome to HorseShare! 🐴'
  }
})
</script>

<template>
  <p class="message-text" :title="message">{{ message }}</p>
</template>

<style scoped>
.message-text {
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0;
  
  /* Layout Logic */
  width: 100%;
  
  /* Truncation Logic */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .message-text {
    font-size: 0.8rem;
  }
}
</style>