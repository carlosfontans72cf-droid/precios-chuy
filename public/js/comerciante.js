// ========== CARGAR SECCIONES ==========
async function loadSeccionesComerciante() {
  const selectSeccion = document.getElementById('prod-seccion');
  if (!selectSeccion) return;
  
  try {
    const snap = await getDocs(collection(db, 'secciones'));
    selectSeccion.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    snap.forEach(d => {
      const data = d.data();
      const option = document.createElement('option');
      option.value = d.id;
      option.textContent = `${data.icono || ''} ${data.nombre}`;
      selectSeccion.appendChild(option);
    });
    
    console.log(`✅ ${snap.size} secciones cargadas`);
  } catch (err) {
    console.error('Error cargando secciones:', err);
  }
}

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
      nombre,
      precioBrasil: precio,
      precioUruguay: parseFloat(document.getElementById('prod-precio-uy').value) || 0,
      comercioId: userId,
      comercioNombre: sessionStorage.getItem('userName'),
      seccionId,
      imagen: document.getElementById('prod-imagen').value.trim() || null,
      esOferta: document.getElementById('prod-es-oferta').value === 'true',
      activo: true,
      suspendido: false,
      createdAt: serverTimestamp()
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
    
    if (snap.empty) {
      cont.innerHTML = '<p style="color:#666;">Sin productos cargados</p>';
    } else {
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
            <button class="btn btn-sm ${data.suspendido ? 'btn-success' : 'btn-warning'}" onclick="toggleSuspenderProducto('${d.id}', ${data.suspendido})">
              ${data.suspendido ? '▶️ Activar' : '⏸️ Suspender'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteProducto('${d.id}')">Eliminar</button>
          </div>
        `;
        cont.appendChild(div);
      });
    }
    
    const statEl = document.getElementById('stat-productos-com');
    if (statEl) statEl.textContent = snap.size;
  } catch (err) { 
    console.error('Error productos:', err);
    cont.innerHTML = '<p style="color:red;">Error al cargar productos</p>';
  }
}

window.deleteProducto = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;
  try { 
    await deleteDoc(doc(db, 'productos', id)); 
    showAlert('Producto eliminado', 'success');
    loadProductos(); 
  } catch (err) { 
    showAlert(`Error: ${err.message}`, 'danger'); 
  }
};

window.modificarProducto = (id, nombre, precio, imagen, esOferta) => {
  const nuevoNombre = prompt('Nombre del producto:', nombre);
  if (nuevoNombre === null) return;
  
  const nuevoPrecio = parseFloat(prompt('Precio Brasil (R$):', precio));
  if (isNaN(nuevoPrecio)) return;
  
  const nuevaImagen = prompt('URL de imagen (opcional):', imagen) || '';
  const nuevaOferta = confirm('¿Es oferta especial?');
  
  updateDoc(doc(db, 'productos', id), {
    nombre: nuevoNombre,
    precioBrasil: nuevoPrecio,
    imagen: nuevaImagen,
    esOferta: nuevaOferta
  }).then(() => {
    showAlert('Producto actualizado', 'success');
    loadProductos();
  }).catch(err => {
    showAlert(`Error: ${err.message}`, 'danger');
  });
};

window.toggleSuspenderProducto = async (id, suspendido) => {
  const nuevoEstado = !suspendido;
  const mensaje = nuevoEstado ? '¿Activar este producto?' : '¿Suspender este producto?';
  
  if (!confirm(mensaje)) return;
  
  try {
    await updateDoc(doc(db, 'productos', id), { suspendido: nuevoEstado });
    showAlert(nuevoEstado ? 'Producto activado' : 'Producto suspendido', 'success');
    loadProductos();
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
  }
};