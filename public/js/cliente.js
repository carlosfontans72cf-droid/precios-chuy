// Panel Cliente - Precios Chuy
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { mostrarPremiumCliente } from './pagos-ui.js';

const userId = sessionStorage.getItem('userId');
const userName = sessionStorage.getItem('userName');

window.mostrarPremium = () => mostrarPremiumCliente(userId);
window.irAPerfilComercio = (comercioId) => {
  sessionStorage.setItem('perfilComercioId', comercioId);
  window.location.href = '/pages/perfil-comercio.html?id=' + comercioId;
};

// ========== CARGAR ESTADÍSTICAS ==========
async function loadStats() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const prodsSnap = await getDocs(collection(db, 'productos'));
    const el1 = document.getElementById('stat-total-users');
    const el3 = document.getElementById('stat-productos');
    if (el1) el1.textContent = usersSnap.size;
    if (el3) el3.textContent = prodsSnap.size;

    let esPremium = false;
    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.plan === 'premium') { esPremium = true; sessionStorage.setItem('userPlan', 'premium'); }
          else { sessionStorage.setItem('userPlan', 'gratis'); }
        }
      } catch (e) { esPremium = sessionStorage.getItem('userPlan') === 'premium'; }
    }

    const bannerPremium = document.getElementById('premium-banner');
    const bannerActivo = document.getElementById('banner-premium-activo');
    const seccionWhatsapp = document.getElementById('seccion-whatsapp-premium');
    const ofertasExclusivas = document.getElementById('ofertas-exclusivas-premium');
    if (esPremium) {
      if (bannerPremium) bannerPremium.style.display = 'none';
      if (bannerActivo) bannerActivo.style.display = 'block';
      if (seccionWhatsapp) seccionWhatsapp.style.display = 'block';
      if (ofertasExclusivas) ofertasExclusivas.style.display = 'block';
    } else {
      if (bannerPremium) bannerPremium.style.display = 'block';
      if (bannerActivo) bannerActivo.style.display = 'none';
      if (seccionWhatsapp) seccionWhatsapp.style.display = 'none';
      if (ofertasExclusivas) ofertasExclusivas.style.display = 'none';
    }
  } catch (err) { console.error('Error cargando stats:', err); }
}

// ========== OFERTAS ==========
async function loadOfertas() {
  const cont = document.getElementById('feed-ofertas');
  if (!cont) return;
  try {
    const snap = await getDocs(query(collection(db, 'productos'), orderBy('createdAt', 'desc')));
    if (snap.empty) { cont.innerHTML = '<p style="text-align:center;color:#666;">Aún no hay ofertas publicadas</p>'; return; }
    cont.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      if (data.suspendido) return;
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
        </div>`;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error cargando ofertas:', err); }
}

// ========== PRODUCTOS ==========
async function loadProductos() {
  const cont = document.getElementById('lista-productos-cliente');
  const selectSeccion = document.getElementById('filtrar-seccion');
  const inputBusqueda = document.getElementById('buscar-producto');
  if (!cont) return;

  const seccionSeleccionada = selectSeccion ? selectSeccion.value : '';

  try {
    const seccionesSnap = await getDocs(collection(db, 'secciones'));
    if (selectSeccion) {
      selectSeccion.innerHTML = '<option value="">Todas</option>';
      seccionesSnap.forEach(d => {
        const data = d.data();
        selectSeccion.innerHTML += `<option value="${d.id}">${data.icono || ''} ${data.nombre}</option>`;
      });
      selectSeccion.value = seccionSeleccionada;
    }

    const snap = await getDocs(collection(db, 'productos'));
    const busqueda = inputBusqueda?.value.trim().toLowerCase() || '';
    const seccionFiltro = selectSeccion?.value || '';

    if (snap.empty) { cont.innerHTML = '<p style="text-align:center;color:#666;grid-column:span 2;">📦 Sin productos cargados.</p>'; return; }

    const productos = [];
    snap.forEach(d => productos.push({ id: d.id, ...d.data() }));

    const filtrados = productos.filter(p => {
      if (p.suspendido) return false;
      const matchBusqueda = !busqueda || (p.nombre && p.nombre.toLowerCase().includes(busqueda));
      const matchSeccion = !seccionFiltro || p.seccionId === seccionFiltro;
      return matchBusqueda && matchSeccion;
    });

    if (filtrados.length === 0) {
      cont.innerHTML = `<p style="text-align:center;color:#FF6B00;font-size:1.1rem;grid-column:span 2;padding:20px;">⚠️ No se encontraron productos<br><small style="color:#666;">Probá con otro término o sección</small></p>`;
      return;
    }

    cont.innerHTML = '';
    filtrados.forEach(d => {
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        ${d.imagen ? `<img src="${d.imagen}" alt="${d.nombre}" onerror="this.style.display='none'">` : '<div style="height:150px;background:#f0f0f0;border-radius:8px;"></div>'}
        <h3>${d.nombre}</h3>
        <div style="display:flex;justify-content:space-between;margin-top:10px;">
          <span class="precio-uruguay">🇺🇾 $${d.precioUruguay || 0}</span>
          <span class="precio-brasil">🇷 R$${d.precioBrasil || 0}</span>
        </div>`;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error('Error productos:', err);
    cont.innerHTML = '<p style="color:red;grid-column:span 2;">❌ Error al cargar productos</p>';
  }
}

document.getElementById('btn-buscar-productos')?.addEventListener('click', loadProductos);
document.getElementById('buscar-producto')?.addEventListener('input', loadProductos);
document.getElementById('filtrar-seccion')?.addEventListener('change', loadProductos);

// ========== MAPA ==========
let mapa;
let marcadoresMapa = [];

function initMapa() {
  if (mapa) return;
  mapa = L.map('mapa-comercios').setView([-33.7574, -53.4614], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapa);
}

function obtenerIcono(tipo) {
  const iconos = { supermercado: '🛒', carniceria: '🥩', farmacia: '💊', bebidas: '🍺', ropa: '', electronica: '📱', panaderia: '🍞', ferreteria: '', otro: '🏪' };
  return iconos[tipo] || '🏪';
}

async function loadMapa() {
  initMapa();
  try {
    const snapUsers = await getDocs(collection(db, 'users'));
    marcadoresMapa.forEach(m => mapa.removeLayer(m));
    marcadoresMapa = [];
    let totalComercios = 0;

    snapUsers.forEach(d => {
      const data = d.data();
      if (data.role !== 'comerciante' || data.activo === false) return;
      if (!data.lat || !data.lng) return;
      const icono = obtenerIcono(data.tipo);
      const comercioData = { id: d.id, nombre: data.nombreComercio || data.comercio || 'Comercio', tipo: data.tipo || 'comercio', direccion: data.direccion || '', telefono: data.telefono || '', horarios: data.horarios || '', logo: data.logo || '' };
      const marker = L.marker([data.lat, data.lng]).addTo(mapa);
      marker.bindPopup(crearPopupComercio(comercioData));
      marcadoresMapa.push(marker);
      totalComercios++;
    });

    if (totalComercios === 0) {
      const cont = document.getElementById('lista-comercios-cliente');
      if (cont) cont.innerHTML = '<p style="text-align:center;color:#666;">Sin comercios con ubicación registrada.</p>';
    }
  } catch (err) { console.error('Error cargando mapa:', err); }
}

function crearPopupComercio(comercio) {
  const icono = obtenerIcono(comercio.tipo);
  return `
    <div style="min-width:200px;" data-comercio-id="${comercio.id}" class="popup-comercio">
      ${comercio.logo ? `<img src="${comercio.logo}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:10px;border:2px solid #FFDF00;cursor:pointer;" onerror="this.style.display='none'">` : ''}
      <h3 style="margin:0 0 10px 0;color:#0038A8;cursor:pointer;" class="popup-comercio-nombre">${icono} ${comercio.nombre}</h3>
      <p style="margin:5px 0;"><strong>Tipo:</strong> ${comercio.tipo}</p>
      <p style="margin:5px 0;"><strong>📍</strong> ${comercio.direccion || 'No disponible'}</p>
      <p style="margin:5px 0;"><strong>📱</strong> ${comercio.telefono || 'No disponible'}</p>
      <p style="margin:5px 0;"><strong>⏰</strong> ${comercio.horarios || 'No disponible'}</p>
      <p style="margin:10px 0 0 0;color:#009C3B;font-weight:bold;font-size:0.9rem;cursor:pointer;" class="popup-comercio-ver"> Click para ver perfil completo</p>
    </div>`;
}

document.addEventListener('click', function(e) {
  const popupCard = e.target.closest('.popup-comercio');
  if (popupCard) {
    const comercioId = popupCard.getAttribute('data-comercio-id');
    if (comercioId) {
      sessionStorage.setItem('perfilComercioId', comercioId);
      window.location.href = '/pages/perfil-comercio.html?id=' + comercioId;
    }
  }
});

// ========== COMERCIOS ==========
let todosLosComercios = [];

async function loadComercios() {
  const cont = document.getElementById('lista-comercios-cliente');
  if (!cont) return;
  try {
    const snapUsers = await getDocs(collection(db, 'users'));
    todosLosComercios = [];

    snapUsers.forEach(d => {
      const data = d.data();
      if (data.role !== 'comerciante' || data.activo === false) return;
      todosLosComercios.push({ id: d.id, ...data });
    });

    renderComercios(todosLosComercios);
  } catch (err) {
    console.error('Error comercios:', err);
    cont.innerHTML = '<p style="text-align:center;color:#666;">Error al cargar comercios</p>';
  }
}

function renderComercios(lista) {
  const cont = document.getElementById('lista-comercios-cliente');
  if (!cont) return;
  cont.innerHTML = '';

  if (lista.length === 0) {
    cont.innerHTML = '<p style="text-align:center;color:#666;">No se encontraron comercios</p>';
    return;
  }

  lista.forEach(data => {
    const nombre = data.nombreComercio || data.comercio || 'Comercio';
    const tipo = data.tipo || 'comercio';
    const logo = data.logo || '';
    const div = document.createElement('div');
    div.className = 'card';
    div.style.cursor = 'pointer';
    div.onclick = () => irAPerfilComercio(data.id);
    div.innerHTML = `
      ${logo ? `<img src="${logo}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:15px;float:left;border:2px solid #FFDF00;" onerror="this.style.display='none'">` : ''}
      <h3 style="margin:0;">🏪 ${nombre}</h3>
      <p style="color:#666;margin:5px 0;">${tipo}</p>
      ${data.direccion ? `<p style="margin:5px 0;"><small>📍 ${data.direccion}</small></p>` : ''}
      ${data.telefono ? `<p style="margin:5px 0;"><small>📱 ${data.telefono}</small></p>` : ''}
      <div style="clear:both;"></div>`;
    cont.appendChild(div);
  });
}

window.filtrarComercios = () => {
  const termino = (document.getElementById('buscar-comercio').value || '').trim().toLowerCase();
  if (!termino) { renderComercios(todosLosComercios); return; }

  const filtrados = todosLosComercios.filter(data => {
    const nombre = (data.nombreComercio || data.comercio || '').toLowerCase();
    const tipo = (data.tipo || '').toLowerCase();
    const direccion = (data.direccion || '').toLowerCase();
    return nombre.includes(termino) || tipo.includes(termino) || direccion.includes(termino);
  });

  renderComercios(filtrados);
};

// ========== EXCURSIONES ==========
async function loadExcursiones() {
  const cont = document.getElementById('lista-excursiones-cliente');
  if (!cont) return;
  try {
    const snap = await getDocs(collection(db, 'excursiones'));
    const excursiones = [];
    snap.forEach(d => { const data = d.data(); if (data.publicada && data.activa) excursiones.push({ id: d.id, ...data }); });
    excursiones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (excursiones.length === 0) { cont.innerHTML = '<p style="text-align:center;color:#666;">No hay excursiones programadas</p>'; return; }
    cont.innerHTML = '';
    excursiones.forEach(exc => {
      const porcentaje = (exc.lugaresOcupados / exc.lugaresTotales) * 100;
      const whatsappNum = exc.adminWhatsapp ? exc.adminWhatsapp.replace(/[^0-9]/g, '') : '';
      const whatsappMsg = encodeURIComponent(`Hola! Quiero reservar lugar para la excursión:\n\n🚌 ${exc.ruta || 'Excursión'}\n📅 Fecha: ${exc.fecha}\n Horario: ${exc.horaSalida} - ${exc.horaRetorno}\n📍 Punto: ${exc.punto}\n💰 Precio: $${exc.precio}`);
      const whatsappLink = whatsappNum ? `https://wa.me/${whatsappNum}?text=${whatsappMsg}` : '#';
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
        </div>
        ${exc.descripcion ? `<p style="color:#666;">${exc.descripcion}</p>` : ''}
        <div style="margin:10px 0;"><strong>Lugares:</strong> ${exc.lugaresOcupados}/${exc.lugaresTotales}
          <div style="background:#ddd; border-radius:10px; overflow:hidden; height:20px; margin-top:5px;"><div style="width:${porcentaje}%; background:#009C3B; height:100%;"></div></div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-success" onclick="reservarExcursion('${exc.id}', '${exc.adminNombre}', '${exc.fecha}', '${exc.ruta || ''}', '${exc.adminEmail || ''}', ${exc.sena || 0}, '${exc.adminWhatsapp || ''}')">${exc.lugaresOcupados >= exc.lugaresTotales ? 'Completa' : 'Reservar lugar'}</button>
          ${exc.adminWhatsapp ? `<a href="${whatsappLink}" target="_blank" class="btn" style="background:#25D366; color:white; text-decoration:none;">💬 Contactar Admin</a>` : ''}
        </div>`;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error excursiones:', err); }
}

window.reservarExcursion = (excId, adminNombre, fecha, ruta, adminEmail, sena, adminWhatsapp) => {
  const senaInfo = sena > 0 ? `<div style="background:#fff3cd; padding:15px; border-radius:8px; margin:15px 0; border-left:4px solid #ffc107;"><strong>Seña requerida:</strong> $${sena} por persona<br><small>Contactá al admin por WhatsApp para coordinar el pago.</small></div>` : '';
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:16px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;">
      <h2 style="color:#0038A8;">Reservar lugar</h2>
      <p><strong>${ruta}</strong> - ${fecha}</p><p>Admin: ${adminNombre}</p>
      ${senaInfo}
      <div class="form-group"><label>Tu nombre</label><input type="text" id="res-nombre" class="form-control" value="${sessionStorage.getItem('userName') || ''}"></div>
      <div class="form-group"><label>Teléfono / WhatsApp</label><input type="text" id="res-telefono" class="form-control" placeholder="+598 99..."></div>
      <div class="form-group"><label>Cantidad de personas</label><input type="number" id="res-personas" class="form-control" value="1" min="1"></div>
      <div id="res-error" style="color:#EF3340;text-align:center;min-height:20px;"></div>
      <button id="res-confirmar" class="btn btn-success btn-block">Confirmar reserva</button>
      <button onclick="this.closest('div[style*=fixed]').remove()" class="btn btn-block" style="margin-top:10px;background:#ddd;">Cancelar</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  document.getElementById('res-confirmar').addEventListener('click', async () => {
    const { addDoc, collection, serverTimestamp, updateDoc, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const nombre = document.getElementById('res-nombre').value.trim();
    const telefono = document.getElementById('res-telefono').value.trim();
    const personas = parseInt(document.getElementById('res-personas').value) || 1;
    const errDiv = document.getElementById('res-error');
    if (!nombre || !telefono) { errDiv.textContent = 'Completá nombre y teléfono'; return; }
    try {
      await addDoc(collection(db, 'reservas'), { excursionId: excId, adminId: userId, adminNombre, adminEmail, adminWhatsapp, ruta, fechaExcursion: fecha, sena, clienteId: userId, clienteNombre: nombre, clienteTelefono: telefono, personas, fechaReserva: new Date().toISOString(), estado: 'pendiente' });
      const excRef = doc(db, 'excursiones', excId);
      const excSnap = await getDoc(excRef);
      if (excSnap.exists()) { const data = excSnap.data(); await updateDoc(excRef, { lugaresOcupados: (data.lugaresOcupados || 0) + personas }); }
      modal.remove();
      alert('✅ Reserva enviada. Contactá al admin por WhatsApp para pagar la seña.');
      loadExcursiones();
    } catch (err) { errDiv.textContent = `Error: ${err.message}`; }
  });
};

// ========== GUÍA DEL CHUY ==========
async function loadGuia() {
  const cont = document.getElementById('lista-guia-cliente');
  if (!cont) return;
  cont.innerHTML = '<p style="text-align:center;color:#666;">Cargando artículos...</p>';
  const esPremium = sessionStorage.getItem('userPlan') === 'premium';
  const warning = document.getElementById('guia-login-warning');
  if (warning) warning.style.display = esPremium ? 'none' : 'block';

  try {
    const snap = await getDocs(collection(db, 'guia_chuy'));
    const articulos = [];
    snap.forEach(d => articulos.push({ id: d.id, ...d.data() }));
    articulos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

    const todas = document.getElementById('filtro-todas')?.checked !== false;
    const rutas = document.getElementById('filtro-rutas')?.checked;
    const lugares = document.getElementById('filtro-lugares')?.checked;
    const comercios = document.getElementById('filtro-comercios')?.checked;
    const tips = document.getElementById('filtro-tips')?.checked;

    const filtrados = articulos.filter(a => {
      if (todas) return true;
      if (a.tipo === 'ruta' && rutas) return true;
      if (a.tipo === 'lugar' && lugares) return true;
      if (a.tipo === 'comercio' && comercios) return true;
      if (a.tipo === 'tip' && tips) return true;
      if (a.tipo === 'alerta') return true;
      return false;
    });

    if (filtrados.length === 0) { cont.innerHTML = snap.empty ? '<p style="text-align:center;color:#666;"> No hay artículos en la guía aún.</p>' : '<p style="text-align:center;color:#666;">No hay artículos que coincidan con los filtros.</p>'; return; }

    cont.innerHTML = '';
    filtrados.forEach(a => {
      const div = document.createElement('div');
      div.className = 'card';
      if (a.premium && !esPremium) {
        div.style.opacity = '0.6';
        div.innerHTML = `<h4>${a.tipo === 'ruta' ? '🗺️' : a.tipo === 'lugar' ? '📍' : a.tipo === 'comercio' ? '🏪' : a.tipo === 'alerta' ? '⚠️' : '💡'} ${a.titulo}</h4><p style="color:#666;">${(a.contenido || '').substring(0, 80)}...</p><p style="color:#FF6B00; font-weight:bold; margin:10px 0;"> Contenido exclusivo Premium</p><button class="btn btn-sm btn-primary" onclick="mostrarPremium()">⭐ Hacete Premium para ver más</button>`;
      } else {
        div.style.cursor = 'pointer';
        div.innerHTML = `<h4>${a.tipo === 'ruta' ? '🗺️' : a.tipo === 'lugar' ? '📍' : a.tipo === 'comercio' ? '' : a.tipo === 'alerta' ? '⚠️' : '💡'} ${a.titulo}</h4><p style="color:#333; margin:10px 0; white-space:pre-wrap;">${a.contenido || ''}</p><p style="color:#666; font-size:0.9rem;">📅 ${a.fecha || '-'}</p>`;
      }
      cont.appendChild(div);
    });
  } catch (err) { console.error('❌ Error cargando guia:', err); cont.innerHTML = `<p style="color:red;">❌ Error al cargar la guía: ${err.message}</p>`; }
}

document.getElementById('filtro-todas')?.addEventListener('change', loadGuia);
document.getElementById('filtro-rutas')?.addEventListener('change', loadGuia);
document.getElementById('filtro-lugares')?.addEventListener('change', loadGuia);
document.getElementById('filtro-comercios')?.addEventListener('change', loadGuia);
document.getElementById('filtro-tips')?.addEventListener('change', loadGuia);

// ========== AVISOS / NOTICIAS ==========
async function loadAvisosCliente() {
  const cont = document.getElementById('lista-avisos-cliente');
  if (!cont) return;
  try {
    const snap = await getDocs(collection(db, 'avisos'));
    const avisos = [];
    snap.forEach(d => { const data = d.data(); if (data.activo !== false) avisos.push({ id: d.id, ...data }); });
    const orden = { alta: 0, media: 1, baja: 2 };
    avisos.sort((a, b) => (orden[a.prioridad] || 1) - (orden[b.prioridad] || 1));
    if (avisos.length === 0) { cont.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No hay avisos publicados</p>'; return; }
    cont.innerHTML = '';
    avisos.forEach(a => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.cssText = 'margin-bottom:15px; border-left: 4px solid ' + (a.prioridad === 'alta' ? '#EF3340' : a.prioridad === 'media' ? '#FFC107' : '#009C3B') + ';';
      div.innerHTML = `
        <h4 style="margin:0 0 10px 0; color:#0038A8;">${a.titulo}</h4>
        ${a.imagen ? `<img src="${a.imagen}" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-bottom:10px;" onerror="this.style.display='none'">` : ''}
        <p style="color:#333; margin:10px 0; white-space:pre-wrap; line-height:1.6;">${a.contenido}</p>
        ${a.link ? `<a href="${a.link}" target="_blank" class="btn btn-sm btn-primary" style="display:inline-block; text-decoration:none; margin-top:10px;">${a.linkTexto || 'Ver más'} →</a>` : ''}`;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error avisos:', err); cont.innerHTML = '<p style="text-align:center;color:red;">Error al cargar avisos</p>'; }
}

// ========== BENEFICIOS PREMIUM ==========
window.mostrarAlertas = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `<div style="background:white;padding:30px;border-radius:16px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;"><h2 style="color:#0038A8;">Alertas de Precios</h2><p style="color:#666; margin-bottom:20px;">Elegí los productos a monitorear:</p><div class="form-group"><label>Producto 1</label><input type="text" class="form-control" placeholder="Ej: Whisky Johnnie Walker"></div><div class="form-group"><label>Producto 2</label><input type="text" class="form-control" placeholder="Ej: Cerveza Heineken"></div><div class="form-group"><label>Producto 3</label><input type="text" class="form-control" placeholder="Ej: Chocolate Milka"></div><button class="btn btn-success btn-block" onclick="this.closest('div[style*=fixed]').remove(); alert('✅ Alertas configuradas');">Guardar</button><button class="btn btn-block" style="margin-top:10px;background:#ddd;" onclick="this.closest('div[style*=fixed]').remove()">Cancelar</button></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
};

window.mostrarListaCompras = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `<div style="background:white;padding:30px;border-radius:16px;max-width:600px;width:90%;max-height:90vh;overflow-y:auto;"><h2 style="color:#0038A8;">Lista de Compras Optimizada</h2><div style="display:flex; gap:10px; margin-bottom:15px;"><input type="text" id="item-lista" class="form-control" placeholder="Ej: Arroz 1kg" style="flex:1;"><button class="btn btn-success" onclick="agregarItemLista()">Agregar</button></div><div id="items-lista-container"></div><button class="btn btn-primary btn-block" style="margin-top:15px;" onclick="optimizarLista()">🧠 Optimizar Lista</button><button class="btn btn-block" style="margin-top:10px;background:#ddd;" onclick="this.closest('div[style*=fixed]').remove()">Cerrar</button></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
};

window.agregarItemLista = () => {
  const input = document.getElementById('item-lista');
  const container = document.getElementById('items-lista-container');
  if (!input.value.trim()) return;
  const div = document.createElement('div');
  div.style.cssText = 'padding:8px; background:#f0f0f0; border-radius:6px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;';
  div.innerHTML = `<span>${input.value}</span> <button onclick="this.parentElement.remove()" style="background:none; border:none; color:red; cursor:pointer;">X</button>`;
  container.appendChild(div);
  input.value = '';
};

window.optimizarLista = () => { alert('🧠 Analizando precios... Función en desarrollo.'); };

window.mostrarSoporteVIP = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `<div style="background:white;padding:30px;border-radius:16px;max-width:400px;width:90%;text-align:center;"><h2 style="color:#0038A8;">Soporte VIP</h2><div style="background:#E8F5E9; padding:20px; border-radius:10px; margin:20px 0;"><p style="font-size:3rem; margin:0;">💬</p><p style="margin:10px 0;"><strong>WhatsApp Directo</strong></p></div><a href="https://wa.me/59895205598?text=Hola!%20Soy%20cliente%20Premium" target="_blank" class="btn btn-success" style="display:inline-block; text-decoration:none; margin-bottom:10px;">📱 Contactar</a><button class="btn btn-block" style="background:#ddd;" onclick="this.closest('div[style*=fixed]').remove()">Cerrar</button></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
};// ========== BUSCADOR DE COMERCIOS ==========
let comerciosCache = []; // guardamos todos los comercios para buscar rápido

async function cargarComerciosCache() {
  try {
    const snapUsers = await getDocs(collection(db, 'users'));
    comerciosCache = [];
    snapUsers.forEach(d => {
      const data = d.data();
      if (data.role !== 'comerciante' || data.activo === false) return;
      comerciosCache.push({
        id: d.id,
        nombre: data.nombreComercio || data.comercio || 'Comercio',
        tipo: data.tipo || 'comercio',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        logo: data.logo || '',
        lat: data.lat,
        lng: data.lng
      });
    });
 } catch (err) { console.error('Error cargando cache de comercios:', err); }
}

function buscarComercios(texto) {
  const cont = document.getElementById('resultados-busqueda');
  const btnLimpiar = document.getElementById('btn-limpiar-buscar');
  if (!cont) return;
  
  texto = texto.trim().toLowerCase();
  
  if (!texto) {
    cont.innerHTML = '';
    cont.style.display = 'none';
    if (btnLimpiar) btnLimpiar.style.display = 'none';
    return;
  }
  
  if (btnLimpiar) btnLimpiar.style.display = 'block';
  
  const resultados = comerciosCache.filter(c => 
    c.nombre.toLowerCase().includes(texto) ||
    (c.tipo && c.tipo.toLowerCase().includes(texto)) ||
    (c.direccion && c.direccion.toLowerCase().includes(texto))
  );
  
  if (resultados.length === 0) {
    cont.innerHTML = '<div class="resultado-vacio">😕 No se encontraron comercios</div>';
    cont.style.display = 'block';
    return;
  }
  
  cont.innerHTML = '';
  cont.style.display = 'block';
  
  resultados.slice(0, 10).forEach(c => {
    const icono = obtenerIcono(c.tipo);
    const div = document.createElement('div');
    div.className = 'resultado-item';
    div.innerHTML = `
     <div class="resultado-icono">${icono}</div>
      <div class="resultado-info">
        <strong>${c.nombre}</strong>
        <small>${c.tipo}${c.direccion ? ' • ' + c.direccion : ''}</small>
      </div>
    `;
    div.addEventListener('click', () => irAComercio(c));
    cont.appendChild(div);
  });
}

function irAComercio(comercio) {
  // Ir al perfil del comercio
  irAPerfilComercio(comercio.id);
  
  // Opcional: si querés que también centre el mapa y abra el popup, descomentá:
  // if (comercio.lat && comercio.lng && mapa) {
  //   mapa.setView([comercio.lat, comercio.lng], 16);
  //   const marker = marcadoresMapa.find(m => 
 //     m.getLatLng().lat === comercio.lat && m.getLatLng().lng === comercio.lng
  //   );
  //   if (marker) marker.openPopup();
  // }
}

function limpiarBusqueda() {
  const input = document.getElementById('buscar-comercio');
  if (input) input.value = '';
  buscarComercios('');
}

// Event listeners del buscador
document.getElementById('buscar-comercio')?.addEventListener('input', (e) => {
  buscarComercios(e.target.value);
});

document.getElementById('btn-limpiar-buscar')?.addEventListener('click', limpiarBusqueda);

// Cerrar resultados al hacer click fuera
document.addEventListener('click', (e) => {
  const buscador = document.querySelector('.buscador-comercios');
  if (buscador && !buscador.contains(e.target)) {
    const cont = document.getElementById('resultados-busqueda');
    if (cont) cont.style.display = 'none';
  }
});

// ========== INICIALIZACIÓN ==========
loadStats();
loadOfertas();
loadProductos();
loadMapa();
loadComercios();
loadExcursiones();
loadGuia();
loadAvisosCliente();
cargarComerciosCache(); //