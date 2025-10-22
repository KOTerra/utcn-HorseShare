import { reactive } from 'vue'

// The reactive state object
export const userStore = reactive({
    uid: null,
    email: null,
    location: [46.77, 23.59], // default
    loggedIn: false,
    locationError: null
})

//  private, module-level variable to hold the watcher ID
let watchId = null

export function startWatchingLocation() {
    if ('geolocation' in navigator) {
        userStore.locationError = null // Clear old errors

        watchId = navigator.geolocation.watchPosition(
            //(triggers on every move)
            (position) => {
                const { latitude, longitude } = position.coords

                userStore.location = [latitude, longitude]

                console.log('Store location updated:', userStore.location)
            },
            // Error callback
            (error) => {
                console.warn('Error watching location:', error.message)
                userStore.locationError = 'Unable to retrieve live location.'
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        )
    } else {
        userStore.locationError = 'Geolocation is not supported by your browser.'
    }
}

export function stopWatchingLocation() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
        console.log('Stopped watching location.')
    }
}