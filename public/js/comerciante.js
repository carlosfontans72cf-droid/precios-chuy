// Panel Comerciante - Precios Chuy
import { db, storage } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { showAlert } from './utils.js';

const userId = sessionStorage.getItem('userId');

if (!userId) {
  window.location.href = '/index.html';
}

// ========== PERFIL ==========
document.getElementById('btn-save-perfil')?.addEventListener('click', savePerfil);
async function savePerfil() {
  const nombre = document.getElementById('perfil-nombre').value.trim();
  if (!nombre) return showAlert('Ingresá el nombre del comercio', 'warning');

  try {
    const comercioRef = doc(db, 'comercios', userId);
    await updateDoc(comercioRef, {
      nombre: nombre,
      tipo: document.getElementById('perfil-tipo').value,
      direccion: document.getElementById('perfil-direccion').value.trim(),
      telefono: document.getElementById('perfil-telefono').value.trim(),
      logo: document.getElementById('perfil-logo').value.trim(),
      horarios: document.getElementById('perfil-horarios').value.trim(),
      updatedAt: serverTimestamp()
    });
    showAlert('Perfil actualizado', 'success');
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
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
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
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
      return;
    }
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px;border-bottom:1px solid #eee;';
      div.innerHTML = `<strong>${data.nombre}</strong><br>
        R$ ${data.precioBrasil || 0} ${data.esOferta ? '🔥 OFERTA' : ''}<br>
        <button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
    });
    document.getElementById('stat-productos').textContent = snap.size;
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
}

window.deleteProducto = async (id) => {
  if (!confirm('¿Eliminar producto?')) return;
  try {
    await deleteDoc(doc(db, 'productos', id));
    showAlert('Producto eliminado', 'success');
    loadProductos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== VIDEOS ==========
document.getElementById('btn-upload-video')?.addEventListener('click', uploadVideo);
async function uploadVideo() {
  const file = document.getElementById('video-file').files[0];
  const titulo = document.getElementById('video-titulo').value.trim();
  const desc = document.getElementById('video-desc').value.trim();
  const vence = document.getElementById('video-vence').value;

  if (!file) return showAlert('Seleccioná un video', 'warning');
  if (!titulo) return showAlert('Ingresá un título', 'warning');
  if (file.size > 50 * 1024 * 1024) return showAlert('El video es muy grande (máx 50MB)', 'warning');

  try {
    // Subir a Firebase Storage
    const storageRef = ref(storage, `videos/${userId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    // Guardar en Firestore
    await addDoc(collection(db, 'videos'), {
      titulo, descripcion: desc,
      url, comercioId: userId,
      vence: vence || null,
      duracion: 90,
      activo: true,
      createdAt: serverTimestamp()
    });

    document.getElementById('video-file').value = '';
    document.getElementById('video-titulo').value = '';
    document.getElementById('video-desc').value = '';
    document.getElementById('video-vence').value = '';
    showAlert('Oferta publicada', 'success');
    loadVideos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
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
      return;
    }
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
    document.getElementById('stat-ofertas').textContent = snap.size;
  } catch (err) {
    console.error('Error cargando videos:', err);
  }
}

window.deleteVideo = async (id) => {
  if (!confirm('¿Eliminar oferta?')) return;
  try {
    await deleteDoc(doc(db, 'videos', id));
    showAlert('Oferta eliminada', 'success');
    loadVideos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== INICIALIZACIÓN ==========
loadProductos();
loadVideos();