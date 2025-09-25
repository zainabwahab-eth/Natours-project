export const displayMap = (locations) => {
  // Remove any existing map instance
  if (window.mapInstance) {
    window.mapInstance.remove();
  }

  // Create the map
  const map = L.map('map', {
    scrollWheelZoom: false,
    dragging: true,
    touchZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    zoomControl: true,
  });

  // Store map instance globally for cleanup
  window.mapInstance = map;

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Create bounds object
  const bounds = L.latLngBounds();

  // Process each location
  locations.forEach((loc, index) => {
    // Validate coordinates
    if (!loc.coordinates || loc.coordinates.length !== 2) {
      console.warn(`Invalid coordinates for location ${index}:`, loc);
      return;
    }

    const [lng, lat] = loc.coordinates;

    // Validate lat/lng values
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      console.warn(`Invalid lat/lng values for location ${index}:`, {
        lat,
        lng,
      });
      return;
    }

    // Create marker - Leaflet expects [lat, lng]
    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(
        `<p>Day ${loc.day || index + 1}: ${
          loc.description || 'No description'
        }</p>`
      );

    // Open first popup
    if (index === 0) {
      marker.openPopup();
    }

    // Add to bounds - using [lat, lng] format
    bounds.extend([lat, lng]);
  });

  // Fit map to show all markers
  if (locations.length > 1 && bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [50, 50], // Reduced padding for better fit
      maxZoom: 15, // Prevent zooming in too much
    });
  } else if (locations.length === 1 && locations[0].coordinates) {
    // If only one location, center on it
    const [lng, lat] = locations[0].coordinates;
    map.setView([lat, lng], 12);
  }

  // Force map to resize after a short delay (helps with container issues)
  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  return map;
};
