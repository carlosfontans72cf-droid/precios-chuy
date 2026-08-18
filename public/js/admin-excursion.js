// Panel Admin de Excursión - Precios Chuy
import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showAlert } from './utils.js';

const userId = sessionStorage.getItem('userId');
const userEmail = sessionStorage.getItem('userEmail');
const userRole = sessionStorage.getItem('userRole');

if (!userId || userRole !== 'admin_excursion') {
  window.location.href = '/index.html';
}

// Verificar si está aprobado
async function verificarAprobacion() {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', userEmail)));
    if (!userDoc.empty) {
      const data = userDoc.docs[0].data();
      if (!data.aprobado) {
        document.getElementById('aprobacion-pendiente').style.display = 'block';
        document.getElementById('panel-activo').style.display = 'none';
      } else {
        document.getElementById('aprobacion-pendiente').style.display = 'none';
        document.getElementById('panel-activo').style.display = 'block';
        loadExcursiones();
        loadReservas();
        loadStats();
      }
    }
  } catch (err) {
    console.error('Error verificando aprobación:', err);
  }
}

// ========== EXCURSIONES ==========
document.getElementById('btn-add-excursion')?.addEventListener('click', addExcursion);

async function addExcursion() {
  const fecha = document.getElementById('exc-fecha').value;
  const horaSalida = document.getElementById('exc-hora-salida').value;
  const punto = document.getElementById('exc-punto').value.trim();
  const horaRetorno = document.getElementById('exc-hora-retorno').value;
  const precio = parseFloat(document.getElementById('exc-precio').value) || 0;
  const sena = parseFloat(document.getElementById('exc-sena').value) || 0;
  const whatsapp = document.getElementById('exc-whatsapp').value.trim();
  const lugares = parseInt(document.getElementById('exc-lugares').value) || 0;
  const descripcion = document.getElementById('exc-descripcion').value.trim();

  if (!fecha || !horaSalida || !punto) {
    return showAlert('Completá fecha, hora y punto de encuentro', 'warning');
  }

  if (!whatsapp) {
    return showAlert('Agregá tu WhatsApp para que los clientes puedan contactarte', 'warning');
  }

  try {
    await addDoc(collection(db, 'excursiones'), {
      adminId: userId,
      adminNombre: sessionStorage.getItem('userName'),
      adminEmail: userEmail,
      adminWhatsapp: whatsapp,
      ruta: sessionStorage.getItem('userRuta') || 'Sin ruta definida',
      fecha,
      horaSalida,
      horaRetorno,
      punto,
      precio,
      sena,
      lugaresTotales: lugares,
      lugaresOcupados: 0,
      descripcion,
      publicada: true,
      activa: true,
      createdAt: serverTimestamp()
    });

    document.getElementById('exc-fecha').value = '';
    document.getElementById('exc-hora-salida').value = '';
    document.getElementById('exc-punto').value = '';
    document.getElementById('exc-hora-retorno').value = '';
    document.getElementById('exc-precio').value = '';
    document.getElementById('exc-sena').value = '';
    document.getElementById('exc-whatsapp').value = '';
    document.getElementById('exc-lugares').value = '';
    document.getElementById('exc-descripcion').value = '';

    showAlert('Excursión publicada', 'success');
    loadExcursiones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
}

async function loadExcursiones() {
  const cont = document.getElementById('lista-excursiones');
  if (!cont) return;
  cont.innerHTML = '<p>Cargando...</p>';

  try {
    const q = query(collection(db, 'excursiones'), where('adminId', '==', userId));
    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<p style="color:#666;">No tenés excursiones publicadas</p>';
      return;
    }

    cont.innerHTML = '';
    const excursiones = [];
    snap.forEach(d => excursiones.push({ id: d.id, ...d.data() }));
    excursiones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    excursiones.forEach(exc => {
      const porcentaje = (exc.lugaresOcupados / exc.lugaresTotales) * 100;
      const whatsappLink = exc.adminWhatsapp ? `https://wa.me/${exc.adminWhatsapp.replace(/[^0-9]/g, '')}` : '#';
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '15px';
      div.innerHTML = `
        <h3>🚌 ${exc.ruta}</h3>
        <div class="grid grid-2">
          <div><strong>Fecha:</strong> ${exc.fecha}</div>
          <div><strong>Horario:</strong> ${exc.horaSalida} - ${exc.horaRetorno}</div>
          <div><strong>Punto:</strong> ${exc.punto}</div>
          <div><strong>Precio:</strong> $${exc.precio}</div>
          <div><strong>Seña:</strong> $${exc.sena || 0} por persona</div>
          <div><strong>WhatsApp:</strong> ${exc.adminWhatsapp || 'No configurado'}</div>
        </div>
        <div style="margin-top:10px;">
          <strong>Lugares:</strong> ${exc.lugaresOcupados}/${exc.lugaresTotales}
          <div style="background:#ddd; border-radius:10px; overflow:hidden; height:20px; margin-top:5px;">
            <div style="width:${porcentaje}%; background:#009C3B; height:100%;"></div>
          </div>
        </div>
        ${exc.descripcion ? `<p style="margin-top:10px; color:#666;">${exc.descripcion}</p>` : ''}
        <div style="margin-top:15px;">
          <a href="${whatsappLink}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; margin-right:10px;"> WhatsApp</a>
          <button class="btn btn-sm btn-danger" onclick="deleteExcursion('${exc.id}')">Cancelar excursión</button>
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

window.deleteExcursion = async (id) => {
  if (!confirm('¿Cancelar esta excursión?')) return;
  try {
    await updateDoc(doc(db, 'excursiones', id), { activa: false, publicada: false });
    showAlert('Excursión cancelada', 'warning');
    loadExcursiones();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== RESERVAS ==========
async function loadReservas() {
  const cont = document.getElementById('lista-reservas');
  if (!cont) return;
  cont.innerHTML = '<p>Cargando...</p>';

  try {
    const q = query(collection(db, 'reservas'), where('adminId', '==', userId));
    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<p style="color:#666;">No tenés reservas aún</p>';
      return;
    }

    cont.innerHTML = '';
    const reservas = [];
    snap.forEach(d => reservas.push({ id: d.id, ...d.data() }));
    reservas.sort((a, b) => new Date(b.fechaReserva) - new Date(a.fechaReserva));

    reservas.forEach(res => {
      const div = document.createElement('div');
      div.className = 'reserva-card';
      const estadoClass = res.estado === 'confirmada' ? 'badge-active' : 
                         res.estado === 'cancelada' ? 'badge-inactive' : 'badge-warning';
      const whatsappLink = res.clienteTelefono ? `https://wa.me/${res.clienteTelefono.replace(/[^0-9]/g, '')}` : '#';
      const senaTotal = (res.sena || 0) * (res.personas || 1);
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:10px;">
          <div style="flex:1; min-width:250px;">
            <h4>${res.clienteNombre}</h4>
            <p style="margin:5px 0; color:#666;">
               ${res.clienteTelefono} |  ${res.personas} persona(s)
            </p>
            <p style="margin:5px 0; color:#666;">
              🚌 ${res.ruta} |  ${res.fechaExcursion}
            </p>
            ${res.sena ? `<p style="margin:5px 0; color:#009C3B; font-weight:bold;">💰 Seña: $${senaTotal} ($${res.sena} x ${res.personas})</p>` : ''}
            <span class="badge ${estadoClass}">${res.estado}</span>
          </div>
          <div style="display:flex; gap:5px; flex-wrap:wrap;">
            <a href="${whatsappLink}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; text-decoration:none;">💬 WhatsApp</a>
            <button class="btn btn-sm btn-success" onclick="confirmarReserva('${res.id}')">Confirmar</button>
            <button class="btn btn-sm btn-danger" onclick="cancelarReserva('${res.id}')">Cancelar</button>
          </div>
        </div>
      `;
      cont.appendChild(div);
    });
  } catch (err) {
    cont.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

window.confirmarReserva = async (id) => {
  try {
    await updateDoc(doc(db, 'reservas', id), { estado: 'confirmada' });
    showAlert('Reserva confirmada', 'success');
    loadReservas();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

window.cancelarReserva = async (id) => {
  if (!confirm('¿Cancelar esta reserva?')) return;
  try {
    await updateDoc(doc(db, 'reservas', id), { estado: 'cancelada' });
    showAlert('Reserva cancelada', 'warning');
    loadReservas();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};

// ========== STATS ==========
async function loadStats() {
  try {
    const qExc = query(collection(db, 'excursiones'), where('adminId', '==', userId));
    const qRes = query(collection(db, 'reservas'), where('adminId', '==', userId));
    
    const excSnap = await getDocs(qExc);
    const resSnap = await getDocs(qRes);

    let totalPersonas = 0;
    resSnap.forEach(d => {
      const data = d.data();
      if (data.estado === 'confirmada') totalPersonas += data.personas || 0;
    });

    document.getElementById('stat-excursiones').textContent = excSnap.size;
    document.getElementById('stat-reservas').textContent = resSnap.size;
    document.getElementById('stat-personas').textContent = totalPersonas;
  } catch (err) {
    console.error('Error stats:', err);
  }
}

// ========== INICIALIZACIÓN ==========
verificarAprobacion();