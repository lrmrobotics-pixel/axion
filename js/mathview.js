/* ============ Lord of Engineer · notación matemática de libro ============
   Convierte texto como 1/2, x^2, √16 o 3 * 4 en fracciones apiladas, exponentes,
   radicales con barra y ×, en toda la app (lecciones, juegos, jefes, Pizarra).
   Un MutationObserver procesa el texto nuevo; el código de programación se deja intacto. */
'use strict';

const MathView = {
  OPER: String.raw`\d+(?:,\d+)?|[a-dkntxyVRIFP](?![A-Za-zÀ-ÿ])|\([^()<>]{1,40}\)`,
  SKIP: 'input, textarea, script, style, code, .code, svg, .no-pm, .frac, .sqrt, sup',
  rx: null,
  init() {
    const O = this.OPER;
    this.rx = {
      frac: new RegExp(String.raw`(?<![\wÀ-ÿ.,])(${O})\s*\/\s*(${O})(?![\wÀ-ÿ])`, 'g'),
      sup: /([\dA-Za-z)])\^(\([^()<>]{1,20}\)|[−-]?[\dA-Za-z]+)/g,
      sqrt: /√\s*(\d+(?:,\d+)?|[A-Za-z](?![A-Za-z])|\([^()<>]{1,40}\))/g,
      mul: /(?<=[\d\s)])\*(?=[\s\d(])/g,
    };
  },
  strip: (s) => (s[0] === '(' && s[s.length - 1] === ')' ? s.slice(1, -1) : s),
  // devuelve HTML con notación de libro, o null si el texto no tiene nada que cambiar
  render(text) {
    if (!this.rx) this.init();
    if (!/[\/^√*]/.test(text)) return null;
    let h = esc(text);
    h = h.replace(this.rx.sqrt, (_, r) => `<span class="sqrt">√<span class="rad">${this.strip(r)}</span></span>`);
    h = h.replace(this.rx.sup, (_, b, e) => `${b}<sup>${this.strip(e)}</sup>`);
    h = h.replace(this.rx.frac, (_, a, b) => `<span class="frac"><span class="fn">${this.strip(a)}</span><span class="fd">${this.strip(b)}</span></span>`);
    h = h.replace(this.rx.mul, '×');
    return h === esc(text) ? null : h;
  },
  process(root) {
    if (!root || root.nodeType !== 1 && root.nodeType !== 3) return;
    const nodes = [];
    if (root.nodeType === 3) nodes.push(root);
    else {
      if (root.closest && root.closest(this.SKIP)) return;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && n.parentElement.closest(this.SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      while (w.nextNode()) nodes.push(w.currentNode);
    }
    nodes.forEach((n) => {
      if (!n.parentElement || n.parentElement.closest(this.SKIP)) return;
      const html = this.render(n.nodeValue); if (!html) return;
      const span = document.createElement('span'); span.className = 'mv'; span.innerHTML = html; n.replaceWith(span);
    });
  },
  watch(el) {
    this.process(el);
    new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => this.process(n)))).observe(el, { childList: true, subtree: true });
  },
  // vista previa al escribir: usa el analizador de la Pizarra
  preview(input, box) {
    const upd = () => {
      const v = input.value.trim(); if (!v) { box.innerHTML = ''; return; }
      try {
        const parts = v.split(/[;\n]/).map((t) => t.trim()).filter(Boolean);
        const out = parts.map((p) => MathX.parse(p).map((side) => MathX.str(side)).join(' = ')).join('   ;   ');
        box.innerHTML = this.render(out) || esc(out);
      } catch { box.innerHTML = '<span class="muted">…</span>'; }
    };
    input.addEventListener('input', upd); upd();
  },
};
