// Sistema de autenticación - Precios Chuy
import { auth, db } from './firebase-config.js';
import { guardarSesion } from './session.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, collection, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// ========== LOGIN ==========
btnLogin.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  errorDiv.textContent = '';
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';

  sessionStorage.clear();

  try {
    if (!email || !password) {
      errorDiv.textContent = 'Completá todos los campos';
      throw new Error('Faltan datos');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let userDoc = await getDoc(doc(db, 'users', user.uid));
    let userData = userDoc.exists() ? userDoc.data() : null;
    let userId = user.uid;

    if (!userData) {
      const encontrado = await buscarUsuarioPorEmail(email);
      if (encontrado) {
        userData = encontrado.data;
        userId = encontrado.id;
      }
    }

    if (!userData) {
      errorDiv.textContent = 'Error: Usuario en sistema pero sin perfil. Contactá al admin.';
      await auth.signOut();
      throw new Error('Sin perfil en Firestore');
    }

    if (userData.activo === false) {
      errorDiv.textContent = 'Tu cuenta está desactivada';
      await auth.signOut();
      throw new Error('Cuenta inactiva');
    }

    if (userData.role === 'admin_excursion' && !userData.aprobado) {
      errorDiv.textContent = 'Tu cuenta está pendiente de aprobación por el administrador';
      await auth.signOut();
      throw new Error('Cuenta pendiente');
    }

    guardarSesion(userId, userData);
    console.log('✅ Login exitoso:', { userId, email, role: userData.role, plan: userData.plan });

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

// ========== REGISTRO ==========
const btnRegister = document.getElementById('btn-register');
const registerErrorDiv = document.getElementById('register-error');

if (btnRegister) {
  btnRegister.addEventListener('click', async () => {
    const nombre = document.getElementById('reg-nombre').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    registerErrorDiv.textContent = '';
    btnRegister.disabled = true;
    btnRegister.textContent = 'Creando cuenta...';

    try {
      if (!nombre || !email || !password) {
        registerErrorDiv.textContent = 'Completá todos los campos';
        throw new Error('Faltan datos');
      }

      if (password.length < 6) {
        registerErrorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        throw new Error('Contraseña muy corta');
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Datos base
      const userData = {
        nombre,
        email,
        role,
        activo: true,
        createdAt: serverTimestamp()
      };

      // Datos según rol
      if (role === 'comerciante') {
        const comercio = document.getElementById('reg-comercio').value.trim();
        const tipo = document.getElementById('reg-tipo').value;

        if (!comercio) {
          registerErrorDiv.textContent = 'Ingresá el nombre del comercio';
          throw new Error('Falta nombre del comercio');
        }

        userData.comercio = comercio;
        userData.tipo = tipo;
        userData.nombreComercio = comercio;
        userData.tipoComercio = tipo;
        userData.plan = 'prueba';
        userData.diasRestantes = 60;
        userData.fechaSuscripcion = new Date().toISOString();

        await setDoc(doc(db, 'users', user.uid), userData);
        guardarSesion(user.uid, userData);
        window.location.href = '/pages/comerciante.html';

      } else if (role === 'admin_excursion') {
        const ruta = document.getElementById('reg-ruta').value.trim();
        const telefono = document.getElementById('reg-telefono').value.trim();

        if (!ruta) {
          registerErrorDiv.textContent = 'Ingresá la ruta que vas a gestionar';
          throw new Error('Falta la ruta');
        }

        userData.ruta = ruta;
        userData.telefono = telefono;
        userData.aprobado = false;

        await setDoc(doc(db, 'users', user.uid), userData);

        registerErrorDiv.style.color = '#009C3B';
        registerErrorDiv.textContent = '✅ Cuenta creada. El admin la aprobará pronto. Podés iniciar sesión cuando sea aprobada.';
        await auth.signOut();

        setTimeout(() => {
          document.getElementById('register-form').style.display = 'none';
          document.getElementById('login-form').style.display = 'block';
          registerErrorDiv.textContent = '';
        }, 3000);

      } else {
        // Cliente
        userData.plan = 'gratis';

        await setDoc(doc(db, 'users', user.uid), userData);
        guardarSesion(user.uid, userData);
        window.location.href = '/pages/cliente.html';
      }

    } catch (error) {
      console.error('Error registro:', error);
      if (error.code === 'auth/email-already-in-use') {
        registerErrorDiv.textContent = 'Ya existe una cuenta con ese email';
      } else if (error.code === 'auth/invalid-email') {
        registerErrorDiv.textContent = 'Email inválido';
      } else if (error.code === 'auth/weak-password') {
        registerErrorDiv.textContent = 'Contraseña muy débil (mínimo 6 caracteres)';
      }
      // Si ya tiene mensaje, mantenerlo
    } finally {
      btnRegister.disabled = false;
      btnRegister.textContent = 'Crear cuenta';
    }
  });
}

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