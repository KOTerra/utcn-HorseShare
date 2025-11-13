<script setup>
</script>

<template>
    <div class="waiting-container">
        <div class="spinner"></div>
        <p class="status-text">Waiting for orders...🥕</p>
    </div>
</template>

<style scoped>
.waiting-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    /* 12px */
    width: 100%;
}

.spinner {
    width: 1.25rem;
    /* 20px */
    height: 1.25rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    /* Use the app's accent color from your other buttons */
    border-top-color: rgb(117, 202, 185);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
}

.status-text {
    color: #fff;
    font-weight: 600;
    font-size: 0.9rem;
    margin: 0;

    /* Text truncation is good practice */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 640px) {
    .status-text {
        font-size: 0.8rem;
    }

    .spinner {
        width: 1rem;
        /* 16px */
        height: 1rem;
        border-width: 2px;
    }
}
</style>