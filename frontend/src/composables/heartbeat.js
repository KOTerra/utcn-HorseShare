import { userStore } from "../stores/userStores.js"; 
const API_URL = import.meta.env.VITE_API_URL;

let heartbeatIntervalId = null; 
const HEARTBEAT_INTERVAL_MS = 30000; 

const sendHeartbeat = async () => {
    const { loggedIn, uid, role } = userStore;

    if (loggedIn && uid) {
        const endpoint = role === "Rider" ? "users" : "drivers";
        
        try {
            await fetch(`${API_URL}/api/${endpoint}/heartbeat`, { 
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: uid, 
                }),
            });
        } catch (error) {
            console.warn("Heartbeat failed", error.message);
        }
    } else {
        stopHeartbeat();
    }
};

export const startHeartbeat = () => {
    if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
    }
    
    sendHeartbeat(); 

    heartbeatIntervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    console.log(`Heartbeat loop started, pinging every ${HEARTBEAT_INTERVAL_MS / 1000}s.`);
};

export const stopHeartbeat = async () => {
    if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId);
        heartbeatIntervalId = null;
        console.log("Heartbeat stopped.");
    }
    const { loggedIn, uid, role } = userStore;
    if (loggedIn && uid) {
        const endpoint = role === "Rider" ? "users" : "drivers";
        try {
            await fetch(`${API_URL}/api/${endpoint}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: uid,
                    loggedIn: false, 
                }),
            });
            console.log("Explicit logout status sent via PUT.");
        } catch (error) {
            console.warn("Failed to send explicit logout. Server timeout will handle it.", error.message);
        }
    }
    userStore.loggedIn = false;
};