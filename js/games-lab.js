/* ============ AXIÓN · laboratorio: física, electrónica, programación, mecánica ============ */
'use strict';

/* ---------- Física: Cañón Parabólico ---------- */
registerGame({
  id: 'proyectil', subj: 'fisica', name: 'Cañón Parabólico', icon: '🎯', rounds: 4,
  desc: 'Ajusta ángulo y velocidad para acertar al blanco.',
  round(ctx) {
    const d = ctx.diff, g = 9.8, W = 120; const shots = d >= 4 ? 2 : 3;
    const D = rnd(25, 105), tol = d === 1 ? 5 : d <= 3 ? 3.5 : 2.5;
    const wall = d >= 3 ? { x: Math.round(D * (.4 + Math.random() * .2)), h: rnd(8, d >= 5 ? 22 : 15) } : null;
    let ang = 45, v = 25, left = shots, busy = false;
    ctx.stage.innerHTML = `<div class="prompt">¡Acierta al blanco a ${D} m!<small>${wall ? `Cuidado con el muro de ${wall.h} m · ` : ''}Disparos: <b id="pj-left">${left}</b></small></div>
      <svg class="viz" id="pj" viewBox="0 -62 ${W + 4} 66" role="img" aria-label="Campo de tiro"></svg>
      <div class="controls">${slider('pj-a', 'ángulo', 10, 80, 1, ang, '°')}${slider('pj-v', 'velocidad', 10, 35, 1, v, ' m/s')}</div>
      <button class="btn block" id="pj-fire" style="margin-top:14px">🔥 ¡Fuego!</button>`;
    const svg = $('#pj', ctx.stage); let trail = '';
    const scene = (ball) => {
      const r = ang * Math.PI / 180;
      svg.innerHTML = `<rect x="0" y="0" width="${W + 4}" height="4" fill="#5cb85c"/>
        ${wall ? `<rect x="${wall.x - 1}" y="${-wall.h}" width="2.5" height="${wall.h}" fill="#a0522d" rx=".5"/>` : ''}
        <g transform="translate(${D},0)"><rect x="${-tol}" y="-1.2" width="${tol * 2}" height="1.2" fill="#ef4444"/><rect x="${-tol / 2}" y="-1.2" width="${tol}" height="1.2" fill="#fff"/><line x1="0" y1="-1" x2="0" y2="-9" stroke="var(--ink)" stroke-width=".4"/><path d="M0 -9 L5 -7.5 L0 -6 Z" fill="#ef4444"/></g>
        <path d="${trail}" fill="none" stroke="var(--accent)" stroke-width=".5" stroke-dasharray="1 .8"/>
        <g transform="translate(3,-1)"><line x1="0" y1="0" x2="${7 * Math.cos(r)}" y2="${-7 * Math.sin(r)}" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/><circle r="2.6" fill="var(--muted)"/></g>
        ${ball ? `<circle cx="${ball[0]}" cy="${ball[1]}" r="1.3" fill="#ffc53d" stroke="#000" stroke-width=".2"/>` : ''}`;
    };
    const bind = (id, set, unit) => { const i = $('#' + id, ctx.stage); i.oninput = () => { set(+i.value); $('#' + id + '-o', ctx.stage).textContent = i.value + unit; if (!busy) scene(); }; };
    bind('pj-a', (x) => (ang = x), '°'); bind('pj-v', (x) => (v = x), ' m/s');
    scene();
    $('#pj-fire', ctx.stage).onclick = () => {
      if (busy || left <= 0) return; busy = true; left--; $('#pj-left', ctx.stage).textContent = left; Sfx.play('boom'); buzz(30);
      const r = ang * Math.PI / 180, vx = v * Math.cos(r), vy = v * Math.sin(r); let t = 0; trail = 'M3 -1'; let hitWall = false;
      const step = () => {
        t += .06; const x = 3 + vx * t, y = 1 - (vy * t - g * t * t / 2);
        if (wall && Math.abs(x - wall.x) < 1.4 && -y < wall.h) hitWall = true;
        trail += ` L${x.toFixed(2)} ${(-Math.max(0, -y)).toFixed(2)}`;
        if (y >= 0 || x > W + 10 || hitWall) {
          const land = x - 3; const ok = !hitWall && Math.abs(land - D) <= tol;
          scene([x, Math.min(0, y)]); busy = false; const R = v * v * Math.sin(2 * r) / g;
          const exp = `Alcance = v²·sin(2θ)/g = ${v}²·sin(${2 * ang}°)/9,8 ≈ ${fmt(R, 1)} m.`;
          if (ok) { Confetti.burst(60); ctx.answer(true, exp); }
          else if (left <= 0) ctx.answer(false, `${hitWall ? '¡Chocó con el muro! ' : ''}${exp} Necesitabas ${D} m.`);
          else { ctx.say(hitWall ? '¡Al muro! Sube el ángulo.' : land < D ? `Te quedaste corto: ${fmt(land, 1)} m` : `Te pasaste: ${fmt(land, 1)} m`, 'think'); }
          return;
        }
        scene([x, y]); ctx.raf(step);
      };
      step();
    };
  },
});

/* ---------- Física: Suma de Vectores ---------- */
registerGame({
  id: 'vectores', subj: 'fisica', name: 'Fuerzas en Equilibrio', icon: '🧲', rounds: 5,
  desc: 'Arrastra la punta del vector para sumar fuerzas.',
  round(ctx) {
    const d = ctx.diff; let A = null, C = null, label, check, exp;
    const r6 = () => { let v; do v = [rnd(-4, 4), rnd(-4, 4)]; while (!v[0] && !v[1]); return v; };
    if (d === 1) { const T = r6(); label = `Dibuja el vector (${T[0]}, ${T[1]})`; check = (B) => B[0] === T[0] && B[1] === T[1]; exp = `x = ${T[0]} (horizontal), y = ${T[1]} (vertical).`; }
    else if (d === 2) { A = r6(); let R; do R = r6(); while (Math.abs(R[0] - A[0]) > 5 || Math.abs(R[1] - A[1]) > 5 || (R[0] === A[0] && R[1] === A[1])); label = 'Haz que A + B llegue a la meta ⭐'; check = (B) => A[0] + B[0] === R[0] && A[1] + B[1] === R[1]; exp = `B = R − A = (${R[0] - A[0]}, ${R[1] - A[1]}).`; C = R; }
    else if (d === 3) { const T = pick([[3, 4], [4, 3], [-3, 4], [4, -3], [-4, -3], [0, 5], [5, 0], [-3, -4]]); label = `Dibuja un vector de magnitud 5 en el cuadrante ${T[0] > 0 && T[1] > 0 ? 'I' : T[0] < 0 && T[1] > 0 ? 'II' : T[0] < 0 && T[1] < 0 ? 'III' : 'IV'}`; if (!T[0] || !T[1]) label = `Dibuja un vector de magnitud 5 sobre el eje ${T[0] ? (T[0] > 0 ? '+x' : '−x') : (T[1] > 0 ? '+y' : '−y')}`; check = (B) => B[0] * B[0] + B[1] * B[1] === 25 && Math.sign(B[0]) === Math.sign(T[0]) && Math.sign(B[1]) === Math.sign(T[1]); exp = `|B| = √(x² + y²). Ej.: (${T[0]}, ${T[1]}) → √(${T[0] ** 2} + ${T[1] ** 2}) = 5.`; }
    else { A = r6(); C = r6(); while (Math.abs(A[0] + C[0]) > 5 || Math.abs(A[1] + C[1]) > 5 || (!(A[0] + C[0]) && !(A[1] + C[1]))) C = r6(); label = 'Equilibrio: haz que F₁ + F₂ + F₃ = 0'; check = (B) => A[0] + C[0] + B[0] === 0 && A[1] + C[1] + B[1] === 0; exp = `F₃ = −(F₁ + F₂) = (${-(A[0] + C[0])}, ${-(A[1] + C[1])}). En equilibrio la suma de fuerzas es cero (1ª ley de Newton).`; }
    const eq = d >= 4; const origin = d === 2 ? A : [0, 0]; let B = [1, 1];
    ctx.stage.innerHTML = `<div class="prompt">${label}<small>Arrastra el punto amarillo</small></div><svg class="viz" id="vc" viewBox="-6.5 -6.5 13 13" style="max-width:420px;margin:0 auto" role="img" aria-label="Plano de vectores"></svg>
      <div class="readout" id="vc-r"></div><button class="btn block" id="vc-check">Comprobar</button>`;
    const svg = $('#vc', ctx.stage);
    const arrow = (x0, y0, x1, y1, col, w = .14) => { const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0); if (L < .01) return ''; const h = Math.min(.5, L / 2); return `<line x1="${x0}" y1="${-y0}" x2="${x1 - Math.cos(a) * h * .6}" y2="${-(y1 - Math.sin(a) * h * .6)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x1} ${-y1} L${x1 - h * Math.cos(a - .45)} ${-(y1 - h * Math.sin(a - .45))} L${x1 - h * Math.cos(a + .45)} ${-(y1 - h * Math.sin(a + .45))} Z" fill="${col}"/>`; };
    const draw = () => {
      let g = ''; for (let i = -6; i <= 6; i++) g += `<line x1="${i}" y1="-6.5" x2="${i}" y2="6.5" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/><line x1="-6.5" y1="${i}" x2="6.5" y2="${i}" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/>`;
      let s = g;
      if (d === 2) { s += arrow(0, 0, A[0], A[1], '#2f7df6'); s += `<text x="${A[0] / 2 + .3}" y="${-A[1] / 2}" font-size=".7" fill="#2f7df6" font-weight="800">A</text>`; s += `<text x="${C[0] - .45}" y="${-C[1] + .35}" font-size="1">⭐</text>`; s += arrow(0, 0, A[0] + B[0], A[1] + B[1], 'var(--muted)', .08); }
      if (eq) { s += arrow(0, 0, A[0], A[1], '#2f7df6'); s += arrow(0, 0, C[0], C[1], '#10a37a'); s += `<text x="${A[0] + .2}" y="${-A[1]}" font-size=".6" fill="#2f7df6" font-weight="800">F₁</text><text x="${C[0] + .2}" y="${-C[1]}" font-size=".6" fill="#10a37a" font-weight="800">F₂</text><rect x="-.5" y="-.5" width="1" height="1" rx=".2" fill="var(--muted)"/>`; }
      s += arrow(origin[0], origin[1], origin[0] + B[0], origin[1] + B[1], '#ff7a2f', .18);
      s += `<circle cx="${origin[0] + B[0]}" cy="${-(origin[1] + B[1])}" r=".42" fill="#ffc53d" stroke="#c99400" stroke-width=".08" style="cursor:grab"/>`;
      svg.innerHTML = s;
      const sum = eq ? [A[0] + C[0] + B[0], A[1] + C[1] + B[1]] : d === 2 ? [A[0] + B[0], A[1] + B[1]] : null;
      $('#vc-r', ctx.stage).innerHTML = `<span style="color:#ff7a2f">${eq ? 'F₃' : 'B'} = (${B[0]}, ${B[1]})</span><span>|${eq ? 'F₃' : 'B'}| = ${fmt(Math.hypot(...B))}</span>${sum ? `<span>${eq ? 'ΣF' : 'A+B'} = (${sum[0]}, ${sum[1]})</span>` : ''}`;
    };
    let drag = false;
    const set = (e) => { const p = svgPoint(svg, e); const nb = [clamp(Math.round(p.x - origin[0]), -6 - origin[0], 6 - origin[0]), clamp(Math.round(-p.y - origin[1]), -6 - origin[1], 6 - origin[1])]; if (nb[0] !== B[0] || nb[1] !== B[1]) { B = nb; Sfx.play('tap'); buzz(5); draw(); } };
    svg.addEventListener('pointerdown', (e) => { drag = true; svg.setPointerCapture(e.pointerId); set(e); });
    svg.addEventListener('pointermove', (e) => drag && set(e)); svg.addEventListener('pointerup', () => (drag = false));
    draw();
    $('#vc-check', ctx.stage).onclick = () => ctx.answer(check(B), exp);
  },
});

/* ---------- Electrónica: Laboratorio de Ohm ---------- */
registerGame({
  id: 'ohm', subj: 'electro', name: 'Laboratorio de Ohm', icon: '💡', rounds: 5,
  desc: 'Arrastra la resistencia correcta. ¡No quemes el LED!',
  round(ctx) {
    const d = ctx.diff; let V, need, opts, label, exp, calcI, R1 = 0, led = d >= 2, kind = 'serie';
    if (d === 1) { [V, need] = pick([[12, 6], [9, 3], [12, 4], [6, 2], [10, 5], [24, 8]]); const I = V / need; label = `Batería de ${V} V. Necesitas exactamente ${fmt(I)} A.`; exp = `R = V / I = ${V} / ${fmt(I)} = ${need} Ω.`; calcI = (R) => V / R; opts = uniqueOptions(need, () => pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 20])); }
    else if (d === 2) { [V, need] = pick([[9, 350], [5, 150], [12, 500], [9, 700], [5, 300]]); const I = (V - 2) / need; label = `LED rojo (2 V, ${fmt(I * 1000, 1)} mA) con batería de ${V} V.`; exp = `R = (V − V_LED) / I = (${V} − 2) / ${fmt(I, 4)} = ${need} Ω.`; calcI = (R) => (V - 2) / R; opts = uniqueOptions(need, () => pick([50, 100, 150, 220, 300, 350, 470, 500, 700, 1000])); }
    else if (d === 3) { V = pick([9, 12]); R1 = pick([100, 200]); const I = .02; need = (V - 2) / I - R1; label = `Ya hay una R₁ = ${R1} Ω en serie. LED: 2 V, 20 mA. Batería ${V} V.`; exp = `R_total = (${V} − 2) / 0,02 = ${(V - 2) / I} Ω → R₂ = ${(V - 2) / I} − ${R1} = ${need} Ω.`; calcI = (R) => (V - 2) / (R + R1); opts = uniqueOptions(need, () => pick([50, 100, 150, 250, 300, 350, 400, 450, 500, 600])); }
    else if (d === 4) { kind = 'paralelo'; led = false; V = 12; [R1, need] = pick([[6, 3], [12, 6], [12, 12], [4, 12], [10, 15]]); const Req = R1 * need / (R1 + need); label = `R₁ = ${R1} Ω en paralelo. Logra R_eq = ${fmt(Req)} Ω (I = ${fmt(V / Req)} A).`; exp = `1/R_eq = 1/R₁ + 1/R₂ → R₂ = ${need} Ω.`; calcI = (R) => V / (R1 * R / (R1 + R)); opts = uniqueOptions(need, () => pick([2, 3, 4, 6, 8, 12, 15, 20, 24])); }
    else { kind = 'divisor'; led = false; V = 12; [R1, need] = pick([[1000, 1000], [2000, 1000], [1000, 3000], [3000, 1000], [1000, 2000]]); const Vo = V * need / (R1 + need); label = `Divisor de voltaje: R₁ = ${R1} Ω. Logra V_out = ${fmt(Vo)} V.`; exp = `V_out = V · R₂/(R₁+R₂) → R₂ = ${need} Ω.`; calcI = (R) => V * R / (R1 + R); opts = uniqueOptions(need, () => pick([500, 1000, 1500, 2000, 3000, 4000, 6000])); }
    const target = calcI(need); let placed = null;
    ctx.stage.innerHTML = `<div class="prompt">${label}<small>Arrastra (o toca) una resistencia al hueco y cierra el circuito</small></div>
      <svg class="viz" id="oh" viewBox="0 0 300 170" style="max-width:460px;margin:0 auto" role="img" aria-label="Circuito"></svg>
      <div class="readout"><span id="oh-m">Medidor: —</span></div>
      <div class="chips" id="oh-tray">${opts.map((o) => `<button class="chip" data-r="${o}">${o >= 1000 ? fmt(o / 1000) + ' kΩ' : o + ' Ω'}</button>`).join('')}</div>
      <button class="btn block" id="oh-go" style="margin-top:14px" disabled>🔌 Cerrar circuito</button>`;
    const svg = $('#oh', ctx.stage);
    const rz = (x, y, lbl, val, slot) => `<g ${slot ? 'id="oh-slot"' : ''}><rect x="${x - 26}" y="${y - 13}" width="52" height="26" rx="6" fill="${val ? '#d9b382' : 'var(--surface2)'}" stroke="${val ? '#8a6a3a' : 'var(--accent)'}" stroke-width="2.5" ${val ? '' : 'stroke-dasharray="5 4"'}/>${val ? `<rect x="${x - 14}" y="${y - 13}" width="4" height="26" fill="#a0522d"/><rect x="${x - 4}" y="${y - 13}" width="4" height="26" fill="#111"/><rect x="${x + 6}" y="${y - 13}" width="4" height="26" fill="#d4a017"/>` : `<text x="${x}" y="${y + 4}" text-anchor="middle" class="svg-text" style="fill:var(--accent)">?</text>`}<text x="${x}" y="${y - 18}" text-anchor="middle" class="svg-text">${lbl}${val ? ' = ' + (val >= 1000 ? fmt(val / 1000) + 'k' : val) + 'Ω' : ''}</text></g>`;
    const draw = (I, state) => {
      const glow = led && state ? clamp(I / target, 0, 1.6) : 0; const blown = state === 'blown';
      const wire = `stroke="${state && !blown ? '#ffc53d' : 'var(--muted)'}" stroke-width="3" fill="none"`;
      let s = `<path d="M40 40 H260 V130 H40 Z" ${wire}/>`;
      s += `<g><rect x="25" y="65" width="30" height="40" fill="var(--surface)"/><line x1="28" y1="75" x2="52" y2="75" stroke="var(--ink)" stroke-width="4"/><line x1="33" y1="85" x2="47" y2="85" stroke="var(--ink)" stroke-width="4"/><line x1="28" y1="95" x2="52" y2="95" stroke="var(--ink)" stroke-width="4"/><text x="10" y="90" class="svg-text">${V}V</text></g>`;
      if (kind === 'paralelo') { s += `<path d="M110 40 V20 H190 V40" ${wire}/>` + `<rect x="110" y="32" width="80" height="16" fill="var(--surface)"/>` + rz(150, 20, 'R₁', R1) + `<path d="M110 40 V60 H190 V40" ${wire}/>` + `<rect x="118" y="34" width="64" height="12" fill="var(--surface)"/>` + rz(150, 60, 'R₂', placed, true); }
      else {
        if (R1) s += `<rect x="70" y="30" width="60" height="20" fill="var(--surface)"/>` + rz(100, 40, 'R₁', R1);
        s += `<rect x="150" y="30" width="60" height="20" fill="var(--surface)"/>` + rz(180, 40, kind === 'divisor' ? 'R₂' : 'R', placed, true);
      }
      if (led) {
        s += `<rect x="245" y="70" width="30" height="40" fill="var(--surface)"/>`;
        s += blown ? `<g><circle cx="260" cy="90" r="11" fill="#555"/><text x="260" y="78" text-anchor="middle" font-size="18">💥</text></g>` : `<circle cx="260" cy="90" r="22" fill="#ff3b3b" class="led-glow" opacity="${glow * .45}"/><path d="M250 100 V84 A10 10 0 0 1 270 84 V100 Z" fill="${glow ? '#ff4d4d' : '#9b3b3b'}" stroke="#7a1a1a" stroke-width="2"/><text x="285" y="94" class="svg-text">LED</text>`;
      } else if (kind === 'divisor') s += `<g><rect x="245" y="72" width="30" height="36" rx="5" fill="var(--surface2)" stroke="var(--muted)" stroke-width="2"/><text x="260" y="95" text-anchor="middle" class="svg-text">V</text></g>`;
      else s += `<g><circle cx="260" cy="90" r="16" fill="var(--surface2)" stroke="var(--muted)" stroke-width="2"/><text x="260" y="95" text-anchor="middle" class="svg-text">A</text></g>`;
      if (state && !blown && kind !== 'divisor') s += `<circle r="4" fill="#ffc53d"><animateMotion dur="1.5s" repeatCount="indefinite" path="M40 40 H260 V130 H40 Z"/></circle>`;
      svg.innerHTML = s;
    };
    draw(0, null);
    const place = (r) => { placed = r; $$('.chip', ctx.stage).forEach((c) => c.classList.toggle('sel', +c.dataset.r === r)); $('#oh-go', ctx.stage).disabled = false; Sfx.play('tap'); buzz(10); draw(0, null); };
    $$('.chip', ctx.stage).forEach((c) => makeDraggable(c, { zones: () => [$('#oh-slot', ctx.stage)].filter(Boolean), onDrop: () => place(+c.dataset.r), onTap: () => place(+c.dataset.r) }));
    $('#oh-go', ctx.stage).onclick = () => {
      const I = calcI(placed), ok = Math.abs(I - target) < 1e-9; const blown = led && I > target * 1.3;
      draw(I, blown ? 'blown' : 'on'); if (blown) { Sfx.play('boom'); buzz([40, 30, 80]); }
      $('#oh-m', ctx.stage).textContent = kind === 'divisor' ? `V_out = ${fmt(I)} V` : `I = ${I < 1 ? fmt(I * 1000, 1) + ' mA' : fmt(I) + ' A'}`;
      $$('.chip, #oh-go', ctx.stage).forEach((b) => (b.disabled = true));
      setTimeout(() => ctx.answer(ok, (blown ? '¡Demasiada corriente quemó el LED! ' : '') + exp), 700);
    };
  },
});

/* ---------- Electrónica: Compuertas lógicas ---------- */
const GATES = { AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b) };
registerGame({
  id: 'logica', subj: 'electro', name: 'Puertas Lógicas', icon: '🔌', rounds: 5,
  desc: 'Elige compuertas para que la tabla de verdad coincida.',
  round(ctx) {
    const d = ctx.diff; const two = d >= 3; const inv = d >= 5;
    const pool = d === 1 ? ['AND', 'OR'] : d === 2 ? ['AND', 'OR', 'XOR'] : Object.keys(GATES);
    const sol = { g1: pick(pool), g2: pick(pool), n: inv ? rnd(0, 1) === 1 : false };
    const cur = { g1: pool[0], g2: pool[0], n: false };
    const evalC = (c, A, B, C) => { const a = c.n ? 1 - A : A; const o1 = GATES[c.g1](a, B); return two ? GATES[c.g2](o1, C) : o1; };
    const rows = []; for (let i = 0; i < (two ? 8 : 4); i++) { const A = (i >> (two ? 2 : 1)) & 1, B = (i >> (two ? 1 : 0)) & 1, C = two ? i & 1 : 0; rows.push([A, B, C]); }
    const target = rows.map((r) => evalC(sol, ...r));
    if (target.every((v) => v === target[0]) && d > 1) { sol.g1 = 'XOR'; }
    const tgt = rows.map((r) => evalC(sol, ...r));
    const draw = () => {
      const out = rows.map((r) => evalC(cur, ...r)); const all = out.every((v, i) => v === tgt[i]);
      ctx.stage.innerHTML = `<div class="prompt">Haz que la salida Y coincida<small>Toca una compuerta para cambiarla</small></div>
        <div class="card" style="text-align:center">
          <div class="row" style="justify-content:center;gap:8px">
            <div style="font-weight:800">${inv ? `<button class="inv-toggle" id="lg-n" aria-pressed="${cur.n}">${cur.n ? '¬A' : 'A'}</button>` : 'A'}<br>B</div><span aria-hidden="true">➜</span>
            <button class="gate-btn" id="lg-g1" aria-label="Compuerta 1: ${cur.g1}">${cur.g1}</button>
            ${two ? `<span aria-hidden="true">➜</span><div style="font-weight:800">C</div><button class="gate-btn" id="lg-g2" aria-label="Compuerta 2: ${cur.g2}">${cur.g2}</button>` : ''}
            <span aria-hidden="true">➜</span><span style="font-size:1.8rem" aria-hidden="true">${all ? '💡' : '⚫'}</span>
          </div>
          <p class="muted" style="margin:8px 0 0">${two ? `Y = (${cur.n ? '¬A' : 'A'} ${cur.g1} B) ${cur.g2} C` : `Y = A ${cur.g1} B`}</p>
        </div>
        <table class="tt"><thead><tr><th>A</th><th>B</th>${two ? '<th>C</th>' : ''}<th>Meta Y</th><th>Tu Y</th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr class="${out[i] === tgt[i] ? 'match' : ''}"><td>${r[0]}</td><td>${r[1]}</td>${two ? `<td>${r[2]}</td>` : ''}<td>${tgt[i]}</td><td>${out[i]} ${out[i] === tgt[i] ? '✓' : ''}</td></tr>`).join('')}
        </tbody></table><button class="btn block" id="lg-check" style="margin-top:12px">Comprobar</button>`;
      const cyc = (k) => { cur[k] = pool[(pool.indexOf(cur[k]) + 1) % pool.length]; Sfx.play('tap'); buzz(8); draw(); };
      $('#lg-g1', ctx.stage).onclick = () => cyc('g1'); if (two) $('#lg-g2', ctx.stage).onclick = () => cyc('g2');
      if (inv) $('#lg-n', ctx.stage).onclick = () => { cur.n = !cur.n; draw(); };
      $('#lg-check', ctx.stage).onclick = () => ctx.answer(all, `Una solución: ${two ? `(${sol.n ? '¬A' : 'A'} ${sol.g1} B) ${sol.g2} C` : `A ${sol.g1} B`}. AND = ambos 1 · OR = alguno 1 · XOR = distintos · NAND/NOR = la negación.`);
    };
    draw();
  },
});

/* ---------- Programación: Robot por bloques ---------- */
registerGame({
  id: 'robot', subj: 'codigo', name: 'Robo-Laberinto', icon: '🤖', rounds: 4,
  desc: 'Programa al robot con bloques para llegar a la batería.',
  round(ctx) {
    const d = ctx.diff; const N = d <= 2 ? 5 : 6; const L = [0, rnd(3, 4), rnd(5, 6), rnd(6, 8), rnd(8, 10), rnd(9, 12)][d];
    const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    let path;
    for (let tries = 0; tries < 200; tries++) {
      const start = [0, rnd(0, N - 1)]; path = [start]; const seen = new Set([start.join()]);
      while (path.length <= L) {
        const [x, y] = path[path.length - 1];
        const nb = shuffle(DIRS).map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(a + ',' + b) && DIRS.filter(([ex, ey]) => seen.has((a + ex) + ',' + (b + ey))).length === 1);
        if (!nb.length) break; const n = nb[0]; path.push(n); seen.add(n.join());
      }
      if (path.length > L) break;
    }
    const goal = path[path.length - 1]; const onPath = new Set(path.map((p) => p.join()));
    const walls = new Set(); for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!onPath.has(x + ',' + y) && Math.random() < .7) walls.add(x + ',' + y);
    // solución con giros
    const solution = []; let dir = 0;
    for (let i = 1; i < path.length; i++) { const dx = path[i][0] - path[i - 1][0], dy = path[i][1] - path[i - 1][1]; const nd = DIRS.findIndex(([a, b]) => a === dx && b === dy); const t = (nd - dir + 4) % 4; if (t === 1) solution.push('R'); if (t === 3) solution.push('L'); if (t === 2) solution.push('R', 'R'); solution.push('F'); dir = nd; }
    const loops = d >= 3; const limit = d >= 4 ? Math.max(5, Math.ceil(solution.length * .75)) : null;
    let prog = [], open = null, runs = 0, busy = false; let bot = { x: path[0][0], y: path[0][1], dir: 0 };
    const NAMES = { F: '⬆ Avanzar', L: '↺ Izquierda', R: '↻ Derecha' };
    const count = (p) => p.reduce((n, b) => n + (b.loop ? 1 + count(b.body) : 1), 0);
    const flat = (p) => p.flatMap((b) => (b.loop ? Array.from({ length: b.loop }, () => flat(b.body)).flat() : [b.c]));
    const renderProg = (p, nested) => p.map((b, i) => b.loop ? `<span class="loopbox"><button class="blk loop" data-del="${nested ? '' : i}">🔁 ×${b.loop}</button>${renderProg(b.body, true)}${open === b ? '<span class="muted">…</span>' : ''}</span>` : `<button class="blk ${b.c.toLowerCase()}" ${nested ? '' : `data-del="${i}"`}>${NAMES[b.c]}</button>`).join('');
    const board = () => {
      const cs = 100 / N; let s = '';
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) { const w = walls.has(x + ',' + y); s += `<rect x="${x * cs + .6}" y="${y * cs + .6}" width="${cs - 1.2}" height="${cs - 1.2}" rx="2" fill="${w ? 'var(--muted)' : 'var(--surface2)'}" opacity="${w ? .55 : 1}"/>`; }
      s += `<text x="${goal[0] * cs + cs / 2}" y="${goal[1] * cs + cs * .68}" text-anchor="middle" font-size="${cs * .55}">🔋</text>`;
      s += `<g style="transition:transform .3s" transform="translate(${bot.x * cs + cs / 2} ${bot.y * cs + cs / 2}) rotate(${bot.dir * 90})"><rect x="${-cs * .32}" y="${-cs * .32}" width="${cs * .64}" height="${cs * .64}" rx="${cs * .14}" fill="var(--accent)" stroke="rgba(0,0,0,.3)" stroke-width="1"/><circle cx="${cs * .14}" cy="${-cs * .12}" r="${cs * .07}" fill="#7dffd8"/><circle cx="${cs * .14}" cy="${cs * .12}" r="${cs * .07}" fill="#7dffd8"/><path d="M${cs * .34} -${cs * .1} L${cs * .48} 0 L${cs * .34} ${cs * .1} Z" fill="#ffc53d"/></g>`;
      $('#rb-board', ctx.stage).innerHTML = s;
    };
    const draw = () => {
      ctx.stage.innerHTML = `<div class="prompt">Lleva el robot a la batería 🔋<small>${limit ? `Máximo ${limit} bloques · ` : ''}Toca bloques para programar; toca un bloque del programa para borrarlo</small></div>
        <svg class="viz" id="rb-board" viewBox="0 0 100 100" style="max-width:340px;margin:0 auto" role="img" aria-label="Laberinto"></svg>
        <div class="chips" style="margin:12px 0">${['F', 'L', 'R'].map((c) => `<button class="blk ${c.toLowerCase()}" data-add="${c}">${NAMES[c]}</button>`).join('')}
          ${loops ? (open ? '<button class="blk end" data-end>Fin repetir</button>' : [2, 3, 4].map((n) => `<button class="blk loop" data-loop="${n}">🔁 Repetir ×${n}</button>`).join('')) : ''}</div>
        <div class="prog-area" aria-label="Programa">${prog.length ? renderProg(prog) : '<span class="muted">Tu programa aparecerá aquí…</span>'}</div>
        <p class="muted center" style="margin:6px 0">Bloques: ${count(prog)}${limit ? ' / ' + limit : ''}</p>
        <div class="row"><button class="btn ghost sm" data-clear>🗑 Borrar</button><button class="btn grow" data-run ${prog.length ? '' : 'disabled'}>▶ Ejecutar</button></div>`;
      board();
      $$('[data-add]', ctx.stage).forEach((b) => b.onclick = () => { if (busy) return; (open ? open.body : prog).push({ c: b.dataset.add }); Sfx.play('tap'); draw(); });
      $$('[data-loop]', ctx.stage).forEach((b) => b.onclick = () => { if (busy) return; const l = { loop: +b.dataset.loop, body: [] }; prog.push(l); open = l; Sfx.play('tap'); draw(); });
      $$('[data-end]', ctx.stage).forEach((b) => b.onclick = () => { open = null; draw(); });
      $$('[data-del]', ctx.stage).forEach((b) => { if (b.dataset.del === '') return; b.onclick = () => { if (busy) return; const r = prog.splice(+b.dataset.del, 1)[0]; if (r === open) open = null; draw(); }; });
      $('[data-clear]', ctx.stage).onclick = () => { if (busy) return; prog = []; open = null; draw(); };
      $('[data-run]', ctx.stage).onclick = run;
    };
    const run = () => {
      if (busy) return; if (limit && count(prog) > limit) { ctx.say(`Usa como máximo ${limit} bloques. ¡Prueba con Repetir!`, 'think'); return; }
      busy = true; open = null; runs++; bot = { x: path[0][0], y: path[0][1], dir: 0 }; const steps = flat(prog); let i = 0;
      const tick = () => {
        if (i >= steps.length) { busy = false; return fail('El robot no llegó a la batería.'); }
        const c = steps[i++];
        if (c === 'L') bot.dir = (bot.dir + 3) % 4; else if (c === 'R') bot.dir = (bot.dir + 1) % 4;
        else { const nx = bot.x + DIRS[bot.dir][0], ny = bot.y + DIRS[bot.dir][1]; if (nx < 0 || ny < 0 || nx >= N || ny >= N || walls.has(nx + ',' + ny)) { busy = false; Sfx.play('bad'); buzz(50); return fail('¡Choque! 💥'); } bot.x = nx; bot.y = ny; Sfx.play('tap'); }
        board();
        if (bot.x === goal[0] && bot.y === goal[1]) { busy = false; Sfx.play('coin'); return ctx.answer(runs <= 2, runs <= 2 ? `¡Llegó en ${runs === 1 ? 'el primer intento' : '2 intentos'}! Un algoritmo es una secuencia exacta de pasos.` : `Llegó, aunque tomó ${runs} intentos. Planifica el camino antes de ejecutar.`); }
        ctx.timeout(tick, 330);
      };
      tick();
    };
    const fail = (msg) => {
      if (runs >= 3) return ctx.answer(false, `Solución posible: ${solution.map((c) => NAMES[c]).join(' → ')}`);
      ctx.say(msg + ' Ajusta el programa y vuelve a intentar.', 'oops'); ctx.timeout(() => { bot = { x: path[0][0], y: path[0][1], dir: 0 }; draw(); }, 700);
    };
    draw();
  },
});

/* ---------- Programación: Cazabugs ---------- */
const BUGS = [
  { t: 1, code: ['suma = 0', 'para i desde 1 hasta 5:', '    suma = suma + i', 'imprimir(suma * 0)'], bug: 3, why: 'Multiplicar por 0 siempre da 0. Debía ser imprimir(suma).' },
  { t: 1, code: ['edad = 17', 'si edad > 18:', '    imprimir("mayor de edad")', 'sino:', '    imprimir("menor de edad")'], bug: 1, why: 'Con 18 años diría “menor”. La condición correcta es edad >= 18.' },
  { t: 1, code: ['lado = 4', 'area = lado + lado', 'imprimir(area)'], bug: 1, why: 'El área de un cuadrado es lado * lado, no lado + lado.' },
  { t: 2, code: ['temp = leerSensor()', 'si temp > 30:', '    ventilador = APAGADO', 'sino:', '    ventilador = ENCENDIDO'], bug: 2, why: 'Con calor el ventilador debe ENCENDERSE. Las acciones están invertidas.' },
  { t: 2, code: ['i = 0', 'mientras i < 10:', '    imprimir(i)', '    i = i - 1'], bug: 3, why: 'i nunca llega a 10: bucle infinito. Debía ser i = i + 1.' },
  { t: 2, code: ['lista = [3, 8, 1]', 'mayor = 0', 'para x en lista:', '    si x < mayor:', '        mayor = x'], bug: 3, why: 'Para buscar el mayor, la condición es x > mayor.' },
  { t: 3, code: ['V = 9', 'R = 0', 'I = V / R', 'imprimir(I)'], bug: 1, why: 'R = 0 provoca división entre cero. Una resistencia real nunca es 0 Ω.' },
  { t: 3, code: ['promedio(a, b):', '    retornar a + b / 2'], bug: 1, why: 'Por precedencia se divide b primero. Debía ser (a + b) / 2.' },
  { t: 3, code: ['grados = 90', 'rad = grados * 180 / PI', 'imprimir(seno(rad))'], bug: 1, why: 'Para pasar a radianes es grados * PI / 180.' },
  { t: 4, code: ['distancia = leerUltrasonido()', 'si distancia < 10 y distancia > 50:', '    frenar()'], bug: 1, why: 'Ningún número es < 10 y > 50 a la vez. Debía usar “o”, o solo distancia < 10.' },
  { t: 4, code: ['velocidad = 0', 'para t desde 0 hasta 10:', '    velocidad = 9.8 * t', '    posicion = velocidad * t'], bug: 3, why: 'En caída libre x = ½·g·t², no v·t (v cambia con el tiempo).' },
  { t: 4, code: ['contador = 0', 'para cada boton en botones:', '    si boton.presionado:', '        contador = 1'], bug: 3, why: 'Siempre se reinicia a 1. Debía acumular: contador = contador + 1.' },
  { t: 5, code: ['error = meta - medida', 'integral = integral + error * dt', 'derivada = (error - errorPrevio) / dt', 'u = Kp*error + Ki*integral + Kd*derivada', 'errorPrevio = medida'], bug: 4, why: 'Debe guardarse el error: errorPrevio = error. Si no, la derivada sale mal.' },
  { t: 5, code: ['factorial(n):', '    si n == 0: retornar 0', '    retornar n * factorial(n - 1)'], bug: 1, why: '0! = 1. Con retornar 0 todo factorial daría 0.' },
  { t: 5, code: ['pwm = leerPotenciometro() / 1023', 'si pwm > 1: pwm = 1', 'motor.velocidad(pwm * 100)', 'esperar(10)', 'pwm = 0'], bug: 4, why: 'pwm = 0 al final no tiene efecto sobre el motor y pierde el valor; es código muerto (sobra).' },
];
registerGame({
  id: 'bugs', subj: 'codigo', name: 'Cazabugs', icon: '🐞', rounds: 5,
  desc: 'Encuentra la línea con el error en el código.',
  round(ctx) {
    const pool = BUGS.filter((b) => Math.abs(b.t - ctx.diff) <= 1); const recent = ctx.memo('bugs', []);
    let b = pick(pool.filter((x) => !recent.includes(x)).length ? pool.filter((x) => !recent.includes(x)) : pool); recent.push(b);
    ctx.stage.innerHTML = `<div class="prompt">¿Qué línea tiene el bug? 🐞<small>Toca la línea incorrecta</small></div><div class="code" role="list">${b.code.map((l, i) => `<button data-i="${i}"><span class="ln">${i + 1}</span>${esc(l)}</button>`).join('')}</div>`;
    $$('.code button', ctx.stage).forEach((btn) => btn.onclick = () => {
      if (ctx.stage.dataset.done) return; ctx.stage.dataset.done = 1; const ok = +btn.dataset.i === b.bug;
      btn.classList.add(ok ? 'right' : 'wrong'); if (!ok) $$('.code button', ctx.stage)[b.bug].classList.add('right');
      ctx.answer(ok, `Línea ${b.bug + 1}: ${b.why}`);
    });
  },
});

/* ---------- Mecánica: Tren de engranajes ---------- */
function gearPath(teeth, r) {
  const ro = r + 3.2, ri = r - 2.6; let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * 2 * Math.PI, w = Math.PI / teeth;
    const pts = [[ri, a - w * .55], [ro, a - w * .3], [ro, a + w * .3], [ri, a + w * .55]];
    pts.forEach(([rr, aa], k) => { d += `${i === 0 && k === 0 ? 'M' : 'L'}${(rr * Math.cos(aa)).toFixed(2)} ${(rr * Math.sin(aa)).toFixed(2)} `; });
  }
  return d + 'Z';
}
registerGame({
  id: 'engranajes', subj: 'meca', name: 'Taller de Engranajes', icon: '⚙️', rounds: 5,
  desc: 'Elige engranajes para lograr la velocidad y el sentido de giro.',
  round(ctx) {
    const d = ctx.diff; const Na = pick([12, 16, 20, 24]); const wa = pick([30, 60, 90, 120]);
    const sizes = [8, 12, 16, 20, 24, 32, 40, 48];
    let Nb, wt; do { Nb = pick(sizes); wt = wa * Na / Nb; } while (!Number.isInteger(wt) || Nb === Na);
    const wantCW = d >= 3 ? Math.random() < .5 : false; // motor gira horario
    let chosen = null, idler = false;
    const opts = uniqueOptions(Nb, () => pick(sizes.filter((s) => s !== Na)));
    const dirTxt = (cw) => (cw ? 'horario ↻' : 'antihorario ↺');
    ctx.stage.innerHTML = `<div class="prompt">Motor: ${Na} dientes a ${wa} rpm (horario). Meta: <span style="color:var(--accent)">${wt} rpm${d >= 3 ? ', ' + dirTxt(wantCW) : ''}</span><small>Arrastra o toca un engranaje de salida${d >= 3 ? ' · usa el loco para invertir el sentido' : ''}</small></div>
      <svg class="viz" id="eg" viewBox="0 0 300 150" role="img" aria-label="Tren de engranajes"></svg>
      <div class="readout"><span id="eg-r">Salida: —</span></div>
      <div class="chips" id="eg-tray">${opts.map((n) => `<button class="chip" data-n="${n}">⚙ ${n} dientes</button>`).join('')}</div>
      ${d >= 3 ? `<div class="row" style="justify-content:center;margin-top:10px"><button class="inv-toggle" id="eg-idle" aria-pressed="false">+ Engranaje loco (16)</button></div>` : ''}
      <button class="btn block" id="eg-check" style="margin-top:14px" disabled>Comprobar</button>`;
    const svg = $('#eg', ctx.stage); const k = 1.5;
    const draw = () => {
      const ra = Na * k / 2 + 6; let x = 20 + ra, s = '';
      const gear = (cx, n, rpm, cw, col, id) => { const r = n * k / 2 + 6; const dur = rpm ? (60 / rpm) * 3 : 0; return `<g transform="translate(${cx},75)" ${id ? `id="${id}"` : ''}><g class="${rpm ? 'spin' : ''}" style="animation-duration:${dur}s;animation-direction:${cw ? 'normal' : 'reverse'}"><path d="${gearPath(n, r)}" fill="${col}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><circle r="${r * .35}" fill="var(--surface)" stroke="rgba(0,0,0,.3)"/><rect x="-1.5" y="${-r + 4}" width="3" height="${r * .4}" fill="rgba(0,0,0,.3)"/></g><text y="${r + 16}" text-anchor="middle" class="svg-text">${n}T</text></g>`; };
      s += gear(x, Na, wa, true, '#94a3b8');
      s += `<text x="${x}" y="18" text-anchor="middle" class="svg-text">MOTOR</text>`;
      let cw = true, lastR = ra;
      if (idler) { const ri = 16 * k / 2 + 6; x += lastR + ri - 2; cw = !cw; s += gear(x, 16, wa * Na / 16, cw, '#c4b5fd'); lastR = ri; }
      if (chosen) { const rb = chosen * k / 2 + 6; x += lastR + rb - 2; s += gear(x, chosen, wa * Na / chosen, !cw, 'var(--accent)', 'eg-slot'); }
      else { const rb = 24; x += lastR + rb; s += `<g id="eg-slot" transform="translate(${x},75)"><circle r="${rb}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="6 5"/><text y="5" text-anchor="middle" class="svg-text" style="fill:var(--accent)">?</text></g>`; }
      const vb = Math.max(300, x + 70); svg.setAttribute('viewBox', `0 0 ${vb} 150`); svg.innerHTML = s;
      if (chosen) { const w = wa * Na / chosen; const outCW = idler ? true : false; $('#eg-r', ctx.stage).textContent = `Salida: ${fmt(w, 1)} rpm, ${dirTxt(outCW)}`; }
    };
    draw();
    const set = (n) => { chosen = n; $$('.chip', ctx.stage).forEach((c) => c.classList.toggle('sel', +c.dataset.n === n)); $('#eg-check', ctx.stage).disabled = false; Sfx.play('tap'); buzz(10); draw(); };
    $$('.chip', ctx.stage).forEach((c) => makeDraggable(c, { zones: () => [$('#eg-slot', ctx.stage)].filter(Boolean), onDrop: () => set(+c.dataset.n), onTap: () => set(+c.dataset.n) }));
    if (d >= 3) $('#eg-idle', ctx.stage).onclick = (e) => { idler = !idler; e.currentTarget.setAttribute('aria-pressed', idler); Sfx.play('tap'); draw(); };
    $('#eg-check', ctx.stage).onclick = () => {
      const w = wa * Na / chosen; const outCW = idler; const ok = Math.abs(w - wt) < 1e-9 && (d < 3 || outCW === wantCW);
      ctx.answer(ok, `ω_salida = ω_motor · N_motor / N_salida = ${wa} · ${Na} / ${Nb} = ${wt} rpm. Cada engranaje que engrana invierte el sentido; el loco no cambia la velocidad.`);
    };
  },
});

/* ---------- Mecánica: Balancín de torques ---------- */
registerGame({
  id: 'palanca', subj: 'meca', name: 'Balancín de Torques', icon: '🏗️', rounds: 5,
  desc: 'Coloca la carga para equilibrar los momentos: m·d = m·d.',
  round(ctx) {
    const d = ctx.diff; let left = [], m2, pos, chooseMass = d >= 4;
    for (let tries = 0; tries < 300; tries++) {
      left = d >= 3 ? [[rnd(1, 4), rnd(1, 5)], [rnd(1, 4), rnd(1, 5)]] : [[rnd(1, 5), rnd(1, 5)]];
      if (left.length === 2 && left[0][1] === left[1][1]) continue;
      const tq = left.reduce((s, [m, x]) => s + m * x, 0);
      const cands = []; for (let m = 1; m <= 6; m++) for (let x = 1; x <= 5; x++) if (m * x === tq) cands.push([m, x]);
      if (cands.length) { [m2, pos] = pick(cands); break; }
    }
    const tq = left.reduce((s, [m, x]) => s + m * x, 0);
    let place = null, mass = chooseMass ? null : m2;
    const massOpts = chooseMass ? uniqueOptions(m2, () => rnd(1, 6)) : null;
    ctx.stage.innerHTML = `<div class="prompt">${chooseMass ? `Elige la masa para colocarla en la posición ${pos}` : `Coloca la caja de ${m2} kg para equilibrar`}<small>${chooseMass ? 'Toca una masa' : 'Toca una posición del lado derecho'} y luego suelta</small></div>
      <svg class="viz" id="pl" viewBox="-130 -90 260 130" style="max-width:480px;margin:0 auto" role="img" aria-label="Balancín"></svg>
      ${chooseMass ? `<div class="chips">${massOpts.map((m) => `<button class="chip" data-m="${m}">${m} kg</button>`).join('')}</div>` : ''}
      <button class="btn block" id="pl-go" style="margin-top:14px" disabled>🫳 Soltar</button>`;
    if (chooseMass) place = pos;
    const svg = $('#pl', ctx.stage); const u = 22;
    const draw = (tilt = 0) => {
      let s = `<path d="M0 0 L-14 32 H14 Z" fill="var(--muted)"/><g style="transition:transform .9s cubic-bezier(.3,1.5,.5,1)" transform="rotate(${tilt})">`;
      s += `<rect x="-120" y="-6" width="240" height="8" rx="4" fill="#c08a4a"/>`;
      for (let i = -5; i <= 5; i++) if (i) s += `<line x1="${i * u}" y1="-6" x2="${i * u}" y2="2" stroke="rgba(0,0,0,.35)" stroke-width="1"/><text x="${i * u}" y="16" text-anchor="middle" class="svg-text">${Math.abs(i)}</text>`;
      left.forEach(([m, x], j) => { const hh = 12 + m * 4; s += `<rect x="${-x * u - 10}" y="${-6 - hh}" width="20" height="${hh}" rx="3" fill="#2f7df6"/><text x="${-x * u}" y="${-10}" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">${m}</text>`; });
      if (!chooseMass) for (let i = 1; i <= 5; i++) s += `<rect data-p="${i}" x="${i * u - 10}" y="-46" width="20" height="40" fill="transparent" style="cursor:pointer"/>${place === i ? '' : `<circle cx="${i * u}" cy="-12" r="3" fill="var(--accent)" opacity=".5"/>`}`;
      if (place && mass) { const hh = 12 + mass * 4; s += `<rect x="${place * u - 10}" y="${-6 - hh}" width="20" height="${hh}" rx="3" fill="#ff7a2f"/><text x="${place * u}" y="-10" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">${mass}</text>`; }
      else if (chooseMass) s += `<rect x="${pos * u - 10}" y="-40" width="20" height="34" rx="3" fill="none" stroke="#ff7a2f" stroke-dasharray="4 3" stroke-width="2"/>`;
      s += `</g>`; svg.innerHTML = s;
      $$('[data-p]', svg).forEach((r) => r.addEventListener('click', () => { place = +r.dataset.p; Sfx.play('tap'); buzz(8); $('#pl-go', ctx.stage).disabled = false; draw(); }));
    };
    draw();
    $$('[data-m]', ctx.stage).forEach((c) => c.onclick = () => { mass = +c.dataset.m; $$('[data-m]', ctx.stage).forEach((x) => x.classList.toggle('sel', x === c)); $('#pl-go', ctx.stage).disabled = false; Sfx.play('tap'); draw(); });
    $('#pl-go', ctx.stage).onclick = () => {
      $('#pl-go', ctx.stage).disabled = true; const right = place * mass; const diff = right - tq; const tilt = clamp(diff * 2.2, -14, 14);
      draw(tilt); Sfx.play('whoosh');
      ctx.timeout(() => ctx.answer(diff === 0, `Torque izquierdo = ${left.map(([m, x]) => `${m}·${x}`).join(' + ')} = ${tq}. Derecho = ${mass}·${place} = ${right}. ${diff === 0 ? '¡Equilibrio!' : `Necesitabas ${m2} kg en la posición ${pos}.`}`), 1000);
    };
  },
});

/* ---------- Control: Termostato PID ---------- */
function simPID(Kp, Ki, Kd, SP, dist) {
  const dt = .1, buf = []; let T = 20, I = 0, prev = SP - T; const out = [];
  for (let i = 0; i < 1500; i++) {
    const t = i * dt, amb = dist && t > 75 ? 8 : 20, e = SP - T, D = (e - prev) / dt; prev = e;
    let u = Kp * e + Ki * (I + e * dt) + Kd * D; if (!((u > 1 && e > 0) || (u < 0 && e < 0))) I += e * dt; u = clamp(u, 0, 1);
    buf.push(u); const ud = buf.length > 20 ? buf.shift() : 0; T += (2.5 * ud - .04 * (T - amb)) * dt; if (i % 5 === 0) out.push(T);
  }
  return out; // 300 muestras, una cada 0,5 s
}
registerGame({
  id: 'pid', subj: 'meca', name: 'Termostato PID', icon: '🌡️', rounds: 3,
  desc: 'Sintoniza el controlador para estabilizar la temperatura.',
  round(ctx) {
    const d = ctx.diff; const SP = d === 4 ? 65 : 50; const dist = d === 5; let tries = 0;
    const G = [null, { fe: 3, os: 3, P: 1, txt: 'Termina a menos de 3 °C de la meta' }, { fe: 2, os: 3, P: 1, txt: 'Termina a menos de 2 °C, sin pasarte más de 3 °C' },
      { fe: .5, os: 1.5, P: 2, txt: 'Error final < 0,5 °C y sobrepico < 1,5 °C (usa Ki)' }, { fe: .3, os: 1, P: 3, txt: 'Meta 65 °C: error < 0,3 °C, sobrepico < 1 °C' },
      { fe: .5, os: 1.5, P: 3, txt: 'Al minuto 1:15 se abre una ventana ❄️. Recupera: error < 0,5 °C' }][d];
    const K = { p: 0, i: 0, d: 0 };
    ctx.stage.innerHTML = `<div class="prompt">Horno a ${SP} °C<small>${G.txt}</small></div>
      <svg class="viz" id="pd" viewBox="0 0 300 160" role="img" aria-label="Gráfica de temperatura"></svg>
      <div class="readout" id="pd-r"><span>Intento ${tries + 1}/4</span></div>
      <div class="controls">${slider('pd-p', 'Kp', 0, .6, .02, 0)}${G.P >= 2 ? slider('pd-i', 'Ki', 0, .04, .002, 0) : ''}${G.P >= 3 ? slider('pd-d', 'Kd', 0, .4, .02, 0) : ''}</div>
      <p class="muted" style="font-size:.85rem;margin-top:8px">Kp reacciona al error actual · Ki elimina el error acumulado · Kd frena los cambios bruscos.</p>
      <button class="btn block" id="pd-run">▶ Simular</button>`;
    ['p', 'i', 'd'].forEach((k) => { const el = $('#pd-' + k, ctx.stage); if (el) el.oninput = () => { K[k] = +el.value; $('#pd-' + k + '-o', ctx.stage).textContent = fmt(K[k], 3); }; });
    const svg = $('#pd', ctx.stage); const X = (i) => 30 + i * (260 / 300), Y = (T) => 140 - (T - 10) * (120 / 70);
    const axes = () => `<rect x="30" y="${Y(SP + (G.fe))}" width="260" height="${Y(SP - G.fe) - Y(SP + G.fe)}" fill="var(--ok)" opacity=".16"/>
      <line x1="30" y1="${Y(SP)}" x2="290" y2="${Y(SP)}" stroke="var(--ok)" stroke-dasharray="5 4" stroke-width="1.5"/>
      <line x1="30" y1="20" x2="30" y2="140" class="svg-muted"/><line x1="30" y1="140" x2="290" y2="140" class="svg-muted"/>
      ${[20, 40, 60, 80].map((t) => `<text x="4" y="${Y(t) + 4}" class="svg-text">${t}°</text>`).join('')}<text x="250" y="155" class="svg-text">150 s</text>
      ${dist ? `<line x1="${X(150)}" y1="20" x2="${X(150)}" y2="140" stroke="#3bc1ff" stroke-dasharray="3 3"/><text x="${X(150) + 3}" y="30" font-size="10">❄️</text>` : ''}`;
    svg.innerHTML = axes();
    $('#pd-run', ctx.stage).onclick = () => {
      const btn = $('#pd-run', ctx.stage); btn.disabled = true; tries++;
      const out = simPID(K.p, K.i, K.d, SP, dist); let n = 0;
      const anim = () => {
        n = Math.min(out.length, n + 6);
        svg.innerHTML = axes() + `<polyline points="${out.slice(0, n).map((T, i) => `${X(i).toFixed(1)},${Y(clamp(T, 10, 80)).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/><text x="${Math.min(X(n - 1) + 4, 262)}" y="${Y(clamp(out[n - 1], 10, 80)) - 4}" class="svg-text" style="fill:var(--ink)">${fmt(out[n - 1], 1)}°</text>`;
        if (n < out.length) return ctx.raf(anim);
        const last = out.slice(-20), fe = Math.max(...last.map((v) => Math.abs(v - SP))), os = Math.max(...out) - SP;
        const ok = fe <= G.fe && os <= G.os;
        $('#pd-r', ctx.stage).innerHTML = `<span>Error final ${fmt(fe, 2)} °C ${fe <= G.fe ? '✓' : '✗'}</span><span>Sobrepico ${fmt(Math.max(0, os), 2)} °C ${os <= G.os ? '✓' : '✗'}</span>`;
        if (ok) return ctx.answer(true, `Kp=${fmt(K.p)} Ki=${fmt(K.i, 3)} Kd=${fmt(K.d)}. ¡Así se sintoniza un lazo de control!`);
        if (tries >= 4) return ctx.answer(false, 'Pista: Kp ≈ 0,3 acerca sin oscilar; un Ki pequeño (≈ 0,01) quita el error final; Kd ≈ 0,1 suaviza.');
        btn.disabled = false; btn.textContent = `▶ Simular (intento ${tries + 1}/4)`;
        ctx.say(fe > G.fe && os <= G.os ? (K.p < .2 ? 'Muy tibio: sube Kp.' : G.P >= 2 ? 'Queda error: prueba con Ki.' : 'Oscila o se queda corto. Ajusta Kp.') : 'Se pasa u oscila: baja la ganancia o usa Kd.', 'think');
      };
      anim();
    };
  },
});
