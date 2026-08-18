// Sistema de autenticación - Precios Chuy
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const btnLogin = document.getElementById('btn-login');
const errorDiv = document.getElementById('login-error');

btnLogin.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorDiv.textContent = '';
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';

  try {
    if (!email || !password) {
      errorDiv.textContent = 'Completá todos los campos';
      throw new Error('Faltan datos');
    }

    // Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Obtener datos del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      errorDiv.textContent = 'Usuario no registrado en el sistema';
      await auth.signOut();
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();

    // Verificar si está activo
    if (userData.activo === false) {
      errorDiv.textContent = 'Tu cuenta está desactivada';
      await auth.signOut();
      throw new Error('Cuenta inactiva');
    }

    // Guardar sesión
    sessionStorage.setItem('userId', user.uid);
    sessionStorage.setItem('userEmail', userData.email);
    sessionStorage.setItem('userName', userData.nombre);
    sessionStorage.setItem('userRole', userData.role);
    if (userData.ruta) sessionStorage.setItem('userRuta', userData.ruta);

    // Redirección según rol
    let destino = '/pages/cliente.html';
    if (userData.role === 'admin') destino = '/pages/admin.html';
    else if (userData.role === 'comerciante') destino = '/pages/comerciante.html';

    window.location.href = destino;

  } catch (error) {
    console.error('Error login:', error);
    if (error.code === 'auth/invalid-credential') {
      errorDiv.textContent = 'Email o contraseña incorrectos';
    } else if (error.code === 'auth/user-not-found') {
      errorDiv.textContent = 'No existe una cuenta con ese email';
    } else if (error.code === 'auth/wrong-password') {
      errorDiv.textContent = 'Contraseña incorrecta';
    } else if (error.code === 'auth/too-many-requests') {
      errorDiv.textContent = 'Demasiados intentos. Intentá más tarde';
    }
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar Sesión';
  }
});

// Verificar sesión activa
auth.onAuthStateChanged((user) => {
  if (user) {
    const role = sessionStorage.getItem('userRole');
    if (role === 'admin') window.location.href = '/pages/admin.html';
    else if (role === 'comerciante') window.location.href = '/pages/comerciante.html';
    else if (role === 'cliente') window.location.href = '/pages/cliente.html';
  }
});