// Utilidades - Precios Chuy

export function showAlert(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:9999;
    padding:15px 25px;border-radius:8px;
    font-weight:600;
    box-shadow:0 4px 15px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 300);
  }, 4000);
}

export function formatDate(timestamp) {
  if (!timestamp) return '—';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Inválida';
    return date.toLocaleString('es-UY', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  } catch {
    return '—';
  }
}

// Verificar rol del usuario
export function checkRole(requiredRole) {
  const role = sessionStorage.getItem('userRole');
  if (role !== requiredRole && role !== 'admin') {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Formato de moneda
export function formatMoney(amount, currency = 'UYU') {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Compartir en WhatsApp
export function shareWhatsApp(text, url) {
  const message = encodeURIComponent(text);
  const link = encodeURIComponent(url);
  window.open(`https://wa.me/?text=${message}%20${link}`, '_blank');
}

// Compartir en Facebook
export function shareFacebook(url, text) {
  const link = encodeURIComponent(url);
  const msg = encodeURIComponent(text);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${msg}`, '_blank');
}

// Copiar al portapapeles
export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showAlert('Copiado al portapapeles', 'success');
  }).catch(() => {
    showAlert('Error al copiar', 'danger');
  });
}

// Compartir en Telegram
export function shareTelegram(url, text) {
  const link = encodeURIComponent(url);
  const msg = encodeURIComponent(text);
  window.open(`https://t.me/share/url?url=${link}&text=${msg}`, '_blank');
}

// Compartir en X (Twitter)
export function shareTwitter(url, text) {
  const link = encodeURIComponent(url);
  const msg = encodeURIComponent(text);
  window.open(`https://twitter.com/intent/tweet?text=${msg}&url=${link}`, '_blank');
}

// Modal "Compartir app": muestra siempre nuestras opciones (incluye Instagram/TikTok
// como copiar-link, ya que ninguna de las dos permite compartir un link directo desde la web),
// y deja el selector nativo del dispositivo como una opción más, para el resto de apps.
export function compartirApp() {
  const url = window.location.origin + '/';
  const texto = '🛒 Mirá Precios Chuy: compará precios de Uruguay y Brasil, y encontrá las mejores ofertas de comercios de Chuy.';

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  const contenido = document.createElement('div');
  contenido.style.cssText = 'background:white;padding:25px;border-radius:16px;max-width:420px;width:90%;max-height:90vh;overflow-y:auto;text-align:center;';
  contenido.innerHTML = `
    <h2 style="color:#0038A8;margin-bottom:15px;">📲 Compartir Precios Chuy</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
      <button id="share-wa" class="btn" style="background:#25D366;color:white;">💬 WhatsApp</button>
      <button id="share-ig" class="btn" style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:white;">📸 Instagram</button>
      <button id="share-tt" class="btn" style="background:#000;color:white;">🎵 TikTok</button>
      <button id="share-fb" class="btn" style="background:#1877F2;color:white;">📘 Facebook</button>
      <button id="share-tg" class="btn" style="background:#26A5E4;color:white;">✈️ Telegram</button>
      <button id="share-tw" class="btn" style="background:#333;color:white;">✖️ X</button>
    </div>
    <button id="share-copy" class="btn btn-block" style="background:#0038A8;color:white;margin-bottom:8px;">🔗 Copiar link</button>
    ${navigator.share ? '<button id="share-nativo" class="btn btn-block" style="background:#666;color:white;margin-bottom:15px;">📤 Más apps (compartir del dispositivo)</button>' : ''}
    <div style="background:#f8f9fa;padding:10px;border-radius:8px;font-size:0.85rem;color:#555;word-break:break-all;margin-bottom:15px;">${url}</div>
    <button id="share-cerrar" class="btn" style="background:#ddd;width:100%;">Cerrar</button>
  `;
  modal.appendChild(contenido);
  document.body.appendChild(modal);

  document.getElementById('share-wa').addEventListener('click', () => shareWhatsApp(texto, url));
  document.getElementById('share-fb').addEventListener('click', () => shareFacebook(url, texto));
  document.getElementById('share-tg').addEventListener('click', () => shareTelegram(url, texto));
  document.getElementById('share-tw').addEventListener('click', () => shareTwitter(url, texto));
  document.getElementById('share-copy').addEventListener('click', () => copyToClipboard(url));
  document.getElementById('share-ig').addEventListener('click', () => {
    copyToClipboard(url);
    showAlert('Link copiado. Abrí Instagram y pegalo en tu historia, bio o mensaje 📸', 'success');
    window.open('https://www.instagram.com/', '_blank');
  });
  document.getElementById('share-tt').addEventListener('click', () => {
    copyToClipboard(url);
    showAlert('Link copiado. Abrí TikTok y pegalo en tu bio o video 🎵', 'success');
    window.open('https://www.tiktok.com/', '_blank');
  });
  const btnNativo = document.getElementById('share-nativo');
  if (btnNativo) {
    btnNativo.addEventListener('click', () => {
      navigator.share({ title: 'Precios Chuy', text: texto, url }).catch(() => {});
    });
  }
  document.getElementById('share-cerrar').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}
// Validar email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
