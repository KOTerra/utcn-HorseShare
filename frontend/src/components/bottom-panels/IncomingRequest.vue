<script setup>
import { defineEmits } from 'vue'
import { userStore } from '../../stores/userStores.js'

const emit = defineEmits(['accept', 'decline'])

const acceptRide = () => {
    userStore.rideState = 'in_ride'
}

const declineRide = () => {
    userStore.rideState = 'waiting_orders'
}
</script>

<template>
    <div class="incoming-req-container">
        <div class="icon-pulse">🛒</div>
        <div class="req-info">
            <span class="req-title">New Request!</span>
            <span class="req-sub">Pickup: 2 mins away</span>
        </div>
        <div class="actions">
            <button class="btn-decline" @click="declineRide">Decline</button>
            <button class="btn-accept" @click="acceptRide">Accept</button>
        </div>
    </div>
</template>

<style scoped>
.incoming-req-container {
    display: flex;
    align-items: center;
    width: 100%;
    color: white;
    gap: 12px;
}

.icon-pulse {
    font-size: 1.5rem;
    animation: pulse 1.5s infinite;
}

.req-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.req-title {
    font-weight: bold;
    font-size: 1rem;
    color: rgb(117, 202, 185);
}

.req-sub {
    font-size: 0.85rem;
    opacity: 0.8;
}

.actions {
    display: flex;
    gap: 8px;
}

.btn-accept,
.btn-decline {
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
}

.btn-accept {
    background: rgb(117, 202, 185);
    color: #1a1a1a;
}

.btn-decline {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.2);
    }

    100% {
        transform: scale(1);
    }
}
</style>