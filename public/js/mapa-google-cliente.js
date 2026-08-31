import { MAPS_CONFIG } from './maps-config.js';
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let mapa = null;

async function cargarGoogleMaps() {
  if (window.google?.maps) return inicializarMapa();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.apiKey}&libraries=marker`;
    script.onload = () => {
      inicializarMapa();
      resolve();
    };
    document.head.appendChild(script);
  });
}

async function inicializarMapa() {
  const contenedor = document.getElementById("mapa-comercios");
  if (!contenedor) return;
  mapa = new google.maps.Map(contenedor, {
    center: MAPS_CONFIG.defaultCenter,
    zoom: MAPS_CONFIG.defaultZoom
  });
  await cargarComercios();
}

async function cargarComercios() {
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(doc => {
    const comercio = { id: doc.id, ...doc.data() };
    if (!comercio.lat || !comercio.lng) return;
    const pin = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: comercio.lat, lng: comercio.lng },
      map: mapa,
      title: comercio.nombreComercio || "Comercio"
    });
    pin.addListener("click", () => {
      window.location.href = `pages/comercio-perfil.html?id=${comercio.id}`;
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargarGoogleMaps);
} else {
  cargarGoogleMaps();
}