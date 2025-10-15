import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDX_i_Oq6kaUiI6QQ5dNNoCLuVrwm_o7Ds",
  authDomain: "studio-8626045391-660a8.firebaseapp.com",
  databaseURL: "https://studio-8626045391-660a8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "studio-8626045391-660a8",
  storageBucket: "studio-8626045391-660a8.firebasestorage.app",
  messagingSenderId: "145867520893",
  appId: "1:145867520893:web:76279e2373e10b812caa14"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
