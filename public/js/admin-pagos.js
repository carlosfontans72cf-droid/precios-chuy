// Sistema de pagos y vencimientos - Precios Chuy
import { db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showAlert } from './utils.js';

// Verificar vencimiento de comerciantes
export async function verificarVencimientos() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const hoy = new Date();

    snap.forEach(async (d) => {
      const data = d.data();

      if (data.role === 'comerciante' && data.plan === 'prueba') {
        const vencimiento = new Date(data.fechaVencimiento);
        const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

        // Actualizar días restantes
        if (diasRestantes !== data.diasRestantes) {
          await updateDoc(doc(db, 'users', d.id), {
            diasRestantes: Math.max(0, diasRestantes)
          });
        }

        // Si venció, cambiar plan a 'vencido'
        if (diasRestantes <= 0 && data.plan !== 'vencido') {
          await updateDoc(doc(db, 'users', d.id), {
            plan: 'vencido',
            activo: false
          });
        }
      }
    });
  } catch (err) {
    console.error('Error verificando vencimientos:', err);
  }
}

// Extender suscripción manualmente (desde admin)
export async function extenderSuscripcion(userId, dias = 30) {
  try {
    const userDoc = await getDocs(collection(db, 'users'));
    const userRef = doc(db, 'users', userId);

    // Obtener fecha actual
    const hoy = new Date();
    const nuevaFecha = new Date();
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    await updateDoc(userRef, {
      plan: 'activo',
      fechaInicio: hoy.toISOString(),
      fechaVencimiento: nuevaFecha.toISOString(),
      diasRestantes: dias,
      activo: true,
      updatedAt: serverTimestamp()
    });

    showAlert(`Suscripción extendida por ${dias} días`, 'success');
    return true;
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
    return false;
  }
}

// Habilitar usuario manualmente (sin pago)
export async function habilitarManual(userId, dias = 30) {
  try {
    const hoy = new Date();
    const nuevaFecha = new Date();
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    await updateDoc(doc(db, 'users', userId), {
      plan: 'activo',
      fechaInicio: hoy.toISOString(),
      fechaVencimiento: nuevaFecha.toISOString(),
      diasRestantes: dias,
      activo: true,
      habilitadoManual: true,
      updatedAt: serverTimestamp()
    });

    showAlert(`Usuario habilitado por ${dias} días`, 'success');
    return true;
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
    return false;
  }
}

// Suspender usuario
export async function suspenderUsuario(userId) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      activo: false,
      plan: 'suspendido',
      updatedAt: serverTimestamp()
    });

    showAlert('Usuario suspendido', 'warning');
    return true;
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
    return false;
  }
}

// Actualizar plan de cliente a premium
export async function activarPremiumCliente(userId, dias = 30) {
  try {
    const hoy = new Date();
    const nuevaFecha = new Date();
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    await updateDoc(doc(db, 'users', userId), {
      plan: 'premium',
      fechaVencimientoPremium: nuevaFecha.toISOString(),
      activo: true,
      updatedAt: serverTimestamp()
    });

    showAlert('Plan Premium activado', 'success');
    return true;
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
    return false;
  }
}

// Volver cliente a plan gratis
export async function desactivarPremiumCliente(userId) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      plan: 'gratis',
      fechaVencimientoPremium: null,
      updatedAt: serverTimestamp()
    });

    showAlert('Vuelto al plan gratis', 'info');
    return true;
  } catch (err) {
    showAlert(`Error: ${err.message}`, 'danger');
    return false;
  }
}