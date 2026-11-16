/* ============ AXIÓN · minijuegos de matemáticas ============
   Cada juego: { id, subj, name, icon, desc, rounds|timed, round(ctx) }
   ctx: { stage, diff (1-5), answer(ok, explicación), say(), cleanup(fn) } */
'use strict';

/* Botones de opción múltiple reutilizables */
function choiceButtons(ctx, container, options, correct, explain, show = (v) => v) {
  const box = document.createElement('div'); box.className = 'opts';
  options.forEach((o) => {
    const b = document.createElement('button'); b.className = 'btn ghost opt'; b.innerHTML = show(o);
    b.onclick = () => {
      if (box.dataset.done) return; box.dataset.done = 1;
      const ok = o === correct; b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) [...box.children].forEach((x, i) => { if (options[i] === correct) x.classList.add('right'); });
      ctx.answer(ok, explain);
    };
    box.append(b);
  });
  container.append(box);
}

/* ---------- 1. Cálculo Relámpago ---------- */
registerGame({
  id: 'relampago', subj: 'mate', name: 'Cálculo Relámpago', icon: '⚡', timed: 60,
  desc: '60 segundos de cálculo mental. ¡Encadena combos!',
  round(ctx) {
    const d = ctx.diff; let a, b, ans, txt, exp;
    const kind = d === 1 ? pick(['+', '−']) : d === 2 ? pick(['×', '+', '−']) : d === 3 ? pick(['×', '÷', '+']) : d === 4 ? pick(['×', '÷', '+', '−', 'neg']) : pick(['%', 'sq', '×', '÷', 'neg']);
    if (kind === '+') { a = rnd(2, d > 2 ? 99 : 30); b = rnd(2, d > 2 ? 99 : 30); ans = a + b; txt = `${a} + ${b}`; }
    if (kind === '−') { a = rnd(5, d > 2 ? 99 : 30); b = rnd(1, a); ans = a - b; txt = `${a} − ${b}`; }
    if (kind === '×') { a = rnd(2, d > 3 ? 15 : 10); b = rnd(2, d > 4 ? 15 : 10); ans = a * b; txt = `${a} × ${b}`; }
    if (kind === '÷') { b = rnd(2, 12); ans = rnd(2, 12); a = b * ans; txt = `${a} ÷ ${b}`; }
    if (kind === 'neg') { a = rnd(-15, 15); b = rnd(-15, 15); const op = pick(['+', '−', '×']); ans = op === '+' ? a + b : op === '−' ? a - b : a * b; txt = `${a < 0 ? '(' + fmt(a) + ')' : a} ${op} ${b < 0 ? '(' + fmt(b) + ')' : b}`; }
    if (kind === '%') { const p = pick([10, 20, 25, 50, 75, 5, 15, 30]); const n = pick([20, 40, 60, 80, 120, 200, 360, 400]); ans = p * n / 100; txt = `${p}% de ${n}`; }
    if (kind === 'sq') { a = rnd(11, 20); ans = a * a; txt = `${a}²`; }
    exp = `${txt} = ${fmt(ans)}`;
    ctx.stage.innerHTML = `<div class="big-expr" aria-live="polite">${txt} = ?</div>`;
    const opts = uniqueOptions(ans, () => ans + pick([-10, -2, -1, 1, 2, 10, a || 3, -(b || 3)]) * (Number.isInteger(ans) ? 1 : 1));
    choiceButtons(ctx, ctx.stage, opts, ans, exp, (v) => fmt(v));
  },
});

/* ---------- 2. Balanza Algebraica ---------- */
registerGame({
  id: 'balanza', subj: 'mate', name: 'Balanza Algebraica', icon: '⚖️', rounds: 5,
  desc: 'Despeja la x aplicando la misma operación a ambos lados.',
  round(ctx) {
    const d = ctx.diff; let a = 1, b, c = 0, x, e;
    if (d === 1) { x = rnd(1, 9); b = rnd(1, 9); }
    else if (d === 2) { a = rnd(2, 5); x = rnd(1, 9); b = 0; }
    else if (d === 3) { a = rnd(2, 5); x = rnd(1, 9); b = rnd(1, 9); }
    else { a = rnd(3, 6); c = rnd(1, a - 1); x = d === 5 ? pick([-4, -3, -2, 2, 3, 4, 5, 6, 7]) : rnd(1, 8); b = d === 5 ? rnd(-9, 9) : rnd(1, 9); }
    e = d >= 4 ? rnd(0, 9) : 0; // constante extra a la derecha
    let L = { x: a, k: b }, R = { x: c, k: (a - c) * x + b - (d >= 4 ? 0 : 0) };
    if (d >= 4) { R.k = (a - c) * x + b; }
    if (d < 4) R.k = a * x + b;
    const opt = (c !== 0 ? 1 : 0) + (b !== 0 ? 1 : 0) + (Math.abs(a - c) !== 1 ? 1 : 0);
    const start = { L: { ...L }, R: { ...R } };
    let steps = 0, op = '−', num = 1, useX = false;
    const side = (s) => {
      const parts = []; if (s.x) parts.push(`${s.x === 1 ? '' : s.x === -1 ? '−' : fmt(s.x)}x`);
      if (s.k || !s.x) parts.push(parts.length ? (s.k < 0 ? `− ${-s.k}` : `+ ${s.k}`) : fmt(s.k));
      return parts.join(' ');
    };
    const blocks = (s) => {
      let h = ''; const nx = Math.min(Math.abs(s.x), 8);
      for (let i = 0; i < nx; i++) h += `<rect x="${i * 13}" y="-22" width="11" height="20" rx="3" fill="${s.x < 0 ? '#fb923c' : 'var(--accent)'}"/><text x="${i * 13 + 5.5}" y="-8" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">x</text>`;
      if (s.k) h += `<rect x="${nx * 13 + 2}" y="-20" width="${String(Math.abs(s.k)).length * 8 + 14}" height="18" rx="9" fill="${s.k < 0 ? '#fb923c' : '#94a3b8'}"/><text x="${nx * 13 + 9 + String(Math.abs(s.k)).length * 4}" y="-7" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">${s.k < 0 ? '−' : ''}${Math.abs(s.k)}</text>`;
      return h;
    };
    const solved = () => (L.x === 1 && L.k === 0 && R.x === 0) || (R.x === 1 && R.k === 0 && L.x === 0);
    const draw = (wobble) => {
      ctx.stage.innerHTML = `
        <div class="prompt">Despeja <b>x</b><small>Aplica la misma operación a ambos lados. Meta: dejar x sola.</small></div>
        <svg class="viz" viewBox="0 0 320 150" role="img" aria-label="Balanza en equilibrio">
          <g class="${wobble ? 'shake' : ''}" style="transform-origin:160px 60px">
            <line x1="30" y1="60" x2="290" y2="60" stroke="var(--muted)" stroke-width="6" stroke-linecap="round"/>
            <line x1="70" y1="60" x2="70" y2="100" stroke="var(--muted)" stroke-width="2"/><line x1="250" y1="60" x2="250" y2="100" stroke="var(--muted)" stroke-width="2"/>
            <path d="M20 100 H120 L110 110 H30 Z" fill="var(--surface2)" stroke="var(--muted)" stroke-width="2"/>
            <path d="M200 100 H300 L290 110 H210 Z" fill="var(--surface2)" stroke="var(--muted)" stroke-width="2"/>
            <g transform="translate(24,100)">${blocks(L)}</g><g transform="translate(204,100)">${blocks(R)}</g>
          </g>
          <path d="M160 60 L140 140 H180 Z" fill="var(--surface2)" stroke="var(--muted)" stroke-width="2"/><circle cx="160" cy="60" r="6" fill="var(--accent)"/>
        </svg>
        <div class="big-expr" style="font-size:2.2rem">${side(L)} = ${side(R)}</div>
        <div class="card" style="padding:12px">
          <div class="seg" role="group" aria-label="Operación">${['+', '−', '×', '÷'].map((o) => `<button data-op="${o}" aria-pressed="${o === op}">${o}</button>`).join('')}</div>
          <div class="row" style="justify-content:center;margin:12px 0">
            <button class="btn ghost round" data-n="-1" aria-label="Menos">−</button>
            <div class="stepper"><span class="val" aria-live="polite">${useX ? (num === 1 ? 'x' : num + 'x') : num}</span></div>
            <button class="btn ghost round" data-n="1" aria-label="Más">+</button>
            <button class="inv-toggle" data-x aria-pressed="${useX}" ${op === '×' || op === '÷' ? 'disabled' : ''}>usar x</button>
          </div>
          <div class="row"><button class="btn ghost sm" data-reset>↺ Reiniciar</button><button class="btn grow" data-apply>Aplicar a ambos lados</button></div>
          <p class="muted center" style="margin:8px 0 0;font-size:.85rem">Pasos: ${steps}</p>
        </div>`;
      $$('[data-op]', ctx.stage).forEach((bt) => bt.onclick = () => { op = bt.dataset.op; if (op === '×' || op === '÷') useX = false; Sfx.play('tap'); draw(); });
      $$('[data-n]', ctx.stage).forEach((bt) => bt.onclick = () => { num = clamp(num + +bt.dataset.n, 1, 12); Sfx.play('tap'); draw(); });
      $('[data-x]', ctx.stage).onclick = () => { useX = !useX; draw(); };
      $('[data-reset]', ctx.stage).onclick = () => { L = { ...start.L }; R = { ...start.R }; steps = 0; draw(); };
      $('[data-apply]', ctx.stage).onclick = apply;
    };
    const apply = () => {
      const f = (s) => {
        if (op === '+') useX ? (s.x += num) : (s.k += num);
        if (op === '−') useX ? (s.x -= num) : (s.k -= num);
        if (op === '×') { s.x *= num; s.k *= num; }
        if (op === '÷') { s.x /= num; s.k /= num; }
      };
      if (op === '÷' && [L.x, L.k, R.x, R.k].some((v) => v % num !== 0)) { buzz(40); ctx.say('Eso daría fracciones. Primero quita las constantes o las x de un lado.', 'think'); draw(true); return; }
      f(L); f(R); steps++; Sfx.play('whoosh'); buzz(10);
      if (steps > opt + 6) { ctx.answer(false, `x = ${x}. Camino corto: ${hint()}`); return; }
      draw(true);
      if (solved()) setTimeout(() => ctx.answer(steps <= opt + 1, steps <= opt + 1 ? `x = ${x} en ${steps} paso${steps > 1 ? 's' : ''}. ¡Eficiente!` : `x = ${x}, pero se puede en ${opt} pasos: ${hint()}`), 350);
    };
    const hint = () => {
      const h = []; if (c) h.push(`−${c}x`); if (b) h.push(b > 0 ? `−${b}` : `+${-b}`); if (Math.abs(a - c) !== 1) h.push(`÷${a - c}`);
      return h.join(', luego ') + ' en ambos lados';
    };
    draw();
  },
});

/* ---------- 3. Pizza de Fracciones ---------- */
registerGame({
  id: 'fracciones', subj: 'mate', name: 'Pizzería Fraccionaria', icon: '🍕', rounds: 6,
  desc: 'Colorea porciones para formar fracciones, porcentajes y decimales.',
  round(ctx) {
    const d = ctx.diff; let num, den, n, label, exp;
    if (d === 1) { den = rnd(2, 6); num = rnd(1, den - 1); n = den; label = `${num}/${den}`; }
    else if (d === 2) { den = rnd(2, 4); num = rnd(1, den - 1); n = den * rnd(2, 3); label = `${num}/${den}`; }
    else if (d === 3) { [num, den, n] = pick([[1, 4, 8], [1, 2, 10], [3, 4, 8], [1, 5, 10], [2, 5, 10], [3, 5, 10], [1, 10, 10], [7, 10, 10], [3, 4, 12]]); label = `${num * 100 / den}%`; }
    else if (d === 4) { [num, den, n] = pick([[1, 2, 8], [1, 4, 8], [3, 8, 8], [1, 5, 10], [3, 5, 10], [5, 8, 8], [3, 4, 12], [9, 10, 10]]); label = fmt(num / den, 3); }
    else { const q = pick([[[1, 2], [1, 4], 8], [[1, 3], [1, 6], 6], [[1, 4], [3, 8], 8], [[2, 3], [1, 6], 12], [[1, 2], [1, 3], 6], [[3, 4], [1, 8], 8]]); const [[a1, b1], [a2, b2], nn] = q; num = a1 * b2 + a2 * b1; den = b1 * b2; const g = gcd(num, den); num /= g; den /= g; n = nn; label = `${a1}/${b1} + ${a2}/${b2}`; }
    const need = num * n / den; exp = `${label} = ${need}/${n} → colorea ${need} de ${n} porciones.`;
    const sel = new Set(); const R = 90;
    const wedge = (i) => { const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2; const big = a1 - a0 > Math.PI ? 1 : 0; return `M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 ${big} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`; };
    ctx.stage.innerHTML = `<div class="prompt">Colorea <span style="color:var(--accent)">${label}</span> de la pizza<small>Toca las porciones</small></div>
      <svg class="viz" viewBox="-110 -110 220 220" style="max-width:340px;margin:0 auto" role="group" aria-label="Pizza de ${n} porciones">
        <circle r="100" fill="#e9b66a"/>
        ${Array.from({ length: n }, (_, i) => `<path class="pizza-slice" data-i="${i}" d="${wedge(i)}" fill="#ffe2a8" role="button" tabindex="0" aria-label="Porción ${i + 1}"/>`).join('')}
      </svg>
      <div class="readout"><span id="fr-count">0/${n}</span></div>
      <button class="btn block" id="fr-check">Comprobar</button>`;
    const upd = () => { $('#fr-count', ctx.stage).textContent = `${sel.size}/${n}`; };
    $$('.pizza-slice', ctx.stage).forEach((p) => {
      const t = () => { const i = +p.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); p.setAttribute('fill', sel.has(i) ? '#ff6b4a' : '#ffe2a8'); Sfx.play('tap'); buzz(8); upd(); };
      p.addEventListener('click', t); p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
    });
    $('#fr-check', ctx.stage).onclick = () => ctx.answer(sel.size === need, exp);
  },
});
function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }

/* ---------- graficador común ---------- */
function plotSVG(inner, extra = '') {
  let grid = '';
  for (let i = -6; i <= 6; i++) grid += `<line x1="${i}" y1="-6.5" x2="${i}" y2="6.5" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/><line x1="-6.5" y1="${i}" x2="6.5" y2="${i}" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/>`;
  return `<svg class="viz" viewBox="-6.5 -6.5 13 13" style="max-width:420px;margin:0 auto" ${extra}>
    <g transform="scale(1,-1)">${grid}<line x1="-6.5" y1="0" x2="6.5" y2="0" stroke="var(--muted)" stroke-width=".06"/><line x1="0" y1="-6.5" x2="0" y2="6.5" stroke="var(--muted)" stroke-width=".06"/>${inner}</g></svg>`;
}
function pathOf(fn, x0 = -6.5, x1 = 6.5) {
  let d = '', pen = false;
  for (let x = x0; x <= x1 + 1e-9; x += .05) { const y = fn(x); if (!Number.isFinite(y) || Math.abs(y) > 9) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(3)} `; pen = true; }
  return d;
}

/* ---------- 4. Cazador de Funciones ---------- */
registerGame({
  id: 'graficador', subj: 'mate', name: 'Cazador de Funciones', icon: '📈', rounds: 5,
  desc: 'Mueve los parámetros hasta que tu gráfica atrape la objetivo.',
  round(ctx) {
    const d = ctx.diff; const para = d >= 4; const formulaOnly = d === 3 || d === 5;
    let T, P, defs;
    if (!para) {
      T = { m: d === 1 ? rnd(-2, 2) : d === 2 ? rnd(-3, 3) : pick([-2.5, -1.5, -.5, .5, 1.5, 2.5, -2, 2, 3]), b: rnd(-4, 4) };
      P = { m: d === 1 ? T.m : 0, b: 0 };
      defs = [['m', 'pendiente m', -4, 4, .5], ['b', 'corte b', -5, 5, 1]];
    } else {
      T = { a: pick([-2, -1, -.5, .5, 1, 2]), h: rnd(-3, 3), k: rnd(-4, 4) }; P = { a: 1, h: 0, k: 0 };
      defs = [['a', 'apertura a', -2, 2, .5], ['h', 'desplaz. h', -4, 4, 1], ['k', 'altura k', -5, 5, 1]];
    }
    const f = (p) => (para ? (x) => p.a * (x - p.h) ** 2 + p.k : (x) => p.m * x + p.b);
    const eq = (p) => para ? `y = ${fmt(p.a)}(x ${p.h < 0 ? '+ ' + -p.h : '− ' + p.h})² ${p.k < 0 ? '− ' + -p.k : '+ ' + p.k}` : `y = ${fmt(p.m)}x ${p.b < 0 ? '− ' + -p.b : '+ ' + p.b}`;
    ctx.stage.innerHTML = `<div class="prompt">${formulaOnly ? `Dibuja <span style="color:var(--accent)">${eq(T)}</span>` : 'Atrapa la gráfica punteada'}<small>${d === 1 ? 'Solo mueve el corte b' : 'Ajusta los deslizadores'}</small></div>
      <div id="gf-plot"></div><div class="readout"><span id="gf-eq"></span></div>
      <div class="controls">${defs.filter((x) => !(d === 1 && x[0] === 'm')).map(([k, l, a, b, s]) => slider('gf-' + k, l, a, b, s, P[k])).join('')}</div>
      <button class="btn block" id="gf-check" style="margin-top:14px">Comprobar</button>`;
    const draw = () => {
      $('#gf-plot', ctx.stage).innerHTML = plotSVG(`${formulaOnly ? '' : `<path d="${pathOf(f(T))}" fill="none" stroke="var(--muted)" stroke-width=".14" stroke-dasharray=".35 .25"/>`}<path d="${pathOf(f(P))}" fill="none" stroke="var(--accent)" stroke-width=".16" stroke-linecap="round"/>`, 'role="img" aria-label="Plano cartesiano"');
      $('#gf-eq', ctx.stage).textContent = eq(P);
    };
    defs.forEach(([k]) => { const inp = $('#gf-' + k, ctx.stage); if (!inp) return; inp.oninput = () => { let v = +inp.value; if (para && k === 'a' && v === 0) v = .5; P[k] = v; $('#gf-' + k + '-o', ctx.stage).textContent = fmt(v); draw(); }; });
    draw();
    $('#gf-check', ctx.stage).onclick = () => {
      const ok = Object.keys(T).every((k) => Math.abs(T[k] - P[k]) < 1e-9);
      ctx.answer(ok, para ? `Era ${eq(T)}. h mueve la parábola a los lados, k arriba/abajo y a la abre o voltea.` : `Era ${eq(T)}. m = cuánto sube por cada paso a la derecha; b = dónde corta el eje y.`);
    };
  },
});

/* ---------- 5. Círculo Unitario ---------- */
registerGame({
  id: 'circulo', subj: 'mate', name: 'Radar Trigonométrico', icon: '🎯', rounds: 6,
  desc: 'Arrastra el punto por el círculo unitario y domina seno y coseno.',
  round(ctx) {
    const d = ctx.diff; const snap = d <= 1 ? 45 : d === 2 ? 30 : 15; let target, label, exp;
    const nice = { 0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1' };
    const sinTxt = (t) => { const r = ((t % 360) + 360) % 360; const ref = r <= 90 ? r : r <= 180 ? 180 - r : r <= 270 ? r - 180 : 360 - r; const v = nice[ref]; const neg = r > 180 && r < 360; return v === '0' ? '0' : (neg ? '−' : '') + v; };
    const cosTxt = (t) => sinTxt(t + 90);
    const radTxt = (a) => { if (!a) return '0'; const g = gcd(a, 180), n = a / g, q = 180 / g; return `${n === 1 ? '' : n}π${q === 1 ? '' : '/' + q}`; };
    const RAD_T = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
    if (d <= 2) { target = rnd(1, 360 / snap - 1) * snap; label = `Lleva el punto a θ = ${target}°`; }
    else if (d === 3) { target = pick([30, 60, 120, 150, 210, 240, 300, 330, 135, 225, 315, 45]); const useSin = Math.random() < .5; label = useSin ? `Encuentra θ con sin θ = ${sinTxt(target)} y cos θ ${Math.cos(target * Math.PI / 180) > 0 ? '> 0' : '< 0'}` : `Encuentra θ con cos θ = ${cosTxt(target)} y sin θ ${Math.sin(target * Math.PI / 180) > 0 ? '> 0' : '< 0'}`; }
    else if (d === 4) { target = pick(RAD_T); label = `Lleva el punto a θ = ${radTxt(target)} rad`; }
    else { target = pick([30, 60, 120, 150, 210, 240, 300, 330, 135, 225, 315, 45]); label = `Sin ayudas: sin θ = ${sinTxt(target)}, cos θ = ${cosTxt(target)}`; }
    exp = `θ = ${target}° (${radTxt(target)} rad): sin = ${sinTxt(target)}, cos = ${cosTxt(target)}.`;
    let ang = 0; const hide = d === 5;
    ctx.stage.innerHTML = `<div class="prompt">${label}<small>Arrastra el punto amarillo</small></div>
      <svg class="viz" id="cu" viewBox="-135 -135 270 270" style="max-width:380px;margin:0 auto" role="slider" aria-label="Ángulo" aria-valuemin="0" aria-valuemax="360" tabindex="0"></svg>
      <div class="readout" id="cu-r"></div><button class="btn block" id="cu-check">Comprobar</button>`;
    const svg = $('#cu', ctx.stage);
    const draw = () => {
      const r = ang * Math.PI / 180, x = 100 * Math.cos(r), y = -100 * Math.sin(r);
      let ticks = ''; for (let a = 0; a < 360; a += snap) { const q = a * Math.PI / 180; ticks += `<line x1="${94 * Math.cos(q)}" y1="${-94 * Math.sin(q)}" x2="${106 * Math.cos(q)}" y2="${-106 * Math.sin(q)}" stroke="var(--muted)" stroke-width="2"/>`; }
      const big = ang > 180 ? 1 : 0;
      svg.innerHTML = `<line x1="-125" y1="0" x2="125" y2="0" stroke="var(--line)" stroke-width="2"/><line x1="0" y1="-125" x2="0" y2="125" stroke="var(--line)" stroke-width="2"/>
        <circle r="100" fill="none" stroke="var(--muted)" stroke-width="2.5"/>${ticks}
        ${ang ? `<path d="M30 0 A30 30 0 ${big} 0 ${30 * Math.cos(r)} ${-30 * Math.sin(r)}" fill="none" stroke="var(--accent)" stroke-width="3"/>` : ''}
        ${hide ? '' : `<line x1="${x}" y1="0" x2="${x}" y2="${y}" stroke="#ef4444" stroke-width="3" stroke-dasharray="5 4"/><line x1="0" y1="0" x2="${x}" y2="0" stroke="#2f7df6" stroke-width="5"/>`}
        <line x1="0" y1="0" x2="${x}" y2="${y}" stroke="var(--ink)" stroke-width="3"/>
        <circle cx="${x}" cy="${y}" r="13" fill="#ffc53d" stroke="#c99400" stroke-width="3" style="cursor:grab"/>`;
      $('#cu-r', ctx.stage).innerHTML = `<span>θ = ${d === 4 ? radTxt(ang) + ' rad' : ang + '°'}</span>${hide ? '' : `<span style="color:#2f7df6">cos = ${fmt(Math.cos(r))}</span><span style="color:#ef4444">sin = ${fmt(Math.sin(r))}</span>`}`;
      svg.setAttribute('aria-valuenow', ang);
    };
    const set = (e) => { const p = svgPoint(svg, e); let a = Math.atan2(-p.y, p.x) * 180 / Math.PI; if (a < 0) a += 360; const na = (Math.round(a / snap) * snap) % 360; if (na !== ang) { ang = na; Sfx.play('tap'); buzz(5); draw(); } };
    let drag = false;
    svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); set(e); });
    svg.addEventListener('pointermove', (e) => drag && set(e));
    svg.addEventListener('pointerup', () => (drag = false));
    svg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') ang = (ang + snap) % 360; else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') ang = (ang - snap + 360) % 360; else return; e.preventDefault(); draw(); });
    draw();
    $('#cu-check', ctx.stage).onclick = () => ctx.answer(ang === target % 360, exp);
  },
});

/* ---------- 6. Notación científica ---------- */
registerGame({
  id: 'potencias', subj: 'mate', name: 'La Coma Viajera', icon: '🔬', rounds: 6,
  desc: 'Notación científica, prefijos SI y potencias de 10.',
  round(ctx) {
    const d = ctx.diff;
    if (d >= 4) {
      let q, ans, opts, exp;
      if (d === 4) {
        const P = [['k', 3], ['m', -3], ['M', 6], ['µ', -6], ['c', -2]]; const [p, e] = pick(P); const unit = pick(['m', 'A', 'V', 'g', 'W']);
        const base = pick([4.5, 2.2, 7, 1.5, 3.3, 9.1]); const val = base * 10 ** e; // en unidad base
        q = `${fmt(val, 9)} ${unit} = ? ${p}${unit}`; ans = base; opts = uniqueOptions(ans, () => round(base * 10 ** pick([-2, -1, 1, 2]), 6)); exp = `${p} = 10^${e}. Divide entre 10^${e}: ${fmt(val, 9)} ${unit} = ${fmt(base)} ${p}${unit}.`;
      } else {
        const a = rnd(2, 4), b = rnd(2, 3), m = rnd(2, 6), n = rnd(-4, 6); q = `(${a}×10^${m}) · (${b}×10^${n}) = ?`; ans = `${a * b}×10^${m + n}`; opts = shuffle([ans, `${a * b}×10^${m * n}`, `${a + b}×10^${m + n}`, `${a * b}×10^${m - n}`].filter((v, i, s) => s.indexOf(v) === i)); exp = `Multiplica mantisas (${a}·${b} = ${a * b}) y suma exponentes (${m} + ${n} = ${m + n}).`;
      }
      ctx.stage.innerHTML = `<div class="prompt">¿Cuánto es?</div><div class="big-expr" style="font-size:clamp(1.6rem,7vw,2.4rem)">${q.replace(/\^(-?\d+)/g, '<sup>$1</sup>')}</div>`;
      choiceButtons(ctx, ctx.stage, opts, ans, exp.replace(/\^(-?\d+)/g, '<sup>$1</sup>'), (v) => typeof v === 'number' ? fmt(v, 6) : v.replace(/\^(-?\d+)/g, '<sup>$1</sup>'));
      return;
    }
    const items = d === 1 ? [['45000', 'Población de una ciudad pequeña'], ['3200', 'Metros de una pista'], ['780000', 'Bytes de una foto'], ['12000', 'RPM de un motor DC']]
      : d === 2 ? [['0.0045', 'Amperios de un sensor'], ['0.00072', 'Metros: grosor de un cable'], ['0.032', 'Segundos de un pulso'], ['0.0000068', 'Faradios de un capacitor']]
        : [['150000000', 'km de la Tierra al Sol'], ['0.000000001', 'Segundos en un nanosegundo'], ['300000000', 'm/s velocidad de la luz'], ['0.00000016', 'Coulombs de carga'], ['6371000', 'm radio de la Tierra']];
    const [str, ctxt] = pick(items);
    // representación: str = s × 10^q (s entero sin ceros finales)
    let s, q;
    if (str.includes('.')) { const dec = str.split('.')[1]; s = String(parseInt(dec, 10)); q = -dec.length; }
    else { s = str.replace(/0+$/, ''); q = str.length - s.length; }
    const goal = q + s.length - 1; let e = 0;
    const mant = () => { const t = q - e; let out; if (t >= 0) out = s + '0'.repeat(t); else { const pad = s.padStart(-t + 1, '0'); out = pad.slice(0, pad.length + t) + ',' + pad.slice(pad.length + t); } return out.replace(/\B(?=(\d{3})+(?!\d))/g, (m, i) => out.indexOf(',') === -1 || i < out.indexOf(',') ? ' ' : ''); };
    ctx.stage.innerHTML = `<div class="prompt">${ctxt}<small>Mueve la coma hasta tener notación científica (1 ≤ número &lt; 10)</small></div>
      <div class="big-expr" id="nc" style="font-size:clamp(1.6rem,7.5vw,2.8rem)"></div>
      <div class="stepper"><button class="btn round" id="nc-l" aria-label="Coma a la izquierda">◀</button><span class="muted" style="font-weight:800">coma</span><button class="btn round" id="nc-r" aria-label="Coma a la derecha">▶</button></div>
      <button class="btn block" id="nc-check" style="margin-top:16px">Comprobar</button>`;
    const draw = () => { $('#nc', ctx.stage).innerHTML = `${mant()} <span style="color:var(--accent)">× 10<sup>${e}</sup></span>`; };
    $('#nc-l', ctx.stage).onclick = () => { if (e < 12) { e++; Sfx.play('tap'); draw(); } };
    $('#nc-r', ctx.stage).onclick = () => { if (e > -12) { e--; Sfx.play('tap'); draw(); } };
    draw();
    $('#nc-check', ctx.stage).onclick = () => { const final = e; e = goal; const sol = mant(); ctx.answer(final === goal, `${str.replace('.', ',')} = ${sol} × 10<sup>${goal}</sup>. Cada paso de la coma a la izquierda suma 1 al exponente.`); };
  },
});

/* ---------- 7. Pendiente Secreta (derivadas) ---------- */
registerGame({
  id: 'derivada', subj: 'mate', name: 'Tangente Secreta', icon: '📐', rounds: 5,
  desc: 'Gira la recta tangente: la derivada es su pendiente.',
  round(ctx) {
    const d = ctx.diff;
    const F = d === 1 ? [['2x + 1', (x) => 2 * x + 1, () => 2], ['−x + 3', (x) => -x + 3, () => -1], ['3x − 2', (x) => 3 * x - 2, () => 3]]
      : d === 2 ? [['x²', (x) => x * x, (x) => 2 * x]]
        : d === 3 ? [['x² − 2x', (x) => x * x - 2 * x, (x) => 2 * x - 2], ['½x²', (x) => x * x / 2, (x) => x], ['−x² + 3', (x) => -x * x + 3, (x) => -2 * x]]
          : d === 4 ? [['x³/3', (x) => x ** 3 / 3, (x) => x * x], ['x³ − 3x', (x) => x ** 3 - 3 * x, (x) => 3 * x * x - 3]]
            : [['sin x', Math.sin, Math.cos]];
    const [name, f, df] = pick(F);
    let x0 = d === 5 ? pick([0, Math.PI / 3, Math.PI / 2, Math.PI, -Math.PI / 3, 2 * Math.PI / 3]) : d === 4 ? rnd(-2, 2) : rnd(-2, 2);
    let target = round(df(x0), 2);
    if (Math.abs(target) > 6) { x0 = 1; target = round(df(1), 2); }
    const x0txt = d === 5 ? ({ 0: '0', [Math.PI / 3]: 'π/3', [Math.PI / 2]: 'π/2', [Math.PI]: 'π', [-Math.PI / 3]: '−π/3', [2 * Math.PI / 3]: '2π/3' })[x0] : fmt(x0);
    const y0 = f(x0); let m = 0;
    const rules = { 1: 'La pendiente de una recta es constante.', 2: 'd/dx x² = 2x.', 3: 'Regla de la potencia: d/dx xⁿ = n·xⁿ⁻¹.', 4: 'd/dx x³ = 3x².', 5: 'd/dx sin x = cos x.' };
    ctx.stage.innerHTML = `<div class="prompt">f(x) = ${name}<small>Gira la recta para que sea tangente en x = ${x0txt}</small></div>
      <div id="dv-plot"></div><div class="readout"><span>pendiente m = <b id="dv-m">0</b></span></div>
      <div class="controls">${slider('dv-s', 'm', -6, 6, .5, 0)}</div>
      <button class="btn block" id="dv-check" style="margin-top:14px">Comprobar</button>`;
        const draw = () => {
      $('#dv-plot', ctx.stage).innerHTML = plotSVG(`<g><path d="${pathOf(f)}" fill="none" stroke="var(--accent)" stroke-width=".16"/>
        <path d="${pathOf((x) => y0 + m * (x - x0))}" fill="none" stroke="#ff7a2f" stroke-width=".12"/><circle cx="${x0}" cy="${y0}" r=".22" fill="#ffc53d" stroke="#c99400" stroke-width=".06"/></g>`, 'role="img" aria-label="Función y recta tangente"');
      $('#dv-m', ctx.stage).textContent = fmt(m);
    };
    $('#dv-s', ctx.stage).oninput = (e) => { m = +e.target.value; $('#dv-s-o', ctx.stage).textContent = fmt(m); draw(); };
    draw();
    $('#dv-check', ctx.stage).onclick = () => ctx.answer(Math.abs(m - target) < .26, `f'(${x0txt}) = ${fmt(target)}. ${rules[d]}`);
  },
});
