/* ============ Lord of Engineer · Academia ============
   Lecciones interactivas desde cero, Pizarra (cálculos y ecuaciones paso a paso) y Cuaderno.
   El contenido de las lecciones vive en lessons.js. */
'use strict';

/* ---------- evaluador matemático seguro (sin eval) ---------- */
const MathX = {
  tokenize(src) {
    let s = String(src).toLowerCase().trim()
      .replace(/[×·*]/g, '*').replace(/[÷:]/g, '/').replace(/[−–—]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/π|\bpi\b/g, 'p').replace(/√|raiz|raíz|sqrt/g, 'r');
    s = s.replace(/(\d),(\d)/g, '$1.$2');
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (/[\d.]/.test(c)) { let j = i; while (j < s.length && /[\d.]/.test(s[j])) j++; const v = parseFloat(s.slice(i, j)); if (!Number.isFinite(v)) throw new Error('num'); out.push({ k: 'n', v }); i = j; continue; }
      if (c === 'x') { out.push({ k: 'x' }); i++; continue; }
      if (c === 'y') { out.push({ k: 'y' }); i++; continue; }
      if (c === 'p') { out.push({ k: 'n', v: Math.PI, pi: true }); i++; continue; }
      if (c === 'r') { out.push({ k: 'r' }); i++; continue; }
      if ('+-*/^()='.includes(c)) { out.push({ k: c }); i++; continue; }
      throw new Error('char ' + c);
    }
    // multiplicación implícita: 2x, 3(…), )(, x(…), 2√9
    const t = [];
    out.forEach((tk, j) => { const p = t[t.length - 1]; if (p && (p.k === 'n' || p.k === 'x' || p.k === 'y' || p.k === ')') && (tk.k === 'x' || tk.k === 'y' || tk.k === '(' || tk.k === 'r' || (tk.k === 'n' && p.k !== 'n'))) t.push({ k: '*', implicit: true }); t.push(tk); });
    return t;
  },
  parse(src) {
    const t = this.tokenize(src); let i = 0;
    const peek = () => t[i], eat = (k) => { if (!t[i] || t[i].k !== k) throw new Error('esperaba ' + k); return t[i++]; };
    const expr = () => { let l = term(); while (peek() && (peek().k === '+' || peek().k === '-')) { const o = t[i++].k; l = { k: 'op', o, l, r: term() }; } return l; };
    const term = () => { let l = unary(); while (peek() && (peek().k === '*' || peek().k === '/')) { const o = t[i++].k; l = { k: 'op', o, l, r: unary() }; } return l; };
    const unary = () => { if (peek() && peek().k === '-') { i++; return { k: 'neg', e: unary() }; } if (peek() && peek().k === '+') { i++; return unary(); } return power(); };
    const power = () => { const b = primary(); if (peek() && peek().k === '^') { i++; return { k: 'op', o: '^', l: b, r: unary() }; } return b; };
    const primary = () => {
      const tk = peek(); if (!tk) throw new Error('fin');
      if (tk.k === 'n') { i++; return { k: 'n', v: tk.v, pi: tk.pi }; }
      if (tk.k === 'x') { i++; return { k: 'x' }; }
      if (tk.k === 'y') { i++; return { k: 'y' }; }
      if (tk.k === 'r') { i++; return { k: 'sqrt', e: power() }; }
      if (tk.k === '(') { i++; const e = expr(); eat(')'); e.par = true; return e; }
      throw new Error('inesperado ' + tk.k);
    };
    const sides = []; sides.push(expr()); if (peek() && peek().k === '=') { i++; sides.push(expr()); }
    if (i < t.length) throw new Error('sobra');
    return sides;
  },
  eval(n, x) {
    switch (n.k) {
      case 'n': return n.v;
      case 'x': if (x === undefined) throw new Error('x'); return x;
      case 'y': if (this._y === undefined) throw new Error('y'); return this._y;
      case 'neg': return -this.eval(n.e, x);
      case 'sqrt': return Math.sqrt(this.eval(n.e, x));
      case 'op': { const a = this.eval(n.l, x), b = this.eval(n.r, x); return n.o === '+' ? a + b : n.o === '-' ? a - b : n.o === '*' ? a * b : n.o === '/' ? a / b : a ** b; }
    }
    throw new Error('nodo');
  },
  value(src) { const s = this.parse(src); if (s.length !== 1) throw new Error('='); return this.eval(s[0]); },
  num(v) { if (!Number.isFinite(v)) return 'indefinido'; const r = Math.round(v * 1e6) / 1e6; return fmt(r, 6); },
  frac(v) {
    if (!Number.isFinite(v) || Number.isInteger(v)) return null;
    for (let d = 2; d <= 100; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) return `${n}/${d}`; }
    return null;
  },
  str(n, top = true) {
    const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
    let s;
    if (n.k === 'n') s = n.pi ? 'π' : (n.v < 0 && !top ? `(${this.num(n.v)})` : this.num(n.v));
    else if (n.k === 'x' || n.k === 'y') s = n.k;
    else if (n.k === 'neg') s = `−${this.str(n.e, false)}`;
    else if (n.k === 'sqrt') s = `√${this.str(n.e, false)}`;
    else if (n.o === '*' && n.l.k === 'n' && !n.l.pi && (n.r.k === 'x' || n.r.k === 'y' || (n.r.par && n.r.k !== 'n'))) s = `${this.str(n.l, false)}${this.str(n.r, false)}`; // 2x, 3(x + 2)
    else s = n.o === '^' ? `${this.str(n.l, false)}^${this.str(n.r, false)}` : `${this.str(n.l, false)} ${SYM[n.o]} ${this.str(n.r, false)}`;
    return n.par && n.k !== 'n' ? `(${s})` : s;
  },
  hasAdd(n) { return n && n.k === 'op' && (n.o === '+' || n.o === '-' || this.hasAdd(n.l) || this.hasAdd(n.r)); },
  // un paso de simplificación respetando la jerarquía de operaciones
  step(n, root) {
    const isN = (m) => m.k === 'n';
    if (isN(n)) return null;
    if (n.k === 'neg') { if (isN(n.e)) return { node: { k: 'n', v: -n.e.v, par: n.par }, msg: `Aplica el signo: −(${this.num(n.e.v)}) = ${this.num(-n.e.v)}` }; const s = this.step(n.e, root); return s && { node: { ...n, e: s.node }, msg: s.msg }; }
    if (n.k === 'sqrt') { if (isN(n.e)) { const v = Math.sqrt(n.e.v); return { node: { k: 'n', v, par: n.par }, msg: `Raíz cuadrada: √${this.num(n.e.v)} = ${this.num(v)}, porque ${this.num(v)} × ${this.num(v)} = ${this.num(n.e.v)}` }; } const s = this.step(n.e, root); return s && { node: { ...n, e: s.node }, msg: s.msg }; }
    if (isN(n.l) && isN(n.r)) {
      const a = n.l.v, b = n.r.v, v = this.eval(n);
      const A = this.num(a), B = this.num(b), V = this.num(v);
      let msg = { '+': `Suma ${A} + ${B} = ${V}`, '-': `Resta ${A} − ${B} = ${V}`, '*': `Multiplica ${A} × ${B} = ${V}`, '/': `Divide ${A} ÷ ${B} = ${V}`, '^': `Potencia: ${A}^${B} = ${V}${Number.isInteger(b) && b > 1 && b <= 5 ? ` (${Array(b).fill(A).join(' × ')})` : ''}` }[n.o];
      if (n.o === '/' && b === 0) msg = `¡Cuidado! Dividir entre cero no está definido.`;
      if (n.par) msg = `Primero lo que está entre paréntesis. ${msg}`;
      else if ((n.o === '*' || n.o === '/') && this.hasAdd(root)) msg += ' (multiplicar y dividir va antes que sumar y restar)';
      else if (n.o === '^') msg += ' (las potencias van antes que multiplicar o sumar)';
      return { node: { k: 'n', v, par: false }, msg };
    }
    // prioridad: paréntesis y potencias más profundas primero, luego izquierda a derecha
    const s = !isN(n.l) ? this.step(n.l, root) : this.step(n.r, root);
    if (!s) return null;
    return { node: !isN(n.l) ? { ...n, l: s.node } : { ...n, r: s.node }, msg: s.msg };
  },
  arithmeticSteps(ast) {
    const steps = [{ expr: this.str(ast), msg: 'Empezamos con la expresión.' }]; let cur = ast, guard = 0;
    while (cur.k !== 'n' && guard++ < 40) { const s = this.step(cur, cur); if (!s) break; cur = s.node; steps.push({ expr: this.str(cur), msg: s.msg }); }
    return { steps, result: cur.k === 'n' ? cur.v : NaN };
  },
  linear(n) {
    switch (n.k) {
      case 'n': return { a: 0, b: n.v };
      case 'x': return { a: 1, b: 0 };
      case 'neg': { const e = this.linear(n.e); return { a: -e.a, b: -e.b }; }
      case 'sqrt': { const e = this.linear(n.e); if (e.a) throw new Error('nolin'); return { a: 0, b: Math.sqrt(e.b) }; }
      case 'op': {
        const L = this.linear(n.l), R = this.linear(n.r);
        if (n.o === '+') return { a: L.a + R.a, b: L.b + R.b };
        if (n.o === '-') return { a: L.a - R.a, b: L.b - R.b };
        if (n.o === '*') { if (L.a && R.a) throw new Error('nolin'); return L.a ? { a: L.a * R.b, b: L.b * R.b } : { a: R.a * L.b, b: R.b * L.b }; }
        if (n.o === '/') { if (R.a) throw new Error('nolin'); return { a: L.a / R.b, b: L.b / R.b }; }
        if (n.o === '^') { if (L.a || R.a) throw new Error('nolin'); return { a: 0, b: L.b ** R.b }; }
      }
    }
    throw new Error('nodo');
  },
  lin(a, b) {
    const N = (v) => this.num(Math.abs(v));
    const inv = a ? Math.round(1 / Math.abs(a)) : 0, isInv = a && inv > 1 && Math.abs(1 / Math.abs(a) - inv) < 1e-9;
    let s = a === 0 ? '' : a === 1 ? 'x' : a === -1 ? '−x' : isInv ? `${a < 0 ? '−' : ''}x/${inv}` : `${this.num(a)}x`;
    if (b !== 0 || !s) s += s ? ` ${b < 0 ? '−' : '+'} ${N(b)}` : this.num(b);
    return s;
  },
  equationSteps(L, R) {
    const l = this.linear(L), r = this.linear(R), steps = [];
    steps.push({ expr: `${this.str(L)} = ${this.str(R)}`, msg: 'Ecuación original. Meta: dejar la x sola en un lado.' });
    const simple = `${this.lin(l.a, l.b)} = ${this.lin(r.a, r.b)}`;
    if (simple !== steps[0].expr) steps.push({ expr: simple, msg: 'Simplifica cada lado: junta las x entre sí y los números entre sí.' });
    let a = l.a, b = l.b, c = r.a, d = r.b;
    if (c !== 0 && a - c !== 0) { steps.push({ expr: `${this.lin(a - c, b)} = ${this.lin(0, d)}`, msg: `${c > 0 ? 'Resta' : 'Suma'} ${this.lin(Math.abs(c), 0)} en ambos lados para juntar las x a la izquierda.` }); a -= c; c = 0; }
    if (a - c === 0) a = 0; // las x se cancelan
    if (a === 0) return { steps: steps.concat([{ expr: `${this.num(b)} = ${this.num(d)}`, msg: b === d ? 'Las x se cancelaron y queda algo siempre cierto: hay infinitas soluciones.' : 'Las x se cancelaron y queda algo falso: la ecuación no tiene solución.' }]), result: NaN };
    if (b !== 0) { steps.push({ expr: `${this.lin(a, 0)} = ${this.num(d - b)}`, msg: `${b > 0 ? 'Resta' : 'Suma'} ${this.num(Math.abs(b))} en ambos lados para quitar el número que acompaña a la x.` }); d -= b; b = 0; }
    const x = d / a;
    const k = Math.round(1 / a);
    if (a !== 1 && Math.abs(1 / a - k) < 1e-9 && Math.abs(k) > 1) steps.push({ expr: `x = ${this.num(d)} × ${this.num(k)} = ${this.num(x)}`, msg: `La x está dividida entre ${this.num(k)}: multiplica ambos lados por ${this.num(k)}.` });
    else if (a !== 1) steps.push({ expr: `x = ${this.num(d)} ÷ ${this.num(a)} = ${this.num(x)}`, msg: `Divide ambos lados entre ${this.num(a)}, el número que multiplica a la x.` });
    const lv = this.eval(L, x), rv = this.eval(R, x);
    steps.push({ expr: `x = ${this.num(x)}${this.frac(x) ? ` (= ${this.frac(x)})` : ''}`, msg: `Comprobación: con x = ${this.num(x)}, el lado izquierdo da ${this.num(lv)} y el derecho ${this.num(rv)}. ${Math.abs(lv - rv) < 1e-6 ? '✓ ¡Coinciden!' : ''}` });
    return { steps, result: x };
  },
  // forma lineal con dos incógnitas: a·x + c·y + b
  linear2(n) {
    switch (n.k) {
      case 'n': return { a: 0, c: 0, b: n.v };
      case 'x': return { a: 1, c: 0, b: 0 };
      case 'y': return { a: 0, c: 1, b: 0 };
      case 'neg': { const e = this.linear2(n.e); return { a: -e.a, c: -e.c, b: -e.b }; }
      case 'sqrt': { const e = this.linear2(n.e); if (e.a || e.c) throw new Error('nolin'); return { a: 0, c: 0, b: Math.sqrt(e.b) }; }
      case 'op': {
        const L = this.linear2(n.l), R = this.linear2(n.r), vL = L.a || L.c, vR = R.a || R.c;
        if (n.o === '+') return { a: L.a + R.a, c: L.c + R.c, b: L.b + R.b };
        if (n.o === '-') return { a: L.a - R.a, c: L.c - R.c, b: L.b - R.b };
        if (n.o === '*') { if (vL && vR) throw new Error('nolin'); const [V, k] = vL ? [L, R.b] : [R, L.b]; return { a: V.a * k, c: V.c * k, b: V.b * k }; }
        if (n.o === '/') { if (vR) throw new Error('nolin'); return { a: L.a / R.b, c: L.c / R.b, b: L.b / R.b }; }
        if (n.o === '^') { if (vL || vR) throw new Error('nolin'); return { a: 0, c: 0, b: L.b ** R.b }; }
      }
    }
    throw new Error('nodo');
  },
  lin3(a, c, d) {
    const term = (k, v, first) => { if (!k) return ''; const m = Math.abs(k) === 1 ? v : `${this.num(Math.abs(k))}${v}`; return first ? (k < 0 ? '−' + m : m) : ` ${k < 0 ? '−' : '+'} ${m}`; };
    const left = (term(a, 'x', true) + term(c, 'y', !a)) || '0';
    return `${left} = ${this.num(d)}`;
  },
  // sistema 2×2 por eliminación, explicado paso a paso
  systemSteps(e1, e2) {
    const norm = ([L, R]) => { const l = this.linear2(L), r = this.linear2(R); return { a: l.a - r.a, c: l.c - r.c, d: r.b - l.b, L, R }; };
    const E1 = norm(e1), E2 = norm(e2), steps = [];
    steps.push({ expr: `${this.str(e1[0])} = ${this.str(e1[1])}   ;   ${this.str(e2[0])} = ${this.str(e2[1])}`, msg: 'Sistema de dos ecuaciones. Meta: encontrar x e y que cumplan las dos a la vez.' });
    steps.push({ expr: `(1) ${this.lin3(E1.a, E1.c, E1.d)}   ;   (2) ${this.lin3(E2.a, E2.c, E2.d)}`, msg: 'Ordena cada ecuación como ax + by = c (las incógnitas a la izquierda, los números a la derecha).' });
    const det = E1.a * E2.c - E2.a * E1.c;
    if (Math.abs(det) < 1e-12) {
      const prop = E1.a * E2.d - E2.a * E1.d === 0 && E1.c * E2.d - E2.c * E1.d === 0;
      steps.push({ expr: 'Las rectas son paralelas', msg: prop ? 'Las dos ecuaciones son la misma recta: hay infinitas soluciones.' : 'Las rectas nunca se cruzan: el sistema no tiene solución.' });
      return { steps, result: NaN };
    }
    let y;
    if (E1.a === 0 || E2.a === 0) {
      const E = E1.a === 0 ? E1 : E2; y = E.d / E.c;
      steps.push({ expr: `y = ${this.num(E.d)} ÷ ${this.num(E.c)} = ${this.num(y)}`, msg: `La ecuación (${E === E1 ? 1 : 2}) no tiene x: despeja y directamente.` });
    } else {
      const k1 = E2.a, k2 = E1.a, c = E1.c * k1 - E2.c * k2, d = E1.d * k1 - E2.d * k2;
      const mul = (k) => (k < 0 ? `×(${this.num(k)})` : `×${this.num(k)}`);
      if (k1 !== 1 || k2 !== 1) steps.push({ expr: `(1)${mul(k1)}: ${this.lin3(E1.a * k1, E1.c * k1, E1.d * k1)}   ;   (2)${mul(k2)}: ${this.lin3(E2.a * k2, E2.c * k2, E2.d * k2)}`, msg: `Multiplica la (1) por ${this.num(k1)} y la (2) por ${this.num(k2)} para que la x tenga el mismo número en las dos.` });
      steps.push({ expr: `${this.lin3(0, c, d)}`, msg: 'Resta una ecuación de la otra: las x se eliminan y queda solo la y.' });
      y = d / c;
      steps.push({ expr: `y = ${this.num(d)} ÷ ${this.num(c)} = ${this.num(y)}`, msg: `Divide entre ${this.num(c)} para despejar y.` });
    }
    const E = E1.a !== 0 ? E1 : E2, rest = E.d - E.c * y, x = rest / E.a;
    const cx = E.a === 1 ? 'x' : E.a === -1 ? '−x' : `${this.num(E.a)}x`, cy = `${E.c < 0 ? '−' : '+'} ${Math.abs(E.c) === 1 ? '' : this.num(Math.abs(E.c)) + '·'}(${this.num(y)})`;
    steps.push({ expr: `${cx} ${cy} = ${this.num(E.d)}  →  x = ${E.a === 1 ? this.num(x) : `${this.num(rest)} ÷ ${this.num(E.a)} = ${this.num(x)}`}`, msg: `Sustituye y = ${this.num(y)} en la ecuación (${E === E1 ? 1 : 2}) y despeja x.` });
    this._y = y; const c1 = Math.abs(this.eval(e1[0], x) - this.eval(e1[1], x)) < 1e-6, c2 = Math.abs(this.eval(e2[0], x) - this.eval(e2[1], x)) < 1e-6; this._y = undefined;
    steps.push({ expr: `x = ${this.num(x)}   ,   y = ${this.num(y)}`, msg: `Comprobación en las dos ecuaciones: ${c1 && c2 ? '✓ ¡las dos se cumplen!' : 'revisa los datos.'}` });
    return { steps, result: x, y };
  },
  solve(src) {
    const parts = String(src).split(/[;\n]/).map((t) => t.trim()).filter(Boolean);
    if (parts.length === 2) {
      const e1 = this.parse(parts[0]), e2 = this.parse(parts[1]);
      if (e1.length !== 2 || e2.length !== 2) throw new Error('falta =');
      return { kind: 'sys', ...this.systemSteps(e1, e2) };
    }
    if (/y/i.test(src)) throw new Error('y sola');
    const sides = this.parse(src);
    if (sides.length === 2) return { kind: 'eq', ...this.equationSteps(sides[0], sides[1]) };
    if (JSON.stringify(sides[0]).includes('"k":"x"')) throw new Error('falta =');
    return { kind: 'arit', ...this.arithmeticSteps(sides[0]) };
  },
  same(input, expected, tol = 0.011) { try { const v = this.value(input); return Math.abs(v - expected) <= Math.max(tol, Math.abs(expected) * 1e-4); } catch { return null; } },
};

/* ---------- widgets interactivos de las lecciones ---------- */
const svgNS = (vb, inner, extra = '') => `<svg class="viz" viewBox="${vb}" ${extra}>${inner}</svg>`;
const bindSliders = (el, ids, draw, units = {}) => {
  ids.forEach((id) => { const i = $('#' + id, el); i.oninput = () => { $('#' + id + '-o', el).textContent = fmt(+i.value, 3) + (units[id] || ''); draw(); }; });
  draw();
};
const val = (el, id) => +$('#' + id, el).value;
const WIDGETS = {
  numberline(el) {
    el.innerHTML = `${svgNS('-11 -3 22 6', '', 'id="w-nl" style="max-width:520px;margin:0 auto"')}<div class="readout" id="w-nl-r"></div><div class="controls">${slider('w-a', 'inicio', -10, 10, 1, 3)}${slider('w-b', 'sumo', -10, 10, 1, -5)}</div>`;
    bindSliders(el, ['w-a', 'w-b'], () => {
      const a = val(el, 'w-a'), b = val(el, 'w-b'), r = a + b; let s = '<line x1="-10.5" y1="0" x2="10.5" y2="0" stroke="var(--muted)" stroke-width=".08"/>';
      for (let i = -10; i <= 10; i++) s += `<line x1="${i}" y1="-.2" x2="${i}" y2=".2" stroke="var(--muted)" stroke-width=".05"/>${i % 2 === 0 ? `<text x="${i}" y=".9" font-size=".55" text-anchor="middle" class="svg-text" style="font-size:.55px">${i}</text>` : ''}`;
      if (r >= -10 && r <= 10) s += `<path d="M${a} -.6 Q${(a + r) / 2} ${-1.6 - Math.abs(b) * .08} ${r} -.6" fill="none" stroke="${b >= 0 ? 'var(--ok)' : '#ff7a2f'}" stroke-width=".12"/><circle cx="${r}" cy="0" r=".3" fill="${b >= 0 ? 'var(--ok)' : '#ff7a2f'}"/>`;
      s += `<circle cx="${a}" cy="0" r=".28" fill="var(--accent)"/>`;
      $('#w-nl', el).innerHTML = s;
      $('#w-nl-r', el).innerHTML = `<span>${a} ${b < 0 ? '− ' + -b : '+ ' + b} = <b>${r}</b></span><span>${b >= 0 ? 'Sumar: muévete a la derecha →' : 'Restar: muévete a la izquierda ←'}</span>`;
    });
  },
  fraction(el) {
    el.innerHTML = `<div id="w-fr" style="max-width:260px;margin:0 auto"></div><div class="readout" id="w-fr-r"></div><div class="controls">${slider('w-n', 'partes tomadas', 0, 12, 1, 3)}${slider('w-d', 'partes totales', 1, 12, 1, 4)}</div>`;
    bindSliders(el, ['w-n', 'w-d'], () => {
      const d = val(el, 'w-d'); const ni = $('#w-n', el); if (+ni.value > d) { ni.value = d; $('#w-n-o', el).textContent = d; } const n = +ni.value; let s = '';
      for (let i = 0; i < d; i++) { const a0 = i / d * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / d * 2 * Math.PI - Math.PI / 2; s += d === 1 ? `<circle r="90" fill="${n ? '#ff6b4a' : '#ffe2a8'}" stroke="var(--surface)" stroke-width="3"/>` : `<path d="M0 0 L${90 * Math.cos(a0)} ${90 * Math.sin(a0)} A90 90 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${90 * Math.cos(a1)} ${90 * Math.sin(a1)} Z" fill="${i < n ? '#ff6b4a' : '#ffe2a8'}" stroke="var(--surface)" stroke-width="3"/>`; }
      $('#w-fr', el).innerHTML = svgNS('-100 -100 200 200', s);
      const g = gcd(n, d) || 1;
      $('#w-fr-r', el).innerHTML = `<span><b>${n}/${d}</b></span>${g > 1 && n ? `<span>= ${n / g}/${d / g} (simplificada)</span>` : ''}<span>= ${fmt(n / d, 3)}</span><span>= ${fmt(n / d * 100, 1)}%</span>`;
    });
  },
  powers(el) {
    el.innerHTML = `<div class="big-expr" id="w-pw" style="font-size:clamp(1.6rem,7vw,2.4rem)"></div><p class="center muted" id="w-pw-r" style="font-weight:700"></p><div class="controls">${slider('w-b', 'base', 2, 10, 1, 2)}${slider('w-e', 'exponente', -3, 6, 1, 3)}</div>`;
    bindSliders(el, ['w-b', 'w-e'], () => {
      const b = val(el, 'w-b'), e = val(el, 'w-e'), v = b ** e;
      $('#w-pw', el).innerHTML = `${b}<sup>${e}</sup> = ${MathX.num(v)}`;
      $('#w-pw-r', el).textContent = e > 0 ? `${Array(e).fill(b).join(' × ')}: multiplica la base ${e} ${e === 1 ? 'vez' : 'veces'}.` : e === 0 ? 'Cualquier número (excepto 0) elevado a 0 da 1.' : `Exponente negativo = 1 ÷ ${b}^${-e} = 1 ÷ ${b ** -e}.`;
    });
  },
  balance(el) {
    el.innerHTML = `<div class="big-expr" style="font-size:2rem">2x + 3 = 11</div>${svgNS('0 0 300 120', '', 'id="w-bl"')}<div class="readout" id="w-bl-r"></div><div class="controls">${slider('w-x', 'prueba x =', 0, 8, 1, 1)}</div>`;
    bindSliders(el, ['w-x'], () => {
      const x = val(el, 'w-x'), L = 2 * x + 3, R = 11, t = clamp((R - L) * 2.5, -16, 16);
      $('#w-bl', el).innerHTML = `<path d="M150 60 L135 110 H165 Z" fill="var(--muted)"/><g transform="rotate(${t} 150 60)"><rect x="30" y="56" width="240" height="7" rx="3" fill="#c08a4a"/><rect x="40" y="${30}" width="70" height="26" rx="6" fill="var(--accent)"/><text x="75" y="48" text-anchor="middle" fill="#fff" font-weight="800" font-size="14">${L}</text><rect x="190" y="30" width="70" height="26" rx="6" fill="#94a3b8"/><text x="225" y="48" text-anchor="middle" fill="#fff" font-weight="800" font-size="14">11</text></g>`;
      $('#w-bl-r', el).innerHTML = `<span>Izquierda: 2·${x} + 3 = <b>${L}</b></span><span>${L === R ? '✓ ¡Equilibrio! x = 4' : L < R ? 'La izquierda pesa menos: prueba un x mayor' : 'La izquierda pesa más: prueba un x menor'}</span>`;
    });
  },
  slope(el) {
    el.innerHTML = `<div id="w-sl"></div><div class="readout" id="w-sl-r"></div><div class="controls">${slider('w-m', 'pendiente m', -3, 3, .5, 1)}${slider('w-c', 'corte b', -4, 4, 1, 1)}</div>`;
    bindSliders(el, ['w-m', 'w-c'], () => {
      const m = val(el, 'w-m'), b = val(el, 'w-c');
      $('#w-sl', el).innerHTML = plotSVG(`<path d="${pathOf((x) => m * x + b)}" fill="none" stroke="var(--accent)" stroke-width=".16"/><circle cx="0" cy="${b}" r=".25" fill="#ff7a2f"/><path d="M1 ${m + b} H2 V${2 * m + b}" fill="none" stroke="#ff7a2f" stroke-width=".08" stroke-dasharray=".2 .15"/>`);
      $('#w-sl-r', el).innerHTML = `<span>y = ${fmt(m)}x ${b < 0 ? '− ' + -b : '+ ' + b}</span><span>x=0 → y=${b}</span><span>x=1 → y=${fmt(m + b)}</span><span>x=2 → y=${fmt(2 * m + b)}</span>`;
    });
  },
  triangle(el) {
    el.innerHTML = `${svgNS('0 0 260 170', '', 'id="w-tr" style="max-width:420px;margin:0 auto"')}<div class="readout" id="w-tr-r"></div><div class="controls">${slider('w-t', 'ángulo θ', 10, 80, 1, 37, '°')}</div>`;
    bindSliders(el, ['w-t'], () => {
      const t = val(el, 'w-t') * Math.PI / 180, h = 5, op = h * Math.sin(t), ad = h * Math.cos(t), k = 40;
      const X0 = 20, Y0 = 150, X1 = X0 + ad * k, Y1 = Y0 - op * k;
      $('#w-tr', el).innerHTML = `<path d="M${X0} ${Y0} L${X1} ${Y0} L${X1} ${Y1} Z" fill="color-mix(in srgb, var(--accent) 15%, transparent)" stroke="var(--ink)" stroke-width="2.5"/><rect x="${X1 - 12}" y="${Y0 - 12}" width="12" height="12" fill="none" stroke="var(--muted)"/>
        <path d="M${X0 + 28} ${Y0} A28 28 0 0 0 ${X0 + 28 * Math.cos(t)} ${Y0 - 28 * Math.sin(t)}" fill="none" stroke="#ff7a2f" stroke-width="2.5"/><text x="${X0 + 34}" y="${Y0 - 8}" font-size="12" fill="#ff7a2f" font-weight="800">θ</text>
        <text x="${(X0 + X1) / 2}" y="${Y0 + 16}" text-anchor="middle" font-size="11" fill="#2f7df6" font-weight="800">adyacente ${fmt(ad)}</text>
        <text x="${X1 + 6}" y="${(Y0 + Y1) / 2}" font-size="11" fill="#ef4444" font-weight="800">opuesto ${fmt(op)}</text>
        <text x="${(X0 + X1) / 2 - 18}" y="${(Y0 + Y1) / 2 - 6}" text-anchor="end" font-size="11" fill="var(--ink)" font-weight="800">hipotenusa 5</text>`;
      $('#w-tr-r', el).innerHTML = `<span style="color:#ef4444">sin θ = op/hip = ${fmt(op / h, 3)}</span><span style="color:#2f7df6">cos θ = ady/hip = ${fmt(ad / h, 3)}</span><span>tan θ = op/ady = ${fmt(op / ad, 3)}</span><span>${fmt(op)}² + ${fmt(ad)}² = ${fmt(op * op + ad * ad, 1)} = 5²</span>`;
    });
  },
  tangent(el) {
    el.innerHTML = `<div id="w-tg"></div><div class="readout" id="w-tg-r"></div><div class="controls">${slider('w-x0', 'punto x', -2, 2, .5, 1)}${slider('w-hh', 'distancia h', .1, 2, .1, 1.5)}</div>`;
    bindSliders(el, ['w-x0', 'w-hh'], () => {
      const x0 = val(el, 'w-x0'), h = val(el, 'w-hh'), f = (x) => x * x, ms = (f(x0 + h) - f(x0)) / h, mt = 2 * x0;
      $('#w-tg', el).innerHTML = plotSVG(`<path d="${pathOf(f)}" fill="none" stroke="var(--accent)" stroke-width=".16"/><path d="${pathOf((x) => f(x0) + ms * (x - x0))}" fill="none" stroke="#94a3b8" stroke-width=".1" stroke-dasharray=".3 .2"/><path d="${pathOf((x) => f(x0) + mt * (x - x0))}" fill="none" stroke="#ff7a2f" stroke-width=".12"/><circle cx="${x0}" cy="${f(x0)}" r=".22" fill="#ffc53d"/><circle cx="${x0 + h}" cy="${f(x0 + h)}" r=".18" fill="#94a3b8"/>`);
      $('#w-tg-r', el).innerHTML = `<span>f(x) = x²</span><span style="color:#94a3b8">pendiente secante (h=${fmt(h)}) = ${fmt(ms, 3)}</span><span style="color:#ff7a2f">derivada f'(${fmt(x0)}) = 2·${fmt(x0)} = ${fmt(mt)}</span>`;
    });
  },
  vector(el) {
    el.innerHTML = `<svg class="viz" id="w-vc" viewBox="-6.5 -6.5 13 13" style="max-width:360px;margin:0 auto"></svg><div class="readout" id="w-vc-r"></div><div class="controls">${slider('w-vx', 'x (horizontal)', -6, 6, 1, 4)}${slider('w-vy', 'y (vertical)', -6, 6, 1, 3)}</div>`;
    bindSliders(el, ['w-vx', 'w-vy'], () => {
      const x = val(el, 'w-vx'), y = val(el, 'w-vy'), m = Math.hypot(x, y), a = Math.atan2(y, x) * 180 / Math.PI; let g = '';
      for (let i = -6; i <= 6; i++) g += `<line x1="${i}" y1="-6.5" x2="${i}" y2="6.5" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/><line x1="-6.5" y1="${i}" x2="6.5" y2="${i}" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/>`;
      $('#w-vc', el).innerHTML = g + `<line x1="0" y1="0" x2="${x}" y2="0" stroke="#2f7df6" stroke-width=".1" stroke-dasharray=".25 .15"/><line x1="${x}" y1="0" x2="${x}" y2="${-y}" stroke="#ef4444" stroke-width=".1" stroke-dasharray=".25 .15"/><line x1="0" y1="0" x2="${x}" y2="${-y}" stroke="#ff7a2f" stroke-width=".2" stroke-linecap="round"/><circle cx="${x}" cy="${-y}" r=".3" fill="#ff7a2f"/>`;
      $('#w-vc-r', el).innerHTML = `<span>v = (${x}, ${y})</span><span>|v| = √(${x}² + ${y}²) = ${fmt(m, 2)}</span><span>dirección ≈ ${fmt(a, 0)}°</span>`;
    });
  },
  motion(el) {
    el.innerHTML = `${svgNS('0 0 300 90', '', 'id="w-mv"')}<div class="readout" id="w-mv-r"></div><div class="controls">${slider('w-v0', 'velocidad inicial', 0, 10, 1, 2, ' m/s')}${slider('w-ac', 'aceleración', -2, 4, .5, 1, ' m/s²')}${slider('w-tt', 'tiempo', 0, 6, .5, 3, ' s')}</div>`;
    bindSliders(el, ['w-v0', 'w-ac', 'w-tt'], () => {
      const v0 = val(el, 'w-v0'), a = val(el, 'w-ac'), t = val(el, 'w-tt'), x = v0 * t + a * t * t / 2, v = v0 + a * t, px = clamp(10 + x * 2.8, 10, 280);
      let ticks = ''; for (let m = 0; m <= 100; m += 10) ticks += `<line x1="${10 + m * 2.8}" y1="62" x2="${10 + m * 2.8}" y2="68" stroke="var(--muted)"/><text x="${10 + m * 2.8}" y="80" text-anchor="middle" class="svg-text">${m}</text>`;
      $('#w-mv', el).innerHTML = `<line x1="10" y1="62" x2="290" y2="62" stroke="var(--muted)" stroke-width="2"/>${ticks}<text x="${px}" y="56" text-anchor="middle" font-size="26">🚗</text>`;
      $('#w-mv-r', el).innerHTML = `<span>posición x = v₀t + ½at² = ${fmt(x, 2)} m</span><span>velocidad v = v₀ + at = ${fmt(v, 2)} m/s</span>`;
    }, { 'w-v0': ' m/s', 'w-ac': ' m/s²', 'w-tt': ' s' });
  },
  newton(el) {
    el.innerHTML = `${svgNS('0 0 300 80', '', 'id="w-nw"')}<div class="readout" id="w-nw-r"></div><div class="controls">${slider('w-f', 'fuerza F', 0, 100, 5, 40, ' N')}${slider('w-m', 'masa m', 1, 50, 1, 10, ' kg')}</div>`;
    let x = 20, raf;
    const loop = () => { if (!document.body.contains(el)) return cancelAnimationFrame(raf); const a = val(el, 'w-f') / val(el, 'w-m'); x += a * .25; if (x > 270) x = 20; const box = $('#w-box', el); if (box) box.setAttribute('x', x); raf = requestAnimationFrame(loop); };
    bindSliders(el, ['w-f', 'w-m'], () => {
      const F = val(el, 'w-f'), m = val(el, 'w-m'), a = F / m, sz = 16 + m * .5;
      $('#w-nw', el).innerHTML = `<line x1="0" y1="70" x2="300" y2="70" stroke="var(--muted)" stroke-width="2"/><rect id="w-box" x="${x}" y="${70 - sz}" width="${sz}" height="${sz}" rx="3" fill="var(--accent)"/>`;
      $('#w-nw-r', el).innerHTML = `<span>a = F / m = ${F} / ${m} = <b>${fmt(a, 2)} m/s²</b></span><span>${a > 5 ? 'Acelera mucho' : a > 1 ? 'Acelera moderado' : 'Acelera poco'}</span>`;
    }, { 'w-f': ' N', 'w-m': ' kg' });
    raf = requestAnimationFrame(loop);
  },
  ohm(el) {
    el.innerHTML = `${svgNS('0 0 300 150', '', 'id="w-oh" style="max-width:440px;margin:0 auto"')}<div class="readout" id="w-oh-r"></div><div class="controls">${slider('w-v', 'voltaje V', 0, 24, 1, 12, ' V')}${slider('w-r', 'resistencia R', 1, 60, 1, 12, ' Ω')}</div>`;
    bindSliders(el, ['w-v', 'w-r'], () => {
      const V = val(el, 'w-v'), R = val(el, 'w-r'), I = V / R, glow = clamp(I / 2, 0, 1), dur = I ? clamp(3 / I, .4, 8) : 0;
      $('#w-oh', el).innerHTML = `<path d="M40 30 H260 V120 H40 Z" fill="none" stroke="${I ? '#ffc53d' : 'var(--muted)'}" stroke-width="3"/>
        <rect x="25" y="55" width="30" height="40" fill="var(--surface)"/><line x1="28" y1="65" x2="52" y2="65" stroke="var(--ink)" stroke-width="4"/><line x1="33" y1="75" x2="47" y2="75" stroke="var(--ink)" stroke-width="4"/><line x1="28" y1="85" x2="52" y2="85" stroke="var(--ink)" stroke-width="4"/><text x="4" y="80" class="svg-text">${V}V</text>
        <rect x="120" y="20" width="60" height="20" rx="5" fill="#d9b382" stroke="#8a6a3a" stroke-width="2"/><text x="150" y="14" text-anchor="middle" class="svg-text">${R} Ω</text>
        <circle cx="260" cy="75" r="${10 + glow * 18}" fill="#ffd23f" opacity="${glow * .5}"/><circle cx="260" cy="75" r="12" fill="${I ? '#ffe680' : '#777'}" stroke="var(--ink)" stroke-width="2"/>
        ${I ? `<circle r="4" fill="#ffc53d"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M40 30 H260 V120 H40 Z"/></circle><circle r="4" fill="#ffc53d"><animateMotion dur="${dur}s" begin="-${dur / 2}s" repeatCount="indefinite" path="M40 30 H260 V120 H40 Z"/></circle>` : ''}`;
      $('#w-oh-r', el).innerHTML = `<span>I = V / R = ${V} / ${R} = <b>${fmt(I, 2)} A</b></span><span>${I > 1.5 ? 'Mucha corriente: el bombillo brilla fuerte' : I > .3 ? 'Corriente media' : 'Poca corriente'}</span>`;
    }, { 'w-v': ' V', 'w-r': ' Ω' });
  },
  circuit(el) {
    el.innerHTML = `<div class="seg" role="group" aria-label="Tipo de conexión" style="margin-bottom:10px"><button data-mode="s" aria-pressed="true">Serie</button><button data-mode="p" aria-pressed="false">Paralelo</button></div>${svgNS('0 0 300 140', '', 'id="w-ci" style="max-width:440px;margin:0 auto"')}<div class="readout" id="w-ci-r"></div><div class="controls">${slider('w-r1', 'R₁', 1, 30, 1, 10, ' Ω')}${slider('w-r2', 'R₂', 1, 30, 1, 20, ' Ω')}</div>`;
    let mode = 's';
    const draw = () => {
      const R1 = val(el, 'w-r1'), R2 = val(el, 'w-r2'), V = 12, Req = mode === 's' ? R1 + R2 : R1 * R2 / (R1 + R2), I = V / Req;
      const res = (x, y, l) => `<rect x="${x - 22}" y="${y - 9}" width="44" height="18" rx="4" fill="#d9b382" stroke="#8a6a3a" stroke-width="2"/><text x="${x}" y="${y - 13}" text-anchor="middle" class="svg-text">${l}</text>`;
      $('#w-ci', el).innerHTML = mode === 's'
        ? `<path d="M40 30 H260 V115 H40 Z" fill="none" stroke="#ffc53d" stroke-width="3"/>${res(110, 30, `R₁ ${R1}Ω`)}${res(200, 30, `R₂ ${R2}Ω`)}<text x="12" y="78" class="svg-text">12V</text>`
        : `<path d="M40 70 H100 M200 70 H260 V120 H40 V70 M100 40 V100 M200 40 V100 M100 40 H200 M100 100 H200" fill="none" stroke="#ffc53d" stroke-width="3"/>${res(150, 40, `R₁ ${R1}Ω`)}${res(150, 100, `R₂ ${R2}Ω`)}<text x="12" y="100" class="svg-text">12V</text>`;
      $('#w-ci-r', el).innerHTML = mode === 's' ? `<span>Serie: R_eq = R₁ + R₂ = ${R1 + R2} Ω</span><span>I = 12/${fmt(Req)} = ${fmt(I, 2)} A (la misma en ambas)</span>` : `<span>Paralelo: 1/R_eq = 1/${R1} + 1/${R2} → R_eq = ${fmt(Req, 2)} Ω</span><span>I total = ${fmt(I, 2)} A (se reparte)</span>`;
    };
    $$('[data-mode]', el).forEach((b) => b.onclick = () => { mode = b.dataset.mode; $$('[data-mode]', el).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
    bindSliders(el, ['w-r1', 'w-r2'], draw, { 'w-r1': ' Ω', 'w-r2': ' Ω' });
  },
  logic(el) {
    const st = { A: 1, B: 0 };
    const draw = () => {
      const { A, B } = st, rows = [['AND (y)', A & B, 'Solo 1 si A y B son 1'], ['OR (o)', A | B, '1 si al menos uno es 1'], ['NOT A (no)', 1 - A, 'Invierte A'], ['XOR (o exclusivo)', A ^ B, '1 si son distintos']];
      el.innerHTML = `<div class="row" style="justify-content:center;margin-bottom:12px">${['A', 'B'].map((k) => `<button class="gate-btn" data-in="${k}" aria-pressed="${!!st[k]}" style="min-width:110px">${k} = ${st[k]} ${st[k] ? '🟢' : '⚫'}</button>`).join('')}</div>
        <table class="tt"><tbody>${rows.map(([n, v, d]) => `<tr class="${v ? 'match' : ''}"><td style="text-align:left">${n}</td><td>${v} ${v ? '💡' : '⚫'}</td><td class="muted" style="font-size:.8rem;text-align:left">${d}</td></tr>`).join('')}</tbody></table>`;
      $$('[data-in]', el).forEach((b) => b.onclick = () => { st[b.dataset.in] ^= 1; Sfx.play('tap'); draw(); });
    };
    draw();
  },
  binary(el) {
    el.innerHTML = `<div class="row" id="w-bits" style="justify-content:center;gap:8px"></div><div class="big-expr" id="w-bn" style="font-size:2rem"></div><p class="center muted" id="w-bn-r" style="font-weight:700"></p>`;
    const bits = [0, 1, 0, 1];
    const draw = () => {
      const n = bits.reduce((s, b, i) => s + b * 2 ** (3 - i), 0);
      $('#w-bits', el).innerHTML = bits.map((b, i) => `<button class="gate-btn" data-b="${i}" style="min-width:64px">${b}<br><small class="muted">${2 ** (3 - i)}</small></button>`).join('');
      $('#w-bn', el).textContent = `${bits.join('')}₂ = ${n}`;
      $('#w-bn-r', el).textContent = bits.map((b, i) => (b ? 2 ** (3 - i) : null)).filter((x) => x !== null).join(' + ') + (n ? ` = ${n}` : '0');
      $$('[data-b]', el).forEach((b) => b.onclick = () => { bits[+b.dataset.b] ^= 1; Sfx.play('tap'); draw(); });
    };
    draw();
  },
  code(el, p) {
    let i = 0;
    const draw = () => {
      const s = p.trace[i];
      el.innerHTML = `<div class="code">${p.lines.map((l, k) => `<button style="cursor:default;${k === s.line ? 'background:color-mix(in srgb, var(--accent) 22%, transparent)' : ''}"><span class="ln">${k === s.line ? '▶' : k + 1}</span>${esc(l)}</button>`).join('')}</div>
        <div class="readout">${Object.entries(s.vars).map(([k, v]) => `<span>${k} = <b>${esc(v)}</b></span>`).join('') || '<span class="muted">sin variables aún</span>'}</div>
        ${s.out ? `<p class="center" style="font-weight:800">Pantalla: <code>${esc(s.out)}</code></p>` : ''}<p class="center muted" style="font-weight:700">${esc(s.note || '')}</p>
        <div class="row"><button class="btn ghost sm" data-r>↺ Reiniciar</button><button class="btn grow" data-n ${i >= p.trace.length - 1 ? 'disabled' : ''}>Ejecutar siguiente línea ▶</button></div>`;
      $('[data-n]', el).onclick = () => { i++; Sfx.play('tap'); draw(); };
      $('[data-r]', el).onclick = () => { i = 0; draw(); };
    };
    draw();
  },
  lever(el) {
    el.innerHTML = `${svgNS('-130 -80 260 120', '', 'id="w-lv" style="max-width:460px;margin:0 auto"')}<div class="readout" id="w-lv-r"></div><div class="controls">${slider('w-m1', 'masa izq.', 1, 10, 1, 6, ' kg')}${slider('w-d1', 'distancia izq.', 1, 5, 1, 2, ' m')}${slider('w-m2', 'masa der.', 1, 10, 1, 3, ' kg')}${slider('w-d2', 'distancia der.', 1, 5, 1, 3, ' m')}</div>`;
    bindSliders(el, ['w-m1', 'w-d1', 'w-m2', 'w-d2'], () => {
      const m1 = val(el, 'w-m1'), d1 = val(el, 'w-d1'), m2 = val(el, 'w-m2'), d2 = val(el, 'w-d2'), t1 = m1 * d1, t2 = m2 * d2, tilt = clamp((t2 - t1) * 1.5, -14, 14), u = 22;
      const box = (x, m, c) => `<rect x="${x - 10}" y="${-6 - (10 + m * 3)}" width="20" height="${10 + m * 3}" rx="3" fill="${c}"/><text x="${x}" y="-10" text-anchor="middle" fill="#fff" font-size="9" font-weight="800">${m}</text>`;
      $('#w-lv', el).innerHTML = `<path d="M0 0 L-14 32 H14 Z" fill="var(--muted)"/><g transform="rotate(${tilt})" style="transition:transform .4s"><rect x="-120" y="-6" width="240" height="8" rx="4" fill="#c08a4a"/>${box(-d1 * u, m1, '#2f7df6')}${box(d2 * u, m2, '#ff7a2f')}</g>`;
      $('#w-lv-r', el).innerHTML = `<span style="color:#2f7df6">torque izq. = ${m1}·${d1} = ${t1}</span><span style="color:#ff7a2f">torque der. = ${m2}·${d2} = ${t2}</span><span>${t1 === t2 ? '✓ ¡Equilibrio!' : t1 > t2 ? 'Gana la izquierda' : 'Gana la derecha'}</span>`;
    }, { 'w-m1': ' kg', 'w-d1': ' m', 'w-m2': ' kg', 'w-d2': ' m' });
  },
  gear(el) {
    el.innerHTML = `${svgNS('0 0 300 150', '', 'id="w-gr"')}<div class="readout" id="w-gr-r"></div><div class="controls">${slider('w-n1', 'dientes motor', 8, 40, 4, 12)}${slider('w-n2', 'dientes salida', 8, 40, 4, 36)}${slider('w-rp', 'rpm motor', 10, 120, 10, 60)}</div>`;
    bindSliders(el, ['w-n1', 'w-n2', 'w-rp'], () => {
      const n1 = val(el, 'w-n1'), n2 = val(el, 'w-n2'), w1 = val(el, 'w-rp'), w2 = w1 * n1 / n2, k = 1.4, r1 = n1 * k / 2 + 6, r2 = n2 * k / 2 + 6, x1 = 20 + r1, x2 = x1 + r1 + r2 - 2;
      const g = (x, n, r, w, cw, c) => `<g transform="translate(${x},75)"><g class="spin" style="animation-duration:${(60 / w) * 3}s;animation-direction:${cw ? 'normal' : 'reverse'}"><path d="${gearPath(n, r)}" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><circle r="${r * .35}" fill="var(--surface)"/><rect x="-1.5" y="${-r + 4}" width="3" height="${r * .4}" fill="rgba(0,0,0,.3)"/></g></g>`;
      $('#w-gr', el).setAttribute('viewBox', `0 0 ${Math.max(300, x2 + r2 + 20)} 150`);
      $('#w-gr', el).innerHTML = g(x1, n1, r1, w1, true, '#94a3b8') + g(x2, n2, r2, w2, false, 'var(--accent)');
      $('#w-gr-r', el).innerHTML = `<span>relación = ${n2}/${n1} = ${fmt(n2 / n1, 2)}</span><span>salida = ${w1}·${n1}/${n2} = <b>${fmt(w2, 1)} rpm</b></span><span>fuerza de giro ×${fmt(n2 / n1, 2)}</span>`;
    });
  },
  riemann(el) {
    el.innerHTML = `${svgNS('0 0 300 190', '', 'id="w-rm"')}<div class="readout" id="w-rm-r"></div><div class="controls">${slider('w-rn', 'rectángulos', 1, 40, 1, 4)}</div>`;
    bindSliders(el, ['w-rn'], () => {
      const n = val(el, 'w-rn'), f = (x) => x * x, A = 0, B = 2, X = (x) => 25 + x * 120, Y = (y) => 170 - y * 36, dx = (B - A) / n; let sum = 0, rects = '';
      for (let i = 0; i < n; i++) { const xm = A + (i + .5) * dx, h = f(xm); sum += h * dx; rects += `<rect x="${X(A + i * dx)}" y="${Y(h)}" width="${dx * 120}" height="${170 - Y(h)}" fill="color-mix(in srgb, var(--accent) 35%, transparent)" stroke="var(--accent)" stroke-width="${n > 20 ? .4 : 1}"/>`; }
      let curve = ''; for (let x = 0; x <= 2.1; x += .02) curve += `${curve ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)} `;
      $('#w-rm', el).innerHTML = `<line x1="25" y1="170" x2="290" y2="170" stroke="var(--muted)" stroke-width="2"/><line x1="25" y1="10" x2="25" y2="170" stroke="var(--muted)" stroke-width="2"/>${rects}<path d="${curve}" fill="none" stroke="#ff7a2f" stroke-width="3"/><text x="${X(2) - 4}" y="184" class="svg-text">2</text><text x="${X(1) - 4}" y="184" class="svg-text">1</text><text x="200" y="40" class="svg-text" style="fill:#ff7a2f">f(x) = x²</text>`;
      $('#w-rm-r', el).innerHTML = `<span>suma de ${n} rectángulos = <b>${fmt(sum, 4)}</b></span><span>área exacta = 8/3 ≈ 2,6667</span><span>error = ${fmt(Math.abs(8 / 3 - sum), 4)}</span>`;
    });
  },
  matrix(el) {
    el.innerHTML = `<svg class="viz" id="w-mx" viewBox="-5.5 -5.5 11 11" style="max-width:360px;margin:0 auto"></svg><div class="readout" id="w-mx-r"></div><div class="controls">${slider('w-ma', 'a', -2, 2, .5, 1)}${slider('w-mb', 'b', -2, 2, .5, .5)}${slider('w-mc', 'c', -2, 2, .5, 0)}${slider('w-md', 'd', -2, 2, .5, 1)}</div>`;
    bindSliders(el, ['w-ma', 'w-mb', 'w-mc', 'w-md'], () => {
      const a = val(el, 'w-ma'), b = val(el, 'w-mb'), c = val(el, 'w-mc'), d = val(el, 'w-md'), T = (x, y) => [a * x + b * y, c * x + d * y];
      let g = ''; for (let i = -5; i <= 5; i++) g += `<line x1="${i}" y1="-5.5" x2="${i}" y2="5.5" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/><line x1="-5.5" y1="${i}" x2="5.5" y2="${i}" stroke="var(--line)" stroke-width="${i ? .03 : .07}"/>`;
      const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => T(x * 2, y * 2)), v = T(1, 2);
      $('#w-mx', el).innerHTML = g + `<path d="M0 0 H2 V-2 H0 Z" fill="none" stroke="var(--muted)" stroke-width=".06" stroke-dasharray=".2 .15"/><path d="M${sq.map(([x, y]) => `${x} ${-y}`).join(' L')} Z" fill="color-mix(in srgb, var(--accent) 30%, transparent)" stroke="var(--accent)" stroke-width=".1"/><line x1="0" y1="0" x2="1" y2="-2" stroke="#2f7df6" stroke-width=".12"/><line x1="0" y1="0" x2="${v[0]}" y2="${-v[1]}" stroke="#ff7a2f" stroke-width=".16"/><circle cx="${v[0]}" cy="${-v[1]}" r=".22" fill="#ff7a2f"/>`;
      $('#w-mx-r', el).innerHTML = `<span>M = [${fmt(a)} ${fmt(b)}; ${fmt(c)} ${fmt(d)}]</span><span style="color:#2f7df6">v = (1, 2)</span><span style="color:#ff7a2f">M·v = (${fmt(v[0])}, ${fmt(v[1])})</span><span>det = ${fmt(a)}·${fmt(d)} − ${fmt(b)}·${fmt(c)} = <b>${fmt(a * d - b * c)}</b></span>`;
    });
  },
  lines2(el) {
    el.innerHTML = `<div id="w-l2"></div><div class="readout" id="w-l2-r"></div><div class="controls">${slider('w-m1', 'm₁', -3, 3, .5, 1)}${slider('w-b1', 'b₁', -4, 4, 1, 1)}${slider('w-m2', 'm₂', -3, 3, .5, -1)}${slider('w-b2', 'b₂', -4, 4, 1, 3)}</div>`;
    bindSliders(el, ['w-m1', 'w-b1', 'w-m2', 'w-b2'], () => {
      const m1 = val(el, 'w-m1'), b1 = val(el, 'w-b1'), m2 = val(el, 'w-m2'), b2 = val(el, 'w-b2'), par = m1 === m2;
      const x = par ? NaN : (b2 - b1) / (m1 - m2), y = m1 * x + b1;
      $('#w-l2', el).innerHTML = plotSVG(`<path d="${pathOf((t) => m1 * t + b1)}" fill="none" stroke="#2f7df6" stroke-width=".14"/><path d="${pathOf((t) => m2 * t + b2)}" fill="none" stroke="#ff7a2f" stroke-width=".14"/>${par || Math.abs(x) > 6.5 || Math.abs(y) > 6.5 ? '' : `<circle cx="${x}" cy="${y}" r=".3" fill="#ffc53d" stroke="var(--ink)" stroke-width=".06"/>`}`);
      $('#w-l2-r', el).innerHTML = `<span style="color:#2f7df6">y = ${fmt(m1)}x ${b1 < 0 ? '− ' + -b1 : '+ ' + b1}</span><span style="color:#ff7a2f">y = ${fmt(m2)}x ${b2 < 0 ? '− ' + -b2 : '+ ' + b2}</span><span>${par ? (b1 === b2 ? 'Son la misma recta: infinitas soluciones' : 'Paralelas: no hay solución') : `Se cruzan en (${fmt(x)}, ${fmt(y)})`}</span>`;
    });
  },
  control(el) {
    el.innerHTML = `${svgNS('0 0 300 150', '', 'id="w-ct"')}<div class="readout" id="w-ct-r"></div><div class="controls">${slider('w-kp', 'Kp (reacción)', 0, .6, .02, .1)}${slider('w-ki', 'Ki (memoria)', 0, .04, .002, 0)}</div>`;
    bindSliders(el, ['w-kp', 'w-ki'], () => {
      const out = simPID(val(el, 'w-kp'), val(el, 'w-ki'), 0, 50, false), X = (i) => 20 + i * (270 / 300), Y = (T) => 140 - (T - 10) * (120 / 60);
      const fe = Math.abs(out[out.length - 1] - 50);
      $('#w-ct', el).innerHTML = `<line x1="20" y1="${Y(50)}" x2="290" y2="${Y(50)}" stroke="var(--ok)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="250" y="${Y(50) - 5}" class="svg-text">meta 50°</text><polyline points="${out.map((T, i) => `${X(i).toFixed(1)},${Y(clamp(T, 10, 70)).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
      $('#w-ct-r', el).innerHTML = `<span>temperatura final ${fmt(out[out.length - 1], 1)} °C</span><span>error ${fmt(fe, 2)} °C ${fe < .5 ? '✓' : ''}</span>`;
    });
  },
};

/* ---------- motor de lecciones ---------- */
const lessonById = (id) => LESSONS.find((l) => l.id === id);
const Learn = {
  rec(id) { const L = S().lessons || (S().lessons = {}); return L[id]; },
  next() { return LESSONS.find((l) => !this.rec(l.id)) || null; },
  academy() {
    chrome(true, 'academy'); const done = LESSONS.filter((l) => this.rec(l.id)).length, nx = this.next();
    $('#main').innerHTML = `<h1>📚 Academia</h1><p class="muted">Aprende desde cero: lee, mueve los elementos, escribe tus cálculos y resuelve retos. Tuerca te guía en cada paso.</p>
      <section class="card"><div class="row"><b class="grow">Tu avance: ${done}/${LESSONS.length} lecciones</b><span class="tag">${Math.round(done / LESSONS.length * 100)}%</span></div><div class="xpbar" style="margin-top:8px"><i style="width:${done / LESSONS.length * 100}%"></i></div>
        ${nx ? `<button class="btn block" style="margin-top:12px" data-go="#/lesson/${nx.id}">▶ Continuar: ${nx.icon} ${esc(nx.title)}</button>` : '<p style="margin:10px 0 0;font-weight:800">🎓 ¡Completaste todas las lecciones!</p>'}
        <div class="row" style="margin-top:10px"><button class="btn ghost sm grow" data-go="#/pizarra">✍️ Pizarra</button><button class="btn ghost sm grow" data-go="#/notebook">📒 Mi cuaderno</button></div></section>
      ${Object.entries(SUBJECTS).map(([k, v]) => `<h2 style="margin-top:18px">${v.icon} ${v.name}</h2>${LESSONS.filter((l) => l.subj === k).map((l, i) => { const r = this.rec(l.id); return `<button class="mod" style="--sc:${v.color}" data-go="#/lesson/${l.id}"><span class="ico" aria-hidden="true">${l.icon}</span><span class="grow"><h3>${i + 1}. ${esc(l.title)}</h3><p>${esc(l.desc)}</p><span class="meta">${r ? `<span class="tag new">✓ Aprendida</span><span class="stars">${'⭐'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</span>` : `<span class="tag">⏱ ${l.min} min</span>`}${l === nx ? '<span class="tag due">Siguiente</span>' : ''}</span></span></button>`; }).join('')}`).join('')}`;
  },
  lesson(id) {
    const L = lessonById(id); if (!L) return Router.nav('#/academy');
    chrome(false); Music.setTheme(L.subj);
    const st = { i: 0, ok: 0, total: L.blocks.filter((b) => b.t === 'try' || b.t === 'quiz').length, wrongs: [] };
    const render = () => {
      const b = L.blocks[st.i], last = st.i >= L.blocks.length;
      $('#main').innerHTML = `<div class="game-top"><button class="icon-btn" id="ls-x" aria-label="Salir de la lección">✕</button><div class="bar"><i style="width:${st.i / L.blocks.length * 100}%"></i></div><span class="count">${Math.min(st.i + 1, L.blocks.length)}/${L.blocks.length}</span></div>
        <p class="muted center" style="margin:0 0 6px;font-weight:800">${L.icon} ${esc(L.title)}</p><section class="card lesson" id="ls-card"></section><div id="ls-nav"></div>`;
      $('#ls-x').onclick = () => history.back();
      if (last) return this.finish(L, st);
      this.block(b, $('#ls-card'), st, () => { st.i++; render(); window.scrollTo(0, 0); });
    };
    render();
  },
  block(b, card, st, next) {
    const nav = $('#ls-nav'); const cont = (label = 'Continuar ▶', enabled = true) => { nav.innerHTML = `<div class="row"><button class="btn ghost sm" id="ls-say" aria-label="Leer en voz alta">🔊</button><button class="btn grow" id="ls-next" ${enabled ? '' : 'disabled'}>${label}</button></div>`; $('#ls-next').onclick = () => { Sfx.play('tap'); next(); }; $('#ls-say').onclick = () => Voice.speak(card.innerText); };
    if (b.t === 'text') { card.innerHTML = `${b.h ? `<h2>${b.h}</h2>` : ''}<div class="lesson-text">${b.p}</div>`; cont(); }
    else if (b.t === 'formula') { card.innerHTML = `${b.h ? `<h3>${b.h}</h3>` : ''}<div class="formula">${b.f}</div>${b.p ? `<div class="lesson-text">${b.p}</div>` : ''}`; cont(); }
    else if (b.t === 'widget') { card.innerHTML = `<h3>🧪 ${b.h || 'Experimenta'}</h3><p class="lesson-text">${b.p || ''}</p><div id="ls-w"></div>`; WIDGETS[b.w]($('#ls-w'), b); cont(); }
    else if (b.t === 'example') {
      let k = 0; card.innerHTML = `<h3>📝 Ejemplo resuelto</h3><p class="lesson-text"><b>${b.q}</b></p><ol class="steps" id="ls-steps"></ol>`;
      const reveal = () => { const ol = $('#ls-steps'); const li = document.createElement('li'); li.innerHTML = b.steps[k]; ol.append(li); k++; if (k < b.steps.length) cont('Siguiente paso ▼'), ($('#ls-next').onclick = () => { Sfx.play('tap'); reveal(); }); else cont(); };
      reveal();
    }
    else if (b.t === 'quiz') {
      card.innerHTML = `<h3>❓ Pregunta</h3><p class="lesson-text"><b>${b.q}</b></p><div class="quiz" id="ls-q">${b.o.map((o, i) => `<button class="btn ghost block" data-i="${i}" style="justify-content:flex-start;text-align:left;margin-bottom:8px">${o}</button>`).join('')}</div><div id="ls-fb"></div>`;
      cont('Responde para continuar', false);
      $$('#ls-q button').forEach((btn) => btn.onclick = () => {
        if ($('#ls-q').dataset.done) return; $('#ls-q').dataset.done = 1; const ok = +btn.dataset.i === b.c;
        btn.style.setProperty('--c', ok ? 'var(--ok)' : 'var(--bad)'); btn.style.setProperty('--ci', '#fff');
        if (!ok) { const r = $$('#ls-q button')[b.c]; r.style.setProperty('--c', 'var(--ok)'); r.style.setProperty('--ci', '#fff'); st.wrongs.push(b.q); }
        if (ok) st.ok++; Sfx.play(ok ? 'ok' : 'bad'); buzz(ok ? 15 : [30, 40, 30]);
        $('#ls-fb').innerHTML = `<div class="callout ${ok ? 'ok' : 'bad'}"><b>${ok ? '¡Correcto!' : 'No exactamente.'}</b> ${b.why}</div>`;
        Voice.speak((ok ? COMPANION.ok() + ' ' : 'No exactamente. ') + b.why); Mascot.react(ok ? 'happy' : 'oops', ok ? 'jump' : 'wiggle');
        cont();
      });
    }
    else if (b.t === 'try') this.tryBlock(b, card, st, cont);
  },
  // el usuario escribe su cálculo; si falla, Tuerca lo guía paso a paso
  tryBlock(b, card, st, cont) {
    let mode = 'final', k = 0, fails = 0, first = true;
    card.innerHTML = `<h3>✍️ Tu turno</h3><p class="lesson-text"><b>${b.q}</b></p><div id="ls-guide"></div>
      <form id="ls-form" class="row" autocomplete="off"><input type="text" id="ls-in" inputmode="text" placeholder="Escribe tu resultado o cálculo" aria-label="Tu respuesta" class="grow"><button class="btn" type="submit">Comprobar</button></form>
      <div class="chips" style="margin-top:8px">${['+', '−', '×', '÷', '^', '(', ')', '√', 'x', '/'].map((c) => `<button class="chip" type="button" data-k="${c}" style="min-width:46px">${c}</button>`).join('')}</div>
      <div id="ls-fb"></div><button class="btn ghost sm" id="ls-help" style="margin-top:10px">🤝 Guíame paso a paso</button>`;
    cont('Resuelve para continuar', false);
    const inp = $('#ls-in'), fb = $('#ls-fb'), guide = $('#ls-guide');
    $$('[data-k]', card).forEach((c) => c.onclick = () => { inp.value += c.dataset.k; inp.focus(); });
    const showStep = () => { const s = b.steps[k]; guide.innerHTML = `<div class="callout"><b>Paso ${k + 1} de ${b.steps.length}:</b> ${s.ask}</div>`; inp.value = ''; inp.placeholder = 'Resultado de este paso'; Voice.speak(`Paso ${k + 1}. ${s.ask}`); };
    const startGuide = () => { mode = 'steps'; k = 0; fails = 0; $('#ls-help').hidden = true; fb.innerHTML = ''; showStep(); };
    const done = (ok, msg) => {
      if (first) { if (ok) st.ok++; else st.wrongs.push(b.q.replace(/<[^>]+>/g, '')); }
      first = false; fb.innerHTML = `<div class="callout ok"><b>${ok ? '¡Correcto!' : '¡Lo lograste con ayuda!'}</b> ${msg}</div>`; $('#ls-form').hidden = true; $('#ls-help').hidden = true; card.querySelector('.chips').hidden = true;
      Sfx.play('ok'); Mascot.react('happy', 'jump'); Voice.speak((ok ? COMPANION.ok() + ' ' : 'Muy bien. ') + msg.replace(/<[^>]+>/g, '')); cont();
    };
    $('#ls-help').onclick = () => { if (first) { st.wrongs.push(b.q.replace(/<[^>]+>/g, '')); first = false; } startGuide(); };
    $('#ls-form').onsubmit = (e) => {
      e.preventDefault(); const v = inp.value.trim(); if (!v) return;
      if (mode === 'final') {
        const r = MathX.same(v, b.a, b.tol);
        if (r === null) { fb.innerHTML = '<div class="callout bad">No entendí ese cálculo. Usa números, + − × ÷ ^ y paréntesis.</div>'; return; }
        if (r) return done(true, b.explain);
        fails++; Sfx.play('bad'); buzz([30, 40, 30]);
        fb.innerHTML = `<div class="callout bad">Tu resultado ${MathX.num(MathX.value(v))} no es correcto. ${fails === 1 && b.hint ? 'Pista: ' + b.hint : 'Vamos paso a paso.'}</div>`;
        Voice.speak(fails === 1 && b.hint ? 'Casi. Pista: ' + b.hint : 'Vamos paso a paso.');
        if (fails >= 2 || !b.hint) { if (first) { st.wrongs.push(b.q.replace(/<[^>]+>/g, '')); first = false; } setTimeout(startGuide, 900); }
        return;
      }
      const s = b.steps[k], r = MathX.same(v, s.a, s.tol);
      if (r === null) { fb.innerHTML = '<div class="callout bad">No entendí. Escribe solo el número o el cálculo de este paso.</div>'; return; }
      if (r) { fb.innerHTML = `<div class="callout ok">✓ ${s.ok || 'Bien.'}</div>`; Sfx.play('ok'); k++; fails = 0; if (k >= b.steps.length) return done(false, b.explain); setTimeout(showStep, 700); return; }
      fails++; Sfx.play('bad');
      if (fails >= 2) { fb.innerHTML = `<div class="callout bad">La respuesta de este paso es <b>${MathX.num(s.a)}</b>. ${s.hint} Escríbela para seguir.</div>`; Voice.speak(`La respuesta es ${MathX.num(s.a)}. ${s.hint}`); }
      else { fb.innerHTML = `<div class="callout bad">Aún no. ${s.hint}</div>`; Voice.speak('Aún no. ' + s.hint); }
    };
    setTimeout(() => inp.focus({ preventScroll: true }), 200);
  },
  finish(L, st) {
    const s = S(), prev = this.rec(L.id), acc = st.total ? st.ok / st.total : 1, stars = acc >= .95 ? 3 : acc >= .7 ? 2 : 1;
    const xp = prev ? 10 : 30 + st.ok * 5, coins = prev ? 5 : 15;
    s.lessons[L.id] = { done: Date.now(), stars: Math.max(stars, prev ? prev.stars : 0), wrongs: st.wrongs.slice(0, 6) };
    Progress.addXP(xp); Progress.addCoins(coins); Progress.touchStreak(); if (!s.subjectsPlayed.includes(L.subj)) s.subjectsPlayed.push(L.subj);
    Missions.track({ correct: st.ok, subj: L.subj, lesson: true, stars: 0 }); checkBadges(); Store.save();
    if (stars >= 2) { Sfx.play('win'); Confetti.burst(90); }
    const g = L.game && gameById(L.game), nx = this.next();
    $('#ls-card').innerHTML = `<div class="center"><div style="font-size:3rem">🎓</div><h2>¡Lección completada!</h2><div class="big-stars" style="font-size:2.4rem">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="rewards"><span class="reward">+${xp} XP</span><span class="reward">+${coins} 🔩</span>${st.total ? `<span class="reward">${st.ok}/${st.total} retos</span>` : ''}</div></div>
      <h3>📒 Lo que aprendiste</h3><ul class="summary">${L.sum.map((x) => `<li>${x}</li>`).join('')}</ul>
      ${st.wrongs.length ? `<p class="muted" style="font-weight:700">Para repasar: ${st.wrongs.map(esc).join(' · ')}</p>` : ''}`;
    $('#ls-nav').innerHTML = `<div class="controls">${g ? `<button class="btn block" data-play="${g.id}">🎮 Practica con el juego: ${g.icon} ${g.name}</button>` : ''}${nx ? `<button class="btn ${g ? 'ghost' : ''} block" data-go="#/lesson/${nx.id}">Siguiente lección: ${nx.icon} ${esc(nx.title)}</button>` : ''}<button class="btn ghost block" data-go="#/academy">📚 Volver a la Academia</button></div>`;
    $('.game-top .bar i').style.width = '100%';
    Mascot.say(`Lección completada. ${L.sum[0].replace(/<[^>]+>/g, '')}`, 'happy', 5000, false);
    Voice.speak(`Lección completada, ${s.name}. Resumen: ${L.sum.map((x) => x.replace(/<[^>]+>/g, '')).join('. ')}`);
  },
  pizarra(pre = '') {
    chrome(true, 'academy');
    const ex = ['3 + 4 × 2', '(2 + 3)^2 − 4', '18 ÷ 3 × 2', '√16 + 3²', '3/4 + 1/2', '2x + 3 = 11', '5x − 2 = 3x + 8', '3(x + 2) = 18', 'x + y = 10; x − y = 2', '2x + 3y = 12; x − y = 1'];
    $('#main').innerHTML = `<button class="back" data-go="#/academy">← Academia</button><h1>✍️ Pizarra</h1><p class="muted">Escribe un cálculo, una ecuación con x, o un sistema de dos ecuaciones separadas por punto y coma (;). Te digo qué hacer, paso a paso.</p>
      <section class="card"><form id="pz-f" class="row" autocomplete="off"><input type="text" id="pz-in" placeholder="Ej.: 2x + 3 = 11" value="${esc(pre)}" aria-label="Cálculo o ecuación" class="grow"><button class="btn" type="submit">Resolver</button></form>
        <div class="chips" style="margin-top:8px">${['+', '−', '×', '÷', '^', '(', ')', '√', 'x', 'y', '=', ';'].map((c) => `<button class="chip" type="button" data-k="${c}" style="min-width:46px">${c}</button>`).join('')}</div>
        <p class="muted" style="margin:10px 0 4px;font-weight:800">Ejemplos:</p><div class="chips" style="justify-content:flex-start">${ex.map((e) => `<button class="chip" type="button" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}</div></section>
      <section id="pz-out"></section>`;
    const inp = $('#pz-in');
    $$('[data-k]').forEach((c) => c.onclick = () => { inp.value += c.dataset.k; inp.focus(); });
    $$('[data-ex]').forEach((c) => c.onclick = () => { inp.value = c.dataset.ex; solve(); });
    const solve = () => {
      const out = $('#pz-out'); let r;
      try { r = MathX.solve(inp.value); } catch (e) {
        out.innerHTML = `<div class="callout bad">${String(e.message).includes('nolin') ? 'Esa ecuación tiene x multiplicada por x (no es lineal). Por ahora resuelvo ecuaciones de primer grado como 2x + 3 = 11.' : String(e.message).includes('y sola') ? 'Con x e y necesitas dos ecuaciones separadas por ; (por ejemplo: x + y = 10; x − y = 2).' : String(e.message).includes('falta') ? 'Falta el signo =. Escribe una ecuación, por ejemplo 2x + 3 = 11.' : 'No entendí esa expresión. Usa números, + − × ÷ ^, paréntesis, √ y x.'}</div>`; return;
      }
      let shown = 1;
      const draw = () => {
        out.innerHTML = `<div class="card"><h3>${r.kind === 'sys' ? '🔀 Resolviendo el sistema' : r.kind === 'eq' ? '🔎 Resolviendo la ecuación' : '🧮 Resolviendo en orden'}</h3><ol class="steps">${r.steps.slice(0, shown).map((s, i) => `<li><span class="muted">${s.msg}</span><div class="step-expr">${esc(s.expr)}</div></li>`).join('')}</ol>
          ${shown < r.steps.length ? '<div class="row"><button class="btn grow" id="pz-n">Siguiente paso ▼</button><button class="btn ghost sm" id="pz-all">Ver todo</button></div>' : `<div class="callout ok"><b>Resultado:</b> ${r.kind === 'sys' ? (Number.isFinite(r.result) ? `x = ${MathX.num(r.result)}, y = ${MathX.num(r.y)}` : r.steps[r.steps.length - 1].msg) : r.kind === 'eq' ? (Number.isFinite(r.result) ? `x = ${MathX.num(r.result)}` : r.steps[r.steps.length - 1].msg) : MathX.num(r.result)}${r.kind === 'arit' && MathX.frac(r.result) ? ` = ${MathX.frac(r.result)}` : ''}</div>`}</div>`;
        const n = $('#pz-n'); if (n) n.onclick = () => { shown++; Sfx.play('tap'); Voice.speak(r.steps[shown - 1].msg, { important: false }); draw(); };
        const a = $('#pz-all'); if (a) a.onclick = () => { shown = r.steps.length; draw(); };
        if (shown === r.steps.length) S().pizarraUses = (S().pizarraUses || 0) + 1;
      };
      draw(); Voice.speak(r.steps[0].msg, { important: false });
    };
    $('#pz-f').onsubmit = (e) => { e.preventDefault(); solve(); };
    if (pre) solve();
  },
  notebook() {
    chrome(true, 'academy'); const done = LESSONS.filter((l) => this.rec(l.id));
    $('#main').innerHTML = `<button class="back" data-go="#/academy">← Academia</button><h1>📒 Mi cuaderno</h1><p class="muted">Resumen de todo lo que has aprendido. Tócalo para repasar la lección.</p>
      <section class="card"><div class="stats"><div class="stat"><b>${done.length}</b><span>lecciones aprendidas</span></div><div class="stat"><b>${done.reduce((n, l) => n + l.sum.length, 0)}</b><span>ideas clave</span></div><div class="stat"><b>${Object.keys(SUBJECTS).filter((k) => done.some((l) => l.subj === k)).length}/5</b><span>áreas iniciadas</span></div></div></section>
      ${done.length ? Object.entries(SUBJECTS).map(([k, v]) => { const ls = done.filter((l) => l.subj === k); return ls.length ? `<h2 style="margin-top:16px">${v.icon} ${v.name}</h2>${ls.map((l) => `<section class="card"><div class="row"><h3 class="grow" style="margin:0">${l.icon} ${esc(l.title)}</h3><button class="btn ghost sm" data-go="#/lesson/${l.id}">Repasar</button></div><ul class="summary">${l.sum.map((x) => `<li>${x}</li>`).join('')}</ul>${(this.rec(l.id).wrongs || []).length ? `<p class="muted" style="font-size:.85rem;font-weight:700">⚠️ Te costó: ${this.rec(l.id).wrongs.map(esc).join(' · ')}</p>` : ''}</section>`).join('')}` : ''; }).join('') : '<div class="card center"><p>Tu cuaderno está vacío. Completa tu primera lección y aquí aparecerá el resumen.</p><button class="btn" data-go="#/academy">Ir a la Academia</button></div>'}`;
  },
};
