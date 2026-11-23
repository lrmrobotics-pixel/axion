// Publica una nueva versión de Lord of Engineer.
//
//   node scripts/release.js 1.2.1 "Qué hay de nuevo"            -> actualización OTA (solo web, se instala sola)
//   node scripts/release.js 1.3.0 "Qué hay de nuevo" --native   -> también compila un APK nuevo
//
// Usa --native solo si cambiaste algo de Android: nombre, ícono, permisos, plugins o capacitor.config.json.
// La release incluye siempre:
//   - web-X.Y.Z.zip  : la app web; las apps con el plugin la bajan en silencio y la aplican al salir y volver
//   - el APK nativo más reciente, para quien todavía tenga una versión sin el plugin
//   - "min-native: X.Y.Z" en las notas: versión mínima del APK que puede usar este zip
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const RELEASE_REPO = 'lrmrobotics-pixel/axion-releases';
const args = process.argv.slice(2);
const native = args.includes('--native');
const [version, notes = 'Mejoras y nuevos retos.'] = args.filter((a) => a !== '--native');
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('Uso: node scripts/release.js X.Y.Z "notas" [--native]');
  process.exit(1);
}
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
const edit = (file, fn) => { const p = path.join(root, file); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const gt = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };

// versión nativa actual (la del último APK)
const gradleFile = 'android/app/build.gradle';
let nativeVersion = fs.readFileSync(path.join(root, gradleFile), 'utf8').match(/versionName "([^"]+)"/)[1];
if (!gt(version, nativeVersion) && !(native && version === nativeVersion)) {
  console.error(`La versión ${version} debe ser mayor que la nativa actual (${nativeVersion}).`);
  process.exit(1);
}

// 1) versión web
edit('js/core.js', (s) => s.replace(/const APP_VERSION = '[^']+';/, `const APP_VERSION = '${version}';`));
edit('package.json', (s) => { const pj = JSON.parse(s); pj.version = version; return JSON.stringify(pj, null, 2) + '\n'; });
run('node scripts/build-web.js');

// 2) APK (solo si hay cambios nativos)
const outDir = path.join(os.homedir(), 'axion-tools', 'releases'); fs.mkdirSync(outDir, { recursive: true });
let apkPath;
if (native) {
  const [a, b, c] = version.split('.').map(Number);
  edit(gradleFile, (s) => s.replace(/versionCode \d+/, `versionCode ${a * 10000 + b * 100 + c}`).replace(/versionName "[^"]+"/, `versionName "${version}"`));
  nativeVersion = version;
  run('npx cap sync android');
  const androidDir = path.join(root, 'android');
  run(`"${path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew')}" assembleRelease`, androidDir);
  apkPath = path.join(os.homedir(), 'Desktop', `LordOfEngineer-${version}.apk`);
  fs.copyFileSync(path.join(androidDir, 'app/build/outputs/apk/release/app-release.apk'), apkPath);
  console.log('APK en', apkPath);
} else {
  // reutiliza el APK nativo vigente para quien aún no tiene el plugin
  apkPath = path.join(outDir, `LordOfEngineer-${nativeVersion}.apk`);
  if (!fs.existsSync(apkPath)) run(`gh release download v${nativeVersion} --repo ${RELEASE_REPO} --pattern "*.apk" --output "${apkPath}" --clobber`);
}

// 3) zip de la app web (index.html en la raíz)
const zipPath = path.join(outDir, `web-${version}.zip`);
const zipBuf = makeZip(path.join(root, 'www'));
fs.writeFileSync(zipPath, zipBuf);
// el plugin de actualizaciones exige el SHA-256 del zip para aceptar la descarga
const checksum = crypto.createHash('sha256').update(zipBuf).digest('hex');
console.log('Zip web en', zipPath, 'sha256', checksum);

// 4) publicar
const body = `${notes}\n\nmin-native: ${nativeVersion}\nchecksum: ${checksum}`;
const notesFile = path.join(outDir, `notes-${version}.md`); fs.writeFileSync(notesFile, body);
run(`gh release create v${version} "${zipPath}" "${apkPath}" --repo ${RELEASE_REPO} --title "Lord of Engineer ${version}" --notes-file "${notesFile}"`);
// 5) manifiesto latest.json en el repo público (la app lo lee sin el límite de la API)
const dl = (f) => `https://github.com/${RELEASE_REPO}/releases/download/v${version}/${path.basename(f)}`;
const manifest = { version, minNative: nativeVersion, notes, zip: dl(zipPath), checksum, apk: dl(apkPath), apkName: path.basename(apkPath) };
let sha = '';
try { sha = execSync(`gh api repos/${RELEASE_REPO}/contents/latest.json --jq .sha`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { sha = ''; }
const reqFile = path.join(outDir, `manifest-${version}.json`);
fs.writeFileSync(reqFile, JSON.stringify({ message: `latest.json ${version}`, content: Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64'), ...(sha ? { sha } : {}) }));
run(`gh api -X PUT repos/${RELEASE_REPO}/contents/latest.json --input "${reqFile}" --silent`);
console.log(`Listo (${native ? 'APK nuevo + OTA' : 'OTA'}): https://github.com/${RELEASE_REPO}/releases/tag/v${version}`);

/* ---- zip mínimo (deflate) sin dependencias ---- */
function makeZip(dir) {
  const files = [];
  const walk = (d, rel = '') => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name), r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(p, r); else files.push([r, fs.readFileSync(p)]);
  });
  walk(dir);
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const local = [], central = []; let off = 0;
  for (const [name, data] of files) {
    const nb = Buffer.from(name, 'utf8'), comp = zlib.deflateRawSync(data), crc = crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(0, 10); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nb.length, 26); h.writeUInt16LE(0, 28);
    local.push(h, nb, comp);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt32LE(0, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nb.length, 28);
    c.writeUInt32LE(off, 42); central.push(c, nb);
    off += 30 + nb.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...local, cd, end]);
}
