// src/composables/useApi.js

import { DEFAULT_RANGE } from '../composables/constants.js'; 

const API_URL = import.meta.env.VITE_API_URL;

function getDistance(lat1, lon1, lat2, lon2) {
  if(!lat1 || !lon1 || !lat2 || !lon2) return 99999;
  
  const R = 6371; // km
  const toRad = (dgr) => (dgr * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; 
}

export function useApi(addHorseMarkers, addCarriagesMarkers) {

  const fetchAndDisplayHorses = async (lat, lon, range = DEFAULT_RANGE) => {
    const apiURL = `${API_URL}/api/horses/${lat}/${lon}/${range}`;

    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      addHorseMarkers(data);
      return true;
    } catch (error) {
      console.error('Error fetching horses:', error);
      return false;
    }
  }

  const fetchAndDisplayCarriages = async (lat, lon, range = DEFAULT_RANGE) => {
    const apiURL = `${API_URL}/api/drivers/${lat}/${lon}/${range}`;

    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const allDrivers = await response.json();
      
      addCarriagesMarkers(allDrivers);
      return true;
    } catch (error) {
      console.error('Error fetching carriage drivers:', error);
      return false;
    }
  }

  return {
    fetchAndDisplayHorses,
    fetchAndDisplayCarriages,
    getDistance,
  }
}