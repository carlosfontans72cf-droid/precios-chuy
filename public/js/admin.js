// Panel de Administración - Precios Chuy
import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showAlert } from './utils.js';

// Verificar que sea admin
const role = sessionStorage.getItem('userRole');
if (role !== 'admin') {
  window.location.href = '/index.html';
}

// ========== SECCIONES ==========
document.getElementById('btn-add-seccion')?.addEventListener('click', addSeccion);
async function addSeccion() {
  const nombre = document.getElementById('seccion-nombre').value.trim();
  const icono = document.getElementById('seccion-icono').value.trim();
  if (!nombre) return showAlert('Ingresá el nombre de la sección', 'warning');

  try {
    await addDoc(collection(db, 'secciones'), {
      nombre, icono: icono || '📦',
      createdAt: serverTimestamp()
    });
    document.getElementById('seccion-nombre').value = '';
    document.getElementById('seccion-icono').value = '';
    showAlert('Sección agregada', 'success');
    loadSecciones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
}

async function loadSecciones() {
  const cont = document.getElementById('lista-secciones');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'secciones'));
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;';
      div.innerHTML = `<span>${data.icono || '📦'} ${data.nombre}</span>
        <button class="btn btn-sm btn-danger" onclick="deleteSeccion('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
    });
    // Actualizar select de productos
    const select = document.getElementById('prod-seccion');
    if (select) {
      select.innerHTML = '<option value="">Seleccionar sección</option>';
      snap.forEach(d => {
        const data = d.data();
        select.innerHTML += `<option value="${d.id}">${data.icono || ''} ${data.nombre}</option>`;
      });
    }
  } catch (err) {
    console.error('Error cargando secciones:', err);
  }
}

window.deleteSeccion = async (id) => {
  if (!confirm('¿Eliminar sección?')) return;
  try {
    await deleteDoc(doc(db, 'secciones', id));
    showAlert('Sección eliminada', 'success');
    loadSecciones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== PRODUCTOS ==========
document.getElementById('btn-add-producto')?.addEventListener('click', addProducto);
async function addProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const seccion = document.getElementById('prod-seccion').value;
  const precioUy = parseFloat(document.getElementById('prod-precio-uy').value);
  const precioBr = parseFloat(document.getElementById('prod-precio-br').value);
  const comercio = document.getElementById('prod-comercio').value;
  const imagen = document.getElementById('prod-imagen').value.trim();

  if (!nombre || !seccion) return showAlert('Completá nombre y sección', 'warning');

  try {
    await addDoc(collection(db, 'productos'), {
      nombre, seccionId: seccion,
      precioUruguay: precioUy || 0,
      precioBrasil: precioBr || 0,
      comercioId: comercio || null,
      imagen: imagen || null,
      activo: true,
      createdAt: serverTimestamp()
    });
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio-uy').value = '';
    document.getElementById('prod-precio-br').value = '';
    document.getElementById('prod-imagen').value = '';
    showAlert('Producto agregado', 'success');
    loadProductos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
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
      fila.innerHTML = `
        <td>${data.nombre}</td>
        <td>${data.seccionId || '-'}</td>
        <td>$${data.precioUruguay || 0}</td>
        <td>R$${data.precioBrasil || 0}</td>
        <td>${data.comercioId || '-'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">Eliminar</button></td>
      `;
      tbody.appendChild(fila);
    });
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
      activo: true,
      premium: false,
      createdAt: serverTimestamp()
    });
    document.getElementById('com-nombre').value = '';
    document.getElementById('com-direccion').value = '';
    document.getElementById('com-telefono').value = '';
    document.getElementById('com-email').value = '';
    showAlert('Comercio agregado', 'success');
    loadComercios();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
}

async function loadComercios() {
  const cont = document.getElementById('lista-comercios');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'comercios'));
    // Actualizar select de productos
    const select = document.getElementById('prod-comercio');
    if (select) select.innerHTML = '<option value="">Sin comercio</option>';

    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px;border-bottom:1px solid #eee;';
      div.innerHTML = `<strong>${data.nombre}</strong> (${data.tipo})<br>
        <small>${data.direccion || 'Sin dirección'} | ${data.telefono || 'Sin teléfono'}</small><br>
        <button class="btn btn-sm btn-danger" onclick="deleteComercio('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
      if (select) select.innerHTML += `<option value="${d.id}">${data.nombre}</option>`;
    });
  } catch (err) {
    console.error('Error cargando comercios:', err);
  }
}

window.deleteComercio = async (id) => {
  if (!confirm('¿Eliminar comercio?')) return;
  try {
    await deleteDoc(doc(db, 'comercios', id));
    showAlert('Comercio eliminado', 'success');
    loadComercios();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== EXCURSIONES ==========
document.getElementById('btn-add-excursion')?.addEventListener('click', addExcursion);
async function addExcursion() {
  const fecha = document.getElementById('exc-fecha').value;
  const horaSalida = document.getElementById('exc-hora-salida').value;
  const punto = document.getElementById('exc-punto').value.trim();
  const horaRetorno = document.getElementById('exc-hora-retorno').value;
  const precio = parseFloat(document.getElementById('exc-precio').value);
  const lugares = parseInt(document.getElementById('exc-lugares').value);
  const van = document.getElementById('exc-van').value.trim();

  if (!fecha || !horaSalida || !punto) return showAlert('Completá fecha, hora y punto de encuentro', 'warning');

  try {
    await addDoc(collection(db, 'excursiones'), {
      fecha, horaSalida, punto, horaRetorno,
      precio: precio || 0,
      lugares: lugares || 0,
      lugaresOcupados: 0,
      van,
      publicada: true,
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
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
}

async function loadExcursiones() {
  const cont = document.getElementById('lista-excursiones');
  if (!cont) return;
  cont.innerHTML = '';
  try {
    const snap = await getDocs(collection(db, 'excursiones'));
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.style.cssText = 'padding:10px;border-bottom:1px solid #eee;';
      div.innerHTML = `<strong>${data.fecha}</strong> - ${data.horaSalida} hs<br>
        Punto: ${data.punto} | Retorno: ${data.horaRetorno} hs<br>
        Precio: $${data.precio} | Lugares: ${data.lugaresOcupados || 0}/${data.lugares}<br>
        Van: ${data.van || 'Sin asignar'}<br>
        <button class="btn btn-sm btn-danger" onclick="deleteExcursion('${d.id}')">Eliminar</button>`;
      cont.appendChild(div);
    });
  } catch (err) {
    console.error('Error cargando excursiones:', err);
  }
}

window.deleteExcursion = async (id) => {
  if (!confirm('¿Eliminar excursión?')) return;
  try {
    await deleteDoc(doc(db, 'excursiones', id));
    showAlert('Excursión eliminada', 'success');
    loadExcursiones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== PAGOS ==========
async function loadPagos() {
  const contComerciantes = document.getElementById('lista-pagos-comerciantes');
  const contClientes = document.getElementById('lista-pagos-clientes');

  if (contComerciantes) {
    contComerciantes.innerHTML = '';
    try {
      const snap = await getDocs(collection(db, 'users'));
      const comerciantes = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.role === 'comerciante') {
          comerciantes.push({ id: d.id, ...data });
        }
      });

      if (comerciantes.length === 0) {
        contComerciantes.innerHTML = '<p style="color:#666;">Sin comerciantes registrados</p>';
      } else {
        comerciantes.forEach(c => {
          const div = document.createElement('div');
          div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
          const diasRestantes = c.diasRestantes || 0;
          const estado = diasRestantes > 0 ? '✅ Activo' : '⚠️ Vencido';
          div.innerHTML = `
            <strong>${c.comercio || c.nombre}</strong><br>
            <small>${c.email} | Plan: ${c.plan} | ${estado}</small><br>
            <small>Días restantes: ${diasRestantes}</small><br>
            <button class="btn btn-sm btn-success" onclick="extenderComerciante('${c.id}', 30)">+30 días</button>
            <button class="btn btn-sm btn-warning" onclick="habilitarComerciante('${c.id}', 30)">Habilitar</button>
            <button class="btn btn-sm btn-danger" onclick="suspenderComerciante('${c.id}')">Suspender</button>
          `;
          contComerciantes.appendChild(div);
        });
      }
    } catch (err) {
      console.error('Error cargando pagos comerciantes:', err);
    }
  }

  if (contClientes) {
    contClientes.innerHTML = '';
    try {
      const snap = await getDocs(collection(db, 'users'));
      const clientes = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.role === 'cliente' && data.plan === 'premium') {
          clientes.push({ id: d.id, ...data });
        }
      });

      if (clientes.length === 0) {
        contClientes.innerHTML = '<p style="color:#666;">Sin clientes premium</p>';
      } else {
        clientes.forEach(c => {
          const div = document.createElement('div');
          div.style.cssText = 'padding:10px; border-bottom:1px solid #eee;';
          div.innerHTML = `
            <strong>${c.nombre}</strong><br>
            <small>${c.email}</small><br>
            <button class="btn btn-sm btn-success" onclick="extenderPremium('${c.id}', 30)">+30 días</button>
            <button class="btn btn-sm btn-warning" onclick="quitarPremium('${c.id}')">Volver a gratis</button>
          `;
          contClientes.appendChild(div);
        });
      }
    } catch (err) {
      console.error('Error cargando pagos clientes:', err);
    }
  }
}

window.extenderComerciante = async (id, dias) => {
  try {
    const { extenderSuscripcion } = await import('./admin-pagos.js');
    await extenderSuscripcion(id, dias);
    loadPagos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.habilitarComerciante = async (id, dias) => {
  try {
    const { habilitarManual } = await import('./admin-pagos.js');
    await habilitarManual(id, dias);
    loadPagos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.suspenderComerciante = async (id) => {
  if (!confirm('¿Suspender comerciante?')) return;
  try {
    const { suspenderUsuario } = await import('./admin-pagos.js');
    await suspenderUsuario(id);
    loadPagos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.extenderPremium = async (id, dias) => {
  try {
    const { activarPremiumCliente } = await import('./admin-pagos.js');
    await activarPremiumCliente(id, dias);
    loadPagos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.quitarPremium = async (id) => {
  if (!confirm('¿Quitar plan premium?')) return;
  try {
    const { desactivarPremiumCliente } = await import('./admin-pagos.js');
    await desactivarPremiumCliente(id);
    loadPagos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// Generar usuarios ficticios
document.getElementById('btn-generar-usuarios')?.addEventListener('click', async () => {
  const resultadoDiv = document.getElementById('resultado-generacion');
  if (resultadoDiv) {
    resultadoDiv.innerHTML = '<p>Generando usuarios...</p>';
    try {
      const { generarUsuariosFicticios } = await import('./generar-usuarios.js');
      const resultado = await generarUsuariosFicticios(200, 50);
      resultadoDiv.innerHTML = `
        <div class="alert alert-success">
          ✅ Generación completada<br>
          Exitosos: ${resultado.exitosos}<br>
          Errores: ${resultado.errores}<br>
          Total: ${resultado.total}
        </div>
      `;
    } catch (err) {
      resultadoDiv.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
    }
  }
});

// ========== INICIALIZACIÓN ==========
loadSecciones();
loadProductos();
loadComercios();
loadExcursiones();
loadPagos();