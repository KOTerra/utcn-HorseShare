// src/composables/useApi.js

import { DEFAULT_RANGE } from '../composables/constants.js'; 

const API_URL = import.meta.env.VITE_API_URL;

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (dgr) => (dgr * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useApi(addHorseMarkers, addCarriagesMarkers) {

  const fetchAndDisplayHorses = async (lat, lon, range = DEFAULT_RANGE) => {
    const baseURL = `${API_URL}/api/horses`;
    const apiURL = `${baseURL}/${lat}/${lon}/${range}`;

    try {
      const response = await fetch(apiURL);
      const text = await response.text();

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}. Body: ${text.substring(0, 100)}...`);

      let allHorses = [];
      if (text.trim().length > 0) {
        allHorses = JSON.parse(text);
      }

      addHorseMarkers(allHorses);
      return true;
    } catch (error) {
      console.error('There was a critical problem fetching horses:', error);
      return false;
    }
  }

  const fetchAndDisplayCarriages = async (lat, lon, range = DEFAULT_RANGE) => {
    const baseURL = `${API_URL}/api/drivers`;
    const apiURL = `${baseURL}/${lat}/${lon}/${range}`;

    try {
      const response = await fetch(apiURL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}. Body: ${await response.text().substring(0,100)}...`);

      const allDrivers = await response.json();
      addCarriagesMarkers(allDrivers);
      return true;
    } catch (error) {
      console.error('There was a critical problem fetching carriage drivers:', error);
      return false;
    }
  }

  return {
    fetchAndDisplayHorses,
    fetchAndDisplayCarriages,
    getDistance,
  }
}