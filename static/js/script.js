
navigator.geolocation.getCurrentPosition(success, error);

function success(position) {
const userLat = position.coords.latitude;
const userLon = position.coords.longitude;

const map = L.map('map').setView([userLat, userLon], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define a red icon for hospital markers
const redIcon = new L.Icon({
iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowSize: [41, 41]
});

// User marker
L.marker([userLat, userLon]).addTo(map).bindPopup("You are here");

// Load hospitals.json
// script.js
fetch('/static/data/hospitals.json')
.then((res) => res.json())
.then((data) => {
  data.forEach(h => {
    // Add marker to map
    L.marker([h.Latitude, h.Longitude], { icon: redIcon })
.addTo(map)
.bindPopup(`<b>${h.Place_name}</b><br>${h.Address1}`);


    // Add row to table
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${h.Place_name}</td>
      <td>${h.Phone}</td>
      <td>${h.Address1}</td>
      <td>${h.Hours}</td>
      <td><a href="${h.Location}" target="_blank">View</a></td>
    `;
    document.getElementById('hospital-table-body').appendChild(row);
  });
})
.catch(err => console.error('Error loading hospital data:', err));

}

function error(err) {
alert("Please enable location access to see nearby hospitals.");
}
