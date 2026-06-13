/**
 * Escribe dist/config.js en runtime (Railway) para que VITE_API_URL
 * no tenga que estar embebida solo en el build.
 */
const fs = require('fs');
const path = require('path');

const apiUrl =
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  'http://localhost:8000/api/v1';

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  console.error('[write-runtime-config] dist/ no existe; ejecute npm run build primero.');
  process.exit(1);
}

const content = `window.__GD_CONFIG__=${JSON.stringify({ apiUrl })};\n`;
fs.writeFileSync(path.join(distDir, 'config.js'), content, 'utf8');
console.log('[write-runtime-config] API URL:', apiUrl);
