import { reactive } from 'vue'

export const userStore = reactive({
  uid: null,
  email: null,
  role: null, // Rider or Carriage Driver
  location: [46.77, 23.59], // default Cluj-Napoca
  loggedIn: false,
  locationError: null,
  selectedRideType: 'horse', // Default to horse
  
  rideState: 'idle', 
  destination: null, // { lat, lng }
  nearbyDrivers: []
})

let watchId = null
let lastDbUpdateTime = 0     
let lastDbLocation = null   

const API_URL = import.meta.env.VITE_API_URL
const UPDATE_INTERVAL_MS = 30000      //30 sec, 30 meters   
const UPDATE_DISTANCE_METERS = 30


export function startWatchingLocation() {
  if ('geolocation' in navigator) {
    userStore.locationError = null

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const now = Date.now()

        userStore.location = [latitude, longitude]

        const timeElapsedMs = now - lastDbUpdateTime
        let distanceMovedM = 0
        if (lastDbLocation) {
          distanceMovedM = calculateDistance(
            lastDbLocation[0], lastDbLocation[1],
            latitude, longitude
          )
        }

        const shouldUpdateDb = !lastDbLocation || 
                                timeElapsedMs > UPDATE_INTERVAL_MS || 
                                distanceMovedM > UPDATE_DISTANCE_METERS

        if (shouldUpdateDb && userStore.uid) {
          try {
            const isDriver = userStore.role === 'Carriage Driver'
            const endpoint = isDriver ? '/api/drivers' : '/api/users'

            const payload = {
                uid: userStore.uid,
                email: userStore.email,
                location: [latitude, longitude],
                loggedIn: true,
                lastActiveAt: new Date().toISOString()
            }
            
            if (!isDriver) {
                payload.role = userStore.role || 'Rider'
            }

            console.log(`Syncing location to ${endpoint}:`, payload)

            const response = await fetch(`${API_URL}${endpoint}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
            
            if (!response.ok) {
                const err = await response.json()
                console.error("Backend Validation Error:", err)
                return
            }
            
            lastDbUpdateTime = now
            lastDbLocation = [latitude, longitude]

          } catch (error) {
            console.error('Failed to update database:', error)
          }
        }
      },
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
    
    lastDbUpdateTime = 0
    lastDbLocation = null
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3 
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return earthRadius * c 
}