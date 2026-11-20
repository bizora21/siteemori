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
function edLaneDrop(e, laneEl) {
  e.preventDefault();
  laneEl.classList.remove('drop');
  const f = e.dataTransfer?.files?.[0];
  if (f) edUploadAt(f, edLaneTime(e, laneEl));
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
