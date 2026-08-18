# Precios Chuy 🛒

Comparador de precios Uruguay 🇺🇾 vs Brasil 🇧🇷

## Descripción

App web para comparar precios de productos entre Uruguay y Brasil, enfocada en la zona fronteriza de Chui/Punta del Este.

## Características

-  Comparador de precios en tiempo real
- 🗺️ Mapa de comercios en Chui
- 🚌 Excursiones de compras desde Maldonado
- 📹 Videos y ofertas de comerciantes
- 💰 Calculadora de ahorro
- 📱 Compartir en redes sociales

## Stack Tecnológico

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Vercel Serverless Functions
- **Base de datos:** Firebase Firestore
- **Storage:** Firebase Storage (videos/imágenes)
- **Hosting:** Vercel
- **Mapas:** Google Maps API

## Colores

- Azul Uruguay: `#0038A8`
- Rojo Uruguay: `#EF3340`
- Verde Brasil: `#009C3B`
- Amarillo Brasil: `#FFDF00`

## Roles de Usuario

### Admin
- Gestión completa de secciones, productos, comercios
- Gestión de usuarios y excursiones
- Carga masiva por Excel

### Comerciante ($5/mes)
- Perfil de comercio
- Subir productos ilimitados
- 1 video por día (máx 90 seg)
- Estadísticas de vistas

### Cliente
- Gratis: comparar precios, ver mapa
- Premium ($2/mes): alertas, lista de compras, navegación GPS

## Instalación

1. Clonar repositorio
2. Configurar Firebase (crear proyecto)
3. Copiar credenciales en `public/js/firebase-config.js`
4. Deploy en Vercel

## Estructura

```
precios-chuy/
├── api/              # Funciones serverless
├── public/
│   ├── css/          # Estilos
│   ├── js/           # JavaScript
│   ├── pages/        # HTML de cada rol
│   ├── index.html    # Login
│   ├── manifest.json # PWA
│   └── sw.js         # Service Worker
├── package.json
└── vercel.json
```

## Dominio

`precios-chuy.vercel.app`

## Modelo de Negocio

- Comerciantes: $5/mes
- Clientes Premium: $2/mes
- Excursiones: comisión 15%

## Próximos pasos

- [ ] Integración Google Maps
- [ ] Sistema de pagos PIX/PREX
- [ ] App móvil PWA
- [ ] Newsletter semanal