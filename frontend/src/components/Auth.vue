<template>
  <div v-if="!userStore.loggedIn" class="auth-card">
    <h1 class="text-2xl font-bold mb-6">Login</h1>

    <button @click="loginWithGoogle"
      class="google-login-btn flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg w-full transition mb-4">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5" />
      Login with Google
    </button>

    <div class="role-selector"> <button class="role-btn" :class="{ active: role === 'Rider' }" @click="role = 'Rider'">
        Rider 🚶
      </button>

      <button class="role-btn" :class="{ active: role === 'Carriage Driver' }" @click="role = 'Carriage Driver'">
        Carriage Driver 🎠🚋
      </button>
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
    if(role.value == "Carriage Driver"){
      userStore.selectedRideType = "none" 
    }
    else{
      userStore.selectedRideType = "horse";
    }
    startWatchingLocation()

    startHeartbeat()

  } catch (error) {
    console.error("Google login error:", error)
    loginError.value = "Login failed. Check console for details."
  }
}

</script>

<style scoped>
/* === General Auth Card Styles === */
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

.auth-card p {
  color: #ff6b6b;
}

/* === Google Login Button === */
.google-login-btn {
  margin-bottom: 1.5rem;
}


/* === Role Selector (Styled like RideSelector buttons) === */
.role-selector {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 999px;
  justify-content: center;
  margin-top: 0.75rem;
}

.role-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  /* Pill shape */
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  /* For emojis/icons */
  white-space: nowrap;
  /* Prevent text wrapping */
}

.role-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.role-btn.active {
  background: rgb(117, 202, 185);
  /* Active background color */
  color: #1a1a1a;
  /* Active text color */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 640px) {
  .role-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
}

/* === User Profile Specific Styles === */
.login-info {
  margin-top: 1rem;
  color: white;
}

.login-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: left;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgb(117, 202, 185);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #1a1a1a;
}

.login-meta {
  flex-grow: 1;
}

.login-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.login-line.small {
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.label {
  color: rgba(255, 255, 255, 0.7);
}

.login-email {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.role-badge {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
}

.role-badge.rider {
  background-color: #6daee3;
  color: rgb(189, 84, 53);
}

.role-badge.driver {
  background-color: #75cab9;
  color: #1a1a1a;
}

.text-2xl {
  font-size: 1.5rem;
}

.font-bold {
  font-weight: 700;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.gap-3 {
  gap: 0.75rem;
}

.bg-blue-600 {
  background-color: rgb(157, 69, 44);
}

.hover\:bg-blue-700:hover {
  background-color: rgb(130, 55, 37);
}

.text-white {
  color: rgb(255, 255, 255);
}

.font-medium {
  font-weight: 500;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.w-full {
  width: 100%;
}

.transition {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.mt-4 {
  margin-top: 1rem;
}

.text-red-600 {
  color: #dc2626;
}

.text-sm {
  font-size: 0.875rem;
}
</style>