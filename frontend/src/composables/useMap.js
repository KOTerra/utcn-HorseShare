// src/composables/useMap.js

import { ref, watch, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'
import 'leaflet-control-geocoder'
import {
  DEFAULT_LAT,
  DEFAULT_LON,
  DEFAULT_ZOOM
} from '../composables/constants.js'

export function useMap(initialLat, initialLon, markerLayers) {
  const map = ref(null)
  let routingControl = null;

  const initializeMap = (lat, lon, zoom) => {
    const mapInstance = L.map('map').setView([lat, lon], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance)

    // Add marker layers (horse, carriage) to the map
    markerLayers.forEach(layer => layer.addTo(mapInstance));

    map.value = mapInstance
    return mapInstance
  }

  const setupRoutingAndSearch = (mapInstance, userMarkerRef) => {
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      collapsed: false,
      placeholder: 'Search location...'
    })
      .on('markgeocode', function (e) {
        const destLatLng = e.geocode.center;
        const userMarker = userMarkerRef.value;

        if (routingControl) mapInstance.removeControl(routingControl);

        if (userMarker) {
          routingControl = L.Routing.control({
            waypoints: [
              userMarker.getLatLng(), // Start
              destLatLng              // End
            ],
            routeWhileDragging: true,

            createMarker: function (i, waypoint, n) {
              // return null to hide the default routing marker here.
              if (i === 0) {
                return null;
              }

              return L.marker(waypoint.latLng, {
                draggable: true,
                title: "Destination"
              });
            }
          }).addTo(mapInstance);
        }

        if (userMarker) {
          mapInstance.fitBounds(L.latLngBounds([userMarker.getLatLng(), destLatLng]));
        } else {
          mapInstance.setView(destLatLng, 13);
        }
      })
      .addTo(mapInstance);
  }

  onMounted(() => {
    // Leaflet requires a timeout to correctly calculate size 
    setTimeout(() => {
      if (map.value) map.value.invalidateSize();
    }, 100);
  });

  return {
    map,
    initializeMap,
    setupRoutingAndSearch,
  }
}