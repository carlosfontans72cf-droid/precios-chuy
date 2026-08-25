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

window.mostrarPago = () => mostrarPagoComerciante(diasRestantesGlobal, userId);
let diasRestantesGlobal = 60;
let comercioDocId = '';

// ========== COMPRIMIR IMAGEN ==========
function comprimirImagen(file, maxWidth = 800, calidad = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Error al comprimir'));
        }, 'image/jpeg', calidad);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ========== ESTADÍSTICAS GENERALES ==========
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
      const totalDias = 60;
      let diasRestantes = 60;
      if (data.fechaSuscripcion) {
        const fechaInicio = new Date(data.fechaSuscripcion);
        const hoy = new Date();
        const diasTranscurridos = Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24));
        diasRestantes = Math.max(0, totalDias - diasTranscurridos);
      } else if (data.createdAt) {
        const fechaInicio = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const hoy = new Date();
        const diasTranscurridos = Math.floor((hoy - fechaInicio) / (1000 * 60 * 60 * 24));
        diasRestantes = Math.max(0, totalDias - diasTranscurridos);
      }
      diasRestantesGlobal = diasRestantes;
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
        titulo.textContent = ' Período de prueba activo';
        texto.innerHTML = `Te quedan <strong>${diasRestantesGlobal}</strong> días gratis`;
        if (diasEl) diasEl.textContent = diasRestantesGlobal;
        if (barra) barra.style.width = porcentaje + '%';
      }
    }
  } catch (err) { console.error('Error suscripción:', err); }
}

// ========== CARGAR SECCIONES EN DROPDOWN ==========
async function loadSecciones() {
  const select = document.getElementById('prod-seccion');
  if (!select) return;
  select.innerHTML = '<option value="">-- Seleccionar --</option>';
  try {
    const snap = await getDocs(collection(db, 'secciones'));
    snap.forEach(d => {
      const data = d.data();
      const opt = document.createElement('option');
      opt.value = data.nombre || d.id;
      opt.textContent = (data.icono || '') + ' ' + data.nombre;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Error cargando secciones:', err);
  }
}

// ========== MAPA DE PERFIL ==========
let mapaPerfil;
let markerPerfil;

function initMapaPerfil() {
  const contenedor = document.getElementById('mapa-perfil');
  if (!contenedor || mapaPerfil) return;
  mapaPerfil = L.map('mapa-perfil').setView([-33.7574, -53.4614], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapaPerfil);
  mapaPerfil.on('click', function(e) {
    const { lat, lng } = e.latlng;
    if (markerPerfil) mapaPerfil.removeLayer(markerPerfil);
    markerPerfil = L.marker([lat, lng]).addTo(mapaPerfil);
    markerPerfil.bindPopup(' Tu comercio').openPopup();
    document.getElementById('perfil-lat').value = lat.toFixed(6);
    document.getElementById('perfil-lng').value = lng.toFixed(6);
  });
}

// ========== SUBIR FOTO DE PERFIL ==========
document.getElementById('btn-subir-foto')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('foto-input');
  const file = fileInput.files[0];
  if (!file) return showAlert('Seleccioná una imagen primero', 'warning');
  if (!comercioDocId) {
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', sessionStorage.getItem('userEmail'))));
      if (!userDoc.empty) {
        comercioDocId = userDoc.docs[0].id;
      } else {
        return showAlert('No se encontró tu perfil. Guardá el perfil primero.', 'danger');
      }
    } catch (err) {
      return showAlert('Error al buscar perfil. Guardá el perfil primero.', 'danger');
    }
  }
  const btn = document.getElementById('btn-subir-foto');
  btn.disabled = true;
  btn.textContent = '⏳ Comprimiendo...';
  try {
    const blobComprimido = await comprimirImagen(file, 800, 0.7);
    btn.textContent = '📤 Subiendo...';
    showAlert('✅ Imagen comprimida, subiendo...', 'info');
    const ext = 'jpg';
    const fileName = `comercios/${comercioDocId}/foto.${ext}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, blobComprimido);
    const fotoUrl = await getDownloadURL(snapshot.ref);
    await updateDoc(doc(db, 'users', comercioDocId), { logo: fotoUrl });
    const container = document.getElementById('foto-container');
    container.innerHTML = `<img src="${fotoUrl}" class="foto-preview" alt="Foto del comercio">`;
    document.getElementById('perfil-logo').value = fotoUrl;
    showAlert('✅ Foto actualizada correctamente', 'success');
  } catch (err) {
    console.error('Error subiendo foto:', err);
    showAlert(`Error al subir: ${err.message}`, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Subir foto';
  }
});

// ========== PERFIL ==========
document.getElementById('btn-save-perfil')?.addEventListener('click', savePerfil);
async function savePerfil() {
  const nombre = document.getElementById('perfil-nombre').value.trim();
  if (!nombre) return showAlert('Ingresá el nombre', 'warning');
  try {
    const lat = parseFloat(document.getElementById('perfil-lat').value);
    const lng = parseFloat(document.getElementById('perfil-lng').value);
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', sessionStorage.getItem('userEmail'))));
    if (!userDoc.empty) {
      comercioDocId = userDoc.docs[0].id;
      const dataToUpdate = {
        nombreComercio: nombre,
        tipo: document.getElementById('perfil-tipo').value,
        direccion: document.getElementById('perfil-direccion').value.trim(),
        telefono: document.getElementById('perfil-telefono').value.trim(),
        logo: document.getElementById('perfil-logo').value.trim(),
        horarios: document.getElementById('perfil-horarios').value.trim(),
        cambioUsdCompra: parseFloat(document.getElementById('cambio-usd-compra').value) || null,
        cambioUsdVenta: parseFloat(document.getElementById('cambio-usd-venta').value) || null,
        cambioBrlCompra: parseFloat(document.getElementById('cambio-brl-compra').value) || null,
        cambioBrlVenta: parseFloat(document.getElementById('cambio-brl-venta').value) || null,
        cambioFecha: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };
      if (!isNaN(lat) && !isNaN(lng)) {
        dataToUpdate.lat = lat;
        dataToUpdate.lng = lng;
      }
      await updateDoc(doc(db, 'users', comercioDocId), dataToUpdate);
      document.getElementById('cambio-fecha').textContent = new Date().toLocaleString('es-UY');
      showAlert('Perfil actualizado', 'success');
    }
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

// ========== PRODUCTOS ==========
document.getElementById('btn-add-producto')?.addEventListener('click', addProducto);
async function addProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const seccion = document.getElementById('prod-seccion').value;

  if (!nombre || !precio) return showAlert('Completá nombre y precio', 'warning');

  try {
    await addDoc(collection(db, 'productos'), {
      nombre,
      precioBrasil: precio,
      precioUruguay: parseFloat(document.getElementById('prod-precio-uy').value) || 0,
      comercioId: userId,
      comercioNombre: sessionStorage.getItem('userName'),
      seccion: seccion || '',
      imagen: document.getElementById('prod-imagen').value.trim() || null,
      esOferta: document.getElementById('prod-es-oferta').value === 'true',
      activo: true,
      createdAt: serverTimestamp()
    });
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio').value = '';
    document.getElementById('prod-precio-uy').value = '';
    document.getElementById('prod-imagen').value = '';
    document.getElementById('prod-es-oferta').value = 'false';
    document.getElementById('prod-seccion').value = '';
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
        div.style.cssText = 'padding:12px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;';
        div.innerHTML = `
          <div>
            <strong>${data.nombre}</strong> ${data.seccion ? `<small style="color:#888;">(${data.seccion})</small>` : ''}<br>
            R$ ${data.precioBrasil || 0} ${data.esOferta ? '🔥 OFERTA' : ''}
            ${!data.activo ? '<br><small style="color:red;">️ SUSPENDIDO</small>' : ''}
          </div>
          <div style="display:flex;gap:5px;">
            <button class="btn btn-sm" style="background:#0038A8;color:white;" onclick="editProducto('${d.id}','${data.nombre.replace(/'/g, "\\'")}',${data.precioBrasil},'${data.seccion || ''}',${data.esOferta})">✏️ Editar</button>
            <button class="btn btn-sm" style="background:${data.activo ? '#FF6B00' : '#28A745'};color:white;" onclick="toggleSuspender('${d.id}',${data.activo})">${data.activo ? '⏸️ Suspender' : '▶️ Activar'}</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">🗑️</button>
          </div>
        `;
        cont.appendChild(div);
      });
    }
    const statEl = document.getElementById('stat-productos-com');
    if (statEl) statEl.textContent = snap.size;
  } catch (err) { console.error('Error productos:', err); }
}

// Editar producto: llena el formulario para editar
window.editProducto = (id, nombre, precio, seccion, esOferta) => {
  document.getElementById('prod-nombre').value = nombre;
  document.getElementById('prod-precio').value = precio;
  document.getElementById('prod-precio-uy').value = '';
  document.getElementById('prod-seccion').value = seccion;
  document.getElementById('prod-es-oferta').value = esOferta ? 'true' : 'false';

  // Guardar ID en dataset para que addProducto sepa que es edición
  const btnAdd = document.getElementById('btn-add-producto');
  btnAdd.dataset.editId = id;
  btnAdd.textContent = '💾 Guardar Cambios';
  btnAdd.classList.remove('btn-success');
  btnAdd.style.background = '#FF6B00';

  // Cambiar comportamiento del botón
  btnAdd.onclick = async () => {
    const nuevoNombre = document.getElementById('prod-nombre').value.trim();
    const nuevoPrecio = parseFloat(document.getElementById('prod-precio').value);
    const nuevaSeccion = document.getElementById('prod-seccion').value;
    if (!nuevoNombre || !nuevoPrecio) return showAlert('Completá nombre y precio', 'warning');
    try {
      await updateDoc(doc(db, 'productos', id), {
        nombre: nuevoNombre,
        precioBrasil: nuevoPrecio,
        seccion: nuevaSeccion || '',
        esOferta: document.getElementById('prod-es-oferta').value === 'true',
        updatedAt: serverTimestamp()
      });
      showAlert('Producto actualizado', 'success');
      // Resetear botón
      btnAdd.dataset.editId = '';
      btnAdd.textContent = ' Agregar Producto';
      btnAdd.style.background = '';
      btnAdd.classList.add('btn-success');
      btnAdd.onclick = null;
      document.getElementById('btn-add-producto')?.addEventListener('click', addProducto);
      loadProductos();
    } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
  };

  // Scroll al formulario
  document.getElementById('btn-add-producto')?.scrollIntoView({ behavior: 'smooth' });
};

// Suspender / Activar producto
window.toggleSuspender = async (id, activo) => {
  try {
    await updateDoc(doc(db, 'productos', id), { activo: !activo, updatedAt: serverTimestamp() });
    showAlert(activo ? 'Producto suspendido' : 'Producto reactivado', 'success');
    loadProductos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

window.deleteProducto = async (id) => {
  if (!confirm('¿Eliminar producto?')) return;
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

// ========== EXCURSIONES (vista comerciante) ==========
async function loadExcursionesComerciante() {
  const cont = document.getElementById('lista-excursiones-com');
  if (!cont) return;
  try {
    const snap = await getDocs(collection(db, 'excursiones'));
    const excursiones = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.publicada && data.activa) excursiones.push({ id: d.id, ...data });
    });
    excursiones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    if (excursiones.length === 0) {
      cont.innerHTML = '<p style="text-align:center;color:#666;">No hay excursiones programadas</p>';
      return;
    }
    cont.innerHTML = '';
    excursiones.forEach(exc => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>🚌 ${exc.ruta || 'Excursión'}</h3>
        <div class="grid grid-2" style="margin:10px 0;">
          <div><strong>Fecha:</strong> ${exc.fecha}</div>
          <div><strong>Horario:</strong> ${exc.horaSalida} - ${exc.horaRetorno}</div>
          <div><strong>Punto:</strong> ${exc.punto}</div>
          <div><strong>Pasajeros:</strong> ${exc.lugaresOcupados || 0}/${exc.lugaresTotales}</div>
        </div>
        <p style="color:#666;font-size:0.9rem;">
          Admin: ${exc.adminNombre} | ${exc.adminTelefono || ''}
        </p>
        <div style="background:#fff3cd;padding:10px;border-radius:8px;margin-top:10px;">
          💡 <strong>Ideas:</strong> Ofrecé descuentos esos días, prepará combos especiales, o promocioná productos destacados.
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error excursiones:', err); }
}

// ========== CARGAR PERFIL EXISTENTE ==========
async function loadPerfilExistente() {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', sessionStorage.getItem('userEmail'))));
    if (!userDoc.empty) {
      const docId = userDoc.docs[0].id;
      comercioDocId = docId;
      const data = userDoc.docs[0].data();
      if (data.nombreComercio) document.getElementById('perfil-nombre').value = data.nombreComercio;
      if (data.tipo) document.getElementById('perfil-tipo').value = data.tipo;
      if (data.direccion) document.getElementById('perfil-direccion').value = data.direccion;
      if (data.telefono) document.getElementById('perfil-telefono').value = data.telefono;
      if (data.logo) document.getElementById('perfil-logo').value = data.logo;
      if (data.horarios) document.getElementById('perfil-horarios').value = data.horarios;
      if (data.logo) {
        const container = document.getElementById('foto-container');
        container.innerHTML = `<img src="${data.logo}" class="foto-preview" alt="Foto del comercio">`;
      }
      if (data.lat && data.lng) {
        document.getElementById('perfil-lat').value = data.lat;
        document.getElementById('perfil-lng').value = data.lng;
        setTimeout(() => {
          if (mapaPerfil) {
            const nuevoMarker = L.marker([data.lat, data.lng]).addTo(mapaPerfil);
            nuevoMarker.bindPopup('📍 Tu comercio').openPopup();
          }
        }, 1000);
      }
      if (data.cambioUsdCompra) document.getElementById('cambio-usd-compra').value = data.cambioUsdCompra;
      if (data.cambioUsdVenta) document.getElementById('cambio-usd-venta').value = data.cambioUsdVenta;
      if (data.cambioBrlCompra) document.getElementById('cambio-brl-compra').value = data.cambioBrlCompra;
      if (data.cambioBrlVenta) document.getElementById('cambio-brl-venta').value = data.cambioBrlVenta;
      if (data.cambioFecha) document.getElementById('cambio-fecha').textContent = new Date(data.cambioFecha).toLocaleString('es-UY');
    }
  } catch (err) { console.error('Error cargando perfil:', err); }
}

// ========== INICIALIZACIÓN ==========
loadSecciones();
loadPerfilExistente();
loadStatsGenerales();
loadSuscripcion();
loadProductos();
loadVideos();
loadExcursionesComerciante();
initMapaPerfil();