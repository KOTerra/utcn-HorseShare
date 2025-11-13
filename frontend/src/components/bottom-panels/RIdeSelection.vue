<script setup>
import { ref, defineEmits } from 'vue'

// Define events to tell the parent or map what was clicked
const emit = defineEmits(['ride-selected'])

const selectedRideType = ref('horse')

const selectRide = (type) => {
    selectedRideType.value = type
    emit('ride-selected', type)
}
</script>

<template>
    <div class="ride-selector">
        <button class="ride-btn" :class="{ active: selectedRideType === 'horse' }" @click="selectRide('horse')">
            Horse 🐎
        </button>

        <button class="ride-btn" :class="{ active: selectedRideType === 'carriage' }" @click="selectRide('carriage')">
            Carriage 🛒
        </button>
    </div>
</template>

<style scoped>
.ride-selector {
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px;
    border-radius: 999px;
}

.ride-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}

.ride-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
}

.ride-btn.active {
    background: rgb(117, 202, 185);
    color: #1a1a1a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 640px) {
    .ride-btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.75rem;
    }
}
</style>