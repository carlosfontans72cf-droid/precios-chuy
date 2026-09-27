// Interfaz de pagos - Precios Chuy

// Abre/cierra un bloque de método de pago (efecto acordeón)
function toggleMetodoPago(idBloque) {
  document.querySelectorAll('.metodo-pago-detalle').forEach(el => {
    if (el.id !== idBloque) el.style.display = 'none';
  });
  const el = document.getElementById(idBloque);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
window.toggleMetodoPago = toggleMetodoPago;

// Bloques de métodos de pago reutilizados en ambos modales (comerciante y cliente)
function bloquesMetodosPago() {
  return `
    <div style="border:2px solid #0038A8; border-radius:12px; margin-bottom:12px; overflow:hidden;">
      <button onclick="toggleMetodoPago('mp-pesos')" class="btn" style="width:100%; text-align:left; background:#f0f4ff; border:none; padding:14px;">
        🏦 Cuenta en pesos uruguayos
      </button>
      <div id="mp-pesos" class="metodo-pago-detalle" style="display:none; padding:15px;">
        <p style="margin:5px 0;"><strong>Banco Santander</strong></p>
        <p style="margin:5px 0;"><strong>Titular:</strong> Carlos Fontans</p>
        <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">001206586016</p>
      </div>
    </div>

    <div style="border:2px solid #009C3B; border-radius:12px; margin-bottom:12px; overflow:hidden;">
      <button onclick="toggleMetodoPago('mp-dolares')" class="btn" style="width:100%; text-align:left; background:#f0fff4; border:none; padding:14px;">
        💵 Cuenta en dólares
      </button>
      <div id="mp-dolares" class="metodo-pago-detalle" style="display:none; padding:15px;">
        <p style="margin:5px 0;"><strong>Banco Santander</strong></p>
        <p style="margin:5px 0;"><strong>Titular:</strong> Carlos Fontans</p>
        <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">005206747953</p>
      </div>
    </div>

    <div style="border:2px solid #32BCAD; border-radius:12px; margin-bottom:12px; overflow:hidden;">
      <button onclick="toggleMetodoPago('mp-pix')" class="btn" style="width:100%; text-align:left; background:#f0fffd; border:none; padding:14px;">
        🇧🇷 PIX
      </button>
      <div id="mp-pix" class="metodo-pago-detalle" style="display:none; padding:15px;">
        <p style="margin:5px 0;"><strong>Chave PIX (CPF):</strong></p>
        <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">129.485.421-62</p>
        <p style="margin-top:10px;"><strong>Titular:</strong> Carlos Fontans</p>
      </div>
    </div>

    <div style="border:2px solid #FFDF00; border-radius:12px; margin-bottom:12px; overflow:hidden;">
      <button onclick="toggleMetodoPago('mp-prex')" class="btn" style="width:100%; text-align:left; background:#fffdf0; border:none; padding:14px;">
        💳 PREX
      </button>
      <div id="mp-prex" class="metodo-pago-detalle" style="display:none; padding:15px;">
        <p style="font-family:monospace; background:#f0f0f0; padding:8px; border-radius:6px;">19793785</p>
        <p style="margin-top:10px;"><strong>Titular:</strong> Carlos Fontans</p>
      </div>
    </div>

    <div style="border:2px solid #25D366; border-radius:12px; margin-bottom:12px; overflow:hidden;">
      <button onclick="toggleMetodoPago('mp-efectivo')" class="btn" style="width:100%; text-align:left; background:#f0fff8; border:none; padding:14px;">
        💵 Efectivo
      </button>
      <div id="mp-efectivo" class="metodo-pago-detalle" style="display:none; padding:15px;">
        <p style="color:#666; margin-bottom:10px;">Coordinemos el pago en persona por WhatsApp:</p>
        <a href="https://wa.me/59895205598?text=Hola!%20Quiero%20coordinar%20un%20pago%20en%20efectivo%20de%20Precios%20Chuy" target="_blank" class="btn btn-success" style="width:100%; margin-bottom:8px;">🇺🇾 WhatsApp Uruguay</a>
        <a href="https://wa.me/5553999265575?text=Ol%C3%A1!%20Quero%20combinar%20um%20pagamento%20em%20dinheiro%20do%20Precios%20Chuy" target="_blank" class="btn btn-success" style="width:100%;">🇧🇷 WhatsApp Brasil</a>
      </div>
    </div>
  `;
}

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

    <h3 style="margin-bottom:15px;">Elegí cómo pagar (tocá para ver los datos):</h3>

    ${bloquesMetodosPago()}

    <p style="margin:15px 0; color:#666;">
      Después de pagar por transferencia o PREX, envianos el comprobante:
    </p>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <a href="https://wa.me/59895205598?text=Hola,%20quiero%20enviar%20comprobante%20de%20pago%20Precios%20Chuy" 
         target="_blank" 
         class="btn btn-success"
         style="flex:1; min-width:200px;">
         🇺🇾 WhatsApp Uruguay
      </a>
      <a href="https://wa.me/5553999265575?text=Ol%C3%A1,%20quero%20enviar%20comprovante%20de%20pagamento%20Precios%20Chuy" 
         target="_blank" 
         class="btn btn-success"
         style="flex:1; min-width:200px;">
        🇧🇷 WhatsApp Brasil
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

    <h3 style="margin-bottom:15px;">Elegí cómo pagar (tocá para ver los datos):</h3>

    ${bloquesMetodosPago()}

    <p style="margin:15px 0; color:#666;">
      Después de pagar por transferencia o PREX, envianos el comprobante:
    </p>

    <a href="https://wa.me/59895205598?text=Hola,%20quiero%20hacerme%20Premium%20en%20Precios%20Chuy" 
       target="_blank" 
       class="btn btn-success btn-block"
       style="margin-bottom:10px;">
      🇺🇾 Enviar comprobante por WhatsApp
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