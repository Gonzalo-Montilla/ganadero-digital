# PWA Quality Checklist - Finca El Progreso

Este checklist define el estándar mínimo para operación móvil en campo y uso instalable tipo app.

## 1) Instalación y experiencia app

- [x] `manifest.webmanifest` con `name`, `short_name`, `start_url`, `scope`, `display=standalone`.
- [x] `theme_color` y `background_color` definidos.
- [x] Iconos de app dedicados (`icon-192.svg`, `icon-512.svg`, `icon-maskable.svg`).
- [x] Botón de instalación para Android/Chrome (`beforeinstallprompt`).
- [x] Guía de instalación para iPhone (`Compartir -> Añadir a inicio`).
- [x] `apple-mobile-web-app-*` tags en `index.html`.

## 2) Offline y sincronización

- [x] Service Worker registrado solo en producción.
- [x] App shell cacheada.
- [x] Cola local (outbox) en IndexedDB para operaciones de escritura.
- [x] Reintento de sincronización al recuperar conectividad.
- [x] Estado visible en UI: `Offline`, `X por sincronizar`, `Sincronizado`.
- [x] Evitar cache de APIs para reducir riesgo de datos obsoletos.

## 3) Mobile-first UX

- [x] Navegación inferior fija para móvil (uso con pulgar).
- [x] Menú superior completo para desktop.
- [x] Tablas críticas con vista cards en móvil y tabla en desktop:
  - [x] Transacciones
  - [x] Producción
  - [x] Control sanitario
  - [x] Control reproductivo
- [x] Tap targets cómodos (`>=44px` aprox).
- [x] Safe-area bottom en navegación móvil.

## 4) Calidad técnica y validación

- [x] Ejecutar `npm run build` sin errores.
- [x] Revisar en DevTools -> Application (build preview `npm run preview`):
  - [x] Manifest válido (`/manifest.webmanifest` → 200)
  - [x] Service Worker activo en producción (`/sw.js` → 200, registro solo con `PROD`)
  - [x] Íconos y shortcuts en manifest (192, 512, maskable, Inventario/Sanidad)
- [ ] Prueba manual offline (requiere sesión iniciada con datos previos en caché):
  - [ ] Cargar app y navegar módulos sin red.
  - [ ] Crear registros offline.
  - [ ] Ver contador de pendientes.
  - [ ] Recuperar internet y validar sincronización.
- [ ] Prueba Lighthouse (modo móvil, contra URL de producción HTTPS):
  - [ ] PWA >= 90
  - [ ] Best Practices >= 90
  - [ ] Accessibility >= 90
  - [ ] Performance >= 80 (mínimo aceptable campo)

## 5) Objetivo de release interno

Para considerar "lista para campo":

- [ ] Instalable en Android y iPhone.
- [ ] Funciona en señal intermitente sin pérdida de datos.
- [ ] Flujo crítico en <= 3 toques en móvil.
- [ ] Estados de red y sincronización claros para el operario.
