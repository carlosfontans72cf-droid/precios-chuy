// Panel Cliente - Precios Chuy
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { mostrarPremiumCliente } from './pagos-ui.js';

const userId = sessionStorage.getItem('userId');
const userName = sessionStorage.getItem('userName');

// Hacer disponible globalmente
window.mostrarPremium = () => mostrarPremiumCliente(userId);

// ========== CARGAR ESTADÍSTICAS (contador público) ==========
async function loadStats() {
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

    // Mostrar banner premium solo si NO es premium
    const banner = document.getElementById('premium-banner');
    if (banner) {
      // Por ahora siempre visible (después lo conectamos con el plan real del usuario)
      banner.style.display = 'block';
    }
  } catch (err) {
    console.error('Error cargando stats:', err);
  }
}

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
      const ahorro = data.precioUruguay > 0 ? Math.round(data.precioUruguay - data.precioBrasil * 10) : 0;
      const div = document.createElement('div');
      div.className = 'oferta-card';
      div.innerHTML = `
        ${data.imagen ? `<img src="${data.imagen}" alt="${data.nombre}" onerror="this.style.display='none'">` : '<div style="height:150px;background:#f0f0f0;"></div>'}
        <div class="oferta-info">
          <h3>${data.nombre}</h3>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;">
            <span class="precio-uruguay">🇺🇾 $${data.precioUruguay || 0}</span>
            <span class="precio-brasil">🇧🇷 R$${data.precioBrasil || 0}</span>
          </div>
          ${ahorro > 0 ? `<span class="ahorro-badge">Ahorrás $${ahorro}</span>` : ''}
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

  try {
    const seccionesSnap = await getDocs(collection(db, 'secciones'));
    if (selectSeccion) {
      selectSeccion.innerHTML = '<option value="">Todas</option>';
      seccionesSnap.forEach(d => {
        const data = d.data();
        selectSeccion.innerHTML += `<option value="${d.id}">${data.icono || ''} ${data.nombre}</option>`;
      });
    }
  } catch (err) { console.error('Error secciones:', err); }

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
        ${data.imagen ? `<img src="${data.imagen}" alt="${data.nombre}" onerror="this.style.display='none'">` : '<div style="height:150px;background:#f0f0f0;border-radius:8px;"></div>'}
        <h3>${data.nombre}</h3>
        <div style="display:flex;justify-content:space-between;margin-top:10px;">
          <span class="precio-uruguay">🇺🇾 $${data.precioUruguay || 0}</span>
          <span class="precio-brasil">🇧🇷 R$${data.precioBrasil || 0}</span>
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error productos:', err); }
}

// ========== MAPA ==========
let mapa;
function initMapa() {
  if (mapa) return; // Ya inicializado
  
  // Coordenadas del Chui, Brasil
  const chuiCenter = [-33.7574, -53.4614];
  
  mapa = L.map('mapa-comercios').setView(chuiCenter, 14);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapa);
}

async function loadMapa() {
  initMapa();
  
  try {
    const snap = await getDocs(collection(db, 'comercios'));
    
    if (snap.empty) {
      console.log('No hay comercios para mostrar en el mapa');
      return;
    }
    
    snap.forEach(d => {
      const data = d.data();
      if (!data.activo) return;
      
      // Usar coordenadas del comercio o default al Chui
      const lat = data.lat || -33.7574;
      const lng = data.lng || -53.4614;
      
      // Color del pin según tipo
      const colores = {
        supermercado: '🛒',
        carniceria: '🥩',
        farmacia: '💊',
        bebidas: '',
        ropa: '👕',
        electronica: '📱',
        panaderia: '🍞',
        ferreteria: '🔧',
        otro: '🏪'
      };
      
      const icono = colores[data.tipo] || '';
      
      const marker = L.marker([lat, lng]).addTo(mapa);
      marker.bindPopup(`
        <div style="min-width:200px;">
          <h3 style="margin:0 0 10px 0; color:#0038A8;">${icono} ${data.nombre}</h3>
          <p style="margin:5px 0;"><strong>Tipo:</strong> ${data.tipo}</p>
          <p style="margin:5px 0;"><strong>📍</strong> ${data.direccion || 'Dirección no disponible'}</p>
          <p style="margin:5px 0;"><strong>📱</strong> ${data.telefono || 'No disponible'}</p>
          <p style="margin:5px 0;"><strong>⏰</strong> ${data.horarios || 'No disponible'}</p>
          ${data.metodos_pago && data.metodos_pago.length > 0 ? 
            `<p style="margin:5px 0;"><strong>💳</strong> ${data.metodos_pago.join(', ')}</p>` : ''}
        </div>
      `);
    });
  } catch (err) {
    console.error('Error cargando mapa:', err);
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
        <p><small>📍 ${data.direccion || 'Sin dirección'}</small></p>
        ${data.telefono ? `<p><small>📱 ${data.telefono}</small></p>` : ''}
      `;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error comercios:', err); }
}

// ========== EXCURSIONES ==========
async function loadExcursiones() {
  const cont = document.getElementById('lista-excursiones-cliente');
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
      const porcentaje = (exc.lugaresOcupados / exc.lugaresTotales) * 100;
      const whatsappLink = exc.adminWhatsapp ? `https://wa.me/${exc.adminWhatsapp.replace(/[^0-9]/g, '')}` : '#';
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>🚌 ${exc.ruta || 'Excursión'}</h3>
        <p><strong>Admin:</strong> ${exc.adminNombre || 'Sin nombre'}</p>
        <div class="grid grid-2" style="margin:10px 0;">
          <div><strong>Fecha:</strong> ${exc.fecha}</div>
          <div><strong>Horario:</strong> ${exc.horaSalida} - ${exc.horaRetorno}</div>
          <div><strong>Punto:</strong> ${exc.punto}</div>
          <div><strong>Precio:</strong> $${exc.precio}</div>
          ${exc.sena ? `<div><strong>Seña:</strong> $${exc.sena} por persona</div>` : ''}
          ${exc.adminWhatsapp ? `<div><strong>Contacto:</strong> <a href="${whatsappLink}" target="_blank" style="color:#25D366; font-weight:bold;">WhatsApp</a></div>` : ''}
        </div>
        ${exc.descripcion ? `<p style="color:#666;">${exc.descripcion}</p>` : ''}
        <div style="margin:10px 0;">
          <strong>Lugares:</strong> ${exc.lugaresOcupados}/${exc.lugaresTotales}
          <div style="background:#ddd; border-radius:10px; overflow:hidden; height:20px; margin-top:5px;">
            <div style="width:${porcentaje}%; background:#009C3B; height:100%;"></div>
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-success" onclick="reservarExcursion('${exc.id}', '${exc.adminNombre}', '${exc.fecha}', '${exc.ruta}', '${exc.adminEmail || ''}', ${exc.sena || 0}, '${exc.adminWhatsapp || ''}')">
            ${exc.lugaresOcupados >= exc.lugaresTotales ? 'Completa' : 'Reservar lugar'}
          </button>
          ${exc.adminWhatsapp ? `<a href="${whatsappLink}" target="_blank" class="btn" style="background:#25D366; color:white; text-decoration:none;">💬 Contactar Admin</a>` : ''}
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error excursiones:', err); }
}

window.reservarExcursion = (excId, adminNombre, fecha, ruta, adminEmail, sena, adminWhatsapp) => {
  const senaInfo = sena > 0 ? `
    <div style="background:#fff3cd; padding:15px; border-radius:8px; margin:15px 0; border-left:4px solid #ffc107;">
      <strong>Seña requerida:</strong> $${sena} por persona<br>
      <small>Contactá al admin por WhatsApp para coordinar el pago de la seña.</small>
      ${adminWhatsapp ? `<br><a href="https://wa.me/${adminWhatsapp.replace(/[^0-9]/g, '')}" target="_blank" style="color:#25D366; font-weight:bold;">WhatsApp del admin</a>` : ''}
    </div>
  ` : '';
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:16px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;">
      <h2 style="color:#0038A8;">Reservar lugar</h2>
      <p><strong>${ruta}</strong> - ${fecha}</p>
      <p>Admin: ${adminNombre}</p>
      ${senaInfo}
      <div class="form-group"><label>Tu nombre</label><input type="text" id="res-nombre" class="form-control" value="${sessionStorage.getItem('userName') || ''}"></div>
      <div class="form-group"><label>Teléfono / WhatsApp</label><input type="text" id="res-telefono" class="form-control" placeholder="+598 99..."></div>
      <div class="form-group"><label>Cantidad de personas</label><input type="number" id="res-personas" class="form-control" value="1" min="1"></div>
      <div id="res-error" style="color:#EF3340;text-align:center;min-height:20px;"></div>
      <button id="res-confirmar" class="btn btn-success btn-block">Confirmar reserva</button>
      <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-block" style="margin-top:10px;background:#ddd;">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  document.getElementById('res-confirmar').addEventListener('click', async () => {
    const nombre = document.getElementById('res-nombre').value.trim();
    const telefono = document.getElementById('res-telefono').value.trim();
    const personas = parseInt(document.getElementById('res-personas').value) || 1;
    const errDiv = document.getElementById('res-error');

    if (!nombre || !telefono) {
      errDiv.textContent = 'Completá nombre y teléfono';
      return;
    }

    try {
      const { addDoc, collection, serverTimestamp, updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const { db } = await import("./firebase-config.js");

      await addDoc(collection(db, 'reservas'), {
        excursionId: excId,
        adminId: userId,
        adminNombre,
        adminEmail,
        adminWhatsapp,
        ruta,
        fechaExcursion: fecha,
        sena: sena,
        clienteId: userId,
        clienteNombre: nombre,
        clienteTelefono: telefono,
        personas,
        fechaReserva: new Date().toISOString(),
        estado: 'pendiente'
      });

      // Actualizar lugares ocupados
      const excRef = doc(db, 'excursiones', excId);
      const excSnap = await (await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")).getDoc(excRef);
      if (excSnap.exists()) {
        const data = excSnap.data();
        await updateDoc(excRef, { lugaresOcupados: (data.lugaresOcupados || 0) + personas });
      }

      modal.remove();
      showAlert('Reserva enviada. Contactá al admin por WhatsApp para pagar la seña.', 'success');
      loadExcursiones();
    } catch (err) {
      errDiv.textContent = `Error: ${err.message}`;
    }
  });
};

// ========== INICIALIZACIÓN ==========
loadStats();
loadOfertas();
loadProductos();
loadMapa();
loadComercios();
loadExcursiones();