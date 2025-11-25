import { ref } from 'vue'
const DEFAULT_LAT = 46.770439 // Defaulting to Cluj-Napoca (UTCN)
const DEFAULT_LON = 23.591423

export function useUserLocation() {
  const locationError = ref(null)

  const getUserLocationAsync = () => {
    locationError.value = null // Clear previous errors


    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            console.log('Location found:', latitude, longitude)
            resolve([latitude, longitude])
          },
          (error) => {
            console.warn('Geolocation error:', error.message)
            locationError.value = 'Geolocation failed. Using default location.'
            resolve([DEFAULT_LAT, DEFAULT_LON])
          },
          { timeout: 5000 }
        )
      } else {
        locationError.value = 'Geolocation not supported by your browser!'
        resolve([DEFAULT_LAT, DEFAULT_LON])
      }
    })
  }

  // 3. Return the state and the function so a component can use them
  return {
    locationError,
    getUserLocationAsync
  }
}