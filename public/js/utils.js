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

// Validar email
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}