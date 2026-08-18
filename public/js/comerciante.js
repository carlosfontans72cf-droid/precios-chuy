// Panel Comerciante - Precios Chuy
import { db, storage } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { showAlert } from './utils.js';
import { mostrarPagoComerciante } from './pagos-ui.js';

const userId = sessionStorage.getItem('userId');
if (!userId) window.location.href = '/index.html';

// Hacer disponible globalmente
window.mostrarPago = () => mostrarPagoComerciante(diasRestantesGlobal, userId);
let diasRestantesGlobal = 60;

// ========== ESTADÍSTICAS GENERALES (contador público) ==========
async function loadStatsGenerales() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const prodsSnap = await getDocs(collection(db, 'productos'));
    const comsSnap = await getDocs(collection(db, 'comercios'));

    const el1 = document.getElementById('stat-total-users');
    const el2 = document.getElementById('stat-comercios');
    const el3 = document.getElementById('stat-productos');
    if (el1) el1.textContent = usersSnap.size;
    if (el2) el2.textContent = comsSnap.size;
    if (el3) el3.textContent = prodsSnap.size;
  } catch (err) { console.error('Error stats:', err); }
}

// ========== SUSCRIPCIÓN ==========
async function loadSuscripcion() {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', sessionStorage.getItem('userEmail'))));
    if (!userDoc.empty) {
      const data = userDoc.docs[0].data();
      diasRestantesGlobal = data.diasRestantes || 60;
      const totalDias = 60;
      const porcentaje = Math.max(0, Math.min(100, (diasRestantesGlobal / totalDias) * 100));

      const titulo = document.getElementById('sub-titulo');
      const texto = document.getElementById('sub-texto');
      const diasEl = document.getElementById('sub-dias');
      const barra = document.getElementById('sub-barra');

      if (diasRestantesGlobal <= 0) {
        titulo.textContent = '⚠️ Tu prueba finalizó';
        texto.innerHTML = 'Tu perfil sigue visible pero no podés subir nuevas ofertas';
        if (diasEl) diasEl.textContent = '0';
        if (barra) barra.style.width = '0%';
      } else {
        titulo.textContent = '🎉 Período de prueba activo';
        texto.innerHTML = `Te quedan <strong>${diasRestantesGlobal}</strong> días gratis`;
        if (diasEl) diasEl.textContent = diasRestantesGlobal;
        if (barra) barra.style.width = porcentaje + '%';
      }
    }
  } catch (err) { console.error('Error suscripción:', err); }
}

// ========== MAPA DE PERFIL ==========
let mapaPerfil;
let markerPerfil;

function initMapaPerfil() {
  const contenedor = document.getElementById('mapa-perfil');
  if (!contenedor || mapaPerfil) return;
  
  // Centro del Chui
  mapaPerfil = L.map('mapa-perfil').setView([-33.7574, -53.4614], 14);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapaPerfil);
  
  // Click en el mapa para poner el pin
  mapaPerfil.on('click', function(e) {
    const { lat, lng } = e.latlng;
    
    // Eliminar marker anterior si existe
    if (markerPerfil) {
      mapaPerfil.removeLayer(markerPerfil);
    }
    
    // Agregar nuevo marker
    markerPerfil = L.marker([lat, lng]).addTo(mapaPerfil);
    markerPerfil.bindPopup('📍 Tu comercio').openPopup();
    
    // Actualizar campos
    document.getElementById('perfil-lat').value = lat.toFixed(6);
    document.getElementById('perfil-lng').value = lng.toFixed(6);
  });
}

// ========== PERFIL ==========
document.getElementById('btn-save-perfil')?.addEventListener('click', savePerfil);
async function savePerfil() {
  const nombre = document.getElementById('perfil-nombre').value.trim();
  if (!nombre) return showAlert('Ingresá el nombre', 'warning');

  try {
    const lat = parseFloat(document.getElementById('perfil-lat').value);
    const lng = parseFloat(document.getElementById('perfil-lng').value);
    
    // Buscar el documento del usuario por email
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', sessionStorage.getItem('userEmail'))));
    if (!userDoc.empty) {
      const docId = userDoc.docs[0].id;
      const dataToUpdate = {
        nombreComercio: nombre,
        tipo: document.getElementById('perfil-tipo').value,
        direccion: document.getElementById('perfil-direccion').value.trim(),
        telefono: document.getElementById('perfil-telefono').value.trim(),
        logo: document.getElementById('perfil-logo').value.trim(),
        horarios: document.getElementById('perfil-horarios').value.trim(),
        updatedAt: serverTimestamp()
      };
      
      // Agregar coordenadas si se seleccionaron
      if (!isNaN(lat) && !isNaN(lng)) {
        dataToUpdate.lat = lat;
        dataToUpdate.lng = lng;
      }
      
      await updateDoc(doc(db, 'users', docId), dataToUpdate);
      showAlert('Perfil actualizado', 'success');
    }
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

// ========== PRODUCTOS ==========
document.getElementById('btn-add-producto')?.addEventListener('click', addProducto);
async function addProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);

  if (!nombre || !precio) return showAlert('Completá nombre y precio', 'warning');

  try {
    await addDoc(collection(db, 'productos'), {
      nombre,
      precioBrasil: precio,
      precioUruguay: 0,
      comercioId: userId,
      comercioNombre: sessionStorage.getItem('userName'),
      imagen: document.getElementById('prod-imagen').value.trim() || null,
      esOferta: document.getElementById('prod-es-oferta').value === 'true',
      activo: true,
      createdAt: serverTimestamp()
    });
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio').value = '';
    document.getElementById('prod-imagen').value = '';
    showAlert('Producto agregado', 'success');
    loadProductos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

async function loadProductos() {
  const cont = document.getElementById('lista-mis-productos');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const q = query(collection(db, 'productos'), where('comercioId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) {
      cont.innerHTML = '<p style="color:#666;">Sin productos cargados</p>';
    } else {
      snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.style.cssText = 'padding:10px;border-bottom:1px solid #eee;';
        div.innerHTML = `<strong>${data.nombre}</strong><br>
          R$ ${data.precioBrasil || 0} ${data.esOferta ? '🔥 OFERTA' : ''}<br>
          <button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">Eliminar</button>`;
        cont.appendChild(div);
      });
    }
    const statEl = document.getElementById('stat-productos-com');
    if (statEl) statEl.textContent = snap.size;
  } catch (err) { console.error('Error productos:', err); }
}

window.deleteProducto = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'productos', id)); loadProductos(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== VIDEOS ==========
document.getElementById('btn-upload-video')?.addEventListener('click', uploadVideo);
async function uploadVideo() {
  const file = document.getElementById('video-file').files[0];
  const titulo = document.getElementById('video-titulo').value.trim();

  if (!file) return showAlert('Seleccioná un video', 'warning');
  if (!titulo) return showAlert('Ingresá un título', 'warning');

  try {
    const storageRef = ref(storage, `videos/${userId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'videos'), {
      titulo,
      descripcion: document.getElementById('video-desc').value.trim(),
      url, comercioId: userId,
      vence: document.getElementById('video-vence').value || null,
      activo: true,
      createdAt: serverTimestamp()
    });

    document.getElementById('video-file').value = '';
    document.getElementById('video-titulo').value = '';
    document.getElementById('video-desc').value = '';
    document.getElementById('video-vence').value = '';
    showAlert('Oferta publicada', 'success');
    loadVideos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

async function loadVideos() {
  const cont = document.getElementById('lista-mis-videos');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const q = query(collection(db, 'videos'), where('comercioId', '==', userId));
    const snap = await getDocs(q);
    if (snap.empty) {
      cont.innerHTML = '<p style="color:#666;">Sin ofertas publicadas</p>';
    } else {
      snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.style.cssText = 'padding:10px;border-bottom:1px solid #eee;';
        div.innerHTML = `<video src="${data.url}" controls style="width:100%;max-height:200px;"></video>
          <strong>${data.titulo}</strong><br>
          <small>${data.descripcion || ''}</small><br>
          <small>Vence: ${data.vence || 'Sin fecha'}</small><br>
          <button class="btn btn-sm btn-danger" onclick="deleteVideo('${d.id}')">Eliminar</button>`;
        cont.appendChild(div);
      });
    }
    const statEl = document.getElementById('stat-ofertas-com');
    if (statEl) statEl.textContent = snap.size;
  } catch (err) { console.error('Error videos:', err); }
}

window.deleteVideo = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'videos', id)); loadVideos(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== INICIALIZACIÓN ==========
loadStatsGenerales();
loadSuscripcion();
loadProductos();
loadVideos();
initMapaPerfil();