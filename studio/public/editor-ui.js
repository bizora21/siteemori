// Editor de vídeo: a página (barra de cima, ferramentas à esquerda, ecrã, painel, linha do tempo).
// Pensado para quem nunca editou vídeo: poucas coisas à vista, tudo com nome claro, arrastar e soltar.
// Usa o núcleo de editor.js (dados, reprodução, cortes) e as funções de simple.js / media.js / timeline.js.

const ED_LABEL_W = 118; // largura da coluna com os nomes das faixas
const ED_ROW = 42; // altura de cada linha de blocos

/** Zoom que faz o vídeo todo caber na largura da página. */
const edFitPps = (total) => Math.min(80, Math.max(9, Math.floor((($('#main')?.clientWidth ?? 1000) - ED_LABEL_W - 120) / Math.max(1, total))));

const edIsVideo = (f) => /\.(mp4|mov|webm|m4v)$/i.test(f);

// ── dados que o arrastar precisa ──────────────────────────────────────────
function edSnapPoints(skipOv) {
  const { p, tm } = edData();
  const pts = [0, tm.total, ED.t];
  p.scenes.forEach((_, i) => { pts.push(tm.starts[i] ?? 0); edScenery(i).forEach((x) => pts.push(x.from)); });
  (p.overlays ?? []).forEach((o, k) => {
    if (k === skipOv) return;
    const oi = Math.max(0, p.scenes.findIndex((x) => x.id === o.scene));
    const f = (tm.audioStarts[oi] ?? 0) + (o.at ?? 0.5);
    pts.push(f, f + (o.seconds ?? 3));
  });
  return pts;
}

/**
 * Arrastar um bloco: mover (por defeito) ou mudar o início/fim (mode 'left' / 'right').
 * Mostra o tempo junto ao rato e "cola" nas bordas dos outros blocos e no cursor.
 */
function edDrag(e, el, o) {
  e.preventDefault();
  e.stopPropagation();
  const pps = ED.pps;
  const x0 = e.clientX;
  let moved = false;
  let from = o.from;
  let secs = o.secs ?? 0;
  const tip = h('div', { class: 'ed-tip' });
  document.body.append(tip);
  el.classList.add('dragging');
  const snap = (v) => {
    let best = v;
    let d = 9 / pps;
    for (const s of o.snaps ?? []) if (Math.abs(s - v) < d) { best = s; d = Math.abs(s - v); }
    return best === v ? Math.round(v * 10) / 10 : best;
  };
  const move = (ev) => {
    if (Math.abs(ev.clientX - x0) > 4) moved = true;
    if (!moved) return;
    const dx = (ev.clientX - x0) / pps;
    if (o.mode === 'right') {
      secs = Math.max(0.8, snap(o.from + o.secs + dx) - o.from);
      el.style.width = Math.max(10, secs * pps) + 'px';
      tip.textContent = `dura ${secs.toFixed(1)} s`;
    } else if (o.mode === 'left') {
      const st = snap(Math.min(o.from + o.secs - 0.8, Math.max(o.min ?? 0, o.from + dx)));
      secs = o.from + o.secs - st;
      from = st;
      el.style.left = st * pps + 'px';
      el.style.width = Math.max(10, secs * pps) + 'px';
      tip.textContent = `começa aos ${fmtT(st)}`;
    } else {
      const raw = Math.max(o.min ?? 0, Math.min(o.max ?? Infinity, o.from + dx));
      from = Math.max(o.min ?? 0, Math.min(o.max ?? Infinity, snap(raw)));
      el.style.left = from * pps + 'px';
      tip.textContent = `${fmtT(from)}`;
    }
    tip.style.left = ev.clientX + 12 + 'px';
    tip.style.top = ev.clientY - 34 + 'px';
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    tip.remove();
    el.classList.remove('dragging');
    o.done({ from, secs, moved });
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

// ── a linha do tempo ──────────────────────────────────────────────────────
function edTimeline() {
  const { p, tm } = edData();
  const pps = ED.pps;
  const W = Math.ceil(tm.total * pps) + 60;
  const ov = (p.overlays ??= []);
  const selIs = (type, a, b) => ED.sel && ED.sel.type === type && ED.sel.a === a && (b === undefined || ED.sel.b === b);
  const select = (sel) => { ED.sel = sel; renderEditor(); };

  const blk = (from, to, cls, kids, label, onSelect) => {
    const el = h('div', { class: 'tl-block ' + cls, tabindex: '0', role: 'button', 'aria-label': label, title: label, style: `left:${from * pps}px;width:${Math.max(10, (to - from) * pps)}px` }, kids);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } });
    return el;
  };
  const lane = (icon, name, kids, hint, rows = 1) => h('div', { class: 'tl-row' },
    h('div', { class: 'tl-name' }, h('span', { 'aria-hidden': 'true', style: 'font-size:18px' }, icon), h('span', {}, name)),
    h('div', { class: 'tl-lane', style: `width:${W}px;height:${rows * ED_ROW + 8}px`, onpointerdown: (e) => { if (e.target === e.currentTarget) edSeek((e.clientX - e.currentTarget.getBoundingClientRect().left) / pps); } },
      kids.length ? null : h('span', { class: 'tl-empty' }, hint), ...kids));

  // régua (clique ou arraste para mover o cursor)
  const step = pps >= 40 ? 1 : pps >= 22 ? 2 : 5;
  const ticks = [];
  for (let t = 0; t <= tm.total; t += step) ticks.push(h('div', { class: 'tl-tick', style: `left:${t * pps}px` }, `${t}s`));
  const ruler = h('div', { class: 'tl-ruler', title: 'Clique ou arraste aqui para mover o cursor', style: `width:${W}px;margin-left:0`, onpointerdown: (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    edSeek((e.clientX - r.left) / pps);
    const mv = (ev) => edSeek((ev.clientX - r.left) / pps);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  } }, ...ticks);

  // Cenas e voz (arraste para mudar a ordem das cenas)
  const scenes = p.scenes.map((s, i) => {
    const from = tm.starts[i] ?? 0;
    const to = tm.starts[i + 1] ?? tm.total;
    const rec = state.data.scenes[i]?.recorded;
    const el = blk(from, to, 'scene' + (selIs('scene', i) ? ' sel' : ''), h('span', { class: 'tl-lab' }, `${i + 1} · ${rec ? '🎙 ' : ''}${s.narration.slice(0, 50)}`), `Cena ${i + 1}: ${s.narration.slice(0, 80)}. Arraste para mudar a ordem.`, () => select({ type: 'scene', a: i }));
    el.addEventListener('pointerdown', (e) => edDrag(e, el, { from, secs: to - from, min: 0, max: tm.total, snaps: [], done: ({ from: f, moved }) => {
      if (!moved) return select({ type: 'scene', a: i });
      // a cena passa para depois de outra quando o seu início ultrapassa o meio dessa outra
      const others = p.scenes.map((_, j) => ({ j, c: ((tm.starts[j] ?? 0) + (tm.starts[j + 1] ?? tm.total)) / 2 })).filter((x) => x.j !== i);
      const target = others.filter((x) => x.c < f).length;
      if (target === i) return renderEditor();
      const [mv] = p.scenes.splice(i, 1);
      p.scenes.splice(target, 0, mv);
      ED.sel = { type: 'scene', a: target };
      dirty();
      toast('Cenas trocadas de ordem. Carregue em "Calcular tempos" para atualizar os tempos.', 5000);
      edResync();
    } }));
    return el;
  });

  // Vídeo e fotos (os cenários de cada cena)
  const vids = [];
  p.scenes.forEach((s, i) => {
    const items = edScenery(i);
    const a0 = tm.audioStarts[i] ?? 0;
    if (!items.length && state.data.scenes[i]?.kind === 'video') vids.push(blk(a0, a0 + (tm.durations[i] ?? 3), 'face', '🧑 o seu rosto', 'O seu rosto gravado', () => select({ type: 'scene', a: i })));
    items.forEach((x) => {
      const vid = edIsVideo(x.c.media);
      const name = x.c.media.split('/').pop();
      const el = blk(x.from, x.to, 'cen' + (selIs('cen', i, x.idx) ? ' sel' : ''), [!vid && h('img', { class: 'tl-th', alt: '', src: `/api/projects/${p.id}/file?p=${encodeURIComponent(x.c.media)}` }), h('span', { class: 'tl-lab' }, (x.c.fit === 'contain' ? '🔲 ' : vid ? '🎬 ' : '') + name)], `${vid ? 'Vídeo' : 'Imagem'} ${name}. Arraste para mudar quando entra.`, () => select({ type: 'cen', a: i, b: x.idx }));
      el.addEventListener('pointerdown', (e) => edDrag(e, el, { from: x.from, secs: x.to - x.from, min: a0, max: a0 + (tm.durations[i] ?? 3) - 0.5, snaps: edSnapPoints(-1), done: ({ from, moved }) => {
        if (!moved) return select({ type: 'cen', a: i, b: x.idx });
        const list = s.cutaways;
        list.forEach((c) => { if (c.atWord === undefined) { const it = items.find((y) => y.c === c); c.atWord = edWordAt(i, it ? it.from : 0); } });
        x.c.atWord = edWordAt(i, from + 0.05);
        list.sort((a, b) => (a.atWord ?? 0) - (b.atWord ?? 0));
        ED.sel = { type: 'cen', a: i, b: list.indexOf(x.c) };
        dirty();
        renderEditor();
      } }));
      vids.push(el);
    });
  });

  // Texto e emojis (em linhas, para não ficarem uns por cima dos outros)
  const rowEnd = [];
  const ovs = ov.map((o, k) => {
    const oi = Math.max(0, p.scenes.findIndex((x) => x.id === o.scene));
    const from = (tm.audioStarts[oi] ?? 0) + (o.at ?? 0.5);
    const secs = o.seconds ?? 3;
    const label = o.kind === 'image' ? '🖼 ' + (o.media ?? '').split('/').pop() : o.kind === 'emoji' ? o.text : 'T ' + (o.text ?? '');
    let row = rowEnd.findIndex((end) => end <= from + 0.01);
    if (row < 0) row = rowEnd.length;
    rowEnd[row] = from + secs;
    const el = blk(from, from + secs, 'ov' + (selIs('ov', k) ? ' sel' : ''), [h('i', { class: 'tl-handle l', title: 'Puxe para mudar o início' }), h('span', { class: 'tl-lab' }, label), h('i', { class: 'tl-handle', title: 'Puxe para mudar a duração' })], `${o.kind === 'emoji' ? 'Emoji' : o.kind === 'image' ? 'Imagem' : 'Texto'}: ${label}. Arraste para mover.`, () => select({ type: 'ov', a: k }));
    el.style.top = `${4 + row * ED_ROW}px`;
    el.addEventListener('pointerdown', (e) => {
      const mode = e.target.classList.contains('tl-handle') ? (e.target.classList.contains('l') ? 'left' : 'right') : 'move';
      edDrag(e, el, { from, secs, mode, min: 0, max: tm.total - 0.8, snaps: edSnapPoints(k), done: ({ from: f, secs: s2, moved }) => {
        if (moved) {
          const j = edSceneAt(f);
          if (mode === 'move') o.scene = p.scenes[j].id;
          if (mode !== 'right') { const own = Math.max(0, p.scenes.findIndex((x) => x.id === o.scene)); o.at = Math.max(0, Math.round((f - (tm.audioStarts[own] ?? 0)) * 10) / 10); }
          if (mode !== 'move') o.seconds = Math.round(s2 * 10) / 10;
          dirty();
        }
        ED.sel = { type: 'ov', a: k };
        renderEditor();
      } });
    });
    return el;
  });

  // Música e efeitos: barras de ponta a ponta (fixas); clique para abrir
  const music = blk(0, tm.total, 'mus' + (ED.sel?.type === 'music' ? ' sel' : ''), h('span', { class: 'tl-lab' }, p.music ? '🎵 ' + p.music.file.split('/').pop() : '＋ Clique para juntar música'), 'Música de fundo. Clique para editar.', () => select({ type: 'music' }));
  music.addEventListener('click', () => select({ type: 'music' }));
  const fx = blk(0, tm.total, 'fx' + (ED.sel?.type === 'fx' ? ' sel' : ''), h('span', { class: 'tl-lab' }, `✨ cor ${p.style?.look ?? 'natural'} · transição ${p.style?.transition ?? 'fundido'} · legendas ${p.captions === false ? 'desligadas' : (p.style?.captionStyle ?? 'karaokê')}${p.stabilize ? ' · estabilizado' : ''}`), 'Efeitos do vídeo. Clique para editar.', () => select({ type: 'fx' }));
  fx.addEventListener('click', () => select({ type: 'fx' }));

  const playhead = h('div', { id: 'ed-playhead', class: 'tl-playhead', style: `left:${ED_LABEL_W + ED.t * pps}px` }, h('i', { class: 'tl-ph-head' }));
  const sc = h('div', { class: 'tl-scroll', id: 'ed-scroll', style: 'position:relative' },
    h('div', { style: 'display:flex' }, h('div', { style: `width:${ED_LABEL_W}px;flex:none` }), ruler),
    lane('🎙', 'Cenas e voz', scenes, 'Sem cenas', 1),
    lane('🎬', 'Vídeo e fotos', vids, 'Sem fotos nem vídeos: use "Foto / vídeo"', 1),
    lane('🔤', 'Texto e emojis', ovs, 'Nada ainda: use "Texto" ou "Emoji"', Math.max(1, rowEnd.length)),
    lane('🎵', 'Música', [music], '', 1),
    lane('✨', 'Efeitos', [fx], '', 1),
    playhead);
  sc.addEventListener('scroll', () => { ED.scrollX = sc.scrollLeft; });
  return sc;
}

// ── painel do que está escolhido ──────────────────────────────────────────
function edHelp() {
  const step = (n, t, d) => h('li', {}, h('b', {}, `${n}. ${t}`), h('div', { class: 'muted' }, d));
  return h('div', { class: 'stack' },
    h('ol', { class: 'ed-steps' },
      step(1, 'Veja o vídeo', 'Carregue em ▶ para ouvir e ver. Clique na régua (os números) para ir a um ponto.'),
      step(2, 'Acrescente', 'Ponha o cursor onde quer e carregue em Texto, Emoji, Foto / vídeo ou Música. Aparece logo ali.'),
      step(3, 'Arraste', 'Os blocos da linha do tempo mexem-se com o rato: arraste para mudar quando entram, puxe as pontas para a duração.'),
      step(4, 'Corte', 'Ponha o cursor onde quer cortar e carregue em ✂ Cortar.'),
      step(5, 'Errou?', 'Carregue em ↶ Desfazer (ou Ctrl+Z). Nada se perde.'),
      step(6, 'Publicar', 'Carregue em 🎬 Ver rascunho e, se estiver bem, em ✅ Publicar.')),
    h('p', { class: 'muted', style: 'margin:0' }, 'Teclas: Espaço = tocar/parar · ←/→ = andar 0,1 s (com Shift, 1 s) · C = cortar · Delete = apagar · Ctrl+Z = desfazer.'));
}

function edCard(title, body, close = true) {
  return h('div', { class: 'ed-card' },
    h('div', { class: 'row', style: 'align-items:center' }, h('b', { style: 'flex:1;font-size:16px' }, title), close && h('button', { 'aria-label': 'Fechar este painel', title: 'Fechar', onclick: () => { ED.sel = null; renderEditor(); } }, '✕')),
    body);
}

function edPanel() {
  const { p } = edData();
  const sel = ED.sel;
  if (!sel) return edCard('Como usar', edHelp(), false);
  if (sel.type === 'ov' && p.overlays?.[sel.a]) {
    const k = p.overlays[sel.a].kind;
    return edCard(k === 'emoji' ? '😀 Emoji' : k === 'image' ? '🖼 Imagem' : '🔤 Texto', overlayEditor(p, p.overlays, sel.a, true));
  }
  if (sel.type === 'cen') {
    const c = p.scenes[sel.a]?.cutaways?.[sel.b];
    if (!c) return edCard('Foto / vídeo', h('p', { class: 'muted' }, 'Este elemento já não existe.'));
    const vid = edIsVideo(c.media);
    return edCard(vid ? '🎬 Vídeo' : '🖼 Foto', h('div', { class: 'stack' },
      h('div', { class: 'muted' }, c.media.split('/').pop()),
      h('label', { class: 'fit-opt' }, h('input', { type: 'checkbox', checked: c.fit === 'contain', onchange: (e) => { c.fit = e.target.checked ? 'contain' : undefined; dirty(); renderEditor(); } }), ' Mostrar inteira, sem cortar (para cartazes com texto)'),
      vid && h('label', {}, 'Começar o vídeo aos (segundos)', h('input', { type: 'number', min: 0, step: 0.5, value: c.startFrom ?? 0, onchange: (e) => { c.startFrom = Number(e.target.value) || undefined; dirty(); renderEditor(); } })),
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
        h('button', { onclick: () => pickWord(p.scenes[sel.a], c) }, '⏱ Escolher a palavra em que entra'),
        h('button', { class: 'danger', onclick: edDelete }, '🗑 Apagar')),
      h('p', { class: 'muted', style: 'margin:0' }, 'Dica: arraste o bloco na linha do tempo para mudar quando entra, ou ponha o cursor dentro dele e carregue em ✂ Cortar.')));
  }
  if (sel.type === 'scene' && p.scenes[sel.a]) return edCard(`🎙 Cena ${sel.a + 1}`, h('div', { class: 'stack' }, simpleScene(p, p.scenes[sel.a], sel.a, state.data.scenes[sel.a], true), sceneExtras(p, p.scenes[sel.a], sel.a, state.data.scenes[sel.a])));
  if (sel.type === 'music') return edCard('🎵 Música', musicBlock(p));
  if (sel.type === 'voice') return edCard('🗣 Voz sintética', voicePicker(p));
  if (sel.type === 'fx') return edCard('✨ Efeitos', edEffects(p));
  return edCard('Como usar', edHelp(), false);
}

// ── efeitos: cor, transição, legendas, estabilização, som, formato ────────
function edEffects(p) {
  const set = (k, v) => { p.style = { ...(p.style ?? {}), [k]: v }; dirty(); renderEditor(); };
  const st = p.style ?? {};
  const sample = p.scenes.flatMap((s) => s.cutaways ?? []).find((c) => /\.(png|jpe?g|webp)$/i.test(c.media));
  const bgImg = sample ? `url("/api/projects/${p.id}/file?p=${encodeURIComponent(sample.media)}")` : 'linear-gradient(135deg,#3b6ea8,#e8a24a)';
  const looks = [['natural', 'Natural'], ['cinema', 'Cinema'], ['quente', 'Quente'], ['frio', 'Frio'], ['vivo', 'Vivo'], ['suave', 'Suave']];
  const chip = (cur, val, label, onpick, title) => h('button', { class: 'chip' + (cur === val ? ' on' : ''), title, onclick: () => onpick(val) }, label);
  const section = (title, hint, ...kids) => h('div', { class: 'ed-sec' }, h('b', {}, title), hint && h('div', { class: 'muted', style: 'font-size:13px' }, hint), ...kids);
  const au = p.audio ?? {};
  const setAu = (k, v) => { p.audio = { ...(p.audio ?? {}), [k]: v }; dirty(); renderEditor(); };
  const sw = (label, on, onchange, title) => h('label', { class: 'ed-switch', title }, h('input', { type: 'checkbox', checked: on, onchange: (e) => onchange(e.target.checked) }), h('span', {}, label));

  return h('div', { class: 'stack' },
    h('button', { class: 'primary', title: 'Liga cor Cinema, transição Zoom, legendas em destaque e vinheta', onclick: () => { p.style = { look: 'cinema', transition: 'zoom', captionStyle: 'destaque', vignette: true, grain: false }; p.audio = undefined; dirty(); renderEditor(); toast('Aspeto profissional ligado.'); } }, '✨ Aspeto profissional (um clique)'),
    section('Cor do vídeo', 'Escolha o aspeto de todas as imagens e vídeos.',
      h('div', { class: 'look-grid' }, ...looks.map(([v, t]) => h('button', { class: 'look-tile' + ((st.look ?? 'natural') === v ? ' on' : ''), title: t, 'aria-label': 'Cor ' + t, onclick: () => set('look', v) },
        h('div', { class: 'look-img', style: `background-image:${bgImg};filter:${LOOK_CSS[v]}` }), h('span', {}, t))))),
    section('Paleta de cores (gradiente)', 'Muda o fundo, os destaques, as legendas e os botões do vídeo.',
      h('div', { class: 'pal-grid' },
        h('button', { class: 'pal-tile' + (!st.palette ? ' on' : ''), title: 'As cores da sua marca', 'aria-label': 'Cores da marca', onclick: () => set('palette', undefined) }, h('div', { class: 'pal-sw', style: 'background:linear-gradient(135deg,#8892a6,#4a5266)' }, h('span', {}, '🏷')), h('span', {}, 'Da marca')),
        ...Object.entries(PAL).map(([id, c]) => h('button', { class: 'pal-tile' + (st.palette === id ? ' on' : ''), title: c.name, 'aria-label': 'Paleta ' + c.name, onclick: () => set('palette', id) },
          h('div', { class: 'pal-sw', style: `background:linear-gradient(135deg,${c.a},${c.b})` }, h('i', { style: `background:linear-gradient(135deg,${c.accent},${c.accent2})` })), h('span', {}, c.name)))),
      h('div', { class: 'muted', style: 'font-size:13px' }, 'Película de cor por cima das imagens (aspeto duotone):'),
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...[[undefined, 'Sem película'], ['suave', 'Suave'], ['forte', 'Forte']].map(([v, t]) => chip(st.wash, v, t, (x) => set('wash', x))))),
    section('Como as imagens mudam', 'A transição entre uma imagem e a seguinte. Passe o rato para ver.',
      h('div', { class: 'trans-grid' }, ...TRANSITIONS.map(([v, t, ico]) => {
        const demo = h('div', { class: 'trans-demo' }, h('i', {}));
        const play = () => enterAnim(demo.firstChild, v, 'lenta');
        return h('button', { class: 'trans-tile' + ((st.transition ?? 'fade') === v ? ' on' : ''), title: t, 'aria-label': 'Transição ' + t, onmouseenter: play, onfocus: play, onclick: () => { set('transition', v); }, }, demo, h('span', {}, ico + ' ' + t));
      })),
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' }, h('span', { class: 'muted' }, 'Velocidade:'), ...[['rapida', 'Rápida'], ['normal', 'Normal'], ['lenta', 'Lenta']].map(([v, t]) => chip(st.transitionSpeed ?? 'normal', v, t, (x) => set('transitionSpeed', x))))),
    section('Legendas', 'As palavras que aparecem enquanto se fala.',
      sw('Mostrar legendas', p.captions !== false, (on) => { p.captions = on ? undefined : false; dirty(); renderEditor(); }),
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...[['karaoke', 'Karaokê'], ['limpo', 'Caixa escura'], ['destaque', 'Destaque']].map(([v, t]) => chip(st.captionStyle ?? 'karaoke', v, t, (x) => set('captionStyle', x))))),
    section('Imagem', 'Para um aspeto mais profissional.',
      sw('Vinheta (cantos mais escuros)', Boolean(st.vignette), (on) => set('vignette', on)),
      sw('Grão de filme', Boolean(st.grain), (on) => set('grain', on)),
      h('label', { title: 'Corrige o tremor de vídeos gravados com o telemóvel na mão. Demora mais a preparar o vídeo.' }, '🎥 Estabilizar a imagem dos vídeos',
        (() => {
          const s = h('select', { onchange: () => { p.stabilize = s.value || undefined; dirty(); renderEditor(); } },
            h('option', { value: '' }, 'Desligado'), h('option', { value: 'leve' }, 'Leve (mais rápido)'), h('option', { value: 'forte' }, 'Forte (mais lento, mais firme)'));
          s.value = p.stabilize ?? '';
          return s;
        })()),
      p.stabilize && h('div', { class: 'muted', style: 'font-size:13px' }, 'Vai demorar mais a gerar o rascunho (cerca de 1× a 2× a duração dos vídeos).')),
    section('Som', 'Música e voz.',
      sw('Voz limpa e volume certo (masterização)', au.master !== false, (on) => setAu('master', on ? undefined : false), 'Nivela o volume para o padrão das redes (−14 LUFS).'),
      sw('Música baixa quando se fala', au.ducking !== false, (on) => setAu('ducking', on ? undefined : false), 'A música desce enquanto fala e sobe nas pausas.')),
    section('Formato do vídeo', null,
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...[['9:16', '📱 Vertical'], ['16:9', '🖥 Horizontal'], ['1:1', '⬜ Quadrado']].map(([v, t]) => chip(p.aspect ?? '9:16', v, t, (x) => { p.aspect = x; dirty(); renderEditor(); })))),
    section('Imagens', 'Como cabem no ecrã.',
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...[['cover', '🖼 Preencher o ecrã'], ['contain', '🔲 Inteiras (cartazes)']].map(([v, t]) => chip(p.imageFit ?? 'cover', v, t, (x) => { p.imageFit = x === 'cover' ? undefined : x; dirty(); renderEditor(); })))));
}

// ── janelas (publicar, qualidade, ajuda, opções) ──────────────────────────
function edDialog(kind) {
  ED.dialog = kind;
  edSyncDialog();
}

function edSyncDialog() {
  let dlg = $('#ed-dlg');
  if (!dlg) {
    dlg = h('dialog', { id: 'ed-dlg', class: 'ed-dlg' });
    document.body.append(dlg);
    dlg.addEventListener('close', () => { ED.dialog = null; });
  }
  if (!ED.dialog) { if (dlg.open) dlg.close(); return; }
  const p = state.data.project;
  const titles = { publish: '✅ Ouvir, ver e publicar', quality: '📊 Qualidade do vídeo', help: '❓ Como usar o editor', options: '⚙ Mais opções do vídeo', voice: '🗣 Escolher a voz sintética' };
  const body = ED.dialog === 'publish' ? approvalSection(p)
    : ED.dialog === 'quality' ? [qualityCard(), h('ul', { class: 'issues' }, issueItems(state.data.issues))]
    : ED.dialog === 'options' ? moreOptionsBlock(p, true)
    : ED.dialog === 'voice' ? voicePicker(p)
    : edHelp();
  dlg.replaceChildren(
    h('div', { class: 'ed-dlg-head' }, h('h3', { style: 'margin:0;flex:1' }, titles[ED.dialog]), h('button', { class: 'primary', onclick: () => dlg.close() }, 'Fechar')),
    h('div', { class: 'ed-dlg-body' }, ...[body].flat()));
  if (!dlg.open) dlg.showModal();
  if (ED.dialog === 'publish') loadPublication(state.data.files, outIdOf(p));
}

// ── a página ──────────────────────────────────────────────────────────────
function edTool(icon, label, title, onclick, opts = {}) {
  return h('button', { class: 'ed-tool' + (opts.on ? ' on' : ''), title, 'aria-label': title, disabled: opts.disabled, onclick },
    h('span', { class: 'ed-ico', 'aria-hidden': 'true' }, icon), h('span', { class: 'ed-lab' }, label));
}

/** Barra de cima, igual em todos os projetos: projetos, desfazer/refazer, guardar, qualidade, voz, rascunho, publicar. */
function edBar(p) {
  const q = state.data.quality;
  const failed = state.data.lastJob?.status === 'failed';
  const exact = p.template !== 'reportagem' || (state.data.timing?.exact ?? true);
  return h('div', { class: 'ed-bar', role: 'toolbar', 'aria-label': 'Barra principal' },
    h('button', { title: 'Mostrar ou esconder a lista de projetos', onclick: () => { ED.showProjects = !ED.showProjects; renderEditor(); } }, '☰ Projetos'),
    h('b', { class: 'ed-title', title: p.title }, p.title),
    h('button', { disabled: !canUndo(), title: 'Desfazer a última alteração (Ctrl+Z)', onclick: () => histGo(-1) }, '↶ Desfazer'),
    h('button', { disabled: !canRedo(), title: 'Refazer (Ctrl+Y)', onclick: () => histGo(1) }, '↷ Refazer'),
    h('button', { id: 'save-btn', title: 'Guardar o projeto (também guarda sozinho antes de gerar)', onclick: save }, state.dirty ? '💾 Guardar *' : '💾 Guardar'),
    h('span', { style: 'flex:1' }),
    h('span', { id: 'job-state', class: 'muted' }),
    failed && h('button', { class: 'pill bad', title: 'O último trabalho falhou: veja o motivo', onclick: () => edDialog('publish') }, '⚠ falhou: ver motivo'),
    p.template === 'reportagem' && q?.items && h('button', { class: 'pill ' + (q.score >= 90 ? 'ok' : q.score >= 75 ? 'warn' : 'bad'), style: 'font-size:14px', title: 'Ver o que falta para o vídeo ficar com melhor qualidade', onclick: () => edDialog('quality') }, `📊 Qualidade ${q.score}%`),
    h('button', { class: exact ? '' : 'primary', title: exact ? 'Gera a voz de novo (use depois de mudar o texto)' : 'Gera a voz para os tempos ficarem exatos (não demora)', onclick: () => build({ noRender: true }) }, exact ? '🔊 Voz' : '🔊 Calcular tempos'),
    h('button', { title: 'Gera uma versão rápida para ver (a meia qualidade)', onclick: () => build({ draft: true }) }, '🎬 Ver rascunho'),
    h('button', { class: 'primary', title: 'Ouvir, ver e publicar o vídeo final', onclick: () => edDialog('publish') }, '✅ Publicar'),
    h('button', { title: 'Como usar o editor', 'aria-label': 'Ajuda', onclick: () => edDialog('help') }, '❓'));
}

function renderVideoEditor() {
  edStop();
  const { p, tm } = edData();
  const main = $('#main');
  const scroll = window.scrollY;
  const keepX = ED.scrollX ?? 0;
  if (!ED.pps || ED.proj !== p.id) { ED.proj = p.id; ED.pps = edFitPps(tm.total); ED.t = 0; ED.sel = null; ED.scrollX = 0; }
  document.body.classList.toggle('ed-full', !ED.showProjects);
  document.documentElement.style.setProperty('--topbar-h', ($('.top')?.offsetHeight ?? 54) + 'px');
  const q = state.data.quality;
  const st = curStatus();
  const failed = state.data.lastJob?.status === 'failed';
  const sceneAtCursor = () => p.scenes[edSceneAt(ED.t)].id;

  const bar = edBar(p);

  const tools = h('div', { class: 'ed-tools', role: 'toolbar', 'aria-label': 'Ferramentas' },
    edTool('➕', 'Cena', 'Juntar uma cena nova (mais texto e voz) a seguir à cena onde está o cursor', edAddScene),
    edTool('✂', 'Cortar', 'Corta no cursor: a cena (na palavra seguinte) ou o cenário escolhido (C)', edCut),
    edTool('🔤', 'Texto', 'Juntar um texto no cursor', () => edAddOverlay({ kind: 'text', text: 'Escreva aqui', style: 'destaque', anim: 'pop', y: 14 })),
    edTool('😀', 'Emoji', 'Juntar um emoji no cursor', () => edAddOverlay({ kind: 'emoji', text: '🙏', y: 40, size: 1.2, anim: 'pop' })),
    edTool('🖼', 'Imagem', 'Juntar uma imagem (logótipo, selo…) por cima do vídeo', async () => {
      const f = await pickFile('image/jpeg,image/png,image/webp');
      if (!f) return;
      if (!(await flushBeforeUpload())) return;
      try { const r = await uploadTo('media', sceneAtCursor(), f, 'Imagem'); edAddOverlay({ kind: 'image', media: r.path, y: 35, anim: 'fade' }); } catch (e) { toast('Erro: ' + e.message, 6000); }
    }),
    edTool('🎬', 'Foto / vídeo', 'Mudar o fundo a partir do cursor com uma foto ou vídeo seu', async () => {
      const f = await pickFile('image/*,video/*');
      if (!f) return;
      if (!(await flushBeforeUpload())) return;
      try { const r = await uploadTo('media', sceneAtCursor(), f, 'Cenário'); edAddScenery(r.path); } catch (e) { toast('Erro: ' + e.message, 6000); }
    }),
    edTool('🌄', 'Pexels', 'Procurar fotos e vídeos grátis (paisagens, cidades, animais…)', () => openPexels(sceneAtCursor(), (path) => edAddScenery(path))),
    edTool('🗣', 'Voz', 'Escolher a voz sintética (ouvir e escolher entre as vozes disponíveis)', () => { ED.sel = { type: 'voice' }; renderEditor(); }, { on: ED.sel?.type === 'voice' }),
    edTool('🎵', 'Música', 'Juntar ou mudar a música de fundo', () => { ED.sel = { type: 'music' }; renderEditor(); }, { on: ED.sel?.type === 'music' }),
    edTool('✨', 'Efeitos', 'Cor, transições, legendas, estabilização e som', () => { ED.sel = { type: 'fx' }; renderEditor(); }, { on: ED.sel?.type === 'fx' }),
    edTool('⚙', 'Opções', 'A minha foto, evento, voz, nome e formato', () => edDialog('options')),
    edTool('🗑', 'Apagar', 'Apagar o que está escolhido (Delete)', edDelete));

  const stage = h('div', { class: 'ed-stage' },
    edPreview(),
    h('div', { class: 'ed-player' },
      h('button', { title: 'Ir ao princípio', 'aria-label': 'Ir ao princípio', onclick: () => edSeek(0) }, '⏮'),
      h('button', { id: 'ed-play', class: 'primary', style: 'min-width:54px;font-size:18px', title: 'Tocar / parar (Espaço)', 'aria-label': 'Tocar ou parar', onclick: () => (ED.playing ? edStop() : edPlay()) }, '▶'),
      h('span', { id: 'ed-time', class: 'pill', style: 'font-size:14px' }, ''),
      !tm.exact && h('span', { class: 'muted', style: 'font-size:12px', title: 'Carregue em Calcular tempos' }, '⏱ tempos aproximados')));

  const tlHead = h('div', { class: 'ed-tl-head' },
    h('b', {}, 'Linha do tempo'),
    h('button', { class: 'primary', title: 'Juntar uma cena nova a seguir à cena onde está o cursor', onclick: edAddScene }, '➕ Nova cena'),
    h('span', { class: 'muted' }, 'Arraste os blocos · clique na régua para pôr o cursor · ✂ corta no cursor'),
    h('span', { style: 'flex:1' }),
    h('button', { title: 'Afastar (ver mais tempo)', 'aria-label': 'Afastar', onclick: () => { ED.pps = Math.max(6, Math.round(ED.pps * 0.75)); renderEditor(); } }, '−'),
    h('button', { title: 'Aproximar (mais detalhe)', 'aria-label': 'Aproximar', onclick: () => { ED.pps = Math.min(80, Math.round(ED.pps * 1.35) + 1); renderEditor(); } }, '+'),
    h('button', { title: 'Ajustar ao tamanho da página', onclick: () => { ED.pps = edFitPps(tm.total); renderEditor(); } }, 'Ajustar'));

  const split = h('div', { class: 'ed-split', role: 'separator', 'aria-label': 'Arraste para dar mais espaço ao vídeo ou à linha do tempo', title: 'Arraste para cima ou para baixo', onpointerdown: (e) => {
    e.preventDefault();
    const app = $('.ed-app');
    const y0 = e.clientY;
    const h0 = $('.ed-tl').offsetHeight;
    const mv = (ev) => {
      ED.tlH = Math.max(190, Math.min(window.innerHeight * 0.7, h0 + (y0 - ev.clientY)));
      app.style.setProperty('--tl-h', ED.tlH + 'px');
      edFitScreen();
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); try { localStorage.setItem('ed-tl-h', String(ED.tlH)); } catch { /* sem armazenamento */ } };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  } }, h('i', {}));
  if (ED.tlH === undefined) { try { ED.tlH = Number(localStorage.getItem('ed-tl-h')) || 0; } catch { ED.tlH = 0; } }
  const appEl = h('div', { class: 'ed-app', style: ED.tlH ? `--tl-h:${ED.tlH}px` : '' }, bar,
    h('div', { class: 'ed-body' }, tools, stage, h('div', { class: 'ed-panel' }, edPanel())),
    split,
    h('section', { class: 'card ed-tl' }, tlHead, edTimeline()));
  main.replaceChildren(appEl);
  window.scrollTo(0, scroll);
  const sc = $('#ed-scroll');
  if (sc) sc.scrollLeft = keepX;
  edPaint();
  edFitScreen();
  edSyncDialog();
}

// ── teclado: Espaço, setas, C, Delete ─────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (!$('#ed-prev') || $('#ed-dlg')?.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.code === 'Space' && tag !== 'BUTTON') { e.preventDefault(); ED.playing ? edStop() : edPlay(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); edSeek(ED.t - (e.shiftKey ? 1 : 0.1)); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); edSeek(ED.t + (e.shiftKey ? 1 : 0.1)); }
  else if (e.key.toLowerCase() === 'c' && tag !== 'BUTTON') { e.preventDefault(); edCut(); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && ED.sel) { e.preventDefault(); edDelete(); }
});

// ── o ecrã adapta-se ao espaço (telemóvel, janela pequena) ────────────────
function edFitScreen() {
  const s = $('#ed-prev');
  if (!s) return;
  s.style.zoom = '';
  const w = s.offsetWidth;
  const hh = s.offsetHeight;
  const body = $('.ed-body');
  const fixed = body && getComputedStyle($('.ed-app')).height !== 'auto' && window.innerWidth > 1100;
  const availW = ($('#main')?.clientWidth ?? w) - 24;
  const availH = fixed ? body.clientHeight - ($('.ed-player')?.offsetHeight ?? 56) - 14 : Infinity;
  const z = Math.min(1, availW / w, availH / hh);
  if (z < 1 && z > 0.2) s.style.zoom = String(z);
}
window.addEventListener('resize', () => { clearTimeout(window.__edFitT); window.__edFitT = setTimeout(edFitScreen, 120); });
