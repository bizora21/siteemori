// Juntar fotos e vídeos diretamente na linha "Vídeo e fotos": clicar num ponto, escolher o ficheiro (ou largá-lo ali).
// Também os "buracos" (partes da cena ainda sem imagem) ficam visíveis e clicáveis.

const edLeadOf = () => state.data.timing?.lead ?? 0.4;

/** Quanto tempo cabe uma foto/vídeo: o que o cursor "vê" da cena em t. */
function edLaneTime(e, laneEl) {
  const left = laneEl.getBoundingClientRect().left;
  return Math.max(0, Math.min(edData().tm.total, (e.clientX - left) / ED.pps));
}

function edMenuClose() {
  $('#ed-menu')?.remove();
}

/** Pequeno menu no ponto clicado: de onde vem a foto ou o vídeo. */
function edAddMenu(x, y, t) {
  edMenuClose();
  const { p, tm } = edData();
  const i = edSceneAt(t);
  const m = h('div', { id: 'ed-menu', class: 'ed-menu', role: 'menu', style: `left:${Math.min(x, window.innerWidth - 270)}px;top:${Math.max(8, y - 150)}px` },
    h('b', {}, `Juntar aqui · cena ${i + 1} · ${fmtT(t)}`),
    h('button', { role: 'menuitem', onclick: () => { edMenuClose(); edAddAt(t, 'file'); } }, '📁 Foto ou vídeo do computador'),
    h('button', { role: 'menuitem', onclick: () => { edMenuClose(); edAddAt(t, 'pexels'); } }, '🌄 Procurar no Pexels (grátis)'),
    h('button', { role: 'menuitem', onclick: edMenuClose }, '✖ Cancelar'));
  document.body.append(m);
  setTimeout(() => document.addEventListener('pointerdown', function away(ev) { if (!m.contains(ev.target)) { edMenuClose(); document.removeEventListener('pointerdown', away); } }), 0);
  edSeek(t);
  void p; void tm;
}

/** Junta, exatamente em t, uma foto/vídeo (do computador ou do Pexels). */
async function edAddAt(t, how) {
  const { p } = edData();
  ED.sel = null;
  ED.range = null;
  const sid = p.scenes[edSceneAt(t)].id;
  if (how === 'pexels') {
    ED.t = t;
    return openPexels(sid, (path) => { ED.sel = null; ED.t = t; edAddScenery(path); });
  }
  const f = await pickFile('image/*,video/*');
  if (f) edUploadAt(f, t);
}

async function edUploadAt(f, t) {
  if (!/^(image|video)\//.test(f.type)) return toast('Só consigo juntar fotos e vídeos.', 4000);
  if (!(await flushBeforeUpload())) return;
  const { p } = edData();
  ED.sel = null;
  ED.range = null;
  ED.t = t;
  try {
    const r = await uploadTo('media', p.scenes[edSceneAt(t)].id, f, 'Cenário');
    ED.sel = null;
    ED.t = t;
    edAddScenery(r.path);
  } catch (e) { toast('Erro: ' + e.message, 6000); }
}

/** Largar um ficheiro na linha: entra no ponto onde o largou. */
function edLaneDrop(e, laneEl, kind) {
  e.preventDefault();
  laneEl.classList.remove('drop');
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  if (kind === 'sound') edUploadSound(f, edLaneTime(e, laneEl)); else edUploadAt(f, edLaneTime(e, laneEl));
}

/** Blocos tracejados: as partes de cada cena que ainda estão sem foto nem vídeo. */
function edGapBlocks(blk) {
  const { p, tm } = edData();
  const out = [];
  p.scenes.forEach((s, i) => {
    const a0 = tm.audioStarts[i] ?? 0;
    const a1 = a0 + (tm.durations[i] ?? 3);
    if (state.data.scenes[i]?.kind === 'video' && !edScenery(i).length) return;
    const items = edScenery(i);
    const gaps = [];
    if (!items.length) gaps.push([a0, a1]);
    else if (items[0].from - a0 > 0.4) gaps.push([a0, items[0].from]);
    for (const [from, to] of gaps) {
      const el = blk(from, to, 'add', h('span', { class: 'tl-lab' }, `＋ Cena ${i + 1}: clique para juntar foto ou vídeo`), `Cena ${i + 1} sem foto nem vídeo nesta parte. Clique para juntar.`, () => {});
      el.addEventListener('click', (ev) => edAddMenu(ev.clientX, ev.clientY, from + 0.02));
      out.push(el);
    }
  });
  return out;
}

/** Linhas a tracejado e números das cenas: para se ver onde começa cada uma. */
function edSceneMarks() {
  const { p, tm } = edData();
  return p.scenes.map((s, i) => h('div', { class: 'tl-sceneline', style: `left:${ED_LABEL_W + (tm.starts[i] ?? 0) * ED.pps}px`, 'aria-hidden': 'true' }, h('span', {}, String(i + 1))));
}

// ── transição própria de cada foto/vídeo ──────────────────────────────────
const edTransName = (v, p) => (v === 'corte' ? 'corte seco' : (TRANSITIONS.find((x) => x[0] === (v ?? p.style?.transition ?? 'fade'))?.[1] ?? 'fundido').toLowerCase()) + (v ? '' : ' (a do vídeo todo)');
const edTransIcon = (v, p) => (v === 'corte' ? '✂' : (TRANSITIONS.find((x) => x[0] === (v ?? p.style?.transition ?? 'fade'))?.[2] ?? '◐'));

/** Menu no ponto clicado: escolher como esta foto ou vídeo entra. */
function edTransMenu(x, y, c) {
  edMenuClose();
  const { p } = edData();
  const pick = (v) => { c.transition = v; dirty(); edMenuClose(); renderEditor(); toast('Transição: ' + edTransName(v, p), 3000); };
  const opt = (v, t) => h('button', { role: 'menuitem', class: c.transition === v ? 'primary' : '', onclick: () => pick(v) }, t);
  const m = h('div', { id: 'ed-menu', class: 'ed-menu', role: 'menu', style: `left:${Math.min(x, window.innerWidth - 270)}px;top:${Math.max(8, y - 340)}px` },
    h('b', {}, 'Como esta imagem entra'),
    opt(undefined, '◐ A do vídeo todo'), opt('corte', '✂ Corte seco (sem transição)'),
    ...TRANSITIONS.map(([v, t, ico]) => opt(v, ico + ' ' + t)));
  document.body.append(m);
  setTimeout(() => document.addEventListener('pointerdown', function away(ev) { if (!m.contains(ev.target)) { edMenuClose(); document.removeEventListener('pointerdown', away); } }), 0);
}

// ── sons: ambiente do local, efeitos, gravações suas ──────────────────────
/** Junta um som (ficheiro ou gravação) em t. secs: duração conhecida (gravações). */
async function edUploadSound(f, t, secs) {
  if (!/^audio\//.test(f.type) && !/\.(mp3|wav|m4a|aac|ogg|opus|flac|webm|amr)$/i.test(f.name)) return toast('Só consigo juntar sons (mp3, wav, m4a, ogg…).', 4000);
  if (!(await flushBeforeUpload())) return;
  const { p, tm } = edData();
  const i = edSceneAt(t);
  try {
    const r = await uploadTo('sound', p.scenes[i].id, f, 'Som');
    let dur = secs;
    if (!dur || !isFinite(dur)) {
      dur = await new Promise((ok) => {
        const a = new Audio(`/api/projects/${p.id}/file?p=${encodeURIComponent(r.path)}`);
        a.onloadedmetadata = () => ok(isFinite(a.duration) ? a.duration : 5);
        a.onerror = () => ok(5);
      });
    }
    (p.sounds ??= []).push({ file: r.path, scene: p.scenes[i].id, at: Math.max(0, Math.round((t - (tm.audioStarts[i] ?? 0)) * 10) / 10), seconds: Math.round(Math.min(dur, 120) * 10) / 10, volume: 0.6, label: f.name.replace(/\.[^.]+$/, '').slice(0, 30) });
    ED.sel = { type: 'snd', a: p.sounds.length - 1 };
    dirty();
    renderEditor();
    toast(`Som juntado à cena ${i + 1}. Carregue em ▶ para o ouvir.`, 4500);
  } catch (e) { toast('Erro: ' + e.message, 6000); }
}

/** Menu no ponto clicado da linha de sons. */
function edSoundMenu(x, y, t) {
  edMenuClose();
  const i = edSceneAt(t);
  const m = h('div', { id: 'ed-menu', class: 'ed-menu', role: 'menu', style: `left:${Math.min(x, window.innerWidth - 270)}px;top:${Math.max(8, y - 160)}px` });
  const body = () => m.replaceChildren(
    h('b', {}, `Som aqui · cena ${i + 1} · ${fmtT(t)}`),
    h('button', { role: 'menuitem', onclick: async () => { edMenuClose(); const f = await pickFile('audio/*'); if (f) edUploadSound(f, t); } }, '📁 Som do computador (ambiente, efeito…)'),
    h('button', { role: 'menuitem', onclick: () => edRecordSound(m, t) }, '🎙 Gravar um som agora (no local)'),
    h('button', { role: 'menuitem', onclick: edMenuClose }, '✖ Cancelar'));
  body();
  document.body.append(m);
  setTimeout(() => document.addEventListener('pointerdown', function away(ev) { if (!m.contains(ev.target)) { if (!ED.rec) edMenuClose(); document.removeEventListener('pointerdown', away); } }), 0);
  edSeek(t);
}

/** Gravar o som do local com o microfone e juntá-lo exatamente em t. */
async function edRecordSound(m, t) {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return toast('Não consegui usar o microfone: deixe o navegador usá-lo e tente de novo.', 6000); }
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((x) => window.MediaRecorder?.isTypeSupported(x));
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  const t0 = Date.now();
  ED.rec = true;
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    ED.rec = false;
    clearInterval(tick);
    stream.getTracks().forEach((x) => x.stop());
    edMenuClose();
    const secs = (Date.now() - t0) / 1000;
    const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
    edUploadSound(new File([blob], `gravacao-${Date.now()}.webm`, { type: blob.type }), t, secs);
  };
  const lab = h('b', {}, '● A gravar… 0 s');
  const tick = setInterval(() => { lab.textContent = `● A gravar… ${Math.round((Date.now() - t0) / 1000)} s`; }, 500);
  m.replaceChildren(lab, h('button', { class: 'primary', onclick: () => rec.stop() }, '⏹ Parar e juntar'), h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Fale ou deixe o som do local. Carregue em Parar quando acabar.'));
  rec.start();
}

/** Painel de um som escolhido. */
function edSoundPanel(p, k) {
  const o = p.sounds?.[k];
  if (!o) return h('p', { class: 'muted' }, 'Este som já não existe.');
  let pl = null;
  return h('div', { class: 'stack' },
    h('div', { class: 'muted' }, o.file.split('/').pop()),
    h('label', {}, 'Nome', h('input', { type: 'text', value: o.label ?? '', oninput: (e) => { o.label = e.target.value || undefined; dirty(); } })),
    h('label', {}, `Volume: ${Math.round((o.volume ?? 0.6) * 100)}%`, h('input', { type: 'range', min: 5, max: 100, step: 5, value: Math.round((o.volume ?? 0.6) * 100), oninput: (e) => { o.volume = Number(e.target.value) / 100; e.target.parentNode.firstChild.textContent = `Volume: ${e.target.value}%`; dirty(); } })),
    h('div', { class: 'row', style: 'gap:8px' },
      h('label', {}, 'Começa aos (s)', h('input', { type: 'number', min: 0, step: 0.1, value: o.at ?? 0, onchange: (e) => { o.at = Math.max(0, Number(e.target.value) || 0); dirty(); renderEditor(); } })),
      h('label', {}, 'Dura (s)', h('input', { type: 'number', min: 0.3, step: 0.1, value: o.seconds ?? 5, onchange: (e) => { o.seconds = Math.max(0.3, Number(e.target.value) || 5); dirty(); renderEditor(); } }))),
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
      h('button', { onclick: () => { pl?.pause(); pl = new Audio(`/api/projects/${p.id}/file?p=${encodeURIComponent(o.file)}`); pl.volume = o.volume ?? 0.6; pl.play().catch(() => {}); } }, '▶ Ouvir este som'),
      h('button', { class: 'danger', onclick: edDelete }, '🗑 Apagar')),
    h('p', { class: 'muted', style: 'margin:0' }, 'Arraste o bloco na linha de sons para mudar quando toca; puxe as pontas para a duração.'));
}
