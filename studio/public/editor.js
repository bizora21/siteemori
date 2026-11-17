// Editor de vídeo (reportagem): o vídeo em cima, a linha do tempo por baixo.
// Tudo se faz ali: ouvir, cortar no cursor, juntar texto, emoji, imagem, cenário, música e efeitos.
// Pré-visualização leve (HTML, sem render): mostra o cenário, o texto, as legendas e o som da voz.
// Usa as funções globais de app.js / simple.js / timeline.js.

const ED = { dialog: null, showProjects: false, scrollX: 0, proj: null, t: 0, playing: false, sel: null, pps: 0, raf: 0, last: 0, audio: null, audioKey: '', music: null, ctx: null };

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
  const asp = p.aspect === '16:9' ? [440, 248] : p.aspect === '1:1' ? [320, 320] : [252, 448];
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
  if (ph) ph.style.left = `${ED_LABEL_W + t * ED.pps}px`;
  const tl = $('#ed-time');
  if (tl) tl.textContent = `${fmtT(t)} / ${fmtT(tm.total)}`;
  if (ED.playing) {
    const sc = $('#ed-scroll');
    if (sc && ED_LABEL_W + t * ED.pps > sc.scrollLeft + sc.clientWidth - 40) sc.scrollLeft = ED_LABEL_W + t * ED.pps - 120;
  }
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


/** Depois de mudar o número de cenas: guarda e pede ao servidor os tempos de novo (ficam aproximados até gerar a voz). */
async function edResync() {
  if (!(await save())) return;
  await refresh();
}
