navigator.geolocation.getCurrentPosition(success, error);

function success(position) {
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;

  const map = L.map('map').setView([userLat, userLon], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Red icon for hospitals
  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // User location marker
  L.marker([userLat, userLon]).addTo(map).bindPopup("You are here");

  // Load hospital data
  fetch('/static/data/hospitals.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(h => {
        const distance = getDistance(userLat, userLon, h.Latitude, h.Longitude);

        if (distance <= 5) { // only show hospitals within 5 km
          L.marker([h.Latitude, h.Longitude], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<b>${h.Place_name}</b><br>${h.Address1}<br><i>${distance.toFixed(2)} km away</i>`);

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${h.Place_name}</td>
            <td>${h.Phone}</td>
            <td>${h.Address1}</td>
            <td>${h.Hours}</td>
            <td><a href="${h.Location}" target="_blank">View</a></td>
          `;
          document.getElementById('hospital-table-body').appendChild(row);
        }
      });
    })
    .catch(err => console.error('Error loading hospital data:', err));
}

function error(err) {
  alert("Please enable location access to see nearby hospitals.");
}

// 🌍 Haversine formula to calculate distance (in km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * Math.PI / 180;
}
