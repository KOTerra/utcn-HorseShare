<script setup>
import { ref, defineEmits } from 'vue'

const emit = defineEmits(['ride-selected'])
const selectedRideType = ref('horse')

const selectRide = (type) => {
  selectedRideType.value = type
  emit('ride-selected', type)
}
</script>

<template>
  <div class="ride-selector">
    <button class="ride-btn"
      :class="{ active: selectedRideType === 'horse' }"
      @click="selectRide('horse')">
      Horse 🐎
    </button>

    <button class="ride-btn"
      :class="{ active: selectedRideType === 'carriage' }"
      @click="selectRide('carriage')">
      Carriage 🛒
    </button>
  </div>
</template>

<style scoped>
.ride-selector {
  display: flex; gap: 8px; background: rgba(255,255,255,0.1);
  padding: 6px; border-radius: 999px;
}
.ride-btn {
  padding: 6px 14px; border-radius: 999px;
  background: transparent; color: white; border: none; cursor: pointer;
}
.ride-btn.active {
  background: rgb(117,202,185);
  color: #222;
}
</style>
