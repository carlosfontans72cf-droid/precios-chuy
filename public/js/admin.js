// Panel de Administración - Precios Chuy
import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp,
  query, where, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showAlert } from './utils.js';

const role = sessionStorage.getItem('userRole');
if (role !== 'admin') window.location.href = '/index.html';

// ========== SECCIONES ==========
document.getElementById('btn-add-seccion')?.addEventListener('click', addSeccion);

async function addSeccion() {
  const nombre = document.getElementById('seccion-nombre').value.trim();
  const icono = document.getElementById('seccion-icono').value.trim() || '';
  if (!nombre) return showAlert('Ingresá el nombre', 'warning');
  try {
    await addDoc(collection(db, 'secciones'), { nombre, icono, createdAt: serverTimestamp() });
    document.getElementById('seccion-nombre').value = '';
    document.getElementById('seccion-icono').value = '';
    showAlert('Sección agregada', 'success');
    loadSecciones();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

async function loadSecciones() {
  const cont = document.getElementById('lista-secciones');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'secciones'));
    const select = document.getElementById('prod-seccion');
    if (select) select.innerHTML = '<option value="">Seleccionar sección</option>';
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;';
      div.innerHTML = `<span>${data.icono} ${data.nombre}</span>
        <button class="btn btn-sm btn-danger" onclick="deleteSeccion('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
      if (select) select.innerHTML += `<option value="${d.id}">${data.icono} ${data.nombre}</option>`;
    });
  } catch (err) { console.error('Error secciones:', err); }
}

window.deleteSeccion = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'secciones', id)); loadSecciones(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== PRODUCTOS ==========
document.getElementById('btn-add-producto')?.addEventListener('click', addProducto);

async function addProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const seccion = document.getElementById('prod-seccion').value;
  const precioUy = parseFloat(document.getElementById('prod-precio-uy').value) || 0;
  const precioBr = parseFloat(document.getElementById('prod-precio-br').value) || 0;
  const comercio = document.getElementById('prod-comercio').value || null;
  const imagen = document.getElementById('prod-imagen').value.trim() || null;

  if (!nombre) return showAlert('Ingresá el nombre del producto', 'warning');

  try {
    await addDoc(collection(db, 'productos'), {
      nombre, seccionId: seccion,
      precioUruguay: precioUy, precioBrasil: precioBr,
      comercioId: comercio, imagen, activo: true,
      createdAt: serverTimestamp()
    });
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio-uy').value = '';
    document.getElementById('prod-precio-br').value = '';
    document.getElementById('prod-imagen').value = '';
    showAlert('Producto agregado', 'success');
    loadProductos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

async function loadProductos() {
  const tbody = document.getElementById('lista-productos');
  if (!tbody) return;
  tbody.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'productos'));
    snap.forEach(d => {
      const data = d.data();
      const fila = document.createElement('tr');
      fila.innerHTML = `<td>${data.nombre}</td><td>${data.seccionId || '-'}</td>
        <td>$${data.precioUruguay || 0}</td><td>R$${data.precioBrasil || 0}</td>
        <td>${data.comercioId || '-'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">Eliminar</button></td>`;
      tbody.appendChild(fila);
    });
  } catch (err) { console.error('Error productos:', err); }
}

window.deleteProducto = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'productos', id)); loadProductos(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== COMERCIOS ==========
document.getElementById('btn-add-comercio')?.addEventListener('click', addComercio);

async function addComercio() {
  const nombre = document.getElementById('com-nombre').value.trim();
  const tipo = document.getElementById('com-tipo').value;
  const direccion = document.getElementById('com-direccion').value.trim();
  const telefono = document.getElementById('com-telefono').value.trim();
  const email = document.getElementById('com-email').value.trim();

  if (!nombre) return showAlert('Ingresá el nombre del comercio', 'warning');

  try {
    await addDoc(collection(db, 'comercios'), {
      nombre, tipo, direccion, telefono, email,
      activo: true, premium: false,
      createdAt: serverTimestamp()
    });
    document.getElementById('com-nombre').value = '';
    document.getElementById('com-direccion').value = '';
    document.getElementById('com-telefono').value = '';
    document.getElementById('com-email').value = '';
    showAlert('Comercio agregado', 'success');
    loadComercios();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

async function loadComercios() {
  const cont = document.getElementById('lista-comercios');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'comercios'));
    const select = document.getElementById('prod-comercio');
    if (select) select.innerHTML = '<option value="">Sin comercio</option>';
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
      div.innerHTML = `<strong>${data.nombre}</strong> (${data.tipo})<br>
        <small>${data.direccion || 'Sin dirección'} | ${data.telefono || 'Sin teléfono'}</small><br>
        <button class="btn btn-sm btn-danger" onclick="deleteComercio('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
      if (select) select.innerHTML += `<option value="${d.id}">${data.nombre}</option>`;
    });
  } catch (err) { console.error('Error comercios:', err); }
}

window.deleteComercio = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'comercios', id)); loadComercios(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== PAGOS ==========
async function loadPagos() {
  const contCom = document.getElementById('lista-pagos-comerciantes');
  const contCli = document.getElementById('lista-pagos-clientes');

  if (contCom) {
    contCom.innerHTML = '<p>Cargando...</p>';
    try {
      const snap = await getDocs(collection(db, 'users'));
      const comerciantes = [];
      snap.forEach(d => { if (d.data().role === 'comerciante') comerciantes.push({ id: d.id, ...d.data() }); });

      if (comerciantes.length === 0) {
        contCom.innerHTML = '<p style="color:#666;">Sin comerciantes registrados</p>';
      } else {
        contCom.innerHTML = '';
        comerciantes.forEach(c => {
          const div = document.createElement('div');
          div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
          const dias = c.diasRestantes || 0;
          const estado = c.plan === 'vencido' ? '⚠️ Vencido' : (c.plan === 'activo' ? '✅ Activo' : '🆓 Prueba');
          div.innerHTML = `<strong>${c.comercio || c.nombre}</strong><br>
            <small>${c.email} | ${estado} | Días: ${dias}</small><br>
            <button class="btn btn-sm btn-success" onclick="extenderCom('${c.id}',30)">+30 días</button>
            <button class="btn btn-sm btn-warning" onclick="habilitarCom('${c.id}',30)">Habilitar</button>
            <button class="btn btn-sm btn-danger" onclick="suspenderCom('${c.id}')">Suspender</button>`;
          contCom.appendChild(div);
        });
      }
    } catch (err) { contCom.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`; }
  }

  if (contCli) {
    contCli.innerHTML = '<p>Cargando...</p>';
    try {
      const snap = await getDocs(collection(db, 'users'));
      const clientes = [];
      snap.forEach(d => { if (d.data().role === 'cliente') clientes.push({ id: d.id, ...d.data() }); });

      if (clientes.length === 0) {
        contCli.innerHTML = '<p style="color:#666;">Sin clientes registrados</p>';
      } else {
        contCli.innerHTML = '';
        clientes.forEach(c => {
          const div = document.createElement('div');
          div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
          const plan = c.plan === 'premium' ? '⭐ Premium' : '🆓 Gratis';
          div.innerHTML = `<strong>${c.nombre}</strong><br>
            <small>${c.email} | ${plan}</small><br>
            <button class="btn btn-sm btn-success" onclick="activarPrem('${c.id}',30)">+30 días Premium</button>
            <button class="btn btn-sm btn-warning" onclick="quitarPrem('${c.id}')">Volver a gratis</button>`;
          contCli.appendChild(div);
        });
      }
    } catch (err) { contCli.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`; }
  }
}

window.extenderCom = async (id, dias) => {
  try {
    await updateDoc(doc(db, 'users', id), {
      plan: 'activo', diasRestantes: dias, activo: true
    });
    showAlert(`Extendido ${dias} días`, 'success');
    loadPagos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

window.habilitarCom = window.extenderCom;

window.suspenderCom = async (id) => {
  if (!confirm('¿Suspender?')) return;
  try {
    await updateDoc(doc(db, 'users', id), { activo: false, plan: 'suspendido' });
    showAlert('Suspendido', 'warning');
    loadPagos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

window.activarPrem = async (id, dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  try {
    await updateDoc(doc(db, 'users', id), {
      plan: 'premium', 
      fechaVencimientoPremium: fecha.toISOString(),
      premiumActivo: true
    });
    showAlert('✅ Premium activado por 30 días', 'success');
    loadPagos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

window.quitarPrem = async (id) => {
  if (!confirm('¿Quitar premium?')) return;
  try {
    await updateDoc(doc(db, 'users', id), { 
      plan: 'gratis', 
      fechaVencimientoPremium: null,
      premiumActivo: false
    });
    showAlert('Vuelto a plan gratis', 'info');
    loadPagos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== USUARIOS ==========
async function loadUsuarios() {
  const cont = document.getElementById('lista-todos-usuarios');
  if (!cont) return;
  cont.innerHTML = '<p>Cargando...</p>';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = [];
    snap.forEach(d => users.push({ id: d.id, ...d.data() }));

    if (users.length === 0) {
      cont.innerHTML = '<p style="color:#666;">Sin usuarios registrados aún</p>';
    } else {
      cont.innerHTML = '';
      users.forEach(u => {
        const div = document.createElement('div');
        div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
        const rol = u.role === 'admin' ? '👑 Admin' : (u.role === 'comerciante' ? ' Comerciante' : '🛒 Cliente');
        div.innerHTML = `<strong>${u.nombre}</strong> ${rol}<br>
          <small>${u.email} | Plan: ${u.plan || 'N/A'}</small>`;
        cont.appendChild(div);
      });
    }
  } catch (err) { cont.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`; }
}

// ========== EXCURSIONES ==========
document.getElementById('btn-add-excursion')?.addEventListener('click', addExcursion);

async function addExcursion() {
  const fecha = document.getElementById('exc-fecha').value;
  const horaSalida = document.getElementById('exc-hora-salida').value;
  const punto = document.getElementById('exc-punto').value.trim();
  const horaRetorno = document.getElementById('exc-hora-retorno').value;
  const precio = parseFloat(document.getElementById('exc-precio').value) || 0;
  const lugares = parseInt(document.getElementById('exc-lugares').value) || 0;
  const van = document.getElementById('exc-van').value.trim();

  if (!fecha || !horaSalida || !punto) return showAlert('Completá fecha, hora y punto', 'warning');

  try {
    await addDoc(collection(db, 'excursiones'), {
      fecha, horaSalida, punto, horaRetorno, precio, lugares,
      lugaresOcupados: 0, van, publicada: true,
      createdAt: serverTimestamp()
    });
    document.getElementById('exc-fecha').value = '';
    document.getElementById('exc-hora-salida').value = '';
    document.getElementById('exc-punto').value = '';
    document.getElementById('exc-hora-retorno').value = '';
    document.getElementById('exc-precio').value = '';
    document.getElementById('exc-lugares').value = '';
    document.getElementById('exc-van').value = '';
    showAlert('Excursión publicada', 'success');
    loadExcursiones();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
}

async function loadExcursiones() {
  const cont = document.getElementById('lista-excursiones');
  if (!cont) return;
  cont.innerHTML = '<p>Cargando...</p>';
  try {
    const snap = await getDocs(collection(db, 'excursiones'));
    const excursiones = [];
    snap.forEach(d => excursiones.push({ id: d.id, ...d.data() }));
    excursiones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (excursiones.length === 0) {
      cont.innerHTML = '<p style="color:#666;">Sin excursiones programadas</p>';
      return;
    }

    cont.innerHTML = '';
    excursiones.forEach(exc => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '15px';
      const totalLugares = exc.lugaresTotales || exc.lugares || 0;
      const ocupados = exc.lugaresOcupados || 0;
      const esAdminExcursion = exc.adminId ? true : false;
      div.innerHTML = `
        <h3>${esAdminExcursion ? '🚌' : '🚐'} ${exc.ruta || 'Excursión'} ${esAdminExcursion ? '<small style="color:#666;">(Admin: ' + (exc.adminNombre || '') + ')</small>' : ''}</h3>
        <div class="grid grid-2">
          <div><strong>Fecha:</strong> ${exc.fecha || '-'}</div>
          <div><strong>Horario:</strong> ${exc.horaSalida || '-'} → ${exc.horaRetorno || '-'}</div>
          <div><strong>Punto:</strong> ${exc.punto || '-'}</div>
          <div><strong>Precio:</strong> $${exc.precio || 0}</div>
          ${exc.sena ? `<div><strong>Seña:</strong> $${exc.sena} por persona</div>` : ''}
          <div><strong>Lugares:</strong> ${ocupados}/${totalLugares}</div>
          ${exc.adminWhatsapp ? `<div><strong>WhatsApp:</strong> ${exc.adminWhatsapp}</div>` : ''}
          ${exc.van ? `<div><strong>Van:</strong> ${exc.van}</div>` : ''}
        </div>
        ${exc.descripcion ? `<p style="margin-top:10px; color:#666;">${exc.descripcion}</p>` : ''}
        <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-warning" onclick="cancelarExcursion('${exc.id}')">Cancelar (ocultar)</button>
          <button class="btn btn-sm btn-danger" onclick="borrarExcursion('${exc.id}')"> Borrar definitivamente</button>
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

window.cancelarExcursion = async (id) => {
  if (!confirm('¿Cancelar (ocultar) esta excursión? Los clientes ya no la verán, pero quedará en la base de datos.')) return;
  try {
    await updateDoc(doc(db, 'excursiones', id), { activa: false, publicada: false });
    showAlert('Excursión cancelada (oculta)', 'warning');
    loadExcursiones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.borrarExcursion = async (id) => {
  if (!confirm('⚠️ ATENCIÓN: Esto borrará la excursión DEFINITIVAMENTE de la base de datos. ¿Continuar?')) return;
  if (!confirm('¿Estás SEGURO? Esta acción no se puede deshacer.')) return;
  try {
    await deleteDoc(doc(db, 'excursiones', id));
    showAlert('Excursión borrada definitivamente', 'danger');
    loadExcursiones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== VIDEOS ==========
async function loadVideos() {
  const cont = document.getElementById('lista-videos');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'videos'));
    if (snap.empty) { cont.innerHTML = '<p style="color:#666;">Sin videos</p>'; return; }
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
      div.innerHTML = `<video src="${data.url}" controls style="width:100%; max-height:200px;"></video>
        <strong>${data.titulo}</strong><br>
        <button class="btn btn-sm btn-danger" onclick="deleteVid('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
    });
  } catch (err) { console.error('Error videos:', err); }
}

window.deleteVid = async (id) => {
  if (!confirm('¿Eliminar?')) return;
  try { await deleteDoc(doc(db, 'videos', id)); loadVideos(); }
  catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// ========== APROBACIONES ==========
async function loadAprobaciones() {
  const cont = document.getElementById('lista-aprobaciones');
  if (!cont) return;
  cont.innerHTML = '<p>Cargando...</p>';

  try {
    const snap = await getDocs(collection(db, 'users'));
    const pendientes = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.role === 'admin_excursion' && !data.aprobado) {
        pendientes.push({ id: d.id, ...data });
      }
    });

    if (pendientes.length === 0) {
      cont.innerHTML = '<p style="color:#666;">No hay aprobaciones pendientes</p>';
      return;
    }

    cont.innerHTML = '';
    pendientes.forEach(p => {
      const div = document.createElement('div');
      div.style.cssText = 'padding:15px; border-bottom:1px solid #eee; background:#fff3cd; border-radius:8px; margin-bottom:10px;';
      div.innerHTML = `
        <strong>${p.nombre}</strong><br>
        <small>${p.email}</small><br>
        <small>🚌 Ruta: ${p.ruta || 'Sin definir'}</small><br>
        <small> ${p.telefono || 'Sin teléfono'}</small><br>
        <button class="btn btn-sm btn-success" onclick="aprobarAdmin('${p.id}', '${p.email}')">✅ Aprobar</button>
        <button class="btn btn-sm btn-danger" onclick="rechazarAdmin('${p.id}', '${p.email}')">❌ Rechazar</button>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

window.aprobarAdmin = async (id, email) => {
  if (!confirm(`¿Aprobar a ${email} como admin de excursión?`)) return;
  try {
    await updateDoc(doc(db, 'users', id), { aprobado: true });
    showAlert('Admin aprobado', 'success');
    loadAprobaciones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.rechazarAdmin = async (id, email) => {
  if (!confirm(`¿Rechazar a ${email}?`)) return;
  try {
    await deleteDoc(doc(db, 'users', id));
    showAlert('Admin rechazado', 'warning');
    loadAprobaciones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== GENERAR USUARIOS FICTICIOS ==========
document.getElementById('btn-generar-usuarios')?.addEventListener('click', generarFicticios);

async function generarFicticios() {
  const resultadoDiv = document.getElementById('resultado-generacion');
  if (resultadoDiv) resultadoDiv.innerHTML = '<p>Generando...</p>';

  const nombresUY = ['Juan','María','Carlos','Ana','Pedro','Laura','Diego','Sofía','Martín','Valentina','Santiago','Camila'];
  const apellidosUY = ['Pérez','González','Rodríguez','Fernández','López','Martínez','Sánchez','Ramírez','Silva','Alvarez'];
  const nombresBR = ['João','Maria','José','Ana','Carlos','Paula','Pedro','Mariana','Lucas','Julia'];
  const apellidosBR = ['Silva','Santos','Oliveira','Souza','Rodrigues','Ferreira','Alves','Pereira','Lima'];
  const tiposCom = ['supermercado','carniceria','farmacia','bebidas','ropa','electronica','panaderia'];
  const nombresCom = ['Super Central','Mercado Popular','Farma Vida','Depósito Bebidas','Moda Style','TecnoDigital','Panadería El Horno','Carnes El Gaucho'];

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  let exitosos = 0;

  try {
    // 180 clientes
    for (let i = 0; i < 180; i++) {
      const esUY = Math.random() > 0.4;
      const nombre = esUY ? nombresUY[rand(0,nombresUY.length-1)] : nombresBR[rand(0,nombresBR.length-1)];
      const apellido = esUY ? apellidosUY[rand(0,apellidosUY.length-1)] : apellidosBR[rand(0,apellidosBR.length-1)];
      const esPremium = Math.random() > 0.85;

      await addDoc(collection(db, 'users'), {
        nombre: `${nombre} ${apellido}`,
        email: `${nombre.toLowerCase().charAt(0)}${apellido.toLowerCase()}${rand(10,999)}@gmail.com`,
        role: 'cliente',
        plan: esPremium ? 'premium' : 'gratis',
        pais: esUY ? 'UY' : 'BR',
        activo: true,
        ficticio: true,
        createdAt: serverTimestamp()
      });
      exitosos++;
    }

    // 70 comercios
    for (let i = 0; i < 70; i++) {
      const esUY = Math.random() > 0.7;
      const nombreCom = `${nombresCom[rand(0,nombresCom.length-1)]} ${rand(1,99)}`;

      await addDoc(collection(db, 'users'), {
        nombre: `${nombresUY[rand(0,nombresUY.length-1)]} ${apellidosUY[rand(0,apellidosUY.length-1)]}`,
        email: `comercio${rand(10,999)}@gmail.com`,
        role: 'comerciante',
        comercio: nombreCom,
        tipoComercio: tiposCom[rand(0,tiposCom.length-1)],
        plan: 'prueba',
        pais: esUY ? 'UY' : 'BR',
        diasRestantes: rand(15, 60),
        activo: true,
        ficticio: true,
        createdAt: serverTimestamp()
      });
      exitosos++;
    }

    if (resultadoDiv) {
      resultadoDiv.innerHTML = `<div class="alert alert-success">✅ Generados ${exitosos} usuarios ficticios<br>180 clientes + 70 comercios</div>`;
    }
    loadUsuarios();
    showAlert(`${exitosos} usuarios generados`, 'success');
  } catch (err) {
    if (resultadoDiv) resultadoDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

// ========== BUSCADOR DE USUARIOS ==========
function initBuscador() {
  const contenedor = document.getElementById('buscador-usuarios-container');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="card" style="background:#f0f4ff; border-left:4px solid #0038A8; margin-bottom:20px;">
      <div class="card-header"> Buscar Usuario</div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Buscar por nombre, email o comercio</label>
          <input type="text" id="buscador-input" class="form-control" placeholder="Ej: Carlos, carlos@..., Super Central...">
        </div>
        <div class="form-group">
          <label>Filtrar por rol</label>
          <select id="buscador-rol" class="form-control">
            <option value="">Todos los roles</option>
            <option value="admin">Admin General</option>
            <option value="comerciante">Comerciante</option>
            <option value="cliente">Cliente</option>
            <option value="admin_excursion">Admin Excursión</option>
          </select>
        </div>
      </div>
      <div class="btn-group" style="margin-top:10px;">
        <button id="btn-buscar" class="btn btn-primary"> Buscar</button>
        <button id="btn-limpiar-buscador" class="btn btn-warning">Limpiar</button>
        <span id="resultado-contador" style="padding:10px; color:#666;"></span>
      </div>
    </div>
    <div id="buscador-resultados" style="margin-top:20px;"></div>
  `;

  document.getElementById('btn-buscar').addEventListener('click', buscarUsuarios);
  document.getElementById('btn-limpiar-buscador').addEventListener('click', () => {
    document.getElementById('buscador-input').value = '';
    document.getElementById('buscador-rol').value = '';
    document.getElementById('buscador-resultados').innerHTML = '';
    document.getElementById('resultado-contador').textContent = '';
  });

  document.getElementById('buscador-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarUsuarios();
  });
}

async function buscarUsuarios() {
  const query = document.getElementById('buscador-input').value.trim().toLowerCase();
  const rolFiltro = document.getElementById('buscador-rol').value;
  const contenedor = document.getElementById('buscador-resultados');
  const contador = document.getElementById('resultado-contador');

  if (!query && !rolFiltro) {
    contenedor.innerHTML = '<div class="alert alert-warning">Ingresá un término de búsqueda o seleccioná un rol</div>';
    return;
  }

  contenedor.innerHTML = '<p style="text-align:center;color:#666;">Buscando...</p>';
  contador.textContent = '';

  try {
    const snap = await getDocs(collection(db, 'users'));
    const todos = [];
    snap.forEach(d => todos.push({ id: d.id, ...d.data() }));

    const filtrados = todos.filter(u => {
      const matchQuery = !query ||
        (u.nombre && u.nombre.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.comercio && u.comercio.toLowerCase().includes(query)) ||
        (u.ruta && u.ruta.toLowerCase().includes(query));
      const matchRol = !rolFiltro || u.role === rolFiltro;
      return matchQuery && matchRol;
    });

    contador.textContent = `Encontrados: ${filtrados.length} de ${todos.length}`;

    if (filtrados.length === 0) {
      contenedor.innerHTML = '<div class="alert alert-warning">No se encontraron usuarios</div>';
      return;
    }

    contenedor.innerHTML = '';
    filtrados.forEach(u => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '10px';
      let infoHTML = `<div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:10px;"><div style="flex:1; min-width:250px;">`;
      infoHTML += `<h4>${u.role === 'admin' ? '' : u.role === 'comerciante' ? '' : u.role === 'admin_excursion' ? '' : ''} ${u.nombre || 'Sin nombre'}</h4>`;
      infoHTML += `<p style="margin:5px 0;"><small> ${u.email || '-'}</small></p>`;

      if (u.role === 'comerciante') {
        infoHTML += `<p style="margin:5px 0;"><small> ${u.comercio || '-'}</small></p>`;
        infoHTML += `<p style="margin:5px 0;"><small>💰 Plan: <strong>${u.plan || 'prueba'}</strong> | Días: ${u.diasRestantes || 0}</small></p>`;
      } else if (u.role === 'cliente') {
        infoHTML += `<p style="margin:5px 0;"><small>⭐ Plan: <strong>${u.plan === 'premium' ? 'Premium' : 'Gratis'}</strong></small></p>`;
      } else if (u.role === 'admin_excursion') {
        infoHTML += `<p style="margin:5px 0;"><small> Ruta: ${u.ruta || '-'}</small></p>`;
        infoHTML += `<p style="margin:5px 0;"><small>✅ Aprobado: <strong>${u.aprobado ? 'Sí' : 'No'}</strong></small></p>`;
      }
      infoHTML += `</div><div style="display:flex; flex-direction:column; gap:5px;">`;

      if (u.role === 'cliente') {
        if (u.plan === 'premium') {
          infoHTML += `<button class="btn btn-sm btn-warning" onclick="window.quitarPrem('${u.id}')">Quitar Premium</button>`;
          infoHTML += `<button class="btn btn-sm btn-warning" onclick="window.quitarPremByEmail('${u.email}')">Quitar (x email)</button>`;
        } else {
          infoHTML += `<button class="btn btn-sm btn-success" onclick="window.activarPremBuscador('${u.id}')">+30 días Premium</button>`;
          infoHTML += `<button class="btn btn-sm btn-success" onclick="window.activarPremByEmail('${u.email}')">Premium (x email)</button>`;
        }
      } else if (u.role === 'comerciante') {
        infoHTML += `<button class="btn btn-sm btn-success" onclick="window.extenderComBuscador('${u.id}')">+30 días</button>`;
        infoHTML += `<button class="btn btn-sm btn-primary" onclick="window.habilitarComBuscador('${u.id}')">Habilitar</button>`;
        infoHTML += `<button class="btn btn-sm btn-danger" onclick="window.suspenderComBuscador('${u.id}')">Suspender</button>`;
      } else if (u.role === 'admin_excursion') {
        if (!u.aprobado) {
          infoHTML += `<button class="btn btn-sm btn-success" onclick="window.aprobarAdminBuscador('${u.id}')">✅ Aprobar</button>`;
        } else {
          infoHTML += `<button class="btn btn-sm btn-warning" onclick="window.desaprobarAdminBuscador('${u.id}')">Desaprobar</button>`;
        }
        infoHTML += `<button class="btn btn-sm btn-danger" onclick="window.rechazarAdminBuscador('${u.id}')">🗑 Rechazar</button>`;
      }
      infoHTML += `</div></div>`;
      div.innerHTML = infoHTML;
      contenedor.appendChild(div);
    });

// Función para buscar y actualizar por EMAIL (más confiable)
window.activarPremByEmail = async (email) => {
  const dias = parseInt(prompt('¿Cuántos días de Premium?', '30')) || 30;
  const fecha = new Date(); fecha.setDate(fecha.getDate() + dias);
  try {
    // Buscar el documento por email
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) {
      showAlert('❌ Usuario no encontrado', 'danger');
      return;
    }
    // Puede haber múltiples, actualizamos todos los que coincidan
    let actualizados = 0;
    snap.forEach(async (d) => {
      await updateDoc(doc(db, 'users', d.id), { 
        plan: 'premium', 
        fechaVencimientoPremium: fecha.toISOString(), 
        premiumActivo: true 
      });
      actualizados++;
    });
    showAlert(`✅ Premium activado para ${email} (${actualizados} doc(s))`, 'success');
    console.log(`✅ Premium activado: ${email}, días: ${dias}`);
    buscarUsuarios(); loadPagos();
  } catch (err) { 
    showAlert(`Error: ${err.message}`, 'danger'); 
    console.error('Error:', err);
  }
};

window.quitarPremByEmail = async (email) => {
  if (!confirm(`¿Quitar Premium a ${email}?`)) return;
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    snap.forEach(async (d) => {
      await updateDoc(doc(db, 'users', d.id), { 
        plan: 'gratis', 
        fechaVencimientoPremium: null,
        premiumActivo: false
      });
    });
    showAlert(`✅ ${email} vuelto a gratis`, 'info');
    buscarUsuarios(); loadPagos();
  } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
};

// Funciones globales
window.activarPremBuscador = async (id) => {
      const dias = parseInt(prompt('¿Cuántos días de Premium?', '30')) || 30;
      const fecha = new Date(); fecha.setDate(fecha.getDate() + dias);
      try {
        console.log('✅ Activando premium para documento:', id);
        await updateDoc(doc(db, 'users', id), { 
          plan: 'premium', 
          fechaVencimientoPremium: fecha.toISOString(), 
          premiumActivo: true 
        });
        showAlert(`✅ Premium activado por ${dias} días`, 'success');
        buscarUsuarios(); loadPagos();
      } catch (err) { 
        showAlert(`Error: ${err.message}`, 'danger'); 
        console.error('Error activando premium:', err);
      }
    };
    window.extenderComBuscador = async (id) => {
      const dias = parseInt(prompt('¿Cuántos días?', '30')) || 30;
      try {
        const ud = await getDoc(doc(db, 'users', id));
        await updateDoc(doc(db, 'users', id), { plan: 'activo', diasRestantes: (ud.data().diasRestantes||0)+dias, activo: true });
        showAlert(`✅ Extendido ${dias} días`, 'success');
        buscarUsuarios(); loadPagos();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };
    window.habilitarComBuscador = async (id) => {
      const dias = parseInt(prompt('¿Cuántos días?', '30')) || 30;
      const fecha = new Date(); fecha.setDate(fecha.getDate() + dias);
      try {
        await updateDoc(doc(db, 'users', id), { plan: 'activo', diasRestantes: dias, fechaVencimiento: fecha.toISOString(), activo: true });
        showAlert(`✅ Habilitado por ${dias} días`, 'success');
        buscarUsuarios(); loadPagos();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };
    window.suspenderComBuscador = async (id) => {
      if (!confirm('¿Suspender comerciante?')) return;
      try { await updateDoc(doc(db, 'users', id), { activo: false, plan: 'suspendido' }); showAlert('⚠️ Suspendido', 'warning'); buscarUsuarios(); loadPagos(); }
      catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };
    window.aprobarAdminBuscador = async (id) => {
      if (!confirm('¿Aprobar admin de excursión?')) return;
      try { await updateDoc(doc(db, 'users', id), { aprobado: true }); showAlert('✅ Aprobado', 'success'); buscarUsuarios(); loadAprobaciones(); }
      catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };
    window.desaprobarAdminBuscador = async (id) => {
      if (!confirm('¿Desaprobar?')) return;
      try { await updateDoc(doc(db, 'users', id), { aprobado: false }); showAlert('⚠️ Desaprobado', 'warning'); buscarUsuarios(); loadAprobaciones(); }
      catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };
    window.rechazarAdminBuscador = async (id) => {
      if (!confirm('¿Rechazar y eliminar? No se puede deshacer.')) return;
      try { await deleteDoc(doc(db, 'users', id)); showAlert('🗑 Eliminado', 'danger'); buscarUsuarios(); loadAprobaciones(); }
      catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };
  } catch (err) {
    contenedor.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

// Necesario para getDoc en buscador
import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========== INICIALIZAR TODO ==========
loadSecciones();
loadProductos();
loadComercios();
loadPagos();
loadUsuarios();
loadExcursiones();
loadVideos();
loadAprobaciones();
initBuscador();