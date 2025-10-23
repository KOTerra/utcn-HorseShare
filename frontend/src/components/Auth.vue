<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="bg-white shadow-xl rounded-2xl p-8 w-80 text-center">
      <h1 class="text-2xl font-bold mb-6">Login</h1>

      <button @click="loginWithGoogle"
        class="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg w-full transition">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5" />
        Login with Google
      </button>

      <div class="role-toggle">
        <label :class="['role-btn', role === 'Rider' ? 'active' : '']">
          <input type="radio" name="role" value="Rider" v-model="role" />
          Rider
        </label>

        <label :class="['role-btn', role === 'Carriage Driver' ? 'active' : '']">
          <input type="radio" name="role" value="Carriage Driver" v-model="role" />
          Carriage Driver
        </label>
      </div>

      <p class="selected-role">Selected role: {{ role }}</p>


      <p v-if="userStore.loggedIn" class="mt-6 text-gray-600 text-sm">
        Logged in as: <span class="font-semibold">{{ userStore.email }}</span>
      </p>

      <p v-if="loginError" class="mt-4 text-red-600 text-sm">
        {{ loginError }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../firebase"
import { userStore, startWatchingLocation } from "../stores/userStores.js"
import { useUserLocation } from '../composables/useUserLocation.js'

const loginError = ref(null)
const role = ref("Rider")
const API_URL = import.meta.env.VITE_API_URL

const loginWithGoogle = async () => {
  loginError.value = null // Clear previous errors
  const provider = new GoogleAuthProvider()

  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    console.log("Logged in as:", user.email)

    // Get user's *initial* location or fallback
    const { locationError, getUserLocationAsync } = useUserLocation()
    const location = await getUserLocationAsync()

    // MODIFIED: Check for a location error and show it to the user
    if (locationError.value) {
      loginError.value = locationError.value
    }

    await fetch(`${API_URL}/api/users`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        location: location, // Send the initial [lat, lon]
      }),
    })

    // Update the global store
    userStore.uid = user.uid
    userStore.email = user.email
    userStore.location = location
    userStore.loggedIn = true

    // Start live location tracking after login is complete 
    startWatchingLocation()

  } catch (error) {
    console.error("Google login error:", error)
    loginError.value = "Login failed. Check console for details."
  }
}

</script>

<style scoped>
body {
  font-family: "Inter", sans-serif;
}
</style>