/* ============ Lord of Engineer · núcleo ============
   Estado, persistencia, tema, audio, mascota, repetición espaciada (SM-2),
   economía (XP, tornillos, rachas), misiones e insignias. */
'use strict';

/* Versión de la app: la actualiza scripts/release.js */
const APP_VERSION = '1.1.1';
const UPDATE_REPO = 'lrmrobotics-pixel/axion-releases';

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const fmt = (v, d = 2) => String(round(v, d)).replace('.', ',').replace('-', '−');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const H = 3600e3, DAY = 864e5;
function uniqueOptions(ans, gen, n = 4) {
  const set = new Set([ans]); let guard = 0;
  while (set.size < n && guard++ < 200) { const v = gen(); if (Number.isFinite(v) || typeof v === 'string') set.add(v); }
  return shuffle([...set]);
}
function seeded(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- estado ---------- */
const KEY = 'axion.v1';
const DEFAULT_STATE = () => ({
  created: Date.now(), name: '', onboarded: false,
  xp: 0, coins: 50, streak: 0, bestStreak: 0, lastDay: null, freezes: 0,
  totalCorrect: 0, totalAnswered: 0, sessions: 0, perfects: 0,
  settings: { accent: '#7c5cff', mode: 'auto', sound: true, music: false, haptics: true, tts: false, fontScale: 1, motion: 'auto' },
  mascot: { color: '#7c5cff', owned: ['c-morado'], head: null, face: null, neck: null },
  modules: {}, badges: [], history: {}, mission: null, bestRelampago: 0, subjectsPlayed: [],
});
const Store = {
  s: null,
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch { raw = null; }
    const d = DEFAULT_STATE();
    this.s = Object.assign(d, raw || {});
    this.s.settings = Object.assign(DEFAULT_STATE().settings, (raw && raw.settings) || {});
    this.s.mascot = Object.assign(DEFAULT_STATE().mascot, (raw && raw.mascot) || {});
    return this.s;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch { /* almacenamiento no disponible */ } },
  reset() { try { localStorage.removeItem(KEY); } catch {} this.s = DEFAULT_STATE(); },
};
const S = () => Store.s;

/* ---------- tema ---------- */
function luminance(hex) {
  const n = hex.replace('#', ''); const v = [0, 2, 4].map((i) => parseInt(n.substr(i, 2), 16) / 255).map((c) => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
  return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
}
function contrast(a, b) { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); }
const Theme = {
  apply() {
    const st = S().settings, r = document.documentElement;
    r.style.setProperty('--accent', st.accent);
    r.style.setProperty('--accent-ink', contrast(st.accent, '#ffffff') >= 3.2 ? '#ffffff' : '#141225');
    r.style.setProperty('--fs', st.fontScale);
    if (st.mode === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', st.mode);
    if (st.motion === 'reduce') r.setAttribute('data-motion', 'reduce'); else r.removeAttribute('data-motion');
    const meta = $('meta[name=theme-color]'); if (meta) meta.content = st.accent;
  },
  isDark() { const m = S().settings.mode; return m === 'dark' || (m === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); },
};

/* ---------- audio, vibración, voz ---------- */
const Sfx = {
  ctx: null,
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(f, t = .12, type = 'sine', vol = .14, delay = 0, dest) {
    const c = this.init(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    const t0 = c.currentTime + delay;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + t);
    o.connect(g).connect(dest || c.destination); o.start(t0); o.stop(t0 + t + .05);
  },
  play(name) {
    if (!S().settings.sound) return;
    const T = (...a) => this.tone(...a);
    ({
      ok: () => { T(660, .1, 'triangle'); T(990, .18, 'triangle', .14, .08); },
      bad: () => { T(300, .14, 'sine', .1); T(240, .2, 'sine', .09, .1); },
      tap: () => T(560, .04, 'square', .035),
      coin: () => { T(988, .1, 'square', .05); T(1319, .18, 'square', .05, .07); },
      win: () => [523, 659, 784, 1047].forEach((f, i) => T(f, .2, 'triangle', .13, i * .1)),
      level: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => T(f, .16, 'square', .06, i * .07)),
      boom: () => { T(90, .5, 'sawtooth', .12); T(60, .6, 'square', .08, .05); },
      whoosh: () => T(200, .25, 'sawtooth', .03),
    }[name] || (() => {}))();
  },
};
/* ---------- música adaptativa ----------
   Secuenciador con planificación anticipada (suena fluido aunque la pantalla esté ocupada),
   envolventes suaves, filtro y eco. Cada ambiente tiene su tema y se cambia con fundido cruzado. */
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const CH = { M: [0, 4, 7, 11], m: [0, 3, 7, 10], s: [0, 5, 7, 10] }; // mayor7, menor7, sus
const MUSIC_THEMES = {
  menu:    { bpm: 74,  prog: [[60, 'M'], [57, 'm'], [65, 'M'], [62, 'm']], arp: [0, -1, 1, -1, 2, -1, 1, -1], lead: 'triangle', pad: 'sine', cutoff: 1600, vol: .5, drums: 0 },
  mate:    { bpm: 92,  prog: [[62, 'M'], [59, 'm'], [67, 'M'], [64, 's']], arp: [0, 1, 2, 3, 2, 1, 0, 1], lead: 'triangle', pad: 'sine', cutoff: 2400, vol: .45, drums: 1 },
  fisica:  { bpm: 104, prog: [[64, 'm'], [60, 'M'], [67, 'M'], [62, 'M']], arp: [0, 2, 1, 2, 0, 3, 1, 2], lead: 'triangle', pad: 'triangle', cutoff: 2200, vol: .42, drums: 1 },
  electro: { bpm: 112, prog: [[57, 'm'], [65, 'M'], [60, 'M'], [67, 's']], arp: [0, 2, 3, 2, 1, 2, 3, 2], lead: 'square', pad: 'sawtooth', cutoff: 1400, vol: .32, drums: 2 },
  codigo:  { bpm: 120, prog: [[60, 'M'], [67, 'M'], [57, 'm'], [65, 'M']], arp: [0, 1, 2, 1, 3, 2, 1, 2], lead: 'square', pad: 'triangle', cutoff: 2600, vol: .3, drums: 2 },
  meca:    { bpm: 86,  prog: [[62, 'm'], [60, 'M'], [58, 'M'], [60, 's']], arp: [0, -1, 0, 2, -1, 1, 0, -1], lead: 'sawtooth', pad: 'triangle', cutoff: 900, vol: .4, drums: 1 },
  rush:    { bpm: 140, prog: [[57, 'm'], [65, 'M'], [67, 'M'], [64, 's']], arp: [0, 1, 2, 3, 2, 3, 1, 2], lead: 'square', pad: 'sawtooth', cutoff: 2000, vol: .3, drums: 3 },
};
const Music = {
  on: false, theme: 'menu', bus: null, filter: null, timer: null, next: 0, step: 0, noise: null,
  sync() { if (S().settings.music) this.start(); else this.stop(); },
  build() {
    const c = Sfx.init(); if (!c) return null;
    if (this.bus) return c;
    this.bus = c.createGain(); this.bus.gain.value = 0;
    this.filter = c.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.Q.value = .7;
    const dly = c.createDelay(1), fb = c.createGain(), wet = c.createGain(); dly.delayTime.value = .33; fb.gain.value = .32; wet.gain.value = .22;
    this.filter.connect(this.bus); this.filter.connect(dly); dly.connect(fb).connect(dly); dly.connect(wet).connect(this.bus);
    this.bus.connect(c.destination);
    const buf = c.createBuffer(1, c.sampleRate * .2, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noise = buf;
    return c;
  },
  start() {
    if (this.on) return; const c = this.build(); if (!c) return;
    this.on = true; this.next = c.currentTime + .1; this.step = 0; this.apply(true);
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stop() {
    if (!this.on) return; this.on = false; clearInterval(this.timer); this.timer = null;
    const c = Sfx.ctx; if (c && this.bus) { this.bus.gain.cancelScheduledValues(c.currentTime); this.bus.gain.setTargetAtTime(0, c.currentTime, .25); }
  },
  setTheme(name) {
    if (!MUSIC_THEMES[name] || name === this.theme) return;
    this.theme = name; if (this.on) this.apply(false);
  },
  apply(first) {
    const c = Sfx.ctx, T = MUSIC_THEMES[this.theme]; if (!c || !this.bus) return; const now = c.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    if (first) this.bus.gain.setValueAtTime(0, now); else this.bus.gain.setTargetAtTime(T.vol * .25, now, .25); // bajada suave
    this.bus.gain.setTargetAtTime(T.vol, now + (first ? 0 : .6), .6);
    this.filter.frequency.setTargetAtTime(T.cutoff, now, .8);
  },
  voice(freq, t, dur, type, vol, attack = .02) {
    const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
    if (type !== 'sine') o.detune.value = (Math.random() - .5) * 8;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.setTargetAtTime(0, t + attack, dur / 3);
    o.connect(g).connect(this.filter); o.start(t); o.stop(t + dur * 1.6 + .1);
  },
  perc(t, kind) {
    const c = Sfx.ctx;
    if (kind === 'kick') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + .18); g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g).connect(this.bus); o.start(t); o.stop(t + .3); return; }
    const n = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain(); n.buffer = this.noise; hp.type = 'highpass'; hp.frequency.value = kind === 'hat' ? 7000 : 2500;
    g.gain.setValueAtTime(kind === 'hat' ? .05 : .03, t); g.gain.exponentialRampToValueAtTime(.001, t + (kind === 'hat' ? .05 : .12)); n.connect(hp).connect(g).connect(this.bus); n.start(t); n.stop(t + .15);
  },
  schedule() {
    const c = Sfx.ctx; if (!c || !this.on) return;
    while (this.next < c.currentTime + .15) { this.play(this.step, this.next); const T = MUSIC_THEMES[this.theme]; this.next += 60 / T.bpm / 2; this.step++; }
  },
  play(step, t) {
    const T = MUSIC_THEMES[this.theme], eighth = 60 / T.bpm / 2, bar = Math.floor(step / 8), pos = step % 8;
    const [root, q] = T.prog[bar % T.prog.length], notes = CH[q].map((iv) => root + iv);
    if (pos === 0) {
      notes.slice(0, 3).forEach((n) => this.voice(midi(n), t, eighth * 8, T.pad, .045, .35)); // colchón de acordes
      this.voice(midi(root - 24), t, eighth * 3, 'triangle', .12, .01); // bajo
    }
    if (pos === 4) this.voice(midi(root - 24 + (T.drums ? 7 : 0)), t, eighth * 2, 'triangle', .09, .01);
    const a = T.arp[pos]; if (a >= 0) this.voice(midi(notes[a % notes.length] + 12), t, eighth * 1.6, T.lead, T.lead === 'sine' || T.lead === 'triangle' ? .05 : .022);
    if (T.drums >= 1 && pos % 4 === 0) this.perc(t, 'kick');
    if (T.drums >= 2 && pos % 2 === 1) this.perc(t, 'hat');
    if (T.drums >= 3 && pos === 4) this.perc(t, 'snare');
    if (this.theme === 'meca' && pos === 6) this.perc(t, 'snare'); // clank mecánico
  },
};
const buzz = (p = 15) => { if (S().settings.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch {} } };
const Voice = {
  speak(text) {
    if (!S().settings.tts || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,;:¡!¿?()=+−\-×÷%°/]/gu, ''));
      u.lang = 'es-ES'; u.rate = 1.05; u.pitch = 1.25;
      const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith('es')); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch {}
  },
};

/* ---------- mascota: Tuerca ---------- */
const ACCESSORIES = {
  casco: { slot: 'head', name: 'Casco de obra', price: 60, svg: '<path d="M22 30 Q50 2 78 30 Z" fill="#ffc53d" stroke="#c98a00" stroke-width="3"/><rect x="16" y="28" width="68" height="7" rx="3" fill="#ffb000" stroke="#c98a00" stroke-width="3"/><rect x="46" y="10" width="8" height="18" rx="3" fill="#ffdd80"/>' },
  birrete: { slot: 'head', name: 'Birrete de grado', price: 150, svg: '<path d="M14 22 L50 10 L86 22 L50 34 Z" fill="#26233a" stroke="#000" stroke-width="2"/><rect x="34" y="26" width="32" height="8" fill="#26233a"/><path d="M82 23 L84 40" stroke="#ffc53d" stroke-width="3"/><circle cx="84" cy="42" r="3.5" fill="#ffc53d"/>' },
  corona: { slot: 'head', name: 'Corona real', price: 250, svg: '<path d="M26 32 L28 10 L40 22 L50 6 L60 22 L72 10 L74 32 Z" fill="#ffd23f" stroke="#c99400" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="24" r="3.5" fill="#ff4d6d"/><circle cx="36" cy="27" r="2.5" fill="#3bc1ff"/><circle cx="64" cy="27" r="2.5" fill="#3bc1ff"/>' },
  audifonos: { slot: 'head', name: 'Audífonos', price: 90, svg: '<path d="M18 50 Q18 18 50 18 Q82 18 82 50" fill="none" stroke="#2b2840" stroke-width="6"/><rect x="10" y="44" width="14" height="22" rx="6" fill="#ff4d6d" stroke="#2b2840" stroke-width="3"/><rect x="76" y="44" width="14" height="22" rx="6" fill="#ff4d6d" stroke="#2b2840" stroke-width="3"/>' },
  gafas: { slot: 'face', name: 'Gafas de sol', price: 70, svg: '<rect x="28" y="45" width="19" height="12" rx="5" fill="#111"/><rect x="53" y="45" width="19" height="12" rx="5" fill="#111"/><path d="M47 50 H53" stroke="#111" stroke-width="3"/><path d="M31 48 L37 48" stroke="#fff" stroke-width="2" opacity=".7"/>' },
  lentes: { slot: 'face', name: 'Lentes de científico', price: 80, svg: '<circle cx="38" cy="51" r="9" fill="rgba(160,220,255,.25)" stroke="#e0e0f0" stroke-width="3"/><circle cx="62" cy="51" r="9" fill="rgba(160,220,255,.25)" stroke="#e0e0f0" stroke-width="3"/><path d="M47 51 H53" stroke="#e0e0f0" stroke-width="3"/>' },
  mono: { slot: 'neck', name: 'Moño elegante', price: 50, svg: '<path d="M50 82 L36 74 L36 90 Z M50 82 L64 74 L64 90 Z" fill="#ff4d6d" stroke="#a3133a" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="82" r="4" fill="#d81b4a"/>' },
  bufanda: { slot: 'neck', name: 'Bufanda', price: 60, svg: '<rect x="26" y="76" width="48" height="9" rx="4" fill="#3bc1ff" stroke="#1678a8" stroke-width="2"/><rect x="58" y="80" width="9" height="16" rx="3" fill="#3bc1ff" stroke="#1678a8" stroke-width="2"/>' },
  rayo: { slot: 'neck', name: 'Medalla rayo', price: 120, svg: '<path d="M38 76 L50 86 L62 76" fill="none" stroke="#ffc53d" stroke-width="3"/><circle cx="50" cy="88" r="7" fill="#ffd23f" stroke="#c99400" stroke-width="2"/><path d="M51 83 L47 89 H51 L49 93" stroke="#7a5a00" stroke-width="1.8" fill="none"/>' },
};
const MASCOT_COLORS = {
  'c-morado': { name: 'Violeta', hex: '#7c5cff', price: 0 }, 'c-azul': { name: 'Azul cobalto', hex: '#2f7df6', price: 40 },
  'c-rojo': { name: 'Rojo turbo', hex: '#ef4444', price: 40 }, 'c-verde': { name: 'Verde menta', hex: '#10b981', price: 40 },
  'c-naranja': { name: 'Naranja', hex: '#ff7a2f', price: 40 }, 'c-rosa': { name: 'Rosa chicle', hex: '#ec4899', price: 60 },
  'c-oro': { name: 'Oro puro', hex: '#d4a017', price: 200 }, 'c-negro': { name: 'Modo sigilo', hex: '#33304a', price: 120 },
};
function mascotSVG(mood = 'idle', m = S().mascot) {
  const c = m.color || '#7c5cff';
  const eyes = {
    idle: '<rect x="33" y="45" width="9" height="12" rx="4.5" fill="#7dffd8"/><rect x="58" y="45" width="9" height="12" rx="4.5" fill="#7dffd8"/>',
    happy: '<path d="M32 53 Q37.5 44 43 53" stroke="#7dffd8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M57 53 Q62.5 44 68 53" stroke="#7dffd8" stroke-width="4" fill="none" stroke-linecap="round"/>',
    wow: '<circle cx="37.5" cy="50" r="7" fill="#7dffd8"/><circle cx="62.5" cy="50" r="7" fill="#7dffd8"/><circle cx="39" cy="48" r="2.5" fill="#fff"/><circle cx="64" cy="48" r="2.5" fill="#fff"/>',
    think: '<rect x="32" y="49" width="11" height="4" rx="2" fill="#7dffd8"/><rect x="58" y="45" width="9" height="12" rx="4.5" fill="#7dffd8"/>',
    oops: '<path d="M33 47 L42 55 M42 47 L33 55" stroke="#ffd27d" stroke-width="3.5" stroke-linecap="round"/><path d="M58 47 L67 55 M67 47 L58 55" stroke="#ffd27d" stroke-width="3.5" stroke-linecap="round"/>',
  }[mood] || '';
  const mouth = {
    idle: '<path d="M44 62 Q50 66 56 62" stroke="#7dffd8" stroke-width="3" fill="none" stroke-linecap="round"/>',
    happy: '<path d="M41 60 Q50 70 59 60 Z" fill="#7dffd8"/>',
    wow: '<ellipse cx="50" cy="64" rx="4" ry="5" fill="#7dffd8"/>',
    think: '<path d="M45 64 H55" stroke="#7dffd8" stroke-width="3" stroke-linecap="round"/>',
    oops: '<path d="M43 65 Q50 59 57 65" stroke="#ffd27d" stroke-width="3" fill="none" stroke-linecap="round"/>',
  }[mood] || '';
  const acc = (slot) => (m[slot] && ACCESSORIES[m[slot]] ? ACCESSORIES[m[slot]].svg : '');
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="50" cy="97" rx="22" ry="3" fill="rgba(0,0,0,.15)"/>
    <line x1="50" y1="22" x2="50" y2="12" stroke="${c}" stroke-width="4"/>
    <circle cx="50" cy="10" r="5.5" fill="#ffc53d" stroke="#000" stroke-opacity=".2" stroke-width="2"><animate attributeName="opacity" values="1;.5;1" dur="1.6s" repeatCount="indefinite"/></circle>
    <rect x="20" y="78" width="60" height="16" rx="8" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/>
    <circle cx="50" cy="86" r="3" fill="rgba(255,255,255,.6)"/>
    <rect x="16" y="22" width="68" height="58" rx="20" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
    <rect x="11" y="42" width="7" height="18" rx="3.5" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    <rect x="82" y="42" width="7" height="18" rx="3.5" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    <rect x="24" y="34" width="52" height="38" rx="13" fill="#1a1830"/>
    <path d="M28 38 Q40 34 52 36" stroke="rgba(255,255,255,.18)" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${eyes}${mouth}
    ${mood === 'happy' ? '<circle cx="29" cy="62" r="3.5" fill="#ff7aa8" opacity=".7"/><circle cx="71" cy="62" r="3.5" fill="#ff7aa8" opacity=".7"/>' : ''}
    ${acc('neck')}${acc('face')}${acc('head')}
  </svg>`;
}
const LINES = {
  ok: ['¡Correcto! ⚡', '¡Exacto!', '¡Eso es ingeniería!', '¡Bien calculado!', '¡Tu cerebro está en modo turbo!', '¡Perfecto!', '¡Sí señor!', '¡Brillante!'],
  bad: ['¡Casi! Mira la explicación.', 'Los errores también entrenan el cerebro.', 'Buen intento, ahora ya sabes el truco.', 'Tranquilo, lo repasaremos pronto.', '¡Uy! Pero vas muy bien.'],
  combo: ['¡Combo x{n}! 🔥', '¡Racha de {n}! Imparable.', '¡{n} seguidas! ¿Eres un robot?'],
  tips: [
    'Estudiar 10 minutos diarios vale más que 2 horas una vez por semana.',
    'Intenta resolver sin mirar: recordar fortalece la memoria.',
    'Si un tema te cuesta, lo traeré de vuelta en tu sección de repasos.',
    'Puedes cambiar mi color y accesorios en la tienda 🛒.',
    'Truco: multiplicar por 5 es multiplicar por 10 y dividir entre 2.',
    'La pendiente m de una recta dice cuánto sube y por cada paso a la derecha.',
    'Ley de Ohm: V = I · R. ¡La usarás toda la carrera!',
    'sin²θ + cos²θ = 1 siempre, para cualquier ángulo.',
    'Un engranaje pequeño moviendo uno grande: menos velocidad, más fuerza.',
    'La derivada es la pendiente de la recta tangente. Así de simple.',
    '¿Sabías que puedes activar mi voz en Ajustes?',
    'Equivocarte aquí es gratis. ¡Experimenta!',
  ],
};
const Mascot = {
  timer: null, mood: 'idle',
  render(mood = this.mood) { this.mood = mood; const b = $('#mascot-btn'); if (b) b.innerHTML = mascotSVG(mood); },
  react(mood, anim) {
    this.render(mood); const b = $('#mascot-btn'); if (!b) return;
    if (anim) { b.classList.remove('jump', 'wiggle'); void b.offsetWidth; b.classList.add(anim); }
    clearTimeout(this._m); this._m = setTimeout(() => this.render('idle'), 2600);
  },
  say(text, mood = 'happy', ms = 3800, speak = true) {
    const bub = $('#bubble'); if (!bub) return;
    bub.textContent = text; bub.hidden = false; bub.style.animation = 'none'; void bub.offsetWidth; bub.style.animation = '';
    this.react(mood, mood === 'happy' ? 'jump' : 'wiggle');
    clearTimeout(this.timer); this.timer = setTimeout(() => { bub.hidden = true; }, ms);
    if (speak) Voice.speak(text);
  },
  hide() { const bub = $('#bubble'); if (bub) bub.hidden = true; },
};

/* ---------- toasts & confeti ---------- */
function toast(msg, ms = 2400) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').append(t);
  setTimeout(() => t.remove(), ms);
}
const Confetti = {
  burst(n = 120) {
    if (S().settings.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#confetti'), cx = cv.getContext('2d'); const W = (cv.width = innerWidth), Hh = (cv.height = innerHeight);
    const cols = [S().settings.accent, '#ffc53d', '#ff6bd6', '#3bc1ff', '#4ade80', '#ff7a2f'];
    const ps = Array.from({ length: n }, () => ({ x: W / 2 + rnd(-60, 60), y: Hh * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: rnd(4, 9), c: pick(cols), a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
    let f = 0;
    const tick = () => {
      cx.clearRect(0, 0, W, Hh);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += .38; p.vx *= .99; p.a += p.va; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); });
      if (f++ < 150) requestAnimationFrame(tick); else cx.clearRect(0, 0, W, Hh);
    };
    tick();
  },
};

/* ---------- niveles ---------- */
const TITLES = ['Aprendiz', 'Tornillo suelto', 'Engranaje', 'Chispa', 'Circuito', 'Servomotor', 'Microcontrolador', 'Androide', 'Ciborg', 'Ingeniero/a Supremo/a', 'Leyenda Mecatrónica'];
const levelOf = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
const xpFor = (lvl) => 40 * (lvl - 1) ** 2;
const titleOf = (lvl) => TITLES[Math.min(TITLES.length - 1, Math.floor((lvl - 1) / 2))];

/* ---------- repetición espaciada (SM-2 adaptado) ---------- */
const SRS = {
  get(id) {
    const m = S().modules;
    if (!m[id]) m[id] = { level: 1, plays: 0, best: 0, bestStars: 0, ef: 2.5, reps: 0, interval: 0, due: 0, mastery: 0, last: 0 };
    return m[id];
  },
  update(id, acc) {
    const r = this.get(id); const q = Math.round(acc * 5);
    if (q < 3) { r.reps = 0; r.interval = 0; r.due = Date.now() + 4 * H; }
    else {
      r.reps += 1;
      r.interval = r.reps === 1 ? 1 : r.reps === 2 ? 3 : Math.round(Math.max(1, r.interval) * r.ef);
      r.due = Date.now() + r.interval * DAY;
    }
    r.ef = Math.max(1.3, r.ef + .1 - (5 - q) * (.08 + (5 - q) * .02));
    r.mastery = Math.round(clamp(r.mastery * .6 + acc * 100 * .4 + (r.reps > 2 ? 5 : 0), 0, 100));
    r.plays += 1; r.last = Date.now();
    if (acc >= .85) r.level = Math.min(5, r.level + 1); else if (acc < .5) r.level = Math.max(1, r.level - 1);
    return r;
  },
  isDue(id) { const r = S().modules[id]; return !!(r && r.plays > 0 && r.due <= Date.now()); },
  dueList() { return GAMES.filter((g) => this.isDue(g.id)).sort((a, b) => S().modules[a.id].due - S().modules[b.id].due); },
  label(id) {
    const r = S().modules[id]; if (!r || !r.plays) return 'Nuevo';
    const ms = r.due - Date.now(); if (ms <= 0) return 'Repasar hoy';
    const d = Math.round(ms / DAY); return d < 1 ? `Repaso en ${Math.max(1, Math.round(ms / H))} h` : `Repaso en ${d} día${d > 1 ? 's' : ''}`;
  },
};

/* ---------- economía, racha, misiones, insignias ---------- */
const SUBJECTS = {
  mate: { name: 'Matemáticas', icon: '🧮', color: 'var(--mate)', desc: 'Aritmética, álgebra, funciones, trigonometría y cálculo' },
  fisica: { name: 'Física', icon: '🚀', color: 'var(--fisica)', desc: 'Vectores, cinemática y movimiento' },
  electro: { name: 'Electrónica', icon: '💡', color: 'var(--electro)', desc: 'Ley de Ohm, circuitos y lógica digital' },
  codigo: { name: 'Programación', icon: '👾', color: 'var(--codigo)', desc: 'Algoritmos por bloques y depuración' },
  meca: { name: 'Mecánica y control', icon: '⚙️', color: 'var(--meca)', desc: 'Engranajes, palancas y control PID' },
};
const GAMES = []; // los minijuegos se registran en games-*.js
const registerGame = (g) => GAMES.push(g);

const Progress = {
  streakNow() {
    const s = S(); if (!s.lastDay) return 0;
    const d = dayDiff(s.lastDay, dayKey());
    if (d <= 1) return s.streak;
    if (d === 2 && s.freezes > 0) return s.streak; // protegida, se consumirá al jugar
    return 0;
  },
  touchStreak() {
    const s = S(), t = dayKey();
    if (s.lastDay === t) return false;
    const d = s.lastDay ? dayDiff(s.lastDay, t) : 99;
    if (d === 1) s.streak += 1;
    else if (d === 2 && s.freezes > 0) { s.freezes -= 1; s.streak += 1; toast('🧊 Tu protector salvó la racha'); }
    else s.streak = 1;
    s.lastDay = t; s.bestStreak = Math.max(s.bestStreak, s.streak);
    return true;
  },
  addXP(n) {
    const s = S(), before = levelOf(s.xp); s.xp += n; const k = dayKey(); s.history[k] = (s.history[k] || 0) + n;
    const after = levelOf(s.xp);
    if (after > before) {
      setTimeout(() => { Sfx.play('level'); Confetti.burst(160); toast(`🎉 ¡Nivel ${after}! Ahora eres ${titleOf(after)}`, 3500); Mascot.say(`¡Subiste a nivel ${after}! Eres ${titleOf(after)}.`, 'wow'); }, 900);
      s.coins += 25;
    }
  },
  addCoins(n) { S().coins += n; },
};

const MISSION_TEMPLATES = [
  (r) => ({ type: 'sessions', n: 2, label: 'Completa 2 sesiones de juego' }),
  (r) => ({ type: 'correct', n: 15, label: 'Acierta 15 ejercicios' }),
  (r) => ({ type: 'correct', n: 25, label: 'Acierta 25 ejercicios' }),
  (r) => { const k = Object.keys(SUBJECTS)[Math.floor(r() * 5)]; return { type: 'subject', subj: k, n: 1, label: `Juega 1 sesión de ${SUBJECTS[k].name}` }; },
  (r) => ({ type: 'stars3', n: 1, label: 'Consigue ⭐⭐⭐ en una sesión' }),
  (r) => ({ type: 'review', n: 1, label: 'Haz 1 repaso pendiente o juega algo nuevo' }),
  (r) => ({ type: 'combo', n: 5, label: 'Logra un combo de 5 aciertos seguidos' }),
];
const Missions = {
  ensure() {
    const s = S(), t = dayKey();
    if (s.mission && s.mission.day === t) return s.mission;
    const r = seeded(t + (s.created || '')); const idx = new Set();
    while (idx.size < 3) idx.add(Math.floor(r() * MISSION_TEMPLATES.length));
    let items = [...idx].map((i) => ({ ...MISSION_TEMPLATES[i](r), p: 0 }));
    // evitar dos misiones de "aciertos"
    if (items.filter((i) => i.type === 'correct').length > 1) items = items.filter((i, k, a) => i.type !== 'correct' || a.findIndex((x) => x.type === 'correct') === k).concat([{ ...MISSION_TEMPLATES[0](r), p: 0 }]);
    s.mission = { day: t, items: items.slice(0, 3), claimed: false };
    return s.mission;
  },
  track(ev) {
    const m = this.ensure();
    m.items.forEach((it) => {
      if (it.p >= it.n) return;
      if (it.type === 'sessions') it.p += 1;
      if (it.type === 'correct') it.p += ev.correct;
      if (it.type === 'subject' && ev.subj === it.subj) it.p += 1;
      if (it.type === 'stars3' && ev.stars === 3) it.p += 1;
      if (it.type === 'review' && (ev.wasDue || ev.wasNew)) it.p += 1;
      if (it.type === 'combo' && ev.bestCombo >= it.n) it.p = it.n;
      it.p = Math.min(it.p, it.n);
    });
  },
  allDone() { return this.ensure().items.every((i) => i.p >= i.n); },
  claim() {
    const m = this.ensure(); if (m.claimed || !this.allDone()) return false;
    m.claimed = true; Progress.addCoins(60); Progress.addXP(40); Store.save();
    Sfx.play('coin'); Confetti.burst(); Mascot.say('¡Misión del día completada! +60 🔩 y +40 XP', 'wow');
    return true;
  },
};

const BADGES = [
  { id: 'first', e: '🌱', name: 'Primer paso', desc: 'Completa tu primera sesión', test: (s) => s.sessions >= 1 },
  { id: 'streak3', e: '🔥', name: 'En llamas', desc: 'Racha de 3 días', test: (s) => s.bestStreak >= 3 },
  { id: 'streak7', e: '🌋', name: 'Semana volcánica', desc: 'Racha de 7 días', test: (s) => s.bestStreak >= 7 },
  { id: 'streak30', e: '☄️', name: 'Imparable', desc: 'Racha de 30 días', test: (s) => s.bestStreak >= 30 },
  { id: 'c100', e: '💯', name: 'Centenario', desc: '100 respuestas correctas', test: (s) => s.totalCorrect >= 100 },
  { id: 'c500', e: '🧠', name: 'Cerebro de acero', desc: '500 respuestas correctas', test: (s) => s.totalCorrect >= 500 },
  { id: 'perfect', e: '💎', name: 'Perfección', desc: 'Sesión sin errores', test: (s) => s.perfects >= 1 },
  { id: 'perfect10', e: '👑', name: 'Rey del 100%', desc: '10 sesiones perfectas', test: (s) => s.perfects >= 10 },
  { id: 'allsubj', e: '🧭', name: 'Explorador', desc: 'Juega las 5 áreas', test: (s) => s.subjectsPlayed.length >= 5 },
  { id: 'lvl5', e: '⚙️', name: 'Engranado', desc: 'Llega al nivel 5', test: (s) => levelOf(s.xp) >= 5 },
  { id: 'lvl10', e: '🤖', name: 'Androide', desc: 'Llega al nivel 10', test: (s) => levelOf(s.xp) >= 10 },
  { id: 'speed', e: '⚡', name: 'Relámpago', desc: '25 aciertos en Cálculo Relámpago', test: (s) => s.bestRelampago >= 25 },
  { id: 'master', e: '🎓', name: 'Maestría', desc: 'Un módulo al 90% de dominio', test: (s) => Object.values(s.modules).some((m) => m.mastery >= 90) },
  { id: 'shop3', e: '🛍️', name: 'Coleccionista', desc: 'Compra 3 objetos', test: (s) => s.mascot.owned.length >= 4 },
];
function checkBadges() {
  const s = S(); const got = [];
  BADGES.forEach((b) => { if (!s.badges.includes(b.id) && b.test(s)) { s.badges.push(b.id); got.push(b); } });
  got.forEach((b, i) => setTimeout(() => { toast(`🏅 Insignia: ${b.e} ${b.name}`, 3200); Sfx.play('coin'); }, 1400 + i * 900));
  return got;
}

/* ---------- arrastrar y soltar (táctil + ratón) ---------- */
function makeDraggable(chip, { zones, onDrop, onTap }) {
  let ghost = null, sx = 0, sy = 0, moved = false, hot = null, down = false;
  const zoneAt = (x, y) => zones().find((z) => { const r = z.getBoundingClientRect(); return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 10; });
  const clear = () => { if (ghost) ghost.remove(); ghost = null; if (hot) hot.classList.remove('drop-hot'); hot = null; down = false; };
  chip.addEventListener('pointerdown', (e) => {
    if (chip.disabled) return;
    down = true; sx = e.clientX; sy = e.clientY; moved = false;
    try { chip.setPointerCapture(e.pointerId); } catch {}
  });
  chip.addEventListener('pointermove', (e) => {
    if (!down) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
      moved = true; ghost = chip.cloneNode(true); ghost.classList.add('dragging'); document.body.append(ghost);
    }
    if (moved) {
      ghost.style.left = e.clientX - ghost.offsetWidth / 2 + 'px'; ghost.style.top = e.clientY - ghost.offsetHeight / 2 + 'px';
      const z = zoneAt(e.clientX, e.clientY); if (hot && hot !== z) hot.classList.remove('drop-hot'); hot = z; if (z) z.classList.add('drop-hot');
    }
  });
  chip.addEventListener('pointerup', (e) => {
    if (!down) return;
    const wasMoved = moved, z = moved ? zoneAt(e.clientX, e.clientY) : null; clear();
    if (wasMoved) { if (z) onDrop(z); } else if (onTap) onTap();
  });
  chip.addEventListener('pointercancel', clear);
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(); } });
}
/* coordenadas de puntero dentro de un SVG */
function svgPoint(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function slider(id, label, min, max, step, val, unit = '') {
  return `<div class="slider"><label for="${id}">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output for="${id}" id="${id}-o">${fmt(val)}${unit}</output></div>`;
}
