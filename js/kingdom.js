/* ============ Lord of Engineer · El Reino del Ingeniero ============
   Modo campaña: 6 regiones con misiones (lecciones y juegos existentes) y un jefe final cada una.
   Cada jefe derrotado da una pieza de la armadura de Tuerca; con las 6 eres Lord of Engineer.
   Academia y Juegos siguen abiertos: el Reino es un camino sugerido, no un candado. */
'use strict';

const ARMOR = {
  escudo: { name: 'Escudo del Cálculo', e: '🛡️' },
  espada: { name: 'Espada Integral', e: '🗡️' },
  capa: { name: 'Capa Gravitacional', e: '🧣' },
  peto: { name: 'Peto de Circuitos', e: '⚡' },
  yelmo: { name: 'Penacho del Código', e: '⚜️' },
  corona: { name: 'Corona del Lord', e: '👑' },
};
// capas de la armadura sobre la mascota (coordenadas 0–100 del SVG de Tuerca)
const ARMOR_SVG = {
  capa: { back: true, svg: '<path d="M20 38 Q8 76 20 97 H80 Q92 76 80 38 Z" fill="#b91c1c" stroke="#7f1212" stroke-width="2"/><path d="M28 60 Q50 70 72 60" stroke="#ffd23f" stroke-width="2" fill="none"/>' },
  peto: { svg: '<rect x="25" y="79" width="50" height="14" rx="5" fill="#0e7a4a" stroke="#06402a" stroke-width="2"/><path d="M31 86 H43 L47 82 H55 M59 90 H69" stroke="#e8b923" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="31" cy="86" r="1.6" fill="#ffd23f"/><circle cx="69" cy="90" r="1.6" fill="#ffd23f"/>' },
  escudo: { svg: '<path d="M1 50 L13 45 L25 50 V64 Q25 77 13 83 Q1 77 1 64 Z" fill="#2f7df6" stroke="#1e3a8a" stroke-width="2"/><path d="M13 51 V76 M5 62 H21" stroke="#ffd23f" stroke-width="2.6"/>' },
  espada: { svg: '<path d="M86 30 L90 25 L94 30 V64 H86 Z" fill="#cfd5e0" stroke="#5b6170" stroke-width="1.5"/><path d="M90 32 V58" stroke="#e8b923" stroke-width="1.2"/><rect x="81" y="63" width="18" height="4" rx="1" fill="#d4a017"/><rect x="88" y="67" width="4" height="9" fill="#7a4a1a"/>' },
  yelmo: { head: true, svg: '<path d="M52 21 C57 9 68 4 77 6 C69 10 63 15 59 23 Z" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>' },
  corona: { head: true, svg: '<path d="M33 25 L35 12 L42 19 L50 8 L58 19 L65 12 L67 25 Z" fill="#ffd23f" stroke="#c99400" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="19" r="2.6" fill="#ef4444"/>' },
};
function armorLayers(m, back) {
  const k = S().kingdom; if (!k || m.armor === false) return '';
  return Object.keys(ARMOR_SVG).filter((p) => k.pieces.includes(p) && !!ARMOR_SVG[p].back === back && !(ARMOR_SVG[p].head && m.head)).map((p) => ARMOR_SVG[p].svg).join('');
}

const REGIONS = [
  { id: 'valle', name: 'Valle de los Números', icon: '🏞️', color: '#16a34a', story: 'Todo ingeniero empieza aquí: domina las operaciones para cruzar el valle.', piece: 'escudo',
    missions: [{ l: 'operaciones' }, { l: 'negativos' }, { g: 'relampago' }, { l: 'fracciones' }, { l: 'porcentajes' }, { g: 'fracciones' }, { l: 'potencias' }, { g: 'potencias' }],
    boss: { name: 'Golem de los Cálculos', icon: '🗿', hp: 10, gen: 'arit' } },
  { id: 'torre', name: 'Torre del Álgebra y el Cálculo', icon: '🏰', color: '#7c5cff', story: 'En lo alto de la torre viven las ecuaciones, las derivadas y las integrales.', piece: 'espada',
    missions: [{ l: 'ecuaciones' }, { g: 'balanza' }, { l: 'funciones' }, { g: 'graficador' }, { l: 'trigonometria' }, { g: 'circulo' }, { l: 'derivadas' }, { g: 'derivada' }, { l: 'integrales' }, { g: 'riemann' }, { l: 'matrices' }, { g: 'matrices' }, { l: 'sistemas' }],
    boss: { name: 'Hechicero Integral', icon: '🧙', hp: 12, gen: 'alg' } },
  { id: 'bosque', name: 'Bosque de la Física', icon: '🌲', color: '#ea580c', story: 'Aquí las manzanas caen, los carros aceleran y las fuerzas se suman.', piece: 'capa',
    missions: [{ l: 'unidades' }, { l: 'vectores' }, { g: 'vectores' }, { l: 'movimiento' }, { g: 'proyectil' }, { l: 'newton' }],
    boss: { name: 'Dragón Gravitacional', icon: '🐉', hp: 10, gen: 'fis' } },
  { id: 'minas', name: 'Minas Eléctricas', icon: '⛏️', color: '#ca8a04', story: 'Túneles llenos de corriente: sin la Ley de Ohm no se sale vivo.', piece: 'peto',
    missions: [{ l: 'ohm' }, { g: 'ohm' }, { l: 'circuitos' }, { l: 'digital' }, { g: 'logica' }],
    boss: { name: 'Espectro del Cortocircuito', icon: '👻', hp: 10, gen: 'ele' } },
  { id: 'ciudadela', name: 'Ciudadela del Código', icon: '🏯', color: '#059669', story: 'Una fortaleza de algoritmos custodiada por bugs.', piece: 'yelmo',
    missions: [{ l: 'algoritmos' }, { g: 'robot' }, { l: 'condicionales' }, { g: 'bugs' }],
    boss: { name: 'Virus Rey', icon: '👾', hp: 10, gen: 'cod' } },
  { id: 'forja', name: 'Forja Mecánica', icon: '🔥', color: '#2563eb', story: 'El último reto: palancas, engranajes y control. Aquí se forja el Lord.', piece: 'corona',
    missions: [{ l: 'palancas' }, { g: 'palanca' }, { l: 'engranajes' }, { g: 'engranajes' }, { l: 'control' }, { g: 'pid' }],
    boss: { name: 'Titán de Engranajes', icon: '🤖', hp: 12, gen: 'mec' } },
];

/* ---------- preguntas de los jefes (opción múltiple, generadas al azar) ---------- */
const N = (v) => fmt(v, 3);
const numQ = (q, ans, exp, gen) => ({ q, a: N(ans), opts: uniqueOptions(N(ans), () => N(gen())), exp });
const BOSS_GEN = {
  arit: () => pick([
    () => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 20), r = c + a * b; return numQ(`${c} + ${a} × ${b}`, r, `Primero ${a} × ${b} = ${a * b}, luego + ${c} = ${r}.`, () => r + pick([-10, -1, 1, 10, (c + a) * b - r])); },
    () => { const a = rnd(-12, -2), b = rnd(2, 15), r = a + b; return numQ(`(${fmt(a)}) + ${b}`, r, `Desde ${fmt(a)} avanzas ${b}: ${fmt(r)}.`, () => r + pick([-2, 2, -2 * b, 1])); },
    () => { const [p, n] = pick([[25, 80], [10, 350], [50, 64], [20, 150], [75, 40], [5, 300]]), r = p * n / 100; return numQ(`${p}% de ${n}`, r, `${p}/100 × ${n} = ${r}.`, () => r + pick([-5, 5, 10, r])); },
    () => { const [a, b, c] = pick([[1, 2, 4], [1, 4, 8], [1, 3, 6], [2, 3, 6], [1, 5, 10]]), r = a / b + a / c; return numQ(`${a}/${b} + ${a}/${c}`, r, `Común denominador ${c}: ${a * c / b}/${c} + ${a}/${c} = ${N(r)}.`, () => pick([(2 * a) / (b + c), r + .25, r - .25, a / c])); },
    () => { const b = rnd(2, 5), e = rnd(2, 4), r = b ** e; return numQ(`${b}^${e}`, r, `${Array(e).fill(b).join(' × ')} = ${r}.`, () => pick([b * e, r + b, r - b, b ** (e + 1)])); },
    () => { const s = rnd(4, 15), r = s; return numQ(`√${s * s}`, r, `${s} × ${s} = ${s * s}.`, () => r + pick([-2, -1, 1, 2, r])); },
  ])(),
  alg: () => pick([
    () => { const x = rnd(1, 9), a = rnd(2, 6), b = rnd(1, 9); return numQ(`Resuelve ${a}x + ${b} = ${a * x + b}. ¿x?`, x, `Resta ${b}: ${a}x = ${a * x}. Divide entre ${a}: x = ${x}.`, () => x + pick([-2, -1, 1, 2, b])); },
    () => { const m = rnd(-3, 4) || 2, b = rnd(-5, 5), x = rnd(-3, 4), r = m * x + b; return numQ(`f(x) = ${m}x ${b < 0 ? '− ' + -b : '+ ' + b}. ¿f(${x})?`.replace(/-/g, '−'), r, `${m}·${x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${r}.`.replace(/-/g, '−'), () => r + pick([-2, 2, m, -m, 1])); },
    () => { const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]); return numQ(`Catetos ${a} y ${b}. ¿Hipotenusa?`, c, `√(${a * a} + ${b * b}) = √${c * c} = ${c}.`, () => pick([a + b, c + 1, c - 1, c + 2])); },
    () => { const k = rnd(1, 4), n = rnd(2, 3), x = rnd(1, 3), r = k * n * x ** (n - 1); return numQ(`f(x) = ${k === 1 ? '' : k}x^${n}. ¿f'(${x})?`, r, `f'(x) = ${k * n}x^${n - 1}; en ${x}: ${r}.`, () => pick([k * x ** n, r + k, r - 1, k * n])); },
    () => { const a = pick([2, 3, 4, 6]), r = a * a / 2; return numQ(`∫₀^${a} x dx`, r, `Antiderivada x²/2: ${a * a}/2 = ${N(r)}.`, () => pick([a * a, a, r + 1, a * a / 3])); },
    () => { const m = [rnd(-3, 4), rnd(-3, 4), rnd(-3, 4), rnd(-3, 4)], r = m[0] * m[3] - m[1] * m[2]; return numQ(`det [${m[0]} ${m[1]} ; ${m[2]} ${m[3]}]`.replace(/-/g, '−'), r, `${m[0]}·${m[3]} − ${m[1]}·${m[2]} = ${r}.`.replace(/-/g, '−'), () => pick([m[0] * m[3] + m[1] * m[2], -r, r + 1, r - 2])); },
    () => { const x = rnd(1, 8), y = rnd(1, 8); return numQ(`x + y = ${x + y} ; x − y = ${x - y}. ¿x?`.replace(/= -/g, '= −'), x, `Suma las ecuaciones: 2x = ${2 * x}, x = ${x}.`, () => pick([y, x + 1, x - 1, x + y])); },
  ])(),
  fis: () => pick([
    () => { const t = rnd(2, 10), v = rnd(2, 15); return numQ(`Recorres ${v * t} m en ${t} s. ¿Velocidad (m/s)?`, v, `v = d/t = ${v * t}/${t} = ${v}.`, () => v + pick([-2, 2, t, -1])); },
    () => { const m = rnd(2, 20), a = rnd(1, 6); return numQ(`F = m·a con m = ${m} kg y a = ${a} m/s². ¿F (N)?`, m * a, `${m} × ${a} = ${m * a} N.`, () => m * a + pick([-m, m, a, -a])); },
    () => { const [k, v] = pick([[36, 10], [72, 20], [90, 25], [108, 30], [18, 5]]); return numQ(`${k} km/h a m/s`, v, `Divide entre 3,6: ${k}/3,6 = ${v}.`, () => pick([v * 2, k / 10, v + 5, v - 5])); },
    () => { const v0 = rnd(0, 10), a = rnd(1, 5), t = rnd(2, 6), r = v0 + a * t; return numQ(`v₀ = ${v0} m/s, a = ${a} m/s², t = ${t} s. ¿v?`, r, `v = v₀ + a·t = ${v0} + ${a * t} = ${r}.`, () => r + pick([-a, a, -v0 || 3, t])); },
    () => { const [x, y, m] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]); return numQ(`|(${x}, ${y})| = ?`, m, `√(${x * x} + ${y * y}) = ${m}.`, () => pick([x + y, m + 1, m - 1, x * y])); },
    () => { const m = pick([10, 20, 50, 70]); return numQ(`Peso de ${m} kg (g = 9,8). ¿N?`, m * 9.8, `${m} × 9,8 = ${N(m * 9.8)} N.`, () => pick([m * 10, m, m * 9.8 + 10, m / 9.8])); },
  ])(),
  ele: () => pick([
    () => { const R = rnd(2, 12), I = rnd(1, 4); return numQ(`V = ${R * I} V, R = ${R} Ω. ¿I (A)?`, I, `I = V/R = ${R * I}/${R} = ${I}.`, () => pick([R * I * R, I + 1, I + 2, R])); },
    () => { const a = pick([100, 220, 330, 470]), b = pick([100, 150, 220, 1000]); return numQ(`Serie: ${a} Ω + ${b} Ω`, a + b, `En serie se suman: ${a + b} Ω.`, () => pick([a * b / (a + b), Math.abs(a - b), a + b + 100, a])); },
    () => { const r = pick([4, 6, 10, 20, 100]); return numQ(`Paralelo: ${r} Ω y ${r} Ω`, r / 2, `Dos iguales en paralelo: la mitad, ${r / 2} Ω.`, () => pick([r * 2, r, r / 4, r + 2])); },
    () => { const V = pick([5, 9, 12, 24]), I = pick([1, 2, 3]); return numQ(`P = V·I con ${V} V y ${I} A. ¿W?`, V * I, `${V} × ${I} = ${V * I} W.`, () => pick([V + I, V / I, V * I + V, V])); },
    () => { const n = rnd(1, 15), b = n.toString(2).padStart(4, '0'); return numQ(`${b} en binario = ? (decimal)`, n, `${b.split('').map((d, i) => (d === '1' ? 2 ** (3 - i) : null)).filter((x) => x !== null).join(' + ') || '0'} = ${n}.`, () => pick([n + 1, n - 1, parseInt(b, 10) % 16, 15 - n])); },
    () => { const A = rnd(0, 1), B = rnd(0, 1), g = pick(['AND', 'OR', 'XOR']), r = g === 'AND' ? A & B : g === 'OR' ? A | B : A ^ B; return { q: `${A} ${g} ${B} = ?`, a: String(r), opts: ['0', '1'], exp: `${g}: ${g === 'AND' ? 'solo 1 si ambas son 1' : g === 'OR' ? '1 si alguna es 1' : '1 si son distintas'}.` }; },
  ])(),
  cod: () => pick([
    () => { const a = rnd(2, 9), k = rnd(2, 4), b = rnd(1, 5), r = a * k + b; return numQ(`a = ${a}; a = a * ${k} + ${b}. ¿a?`, r, `${a} × ${k} + ${b} = ${r}.`, () => pick([a * (k + b), r + 1, a + k + b, a])); },
    () => { const n = rnd(3, 8), r = n * (n + 1) / 2; return numQ(`suma = 0; para i de 1 a ${n}: suma = suma + i. ¿suma?`, r, `1 + 2 + … + ${n} = ${r}.`, () => pick([n, r - n, r + n + 1, n * n])); },
    () => { const n = rnd(3, 9); return numQ(`¿Cuántas veces se repite "para i de 1 a ${n}"?`, n, `i toma ${n} valores: 1 a ${n}.`, () => pick([n - 1, n + 1, 1, n * 2])); },
    () => { const t = rnd(20, 40), u = 30; return { q: `temp = ${t}. si temp > ${u}: "ON" sino "OFF". ¿Resultado?`, a: t > u ? 'ON' : 'OFF', opts: ['ON', 'OFF'], exp: `${t} ${t > u ? '>' : 'no es mayor que'} ${u}.` }; },
    () => { const x = rnd(1, 6), y = rnd(1, 6); return numQ(`x = ${x}; y = x; x = x + ${y}. ¿y?`, x, `y guardó el valor viejo de x (${x}); cambiar x después no cambia y.`, () => pick([x + y, y, 0, x * y])); },
  ])(),
  mec: () => pick([
    () => { const F = pick([20, 40, 50, 100]), d = pick([0.2, 0.5, 2, 3]); return numQ(`Torque con ${F} N a ${N(d)} m (N·m)`, F * d, `τ = F·d = ${N(F * d)}.`, () => pick([F / d, F + d, F * d * 2, F])); },
    () => { const n1 = pick([10, 12, 20]), w1 = pick([60, 100, 120]), n2 = pick([30, 40, 60]); const r = w1 * n1 / n2; return numQ(`Motor ${n1} dientes a ${w1} rpm mueve ${n2} dientes. ¿rpm?`, r, `${w1} × ${n1}/${n2} = ${N(r)}.`, () => pick([w1 * n2 / n1, w1, r * 2, r + 10])); },
    () => { const m1 = rnd(2, 6), d1 = rnd(1, 4), m2 = pick([1, 2, 3, 4].filter((m) => (m1 * d1) % m === 0)) || 1, r = m1 * d1 / m2; return numQ(`${m1} kg a ${d1} m. ¿A qué distancia equilibran ${m2} kg?`, r, `${m1}·${d1} = ${m2}·d → d = ${N(r)} m.`, () => pick([d1, r + 1, m1, r * 2])); },
    () => { const meta = pick([50, 60, 80]), med = meta - rnd(3, 20); return numQ(`Meta ${meta} °C, sensor ${med} °C. ¿Error?`, meta - med, `error = meta − medida = ${meta - med}.`, () => pick([med - meta, meta + med, meta - med + 2, med])); },
    () => { const kp = pick([0.5, 2, 0.2]), e = pick([10, 20, 5]); return numQ(`Kp = ${N(kp)}, error = ${e}. ¿Salida P?`, kp * e, `${N(kp)} × ${e} = ${N(kp * e)}.`, () => pick([kp + e, e / kp, kp * e * 2, e])); },
  ])(),
};

const Kingdom = {
  state() { const s = S(); if (!s.kingdom) s.kingdom = { bosses: {}, pieces: [] }; return s.kingdom; },
  missionDone(m) { return m.l ? !!(S().lessons || {})[m.l] : !!(S().modules[m.g] && S().modules[m.g].bestStars >= 1); },
  progress(r) { const d = r.missions.filter((m) => this.missionDone(m)).length; return { d, t: r.missions.length, p: d / r.missions.length }; },
  unlocked(i) { return i === 0 || !!this.state().bosses[REGIONS[i - 1].id]; },
  bossReady(r) { return this.progress(r).p >= 0.6; },
  current() { const i = REGIONS.findIndex((r, k) => this.unlocked(k) && !this.state().bosses[r.id]); return i < 0 ? null : REGIONS[i]; },
  isLord() { return REGIONS.every((r) => this.state().bosses[r.id]); },
  map() {
    chrome(true, 'reino'); const k = this.state(), cur = this.current();
    $('#main').innerHTML = `<section class="card kingdom-hero"><div class="avatar" style="width:110px">${mascotSVG('happy')}</div><div class="grow">
        <h1 style="margin:0">⚔️ El Reino del Ingeniero</h1><p class="muted" style="margin:4px 0 8px">${this.isLord() ? '👑 ¡Eres <b>Lord of Engineer</b>! Conquistaste todo el reino.' : 'Completa misiones, vence a los jefes y gana la armadura de Tuerca.'}</p>
        <div class="armor-row">${Object.entries(ARMOR).map(([id, a]) => `<span class="piece ${k.pieces.includes(id) ? 'on' : ''}" title="${a.name}">${a.e}</span>`).join('')}</div>
        <p class="muted" style="margin:6px 0 0;font-size:.85rem;font-weight:800">Armadura: ${k.pieces.length}/6 piezas</p></div></section>
      <div class="realm-path">${REGIONS.map((r, i) => {
        const open = this.unlocked(i), pr = this.progress(r), beaten = !!k.bosses[r.id], ready = this.bossReady(r);
        return `<section class="realm ${open ? '' : 'locked'} ${r === cur ? 'current' : ''}" style="--rc:${r.color}">
          <div class="realm-banner"><span class="realm-icon" aria-hidden="true">${open ? r.icon : '🔒'}</span><div class="grow"><b>${i + 1}. ${r.name}</b><small>${open ? r.story : `Derrota al jefe de ${REGIONS[i - 1].name} para entrar.`}</small></div>${beaten ? '<span class="tag new">🏆</span>' : ''}</div>
          ${open ? `<div class="xpbar" style="margin:10px 0"><i style="width:${pr.p * 100}%;background:var(--rc)"></i></div><p class="muted" style="margin:0 0 8px;font-size:.85rem;font-weight:800">Misiones ${pr.d}/${pr.t}</p>
          <div class="missions">${r.missions.map((m) => { const done = this.missionDone(m), L = m.l && lessonById(m.l), G = m.g && gameById(m.g); if (!L && !G) return ''; return `<button class="mchip ${done ? 'done' : ''}" ${m.l ? `data-go="#/lesson/${m.l}"` : `data-play="${m.g}"`}>${done ? '✓' : m.l ? '📖' : '🎮'} ${esc(L ? L.title : G.name)}</button>`; }).join('')}</div>
          <button class="btn block boss-btn" ${ready || beaten ? `data-go="#/boss/${r.id}"` : 'disabled'} style="margin-top:12px">${beaten ? `🏆 ${r.boss.icon} ${r.boss.name} derrotado · revancha` : ready ? `⚔️ Enfrentar a ${r.boss.icon} ${r.boss.name}` : `🔒 Jefe: completa el 60% de las misiones`}</button>` : ''}
        </section>`; }).join('')}</div>
      <p class="center muted" style="font-size:.85rem">La Academia y los Juegos siguen abiertos: aquí solo sigues el camino del reino.</p>`;
  },
  boss(id) {
    const r = REGIONS.find((x) => x.id === id), i = REGIONS.indexOf(r); if (!r || !this.unlocked(i)) return Router.nav('#/reino');
    chrome(false); Music.setTheme('rush');
    const st = { hp: r.boss.hp, hearts: 3, combo: 0, n: 0, wrongs: [] };
    const draw = (shake) => {
      const Q = BOSS_GEN[r.boss.gen](); st.q = Q;
      $('#main').innerHTML = `<div class="game-top"><button class="icon-btn" id="bs-x" aria-label="Huir del combate">✕</button><span class="hearts" aria-label="${st.hearts} vidas">${'❤️'.repeat(st.hearts)}${'🖤'.repeat(3 - st.hearts)}</span><span class="grow"></span><span class="combo">${st.combo > 1 ? `x${st.combo}🔥` : ''}</span></div>
        <section class="boss-arena" style="--rc:${r.color}"><div class="boss-face ${shake ? 'hit' : ''}" aria-hidden="true">${r.boss.icon}</div><b>${r.boss.name}</b>
          <div class="boss-hp" role="progressbar" aria-label="Vida del jefe" aria-valuenow="${st.hp}" aria-valuemax="${r.boss.hp}"><i style="width:${st.hp / r.boss.hp * 100}%"></i></div><small class="muted" style="font-weight:800">${st.hp}/${r.boss.hp} PV</small></section>
        <div class="big-expr" style="font-size:clamp(1.3rem,6vw,2rem)">${Q.q}</div><div class="opts" id="bs-o">${Q.opts.map((o) => `<button class="btn ghost opt">${esc(o)}</button>`).join('')}</div><div id="bs-fb"></div>`;
      $('#bs-x').onclick = () => history.back();
      $$('#bs-o .opt').forEach((b, k) => b.onclick = () => answer(Q.opts[k], b));
    };
    const answer = (o, btn) => {
      if ($('#bs-o').dataset.done) return; $('#bs-o').dataset.done = 1; const ok = o === st.q.a; st.n++;
      $$('#bs-o .opt').forEach((b, k) => { if (st.q.opts[k] === st.q.a) b.classList.add('right'); }); if (!ok) btn.classList.add('wrong');
      if (ok) { st.combo++; const dmg = st.combo >= 3 ? 2 : 1; st.hp = Math.max(0, st.hp - dmg); Sfx.play('boom'); buzz(25); if (dmg === 2) toastIn(`¡Golpe crítico! −${dmg}`); }
      else { st.combo = 0; st.hearts--; st.wrongs.push(st.q.exp); Sfx.play('bad'); buzz([40, 30, 60]); }
      if (st.hp <= 0) return setTimeout(() => this.win(r, st), 600);
      if (st.hearts <= 0) return setTimeout(() => this.lose(r, st), 900);
      if (ok) { Voice.speak(COMPANION.ok(), { important: false }); setTimeout(() => draw(true), 650); }
      else {
        $('#bs-fb').innerHTML = `<div class="callout bad"><b>¡El jefe te golpeó!</b> ${st.q.exp}</div><button class="btn block" id="bs-c">Seguir luchando ⚔️</button>`;
        Voice.speak('Cuidado. ' + st.q.exp); $('#bs-c').onclick = () => draw(false); $('#bs-c').focus();
      }
    };
    const toastIn = (t) => { const fb = $('#bs-fb'); if (fb) fb.innerHTML = `<p class="center" style="font-weight:800;color:var(--accent)">${t}</p>`; };
    Mascot.say(`¡Es ${r.boss.name}! Cada acierto le quita vida. Tres aciertos seguidos hacen golpe crítico.`, 'wow', 4000);
    draw(false);
  },
  win(r, st) {
    const k = this.state(), first = !k.bosses[r.id]; k.bosses[r.id] = { date: Date.now(), hearts: st.hearts };
    if (first && !k.pieces.includes(r.piece)) k.pieces.push(r.piece);
    const coins = first ? 120 : 30, xp = first ? 100 : 25; Progress.addCoins(coins); Progress.addXP(xp); Progress.touchStreak(); checkBadges(); Store.save();
    Sfx.play('win'); Confetti.burst(220); Mascot.render('happy');
    const lord = this.isLord(), next = REGIONS[REGIONS.indexOf(r) + 1];
    $('#main').innerHTML = `<section class="result"><div style="font-size:4rem">🏆</div><h1>¡Derrotaste a ${r.boss.name}!</h1>
      ${first ? `<div class="card" style="text-align:center"><div style="width:140px;margin:0 auto">${mascotSVG('happy')}</div><p style="font-weight:800;margin:6px 0 0">Nueva pieza de armadura: ${ARMOR[r.piece].e} ${ARMOR[r.piece].name}</p></div>` : ''}
      ${lord && first ? '<h2>👑 ¡Ahora eres LORD OF ENGINEER!</h2>' : ''}
      <div class="rewards"><span class="reward">+${xp} XP</span><span class="reward">+${coins} 🔩</span><span class="reward">${'❤️'.repeat(st.hearts)} restantes</span></div>
      <div class="controls">${next && first ? `<button class="btn block" data-go="#/reino">Siguiente región: ${next.icon} ${next.name}</button>` : ''}<button class="btn ${next && first ? 'ghost' : ''} block" data-go="#/reino">⚔️ Volver al Reino</button></div></section>`;
    Voice.speak(lord && first ? `¡Lo lograste, ${S().name}! Conquistaste todo el reino. Ahora eres Lord of Engineer.` : `¡Victoria, ${S().name}! Derrotaste a ${r.boss.name}.${first ? ` Ganaste la pieza ${ARMOR[r.piece].name}.` : ''}`);
  },
  lose(r, st) {
    Store.save(); Mascot.render('think');
    $('#main').innerHTML = `<section class="result"><div style="font-size:4rem">${r.boss.icon}</div><h1>${r.boss.name} ganó esta vez</h1><p style="font-weight:800">Le quitaste ${r.boss.hp - st.hp} de ${r.boss.hp} PV. ¡Entrena y vuelve!</p>
      ${st.wrongs.length ? `<details class="card mistakes" open><summary style="font-weight:800;cursor:pointer">📝 Lo que debes repasar</summary><ul>${st.wrongs.map((w) => `<li>${w}</li>`).join('')}</ul></details>` : ''}
      <div class="controls"><button class="btn block" data-go="#/boss/${r.id}">↻ Revancha</button><button class="btn ghost block" data-go="#/reino">⚔️ Volver al Reino</button></div></section>`;
    Voice.speak(`${r.boss.name} ganó esta vez, pero le quitaste ${r.boss.hp - st.hp} puntos de vida. Repasa y volvemos con todo.`);
  },
};
