// Configuración de Firebase - Precios Chuy
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsFkax2s-_D7RMlCXXYe3zsFa3kpok-Rc",
  authDomain: "precios-chuy.firebaseapp.com",
  projectId: "precios-chuy",
  storageBucket: "precios-chuy.firebasestorage.app",
  messagingSenderId: "111283581539",
  appId: "1:111283581539:web:c7bf86558396786e14be56"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);