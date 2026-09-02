// Panel Comerciante - Precios Chuy
import { db, storage } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, limit, serverTimestamp
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
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Error al comprimir')); }, 'image/jpeg', calidad);
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
        titulo.textContent = '🎉 Período de prueba activo';
        texto.innerHTML = `Te quedan <strong>${diasRestantesGlobal}</strong> días gratis`;
        if (diasEl) diasEl.textContent = diasRestantesGlobal;
        if (barra) barra.style.width = porcentaje + '%';
      }
    }
  } catch (err) { console.error('Error suscripción:', err); }
}

// ========== MAPA ==========
let mapaPerfil;
let markerPerfil;

function initMapaPerfil() {
  const contenedor = document.getElementById('mapa-perfil');
  if (!contenedor || mapaPerfil) return;
  mapaPerfil = L.map('mapa-perfil').setView([-33.7574, -53.4614], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapaPerfil);
  mapaPerfil.on('click', function(e) {
    const { lat, lng } = e.latlng;
    if (markerPerfil) mapaPerfil.removeLayer(markerPerfil);
    markerPerfil = L.marker([lat, lng]).addTo(mapaPerfil);
    markerPerfil.bindPopup('📍 Tu comercio').openPopup();
    document.getElementById('perfil-lat').value = lat.toFixed(6);
    document.getElementById('perfil-lng').value = lng.toFixed(6);
  });
}

// ========== SUBIR FOTO ==========
document.getElementById('btn-subir-foto')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('foto-input');
  const file = fileInput.files[0];
  if (!file) return showAlert('Seleccioná una imagen primero', 'warning');

  if (!comercioDocId) {
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', sessionStorage.getItem('userEmail'))));
      if (!userDoc.empty) comercioDocId = userDoc.docs[0].id;
      else return showAlert('No se encontró tu perfil. Guardá el perfil primero.', 'danger');
    } catch (err) { return showAlert('Error al buscar perfil.', 'danger'); }
  }

  const btn = document.getElementById('btn-subir-foto');
  btn.disabled = true;
  btn.textContent = '⏳ Comprimiendo...';

  try {
    const blobComprimido = await comprimirImagen(file, 800, 0.7);
    btn.textContent = '📤 Subiendo...';
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
      if (!isNaN(lat) && !isNaN(lng)) { dataToUpdate.lat = lat; dataToUpdate.lng = lng; }
      await updateDoc(doc(db, 'users', comercioDocId), dataToUpdate);
      document.getElementById('cambio-fecha').textContent = new Date().toLocaleString('es-UY');
      showAlert('Perfil actualizado', 'success');
    }
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

// ========== SECCIONES ==========
let seccionesMap = {};
async function loadSeccionesComerciante() {
  const selectSeccion = document.getElementById('prod-seccion');
  if (!selectSeccion) return;
  try {
    const snap = await getDocs(collection(db, 'secciones'));
    selectSeccion.innerHTML = '<option value="">-- Seleccionar --</option>';
    seccionesMap = {};
    snap.forEach(d => {
      const data = d.data();
      const option = document.createElement('option');
      option.value = d.id;
      option.textContent = `${data.icono || ''} ${data.nombre}`;
      selectSeccion.appendChild(option);
      if (data.nombre) seccionesMap[data.nombre.trim().toLowerCase()] = d.id;
    });
    const optNueva = document.createElement('option');
    optNueva.value = '__nueva__';
    optNueva.textContent = '➕ Crear nueva sección...';
    selectSeccion.appendChild(optNueva);
    console.log(`✅ ${snap.size} secciones cargadas`);
  } catch (err) { console.error('Error cargando secciones:', err); }
}

window.onSeccionChange = function() {
  const select = document.getElementById('prod-seccion');
  const box = document.getElementById('nueva-seccion-box');
  if (!select || !box) return;
  box.style.display = select.value === '__nueva__' ? 'flex' : 'none';
};

document.getElementById('btn-crear-seccion')?.addEventListener('click', async () => {
  const input = document.getElementById('nueva-seccion-nombre');
  const nombre = (input.value || '').trim();
  if (!nombre) { showAlert('Escribí un nombre para la sección', 'warning'); return; }
  if (seccionesMap[nombre.toLowerCase()]) {
    showAlert('Ya existe una sección con ese nombre', 'warning');
    return;
  }
  try {
    await addDoc(collection(db, 'secciones'), { nombre, icono: '🏷️', creadoPor: userId, createdAt: serverTimestamp() });
    showAlert(`Sección "${nombre}" creada`, 'success');
    input.value = '';
    document.getElementById('nueva-seccion-box').style.display = 'none';
    await loadSeccionesComerciante();
    // Dejar seleccionada la sección recién creada
    const select = document.getElementById('prod-seccion');
    const id = seccionesMap[nombre.toLowerCase()];
    if (select && id) select.value = id;
  } catch (err) {
    console.error('Error creando sección:', err);
    showAlert('Error al crear la sección. Puede que falte actualizar los permisos en Firestore.', 'danger');
  }
});

// ========== PRODUCTOS ==========
document.getElementById('btn-add-producto')?.addEventListener('click', addProducto);
async function addProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const seccionId = document.getElementById('prod-seccion').value;
  if (!nombre || !precio) return showAlert('Completá nombre y precio', 'warning');
  if (!seccionId) return showAlert('Seleccioná una sección', 'warning');

  try {
    await addDoc(collection(db, 'productos'), {
      nombre, precioBrasil: precio,
      precioUruguay: parseFloat(document.getElementById('prod-precio-uy').value) || 0,
      comercioId: userId, comercioNombre: sessionStorage.getItem('userName'),
      seccionId, imagen: document.getElementById('prod-imagen').value.trim() || null,
      esOferta: document.getElementById('prod-es-oferta').value === 'true',
      activo: true, suspendido: false, createdAt: serverTimestamp()
    });
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio').value = '';
    document.getElementById('prod-precio-uy').value = '';
    document.getElementById('prod-imagen').value = '';
    document.getElementById('prod-seccion').value = '';
    document.getElementById('prod-es-oferta').value = 'false';
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
    if (snap.empty) { cont.innerHTML = '<p style="color:#666;">Sin productos cargados</p>'; return; }
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:15px;border-bottom:1px solid #eee;';
      const estadoBadge = data.suspendido ?
        '<span style="background:#FF6B00;color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem;">SUSPENDIDO</span>' :
        (data.esOferta ? '<span style="background:#009C3B;color:white;padding:3px 8px;border-radius:4px;font-size:0.8rem;">🔥 OFERTA</span>' : '');
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
          <strong>${data.nombre}</strong>
          ${estadoBadge}
        </div>
        <div style="color:#666;font-size:0.9rem;margin-bottom:10px;">
          R$ ${data.precioBrasil || 0} ${data.precioUruguay ? `| $U ${data.precioUruguay}` : ''}
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn btn-sm" style="background:#0038A8;color:white;" onclick="modificarProducto('${d.id}', '${data.nombre}', ${data.precioBrasil}, '${data.imagen || ''}', ${data.esOferta})">✏️ Modificar</button>
          <button class="btn btn-sm" style="background:${data.suspendido ? '#009C3B' : '#FF6B00'};color:white;" onclick="toggleSuspenderProducto('${d.id}', ${data.suspendido})">
            ${data.suspendido ? '▶️ Activar' : '⏸️ Suspender'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">🗑️ Eliminar</button>
        </div>
      `;
      cont.appendChild(div);
    });
    const statEl = document.getElementById('stat-productos-com');
    if (statEl) statEl.textContent = snap.size;
  } catch (err) { console.error('Error productos:', err); }
}

window.deleteProducto = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;
  try { await deleteDoc(doc(db, 'productos', id)); showAlert('Producto eliminado', 'success'); loadProductos(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

window.modificarProducto = (id, nombre, precio, imagen, esOferta) => {
  const nuevoNombre = prompt('Nombre del producto:', nombre);
  if (nuevoNombre === null) return;
  const nuevoPrecio = parseFloat(prompt('Precio Brasil (R$):', precio));
  if (isNaN(nuevoPrecio)) return;
  const nuevaImagen = prompt('URL de imagen (opcional):', imagen) || '';
  const nuevaOferta = confirm('¿Es oferta especial?');
  updateDoc(doc(db, 'productos', id), {
    nombre: nuevoNombre, precioBrasil: nuevoPrecio, imagen: nuevaImagen, esOferta: nuevaOferta
  }).then(() => { showAlert('Producto actualizado', 'success'); loadProductos(); })
    .catch(err => { showAlert(`Error: ${err.message}`, 'danger'); });
};

window.toggleSuspenderProducto = async (id, suspendido) => {
  const nuevoEstado = !suspendido;
  if (!confirm(nuevoEstado ? '¿Activar este producto?' : '¿Suspender este producto?')) return;
  try {
    await updateDoc(doc(db, 'productos', id), { suspendido: nuevoEstado });
    showAlert(nuevoEstado ? 'Producto activado' : 'Producto suspendido', 'success');
    loadProductos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
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
      titulo, descripcion: document.getElementById('video-desc').value.trim(),
      url, comercioId: userId, vence: document.getElementById('video-vence').value || null,
      activo: true, createdAt: serverTimestamp()
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
    if (snap.empty) { cont.innerHTML = '<p style="color:#666;">Sin ofertas publicadas</p>'; return; }
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
    const statEl = document.getElementById('stat-ofertas-com');
    if (statEl) statEl.textContent = snap.size;
  } catch (err) { console.error('Error videos:', err); }
}

window.deleteVideo = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'videos', id)); loadVideos(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== EXCURSIONES ==========
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
    if (excursiones.length === 0) { cont.innerHTML = '<p style="text-align:center;color:#666;">No hay excursiones programadas</p>'; return; }
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
        <p style="color:#666;font-size:0.9rem;">Admin: ${exc.adminNombre} | ${exc.adminTelefono || ''}</p>
        <div style="background:#fff3cd;padding:10px;border-radius:8px;margin-top:10px;">
          💡 <strong>Ideas:</strong> Ofrecé descuentos esos días, prepará combos especiales.
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error excursiones:', err); }
}

// ========== CARGAR PERFIL ==========
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
        if (mapaPerfil) {
          const nuevoMarker = L.marker([data.lat, data.lng]).addTo(mapaPerfil);
          nuevoMarker.bindPopup('📍 Tu comercio').openPopup();
        }
      }
      if (data.cambioUsdCompra) document.getElementById('cambio-usd-compra').value = data.cambioUsdCompra;
      if (data.cambioUsdVenta) document.getElementById('cambio-usd-venta').value = data.cambioUsdVenta;
      if (data.cambioBrlCompra) document.getElementById('cambio-brl-compra').value = data.cambioBrlCompra;
      if (data.cambioBrlVenta) document.getElementById('cambio-brl-venta').value = data.cambioBrlVenta;
      if (data.cambioFecha) document.getElementById('cambio-fecha').textContent = new Date(data.cambioFecha).toLocaleString('es-UY');
      const statVistas = document.getElementById('stat-vistas-com');
      if (statVistas) statVistas.textContent = data.vistas || 0;
    }
  } catch (err) { console.error('Error cargando perfil:', err); }
}

// ========== IMPORTAR PRODUCTOS POR CSV ==========

// Parser simple de CSV, soporta campos entre comillas con comas adentro
function parsearCSV(texto) {
  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;
  const limpio = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') { campo += '"'; i++; }
        else entreComillas = false;
      } else campo += c;
    } else {
      if (c === '"') entreComillas = true;
      else if (c === ',') { fila.push(campo); campo = ''; }
      else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
      else campo += c;
    }
  }
  if (campo.length > 0 || fila.length > 0) { fila.push(campo); filas.push(fila); }
  return filas.filter(f => f.some(c => c.trim() !== ''));
}

document.getElementById('btn-descargar-plantilla')?.addEventListener('click', () => {
  const contenido = 'nombre,seccion,precioBrasil,precioUruguay,imagen,esOferta\n' +
    'Arroz 1kg,Almacen,8.50,120,https://ejemplo.com/arroz.jpg,no\n' +
    'Whisky Old Times,Bebidas,45.90,,,,si\n';
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-productos.csv';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-importar-csv')?.addEventListener('click', async () => {
  const fileInput = document.getElementById('csv-productos-file');
  const resultado = document.getElementById('resultado-importacion');
  const file = fileInput.files[0];
  if (!file) { showAlert('Seleccioná un archivo CSV', 'warning'); return; }

  resultado.innerHTML = '<p style="color:#666;">Leyendo archivo...</p>';

  try {
    const texto = await file.text();
    const filas = parsearCSV(texto);
    if (filas.length < 2) {
      resultado.innerHTML = '<p style="color:#dc3545;">El archivo está vacío o no tiene datos.</p>';
      return;
    }

    const encabezado = filas[0].map(h => h.trim().toLowerCase());
    const idxNombre = encabezado.indexOf('nombre');
    const idxSeccion = encabezado.indexOf('seccion');
    const idxPrecioBr = encabezado.indexOf('preciobrasil');
    const idxPrecioUy = encabezado.indexOf('preciouruguay');
    const idxImagen = encabezado.indexOf('imagen');
    const idxOferta = encabezado.indexOf('esoferta');

    if (idxNombre === -1 || idxSeccion === -1 || idxPrecioBr === -1) {
      resultado.innerHTML = '<p style="color:#dc3545;">Faltan columnas obligatorias: nombre, seccion, precioBrasil. Descargá la plantilla de ejemplo.</p>';
      return;
    }

    let agregados = 0;
    const errores = [];
    const filasDeDatos = filas.slice(1);

    resultado.innerHTML = `<p style="color:#666;">Importando 0 / ${filasDeDatos.length}...</p>`;

    for (let i = 0; i < filasDeDatos.length; i++) {
      const f = filasDeDatos[i];
      const nombre = (f[idxNombre] || '').trim();
      const seccionTexto = (f[idxSeccion] || '').trim();
      const precioBrasil = parseFloat((f[idxPrecioBr] || '').replace(',', '.'));
      const precioUruguay = idxPrecioUy > -1 ? parseFloat((f[idxPrecioUy] || '').replace(',', '.')) || 0 : 0;
      const imagen = idxImagen > -1 ? (f[idxImagen] || '').trim() || null : null;
      const ofertaTexto = idxOferta > -1 ? (f[idxOferta] || '').trim().toLowerCase() : 'no';
      const esOferta = ['si', 'sí', 'yes', 'true', '1'].includes(ofertaTexto);

      const fila = i + 2; // +2 porque la fila 1 es el encabezado y los índices empiezan en 0

      if (!nombre) { errores.push(`Fila ${fila}: falta el nombre`); continue; }
      if (isNaN(precioBrasil)) { errores.push(`Fila ${fila}: precioBrasil inválido`); continue; }

      const seccionId = seccionesMap[seccionTexto.toLowerCase()];
      if (!seccionId) { errores.push(`Fila ${fila}: sección "${seccionTexto}" no existe`); continue; }

      try {
        await addDoc(collection(db, 'productos'), {
          nombre, precioBrasil, precioUruguay,
          comercioId: userId, comercioNombre: sessionStorage.getItem('userName'),
          seccionId, imagen, esOferta,
          activo: true, suspendido: false, createdAt: serverTimestamp()
        });
        agregados++;
      } catch (err) {
        errores.push(`Fila ${fila}: error al guardar (${err.message})`);
      }

      resultado.innerHTML = `<p style="color:#666;">Importando ${i + 1} / ${filasDeDatos.length}...</p>`;
    }

    let html = `<p style="color:#009C3B;font-weight:bold;">✅ ${agregados} producto(s) importado(s) correctamente.</p>`;
    if (errores.length > 0) {
      html += `<p style="color:#dc3545;font-weight:bold;">⚠️ ${errores.length} fila(s) con problemas:</p><ul style="color:#dc3545;font-size:0.9rem;">`;
      errores.forEach(e => { html += `<li>${e}</li>`; });
      html += '</ul>';
    }
    resultado.innerHTML = html;
    fileInput.value = '';
    loadProductos();
  } catch (err) {
    console.error('Error importando CSV:', err);
    resultado.innerHTML = `<p style="color:#dc3545;">Error al procesar el archivo: ${err.message}</p>`;
  }
});

// ========== LO QUE BUSCAN LOS CLIENTES ==========
async function loadMasBuscados() {
  const cont = document.getElementById('lista-mas-buscados');
  if (!cont) return;
  try {
    // Nombres de mis propios productos (para detectar qué NO tengo)
    const misProductosSnap = await getDocs(query(collection(db, 'productos'), where('comercioId', '==', userId)));
    const misNombres = [];
    misProductosSnap.forEach(d => {
      const n = (d.data().nombre || '').toLowerCase();
      if (n) misNombres.push(n);
    });
    const yaLoTengo = (termino) => misNombres.some(n => n.includes(termino) || termino.includes(n));

    // Top de términos buscados en toda la app
    const q = query(collection(db, 'busquedas'), orderBy('conteo', 'desc'), limit(20));
    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<p style="color:#666;">Todavía no hay suficientes búsquedas registradas.</p>';
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    snap.forEach(d => {
      const data = d.data();
      const termino = data.termino || d.id;
      const conteo = data.conteo || 0;
      const esOportunidad = !yaLoTengo(termino);
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:8px;background:${esOportunidad ? '#FFF3CD' : '#f8f9fa'};border-left:4px solid ${esOportunidad ? '#FF6B00' : '#ddd'};">
          <span>${esOportunidad ? '🎯 ' : ''}${termino}</span>
          <span style="font-weight:bold;color:#0038A8;">${conteo} búsqueda${conteo === 1 ? '' : 's'}</span>
        </div>`;
    });
    html += '</div>';
    cont.innerHTML = html;
  } catch (err) {
    console.error('Error cargando más buscados:', err);
    cont.innerHTML = '<p style="color:#dc3545;">Error al cargar este dato.</p>';
  }
}

// ========== INICIALIZACIÓN ==========
loadPerfilExistente();
loadStatsGenerales();
loadSuscripcion();
loadSeccionesComerciante();
loadProductos();
loadVideos();
loadExcursionesComerciante();
loadMasBuscados();
initMapaPerfil();