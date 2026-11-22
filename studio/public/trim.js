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

  const box = h('div', { class: 'stack' });
  function draw() {
    const rows = parts.map((x, i) => h('div', { class: 'trim-row' },
      h('b', {}, `Parte ${i + 1}`),
      h('label', {}, 'de', h('input', { type: 'number', min: 0, step: 0.1, value: x.a, onchange: (e) => { x.a = num(e.target.value); draw(); } })),
      h('button', { title: 'Usar o ponto onde o vídeo está agora', onclick: () => { x.a = num(vid.currentTime); draw(); } }, '◀ início aqui'),
      h('label', {}, 'até', h('input', { type: 'number', min: 0, step: 0.1, value: x.b, onchange: (e) => { x.b = num(e.target.value); draw(); } })),
      h('button', { title: 'Usar o ponto onde o vídeo está agora', onclick: () => { x.b = num(vid.currentTime); draw(); } }, 'fim aqui ▶'),
      h('button', { title: 'Ver só esta parte', onclick: () => play(x.a, x.b) }, '▶ ver'),
      parts.length > 1 && h('button', { class: 'danger', title: 'Tirar esta parte', onclick: () => { parts.splice(i, 1); draw(); } }, '🗑')));
    const chips = speech === null
      ? h('div', { class: 'muted', style: 'font-size:13px' }, 'A procurar onde há fala…')
      : speech.length
      ? h('div', { class: 'stack', style: 'gap:6px' },
        h('div', { class: 'muted', style: 'font-size:13px' }, 'Onde há fala (separado pelas pausas). Clique para ver; "＋" para manter:'),
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...speech.map((s) => h('span', { class: 'trim-chip' },
          h('button', { onclick: () => play(s.from, s.to) }, `▶ ${trimFmt(s.from)}–${trimFmt(s.to)}`),
          h('button', { title: 'Manter esta parte', onclick: () => { parts = parts.length === 1 && parts[0].a === 0 && parts[0].b >= dur - 0.2 ? [] : parts; parts.push({ a: s.from, b: s.to }); draw(); } }, '＋')))))
      : null;
    box.replaceChildren(
      chips,
      h('div', { class: 'stack', style: 'gap:6px' }, h('b', {}, 'Partes a manter (o resto é cortado fora)'), ...rows,
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' },
          h('button', { onclick: () => { const t = num(vid.currentTime); parts.push({ a: t, b: Math.min(Math.round(dur * 10) / 10, t + 5) }); draw(); } }, '＋ Outra parte'),
          h('button', { onclick: () => { parts = [{ a: 0, b: Math.round(dur * 10) / 10 }]; draw(); } }, 'Manter tudo'))),
      h('p', { class: 'muted', style: 'margin:0' }, `Fica com ${trimFmt(kept())} de ${trimFmt(dur)}. O vídeo original não se perde${replace ? ' (fica guardado na pasta da cena)' : ''}.`),
      h('div', { class: 'row', style: 'gap:8px;justify-content:flex-end' },
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
