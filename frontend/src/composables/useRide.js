// src/composables/useRide.js
import { toRaw } from 'vue'; 
import { userStore } from '../stores/userStores';
import { getDatabase, ref as dbRef, onValue, query, orderByChild, equalTo, off } from 'firebase/database';
import { getDistance } from './useApi.js';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_RATE = 5;
const RATE_PER_KM = 3;

// Initialize DB locally
const db = getDatabase(); 

export function useRide() {

    // RIDER ACTIONS

    const requestRide = async (driver) => {
        if (!userStore.location) {
            console.error("No user location found!");
            return;
        }

        // Unwrap Proxy objects
        const plainDriver = toRaw(driver);
        const plainLocation = toRaw(userStore.location);

        const [lat, lon] = plainLocation;
        let destLat, destLon;

        // Parse destination
        if (userStore.destination) {
            if (Array.isArray(userStore.destination)) {
                [destLat, destLon] = userStore.destination;
            } else if (typeof userStore.destination === 'object') {
                destLat = userStore.destination.lat;
                destLon = userStore.destination.lng || userStore.destination.lon;
            }
        }

        // Calculate Price
        let price = 15; 
        if (destLat && destLon) {
            const distMeters = getDistance(lat, lon, destLat, destLon);
            const distKm = distMeters / 1000;
            price = Math.round(BASE_RATE + (distKm * RATE_PER_KM));
        }

        const targetDriverId = plainDriver.email || plainDriver.uid || plainDriver.id;

        const payload = {
            rider_uid: userStore.uid,
            rider_email: userStore.email,
            driver_uid: targetDriverId, 
            driver_name: plainDriver.name || "Carriage Driver",
            pickup_location: plainLocation,
            destination: (destLat && destLon) ? [destLat, destLon] : null,
            price: price
        };

        console.log("Sending Ride Request:", payload);

        try {
            const response = await fetch(`${API_URL}/api/rides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server rejected: ${errorText}`);
            }

            const data = await response.json();
            console.log("Request Sent! Ride ID:", data.rideId);

            userStore.currentRideId = data.rideId;
            userStore.rideState = 'waiting_for_acceptance';

            listenForRideUpdates(data.rideId);

        } catch (error) {
            console.error("Final Error:", error);
            alert("Could not request ride. See console.");
        }
    };

    // LISTENERS

    // RIDER: Listen for updates on a specific ride
    const listenForRideUpdates = (rideId) => {
        if (!rideId) return;
        const rideRef = dbRef(db, `rides/${rideId}`);

        onValue(rideRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            if (data.status === 'accepted') {
                userStore.rideState = 'driver_en_route';
            } else if (data.status === 'picked_up') {
                userStore.rideState = 'ride_in_progress';
            } else if (data.status === 'completed') {
                alert(`Ride completed! Fare: ${data.price} RON`);
                resetState();
                off(rideRef);
            } else if (data.status === 'declined') {
                userStore.rideState = 'idle';
                userStore.currentRideId = null;
                alert("Driver declined.");
                off(rideRef);
            }
        });
    };

    // DRIVER: Listen for incoming requests
    const listenForIncomingRequests = () => {
        if (userStore.role !== 'Carriage Driver') return;

        const ridesRef = dbRef(db, 'rides');

        // Listen for requests addressed to my Email
        const q = query(
            ridesRef, 
            orderByChild('driver_uid'), 
            equalTo(userStore.email) 
        );

        onValue(q, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const rides = Object.values(data);
            
            const pendingRide = rides.find(r => r.status === 'pending');
            const acceptedRide = rides.find(r => r.status === 'accepted');
            const pickedUpRide = rides.find(r => r.status === 'picked_up');

            if (pickedUpRide) {
                 userStore.incomingRequest = pickedUpRide;
                 userStore.currentRideId = pickedUpRide.rideId;
                 userStore.rideState = 'ride_in_progress';
            } else if (acceptedRide) {
                 userStore.incomingRequest = acceptedRide;
                 userStore.currentRideId = acceptedRide.rideId;
                 userStore.rideState = 'driver_en_route';
            } else if (pendingRide) {
                userStore.incomingRequest = pendingRide;
                userStore.currentRideId = pendingRide.rideId;
                userStore.rideState = 'request_received';
            }
        });
    };

    // DRIVER ACTIONS

    const updateStatus = async (status) => {
        if (!userStore.currentRideId) return;
        try {
            await fetch(`${API_URL}/api/rides/${userStore.currentRideId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error(`Error setting status ${status}:`, error);
        }
    };

    const acceptRide = async () => {
        await updateStatus('accepted');
        userStore.rideState = 'driver_en_route';
    };

    const confirmPickup = async () => {
        await updateStatus('picked_up');
        userStore.rideState = 'ride_in_progress';
    };

    const completeRide = async () => {
        await updateStatus('completed');
        alert("Ride Finished! Payment collected.");
        resetState();
    };


    const resetState = () => {
        userStore.rideState = 'idle';
        userStore.currentRideId = null;
        userStore.incomingRequest = null;
        userStore.destination = null; // Clear destination on finish
    };

    const resumeRideListener = () => {
        if (userStore.role === 'Rider' && userStore.currentRideId) {
            console.log("🔄 Resuming listener for ride:", userStore.currentRideId);
            listenForRideUpdates(userStore.currentRideId);
        }
    };

    return {
        requestRide,
        listenForIncomingRequests,
        listenForRideUpdates, 
        acceptRide,
        confirmPickup,
        completeRide,
        resumeRideListener
    };
}