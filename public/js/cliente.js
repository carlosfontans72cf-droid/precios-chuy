// Panel Cliente - Precios Chuy
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========== OFERTAS ==========
async function loadOfertas() {
  const cont = document.getElementById('feed-ofertas');
  if (!cont) return;
  try {
    const snap = await getDocs(query(collection(db, 'productos'), orderBy('createdAt', 'desc')));
    if (snap.empty) {
      cont.innerHTML = '<p style="text-align:center;color:#666;">Aún no hay ofertas publicadas</p>';
      return;
    }
    cont.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      const ahorro = data.precioUruguay - data.precioBrasil * 10; // Estimado
      const div = document.createElement('div');
      div.className = 'oferta-card';
      div.innerHTML = `
        ${data.imagen ? `<img src="${data.imagen}" alt="${data.nombre}">` : ''}
        <div class="oferta-info">
          <h3>${data.nombre}</h3>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;">
            <span class="precio-uruguay">🇾 $${data.precioUruguay || 0}</span>
            <span class="precio-brasil">🇧🇷 R$${data.precioBrasil || 0}</span>
          </div>
          ${ahorro > 0 ? `<span class="ahorro-badge">Ahorrás $${ahorro.toFixed(0)}</span>` : ''}
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error('Error cargando ofertas:', err);
  }
}

// ========== PRODUCTOS ==========
async function loadProductos() {
  const cont = document.getElementById('lista-productos-cliente');
  const selectSeccion = document.getElementById('filtrar-seccion');
  if (!cont) return;

  // Cargar secciones
  try {
    const seccionesSnap = await getDocs(collection(db, 'secciones'));
    if (selectSeccion) {
      selectSeccion.innerHTML = '<option value="">Todas</option>';
      seccionesSnap.forEach(d => {
        const data = d.data();
        selectSeccion.innerHTML += `<option value="${d.id}">${data.icono || ''} ${data.nombre}</option>`;
      });
    }
  } catch (err) {
    console.error('Error cargando secciones:', err);
  }

  // Cargar productos
  try {
    const snap = await getDocs(collection(db, 'productos'));
    if (snap.empty) {
      cont.innerHTML = '<p style="text-align:center;color:#666;grid-column:span 2;">Sin productos cargados</p>';
      return;
    }
    cont.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        ${data.imagen ? `<img src="${data.imagen}" alt="${data.nombre}">` : '<div style="height:150px;background:#f0f0f0;border-radius:8px;"></div>'}
        <h3>${data.nombre}</h3>
        <div style="display:flex;justify-content:space-between;margin-top:10px;">
          <span class="precio-uruguay">🇾 $${data.precioUruguay || 0}</span>
          <span class="precio-brasil">🇧🇷 R$${data.precioBrasil || 0}</span>
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
}

// ========== COMERCIOS ==========
async function loadComercios() {
  const cont = document.getElementById('lista-comercios-cliente');
  if (!cont) return;
  try {
    const snap = await getDocs(collection(db, 'comercios'));
    if (snap.empty) {
      cont.innerHTML = '<p style="text-align:center;color:#666;">Sin comercios registrados</p>';
      return;
    }
    cont.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      if (!data.activo) return;
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>${data.nombre}</h3>
        <p style="color:#666;">${data.tipo}</p>
        <p><small>${data.direccion || 'Sin dirección'}</small></p>
        ${data.telefono ? `<p><small>📱 ${data.telefono}</small></p>` : ''}
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error('Error cargando comercios:', err);
  }
}

// ========== EXCURSIONES ==========
async function loadExcursiones() {
  const cont = document.getElementById('lista-excursiones-cliente');
  if (!cont) return;
  try {
    const snap = await getDocs(collection(db, 'excursiones'));
    if (snap.empty) {
      cont.innerHTML = '<p style="text-align:center;color:#666;">No hay excursiones programadas</p>';
      return;
    }
    cont.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      if (!data.publicada) return;
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>🚌 ${data.fecha} - ${data.horaSalida} hs</h3>
        <p><strong>Punto de encuentro:</strong> ${data.punto}</p>
        <p><strong>Retorno:</strong> ${data.horaRetorno} hs</p>
        <p><strong>Precio:</strong> $${data.precio}</p>
        <p><strong>Lugares:</strong> ${data.lugaresOcupados || 0}/${data.lugares}</p>
        ${data.van ? `<p><small>Van: ${data.van}</small></p>` : ''}
        <button class="btn btn-success" style="margin-top:10px;">Reservar lugar</button>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error('Error cargando excursiones:', err);
  }
}

// ========== INICIALIZACIÓN ==========
loadOfertas();
loadProductos();
loadComercios();
loadExcursiones();