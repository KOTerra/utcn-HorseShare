<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="bg-white shadow-xl rounded-2xl p-8 w-80 text-center">
      <h1 class="text-2xl font-bold mb-6">Login</h1>

      <button
        @click="loginWithGoogle"
        class="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg w-full transition"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          class="w-5 h-5"
        />
        Login with Google
      </button>

      <p v-if="userEmail" class="mt-6 text-gray-600 text-sm">
        Logged in as: <span class="font-semibold">{{ userEmail }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../firebase"
import { userStore } from "../stores/userStores.js"

const DEFAULT_LAT = 46.77 // Cluj-Napoca
const DEFAULT_LON = 23.59
const userEmail = ref("")
const loginError = ref(null)
const locationError = ref(null)

const API_URL = import.meta.env.VITE_API_URL // Read from .env

const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()

  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    userEmail.value = user.email

    console.log("Logged in as:", user.email)

    // Get user's location or fallback
    const location = await getUserLocationAsync()

    // Use the env API URL
    await fetch(`${API_URL}/api/users`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        location: location, // [lat, lon]
      }),
    })

    userStore.uid = user.uid
    userStore.email = user.email
    userStore.location = location
    userStore.loggedIn = true
  } catch (error) {
    console.error("Google login error:", error)
    alert("Login failed. Check console for details.")
  }
}

function getUserLocationAsync() {
  loginError.value = null
  locationError.value = null

  return new Promise((resolve) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log("Location found:", latitude, longitude)
          resolve([latitude, longitude])
        },
        (error) => {
          console.warn("Geolocation error:", error.message)
          locationError.value = "Geolocation failed. Using default location."
          resolve([DEFAULT_LAT, DEFAULT_LON])
        },
        { timeout: 5000 }
      )
    } else {
      locationError.value = "Geolocation not supported by your browser!"
      resolve([DEFAULT_LAT, DEFAULT_LON])
    }
  })
}
</script>

<style scoped>
body {
  font-family: "Inter", sans-serif;
}
</style>
