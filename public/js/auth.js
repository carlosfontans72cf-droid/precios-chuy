// Sistema de autenticación - Precios Chuy
import { auth, db } from './firebase-config.js';
import { guardarSesion } from './session.js';
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const btnLogin = document.getElementById('btn-login');
const errorDiv = document.getElementById('login-error');

// Buscar usuario en Firestore por email
async function buscarUsuarioPorEmail(email) {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, data: snap.docs[0].data() };
  } catch (err) {
    console.error('Error buscando por email:', err);
    return null;
  }
}

btnLogin.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorDiv.textContent = '';
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';

  // IMPORTANTE: limpiar sessionStorage ANTES de cualquier cosa
  sessionStorage.clear();

  try {
    if (!email || !password) {
      errorDiv.textContent = 'Completá todos los campos';
      throw new Error('Faltan datos');
    }

    // Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // PASO 1: Intentar obtener por UID
    let userDoc = await getDoc(doc(db, 'users', user.uid));
    let userData = userDoc.exists() ? userDoc.data() : null;
    let userId = user.uid;

    // PASO 2: Si no existe por UID, buscar por email
    if (!userData) {
      console.log('No encontrado por UID, buscando por email...');
      const encontrado = await buscarUsuarioPorEmail(email);
      if (encontrado) {
        userData = encontrado.data;
        userId = encontrado.id;
        console.log('✅ Encontrado por email, ID:', userId);
      }
    }

    // PASO 3: Si no existe en Firestore
    if (!userData) {
      console.error('Usuario en Auth pero no en Firestore:', email);
      errorDiv.textContent = 'Error: Usuario en sistema pero sin perfil. Contactá al admin.';
      await auth.signOut();
      throw new Error('Sin perfil en Firestore');
    }

    // Verificar si está activo
    if (userData.activo === false) {
      errorDiv.textContent = 'Tu cuenta está desactivada';
      await auth.signOut();
      throw new Error('Cuenta inactiva');
    }

    // Verificar si está aprobado (para admin_excursion)
    if (userData.role === 'admin_excursion' && !userData.aprobado) {
      errorDiv.textContent = 'Tu cuenta está pendiente de aprobación por el administrador';
      await auth.signOut();
      throw new Error('Cuenta pendiente');
    }

    // TODOS los checks pasaron → guardar sesión
    guardarSesion(userId, userData);

    console.log('✅ Login exitoso:', { userId, email, role: userData.role, plan: userData.plan });

    // Redirección según rol
    let destino = '/pages/cliente.html';
    if (userData.role === 'admin') destino = '/pages/admin.html';
    else if (userData.role === 'comerciante') destino = '/pages/comerciante.html';
    else if (userData.role === 'admin_excursion') destino = '/pages/admin-excursion.html';

    window.location.href = destino;

  } catch (error) {
    console.error('Error login:', error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      errorDiv.textContent = 'Email o contraseña incorrectos';
    } else if (error.code === 'auth/user-not-found') {
      errorDiv.textContent = 'No existe una cuenta con ese email. ¿Querés registrarte?';
    } else if (error.code === 'auth/too-many-requests') {
      errorDiv.textContent = 'Demasiados intentos. Intentá más tarde';
    }
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar Sesión';
  }
});

// Solo redirige si estás en la página de login y ya hay sesión activa
auth.onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes('login')) {
    const role = sessionStorage.getItem('userRole');
    if (role === 'admin') window.location.href = '/pages/admin.html';
    else if (role === 'comerciante') window.location.href = '/pages/comerciante.html';
    else if (role === 'admin_excursion') window.location.href = '/pages/admin-excursion.html';
    else if (role === 'cliente') window.location.href = '/pages/cliente.html';
  }
});