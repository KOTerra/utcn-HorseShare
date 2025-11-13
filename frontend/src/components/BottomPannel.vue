<script setup>
import { ref, onMounted } from 'vue'
import logo from '../assets/logo.png'
const API_URL = import.meta.env.VITE_API_URL

const message = ref('HorseShare 🐴')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch(`${API_URL}/api/hello`)
    const data = await res.json()
    message.value = data.message
  } catch (error) {
    console.error('Failed to fetch hello message:', error)
    message.value = 'Welcome to HorseShare! 🐴'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="message-container">
    <img :src="logo" alt="App Logo" class="logo" />
    <p class="message-text">{{ message }}</p>
  </div>
</template>

<style scoped>
.message-container {
  box-sizing: border-box;
  display: flex;
  align-items: center;

  gap: 0.5rem;
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 24px;
  z-index: 60;

  width: auto;
  max-width: none;


  padding: 0.675rem 0.75rem;
  border-radius: 0.5625rem;

  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);

  justify-content: flex-start;
  margin: 0;
  min-height: 42px;
}

.logo {
  width: 84px;
  height: auto;
  flex: 0 0 auto;
  border-radius: 0.1rem;
}

.message-text {
  color: #fff;
  font-weight: 600;
  font-size: 0.79rem;
  margin: 0;
  flex: 1 1 auto;
  text-align: center;
}

@media (max-width: 640px) {
  .logo {
    width: 54px;
  }

  .message-text {
    font-size: 0.7125rem;
  }

}
</style>
