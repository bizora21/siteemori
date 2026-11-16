// Editor de vídeo (reportagem): o vídeo em cima, a linha do tempo por baixo.
// Tudo se faz ali: ouvir, cortar no cursor, juntar texto, emoji, imagem, cenário, música e efeitos.
// Pré-visualização leve (HTML, sem render): mostra o cenário, o texto, as legendas e o som da voz.
// Usa as funções globais de app.js / simple.js / timeline.js.

const ED = { t: 0, playing: false, sel: null, pps: 0, raf: 0, last: 0, audio: null, audioKey: '', music: null, ctx: null };

const edListMode = () => {
  try { return localStorage.getItem('ed-mode') === 'list'; } catch { return false; }
};
const edSetMode = (m) => {
  try { localStorage.setItem('ed-mode', m); } catch { /* sem armazenamento */ }
  renderEditor();
};

const fmtT = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

// ── dados da linha do tempo ───────────────────────────────────────────────
function edData() {
  const p = state.data.project;
  const tm = state.data.timing;
  const n = p.scenes.length;
  const audioEnd = (i) => (tm.audioStarts[i] ?? 0) + (tm.durations[i] ?? 3);
  return { p, tm, n, audioEnd };
}

/** Onde, no vídeo, aparece cada cenário da cena i (na palavra escolhida, ou em partes iguais). */
function edScenery(i) {
  const { p, tm, audioEnd } = edData();
  const s = p.scenes[i];
  const list = s.cutaways ?? [];
  if (!list.length) return [];
  const a0 = tm.audioStarts[i] ?? 0;
  const a1 = audioEnd(i);
  const anchored = list.some((c) => c.atWord !== undefined);
  const order = list.map((c, idx) => ({ c, idx })).sort((x, y) => (x.c.atWord ?? 0) - (y.c.atWord ?? 0));
  const part = (a1 - a0) / list.length;
  return order.map(({ c, idx }, k) => {
    const from = anchored ? (tm.wordT[i]?.[c.atWord ?? 0] ?? a0) : a0 + k * part;
    return { c, idx, from, to: 0 };
  }).map((x, k, arr) => ({ ...x, to: arr[k + 1] ? arr[k + 1].from : a1 }));
}

const edSceneAt = (t) => {
  const { tm, n } = edData();
  let j = 0;
  for (let i = 0; i < n; i++) if (t >= (tm.starts[i] ?? 0)) j = i;
  return j;
};
const edWordAt = (i, t) => {
  const w = edData().tm.wordT[i] ?? [];
  let k = 0;
  w.forEach((x, j) => { if (x <= t) k = j; });
  return k;
};

// ── reprodução ────────────────────────────────────────────────────────────
function edStop() {
  ED.playing = false;
  cancelAnimationFrame(ED.raf);
  ED.audio?.pause();
  ED.music?.pause();
  document.querySelectorAll('#ed-prev video').forEach((v) => v.pause());
  const b = $('#ed-play');
  if (b) b.textContent = '▶';
}

function edAudioFor() {
  const st = curStatus();
  const key = `${state.id}|${state.version}|${st.audio?.exists}|${state.data.timing.exact}`;
  if (!st.audio?.exists) { ED.audio = null; ED.audioKey = ''; return null; }
  if (ED.audioKey !== key) {
    ED.audio = new Audio(`/api/projects/${state.id}/audio?version=${state.version}&t=${Date.now()}`);
    ED.audioKey = key;
  }
  return ED.audio;
}

function edPlay() {
  const { tm, p } = edData();
  if (ED.t >= tm.total - 0.2) ED.t = 0;
  ED.playing = true;
  const a = edAudioFor();
  if (a) { a.currentTime = ED.t; a.play().catch(() => {}); }
  if (p.music?.file && /^music\//.test(p.music.file)) {
    ED.music = new Audio(`/api/projects/${state.id}/file?p=${encodeURIComponent(p.music.file)}`);
    ED.music.volume = 0.15;
    ED.music.currentTime = ED.t;
    ED.music.play().catch(() => {});
  }
  $('#ed-play').textContent = '⏸';
  ED.last = performance.now();
  const tick = (now) => {
    if (!ED.playing) return;
    const dt = (now - ED.last) / 1000;
    ED.last = now;
    ED.t = ED.audio && !ED.audio.paused ? ED.audio.currentTime : ED.t + dt;
    if (ED.t >= tm.total) { ED.t = tm.total; edStop(); }
    edPaint();
    ED.raf = requestAnimationFrame(tick);
  };
  ED.raf = requestAnimationFrame(tick);
}

function edSeek(t) {
  const { tm } = edData();
  ED.t = Math.max(0, Math.min(tm.total, t));
  if (ED.audio) ED.audio.currentTime = ED.t;
  if (ED.music) ED.music.currentTime = ED.t;
  edPaint();
}

// ── pré-visualização (o "ecrã" do vídeo) ──────────────────────────────────
function edPreview() {
  const { p } = edData();
  const asp = p.aspect === '16:9' ? [400, 225] : p.aspect === '1:1' ? [300, 300] : [216, 384];
  const k = asp[0] / 1080;
  const look = LOOK_CSS[p.style?.look ?? 'natural'] ?? 'none';
  const accent = state.data.brand?.colors?.accent ?? '#f5b82e';
  const box = h('div', { id: 'ed-prev', class: 'ed-screen', style: `width:${asp[0]}px;height:${asp[1]}px` },
    h('div', { id: 'ed-bg', style: `position:absolute;inset:0;filter:${look}` }),
    p.style?.vignette && h('div', { style: 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 52%,rgba(0,0,0,.5) 100%)' }),
    h('div', { id: 'ed-face', class: 'ed-face', hidden: true }),
    h('div', { id: 'ed-ovs', style: 'position:absolute;inset:0;pointer-events:none' }),
    h('div', { id: 'ed-cap', style: `position:absolute;left:5%;right:5%;bottom:${asp[1] > asp[0] ? 22 : 10}%;text-align:center;font-weight:800;font-size:${64 * k}px;line-height:1.15;color:#fff;text-shadow:0 0 4px #000,0 2px 8px #000` }),
    h('div', { id: 'ed-sig', style: `position:absolute;left:5%;bottom:34%;color:#fff;text-shadow:0 1px 4px #000;border-left:3px solid ${accent};padding-left:8px;display:none` }));
  ED.ctx = { k, accent, ovEls: [], bgKey: '', faceKey: '' };
  const ov = p.overlays ?? [];
  ov.forEach((o) => {
    const el = h('div', { style: `position:absolute;left:${o.x ?? 50}%;top:${o.y ?? 30}%;transform:translate(-50%,-50%);text-align:center;max-width:86%;display:none` });
    if (o.kind === 'emoji') { el.style.fontSize = `${150 * k * (o.size ?? 1)}px`; el.style.lineHeight = '1'; el.textContent = o.text; }
    else if (o.kind === 'image') el.append(h('img', { src: `/api/projects/${p.id}/file?p=${encodeURIComponent(o.media ?? '')}`, style: `width:${asp[0] * 0.4 * (o.size ?? 1)}px;border-radius:4px` }));
    else {
      const st = o.style ?? 'destaque';
      const look2 = st === 'caixa' ? 'background:rgba(0,0,0,.62);color:#fff;padding:2px 7px;border-radius:6px;' : st === 'simples' ? 'color:#fff;text-shadow:0 1px 4px #000;' : `background:${accent};color:#101820;padding:2px 7px;border-radius:6px;`;
      el.append(h('span', { style: `display:inline-block;font-weight:800;font-size:${66 * k * (o.size ?? 1)}px;line-height:1.12;${look2}` }, o.text));
    }
    ED.ctx.ovEls.push(el);
    box.querySelector('#ed-ovs').append(el);
  });
  setTimeout(edPaint, 0);
  return box;
}

function edMedia(path, video, contain) {
  const { p } = edData();
  const src = `/api/projects/${p.id}/file?p=${encodeURIComponent(path)}`;
  return video ? h('video', { src, muted: true, playsinline: true, style: `width:100%;height:100%;object-fit:${contain ? 'contain' : 'cover'}` }) : h('img', { src, style: `width:100%;height:100%;object-fit:${contain ? 'contain' : 'cover'}` });
}

function edPaint() {
  const prev = $('#ed-prev');
  if (!prev || !ED.ctx) return;
  const { p, tm } = edData();
  const t = ED.t;
  const i = edSceneAt(t);
  const s = p.scenes[i];
  const bg = $('#ed-bg');
  const face = $('#ed-face');
  const items = edScenery(i);
  const cur = items.find((x) => t >= x.from && t < x.to);
  const st = state.data.scenes[i];
  const hasFace = st?.kind === 'video';

  // fundo: o cenário atual, ou o rosto (vídeo gravado) em ecrã inteiro
  let key = '';
  let node = null;
  if (cur) {
    const isVid = /\.(mp4|mov|webm|m4v)$/i.test(cur.c.media);
    key = `c:${cur.c.media}:${cur.from}`;
    if (ED.ctx.bgKey !== key) { ED.ctx.bgKey = key; bg.replaceChildren(edMedia(cur.c.media, isVid, (cur.c.fit ?? p.imageFit) === 'contain')); bg.style.background = '#000'; }
    const v = bg.querySelector('video');
    if (v) { const want = (cur.c.startFrom ?? 0) + (t - cur.from); if (Math.abs(v.currentTime - want) > 0.4) v.currentTime = Math.max(0, want); if (ED.playing) v.play().catch(() => {}); else v.pause(); }
  } else if (hasFace) {
    key = `f:${s.id}`;
    if (ED.ctx.bgKey !== key) { ED.ctx.bgKey = key; bg.replaceChildren(h('video', { src: `/api/projects/${p.id}/voice/${s.id}`, muted: true, playsinline: true, style: 'width:100%;height:100%;object-fit:cover' })); }
    const v = bg.querySelector('video');
    const want = Math.max(0, t - (tm.audioStarts[i] ?? 0));
    if (v && Math.abs(v.currentTime - want) > 0.4) v.currentTime = want;
    if (v) { if (ED.playing) v.play().catch(() => {}); else v.pause(); }
  } else if (ED.ctx.bgKey !== 'none') {
    ED.ctx.bgKey = 'none';
    bg.replaceChildren();
    bg.style.background = 'linear-gradient(160deg,#243b55,#0f2027)';
  }
  // rosto em bolha por cima dos cenários
  if (cur && hasFace) {
    face.hidden = false;
    const fk = `b:${s.id}`;
    if (ED.ctx.faceKey !== fk) { ED.ctx.faceKey = fk; face.replaceChildren(h('video', { src: `/api/projects/${p.id}/voice/${s.id}`, muted: true, playsinline: true, style: 'width:100%;height:100%;object-fit:cover' })); }
    const v = face.querySelector('video');
    const want = Math.max(0, t - (tm.audioStarts[i] ?? 0));
    if (v && Math.abs(v.currentTime - want) > 0.4) v.currentTime = want;
    if (v) { if (ED.playing) v.play().catch(() => {}); else v.pause(); }
  } else { face.hidden = true; ED.ctx.faceKey = ''; }

  // textos, emojis, imagens
  (p.overlays ?? []).forEach((o, k) => {
    const oi = p.scenes.findIndex((x) => x.id === o.scene);
    const from = (tm.audioStarts[Math.max(0, oi)] ?? 0) + (o.at ?? 0.5);
    ED.ctx.ovEls[k].style.display = t >= from && t < from + (o.seconds ?? 3) ? '' : 'none';
  });

  // legendas
  const cap = $('#ed-cap');
  if (p.captions === false) cap.textContent = '';
  else {
    const line = (tm.lines ?? []).find((l) => t >= l.start && t < l.end + 0.1);
    cap.replaceChildren(...(line ? line.words.map((w) => h('span', { style: `color:${t >= w.start && t < w.end + 0.04 ? ED.ctx.accent : '#fff'}` }, w.text + ' ')) : []));
  }
  // assinatura
  const sig = $('#ed-sig');
  const sg = s.signature;
  if (sg?.name && t >= (tm.audioStarts[i] ?? 0) + (sg.at ?? 0.3) && t < (tm.audioStarts[i] ?? 0) + (sg.at ?? 0.3) + (sg.seconds ?? 5)) {
    sig.style.display = '';
    sig.replaceChildren(h('div', { style: `font-weight:700;font-size:${52 * ED.ctx.k}px` }, sg.name), sg.role && h('div', { style: `font-size:${34 * ED.ctx.k}px;color:${ED.ctx.accent}` }, sg.role));
  } else sig.style.display = 'none';

  // cursor da linha do tempo
  const ph = $('#ed-playhead');
  if (ph) ph.style.left = `${92 + t * ED.pps}px`;
  const tl = $('#ed-time');
  if (tl) tl.textContent = `${fmtT(t)} / ${fmtT(tm.total)}`;
  if (ED.playing) {
    const sc = $('#ed-scroll');
    if (sc && 92 + t * ED.pps > sc.scrollLeft + sc.clientWidth - 40) sc.scrollLeft = 92 + t * ED.pps - 120;
  }
}

// ── a linha do tempo ──────────────────────────────────────────────────────
function edTimeline() {
  const { p, tm, n } = edData();
  const pps = ED.pps;
  const W = Math.ceil(tm.total * pps) + 40;
  const ov = (p.overlays ??= []);
  const selIs = (type, a, b) => ED.sel && ED.sel.type === type && ED.sel.a === a && (b === undefined || ED.sel.b === b);
  const select = (sel) => { ED.sel = sel; renderEditor(); };

  const blk = (from, to, cls, kids, extra = {}) => h('div', { class: 'tl-block ' + cls, style: `left:${from * pps}px;width:${Math.max(8, (to - from) * pps)}px`, ...extra }, kids);
  const lane = (name, kids, rows = 1) => h('div', { class: 'tl-row' }, h('div', { class: 'tl-name' }, name),
    h('div', { class: 'tl-lane', style: `width:${W}px;height:${rows * 42 + 4}px`, onpointerdown: (e) => { if (e.target === e.currentTarget) { edSeek((e.clientX - e.currentTarget.getBoundingClientRect().left) / pps); } } }, ...kids));

  const step = pps >= 40 ? 1 : pps >= 22 ? 2 : 5;
  const ticks = [];
  for (let t = 0; t <= tm.total; t += step) ticks.push(h('div', { class: 'tl-tick', style: `left:${t * pps}px` }, `${t}s`));
  const ruler = h('div', { class: 'tl-ruler', style: `width:${W}px;cursor:pointer;margin-left:0`, onpointerdown: (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    edSeek((e.clientX - r.left) / pps);
    const mv = (ev) => edSeek((ev.clientX - r.left) / pps);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  } }, ...ticks);

  // Cenas
  const scenes = p.scenes.map((s, i) => blk(tm.starts[i] ?? 0, tm.starts[i + 1] ?? tm.total, 'scene' + (selIs('scene', i) ? ' sel' : ''),
    h('span', { class: 'tl-lab' }, `${i + 1} · ${s.narration.slice(0, 40)}`), { onclick: () => select({ type: 'scene', a: i }) }));

  // Vídeo / cenários
  const vids = [];
  p.scenes.forEach((s, i) => {
    const items = edScenery(i);
    if (!items.length && state.data.scenes[i]?.kind === 'video') vids.push(blk(tm.audioStarts[i] ?? 0, (tm.audioStarts[i] ?? 0) + (tm.durations[i] ?? 3), 'face', '🧑 o seu rosto', { onclick: () => select({ type: 'scene', a: i }) }));
    items.forEach((x) => {
      const isVid = /\.(mp4|mov|webm|m4v)$/i.test(x.c.media);
      const el = blk(x.from, x.to, 'cen' + (selIs('cen', i, x.idx) ? ' sel' : ''), [!isVid && h('img', { class: 'tl-th', src: `/api/projects/${p.id}/file?p=${encodeURIComponent(x.c.media)}` }), h('span', { class: 'tl-lab' }, (x.c.fit === 'contain' ? '🔲 ' : isVid ? '🎬 ' : '') + x.c.media.split('/').pop())]);
      el.addEventListener('pointerdown', (e) => edDrag(e, el, x.from, (abs, moved) => {
        if (!moved) return select({ type: 'cen', a: i, b: x.idx });
        // arrastar = o cenário passa a entrar na palavra mais próxima
        const list = s.cutaways;
        list.forEach((c) => { if (c.atWord === undefined) { const it = items.find((y) => y.c === c); c.atWord = edWordAt(i, it ? it.from : 0); } });
        x.c.atWord = edWordAt(i, abs + 0.05);
        list.sort((a, b) => (a.atWord ?? 0) - (b.atWord ?? 0));
        ED.sel = { type: 'cen', a: i, b: list.indexOf(x.c) };
        dirty(); renderEditor();
      }, { min: tm.audioStarts[i] ?? 0, max: (tm.audioStarts[i] ?? 0) + (tm.durations[i] ?? 3) - 0.5 }));
      vids.push(el);
    });
  });

  // Texto / emoji / imagem
  const rowEnd = [];
  const ovs = ov.map((o, k) => {
    const oi = Math.max(0, p.scenes.findIndex((x) => x.id === o.scene));
    const from = (tm.audioStarts[oi] ?? 0) + (o.at ?? 0.5);
    const label = o.kind === 'image' ? '🖼 ' + (o.media ?? '').split('/').pop() : o.kind === 'emoji' ? o.text : 'T ' + (o.text ?? '');
    let row = rowEnd.findIndex((end) => end <= from + 0.01);
    if (row < 0) row = rowEnd.length;
    rowEnd[row] = from + (o.seconds ?? 3);
    const el = blk(from, from + (o.seconds ?? 3), 'ov' + (selIs('ov', k) ? ' sel' : ''), [h('span', { class: 'tl-lab' }, label), h('i', { class: 'tl-handle' })]);
    el.style.top = `${3 + row * 42}px`;
    el.addEventListener('pointerdown', (e) => {
      const resize = e.target.classList.contains('tl-handle');
      edDrag(e, el, from, (abs, moved, secs) => {
        if (moved) {
          if (resize) o.seconds = secs;
          else { const j = edSceneAt(abs); o.scene = p.scenes[j].id; o.at = Math.max(0, Math.round((abs - (tm.audioStarts[j] ?? 0)) * 10) / 10); }
          dirty();
        }
        ED.sel = { type: 'ov', a: k };
        renderEditor();
      }, { resize, secs: o.seconds ?? 3 });
    });
    return el;
  });

  // Música e efeitos (barras de ponta a ponta)
  const music = blk(0, tm.total, 'mus' + (ED.sel?.type === 'music' ? ' sel' : ''), h('span', { class: 'tl-lab' }, p.music ? '🎵 ' + p.music.file.split('/').pop() : '＋ Clique para juntar música'), { onclick: () => select({ type: 'music' }) });
  const fx = blk(0, tm.total, 'fx' + (ED.sel?.type === 'fx' ? ' sel' : ''), h('span', { class: 'tl-lab' }, `✨ cor: ${p.style?.look ?? 'natural'} · transição: ${p.style?.transition ?? 'fundido'} · legendas: ${p.captions === false ? 'desligadas' : (p.style?.captionStyle ?? 'karaokê')}`), { onclick: () => select({ type: 'fx' }) });

  const playhead = h('div', { id: 'ed-playhead', class: 'tl-playhead', style: `left:${92 + ED.t * pps}px` });
  return h('div', { class: 'tl-scroll', id: 'ed-scroll', style: 'position:relative' },
    h('div', { style: 'display:flex' }, h('div', { style: 'width:92px;flex:none' }), ruler),
    lane('Cenas e voz', scenes), lane('Vídeo e imagens', vids), lane('Texto · emoji · imagem', ovs, Math.max(1, rowEnd.length)), lane('Música', [music]), lane('Efeitos', [fx]), playhead);
}

/** Arrastar um bloco na linha do tempo (mover ou, com `resize`, mudar a duração). */
function edDrag(e, el, from0, done, o = {}) {
  e.preventDefault();
  e.stopPropagation();
  const pps = ED.pps;
  const x0 = e.clientX;
  let moved = false;
  let abs = from0;
  let secs = o.secs ?? 3;
  const move = (ev) => {
    if (Math.abs(ev.clientX - x0) > 3) moved = true;
    const dx = (ev.clientX - x0) / pps;
    if (o.resize) { secs = Math.max(0.8, Math.round((o.secs + dx) * 10) / 10); el.style.width = secs * pps + 'px'; }
    else { abs = Math.max(o.min ?? 0, Math.min(o.max ?? edData().tm.total - 1, from0 + dx)); el.style.left = abs * pps + 'px'; }
  };
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); done(abs, moved, secs); };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

// ── ferramentas: cortar, apagar, juntar no cursor ─────────────────────────
function edCut() {
  const { p, tm } = edData();
  const t = ED.t;
  const i = edSceneAt(t);
  const sel = ED.sel;
  // Se há um cenário escolhido e o cursor está dentro dele: corta o cenário
  if (sel?.type === 'cen') {
    const items = edScenery(sel.a);
    const it = items.find((x) => x.idx === sel.b);
    if (it && t > it.from + 0.4 && t < it.to - 0.4) {
      const s = p.scenes[sel.a];
      s.cutaways.forEach((c) => { if (c.atWord === undefined) { const y = items.find((z) => z.c === c); c.atWord = edWordAt(sel.a, y ? y.from : 0); } });
      const isVid = /\.(mp4|mov|webm|m4v)$/i.test(it.c.media);
      const copy = { ...it.c, atWord: edWordAt(sel.a, t), ...(isVid ? { startFrom: Math.round(((it.c.startFrom ?? 0) + (t - it.from)) * 10) / 10 } : {}) };
      if (copy.atWord <= (it.c.atWord ?? 0)) return toast('Ponha o cursor mais à frente, numa palavra seguinte.');
      s.cutaways.push(copy);
      s.cutaways.sort((a, b) => (a.atWord ?? 0) - (b.atWord ?? 0));
      dirty(); renderEditor();
      return toast('Cenário cortado em dois.');
    }
  }
  // senão: corta a cena na palavra seguinte ao cursor
  if (state.data.scenes[i]?.recorded) return alert('Esta cena tem gravação (a gravação cobre a cena toda): apague-a primeiro, ou corte antes de gravar.');
  const w = tm.wordT[i] ?? [];
  const k = w.findIndex((x) => x > t);
  if (k <= 0) return toast('Ponha o cursor no meio da fala da cena que quer cortar.');
  splitSceneAt(p, i, k);
  edResync();
}

function edDelete() {
  const { p } = edData();
  const sel = ED.sel;
  if (!sel) return toast('Clique primeiro num elemento da linha do tempo.');
  if (sel.type === 'ov') { p.overlays.splice(sel.a, 1); ED.sel = null; }
  else if (sel.type === 'cen') { p.scenes[sel.a].cutaways.splice(sel.b, 1); if (!p.scenes[sel.a].cutaways.length) p.scenes[sel.a].cutaways = undefined; ED.sel = null; }
  else if (sel.type === 'scene') { if (p.scenes.length < 2) return alert('O vídeo precisa de pelo menos uma cena.'); if (!confirm(`Remover a cena ${sel.a + 1}?`)) return; p.scenes.splice(sel.a, 1); ED.sel = null; dirty(); renderEditor(); return edResync(); }
  else if (sel.type === 'music') { p.music = undefined; ED.sel = null; }
  else return toast('Este elemento não se apaga aqui.');
  dirty(); renderEditor();
}

function edAddOverlay(o) {
  const { p, tm } = edData();
  const i = edSceneAt(ED.t);
  (p.overlays ??= []).push({ scene: p.scenes[i].id, at: Math.max(0, Math.round((ED.t - (tm.audioStarts[i] ?? 0)) * 10) / 10), seconds: 3, x: 50, y: 30, size: 1, ...o });
  ED.sel = { type: 'ov', a: p.overlays.length - 1 };
  dirty(); renderEditor();
}

function edAddScenery(path) {
  const { p, tm } = edData();
  const i = edSceneAt(ED.t);
  const s = p.scenes[i];
  const list = (s.cutaways ??= []);
  const items = edScenery(i);
  list.forEach((c) => { if (c.atWord === undefined) { const y = items.find((z) => z.c === c); c.atWord = edWordAt(i, y ? y.from : 0); } });
  const rel = ED.t - (tm.audioStarts[i] ?? 0);
  list.push({ media: path, atWord: rel < 0.5 ? 0 : edWordAt(i, ED.t) });
  list.sort((a, b) => (a.atWord ?? 0) - (b.atWord ?? 0));
  ED.sel = { type: 'cen', a: i, b: list.findIndex((c) => c.media === path) };
  dirty(); renderEditor();
}

// ── painel do que está escolhido ──────────────────────────────────────────
function edPanel() {
  const { p } = edData();
  const sel = ED.sel;
  if (!sel) return h('div', { class: 'muted' }, h('p', {}, 'Clique num bloco da linha do tempo para o editar.'),
    h('p', {}, '▶ toca o vídeo. Clique na régua para pôr o cursor num sítio, e use ✂ Cortar ou os botões + para acrescentar ali.'));
  if (sel.type === 'ov' && p.overlays?.[sel.a]) return overlayEditor(p, p.overlays, sel.a, true);
  if (sel.type === 'cen') {
    const c = p.scenes[sel.a]?.cutaways?.[sel.b];
    if (!c) return h('p', { class: 'muted' }, 'Elemento já não existe.');
    const isVid = /\.(mp4|mov|webm|m4v)$/i.test(c.media);
    return h('div', { class: 'stack zone' },
      h('b', {}, (isVid ? '🎬 ' : '🖼 ') + c.media.split('/').pop()),
      h('label', { class: 'fit-opt' }, h('input', { type: 'checkbox', checked: c.fit === 'contain', onchange: (e) => { c.fit = e.target.checked ? 'contain' : undefined; dirty(); renderEditor(); } }), ' Mostrar inteira (cartaz, sem cortar)'),
      isVid && h('label', {}, 'Começa aos (s) do vídeo', h('input', { type: 'number', min: 0, step: 0.5, value: c.startFrom ?? 0, onchange: (e) => { c.startFrom = Number(e.target.value) || undefined; dirty(); renderEditor(); } })),
      h('div', { class: 'row' },
        h('button', { onclick: () => pickWord(p.scenes[sel.a], c) }, '⏱ Escolher a palavra em que entra'),
        h('button', { class: 'danger', onclick: edDelete }, '🗑 Apagar')),
      h('p', { class: 'muted', style: 'margin:0' }, 'Dica: arraste o bloco na linha do tempo para mudar quando entra, ou ponha o cursor dentro dele e carregue em ✂ Cortar.'));
  }
  if (sel.type === 'scene' && p.scenes[sel.a]) return simpleScene(p, p.scenes[sel.a], sel.a, state.data.scenes[sel.a]);
  if (sel.type === 'music') return musicBlock(p);
  if (sel.type === 'fx') return h('div', { class: 'stack' }, finishBlock(p), edFormat(p));
  return null;
}

function edFormat(p) {
  return h('div', { class: 'zone' },
    h('b', {}, 'Formato do vídeo'),
    h('div', { class: 'row', style: 'gap:8px;margin:6px 0 10px;flex-wrap:wrap' },
      ...[['9:16', '📱 Vertical 9:16'], ['16:9', '🖥 Horizontal 16:9'], ['1:1', '⬜ Quadrado']].map(([v, t]) =>
        h('button', { class: 'chip' + ((p.aspect ?? '9:16') === v ? ' on' : ''), onclick: () => { p.aspect = v; dirty(); renderEditor(); } }, t))),
    h('b', {}, 'Imagens dos cenários'),
    h('div', { class: 'row', style: 'gap:8px;margin:6px 0 0;flex-wrap:wrap' },
      ...[['cover', '🖼 Preencher o ecrã'], ['contain', '🔲 Inteiras (cartazes)']].map(([v, t]) =>
        h('button', { class: 'chip' + ((p.imageFit ?? 'cover') === v ? ' on' : ''), onclick: () => { p.imageFit = v === 'cover' ? undefined : v; dirty(); renderEditor(); } }, t))),
    h('label', { class: 'ver-sel', style: 'margin-top:8px' }, h('input', { type: 'checkbox', checked: p.captions !== false, onchange: (e) => { p.captions = e.target.checked ? undefined : false; dirty(); renderEditor(); } }), ' Legendas'));
}

// ── a página do editor ────────────────────────────────────────────────────
function renderVideoEditor() {
  edStop();
  const { p, tm } = edData();
  const main = $('#main');
  const scroll = window.scrollY;
  if (!ED.pps || ED.proj !== p.id) { ED.proj = p.id; ED.pps = Math.min(40, Math.max(9, Math.floor(760 / tm.total))); ED.t = 0; ED.sel = null; }
  const { brand, issues, files } = state.data;

  const head = h('section', { class: 'card stack' },
    h('div', { class: 'row' },
      h('h2', { style: 'margin:0;flex:1' }, p.title),
      h('button', { title: 'Voltar à página com todos os campos', onclick: () => edSetMode('list') }, '☰ Modo lista'),
      h('span', { class: 'pill' }, `marca: ${brand?.name ?? p.brand}`)),
    h('ul', { class: 'issues', id: 'issues' }, issueItems(issues)));

  const banner = !tm.exact
    ? h('div', { class: 'zone', style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap' },
      h('span', {}, '⏱ Os tempos ainda são aproximados. Para cortar e posicionar com precisão, calcule os tempos (gera a voz, não demora).'),
      h('button', { class: 'primary', onclick: () => build({ noRender: true }) }, '🔊 Calcular os tempos'))
    : null;

  const tools = h('div', { class: 'actions ed-tools' },
    h('button', { disabled: !canUndo(), title: 'Desfazer a última alteração (Ctrl+Z)', onclick: () => histGo(-1) }, '↶ Desfazer'),
    h('button', { disabled: !canRedo(), title: 'Refazer (Ctrl+Y)', onclick: () => histGo(1) }, '↷ Refazer'),
    h('button', { id: 'ed-play', class: 'primary', style: 'min-width:46px', title: 'Tocar / parar (barra de espaço)', onclick: () => (ED.playing ? edStop() : edPlay()) }, '▶'),
    h('span', { id: 'ed-time', class: 'pill', style: 'font-size:14px' }, ''),
    h('button', { title: 'Corta no cursor: a cena (na palavra seguinte) ou o cenário escolhido', onclick: edCut }, '✂ Cortar aqui'),
    h('button', { onclick: edDelete }, '🗑 Apagar'),
    h('span', { class: 'muted' }, 'Juntar no cursor:'),
    h('button', { onclick: () => edAddOverlay({ kind: 'text', text: 'Escreva aqui', style: 'destaque', anim: 'pop', y: 14 }) }, '+ Texto'),
    h('button', { onclick: () => edAddOverlay({ kind: 'emoji', text: '🙏', y: 40, size: 1.2, anim: 'pop' }) }, '+ Emoji'),
    h('button', { onclick: async () => {
      const f = await pickFile('image/jpeg,image/png,image/webp');
      if (!f) return;
      if (!(await flushBeforeUpload())) return;
      try { const r = await uploadTo('media', p.scenes[edSceneAt(ED.t)].id, f, 'Imagem'); edAddOverlay({ kind: 'image', media: r.path, y: 35, anim: 'fade' }); } catch (e) { toast('Erro: ' + e.message, 6000); }
    } }, '+ Imagem'),
    h('button', { onclick: async () => {
      const f = await pickFile('image/*,video/*');
      if (!f) return;
      if (!(await flushBeforeUpload())) return;
      try { const r = await uploadTo('media', p.scenes[edSceneAt(ED.t)].id, f, 'Cenário'); edAddScenery(r.path); } catch (e) { toast('Erro: ' + e.message, 6000); }
    } }, '+ Cenário (imagem ou vídeo)'),
    h('button', { onclick: () => openPexels(p.scenes[edSceneAt(ED.t)].id, (path) => edAddScenery(path)) }, '+ Pexels'),
    h('button', { onclick: () => { ED.sel = { type: 'music' }; renderEditor(); } }, '🎵 Música'),
    h('button', { onclick: () => { ED.sel = { type: 'fx' }; renderEditor(); } }, '✨ Efeitos'),
    h('label', { class: 'ver-sel' }, 'Zoom', h('input', { type: 'range', min: 6, max: 60, value: ED.pps, oninput: (e) => { ED.pps = Number(e.target.value); renderEditor(); } })));

  const top = h('section', { class: 'card ed-top' },
    h('div', { class: 'ed-left' }, edPreview()),
    h('div', { class: 'ed-right' }, edPanel()));

  main.replaceChildren(h('div', { class: 'stack' }, head, banner, top, h('section', { class: 'card stack' }, tools, edTimeline()), qualityCard(), approvalSection(p), actionsBar()));
  window.scrollTo(0, scroll);
  loadPublication(files, outIdOf(p));
  edPaint();
}

// barra de espaço = tocar/parar (quando não se está a escrever)
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !$('#ed-prev')) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
  e.preventDefault();
  ED.playing ? edStop() : edPlay();
});

/** Depois de mudar o número de cenas: guarda e pede ao servidor os tempos de novo (ficam aproximados até gerar a voz). */
async function edResync() {
  if (!(await save())) return;
  await refresh();
}
