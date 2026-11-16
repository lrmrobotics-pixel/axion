// Copia los archivos web a www/ (carpeta que Capacitor empaqueta en el APK)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const files = ['index.html', 'styles.css', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'js'];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of files) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
console.log('www/ listo');
