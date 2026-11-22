// Cortar um vídeo sem complicação: ver o vídeo, escolher as partes a MANTER (as outras são cortadas fora) e criar o vídeo cortado.
// Ajuda a encontrar a fala: mostra os "trechos de fala" (separados pelas pausas) para ver e juntar com um clique.

const trimFmt = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;

async function trimDialog(rel, opts = {}) {
  const { replace = false, title = 'Cortar o vídeo', onDone } = opts;
  const url = `/api/projects/${state.id}/file?p=${encodeURIComponent(rel)}`;
  const dlg = h('dialog', { id: 'trim-dlg', class: 'trim-dlg' });
  const vid = h('video', { src: url, controls: true, playsinline: true, class: 'trim-video' });
  let parts = [];
  let speech = null; // null = ainda a procurar
  let dur = 0;
  let stopAt = 0;
  let busy = false;
  vid.addEventListener('timeupdate', () => { if (stopAt && vid.currentTime >= stopAt) { vid.pause(); stopAt = 0; } });
  vid.addEventListener('loadedmetadata', () => {
    if (!dur && isFinite(vid.duration)) { dur = vid.duration; if (!parts.length) parts = [{ a: 0, b: Math.round(dur * 10) / 10 }]; draw(); }
  });
  const close = () => { vid.pause(); dlg.close(); dlg.remove(); };
  const play = (a, b) => { vid.currentTime = a; stopAt = b ?? 0; vid.play().catch(() => {}); };
  const num = (v) => Math.max(0, Math.round(Number(v) * 10) / 10 || 0);
  const kept = () => parts.reduce((s, x) => s + Math.max(0, x.b - x.a), 0);
  const valid = () => parts.length > 0 && parts.every((x) => x.b - x.a >= 0.3);

  // Tira um pedaço [a, b] ao que está a ser mantido (corta fora, no início, no meio ou no fim).
  function eliminar(a, b) {
    const out = [];
    for (const x of parts) {
      if (b <= x.a || a >= x.b) { out.push(x); continue; }
      if (a > x.a) out.push({ a: x.a, b: a });
      if (b < x.b) out.push({ a: b, b: x.b });
    }
    parts = out.filter((x) => x.b - x.a >= 0.3);
  }
  let mark = { a: null, b: null };
  const marked = () => (mark.a !== null && mark.b !== null ? { a: Math.min(mark.a, mark.b), b: Math.max(mark.a, mark.b) } : null);

  const box = h('div', { class: 'stack' });
  function draw() {
    const m = marked();
    const okMark = m && m.b - m.a >= 0.3;
    // 1) marcar o pedaço (ou escolher uma frase da lista)
    const marcar = h('div', { class: 'stack trim-step' },
      h('b', {}, '1. Marque o pedaço'),
      h('div', { class: 'muted', style: 'font-size:13px' }, 'Ponha o vídeo no sítio com a barra ou com ▶ e carregue no botão. Ou use uma das frases abaixo.'),
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' },
        h('button', { onclick: () => { mark.a = num(vid.currentTime); draw(); } }, '📍 Começa aqui' + (mark.a !== null ? ' (' + trimFmt(mark.a) + ')' : '')),
        h('button', { onclick: () => { mark.b = num(vid.currentTime); draw(); } }, '📍 Acaba aqui' + (mark.b !== null ? ' (' + trimFmt(mark.b) + ')' : '')),
        okMark && h('button', { onclick: () => play(m.a, m.b) }, '▶ Ver o pedaço marcado')));
    // 2) o que fazer com ele
    const fazer = h('div', { class: 'stack trim-step' },
      h('b', {}, '2. O que fazer com esse pedaço'),
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
        h('button', { class: 'danger', disabled: !okMark, onclick: () => { eliminar(m.a, m.b); mark = { a: null, b: null }; draw(); } }, '🗑 ELIMINAR este pedaço'),
        h('button', { disabled: !okMark, onclick: () => { parts = [{ a: m.a, b: m.b }]; mark = { a: null, b: null }; draw(); } }, '✔ Ficar SÓ com este pedaço')),
      !okMark && h('div', { class: 'muted', style: 'font-size:13px' }, 'Marque o início e o fim para ativar os botões.'));
    const chips = speech === null
      ? h('div', { class: 'muted', style: 'font-size:13px' }, 'A procurar onde há fala…')
      : speech.length
        ? h('div', { class: 'stack', style: 'gap:6px' },
          h('div', { class: 'muted', style: 'font-size:13px' }, 'Frases do vídeo: ▶ ouvir · 🗑 eliminar · ✔ ficar só com ela'),
          h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...speech.map((x) => h('span', { class: 'trim-chip' },
            h('button', { onclick: () => play(x.from, x.to) }, `▶ ${trimFmt(x.from)}–${trimFmt(x.to)}`),
            h('button', { title: 'Eliminar esta frase', onclick: () => { eliminar(x.from, x.to); draw(); } }, '🗑'),
            h('button', { title: 'Ficar só com esta frase', onclick: () => { parts = [{ a: x.from, b: x.to }]; draw(); } }, '✔')))))
        : null;
    // o que fica
    const rows = parts.map((x, i) => h('div', { class: 'trim-row' },
      h('b', {}, `Fica ${i + 1}`),
      h('label', {}, 'de', h('input', { type: 'number', min: 0, step: 0.1, value: x.a, onchange: (e) => { x.a = num(e.target.value); draw(); } })),
      h('label', {}, 'até', h('input', { type: 'number', min: 0, step: 0.1, value: x.b, onchange: (e) => { x.b = num(e.target.value); draw(); } })),
      h('button', { title: 'Ver só esta parte', onclick: () => play(x.a, x.b) }, '▶ ver'),
      parts.length > 1 && h('button', { class: 'danger', title: 'Eliminar esta parte', onclick: () => { parts.splice(i, 1); draw(); } }, '🗑')));
    box.replaceChildren(
      marcar,
      fazer,
      chips,
      h('div', { class: 'stack', style: 'gap:6px' }, h('b', {}, '3. O que fica no vídeo'), ...rows,
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' },
          h('button', { onclick: () => { parts = [{ a: 0, b: Math.round(dur * 10) / 10 }]; mark = { a: null, b: null }; draw(); } }, '↺ Voltar ao vídeo inteiro'))),
      h('p', { class: 'muted', style: 'margin:0' }, `Fica com ${trimFmt(kept())} de ${trimFmt(dur)}. O vídeo original não se perde${replace ? ' (fica guardado na pasta da cena)' : ''}.`),
      h('div', { class: 'row trim-foot', style: 'gap:8px;justify-content:flex-end' },
        h('button', { onclick: close }, 'Cancelar'),
        h('button', { class: 'primary', disabled: busy || !valid(), onclick: create }, busy ? '⏳ A cortar… (pode demorar)' : '✂ Criar o vídeo cortado')));
  }

  async function create() {
    if (busy || !valid()) return;
    busy = true;
    draw();
    try {
      const r = await api(`/api/projects/${state.id}/trim`, { method: 'POST', body: JSON.stringify({ path: rel, keep: parts.map((x) => [x.a, x.b]), replace }) });
      close();
      toast(`✓ Vídeo cortado: ${trimFmt(r.seconds)}.`, 5000);
      await onDone?.(r);
    } catch (e) {
      busy = false;
      draw();
      toast('Não consegui cortar: ' + e.message, 7000);
    }
  }

  dlg.append(h('div', { class: 'stack' }, h('h3', { style: 'margin:0' }, '✂ ' + title), vid, box));
  document.body.append(dlg);
  dlg.showModal();
  draw();
  api(`/api/projects/${state.id}/speech?p=${encodeURIComponent(rel)}`).then((r) => { speech = r.parts ?? []; if (!dur && r.duration) { dur = r.duration; if (!parts.length) parts = [{ a: 0, b: Math.round(dur * 10) / 10 }]; } draw(); }).catch(() => { speech = []; draw(); });
}
