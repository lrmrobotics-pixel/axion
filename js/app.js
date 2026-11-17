/* ============ Lord of Engineer · pantallas, navegación y motor de sesiones ============ */
'use strict';

const ACCENTS = [['#ef4444', 'Rojo'], ['#2f7df6', 'Azul'], ['#10a37a', 'Verde'], ['#7c5cff', 'Morado'], ['#ff7a2f', 'Naranja'], ['#ec4899', 'Rosa'], ['#0891b2', 'Cian']];
const ROUTE_ORDER = ['relampago', 'fracciones', 'potencias', 'balanza', 'graficador', 'circulo', 'derivada', 'vectores', 'proyectil', 'ohm', 'logica', 'bugs', 'robot', 'palanca', 'engranajes', 'pid'];
const gameById = (id) => GAMES.find((g) => g.id === id);

/* ---------- recomendación adaptativa ---------- */
function recommend(subj) {
  const list = GAMES.filter((g) => !subj || g.subj === subj);
  const due = SRS.dueList().filter((g) => list.includes(g)); if (due.length) return due[0];
  const fresh = ROUTE_ORDER.map(gameById).filter((g) => list.includes(g) && !(S().modules[g.id] && S().modules[g.id].plays)); if (fresh.length) return fresh[0];
  return [...list].sort((a, b) => (SRS.get(a.id).mastery - SRS.get(b.id).mastery))[0];
}

/* ---------- HUD ---------- */
function hud(bump) {
  const s = S(); const st = Progress.streakNow();
  $('#hud-streak b').textContent = st; $('#hud-coins b').textContent = s.coins; $('#hud-level b').textContent = levelOf(s.xp);
  if (bump) $$(bump).forEach((e) => { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); });
}
function chrome(show, tab) {
  $('#topbar').hidden = !show; $('#tabbar').hidden = !show;
  $$('#tabbar button').forEach((b) => { if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#mascot').classList.toggle('in-game', !show);
  if (show) hud();
}

/* ---------- pantallas ---------- */
const Screens = {
  onboarding(step = 0) {
    chrome(false); $('#mascot').hidden = true; const m = $('#main');
    if (step === 0) {
      m.innerHTML = `<section class="onb"><div class="big-mascot">${mascotSVG('happy')}</div><div class="logo-big">Lord of<br>Engineer</div>
        <p style="font-size:1.15rem;font-weight:700">Entrena tu mente de ingeniería con minijuegos de 5 a 10 minutos al día.</p>
        <p class="muted">Matemáticas · Física · Electrónica · Programación · Mecánica</p>
        <button class="btn block" id="ob-go">¡Empezar! 🚀</button></section>`;
      $('#ob-go').onclick = () => { Sfx.init(); Sfx.play('win'); Screens.onboarding(1); };
    } else if (step === 1) {
      m.innerHTML = `<section class="onb"><div class="big-mascot" style="width:130px">${mascotSVG('wow')}</div>
        <h1>¡Hola! Soy Tuerca 🔩</h1><p>Seré tu compañero de laboratorio. ¿Cómo te llamo?</p>
        <label for="ob-name" class="muted" style="font-weight:800">Tu apodo</label><input type="text" id="ob-name" maxlength="20" placeholder="Ej.: Ingeniera Ada" autocomplete="nickname">
        <p style="font-weight:800;margin-top:10px">Elige tu color favorito</p><div class="swatches" style="justify-content:center">${ACCENTS.map(([c, n]) => `<button class="sw" style="background:${c}" data-c="${c}" aria-label="${n}" aria-pressed="${S().settings.accent === c}"></button>`).join('')}</div>
        <button class="btn block" id="ob-next">Continuar</button></section>`;
      $$('.sw').forEach((b) => b.onclick = () => { S().settings.accent = b.dataset.c; Theme.apply(); $$('.sw').forEach((x) => x.setAttribute('aria-pressed', x === b)); Sfx.play('tap'); });
      $('#ob-next').onclick = () => { S().name = ($('#ob-name').value.trim() || 'Ingeniero/a').slice(0, 20); Screens.onboarding(2); };
    } else {
      m.innerHTML = `<section class="onb"><div class="big-mascot" style="width:120px">${mascotSVG('happy')}</div><h1>Así funciona, ${esc(S().name)}</h1>
        <div class="card" style="text-align:left"><p>🎮 <b>Juega</b> minijuegos interactivos: arrastra, gira, conecta y programa.</p>
        <p>⭐ <b>Gana XP y tornillos 🔩</b> para subir de nivel y comprarme accesorios.</p>
        <p>🔁 <b>Repaso inteligente:</b> lo que te cuesta vuelve pronto; lo que dominas, más adelante.</p>
        <p style="margin:0">🔥 <b>Racha:</b> 5 minutos al día bastan. ¡Sin presión!</p></div>
        <button class="btn block" id="ob-done">¡Vamos! ⚡</button></section>`;
      $('#ob-done').onclick = () => { S().onboarded = true; Store.save(); $('#mascot').hidden = false; location.hash = '#/'; Router.go(); setTimeout(() => Mascot.say(`¡Bienvenido/a, ${S().name}! Empieza con la misión del día.`, 'happy'), 400); };
    }
  },

  home() {
    chrome(true, 'home'); const s = S(), lvl = levelOf(s.xp), m = Missions.ensure(); const due = SRS.dueList(); const rec = recommend();
    const pct = Math.round(((s.xp - xpFor(lvl)) / (xpFor(lvl + 1) - xpFor(lvl))) * 100);
    const days = Array.from({ length: 7 }, (_, i) => { const dt = new Date(Date.now() - (6 - i) * DAY); const k = dayKey(dt); return { k, l: 'DLMMJVS'[dt.getDay()], on: !!s.history[k], today: i === 6 }; });
    const hr = new Date().getHours(); const greet = hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches';
    $('#main').innerHTML = `
      <section class="card hero"><div class="avatar">${mascotSVG('happy')}</div><div class="grow">
        <p class="muted" style="margin:0;font-weight:800">${greet},</p><h1>${esc(s.name)}</h1>
        <p style="margin:0 0 6px;font-weight:800">Nivel ${lvl} · ${titleOf(lvl)}</p>
        <div class="xpbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de nivel"><i style="width:${pct}%"></i></div>
        <p class="muted" style="margin:4px 0 0;font-size:.8rem;font-weight:700">${s.xp - xpFor(lvl)} / ${xpFor(lvl + 1) - xpFor(lvl)} XP para el nivel ${lvl + 1}</p></div></section>
      ${(() => { const nl = Learn.next(), dn = LESSONS.filter((l) => Learn.rec(l.id)).length; return `<section class="card"><div class="row"><span style="font-size:2rem">📚</span><div class="grow"><b>Academia · ${dn}/${LESSONS.length} lecciones</b><p class="muted" style="margin:0">${nl ? `Siguiente: ${nl.icon} ${esc(nl.title)}` : '¡Todas completadas! Repasa en tu cuaderno.'}</p></div></div><div class="row" style="margin-top:10px">${nl ? `<button class="btn grow" data-go="#/lesson/${nl.id}">▶ Aprender</button>` : ''}<button class="btn ghost sm" data-go="#/pizarra">✍️ Pizarra</button><button class="btn ghost sm" data-go="#/notebook">📒 Cuaderno</button></div></section>`; })()}
      <section class="card mission"><div class="row"><h2 style="margin:0">🎯 Misión del día</h2><span class="grow"></span><span style="font-weight:800">+60 🔩 +40 XP</span></div>
        ${m.items.map((it) => `<div class="mission-item ${it.p >= it.n ? 'done' : ''}"><span class="chk">${it.p >= it.n ? '✓' : ''}</span>${esc(it.label)}<span class="prog">${it.p}/${it.n}</span></div>`).join('')}
        ${m.claimed ? '<p style="margin:8px 0 0;font-weight:800">✅ ¡Completada! Vuelve mañana por otra.</p>' : Missions.allDone() ? '<button class="btn block" id="claim">🎁 Reclamar recompensa</button>' : `<button class="btn block" data-play="${rec.id}">▶ Empezar misión: ${rec.icon} ${rec.name}</button>`}</section>
      <section class="card"><div class="row"><h3 style="margin:0">🔥 Racha: ${Progress.streakNow()} día${Progress.streakNow() === 1 ? '' : 's'}</h3><span class="grow"></span>${s.freezes ? `<span class="tag">🧊 ×${s.freezes}</span>` : ''}</div>
        <div class="week" style="margin-top:10px">${days.map((d) => `<div class="d ${d.on ? 'on' : ''} ${d.today ? 'today' : ''}"><i></i>${d.l}</div>`).join('')}</div></section>
      ${due.length ? `<section class="card"><h3>🔁 Repasos para hoy (${due.length})</h3><p class="muted">La repetición espaciada fija lo aprendido en la memoria de largo plazo.</p><div class="row">${due.slice(0, 4).map((g) => `<button class="btn ghost sm" data-play="${g.id}">${g.icon} ${g.name}</button>`).join('')}</div></section>` : ''}
      <h2 style="margin-top:20px">Áreas</h2>
      <div class="subjects">${Object.entries(SUBJECTS).map(([k, v]) => { const gs = GAMES.filter((g) => g.subj === k); const mm = Math.round(gs.reduce((a, g) => a + SRS.get(g.id).mastery, 0) / gs.length); return `<button class="subj" style="--sc:${v.color}" data-go="#/subject/${k}"><span class="ico" aria-hidden="true">${v.icon}</span><b>${v.name}</b><small>${gs.length} juegos · ${mm}% dominio</small><div class="mbar"><i style="width:${mm}%"></i></div></button>`; }).join('')}</div>
      <section class="card" style="margin-top:14px"><div class="row"><span style="font-size:2rem">⚡</span><div class="grow"><b>Reto rápido</b><p class="muted" style="margin:0">60 segundos de cálculo mental. Récord: ${s.bestRelampago}</p></div><button class="btn sm" data-play="relampago">Jugar</button></div></section>`;
    const c = $('#claim'); if (c) c.onclick = () => { Missions.claim(); hud('#hud-coins'); Screens.home(); };
  },

  learn() {
    chrome(true, 'learn');
    $('#main').innerHTML = `<h1>🎮 Juegos</h1><p class="muted">Todo está desbloqueado: sigue la ruta sugerida o explora libremente.</p>
      ${Object.entries(SUBJECTS).map(([k, v]) => `<h2 style="margin-top:18px">${v.icon} ${v.name}</h2>${GAMES.filter((g) => g.subj === k).map(modCard).join('')}`).join('')}`;
  },

  subject(k) {
    const v = SUBJECTS[k]; if (!v) return Router.nav('#/');
    chrome(true, 'learn');
    $('#main').innerHTML = `<button class="back" data-go="#/">← Inicio</button><h1>${v.icon} ${v.name}</h1><p class="muted">${v.desc}</p>${GAMES.filter((g) => g.subj === k).map(modCard).join('')}`;
  },

  shop() {
    chrome(true, 'shop'); const s = S(), m = s.mascot;
    const prev = (over) => mascotSVG('happy', Object.assign({}, m, over));
    $('#main').innerHTML = `<h1>🛒 Tienda de Tuerca</h1><p class="muted">Tienes <b>${s.coins} 🔩</b>. Gana tornillos jugando y completando misiones.</p>
      <h2>Pinturas</h2><div class="shop-grid">${Object.entries(MASCOT_COLORS).map(([id, c]) => { const own = m.owned.includes(id), eq = m.color === c.hex; return `<div class="item ${eq ? 'equipped' : ''}"><div class="prev">${prev({ color: c.hex })}</div><b>${c.name}</b>${eq ? '<span class="tag new">Equipado</span>' : own ? `<button class="btn sm ghost" data-eqc="${id}">Usar</button>` : `<button class="btn sm" data-buy="${id}" ${s.coins < c.price ? 'disabled' : ''}>${c.price} 🔩</button>`}</div>`; }).join('')}</div>
      <h2 style="margin-top:20px">Accesorios</h2><div class="shop-grid">${Object.entries(ACCESSORIES).map(([id, a]) => { const own = m.owned.includes(id), eq = m[a.slot] === id; return `<div class="item ${eq ? 'equipped' : ''}"><div class="prev">${prev({ [a.slot]: id })}</div><b>${a.name}</b>${own ? `<button class="btn sm ${eq ? '' : 'ghost'}" data-eqa="${id}">${eq ? 'Quitar' : 'Poner'}</button>` : `<button class="btn sm" data-buy="${id}" ${s.coins < a.price ? 'disabled' : ''}>${a.price} 🔩</button>`}</div>`; }).join('')}</div>
      <h2 style="margin-top:20px">Potenciadores</h2><div class="shop-grid"><div class="item"><div class="prev" style="font-size:3.6rem;display:grid;place-items:center">🧊</div><b>Protector de racha</b><small class="muted">Salva tu racha si faltas un día. Tienes ${s.freezes}.</small><button class="btn sm" data-freeze ${s.coins < 80 || s.freezes >= 3 ? 'disabled' : ''}>80 🔩</button></div></div>`;
    const done = (msg) => { Store.save(); Sfx.play('coin'); buzz(20); hud('#hud-coins'); checkBadges(); Mascot.render(); Screens.shop(); if (msg) Mascot.say(msg, 'happy'); };
    $$('[data-buy]').forEach((b) => b.onclick = () => { const id = b.dataset.buy; const it = MASCOT_COLORS[id] || ACCESSORIES[id]; if (s.coins < it.price) return; s.coins -= it.price; m.owned.push(id); if (MASCOT_COLORS[id]) m.color = it.hex; else m[it.slot] = id; Confetti.burst(50); done(`¡Me encanta! ${it.name} ✨`); });
    $$('[data-eqc]').forEach((b) => b.onclick = () => { m.color = MASCOT_COLORS[b.dataset.eqc].hex; done(); });
    $$('[data-eqa]').forEach((b) => b.onclick = () => { const a = ACCESSORIES[b.dataset.eqa]; m[a.slot] = m[a.slot] === b.dataset.eqa ? null : b.dataset.eqa; done(); });
    const f = $('[data-freeze]'); if (f) f.onclick = () => { s.coins -= 80; s.freezes++; done('Racha protegida 🧊'); };
  },

  profile() {
    chrome(true, 'profile'); const s = S(), lvl = levelOf(s.xp);
    const days = Array.from({ length: 7 }, (_, i) => { const dt = new Date(Date.now() - (6 - i) * DAY); return { l: 'DLMMJVS'[dt.getDay()], v: s.history[dayKey(dt)] || 0 }; }); const mx = Math.max(20, ...days.map((d) => d.v));
    const acc = s.totalAnswered ? Math.round(s.totalCorrect / s.totalAnswered * 100) : 0;
    $('#main').innerHTML = `<section class="card center"><div style="width:150px;margin:0 auto">${mascotSVG('happy')}</div><h1>${esc(s.name)}</h1><p style="font-weight:800">Nivel ${lvl} · ${titleOf(lvl)}</p>
        <div class="row" style="justify-content:center"><button class="btn sm ghost" data-go="#/shop">🎨 Personalizar a Tuerca</button><button class="btn sm ghost" id="rename">✏️ Cambiar apodo</button><button class="btn sm ghost" data-go="#/settings">⚙️ Ajustes</button></div></section>
      <section class="card"><h3>Estadísticas</h3><div class="stats">
        <div class="stat"><b>${s.xp}</b><span>XP total</span></div><div class="stat"><b>${Progress.streakNow()} 🔥</b><span>Racha actual</span></div>
        <div class="stat"><b>${s.bestStreak}</b><span>Mejor racha</span></div><div class="stat"><b>${s.sessions}</b><span>Sesiones</span></div>
        <div class="stat"><b>${s.totalCorrect}</b><span>Aciertos</span></div><div class="stat"><b>${acc}%</b><span>Precisión</span></div>
        <div class="stat"><b>${Object.values(s.modules).filter((m) => m.mastery >= 80).length}</b><span>Temas dominados</span></div><div class="stat"><b>${s.coins} 🔩</b><span>Tornillos</span></div></div></section>
      <section class="card"><h3>XP esta semana</h3><div class="chart">${days.map((d) => `<div class="c"><span>${d.v || ''}</span><i style="height:${(d.v / mx) * 85}%"></i>${d.l}</div>`).join('')}</div></section>
      <section class="card"><h3>Insignias (${s.badges.length}/${BADGES.length})</h3><div class="badges">${BADGES.map((b) => `<div class="badge ${s.badges.includes(b.id) ? '' : 'locked'}" title="${esc(b.desc)}"><span class="e">${b.e}</span>${b.name}<br><span class="muted" style="font-weight:600">${b.desc}</span></div>`).join('')}</div></section>
      <section class="card"><h3>Dominio por tema</h3>${GAMES.map((g) => { const r = SRS.get(g.id); return `<div class="row" style="margin-bottom:8px"><span style="width:28px">${g.icon}</span><span class="grow" style="font-weight:700">${g.name}</span><span class="muted" style="font-size:.8rem;font-weight:800">Nv ${r.level}</span><div class="xpbar" style="width:90px;height:10px"><i style="width:${r.mastery}%"></i></div></div>`; }).join('')}</section>`;
    $('#rename').onclick = () => { const n = prompt('Nuevo apodo', s.name); if (n && n.trim()) { s.name = n.trim().slice(0, 20); Store.save(); Screens.profile(); } };
  },

  settings() {
    chrome(true, 'settings'); const st = S().settings;
    const sw = (k, label, sub) => `<div class="set-row"><div><label for="set-${k}">${label}</label>${sub ? `<small>${sub}</small>` : ''}</div><span class="switch"><input type="checkbox" id="set-${k}" data-k="${k}" ${st[k] ? 'checked' : ''}><i></i></span></div>`;
    $('#main').innerHTML = `<h1>⚙️ Ajustes</h1>
      <section class="card"><h3>Apariencia</h3>
        <div class="set-row"><label>Modo</label><div class="seg" role="group" aria-label="Modo de color">${[['auto', 'Auto'], ['light', '☀️ Claro'], ['dark', '🌙 Oscuro']].map(([v, l]) => `<button data-mode="${v}" aria-pressed="${st.mode === v}">${l}</button>`).join('')}</div></div>
        <div class="set-row" style="display:block"><label>Color principal</label><div class="swatches" style="margin-top:10px">${ACCENTS.map(([c, n]) => `<button class="sw" style="background:${c}" data-c="${c}" aria-label="${n}" aria-pressed="${st.accent === c}"></button>`).join('')}<label class="sw" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);position:relative" aria-label="Color personalizado"><input type="color" id="set-color" value="${st.accent}" style="opacity:0;position:absolute;inset:0;width:100%;height:100%"></label></div>
          <small class="muted" id="contrast-note" style="display:block;margin-top:8px"></small></div>
        <div class="set-row"><div><label for="set-fs">Tamaño de texto</label><small>${Math.round(st.fontScale * 100)}%</small></div><input type="range" id="set-fs" min=".85" max="1.35" step=".05" value="${st.fontScale}" style="max-width:180px"></div>
        <div class="set-row"><div><label for="set-motion">Reducir animaciones</label></div><span class="switch"><input type="checkbox" id="set-motion" ${st.motion === 'reduce' ? 'checked' : ''}><i></i></span></div></section>
      <section class="card"><h3>Sonido y accesibilidad</h3>
        ${sw('sound', 'Efectos de sonido', 'Correcto, error, monedas')}${sw('music', 'Música ambiental', 'Melodía suave generada en vivo')}
        ${sw('haptics', 'Vibración', 'Respuesta háptica en el celular')}</section>
      <section class="card"><h3>🎙️ Voz de Tuerca</h3>
        ${sw('tts', 'Tuerca habla', 'Te acompaña en voz alta en cada sesión')}
        ${sw('voiceChatty', 'Modo conversación', 'También comenta aciertos y combos (si no, solo lo importante)')}
        <div class="set-row" style="display:block"><label>Personalidad</label><div class="seg" role="group" aria-label="Personalidad de voz" style="margin-top:8px">${Object.entries(VOICE_PERSONAS).map(([k, v]) => `<button data-persona="${k}" aria-pressed="${st.voicePersona === k}">${v.name}</button>`).join('')}</div><small class="muted" id="persona-desc" style="display:block;margin-top:6px">${(VOICE_PERSONAS[st.voicePersona] || VOICE_PERSONAS.cercana).desc}</small></div>
        <div class="set-row" style="display:block"><label>Voz</label><small class="muted" style="display:block">✨ = natural (suena más humana, usa internet). Toca una para escucharla.</small><div id="voice-list" style="display:grid;gap:8px;margin-top:8px"><span class="muted">Cargando voces…</span></div></div>
        <div class="set-row"><div><label for="set-vrate">Velocidad</label><small id="vrate-l">${Math.round(st.voiceRate * 100)}%</small></div><input type="range" id="set-vrate" min=".7" max="1.4" step=".05" value="${st.voiceRate}" style="max-width:180px"></div>
        <div class="row"><button class="btn ghost sm" id="voice-test">▶ Probar voz</button>${Updater.isApp() ? '<button class="btn ghost sm" id="voice-install">⬇️ Más voces del sistema</button>' : ''}</div><p class="muted" id="voice-status" style="font-size:.85rem;margin:8px 0 0"></p></section>
      <section class="card"><h3>Datos y privacidad</h3><p class="muted">Todo tu progreso se guarda solo en este dispositivo. No recopilamos datos personales.</p>
        <div class="row"><button class="btn ghost sm" id="export">⬇️ Exportar progreso</button><button class="btn ghost sm" id="import">⬆️ Importar</button><button class="btn ghost sm" id="reset" style="--ci:#c2410c">🗑 Borrar todo</button></div></section>
      <section class="card"><h3>Actualizaciones</h3><p class="muted">Versión instalada: <b>${APP_VERSION}</b>. La app revisa si hay versiones nuevas al abrirse.</p><p class="muted" style="font-size:.85rem">${Updater.isApp() ? `Actualizaciones automáticas: <b>${Updater.ota ? 'activas ✓' : 'no disponibles'}</b> · APK ${esc(Updater.native || '—')} · Voz: <b>${Voice.native ? 'nativa ✓' : 'no disponible'}</b>` : 'Versión web (navegador).'}</p><button class="btn ghost sm" id="upd">🔄 Buscar actualizaciones</button></section>
      <p class="center muted" style="font-size:.8rem">Lord of Engineer v${APP_VERSION} · Complemento de estudio, no reemplaza el plan oficial de tu carrera.</p>`;
    const save = () => { Store.save(); Theme.apply(); Mascot.render(); note(); };
    const note = () => { const c = contrast(S().settings.accent, Theme.isDark() ? '#1d1b2d' : '#ffffff'); $('#contrast-note').textContent = `Contraste del color con el fondo: ${c.toFixed(1)}:1 ${c >= 3 ? '✓ buena visibilidad' : '⚠ bajo: los botones usarán texto oscuro'}`; };
    note();
    $$('[data-mode]').forEach((b) => b.onclick = () => { st.mode = b.dataset.mode; $$('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', x === b)); save(); });
    $$('.sw[data-c]').forEach((b) => b.onclick = () => { st.accent = b.dataset.c; $$('.sw[data-c]').forEach((x) => x.setAttribute('aria-pressed', x === b)); Sfx.play('tap'); save(); });
    $('#set-color').oninput = (e) => { st.accent = e.target.value; save(); };
    $('#set-fs').oninput = (e) => { st.fontScale = +e.target.value; e.target.previousElementSibling.querySelector('small').textContent = Math.round(st.fontScale * 100) + '%'; save(); };
    $('#set-motion').onchange = (e) => { st.motion = e.target.checked ? 'reduce' : 'auto'; save(); };
    $$('[data-k]').forEach((i) => i.onchange = () => { st[i.dataset.k] = i.checked; save(); if (i.dataset.k === 'music') Music.sync(); if (i.dataset.k === 'sound' && i.checked) Sfx.play('ok'); if (i.dataset.k === 'haptics' && i.checked) buzz(40); if (i.dataset.k === 'tts') { if (i.checked) Voice.speak(`Hola, ${S().name}. Vuelvo a estar en línea.`); else Voice.stop(); } });
    $('#upd').onclick = () => Updater.check(true);
    const vStatus = () => { const el = $('#voice-status'); if (el) el.textContent = `Motor de voz: ${Voice.status}${Voice.native ? ' (Android)' : ''} · ${Voice.spanish().length} voces en español${Voice.error ? ' · último error: ' + Voice.error : ''}`; };
    const test = async () => { const ok = await Voice.speak(VOICE_PERSONAS[st.voicePersona].warm ? `¡Hola, ${S().name}! Soy Tuerca. Así sueno ahora, ¿te gusta?` : `Hola, ${S().name}. Soy Tuerca, tu asistente de laboratorio.`, { test: true }); vStatus(); if (!ok) toast('No pude hablar. Revisa el volumen multimedia o toca “Más voces del sistema”.', 4500); };
    const renderVoices = () => {
      const list = Voice.spanish(), box = $('#voice-list'); if (!box) return;
      if (!list.length) { box.innerHTML = '<span class="muted">No encontré voces en español. Toca “Más voces del sistema” e instala Español.</span>'; vStatus(); return; }
      const cur = Voice.pickVoice();
      box.innerHTML = list.slice(0, 12).map((v, n) => `<button class="btn ${v === cur ? '' : 'ghost'} sm" data-voice="${esc(v.voiceURI || v.name)}" style="justify-content:flex-start;text-align:left">${v === cur ? '✓ ' : ''}${esc(Voice.label(v, n + 1))}</button>`).join('');
      $$('[data-voice]', box).forEach((b) => b.onclick = () => { st.voiceName = b.dataset.voice; save(); renderVoices(); test(); });
      vStatus();
    };
    Voice.init().then(renderVoices);
    const vi = $('#voice-install'); if (vi) vi.onclick = () => { Voice.installVoices(); toast('Instala o actualiza “Español” en el motor de voz de Google y vuelve aquí.', 5000); };
    $$('[data-persona]').forEach((b) => b.onclick = () => { st.voicePersona = b.dataset.persona; $$('[data-persona]').forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#persona-desc').textContent = VOICE_PERSONAS[st.voicePersona].desc; save(); test(); });
    $('#set-vrate').oninput = (e) => { st.voiceRate = +e.target.value; $('#vrate-l').textContent = Math.round(st.voiceRate * 100) + '%'; save(); };
    $('#set-vrate').onchange = test; $('#voice-test').onclick = test;
    $('#export').onclick = () => { const blob = new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lord-of-engineer-progreso-${dayKey()}.json`; a.click(); };
    $('#import').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json'; i.onchange = async () => { try { const data = JSON.parse(await i.files[0].text()); if (typeof data.xp !== 'number') throw 0; localStorage.setItem(KEY, JSON.stringify(data)); Store.load(); Theme.apply(); toast('Progreso importado ✓'); Router.go(); } catch { toast('Archivo no válido'); } }; i.click(); };
    $('#reset').onclick = () => { if (confirm('¿Borrar TODO tu progreso? Esto no se puede deshacer.')) { Store.reset(); Theme.apply(); Mascot.render(); location.hash = '#/'; Router.go(); } };
  },
};

function modCard(g) {
  const r = SRS.get(g.id), due = SRS.isDue(g.id), isNew = !r.plays;
  return `<button class="mod" style="--sc:${SUBJECTS[g.subj].color}" data-play="${g.id}"><span class="ico" aria-hidden="true">${g.icon}</span>
    <span class="grow"><h3>${g.name}</h3><p>${g.desc}</p><span class="meta">${isNew ? '<span class="tag new">Nuevo</span>' : due ? '<span class="tag due">🔁 Repasar hoy</span>' : `<span class="tag">${SRS.label(g.id)}</span>`}<span class="tag">Nv ${r.level}/5</span><span class="stars" aria-label="${r.bestStars} estrellas">${'⭐'.repeat(r.bestStars)}${'☆'.repeat(3 - r.bestStars)}</span></span></span>
    <span class="ring" style="--p:${r.mastery}" aria-label="Dominio ${r.mastery}%"><span>${r.mastery}%</span></span></button>`;
}

/* ---------- motor de sesión ---------- */
const Runner = {
  st: null,
  start(g) {
    this.stop(); chrome(false); const mod = SRS.get(g.id);
    const st = this.st = { g, mod, diff: mod.level, i: 0, total: g.rounds || 6, correct: 0, answered: 0, combo: 0, bestCombo: 0, mistakes: [], wasDue: SRS.isDue(g.id), wasNew: !mod.plays, okRun: 0, badRun: 0, locked: false, timers: [], rafs: [], memo: {}, t0: Date.now(), end: g.timed ? Date.now() + g.timed * 1000 : null };
    $('#main').innerHTML = `<div class="game-top"><button class="icon-btn" id="quit" aria-label="Salir del juego">✕</button>
      <div class="bar ${g.timed ? 'timer' : ''}" role="progressbar" aria-label="${g.timed ? 'Tiempo' : 'Progreso'}"><i id="gbar"></i></div>
      ${g.timed ? '<span class="combo" id="gcombo"></span>' : ''}<span class="count" id="gcount"></span></div>
      <h2 class="center" style="margin:0 0 4px;font-size:1.05rem">${g.icon} ${g.name} <span class="tag" id="gdiff">Nv ${st.diff}</span></h2>
      <div class="stage" id="stage"></div>
      <div class="sheet" id="sheet" role="status"><div class="in"><div class="txt"><h3 id="sh-t"></h3><p id="sh-p"></p></div><button class="btn" id="sh-b">Continuar</button></div></div>`;
    $('#quit').onclick = () => { this.stop(); history.back(); };
    if (g.timed) { const tick = () => { if (this.st !== st) return; const left = Math.max(0, st.end - Date.now()); $('#gbar').style.width = (left / (g.timed * 1000)) * 100 + '%'; $('#gcount').textContent = Math.ceil(left / 1000) + 's'; if (left <= 0) return this.finish(); if (left < 10000 && !st.warned) { st.warned = true; Voice.speak('Diez segundos.', { important: false }); } st.timers.push(setTimeout(tick, 200)); }; tick(); }
    Mascot.say(g.timed ? `${g.name}: sesenta segundos. Cada combo suma puntos extra. ¡Ya!` : COMPANION.start(g.name, st.diff), 'happy', 2600);
    this.next();
  },
  ctx() {
    const st = this.st, self = this;
    return {
      stage: $('#stage'), diff: st.diff, round: st.i,
      answer: (ok, exp) => self.answer(ok, exp),
      say: (t, mood = 'think') => Mascot.say(t, mood, 3200),
      raf: (fn) => { const id = requestAnimationFrame(() => { if (self.st === st) fn(); }); st.rafs.push(id); },
      timeout: (fn, ms) => { st.timers.push(setTimeout(() => { if (self.st === st) fn(); }, ms)); },
      memo: (k, v) => (st.memo[k] = st.memo[k] || v),
    };
  },
  next() {
    const st = this.st; if (!st) return;
    if (!st.g.timed && st.i >= st.total) return this.finish();
    if (st.g.timed && Date.now() >= st.end) return this.finish();
    st.locked = false; const stage = $('#stage'); stage.innerHTML = ''; delete stage.dataset.done;
    if (!st.g.timed) { $('#gbar').style.width = (st.i / st.total) * 100 + '%'; $('#gcount').textContent = `${st.i + 1}/${st.total}`; }
    $('#gdiff').textContent = `Nv ${st.diff}`;
    try { st.g.round(this.ctx()); } catch (err) { console.error(err); stage.innerHTML = '<p class="center">Ups, algo falló en este reto. Pasemos al siguiente.</p>'; setTimeout(() => { st.i++; this.next(); }, 1200); }
    stage.querySelector('button, [tabindex="0"]')?.focus({ preventScroll: true });
  },
  answer(ok, exp) {
    const st = this.st; if (!st || st.locked) return; st.locked = true;
    st.answered++; st.i++;
    if (ok) { st.correct++; st.combo++; st.bestCombo = Math.max(st.bestCombo, st.combo); st.okRun++; st.badRun = 0; Sfx.play('ok'); buzz(18); }
    else { st.combo = 0; st.badRun++; st.okRun = 0; st.mistakes.push(exp); Sfx.play('bad'); buzz([30, 40, 30]); }
    // dificultad adaptativa dentro de la sesión
    if (st.okRun >= (st.g.timed ? 4 : 2) && st.diff < 5) { st.diff++; st.okRun = 0; toast(`⬆ Dificultad ${st.diff}`); if (!st.g.timed) st.say = COMPANION.up(st.diff); }
    if (st.badRun >= 2 && st.diff > 1) { st.diff--; st.badRun = 0; toast('Bajamos un poco la dificultad 💪'); st.say = COMPANION.down(); }
    if (st.g.timed) {
      const c = $('#gcombo'); if (c) { c.textContent = st.combo > 1 ? `x${st.combo}🔥` : ''; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
      if (st.combo && st.combo % 5 === 0) Mascot.say(COMPANION.combo(st.combo), 'wow', 1500, 'chat');
      st.timers.push(setTimeout(() => this.next(), ok ? 320 : 1300));
      if (!ok) this.sheet(false, exp, true);
      return;
    }
    if (st.combo >= 3 && ok) Mascot.say(COMPANION.combo(st.combo), 'wow', 1800, 'chat');
    else { Mascot.react(ok ? 'happy' : 'oops', ok ? 'jump' : 'wiggle'); if (ok) Voice.speak(st.say || COMPANION.ok(), { important: !!st.say }); }
    if (ok) st.say = null;
    this.sheet(ok, exp);
  },
  sheet(ok, exp, auto) {
    const sh = $('#sheet'); if (!sh) return;
    sh.className = 'sheet show ' + (ok ? 'ok' : 'bad');
    $('#sh-t').textContent = ok ? pick(LINES.ok) : pick(LINES.bad); $('#sh-p').innerHTML = exp || '';
    $('#mascot').classList.add('sheet-up');
    const b = $('#sh-b'); b.hidden = !!auto; b.className = 'btn ' + (ok ? 'ok' : ''); b.focus({ preventScroll: true });
    if (!ok && !auto) { Voice.speak(pick(['Casi. ', 'No exactamente. ', 'Revisemos. ']) + $('#sh-p').textContent + (this.st && this.st.say ? ' ' + this.st.say : '')); if (this.st) this.st.say = null; }
    const go = () => { sh.className = 'sheet'; $('#mascot').classList.remove('sheet-up'); if (!auto) this.next(); };
    b.onclick = go;
    if (auto) this.st.timers.push(setTimeout(go, 1200));
  },
  stop() {
    if (!this.st) return; this.st.timers.forEach(clearTimeout); this.st.rafs.forEach(cancelAnimationFrame); this.st = null;
    $('#mascot').classList.remove('sheet-up');
  },
  finish() {
    const st = this.st; if (!st) return; const { g } = st; this.stop();
    const s = S(); const acc = st.answered ? st.correct / st.answered : 0;
    const stars = g.timed ? (st.correct >= 25 ? 3 : st.correct >= 15 ? 2 : st.correct >= 6 ? 1 : 0) : (acc >= .95 ? 3 : acc >= .75 ? 2 : acc >= .5 ? 1 : 0);
    const effAcc = g.timed ? Math.min(1, st.correct / 20) * (st.answered ? st.correct / st.answered : 0) : acc;
    const r = SRS.update(g.id, effAcc); r.bestStars = Math.max(r.bestStars, stars); r.best = Math.max(r.best, st.correct);
    const xp = 10 + st.correct * 5 + stars * 5 + Math.min(20, st.bestCombo * 2);
    const coins = st.correct * 2 + stars * 3 + (stars === 3 ? 5 : 0);
    const newDay = Progress.touchStreak();
    s.sessions++; s.totalCorrect += st.correct; s.totalAnswered += st.answered; if (st.answered && st.correct === st.answered && st.answered >= 3) s.perfects++;
    if (!s.subjectsPlayed.includes(g.subj)) s.subjectsPlayed.push(g.subj);
    if (g.id === 'relampago') s.bestRelampago = Math.max(s.bestRelampago, st.correct);
    Progress.addXP(xp); Progress.addCoins(coins);
    Missions.track({ correct: st.correct, subj: g.subj, stars, wasDue: st.wasDue, wasNew: st.wasNew, bestCombo: st.bestCombo });
    checkBadges(); Store.save();
    const msg = stars === 3 ? '¡Sesión perfecta! Eres una máquina 🤖' : stars === 2 ? '¡Muy bien! Ya casi lo dominas.' : stars === 1 ? 'Buen trabajo. Lo repasaremos pronto para afianzarlo.' : 'Cada intento cuenta. Volveremos a este tema pronto 💪';
    if (stars >= 2) { Sfx.play('win'); Confetti.burst(stars === 3 ? 200 : 90); }
    const next = recommend(); const nextG = next.id === g.id ? recommend(g.subj === 'mate' ? 'fisica' : 'mate') : next;
    $('#main').innerHTML = `<section class="result"><h1>${g.timed ? `¡${st.correct} aciertos!` : `${st.correct} de ${st.answered}`}</h1>
      <div class="big-stars" aria-label="${stars} de 3 estrellas">${[1, 2, 3].map((i) => `<span>⭐</span>`).join('')}</div>
      <p style="font-weight:800">${msg}</p>
      <div class="rewards"><span class="reward">+${xp} XP</span><span class="reward">+${coins} 🔩</span>${st.bestCombo > 2 ? `<span class="reward">🔥 combo x${st.bestCombo}</span>` : ''}${newDay ? `<span class="reward">🔥 racha ${s.streak}</span>` : ''}</div>
      <p class="muted">🔁 ${SRS.label(g.id)} · Nivel del módulo: ${r.level}/5 · Dominio ${r.mastery}%</p>
      ${st.mistakes.length ? `<details class="card mistakes" ${st.mistakes.length <= 3 ? 'open' : ''}><summary style="font-weight:800;cursor:pointer">📝 Repasa tus errores (${st.mistakes.length})</summary><ul>${st.mistakes.slice(0, 8).map((m) => `<li>${m}</li>`).join('')}</ul></details>` : ''}
      <div class="controls"><button class="btn block" data-play="${g.id}">↻ Otra vez</button><button class="btn ghost block" data-play="${nextG.id}">Siguiente: ${nextG.icon} ${nextG.name}</button><button class="btn ghost block" data-go="#/">🏠 Inicio</button></div></section>`;
    $$('.big-stars span').forEach((e, i) => setTimeout(() => { if (i < stars) { e.classList.add('on'); Sfx.play('coin'); } }, 400 + i * 350));
    Mascot.say(msg, stars ? 'happy' : 'think', 4200, false); Voice.speak(COMPANION.end(s.name, st.correct, st.answered, stars) + (r.interval >= 1 ? ` Próximo repaso en ${r.interval} día${r.interval > 1 ? 's' : ''}.` : ''));
    if (Missions.allDone() && !Missions.ensure().claimed) setTimeout(() => Mascot.say('¡Completaste la misión del día! Reclama tu premio en Inicio 🎁', 'wow'), 4500);
  },
};


/* ---------- actualizaciones automáticas (solo en el APK) ----------
   Dos tipos de versión en el repo público de releases:
   - OTA (web): un .zip con la app. Se descarga en silencio y se aplica al salir y volver (plugin Capgo, modo manual).
   - Nativa: requiere un APK nuevo (nombre, ícono, permisos). La release lo indica con "min-native: X.Y.Z". */
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const Updater = {
  ota: null, native: null,
  isApp: () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()),
  newer(a, b) { const x = a.replace(/^v/, '').split('.').map(Number), y = b.replace(/^v/, '').split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; } return false; },
  async init() {
    // aviso "me actualicé" tras aplicar una versión nueva
    const prev = lsGet('axion.lastRun'); lsSet('axion.lastRun', APP_VERSION);
    if (prev && this.newer(APP_VERSION, prev)) setTimeout(() => { toast(`✨ Actualizado a la versión ${APP_VERSION}`, 3500); Mascot.say(`¡Me actualicé a la versión ${APP_VERSION}! ⚔️`, 'wow'); }, 1200);
    if (!this.isApp() || !window.Capacitor.registerPlugin) return;
    try {
      const ota = window.Capacitor.registerPlugin('CapacitorUpdater');
      await ota.notifyAppReady(); // confirma que esta versión arrancó bien (si no, el plugin vuelve a la anterior)
      this.native = (await ota.current()).native; this.ota = ota;
    } catch { this.ota = null; } // APK sin el plugin (versiones ≤ 1.1.1)
  },
  async check(manual = false, cold = false) {
    if (!this.isApp() && !manual) return;
    const last = +lsGet('axion.updcheck') || 0;
    // automático: al abrir y al volver a la app, como mucho cada 20 min; manual: siempre
    if (!manual && ($('.upd-offer') || (!cold && Date.now() - last < 20 * 60e3))) return; // al abrir desde cero busca siempre
    try {
      const r = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) throw new Error(r.status);
      const rel = await r.json(); lsSet('axion.updcheck', Date.now());
      const tag = rel.tag_name.replace(/^v/, '');
      if (!this.newer(tag, APP_VERSION)) { if (manual) toast(`✓ Tienes la última versión (${APP_VERSION})`); return; }
      const minNative = ((rel.body || '').match(/min-native:\s*(\d+\.\d+\.\d+)/) || [, tag])[1];
      const zip = (rel.assets || []).find((x) => /^web-.*\.zip$/.test(x.name));
      const apk = (rel.assets || []).find((x) => x.name.endsWith('.apk'));
      if (this.ota && zip && !this.newer(minNative, this.native)) return this.downloadOTA(tag, zip.browser_download_url, manual);
      if (apk) this.offer(rel, apk.browser_download_url);
    } catch { if (manual) toast('No pude buscar actualizaciones. ¿Tienes internet?'); }
  },
  async downloadOTA(version, url, manual) {
    if (lsGet('axion.otaReady') === version) { if (manual) toast(`La versión ${version} ya está lista: sal y vuelve a entrar para aplicarla`); return; }
    if (manual) toast(`Descargando la versión ${version}…`);
    try {
      const b = await this.ota.download({ url, version });
      await this.ota.next({ id: b.id }); // se aplica cuando la app pasa a segundo plano o se reabre
      lsSet('axion.otaReady', version);
      if (manual) toast(`✓ Versión ${version} lista: sal y vuelve a entrar para aplicarla`, 4000);
    } catch { if (manual) toast('No se pudo descargar la actualización. Intenta de nuevo.'); }
  },
  offer(rel, url) {
    const d = document.createElement('div'); d.className = 'sheet show ok upd-offer'; d.setAttribute('role', 'dialog'); d.style.zIndex = 90;
    d.innerHTML = `<div class="in"><div class="txt"><h3>🚀 ¡Nueva versión ${esc(rel.tag_name)}!</h3><p>${esc((rel.body || 'Mejoras y nuevos retos.').split(String.fromCharCode(10))[0].slice(0, 140))}</p><p class="muted" style="font-size:.8rem">Esta versión trae cambios del sistema y requiere instalar el APK. Tu progreso se conserva.</p></div>
      <div class="row"><button class="btn ghost sm" data-later>Luego</button><button class="btn ok" data-upd>⬇️ Actualizar</button></div></div>`;
    document.body.append(d); Mascot.say('¡Hay una versión nueva de Lord of Engineer! ⚔️', 'wow');
    $('[data-later]', d).onclick = () => d.remove();
    $('[data-upd]', d).onclick = () => { d.remove(); toast('Descargando… abre el archivo al terminar para instalar'); location.href = url; };
  },
};

/* ---------- navegación ---------- */
const Router = {
  nav(h) { if (location.hash === h) this.go(); else location.hash = h; },
  go() {
    const h = location.hash || '#/'; if (!S().onboarded) return Screens.onboarding(0);
    Runner.stop(); window.scrollTo(0, 0);
    const [, a, b] = h.split('/');
    const g = a === 'play' && gameById(b);
    if (a !== 'lesson') Music.setTheme(g ? (g.id === 'relampago' ? 'rush' : g.subj) : a === 'subject' && MUSIC_THEMES[b] ? b : 'menu');
    if (g) Runner.start(g);
    else if (a === 'academy') Learn.academy();
    else if (a === 'lesson') Learn.lesson(b);
    else if (a === 'pizarra') Learn.pizarra(decodeURIComponent(b || ''));
    else if (a === 'notebook') Learn.notebook();
    else if (a === 'subject') Screens.subject(b);
    else if (Screens[a] && a !== 'onboarding') Screens[a]();
    else Screens.home();
    $('#main').focus({ preventScroll: true });
  },
};

document.addEventListener('click', (e) => {
  // Router.nav: si ya estás en ese juego (botón "Otra vez"), lo reinicia aunque la dirección no cambie
  const p = e.target.closest('[data-play]'); if (p) { Sfx.init(); Sfx.play('tap'); Router.nav('#/play/' + p.dataset.play); return; }
  const g = e.target.closest('[data-go]'); if (g) { Sfx.play('tap'); Router.nav(g.dataset.go); }
});
$('#mascot-btn').addEventListener('click', () => { Sfx.init(); Sfx.play('tap'); Mascot.say(pick(LINES.tips), 'happy', 5000); });
window.addEventListener('hashchange', () => Router.go());
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => Theme.apply());
document.addEventListener('visibilitychange', () => { if (document.hidden) Music.stop(); else { Music.sync(); Updater.check(); } });
document.addEventListener('pointerdown', () => { if (S().settings.music && !Music.timer) Music.start(); }, { once: true });

/* ---------- arranque ---------- */
Store.load(); Theme.apply(); Mascot.render(); Missions.ensure(); Router.go();
Voice.init(); // prepara el motor de voz nativo desde el arranque
Updater.init().then(() => setTimeout(() => Updater.check(false, true), 2000));
// Tuerca te saluda al abrir la app con un resumen del día
const greetBriefing = () => {
  if (!S().onboarded || location.hash.startsWith('#/play')) return;
  const due = SRS.dueList().length, sk = Progress.streakNow(), m = Missions.ensure();
  const extra = [sk ? `Racha de ${sk} día${sk > 1 ? 's' : ''}.` : '', due ? `Tienes ${due} repaso${due > 1 ? 's' : ''} pendiente${due > 1 ? 's' : ''}.` : '', m.claimed ? 'Misión del día completada.' : '¿Empezamos con la misión del día?'].filter(Boolean).join(' ');
  const line = COMPANION.greet(S().name, extra); Mascot.say(line, 'happy', 5000, false); Voice.speak(line);
};
// el navegador solo deja hablar tras un toque; en el APK suena al abrir
if (Updater.isApp()) setTimeout(greetBriefing, 900); else document.addEventListener('pointerdown', () => setTimeout(greetBriefing, 150), { once: true });
// el service worker solo en la versión web; en el APK los archivos ya están en el dispositivo
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !Updater.isApp()) navigator.serviceWorker.register('sw.js').catch(() => {});
else if ('serviceWorker' in navigator && Updater.isApp()) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {}); // limpia el de versiones ≤ 1.1.1
