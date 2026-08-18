// Buscador de usuarios - Admin Precios Chuy
// Se integra en el panel admin principal

export function initBuscadorUsuarios() {
  const contenedor = document.getElementById('buscador-usuarios-container');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="card" style="background:#f0f4ff; border-left:4px solid #0038A8;">
      <div class="card-header">🔍 Buscar Usuario</div>
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
        <button id="btn-buscar" class="btn btn-primary">🔍 Buscar</button>
        <button id="btn-limpiar" class="btn btn-warning">Limpiar</button>
        <span id="resultado-contador" style="padding:10px; color:#666;"></span>
      </div>
    </div>
    <div id="buscador-resultados" style="margin-top:20px;"></div>
  `;

  document.getElementById('btn-buscar')?.addEventListener('click', buscarUsuarios);
  document.getElementById('btn-limpiar')?.addEventListener('click', () => {
    document.getElementById('buscador-input').value = '';
    document.getElementById('buscador-rol').value = '';
    document.getElementById('buscador-resultados').innerHTML = '';
    document.getElementById('resultado-contador').textContent = '';
  });
  
  // Búsqueda al presionar Enter
  document.getElementById('buscador-input')?.addEventListener('keypress', (e) => {
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
    const { db } = await import('./firebase-config.js');
    const { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const { showAlert } = await import('./utils.js');

    const snap = await getDocs(collection(db, 'users'));
    const todos = [];
    snap.forEach(d => todos.push({ id: d.id, ...d.data() }));

    // Filtrar
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
      contenedor.innerHTML = '<div class="alert alert-warning">No se encontraron usuarios con esos criterios</div>';
      return;
    }

    contenedor.innerHTML = '';
    filtrados.forEach(u => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.marginBottom = '10px';
      
      // Información del usuario
      let infoHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:10px;">
          <div style="flex:1; min-width:250px;">
            <h4>${u.role === 'admin' ? '👑' : u.role === 'comerciante' ? '🏪' : u.role === 'admin_excursion' ? '🚌' : '🛒'} ${u.nombre || 'Sin nombre'}</h4>
            <p style="margin:5px 0;"><small>📧 ${u.email || '-'}</small></p>
            <p style="margin:5px 0;"><small>🆔 ${u.id}</small></p>
      `;

      if (u.role === 'comerciante') {
        infoHTML += `
            <p style="margin:5px 0;"><small>🏪 ${u.comercio || 'Sin comercio'}</small></p>
            <p style="margin:5px 0;"><small>📋 Tipo: ${u.tipoComercio || '-'}</small></p>
            <p style="margin:5px 0;"><small>💰 Plan: <strong>${u.plan || 'prueba'}</strong> | Días: ${u.diasRestantes || 0}</small></p>
            <p style="margin:5px 0;"><small>📱 ${u.telefono || '-'}</small></p>
        `;
      } else if (u.role === 'cliente') {
        infoHTML += `
            <p style="margin:5px 0;"><small>⭐ Plan: <strong>${u.plan === 'premium' ? 'Premium' : 'Gratis'}</strong></small></p>
            ${u.plan === 'premium' ? `<p style="margin:5px 0;"><small>📅 Vence: ${u.fechaVencimientoPremium ? new Date(u.fechaVencimientoPremium).toLocaleDateString() : '-'}</small></p>` : ''}
        `;
      } else if (u.role === 'admin_excursion') {
        infoHTML += `
            <p style="margin:5px 0;"><small>🚌 Ruta: ${u.ruta || '-'}</small></p>
            <p style="margin:5px 0;"><small>📱 ${u.telefono || '-'}</small></p>
            <p style="margin:5px 0;"><small>✅ Aprobado: <strong>${u.aprobado ? 'Sí' : 'No'}</strong></small></p>
        `;
      }
      infoHTML += `</div>`;

      // Botones de acción según rol
      infoHTML += `<div style="display:flex; flex-direction:column; gap:5px;">`;

      if (u.role === 'cliente') {
        if (u.plan === 'premium') {
          infoHTML += `<button class="btn btn-sm btn-warning" onclick="window.quitarPremium('${u.id}')">Quitar Premium</button>`;
        } else {
          infoHTML += `<button class="btn btn-sm btn-success" onclick="window.activarPremiumBuscador('${u.id}', '${u.email}')">+30 días Premium</button>`;
        }
      } else if (u.role === 'comerciante') {
        infoHTML += `<button class="btn btn-sm btn-success" onclick="window.extenderComBuscador('${u.id}', '${u.email}', 30)">+30 días</button>`;
        if (u.plan !== 'activo') {
          infoHTML += `<button class="btn btn-sm btn-primary" onclick="window.habilitarComBuscador('${u.id}', '${u.email}', 30)">Habilitar</button>`;
        }
        infoHTML += `<button class="btn btn-sm btn-danger" onclick="window.suspenderComBuscador('${u.id}', '${u.email}')">Suspender</button>`;
      } else if (u.role === 'admin_excursion') {
        if (!u.aprobado) {
          infoHTML += `<button class="btn btn-sm btn-success" onclick="window.aprobarAdminBuscador('${u.id}', '${u.email}')">✅ Aprobar</button>`;
        } else {
          infoHTML += `<button class="btn btn-sm btn-warning" onclick="window.desaprobarAdminBuscador('${u.id}', '${u.email}')">Desaprobar</button>`;
        }
        infoHTML += `<button class="btn btn-sm btn-danger" onclick="window.rechazarAdminBuscador('${u.id}', '${u.email}')">🗑 Rechazar</button>`;
      } else if (u.role === 'admin' && u.email !== sessionStorage.getItem('userEmail')) {
        infoHTML += `<button class="btn btn-sm btn-danger" disabled>Soy yo</button>`;
      }

      infoHTML += `</div></div>`;

      div.innerHTML = infoHTML;
      contenedor.appendChild(div);
    });

    // Hacer funciones disponibles globalmente
    window.quitarPremium = async (id) => {
      if (!confirm('¿Quitar plan Premium?')) return;
      try {
        await updateDoc(doc(db, 'users', id), { plan: 'gratis', fechaVencimientoPremium: null, premiumActivo: false });
        showAlert('✅ Vuelto a plan gratis', 'info');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.activarPremiumBuscador = async (id, email) => {
      const dias = parseInt(prompt(`¿Cuántos días de Premium para ${email}?`, '30')) || 30;
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + dias);
      try {
        await updateDoc(doc(db, 'users', id), { plan: 'premium', fechaVencimientoPremium: fecha.toISOString(), premiumActivo: true });
        showAlert(`✅ Premium activado por ${dias} días`, 'success');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.extenderComBuscador = async (id, email, dias) => {
      const diasInput = parseInt(prompt(`¿Cuántos días para ${email}?`, dias.toString())) || dias;
      try {
        await updateDoc(doc(db, 'users', id), { plan: 'activo', diasRestantes: (u.diasRestantes || 0) + diasInput, activo: true });
        showAlert(`✅ Extendido ${diasInput} días`, 'success');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.habilitarComBuscador = async (id, email, dias) => {
      const diasInput = parseInt(prompt(`¿Cuántos días para ${email}?`, dias.toString())) || dias;
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + diasInput);
      try {
        await updateDoc(doc(db, 'users', id), { plan: 'activo', diasRestantes: diasInput, fechaVencimiento: fecha.toISOString(), activo: true });
        showAlert(`✅ Habilitado por ${diasInput} días`, 'success');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.suspenderComBuscador = async (id, email) => {
      if (!confirm(`¿Suspender a ${email}?`)) return;
      try {
        await updateDoc(doc(db, 'users', id), { activo: false, plan: 'suspendido' });
        showAlert('⚠️ Comerciante suspendido', 'warning');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.aprobarAdminBuscador = async (id, email) => {
      if (!confirm(`¿Aprobar a ${email} como admin de excursión?`)) return;
      try {
        await updateDoc(doc(db, 'users', id), { aprobado: true });
        showAlert('✅ Admin de excursión aprobado', 'success');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.desaprobarAdminBuscador = async (id, email) => {
      if (!confirm(`¿Desaprobar a ${email}?`)) return;
      try {
        await updateDoc(doc(db, 'users', id), { aprobado: false });
        showAlert('⚠️ Admin de excursión desaprobado', 'warning');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

    window.rechazarAdminBuscador = async (id, email) => {
      if (!confirm(`¿Rechazar y eliminar a ${email}? Esta acción no se puede deshacer.`)) return;
      try {
        await deleteDoc(doc(db, 'users', id));
        showAlert('🗑 Admin de excursión eliminado', 'danger');
        buscarUsuarios();
      } catch (err) { showAlert(`Error: ${err.message}`, 'danger'); }
    };

  } catch (err) {
    contenedor.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}
