// Manejo central de sesiones - Precios Chuy
import { auth } from './firebase-config.js';

// Limpiar sesión y cerrar
export function logout() {
  sessionStorage.clear();
  auth.signOut().then(() => {
    window.location.href = '/index.html';
  }).catch(() => {
    window.location.href = '/index.html';
  });
}

// Guardar datos de sesión después de login exitoso
export function guardarSesion(userId, userData) {
  sessionStorage.clear();
  sessionStorage.setItem('userId', userId);
  sessionStorage.setItem('userEmail', userData.email || '');
  sessionStorage.setItem('userName', userData.nombre || '');
  sessionStorage.setItem('userRole', userData.role || 'cliente');
  if (userData.ruta) sessionStorage.setItem('userRuta', userData.ruta);
  sessionStorage.setItem('userPlan', userData.plan === 'premium' ? 'premium' : 'gratis');
}

// Obtener datos actuales de sesión
export function getSession() {
  return {
    userId: sessionStorage.getItem('userId'),
    userEmail: sessionStorage.getItem('userEmail'),
    userName: sessionStorage.getItem('userName'),
    userRole: sessionStorage.getItem('userRole'),
    userPlan: sessionStorage.getItem('userPlan'),
    userRuta: sessionStorage.getItem('userRuta')
  };
}

// Verificar acceso: si no tiene el rol correcto, redirige al login
export function requireRole(allowedRoles) {
  const session = getSession();
  if (!session.userId) {
    window.location.href = '/index.html';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.userRole)) {
    window.location.href = '/index.html';
    return null;
  }
  return session;
}

// Botón de logout automático (buscar botón con id="btn-logout")
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
});