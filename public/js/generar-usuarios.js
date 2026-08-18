// Script para generar 250 usuarios ficticios - Precios Chuy
// EJECUTAR UNA SOLA VEZ desde la consola del navegador o Node.js

import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Nombres uruguayos
const nombresUY = [
  'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofía',
  'Martín', 'Valentina', 'Santiago', 'Camila', 'Mateo', 'Isabella',
  'Emilio', 'Catalina', 'Felipe', 'Lucía', 'Andrés', 'Mariana'
];

const apellidosUY = [
  'Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez',
  'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez',
  'Díaz', 'Cruz', 'Morales', 'Ortiz', 'Silva', 'Romero', 'Suárez', 'Alvarez'
];

// Nombres brasileros
const nombresBR = [
  'João', 'Maria', 'José', 'Ana', 'Carlos', 'Paula', 'Pedro', 'Mariana',
  'Lucas', 'Julia', 'Gabriel', 'Isabela', 'Matheus', 'Beatriz',
  'Rafael', 'Camila', 'Bruno', 'Larissa', 'Gustavo', 'Fernanda'
];

const apellidosBR = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira',
  'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro',
  'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes'
];

// Emails comunes
const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

// Tipos de comercio
const tiposComercio = [
  'supermercado', 'carniceria', 'farmacia', 'bebidas',
  'ropa', 'electronica', 'panaderia', 'verduleria'
];

// Generar número aleatorio
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generar email aleatorio
function generarEmail(nombre, apellido, dominio) {
  const opciones = [
    `${nombre.toLowerCase()}.${apellido.toLowerCase()}`,
    `${nombre.toLowerCase()}${apellido.toLowerCase()}${random(10, 99)}`,
    `${nombre.toLowerCase().charAt(0)}${apellido.toLowerCase()}${random(100, 999)}`
  ];
  return `${opciones[random(0, opciones.length - 1)]}@${dominio}`;
}

// Generar usuario cliente
function generarCliente() {
  const esUruguayo = Math.random() > 0.5;
  const nombre = esUruguayo
    ? nombresUY[random(0, nombresUY.length - 1)]
    : nombresBR[random(0, nombresBR.length - 1)];
  const apellido = esUruguayo
    ? apellidosUY[random(0, apellidosUY.length - 1)]
    : apellidosBR[random(0, apellidosBR.length - 1)];
  const dominio = dominios[random(0, dominios.length - 1)];

  return {
    nombre: `${nombre} ${apellido}`,
    email: generarEmail(nombre, apellido, dominio),
    password: 'Cliente123', // Contraseña por defecto
    role: 'cliente',
    plan: Math.random() > 0.8 ? 'premium' : 'gratis', // 20% premium
    activo: true,
    pais: esUruguayo ? 'UY' : 'BR',
    fechaRegistro: new Date(Date.now() - random(1, 180) * 24 * 60 * 60 * 1000).toISOString()
  };
}

// Generar usuario comerciante
function generarComerciante() {
  const esUruguayo = Math.random() > 0.7; // 70% brasileros (Chui)
  const nombre = esUruguayo
    ? nombresUY[random(0, nombresUY.length - 1)]
    : nombresBR[random(0, nombresBR.length - 1)];
  const apellido = esUruguayo
    ? apellidosUY[random(0, apellidosUY.length - 1)]
    : apellidosBR[random(0, apellidosBR.length - 1)];
  const dominio = dominios[random(0, dominios.length - 1)];

  const tipoComercio = tiposComercio[random(0, tiposComercio.length - 1)];
  const nombresComercio = {
    supermercado: ['Super', 'Mercado', 'Central', 'Principal', 'Popular'],
    carniceria: ['Carnes', 'Frigorífico', 'Carnicería', 'El Gaucho', 'La Res'],
    farmacia: ['Farma', 'Droga', 'Salud', 'Vida', 'Bienestar'],
    bebidas: ['Bebidas', 'Depósito', 'Bodegón', 'El Trago', 'La Cava'],
    ropa: ['Moda', 'Estilo', 'Fashion', 'Trend', 'Look'],
    electronica: ['Tech', 'Digital', 'Electro', 'Gadget', 'Smart'],
    panaderia: ['Pan', 'Panadería', 'El Horno', 'La Espiga', 'Trigo'],
    verduleria: ['Verdura', 'Fruta', 'Frescos', 'La Huerta', 'El Campo']
  };

  const nombreComercio = `${nombresComercio[tipoComercio][random(0, 4)]} ${random(1, 99)}`;

  return {
    nombre: `${nombre} ${apellido}`,
    email: generarEmail(nombre, apellido, dominio),
    password: 'Comercio123',
    role: 'comerciante',
    comercio: nombreComercio,
    tipoComercio: tipoComercio,
    plan: Math.random() > 0.5 ? 'prueba' : 'activo',
    activo: true,
    pais: esUruguayo ? 'UY' : 'BR',
    diasRestantes: random(10, 60),
    fechaRegistro: new Date(Date.now() - random(1, 120) * 24 * 60 * 60 * 1000).toISOString()
  };
}

// Función principal para generar usuarios
export async function generarUsuariosFicticios(cantidadClientes = 200, cantidadComercios = 50) {
  console.log(`Generando ${cantidadClientes} clientes y ${cantidadComercios} comercios...`);

  const usuarios = [];

  // Generar clientes
  for (let i = 0; i < cantidadClientes; i++) {
    const cliente = generarCliente();
    usuarios.push({ tipo: 'cliente', datos: cliente });
  }

  // Generar comercios
  for (let i = 0; i < cantidadComercios; i++) {
    const comercio = generarComerciante();
    usuarios.push({ tipo: 'comercio', datos: comercio });
  }

  // Guardar en Firestore
  let exitosos = 0;
  let errores = 0;

  for (const usuario of usuarios) {
    try {
      // NOTA: En producción real, deberías crear el usuario en Firebase Auth primero
      // Este script solo crea el documento en Firestore
      await addDoc(collection(db, 'usuarios_ficticios'), {
        ...usuario.datos,
        tipo: usuario.tipo,
        ficticio: true,
        createdAt: serverTimestamp()
      });
      exitosos++;
    } catch (err) {
      console.error(`Error creando ${usuario.tipo}:`, err);
      errores++;
    }
  }

  console.log(`✅ Generación completada:`);
  console.log(`   Exitosos: ${exitosos}`);
  console.log(`   Errores: ${errores}`);
  console.log(`   Total: ${usuarios.length}`);

  return { exitosos, errores, total: usuarios.length };
}

// Exportar para usar en consola
window.generarUsuariosFicticios = generarUsuariosFicticios;

// Auto-ejecutar si se carga como módulo
console.log('Script de generación de usuarios cargado.');
console.log('Ejecutá: generarUsuariosFicticios(200, 50) para crear 250 usuarios');