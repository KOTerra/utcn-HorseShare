import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'
import 'leaflet-control-geocoder'

export function useMap(initialLat, initialLon, markerLayers) {
  const map = ref(null)
  let routingControl = null

  const initializeMap = (lat, lon, zoom) => {
    const mapInstance = L.map('map').setView([lat, lon], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance)

    if (markerLayers) {
      markerLayers.forEach(layer => layer.addTo(mapInstance))
    }

    map.value = mapInstance
    return mapInstance
  }

  const clearRoute = () => {
    if (routingControl && map.value) {
      map.value.removeControl(routingControl)
      routingControl = null
    }
  }

  const setupRoutingAndSearch = (mapInstance, userMarkerRef, onDestinationSelected) => {
    L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: "Search destination…"
    })
      .on("markgeocode", e => {
        const dest = e.geocode.center

        if (onDestinationSelected) {
          const shouldProceed = onDestinationSelected({ lat: dest.lat, lng: dest.lng })
          if (shouldProceed === false) return
        }

        if (routingControl) mapInstance.removeControl(routingControl)

        const userLatLng = userMarkerRef.value ? userMarkerRef.value.getLatLng() : mapInstance.getCenter()

        routingControl = L.Routing.control({
          waypoints: [userLatLng, dest],
          routeWhileDragging: true,
          createMarker: (i, waypoint, n) => {
            if (i === 0) return null
            return L.marker(waypoint.latLng, { draggable: true })
          }
        }).addTo(mapInstance)

        mapInstance.fitBounds(L.latLngBounds([userLatLng, dest]))
      })
      .addTo(mapInstance)
  }

  onMounted(() => {
    setTimeout(() => {
      if (map.value) map.value.invalidateSize()
    }, 120)
  })

  return {
    map,
    initializeMap,
    setupRoutingAndSearch,
    clearRoute
  }
}