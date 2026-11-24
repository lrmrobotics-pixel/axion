# Lord of Engineer ⚔️

Entrena tu mente de ingeniería con minijuegos de 5 a 10 minutos al día.
Tu compañero es **Tuerca**, un robot que te guía, celebra tus logros y te explica cada error.

## Áreas y minijuegos (16)

| Área | Juegos |
|---|---|
| 🧮 Matemáticas | Cálculo Relámpago · Balanza Algebraica · Pizzería Fraccionaria · Cazador de Funciones · Radar Trigonométrico · La Coma Viajera · Tangente Secreta |
| 🚀 Física | Cañón Parabólico · Fuerzas en Equilibrio |
| 💡 Electrónica | Laboratorio de Ohm · Puertas Lógicas |
| 👾 Programación | Robo-Laberinto (bloques) · Cazabugs |
| ⚙️ Mecánica y control | Taller de Engranajes · Balancín de Torques · Termostato PID |

Cada juego tiene 5 niveles de dificultad adaptativa.

## Funciones

- XP, niveles, tornillos 🔩, rachas con protector, misiones diarias e insignias.
- Repetición espaciada (SM-2): lo que te cuesta vuelve pronto.
- Tienda para personalizar a Tuerca (colores y accesorios).
- Modo claro/oscuro, color principal libre, tamaño de texto, reducir animaciones.
- Sonidos, música ambiental, vibración y voz.
- Funciona sin conexión; el progreso se guarda en el dispositivo (exportable).

## Ejecutar en el navegador

```bash
python -m http.server 5173
```

Abre http://localhost:5173

## Generar el APK de Android

Requisitos: Node.js, JDK 21 y Android SDK (platform 35).

```bash
npm install
npm run build:web
npx cap sync android
cd android && gradlew.bat assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Estructura

- `index.html`, `styles.css`: interfaz.
- `js/core.js`: estado, repetición espaciada, mascota, audio, economía.
- `js/games-math.js`, `js/games-lab.js`: minijuegos.
- `js/app.js`: pantallas, navegación y motor de sesiones.
- `sw.js`, `manifest.webmanifest`: PWA sin conexión.
- `android/`: proyecto Capacitor.

> Lord of Engineer es un complemento de estudio; no reemplaza el plan oficial de tu carrera.

## Licencia

Código abierto bajo licencia [MIT](LICENSE). ¡Las contribuciones son bienvenidas!
