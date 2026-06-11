# Frontend - Finca El Progreso

Aplicación web React + TypeScript para operación de campo ganadero.

## Scripts

- `npm run dev`: desarrollo local.
- `npm run build`: build de producción.
- `npm run lint`: validación estática.

## Variables de entorno

- `VITE_API_URL`: URL base del backend (`/api/v1`).

## Offline-first (base)

- Service Worker para cache de app shell.
- Cola local de operaciones de escritura (IndexedDB outbox).
- Sincronización automática al recuperar conexión.

## PWA (modo app instalable)

- Instalación Android/Chrome mediante botón `Instalar`.
- Instalación iPhone (Safari): `Compartir -> Añadir a pantalla de inicio`.
- Estado de sincronización visible en la cabecera.

Checklist de calidad PWA y pruebas: `PWA_CHECKLIST.md`.
