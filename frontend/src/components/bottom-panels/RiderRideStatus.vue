<script setup>
import { computed } from 'vue'
import { userStore } from '../../stores/userStores.js'

const rideState = computed(() => userStore.rideState)
const isWaiting = computed(() => rideState.value === 'waiting_for_acceptance')
const isEnRoute = computed(() => rideState.value === 'driver_en_route')
const isInProgress = computed(() => rideState.value === 'ride_in_progress')

const driverName = computed(() => userStore.activeRide?.driver_name || 'Carriage Driver')
const price = computed(() => userStore.activeRide?.price || 0)

const destinationDisplay = computed(() => {
    const dest = userStore.activeRide?.destination
    if (!dest) return "Unknown Location"

    if (Array.isArray(dest)) return `${dest[0].toFixed(4)}, ${dest[1].toFixed(4)}`
    if (typeof dest === 'object' && dest.lat) return `${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}`
    return dest
})
</script>

<template>
    <div class="rider-status-panel">

        <div v-if="isWaiting" class="status-content">
            <div class="header">
                <h3>Contacting Driver... 📡</h3>
            </div>

            <div class="info-card pulsing">
                <div class="avatar-circle">
                    {{ driverName.charAt(0).toUpperCase() }}
                </div>
                <div class="details">
                    <p class="main-text">Requesting {{ driverName }}</p>
                    <p class="sub-text">Waiting for response...</p>
                </div>
                <div class="spinner-small"></div>
            </div>

            <button class="cancel-btn">Cancel Request</button>
        </div>

        <div v-else-if="isEnRoute" class="status-content">
            <div class="header">
                <h3>Driver is on the way! 🐎</h3>
                <span class="eta-badge">~ 5 min</span>
            </div>

            <div class="info-card">
                <div class="avatar-circle driver">
                    {{ driverName.charAt(0).toUpperCase() }}
                </div>
                <div class="details">
                    <p class="main-text">{{ driverName }}</p>
                    <p class="sub-text">Approaching your pickup location...</p>
                </div>
            </div>

            <div class="status-bar-container">
                <div class="progress-track">
                    <div class="progress-fill anim-arriving"></div>
                </div>
            </div>
        </div>

        <div v-else-if="isInProgress" class="status-content">
            <div class="header">
                <h3>Heading to Destination 🛒</h3>
                <span class="price-badge">{{ price }} RON</span>
            </div>

            <div class="info-card">
                <div class="icon-box">📍</div>
                <div class="details">
                    <p class="main-text">Drop-off Location</p>
                    <p class="sub-text">{{ destinationDisplay }}</p>
                </div>
            </div>

            <div class="status-bar-container">
                <div class="progress-track">
                    <div class="progress-fill anim-journey"></div>
                </div>
                <span class="status-msg">On the way to destination...</span>
            </div>
        </div>

    </div>
</template>

<style scoped>
.rider-status-panel {
    width: 100%;
    color: white;
    animation: slideUp 0.3s ease-out;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #75cab9;
}

.eta-badge,
.price-badge {
    background: #ffd700;
    color: #222;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.9rem;
}

.info-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
}

.pulsing {
    border: 1px solid rgba(117, 202, 185, 0.3);
    animation: pulseBorder 2s infinite;
}

.spinner-small {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #75cab9;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: auto;
}

.avatar-circle {
    width: 44px;
    height: 44px;
    background: #444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #fff;
    font-size: 1.2rem;
}

.avatar-circle.driver {
    background: #75cab9;
    color: #222;
}

.icon-box {
    font-size: 1.5rem;
    width: 44px;
    text-align: center;
}

.details .main-text {
    margin: 0;
    font-weight: 600;
    font-size: 1rem;
}

.details .sub-text {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
}

.cancel-btn {
    width: 100%;
    padding: 10px;
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
}

.cancel-btn:hover {
    background: rgba(255, 107, 107, 0.25);
}

/* --- BAR STYLING --- */

.status-bar-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    width: 100%;
}

.progress-track {
    width: 100%;
    height: 14px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.progress-fill {
    height: 100%;
    width: 100%;
    background-size: 20px 20px;
    animation: move-stripes 1s linear infinite;
}

/* 1. Arriving: Teal Stripes */
.anim-arriving {
    background-color: #75cab9;
    background-image: repeating-linear-gradient(45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.4) 10px,
            rgba(255, 255, 255, 0.4) 20px);
    animation-duration: 0.8s;
}

/* 2. Journey: Teal Stripes (Same as Arriving) */
.anim-journey {
    background-color: #75cab9;
    background-image: repeating-linear-gradient(45deg,
            transparent,
            transparent 10px,
            rgba(255, 255, 255, 0.4) 10px,
            rgba(255, 255, 255, 0.4) 20px);
    animation-duration: 1.2s;
}

.status-msg {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
    text-align: center;
}

@keyframes move-stripes {
    0% {
        background-position: 0 0;
    }

    100% {
        background-position: 20px 0;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes pulseBorder {
    0% {
        box-shadow: 0 0 0 0 rgba(117, 202, 185, 0.4);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(117, 202, 185, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(117, 202, 185, 0);
    }
}

@keyframes slideUp {
    from {
        transform: translateY(10px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>