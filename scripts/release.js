// Publica una nueva versión de AXIÓN:
//   node scripts/release.js 1.0.1 "Qué hay de nuevo"
// 1) actualiza la versión en js/core.js y android/app/build.gradle
// 2) compila el APK firmado
// 3) lo copia al escritorio y lo sube como release al repo público de APKs
// La app instalada detecta la versión nueva al abrirse y ofrece actualizar.
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const RELEASE_REPO = 'lrmrobotics-pixel/axion-releases';
const [version, notes = 'Mejoras y nuevos retos.'] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('Uso: node scripts/release.js X.Y.Z "notas"');
  process.exit(1);
}
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });

// 1) versión
const core = path.join(root, 'js/core.js');
fs.writeFileSync(core, fs.readFileSync(core, 'utf8').replace(/const APP_VERSION = '[^']+';/, `const APP_VERSION = '${version}';`));
const gradle = path.join(root, 'android/app/build.gradle');
const [a, b, c] = version.split('.').map(Number);
const code = a * 10000 + b * 100 + c;
fs.writeFileSync(gradle, fs.readFileSync(gradle, 'utf8')
  .replace(/versionCode \d+/, `versionCode ${code}`)
  .replace(/versionName "[^"]+"/, `versionName "${version}"`));
const pkg = path.join(root, 'package.json');
const pj = JSON.parse(fs.readFileSync(pkg, 'utf8')); pj.version = version; fs.writeFileSync(pkg, JSON.stringify(pj, null, 2) + '\n');

// 2) compilar
run('node scripts/build-web.js');
run('npx cap sync android');
run(process.platform === 'win32' ? 'gradlew.bat assembleRelease' : './gradlew assembleRelease', path.join(root, 'android'));

// 3) copiar y publicar
const apk = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const out = path.join(os.homedir(), 'Desktop', `AXION-${version}.apk`);
fs.copyFileSync(apk, out);
console.log('APK en', out);
run(`gh release create v${version} "${out}" --repo ${RELEASE_REPO} --title "AXIÓN ${version}" --notes "${notes.replace(/"/g, "'")}"`);
console.log(`Listo: https://github.com/${RELEASE_REPO}/releases/latest`);
