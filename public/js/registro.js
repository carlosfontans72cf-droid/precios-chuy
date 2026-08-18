// Registro de usuarios - Precios Chuy
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const btnRegistro = document.getElementById('btn-registro');
const errorDiv = document.getElementById('registro-error');

btnRegistro.addEventListener('click', async () => {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = sessionStorage.getItem('selectedRole');

  if (!role) {
    errorDiv.textContent = 'Seleccioná un tipo de cuenta';
    return;
  }

  if (!nombre || !email || !password) {
    errorDiv.textContent = 'Completá todos los campos';
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
    return;
  }

  btnRegistro.disabled = true;
  btnRegistro.textContent = 'Creando cuenta...';

  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Preparar datos según rol
    const userData = {
      nombre,
      email,
      role,
      activo: true,
      createdAt: serverTimestamp()
    };

    if (role === 'comerciante') {
      const comercio = document.getElementById('reg-comercio').value.trim();
      const tipo = document.getElementById('reg-tipo').value;

      if (!comercio) {
        errorDiv.textContent = 'Ingresá el nombre del comercio';
        throw new Error('Falta nombre del comercio');
      }

      const fechaInicio = new Date();
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 60);

      userData.comercio = comercio;
      userData.tipoComercio = tipo;
      userData.plan = 'prueba';
      userData.fechaInicio = fechaInicio.toISOString();
      userData.fechaVencimiento = fechaVencimiento.toISOString();
      userData.diasRestantes = 60;
    } else if (role === 'admin_excursion') {
      const ruta = document.getElementById('reg-ruta').value.trim();
      const telefono = document.getElementById('reg-telefono').value.trim();

      if (!ruta) {
        errorDiv.textContent = 'Ingresá la ruta que vas a gestionar';
        throw new Error('Falta la ruta');
      }

      userData.ruta = ruta;
      userData.telefono = telefono;
      userData.aprobado = false; // Requiere aprobación del admin general
    } else {
      // Cliente
      userData.plan = 'gratis';
      userData.fechaVencimientoPremium = null;
    }

    // Guardar en Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    // Redirección según rol
    if (role === 'comerciante') {
      window.location.href = '/pages/comerciante.html';
    } else if (role === 'admin_excursion') {
      window.location.href = '/pages/admin-excursion.html';
    } else {
      window.location.href = '/pages/cliente.html';
    }

  } catch (error) {
    console.error('Error registro:', error);
    if (error.code === 'auth/email-already-in-use') {
      errorDiv.textContent = 'Ya existe una cuenta con ese email';
    } else if (error.code === 'auth/invalid-email') {
      errorDiv.textContent = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      errorDiv.textContent = 'Contraseña muy débil (mínimo 6 caracteres)';
    } else {
      errorDiv.textContent = `Error: ${error.message}`;
    }
  } finally {
    btnRegistro.disabled = false;
    btnRegistro.textContent = 'Crear cuenta';
  }
});