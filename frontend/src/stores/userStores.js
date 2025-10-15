import { reactive } from 'vue'

export const userStore = reactive({
    uid: null,
    email: null,
    location: [46.77, 23.59], // default
    loggedIn: false,
})