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

    // VERIFICAR SI EL USUARIO ES PREMIUM - LEER DIRECTAMENTE POR UID
    let esPremium = false;
    if (userId) {
      try {
        const { doc: docFn, getDoc: getDocFn } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        const userDocRef = docFn(db, 'users', userId);
        const userDocSnap = await getDocFn(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log('Mi UID:', userId);
          console.log('Datos de MI documento:', userData);
          console.log('Plan de MI documento:', userData.plan);
          
          if (userData.plan === 'premium') {
            esPremium = true;
            sessionStorage.setItem('userPlan', 'premium');
            console.log('✅ Mi cuenta es PREMIUM');
          } else {
            sessionStorage.setItem('userPlan', 'gratis');
            console.log('Mi cuenta es GRATIS');
          }
        } else {
          console.error('⚠️ No existe documento en users para mi UID:', userId);
        }
      } catch (e) {
        console.error('Error leyendo plan:', e);
        esPremium = sessionStorage.getItem('userPlan') === 'premium';
      }
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
            <span class="precio-brasil">🇧 R$${data.precioBrasil || 0}</span>
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
  const inputBusqueda = document.getElementById('buscar-producto');
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
    
    const snap = await getDocs(collection(db, 'productos'));
    
    // Aplicar filtros
    const busqueda = inputBusqueda?.value.trim().toLowerCase() || '';
    const seccionFiltro = selectSeccion?.value || '';
    
    if (snap.empty) {
      cont.innerHTML = '<p style="text-align:center;color:#666;grid-column:span 2;">📦 Sin productos cargados. El administrador aún no agregó productos.</p>';
      return;
    }
    
    const productos = [];
    snap.forEach(d => productos.push({ id: d.id, ...d.data() }));
    
    const filtrados = productos.filter(p => {
      const matchBusqueda = !busqueda || (p.nombre && p.nombre.toLowerCase().includes(busqueda));
      const matchSeccion = !seccionFiltro || p.seccionId === seccionFiltro;
      return matchBusqueda && matchSeccion;
    });
    
    if (filtrados.length === 0) {
      if (busqueda || seccionFiltro) {
        cont.innerHTML = `<p style="text-align:center;color:#FF6B00;font-size:1.1rem;grid-column:span 2;padding:20px;">⚠️ No se encontraron productos que coincidan con "${busqueda || seccionFiltro}"<br><small style="color:#666;">Probá con otro término o sección</small></p>`;
      } else {
        cont.innerHTML = '<p style="text-align:center;color:#666;grid-column:span 2;">Sin productos cargados</p>';
      }
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
          <span class="precio-brasil">🇧🇷 R$${d.precioBrasil || 0}</span>
        </div>
      `;
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
    // Buscar comercios en la colección 'comercios'
    const snapComercios = await getDocs(collection(db, 'comercios'));
    
    // Buscar comercios en la colección 'users' con role 'comerciante'
    const snapUsers = await getDocs(collection(db, 'users'));
    const comerciosUsers = [];
    snapUsers.forEach(d => {
      const data = d.data();
      if (data.role === 'comerciante' && data.comercio && data.activo !== false) {
        comerciosUsers.push({
          id: d.id,
          nombre: data.comercio,
          tipo: data.tipoComercio || 'comercio',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          horarios: data.horarios || '',
          lat: data.lat || null,
          lng: data.lng || null,
          metodos_pago: data.metodos_pago || [],
          fuente: 'users'
        });
      }
    });
    
    // Limpiar marcadores anteriores
    marcadoresMapa.forEach(m => mapa.removeLayer(m));
    marcadoresMapa = [];
    
    let totalComercios = 0;
    
    // Agregar comercios de la colección 'comercios'
    snapComercios.forEach(d => {
      const data = d.data();
      if (!data.activo) return;
      
      const lat = data.lat || -33.7574;
      const lng = data.lng || -53.4614;
      
      const icono = obtenerIcono(data.tipo);
      
      const marker = L.marker([lat, lng]).addTo(mapa);
      marker.bindPopup(crearPopupComercio(data.nombre, data.tipo, data.direccion, data.telefono, data.horarios, data.metodos_pago, icono));
      marcadoresMapa.push(marker);
      totalComercios++;
    });
    
    // Agregar comercios de la colección 'users'
    comerciosUsers.forEach(c => {
      const lat = c.lat || -33.7574;
      const lng = c.lng || -53.4614;
      
      const icono = obtenerIcono(c.tipo);
      
      const marker = L.marker([lat, lng]).addTo(mapa);
      marker.bindPopup(crearPopupComercio(c.nombre, c.tipo, c.direccion, c.telefono, c.horarios, c.metodos_pago, icono));
      marcadoresMapa.push(marker);
      totalComercios++;
    });
    
    // Mostrar mensaje si no hay comercios
    const cont = document.getElementById('lista-comercios-cliente');
    if (cont && totalComercios === 0) {
      cont.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Sin comercios registrados. Agrega comercios desde el panel admin.</p>';
    }
    
    console.log(`Mapa: ${totalComercios} comercios cargados`);
    
  } catch (err) {
    console.error('Error cargando mapa:', err);
  }
}

function obtenerIcono(tipo) {
  const iconos = {
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
  return iconos[tipo] || '🏪';
}

function crearPopupComercio(nombre, tipo, direccion, telefono, horarios, metodos_pago, icono) {
  return `
    <div style="min-width:200px;">
      <h3 style="margin:0 0 10px 0; color:#0038A8;">${icono} ${nombre}</h3>
      <p style="margin:5px 0;"><strong>Tipo:</strong> ${tipo}</p>
      <p style="margin:5px 0;"><strong></strong> ${direccion || 'Dirección no disponible'}</p>
      <p style="margin:5px 0;"><strong>📱</strong> ${telefono || 'No disponible'}</p>
      <p style="margin:5px 0;"><strong>⏰</strong> ${horarios || 'No disponible'}</p>
      ${metodos_pago && metodos_pago.length > 0 ? 
        `<p style="margin:5px 0;"><strong>💳</strong> ${metodos_pago.join(', ')}</p>` : ''}
    </div>
  `;
}

// ========== COMERCIOS ==========
async function loadComercios() {
  const cont = document.getElementById('lista-comercios-cliente');
  if (!cont) return;
  
  try {
    // Buscar comercios en la colección 'comercios'
    const snapComercios = await getDocs(collection(db, 'comercios'));
    
    // Buscar comercios en la colección 'users' con role 'comerciante'
    const snapUsers = await getDocs(collection(db, 'users'));
    const comerciosUsers = [];
    snapUsers.forEach(d => {
      const data = d.data();
      if (data.role === 'comerciante' && data.comercio && data.activo !== false) {
        comerciosUsers.push({
          nombre: data.comercio,
          tipo: data.tipoComercio || 'comercio',
          direccion: data.direccion || '',
          telefono: data.telefono || ''
        });
      }
    });
    
    cont.innerHTML = '';
    let totalComercios = 0;
    
    // Mostrar comercios de la colección 'comercios'
    snapComercios.forEach(d => {
      const data = d.data();
      if (!data.activo) return;
      
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>🏪 ${data.nombre}</h3>
        <p style="color:#666;">${data.tipo}</p>
        ${data.direccion ? `<p><small>📍 ${data.direccion}</small></p>` : ''}
        ${data.telefono ? `<p><small>📱 ${data.telefono}</small></p>` : ''}
      `;
      cont.appendChild(div);
      totalComercios++;
    });
    
    // Mostrar comercios de la colección 'users'
    comerciosUsers.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>🏪 ${c.nombre}</h3>
        <p style="color:#666;">${c.tipo}</p>
        ${c.direccion ? `<p><small> ${c.direccion}</small></p>` : ''}
        ${c.telefono ? `<p><small>📱 ${c.telefono}</small></p>` : ''}
      `;
      cont.appendChild(div);
      totalComercios++;
    });
    
    if (totalComercios === 0) {
      cont.innerHTML = '<p style="text-align:center;color:#666;">Sin comercios registrados</p>';
    }
    
  } catch (err) { 
    console.error('Error comercios:', err);
    cont.innerHTML = '<p style="text-align:center;color:#666;">Error al cargar comercios</p>';
  }
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
      const whatsappNum = exc.adminWhatsapp ? exc.adminWhatsapp.replace(/[^0-9]/g, '') : '';
      const whatsappMsg = encodeURIComponent(`Hola! Quiero reservar lugar para la excursión:\n\n🚌 ${exc.ruta || 'Excursión'}\n📅 Fecha: ${exc.fecha}\n⏰ Horario: ${exc.horaSalida} - ${exc.horaRetorno}\n📍 Punto: ${exc.punto}\n💰 Precio: $${exc.precio}\n${exc.sena ? `💵 Seña: $${exc.sena} por persona\n` : ''}\nQuiero coordinar el pago de la seña.`);
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
      ${adminWhatsapp ? `<br><a href="https://wa.me/${adminWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola! Quiero reservar lugar para la excursión ${ruta} del ${fecha}. Quiero coordinar el pago de la seña de $${sena} por persona.`)}" target="_blank" style="color:#25D366; font-weight:bold;">WhatsApp del admin</a>` : ''}
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
      const { addDoc, collection, serverTimestamp, updateDoc, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
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
      const excSnap = await getDoc(excRef);
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

// ========== GUÍA DEL CHUY ==========
async function loadGuia() {
  const cont = document.getElementById('lista-guia-cliente');
  if (!cont) {
    console.error('❌ Contenedor de guía no encontrado');
    return;
  }
  cont.innerHTML = '<p style="text-align:center;color:#666;">Cargando artículos...</p>';
  
  const esPremium = sessionStorage.getItem('userPlan') === 'premium';
  console.log(' Cargando guía... Es premium:', esPremium);
  
  // Mostrar/ocultar warning
  const warning = document.getElementById('guia-login-warning');
  if (warning) warning.style.display = esPremium ? 'none' : 'block';
  
  try {
    const snap = await getDocs(collection(db, 'guia_chuy'));
    console.log('📄 Artículos encontrados:', snap.size);
    
    const articulos = [];
    snap.forEach(d => articulos.push({ id: d.id, ...d.data() }));
    articulos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    
    // Aplicar filtros
    const todas = document.getElementById('filtro-todas')?.checked !== false;
    const rutas = document.getElementById('filtro-rutas')?.checked;
    const lugares = document.getElementById('filtro-lugares')?.checked;
    const comercios = document.getElementById('filtro-comercios')?.checked;
    const tips = document.getElementById('filtro-tips')?.checked;
    
    console.log('Filtros:', { todas, rutas, lugares, comercios, tips });
    
    const filtrados = articulos.filter(a => {
      if (todas) return true;
      if (a.tipo === 'ruta' && rutas) return true;
      if (a.tipo === 'lugar' && lugares) return true;
      if (a.tipo === 'comercio' && comercios) return true;
      if (a.tipo === 'tip' && tips) return true;
      if (a.tipo === 'alerta') return true;
      return false;
    });
    
    console.log('Artículos filtrados:', filtrados.length);
    
    if (filtrados.length === 0) {
      if (snap.empty) {
        cont.innerHTML = '<p style="text-align:center;color:#666;">📭 No hay artículos en la guía aún. El administrador no ha agregado contenido.</p>';
      } else {
        cont.innerHTML = '<p style="text-align:center;color:#666;">No hay artículos que coincidan con los filtros seleccionados.</p>';
      }
      return;
    }
    
    cont.innerHTML = '';
    filtrados.forEach(a => {
      console.log('Artículo:', a.titulo, 'Premium:', a.premium);
      
      // Si es premium y el usuario no es premium, mostrar solo preview
      if (a.premium && !esPremium) {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.opacity = '0.6';
        div.innerHTML = `
          <h4>${a.tipo === 'ruta' ? '🗺️' : a.tipo === 'lugar' ? '📍' : a.tipo === 'comercio' ? '🏪' : a.tipo === 'alerta' ? '⚠️' : '💡'} ${a.titulo}</h4>
          <p style="color:#666;">${(a.contenido || '').substring(0, 80)}...</p>
          <p style="color:#FF6B00; font-weight:bold; margin:10px 0;">🔒 Contenido exclusivo Premium</p>
          <button class="btn btn-sm btn-primary" onclick="mostrarPremium()">⭐ Hacete Premium para ver más</button>
        `;
        cont.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.cursor = 'pointer';
        div.innerHTML = `
          <h4>${a.tipo === 'ruta' ? '🗺️' : a.tipo === 'lugar' ? '📍' : a.tipo === 'comercio' ? '🏪' : a.tipo === 'alerta' ? '️' : '💡'} ${a.titulo}</h4>
          <p style="color:#333; margin:10px 0; white-space:pre-wrap;">${a.contenido || ''}</p>
          <p style="color:#666; font-size:0.9rem;">📅 ${a.fecha || '-'}</p>
        `;
        cont.appendChild(div);
      }
    });
  } catch (err) {
    console.error('❌ Error cargando guia:', err);
    cont.innerHTML = `<p style="color:red;">❌ Error al cargar la guía: ${err.message}</p>`;
  }
}

// Recargar guía cuando cambian los filtros
document.getElementById('filtro-todas')?.addEventListener('change', loadGuia);
document.getElementById('filtro-rutas')?.addEventListener('change', loadGuia);
document.getElementById('filtro-lugares')?.addEventListener('change', loadGuia);
document.getElementById('filtro-comercios')?.addEventListener('change', loadGuia);
document.getElementById('filtro-tips')?.addEventListener('change', loadGuia);

// ========== FUNCIONES DE BENEFICIOS PREMIUM ==========
window.mostrarAlertas = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:16px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;">
      <h2 style="color:#0038A8;">Alertas de Precios</h2>
      <p style="color:#666; margin-bottom:20px;">Elegi los productos que queres monitorear y te avisamos cuando bajen de precio:</p>
      <div class="form-group">
        <label>Producto 1</label>
        <input type="text" class="form-control" placeholder="Ej: Whisky Johnnie Walker">
      </div>
      <div class="form-group">
        <label>Producto 2</label>
        <input type="text" class="form-control" placeholder="Ej: Cerveza Heineken">
      </div>
      <div class="form-group">
        <label>Producto 3</label>
        <input type="text" class="form-control" placeholder="Ej: Chocolate Milka">
      </div>
      <p style="color:#666; font-size:0.9rem; margin:15px 0;">Te enviaremos una notificacion cuando estos productos tengan una baja significativa de precio.</p>
      <button class="btn btn-success btn-block" onclick="this.closest('div[style*=fixed]').remove(); alert('✅ Alertas configuradas');">Guardar Alertas</button>
      <button class="btn btn-block" style="margin-top:10px;background:#ddd;" onclick="this.closest('div[style*=fixed]').remove()">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
};

window.mostrarListaCompras = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:16px;max-width:600px;width:90%;max-height:90vh;overflow-y:auto;">
      <h2 style="color:#0038A8;">Lista de Compras Optimizada</h2>
      <p style="color:#666; margin-bottom:20px;">Agrega los productos que necesitas y te diremos donde comprar cada uno al mejor precio:</p>
      <div style="display:flex; gap:10px; margin-bottom:15px;">
        <input type="text" id="item-lista" class="form-control" placeholder="Ej: Arroz 1kg" style="flex:1;">
        <button class="btn btn-success" onclick="agregarItemLista()">Agregar</button>
      </div>
      <div id="items-lista-container"></div>
      <button class="btn btn-primary btn-block" style="margin-top:15px;" onclick="optimizarLista()"> Optimizar Lista</button>
      <button class="btn btn-block" style="margin-top:10px;background:#ddd;" onclick="this.closest('div[style*=fixed]').remove()">Cerrar</button>
    </div>
  `;
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

window.optimizarLista = () => {
  alert(' Analizando precios en todos los comercios...\n\nFuncion completa en desarrollo. Proximamente te diremos exactamente en que comercio comprar cada producto para maximizar tu ahorro.');
};

window.mostrarSoporteVIP = () => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:white;padding:30px;border-radius:16px;max-width:400px;width:90%;text-align:center;">
      <h2 style="color:#0038A8;">Soporte VIP</h2>
      <p style="color:#666; margin-bottom:20px;">Como usuario Premium, tenes atencion prioritaria:</p>
      <div style="background:#E8F5E9; padding:20px; border-radius:10px; margin:20px 0;">
        <p style="font-size:3rem; margin:0;">💬</p>
        <p style="margin:10px 0;"><strong>WhatsApp Directo</strong></p>
        <p style="color:#666;">Respuesta en menos de 1 hora</p>
      </div>
      <a href="https://wa.me/59895205598?text=Hola!%20Soy%20cliente%20Premium%20y%20necesito%20ayuda" target="_blank" class="btn btn-success" style="display:inline-block; text-decoration:none; margin-bottom:10px;"> Contactar Ahora</a>
      <button class="btn btn-block" style="background:#ddd;" onclick="this.closest('div[style*=fixed]').remove()">Cerrar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
};

// ========== INICIALIZACIÓN ==========
loadStats();
loadOfertas();
loadProductos();
loadMapa();
loadComercios();
loadExcursiones();
loadGuia();
