// Interfaz de pagos - Precios Chuy

// Mostrar modal de pago para comerciantes
export function mostrarPagoComerciante(diasRestantes, userId) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.5); z-index:9999;
    display:flex; align-items:center; justify-content:center;
  `;

  const contenido = document.createElement('div');
  contenido.style.cssText = `
    background:white; padding:30px; border-radius:16px;
    max-width:500px; width:90%; max-height:90vh; overflow-y:auto;
  `;

  contenido.innerHTML = `
    <h2 style="color:#0038A8; margin-bottom:20px;">💳 Opciones de pago</h2>
    
    ${diasRestantes <= 0 ? `
      <div class="alert alert-warning" style="margin-bottom:20px;">
        ⚠️ Tu período de prueba finalizó.<br>
        Tu perfil sigue visible pero no podés subir nuevas ofertas.
      </div>
    ` : `
      <div class="alert alert-success" style="margin-bottom:20px;">
        ✅ Te quedan <strong>${diasRestantes} días</strong> de prueba gratis
      </div>
    `}

    <h3 style="margin-bottom:15px;">Métodos de pago:</h3>

    <div style="border:2px solid #ddd; border-radius:12px; padding:15px; margin-bottom:15px;">
      <h4>🇧🇷 PIX (Próximamente)</h4>
      <p style="color:#666; font-size:0.9rem;">Disponible en 30-60 días</p>
      <p style="font-size:0.9rem;"><strong>CPF:</strong> 129.485.421-62</p>
    </div>

    <div style="border:2px solid #0038A8; border-radius:12px; padding:15px; margin-bottom:15px;">
      <h4>🇾🇺 Transferencia bancaria</h4>
      <p style="margin:10px 0;"><strong>Banco Santander</strong></p>
      <p style="margin:5px 0;"><strong>Pesos uruguayos:</strong></p>
      <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">001206586016</p>
      <p style="margin:10px 0;"><strong>Dólares:</strong></p>
      <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">005206747953</p>
      <p style="margin-top:10px;"><strong>Titular:</strong> Carlos Fontans</p>
    </div>

    <div style="border:2px solid #009C3B; border-radius:12px; padding:15px; margin-bottom:15px;">
      <h4>💵 Efectivo</h4>
      <p style="color:#666; font-size:0.9rem;">Coordinar pago en persona</p>
    </div>

    <div style="border:2px solid #FFDF00; border-radius:12px; padding:15px; margin-bottom:20px;">
      <h4>💳 PREX</h4>
      <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">19793785</p>
      <p style="margin-top:10px;"><strong>Titular:</strong> Carlos Fontans</p>
    </div>

    <p style="margin-bottom:15px; color:#666;">
      Después de pagar, envianos el comprobante por WhatsApp:
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <a href="https://wa.me/59895205598?text=Hola,%20quiero%20enviar%20comprobante%20de%20pago%20Precios%20Chuy" 
         target="_blank" 
         class="btn btn-success"
         style="flex:1; min-width:200px;">
         WhatsApp Uruguay
      </a>
      <a href="https://wa.me/5553991757952?text=Olá,%20quero%20enviar%20comprovante%20de%20pagamento%20Precios%20Chuy" 
         target="_blank" 
         class="btn btn-success"
         style="flex:1; min-width:200px;">
        📱 WhatsApp Brasil
      </a>
    </div>

    <button onclick="this.closest('div[style*=fixed]').remove()" 
            class="btn btn-block" 
            style="margin-top:20px; background:#ddd;">
      Cerrar
    </button>
  `;

  modal.appendChild(contenido);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Mostrar mensaje de premium para clientes
export function mostrarPremiumCliente(userId) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.5); z-index:9999;
    display:flex; align-items:center; justify-content:center;
  `;

  const contenido = document.createElement('div');
  contenido.style.cssText = `
    background:white; padding:30px; border-radius:16px;
    max-width:500px; width:90%; max-height:90vh; overflow-y:auto;
  `;

  contenido.innerHTML = `
    <h2 style="color:#0038A8; margin-bottom:20px;">⭐ Plan Premium</h2>
    
    <div class="alert alert-success" style="margin-bottom:20px;">
      <strong>¡Usá Precios Chuy GRATIS para siempre!</strong><br>
      El plan premium es opcional y te da beneficios extra.
    </div>

    <h3 style="margin-bottom:15px;">Beneficios Premium ($2/mes):</h3>
    <ul style="margin-bottom:20px; padding-left:20px;">
      <li style="margin:10px 0;">✅ Ofertas exclusivas de la semana</li>
      <li style="margin:10px 0;">✅ Alertas cuando bajan precios</li>
      <li style="margin:10px 0;">✅ Lista de compras optimizada</li>
      <li style="margin:10px 0;">✅ Navegación GPS a comercios</li>
      <li style="margin:10px 0;">✅ Sin anuncios</li>
    </ul>

    <p style="color:#666; margin-bottom:20px;">
      <strong>Sin contratos. Sin deudas.</strong><br>
      Pagás y usás 30 días. Si no renovás, volvés al plan gratis.
    </p>

    <h3 style="margin-bottom:15px;">Opciones de pago:</h3>

    <div style="border:2px solid #009C3B; border-radius:12px; padding:15px; margin-bottom:15px;">
      <h4>💳 PREX</h4>
      <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">19793785</p>
      <p style="margin-top:10px;"><strong>Titular:</strong> Carlos Fontans</p>
    </div>

    <div style="border:2px solid #0038A8; border-radius:12px; padding:15px; margin-bottom:15px;">
      <h4>🏦 Transferencia bancaria</h4>
      <p style="margin:10px 0;"><strong>Santander Pesos:</strong></p>
      <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">001206586016</p>
      <p style="margin-top:10px;"><strong>Titular:</strong> Carlos Fontans</p>
    </div>

    <p style="margin-bottom:15px; color:#666;">
      Después de pagar, envianos el comprobante:
    </p>

    <a href="https://wa.me/59895205598?text=Hola,%20quiero%20hacerme%20Premium%20en%20Precios%20Chuy" 
       target="_blank" 
       class="btn btn-success btn-block"
       style="margin-bottom:10px;">
      📱 Enviar comprobante por WhatsApp
    </a>

    <button onclick="this.closest('div[style*=fixed]').remove()" 
            class="btn btn-block" 
            style="background:#ddd;">
      Seguir con plan gratis
    </button>
  `;

  modal.appendChild(contenido);
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Mostrar contador de días para comerciante
export function mostrarContadorComerciante(diasRestantes, userId) {
  const contenedor = document.getElementById('contador-suscripcion');
  if (!contenedor) return;

  if (diasRestantes <= 0) {
    contenedor.innerHTML = `
      <div class="alert alert-warning">
        <h3>⚠️ Tu prueba finalizó</h3>
        <p>Tu perfil sigue visible en la app.</p>
        <p>Para reactivar todas las funciones:</p>
        <button class="btn btn-primary" onclick="mostrarPagoComerciante(0, '${userId}')">
          💳 Pagar ahora - $5/mes
        </button>
      </div>
    `;
  } else {
    const porcentaje = (diasRestantes / 60) * 100;
    contenedor.innerHTML = `
      <div class="alert alert-success">
        <h3>🎉 Período de prueba activo</h3>
        <p>Te quedan <strong>${diasRestantes} días</strong> gratis</p>
        <div style="background:#ddd; border-radius:10px; overflow:hidden; margin:10px 0;">
          <div style="width:${porcentaje}%; background:#009C3B; height:20px; transition:width 0.3s;"></div>
        </div>
        <button class="btn btn-primary" onclick="mostrarPagoComerciante(${diasRestantes}, '${userId}')">
          💳 Ver opciones de pago
        </button>
      </div>
    `;
  }
}