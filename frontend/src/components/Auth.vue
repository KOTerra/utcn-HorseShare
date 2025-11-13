<template>
  <div v-if="!userStore.loggedIn" class="auth-card">
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

    <p v-if="loginError" class="mt-4 text-red-600 text-sm">
      {{ loginError }}
    </p>
  </div>

  <div v-else class="auth-card">
    <h1 class="text-2xl font-bold mb-6">User Profile</h1>
    <div class="login-info" role="status" aria-live="polite">
      <div class="login-card">
        <div class="avatar" aria-hidden="true">
          {{ userStore.email ? userStore.email.charAt(0).toUpperCase() : "?" }}
        </div>

        <div class="login-meta">
          <div class="login-line">
            <span class="label">Logged in as</span>
            <span class="login-email" title="User email">{{ userStore.email }}</span>
          </div>

          <div class="login-line small">
            <span class="label">Role</span>
            <span class="role-badge" :class="userStore.role === 'Carriage Driver' ? 'driver' : 'rider'">
              {{ userStore.role }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../firebase"
import { userStore, startWatchingLocation } from "../stores/userStores.js"
import { useUserLocation } from '../composables/useUserLocation.js'
import { startHeartbeat } from "../composables/heartbeat.js"

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

    const { locationError, getUserLocationAsync } = useUserLocation()
    const location = await getUserLocationAsync()

    if (locationError.value) {
      loginError.value = locationError.value
    }
    
    // API call logic based on selected role
    if (role.value === "Rider") {
      await fetch(`${API_URL}/api/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          location: location, // send the initial [lat, lon]
          loggedIn: true
        }),
      })
    }
    else if (role.value === "Carriage Driver") {
      await fetch(`${API_URL}/api/drivers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          location: location,
          loggedIn: true
        }),
      })
    }
    
    //update the global store
    userStore.uid = user.uid
    userStore.email = user.email
    userStore.location = location
    userStore.role = role.value
    userStore.loggedIn = true

    startWatchingLocation()

    startHeartbeat()

  } catch (error) {
    console.error("Google login error:", error)
    loginError.value = "Login failed. Check console for details."
  }
}

</script>

<style scoped>

.auth-card {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 0.75rem;  
  padding: 1.5rem;         
  width: 20rem;            
  text-align: center;
}


.auth-card h1 {
  color: white;
  margin-bottom: 1.125rem;  
  font-size: 1.125rem;    
}

.p-8 { padding: 1.5rem; }   
.w-80 { width: 20rem; }     

.role-toggle {
  display: flex;
  justify-content: center;
  gap: 0.75rem;             
  margin-bottom: 0.75rem;   
  margin-top: 0.75rem;      
}

.auth-card p {
  color: #ff6b6b;
}

body {
  font-family: "Inter", sans-serif;
}

.bg-white {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.rounded-2xl {
  border-radius: 1rem;
}

.p-8 {
  padding: 2rem;
}

.w-80 {
  width: 20rem;
}

.text-center {
  text-align: center;
}

.text-2xl {
  font-size: 1.5rem;
  font-weight: 700;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.role-toggle {
  display: flex;
  justify-content: center;
  gap: 0.75rem;             
  margin-bottom: 0.75rem;   
  margin-top: 0.75rem;      
}

.mt-4 {
  margin-top: 1rem;
}
</style>