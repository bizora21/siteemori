// Linha do tempo: vê onde cada cena, cenário e elemento (texto, emoji, imagem) está no tempo,
// arrasta para mudar quando entram e quanto tempo ficam, e corta/junta cenas.
// Usa as funções globais de app.js / simple.js (h, $, state, dirty, renderEditor, pickFile, uploadTo, toast).

const TL = { sel: null, pps: 0, scene: '' };
const TL_EMOJIS = ['🙏', '❤️', '🔥', '👏', '✅', '⚠️', '📍', '📅', '⏰', '🕊️', '💪', '🌍', '🌿', '✨', '👉', '⭐', '🎉', '📢', '🚶', '🤝'];
const r1 = (n) => Math.round(n * 10) / 10;

function tlEnds(p, tm) {
  return p.scenes.map((s, i) => tm.starts[i + 1] ?? tm.total - 1.5);
}

/** Onde, em segundos, entra cada cenário de uma cena (aproximado: partes iguais ou na palavra escolhida). */
function tlSceneryTimes(s, start, end) {
  const list = s.cutaways ?? [];
  if (!list.length) return [];
  const words = Math.max(1, s.narration.trim().split(/\s+/).filter(Boolean).length);
  const part = (end - start) / list.length;
  const anchored = list.some((c) => c.atWord !== undefined);
  const ats = list.map((c, k) => (anchored ? start + ((c.atWord ?? 0) / words) * (end - start) : start + k * part));
  return list.map((c, k) => ({ c, from: ats[k], to: anchored ? (ats[k + 1] ?? end) : ats[k] + part }));
}

function timelineBlock(p) {
  if (p.template !== 'reportagem') return null;
  const tm = state.data.timing;
  if (!tm) return null;
  const pps = TL.pps || Math.min(60, Math.max(14, Math.floor(780 / tm.total)));
  const ends = tlEnds(p, tm);
  const W = Math.ceil(tm.total * pps) + 20;
  const ov = (p.overlays ??= []);
  if (!TL.scene || !p.scenes.some((s) => s.id === TL.scene)) TL.scene = p.scenes[0]?.id ?? '';

  const sceneIndexAt = (abs) => {
    let j = 0;
    p.scenes.forEach((_, i) => { if (abs >= tm.starts[i]) j = i; });
    return j;
  };
  const absOf = (o) => {
    const i = p.scenes.findIndex((s) => s.id === o.scene);
    return (tm.starts[Math.max(0, i)] ?? 0) + (o.at ?? 0.5);
  };

  const block = (left, width, cls, content, extra = {}) =>
    h('div', { class: 'tl-block ' + cls, style: `left:${left * pps}px;width:${Math.max(6, width * pps)}px`, ...extra }, content);

  // régua
  const ticks = [];
  const step = pps >= 40 ? 1 : pps >= 24 ? 2 : 5;
  for (let t = 0; t <= tm.total; t += step) ticks.push(h('div', { class: 'tl-tick', style: `left:${t * pps}px` }, `${t}s`));

  const sceneTrack = p.scenes.map((s, i) => block(tm.starts[i], ends[i] - tm.starts[i], 'scene', `${i + 1} · ${s.id}`, {
    title: 'Clique para ir à cena', onclick: () => document.getElementById('scene-' + i)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  }));

  const sceneryTrack = p.scenes.flatMap((s, i) => tlSceneryTimes(s, tm.starts[i], ends[i]).map(({ c, from, to }) =>
    block(from, to - from, 'cen', [h('span', {}, c.fit === 'contain' ? '🔲' : '🖼'), ' ' + c.media.split('/').pop()], { title: 'Cenário (aproximado). Para mudar quando entra, use ⏱ na cena.' })));

  const overlayTrack = ov.map((o, k) => {
    const left = absOf(o);
    const label = o.kind === 'image' ? '🖼 ' + (o.media ?? '').split('/').pop() : o.kind === 'emoji' ? o.text : 'T ' + (o.text ?? '');
    const el = block(left, o.seconds ?? 3, 'ov' + (TL.sel === k ? ' sel' : ''), [h('span', { class: 'tl-lab' }, label), h('i', { class: 'tl-handle' })]);
    el.addEventListener('pointerdown', (e) => startDrag(e, k, el, left, e.target.classList.contains('tl-handle')));
    return el;
  });

  function startDrag(e, k, el, left0, resize) {
    e.preventDefault();
    const o = ov[k];
    const x0 = e.clientX;
    let moved = false;
    let abs = left0;
    let secs = o.seconds ?? 3;
    try { el.setPointerCapture(e.pointerId); } catch { /* sem captura: os eventos seguem na janela */ }
    const move = (ev) => {
      const dx = (ev.clientX - x0) / pps;
      if (Math.abs(ev.clientX - x0) > 3) moved = true;
      if (resize) {
        secs = Math.max(0.8, r1((o.seconds ?? 3) + dx));
        el.style.width = secs * pps + 'px';
      } else {
        abs = Math.max(0, Math.min(tm.total - 1, left0 + dx));
        el.style.left = abs * pps + 'px';
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      TL.sel = k;
      if (moved) {
        if (resize) o.seconds = secs;
        else {
          const j = sceneIndexAt(abs);
          o.scene = p.scenes[j].id;
          o.at = Math.max(0, r1(abs - tm.starts[j]));
        }
        dirty();
      }
      renderEditor();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  const track = (name, kids, cls = '') => h('div', { class: 'tl-row' }, h('div', { class: 'tl-name' }, name), h('div', { class: 'tl-lane ' + cls, style: `width:${W}px` }, ...kids));

  const sceneSel = h('select', { onchange: (e) => { TL.scene = e.target.value; } }, ...p.scenes.map((s, i) => h('option', { value: s.id }, `Cena ${i + 1}`)));
  sceneSel.value = TL.scene;
  const addOv = (o) => { ov.push({ scene: TL.scene, at: 0.5, seconds: 3, x: 50, y: 30, size: 1, ...o }); TL.sel = ov.length - 1; dirty(); renderEditor(); };

  const tools = h('div', { class: 'actions' },
    h('span', { class: 'muted' }, 'Na:'), sceneSel,
    h('button', { onclick: () => addOv({ kind: 'text', text: 'Escreva aqui', style: 'destaque', anim: 'pop' }) }, '+ Texto'),
    h('button', { onclick: () => addOv({ kind: 'emoji', text: '🙏', y: 40, size: 1.2, anim: 'pop' }) }, '+ Emoji'),
    h('button', { onclick: async () => {
      const f = await pickFile('image/jpeg,image/png,image/webp');
      if (!f) return;
      if (!(await flushBeforeUpload())) return;
      try { const r = await uploadTo('media', TL.scene, f, 'Imagem'); addOv({ kind: 'image', media: r.path, y: 35, size: 1, anim: 'fade' }); } catch (e2) { toast('Erro: ' + e2.message, 6000); }
    } }, '+ Imagem'),
    h('span', { class: 'muted' }, '|'),
    h('button', { title: 'Corta a cena em duas, na palavra que escolher', onclick: () => splitScene(p, p.scenes.findIndex((s) => s.id === TL.scene)) }, '✂ Dividir a cena'),
    h('button', { title: 'Junta esta cena com a seguinte', onclick: () => joinScene(p, p.scenes.findIndex((s) => s.id === TL.scene)) }, '🔗 Juntar com a seguinte'),
    h('label', { class: 'ver-sel' }, 'Zoom', h('input', { type: 'range', min: 6, max: 40, value: pps, oninput: (e) => { TL.pps = Number(e.target.value); renderEditor(); } })));

  return h('section', { class: 'card stack', id: 'timeline' },
    h('div', { class: 'row' },
      h('h3', { style: 'margin:0;flex:1' }, 'Linha do tempo'),
      h('span', { class: 'pill' + (tm.exact ? ' ok' : '') }, tm.exact ? `${Math.round(tm.total)} s (tempos reais)` : `~${Math.round(tm.total)} s (aproximado: carregue em 🔊 Ouvir a voz)`)),
    h('p', { class: 'muted', style: 'margin:0' }, 'Arraste os elementos para mudar quando entram; puxe a ponta direita para mudar a duração. Clique num elemento para o editar.'),
    tools,
    h('div', { class: 'tl-scroll' },
      h('div', { class: 'tl-ruler', style: `width:${W}px` }, ...ticks),
      track('Cenas', sceneTrack),
      track('Cenários', sceneryTrack),
      track('Texto · emoji · imagem', overlayTrack, 'ov-lane')),
    TL.sel !== null && ov[TL.sel] ? overlayEditor(p, ov, TL.sel) : h('p', { class: 'muted', style: 'margin:0' }, 'Sem elemento escolhido. Use + Texto, + Emoji ou + Imagem para começar.'));
}

function overlayEditor(p, ov, k, noPreview) {
  const o = ov[k];
  const set = (key, v) => { o[key] = v; dirty(); renderEditor(); };
  const setQuiet = (key, v) => { o[key] = v; dirty(); const pv = $('#ov-prev'); if (pv) pv.replaceWith(overlayPreview(p, o)); };
  const num = (label, key, min, max, step, def) => h('label', {}, `${label}: ${r1(o[key] ?? def)}`, h('input', { type: 'range', min, max, step, value: o[key] ?? def, oninput: (e) => { setQuiet(key, Number(e.target.value)); e.target.parentNode.firstChild.textContent = `${label}: ${r1(Number(e.target.value))}`; } }));
  const sel = (label, key, opts, def) => h('label', {}, label, (() => {
    const s = h('select', { onchange: () => set(key, s.value) }, ...opts.map(([v, t]) => h('option', { value: v }, t)));
    s.value = o[key] ?? def;
    return s;
  })());
  const spots = [[16, 14], [50, 14], [84, 14], [16, 40], [50, 40], [84, 40], [16, 70], [50, 70], [84, 70]];
  return h('div', { class: 'zone tl-edit' },
    h('div', { class: 'row', style: 'align-items:flex-start;gap:16px;flex-wrap:wrap' },
      !noPreview && overlayPreview(p, o),
      h('div', { class: 'stack', style: 'flex:1;min-width:240px' },
        o.kind === 'text' && h('label', {}, 'Texto', h('input', { type: 'text', value: o.text ?? '', oninput: (e) => setQuiet('text', e.target.value), onchange: () => renderEditor() })),
        o.kind === 'emoji' && h('div', {}, h('div', { class: 'muted' }, 'Emoji'),
          h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...TL_EMOJIS.map((em) => h('button', { class: 'chip' + (o.text === em ? ' on' : ''), style: 'font-size:22px;padding:2px 8px', onclick: () => set('text', em) }, em))),
          h('label', {}, 'Ou escreva/cole outro', h('input', { type: 'text', value: o.text ?? '', maxlength: 8, onchange: (e) => set('text', e.target.value) }))),
        o.kind === 'image' && h('div', { class: 'muted' }, 'Imagem: ' + (o.media ?? '').split('/').pop()),
        h('div', { class: 'grid2' },
          h('label', {}, 'Cena', (() => {
            const s = h('select', { onchange: () => set('scene', s.value) }, ...p.scenes.map((sc, i) => h('option', { value: sc.id }, `Cena ${i + 1}`)));
            s.value = o.scene;
            return s;
          })()),
          h('label', {}, 'Entra aos (s desde o início da fala)', h('input', { type: 'number', min: 0, step: 0.5, value: o.at ?? 0.5, onchange: (e) => set('at', Math.max(0, Number(e.target.value))) })),
          h('label', {}, 'Fica (s)', h('input', { type: 'number', min: 0.8, step: 0.5, value: o.seconds ?? 3, onchange: (e) => set('seconds', Math.max(0.8, Number(e.target.value))) })),
          o.kind === 'text' && sel('Estilo', 'style', [['destaque', 'Destaque (caixa de cor)'], ['gradiente', 'Letras com gradiente'], ['caixa', 'Caixa escura'], ['simples', 'Só o texto']], 'destaque'),
          sel('Animação', 'anim', [['pop', 'Salta'], ['fade', 'Aparece'], ['deslizar', 'Sobe']], 'pop')),
        h('div', { class: 'grid2' }, num('Tamanho', 'size', 0.5, 3, 0.1, 1), num('Posição →', 'x', 5, 95, 1, 50), num('Posição ↓', 'y', 5, 95, 1, 30)),
        h('div', { class: 'row', style: 'gap:6px;align-items:center' },
          h('span', { class: 'muted' }, 'Posição rápida:'),
          h('div', { style: 'display:grid;grid-template-columns:repeat(3,18px);gap:3px' }, ...spots.map(([x, y]) => h('button', { style: 'padding:0;height:18px', title: 'Pôr aqui', onclick: () => { o.x = x; o.y = y; dirty(); renderEditor(); } }, '·'))),
          h('button', { class: 'danger', style: 'margin-left:auto', onclick: () => { ov.splice(k, 1); TL.sel = null; dirty(); renderEditor(); } }, 'Apagar este elemento')))));
}

/** Pequeno ecrã com o formato do vídeo, a mostrar onde o elemento fica. */
function overlayPreview(p, o) {
  const asp = p.aspect === '16:9' ? [160, 90] : p.aspect === '1:1' ? [120, 120] : [100, 178];
  const box = h('div', { id: 'ov-prev', style: `position:relative;width:${asp[0]}px;height:${asp[1]}px;background:linear-gradient(160deg,#243b55,#0f2027);border-radius:10px;overflow:hidden;border:2px solid var(--line);flex:none` });
  const k = asp[0] / 1080;
  const pos = `position:absolute;left:${o.x ?? 50}%;top:${o.y ?? 30}%;transform:translate(-50%,-50%);text-align:center;max-width:86%;`;
  if (o.kind === 'emoji') box.append(h('div', { style: pos + `font-size:${150 * k * (o.size ?? 1)}px;line-height:1` }, o.text || '🙂'));
  else if (o.kind === 'image') box.append(h('img', { src: `/api/projects/${p.id}/file?p=${encodeURIComponent(o.media ?? '')}`, style: pos + `width:${40 * (o.size ?? 1)}%;border-radius:4px` }));
  else {
    const st = o.style ?? 'destaque';
    const look = st === 'caixa' ? 'background:rgba(0,0,0,.62);color:#fff;padding:2px 6px;border-radius:5px;' : st === 'simples' ? 'color:#fff;text-shadow:0 1px 3px #000;' : 'background:#f5b82e;color:#101820;padding:2px 6px;border-radius:5px;';
    box.append(h('div', { style: pos }, h('span', { style: `display:inline-block;font-weight:800;font-size:${66 * k * (o.size ?? 1)}px;line-height:1.12;${look}` }, o.text || 'Texto')));
  }
  return box;
}

// ── cortes: dividir uma cena numa palavra, ou juntar duas ──────────────────
function splitScene(p, i) {
  const s = p.scenes[i];
  if (!s) return;
  if (state.data.scenes[i]?.recorded) return alert('Esta cena já tem uma gravação (voz ou vídeo): apague-a primeiro, ou grave de novo depois de dividir, porque a gravação cobre a cena toda.');
  const tokens = String(s.narration).trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 4) return alert('A cena é curta demais para dividir.');
  const dlg = $('#wordpick');
  $('#wordpick-hint').textContent = 'Toque na palavra onde começa a NOVA cena (o corte fica antes dela).';
  $('#wordpick-body').replaceChildren(...tokens.map((t, k) => (k === 0 ? null : h('button', { class: 'wchip', onclick: () => { dlg.close(); splitSceneAt(p, i, k); } }, t))).filter(Boolean));
  dlg.showModal();
}

function joinScene(p, i) {
  const a = p.scenes[i];
  const b = p.scenes[i + 1];
  if (!a || !b) return alert('Não há cena seguinte para juntar.');
  if (state.data.scenes[i]?.recorded || state.data.scenes[i + 1]?.recorded) return alert('Uma destas cenas tem gravação: apague-a primeiro (a gravação cobre só uma cena).');
  if (!confirm(`Juntar "${a.id}" e "${b.id}" numa só cena?`)) return;
  const offset = String(a.narration).trim().split(/\s+/).filter(Boolean).length;
  const moved = (b.cutaways ?? []).map((c) => (c.atWord !== undefined ? { ...c, atWord: c.atWord + offset } : c));
  a.narration = `${String(a.narration).trim()} ${String(b.narration).trim()}`;
  a.cutaways = [...(a.cutaways ?? []), ...moved];
  if (!a.cutaways.length) a.cutaways = undefined;
  for (const o of p.overlays ?? []) if (o.scene === b.id) o.scene = a.id;
  p.scenes.splice(i + 1, 1);
  dirty();
  renderEditor();
}

/** Divide a cena i em duas: a nova cena começa na palavra k (0 = primeira). */
function splitSceneAt(p, i, k) {
  splitSceneCore(p, i, k, k);
  dirty();
  renderEditor();
  toast('Cena cortada em duas.');
}

/** O corte em si: rawK = palavra no texto escrito, k = palavra entre as que se dizem (para os cenários). Devolve a cena nova. */
function splitSceneCore(p, i, rawK, k) {
  const s = p.scenes[i];
  const tokens = String(s.narration).trim().split(/\s+/).filter(Boolean);
  const list = s.cutaways ?? [];
  const keep = [];
  const move = [];
  list.forEach((c, n) => {
    if (c.atWord !== undefined) (c.atWord < k ? keep : move).push(c.atWord < k ? c : { ...c, atWord: c.atWord - k });
    else (n < Math.ceil(list.length / 2) ? keep : move).push(c);
  });
  let id = `${s.id}-b`;
  let n = 2;
  while (p.scenes.some((x) => x.id === id)) id = `${s.id}-b${n++}`;
  const second = { id, narration: tokens.slice(rawK).join(' '), ...(move.length ? { cutaways: move } : {}) };
  s.narration = tokens.slice(0, rawK).join(' ');
  s.cutaways = keep.length ? keep : undefined;
  p.scenes.splice(i + 1, 0, second);
  return second;
}
