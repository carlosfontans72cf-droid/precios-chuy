function crearPopupComercio(comercio) {
  const nombre = comercio.nombre || comercio.nombreComercio || 'Comercio';
  const tipo = comercio.tipo || comercio.tipoComercio || 'comercio';
  const direccion = comercio.direccion || '';
  const telefono = comercio.telefono || '';
  const horarios = comercio.horarios || '';
  const logo = comercio.logo || '';
  const comercioId = comercio.id;
  
  const icono = obtenerIcono(tipo);
  
  return `
    <div style="min-width:200px;cursor:pointer;" onclick="irAPerfilComercio('${comercioId}')">
      ${logo ? `<img src="${logo}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:10px;border:2px solid #FFDF00;" onerror="this.style.display='none'">` : ''}
      <h3 style="margin:0 0 10px 0; color:#0038A8;">${icono} ${nombre}</h3>
      <p style="margin:5px 0;"><strong>Tipo:</strong> ${tipo}</p>
      <p style="margin:5px 0;"><strong>📍</strong> ${direccion || 'Dirección no disponible'}</p>
      <p style="margin:5px 0;"><strong>📱</strong> ${telefono || 'No disponible'}</p>
      <p style="margin:5px 0;"><strong>⏰</strong> ${horarios || 'No disponible'}</p>
      <p style="margin:10px 0 0 0;color:#009C3B;font-weight:bold;font-size:0.9rem;">👆 Click para ver perfil completo</p>
    </div>
  `;
}

window.irAPerfilComercio = (comercioId) => {
  // Guardar ID del comercio a mostrar
  sessionStorage.setItem('perfilComercioId', comercioId);
  window.location.href = '/pages/perfil-comercio.html';
};

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
      if (data.role === 'comerciante' && data.activo !== false) {
        comerciosUsers.push({
          id: d.id,
          nombre: data.nombreComercio || data.comercio,
          nombreComercio: data.nombreComercio,
          tipo: data.tipo || data.tipoComercio || 'comercio',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          horarios: data.horarios || '',
          logo: data.logo || '',
          fuente: 'users'
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
      div.style.cursor = 'pointer';
      div.onclick = () => irAPerfilComercio(d.id);
      
      div.innerHTML = `
        ${data.logo ? `<img src="${data.logo}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:15px;float:left;border:2px solid #FFDF00;" onerror="this.style.display='none'">` : ''}
        <h3 style="margin:0;">🏪 ${data.nombre}</h3>
        <p style="color:#666;margin:5px 0;">${data.tipo}</p>
        ${data.direccion ? `<p style="margin:5px 0;"><small>📍 ${data.direccion}</small></p>` : ''}
        ${data.telefono ? `<p style="margin:5px 0;"><small>📱 ${data.telefono}</small></p>` : ''}
        <div style="clear:both;"></div>
      `;
      cont.appendChild(div);
      totalComercios++;
    });
    
    // Mostrar comercios de la colección 'users'
    comerciosUsers.forEach(c => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.cursor = 'pointer';
      div.onclick = () => irAPerfilComercio(c.id);
      
      div.innerHTML = `
        ${c.logo ? `<img src="${c.logo}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:15px;float:left;border:2px solid #FFDF00;" onerror="this.style.display='none'">` : ''}
        <h3 style="margin:0;">🏪 ${c.nombre}</h3>
        <p style="color:#666;margin:5px 0;">${c.tipo}</p>
        ${c.direccion ? `<p style="margin:5px 0;"><small> ${c.direccion}</small></p>` : ''}
        ${c.telefono ? `<p style="margin:5px 0;"><small> ${c.telefono}</small></p>` : ''}
        <div style="clear:both;"></div>
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