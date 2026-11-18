// Escolher uma parte da linha do tempo (início → fim) e fazer algo com ela:
// cortá-la fora, separá-la numa cena, limpar o que lá está ou juntar texto / foto / vídeo nela.
// Arrasta-se na régua (ferramenta "Selecionar") ou marcam-se o início e o fim com as teclas I e O.

const fmtS = (x) => `${x.toFixed(1).replace('.', ',')} s`;

// ── desenho: faixa da parte escolhida por cima da linha do tempo ──────────
function rangeOverlay() {
  const r = ED.range;
  if (!r) return null;
  const pps = ED.pps;
  const hd = (which) => h('i', { class: 'tl-range-h ' + which, title: 'Puxe para mudar ' + (which === 'l' ? 'o início' : 'o fim'), onpointerdown: (e) => rangeHandleDrag(e, which) });
  return h('div', { id: 'ed-range', class: 'tl-range', style: `left:${ED_LABEL_W + r.a * pps}px;width:${(r.b - r.a) * pps}px` },
    h('span', { class: 'tl-range-lab' }, fmtS(r.b - r.a)), hd('l'), hd('r'));
}

function rangeDom() {
  const el = $('#ed-range');
  const r = ED.range;
  if (!el || !r) return;
  el.style.left = `${ED_LABEL_W + r.a * ED.pps}px`;
  el.style.width = `${(r.b - r.a) * ED.pps}px`;
  el.firstChild.textContent = fmtS(r.b - r.a);
  const bar = $('#ed-range-info');
  if (bar) bar.textContent = `Parte escolhida: ${fmtT(r.a)} → ${fmtT(r.b)} (${fmtS(r.b - r.a)})`;
}

/** Cola as pontas da parte escolhida ao início de uma palavra ou de uma cena, se estiver perto. */
function rangeSnap(t) {
  const { tm } = edData();
  const pts = [...tm.starts, ...tm.audioStarts, ...tm.wordT.flat(), 0, tm.total];
  let best = t;
  let d = 0.12;
  for (const x of pts) if (Math.abs(x - t) < d) { d = Math.abs(x - t); best = x; }
  return best;
}

function rangeTimeAt(clientX) {
  const ruler = $('.tl-ruler');
  const left = ruler.getBoundingClientRect().left;
  return Math.max(0, Math.min(edData().tm.total, (clientX - left) / ED.pps));
}

/** Arrastar na régua: escolhe a parte. Um simples clique só põe o cursor. */
function edRangeDrag(e) {
  e.preventDefault();
  const t0 = rangeTimeAt(e.clientX);
  let moved = false;
  const mv = (ev) => {
    const t1 = rangeTimeAt(ev.clientX);
    if (!moved && Math.abs(t1 - t0) * ED.pps < 5) return;
    moved = true;
    if (!$('#ed-range')) { ED.range = { a: Math.min(t0, t1), b: Math.max(t0, t1) }; const o = rangeOverlay(); $('#ed-scroll').append(o); }
    ED.range = { a: Math.min(t0, t1), b: Math.max(t0, t1) };
    rangeDom();
  };
  const up = () => {
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    if (!moved) { ED.range = null; edSeek(t0); renderEditor(); return; }
    const r = ED.range;
    r.a = rangeSnap(r.a);
    r.b = rangeSnap(r.b);
    if (r.b - r.a < 0.3) { ED.range = null; toast('Escolha uma parte maior (arraste mais).'); }
    renderEditor();
  };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
}

function rangeHandleDrag(e, which) {
  e.preventDefault();
  e.stopPropagation();
  const mv = (ev) => {
    const t = rangeTimeAt(ev.clientX);
    const r = ED.range;
    if (which === 'l') r.a = Math.min(t, r.b - 0.3); else r.b = Math.max(t, r.a + 0.3);
    rangeDom();
  };
  const up = () => {
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    ED.range.a = rangeSnap(ED.range.a);
    ED.range.b = rangeSnap(ED.range.b);
    renderEditor();
  };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
}

/** Teclas I e O: marcam o início e o fim da parte no cursor. */
function rangeMark(which) {
  const t = ED.t;
  const total = edData().tm.total;
  const r = ED.range ?? { a: t, b: Math.min(total, t + 2) };
  if (which === 'a') { r.a = t; if (r.b - r.a < 0.3) r.b = Math.min(total, t + 2); } else { r.b = t; if (r.b - r.a < 0.3) r.a = Math.max(0, t - 2); }
  ED.range = r;
  renderEditor();
}

function rangeClose() {
  ED.range = null;
  renderEditor();
}

function rangePlay() {
  const r = ED.range;
  if (!r) return;
  edSeek(r.a);
  ED.stopAt = r.b;
  edPlay();
}

// ── a barra de ações da parte escolhida ───────────────────────────────────
function rangeBar(p) {
  const r = ED.range;
  if (!r) return null;
  const btn = (t, title, fn, cls) => h('button', { class: cls ?? '', title, onclick: fn }, t);
  return h('div', { class: 'ed-range-bar', role: 'toolbar', 'aria-label': 'O que fazer com a parte escolhida' },
    h('b', { id: 'ed-range-info' }, `Parte escolhida: ${fmtT(r.a)} → ${fmtT(r.b)} (${fmtS(r.b - r.a)})`),
    btn('▶ Ouvir', 'Ver e ouvir só esta parte', rangePlay),
    btn('🗑 Cortar fora', 'Tira esta parte do vídeo: o texto, a voz e o que lá está. O resto junta-se.', rangeCutOut, 'danger'),
    btn('✂ Separar numa cena', 'Faz desta parte uma cena só dela, para a mover, mudar ou apagar', rangeSeparate),
    btn('🧹 Limpar fotos e textos', 'Apaga as fotos, vídeos e textos que começam nesta parte (a voz fica)', rangeClean),
    h('span', { class: 'muted' }, 'Juntar aqui:'),
    btn('🔤 Texto', 'Um texto com a duração desta parte', rangeAddText),
    btn('🎬 Foto / vídeo', 'Mudar o fundo a partir do início desta parte', rangeAddMedia),
    btn('🌄 Pexels', 'Fotos e vídeos grátis a partir do início desta parte', rangeAddPexels),
    h('span', { style: 'flex:1' }),
    btn('✖ Fechar', 'Deixar de escolher (Esc)', rangeClose));
}

// ── cortar: onde, em palavras ─────────────────────────────────────────────
/** Que palavra (das que se dizem) está a começar no instante t: { i: cena, k: palavra } ou null no fim do vídeo. */
function rangePos(p, t) {
  const { tm } = edData();
  let i = edSceneAt(t);
  const w = tm.wordT[i] ?? [];
  let k;
  if (!w.length) k = t > ((tm.starts[i] ?? 0) + (tm.starts[i + 1] ?? tm.total)) / 2 ? 1 : 0;
  else { k = w.findIndex((x) => x >= t - 0.001); if (k < 0) k = w.length; }
  const n = Math.max(1, w.length);
  if (k >= n) { i += 1; k = 0; }
  return i >= p.scenes.length ? null : { i, k };
}

/** Índice (no texto escrito) da palavra k das que se dizem: ignora o que está entre parênteses. */
function spokenToRaw(narration, k) {
  const raw = String(narration).trim().split(/\s+/).filter(Boolean);
  let depth = 0;
  const map = [];
  raw.forEach((t, j) => {
    const open = (t.match(/\(/g) || []).length;
    const close = (t.match(/\)/g) || []).length;
    if (!(depth > 0 || open > 0)) map.push(j);
    depth = Math.max(0, depth + open - close);
  });
  return k >= map.length ? raw.length : map[k];
}

/** Divide a cena i antes da palavra k (das que se dizem) e devolve a cena nova. Sem avisos nem desenho. */
function splitSpokenQuiet(p, i, k) {
  return splitSceneCore(p, i, spokenToRaw(p.scenes[i].narration, k), k);
}

function splitSceneSpoken(p, i, k) {
  splitSpokenQuiet(p, i, k);
  dirty();
  renderEditor();
  toast('Cena cortada em duas.');
}

/**
 * Faz da parte escolhida um conjunto de cenas inteiras (cortando nas pontas se for preciso).
 * Devolve { first, last } (índices) ou null se não der.
 */
function rangeIsolate(p) {
  const r = ED.range;
  const A = rangePos(p, r.a);
  const B = rangePos(p, r.b);
  if (!A) { toast('Essa parte está fora do vídeo.'); return null; }
  const recorded = (i) => state.data.scenes[i]?.recorded;
  if ((A.k > 0 && recorded(A.i)) || (B && B.k > 0 && recorded(B.i))) {
    alert('Uma das pontas cai no meio de uma cena com a sua gravação (a gravação cobre a cena toda). Escolha a parte de modo a começar e acabar nas pontas das cenas gravadas, ou apague a gravação.');
    return null;
  }
  if (B && A.i === B.i && A.k === B.k) { toast('A parte é pequena demais: não apanha nenhuma palavra.'); return null; }
  const sceneB = B ? (B.k > 0 ? splitSpokenQuiet(p, B.i, B.k) : p.scenes[B.i]) : null;
  const sceneA = A.k > 0 ? splitSpokenQuiet(p, A.i, A.k) : p.scenes[A.i];
  const first = p.scenes.indexOf(sceneA);
  const last = (sceneB ? p.scenes.indexOf(sceneB) : p.scenes.length) - 1;
  return { first, last };
}

function rangeCutOut() {
  const { p } = edData();
  const r = ED.range;
  if (!r) return;
  if (!confirm(`Cortar fora esta parte (${fmtS(r.b - r.a)})?\n\nSai o texto e a voz dela; o resto junta-se. Pode desfazer em ↶ Desfazer.`)) return;
  const snapshot = JSON.parse(JSON.stringify({ scenes: p.scenes, overlays: p.overlays }));
  const iso = rangeIsolate(p);
  if (!iso) { p.scenes = snapshot.scenes; p.overlays = snapshot.overlays; return; }
  const count = iso.last - iso.first + 1;
  if (count >= p.scenes.length) {
    p.scenes = snapshot.scenes;
    p.overlays = snapshot.overlays;
    return alert('Isto cortava o vídeo todo. O vídeo precisa de pelo menos uma cena.');
  }
  const gone = p.scenes.splice(iso.first, count).map((s) => s.id);
  p.overlays = (p.overlays ?? []).filter((o) => !gone.includes(o.scene));
  ED.range = null;
  ED.sel = null;
  dirty();
  renderEditor();
  toast('Parte cortada fora. Carregue em "Calcular tempos" para atualizar os tempos.', 5500);
  edResync();
}

function rangeSeparate() {
  const { p } = edData();
  if (!ED.range) return;
  const snapshot = JSON.parse(JSON.stringify({ scenes: p.scenes, overlays: p.overlays }));
  const iso = rangeIsolate(p);
  if (!iso) { p.scenes = snapshot.scenes; p.overlays = snapshot.overlays; return; }
  // várias cenas dentro da parte: junta-as numa só, para ficar um bloco único
  while (iso.last > iso.first && !state.data.scenes[iso.first]?.recorded && !state.data.scenes[iso.first + 1]?.recorded) {
    const a = p.scenes[iso.first];
    const b = p.scenes[iso.first + 1];
    const offset = spokenCount(a.narration);
    a.narration = `${String(a.narration).trim()} ${String(b.narration).trim()}`.trim();
    a.cutaways = [...(a.cutaways ?? []), ...(b.cutaways ?? []).map((c) => (c.atWord !== undefined ? { ...c, atWord: c.atWord + offset } : c))];
    if (!a.cutaways.length) a.cutaways = undefined;
    for (const o of p.overlays ?? []) if (o.scene === b.id) o.scene = a.id;
    p.scenes.splice(iso.first + 1, 1);
    iso.last -= 1;
  }
  ED.sel = { type: 'scene', a: iso.first };
  ED.range = null;
  dirty();
  renderEditor();
  toast('Parte separada numa cena. Agora pode arrastá-la para outro sítio, mudar o texto ou apagá-la.', 6000);
  edResync();
}

const spokenCount = (narration) => String(narration).replace(/\s*\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean).length;

function rangeClean() {
  const { p, tm } = edData();
  const r = ED.range;
  if (!r) return;
  const inside = (t) => t >= r.a - 0.001 && t < r.b;
  const ovs = (p.overlays ?? []).filter((o) => {
    const oi = Math.max(0, p.scenes.findIndex((x) => x.id === o.scene));
    return inside((tm.audioStarts[oi] ?? 0) + (o.at ?? 0.5));
  });
  const cens = [];
  p.scenes.forEach((s, i) => edScenery(i).forEach((x) => { if (inside(x.from)) cens.push({ s, c: x.c }); }));
  if (!ovs.length && !cens.length) return toast('Não há fotos, vídeos nem textos a começar nesta parte.');
  if (!confirm(`Apagar ${ovs.length} texto(s)/imagem(ns) e ${cens.length} foto(s)/vídeo(s) desta parte? A voz fica.`)) return;
  p.overlays = (p.overlays ?? []).filter((o) => !ovs.includes(o));
  for (const { s, c } of cens) {
    s.cutaways = (s.cutaways ?? []).filter((x) => x !== c);
    if (!s.cutaways.length) s.cutaways = undefined;
  }
  ED.sel = null;
  dirty();
  renderEditor();
  toast('Parte limpa.');
}

// ── juntar coisas no início da parte ──────────────────────────────────────
function rangeAddText() {
  const r = ED.range;
  if (!r) return;
  ED.t = r.a;
  edAddOverlay({ kind: 'text', text: 'Escreva aqui', style: 'destaque', anim: 'pop', y: 14, seconds: Math.max(1, Math.round((r.b - r.a) * 10) / 10) });
}

async function rangeAddMedia() {
  const r = ED.range;
  if (!r) return;
  const f = await pickFile('image/*,video/*');
  if (!f) return;
  if (!(await flushBeforeUpload())) return;
  const { p } = edData();
  ED.t = r.a;
  try {
    const res = await uploadTo('media', p.scenes[edSceneAt(r.a)].id, f, 'Cenário');
    edAddScenery(res.path);
  } catch (e) { toast('Erro: ' + e.message, 6000); }
}

function rangeAddPexels() {
  const r = ED.range;
  if (!r) return;
  const { p } = edData();
  ED.t = r.a;
  openPexels(p.scenes[edSceneAt(r.a)].id, (path) => edAddScenery(path));
}
