import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'


createApp(App).mount('#app')
