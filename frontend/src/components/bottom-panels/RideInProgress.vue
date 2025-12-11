<script setup>
import { computed } from 'vue'
import { userStore } from '../../stores/userStores.js'
import { useRide } from '../../composables/useRide.js'

const { completeRide } = useRide()

const destination = computed(() => {
    const dest = userStore.incomingRequest?.destination
    if (!dest) return "Destination not set"
    // Format coords for display
    return `${dest[0].toFixed(4)}, ${dest[1].toFixed(4)}`
})

const price = computed(() => userStore.incomingRequest?.price || 0)

const handleComplete = () => {
    completeRide()
}
</script>

<template>
    <div class="progress-panel">
        <div class="header">
            <h3>Heading to Destination </h3>
            <span class="fare">Fare: {{ price }} RON</span>
        </div>

        <div class="route-info">
            <div class="icon-box">📍</div>
            <div class="info-text">
                <span class="label">Drop-off Location:</span>
                <span class="value">{{ destination }}</span>
            </div>
        </div>

        <button class="complete-btn" @click="handleComplete">
            Complete Ride 
        </button>
    </div>
</template>

<style scoped>
.progress-panel {
    width: 100%;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #ffd700;
}

.fare {
    font-weight: bold;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 8px;
}

.route-info {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 8px;
}

.icon-box {
    font-size: 1.5rem;
}

.info-text {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 0.8rem;
    opacity: 0.7;
}

.value {
    font-weight: 600;
    font-size: 1rem;
}

.complete-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 8px;
    background: #ffd700;
    color: #1a1a1a;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.1s;
}

.complete-btn:active {
    transform: scale(0.98);
}
</style>