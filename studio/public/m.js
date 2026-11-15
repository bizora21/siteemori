'use strict';
// Página do telemóvel: ver o texto, definir local e nota de gravação, gravar com a
// câmara nativa do telemóvel e enviar para o estúdio. Não usa getUserMedia (precisa
// de HTTPS; a câmara nativa funciona em HTTP e dá melhor qualidade).

const $ = (s, r = document) => r.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid === false || kid === true || kid == null) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
};

async function api(path, opts = {}) {
  const r = await fetch(path, opts);
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text();
  if (!r.ok) throw new Error(data?.error || r.statusText);
  return data;
}

const app = $('#app');
let cur = null; // { id, data }
let status = ''; // mensagem de envio

// ── lista de projetos ─────────────────────────────────────────────────────
async function home() {
  cur = null;
  const s = await api('/api/state');
  app.replaceChildren(
    h('h2', {}, 'Escolha o vídeo a gravar'),
    ...s.projects.map((p) =>
      h('button', { class: 'card item', style: 'width:100%;text-align:left', onclick: () => open(p.id) },
        h('b', { style: 'display:block' }, p.title),
        h('small', { class: 'muted' }, `${p.recorded}/${p.scenes} cenas gravadas`)),
    ),
  );
}

async function open(id) {
  const data = await api(`/api/projects/${id}`);
  cur = { id, data };
  history.replaceState(null, '', `?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(location.search)), p: id })}`);
  render();
}

async function reload() {
  cur.data = await api(`/api/projects/${cur.id}`);
  render();
}

// ── envio ─────────────────────────────────────────────────────────────────
function upload(kind, sceneId, file, label) {
  return new Promise((ok, fail) => {
    const bar = $('#upbar');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${cur.id}/upload?kind=${kind}&scene=${sceneId}&name=${encodeURIComponent(file.name || 'gravacao.mp4')}`);
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pc = Math.round((e.loaded / e.total) * 100);
      bar.hidden = false;
      bar.textContent = `${label}: ${pc}% (${(e.loaded / 1048576).toFixed(0)} de ${(e.total / 1048576).toFixed(0)} MB) — não feche esta página`;
    };
    xhr.onload = () => {
      let d = {};
      try { d = JSON.parse(xhr.responseText || '{}'); } catch { /* não-JSON */ }
      if (xhr.status < 300) ok(d);
      else fail(new Error(d.error || xhr.statusText));
    };
    xhr.onerror = () => fail(new Error('falhou a ligação (o telemóvel e o computador estão no mesmo Wi-Fi?)'));
    xhr.send(file);
  });
}

function fileBtn(label, accept, capture, onFile, primary) {
  const inp = h('input', { type: 'file', accept, ...(capture ? { capture } : {}) });
  inp.addEventListener('change', async () => {
    const f = inp.files[0];
    if (!f) return;
    try {
      await onFile(f);
      $('#upbar').textContent = 'Enviado ✓';
      await reload();
    } catch (e) {
      $('#upbar').hidden = false;
      $('#upbar').textContent = 'Erro: ' + e.message;
    }
  });
  return h('label', { class: 'btn' + (primary ? ' primary' : '') }, label, inp);
}

// ── ecrã do projeto ───────────────────────────────────────────────────────
function render() {
  const { project: p, scenes } = cur.data;
  const rep = p.template === 'reportagem';
  const inst = p.template === 'institucional';
  const withVideo = rep || inst;

  app.replaceChildren(
    h('button', { onclick: home }, '← Outros vídeos'),
    h('h2', { style: 'margin:10px 0 2px' }, p.title),
    h('p', { class: 'muted', style: 'margin-top:0' }, withVideo
      ? 'Grave cada cena com a câmara do telemóvel (vertical, a luz de frente). Defina o local e a nota de cada cena.'
      : 'Este vídeo usa só a voz: grave o áudio de cada cena (gravador de voz do telemóvel) e envie.'),
    h('div', { id: 'upbar', class: 'note', hidden: true }),
    ...p.scenes.map((s, i) => {
      const st = scenes[i];
      return h('section', { class: 'card', style: 'margin-bottom:12px' },
        h('div', { class: 'row' },
          h('b', { style: 'color:var(--accent)' }, String(i + 1).padStart(2, '0')),
          h('b', {}, s.id),
          h('span', { class: 'pill ' + (st.recorded ? 'ok' : '') }, st.recorded ? (st.kind === 'video' ? 'vídeo enviado' : 'áudio enviado') : 'por gravar'),
          (s.cutaways?.length || s.media) && h('span', { class: 'pill' }, `${(s.cutaways?.length ?? 0) + (s.media ? 1 : 0)} imagem(ns) do local`),
        ),
        p.template === 'reportagem' && h('label', { style: 'margin-top:8px' }, 'Local desta cena (só locais verdadeiros)',
          h('input', { type: 'text', value: s.location ?? '', placeholder: 'ex.: Beira · Porto', onchange: (e) => patch(s.id, { location: e.target.value }) })),
        h('label', { style: 'margin-top:6px' }, 'Nota: onde estar, que plano, o que mostrar',
          h('textarea', { rows: 2, onchange: (e) => patch(s.id, { shot: e.target.value }), value: s.shot ?? '' }, s.shot ?? '')),
        h('p', { class: 'big-text' }, s.narration),
        h('div', { class: 'btns' },
          h('button', { class: 'primary', onclick: () => teleprompter(i) }, '📜 Teleprompter'),
          withVideo && fileBtn('🎥 Gravar vídeo', 'video/*', 'user', (f) => upload('presenter', s.id, f, 'Vídeo'), true),
          withVideo && fileBtn('📁 Vídeo da galeria', 'video/*', null, (f) => upload('presenter', s.id, f, 'Vídeo')),
          fileBtn('🎙 Gravar áudio', 'audio/*', 'user', (f) => upload('voice', s.id, f, 'Áudio')),
          rep && fileBtn('📷 Foto/vídeo do local', 'image/*,video/*', 'environment', (f) => upload('cutaway', s.id, f, 'Imagem do local')),
          inst && fileBtn('📷 Imagem da cena', 'image/*,video/*', 'environment', (f) => upload('scenemedia', s.id, f, 'Imagem')),
        ),
      );
    }),
    h('p', { class: 'muted' }, 'A foto/vídeo do local entra como um corte durante a fala desta cena; no computador ajusta quando entra e quanto dura.'),
  );
}

async function patch(sceneId, body) {
  try {
    await api(`/api/projects/${cur.id}/scene/${sceneId}`, { method: 'PATCH', body: JSON.stringify(body) });
    const s = cur.data.project.scenes.find((x) => x.id === sceneId);
    Object.assign(s, body);
  } catch (e) {
    alert('Não guardou: ' + e.message);
  }
}

// ── teleprompter ──────────────────────────────────────────────────────────
const pt = { idx: 0, size: 34, timer: null };
function teleprompter(i) {
  pt.idx = i;
  drawPrompter();
  $('#pt').hidden = false;
}
function drawPrompter() {
  const scenes = cur.data.project.scenes;
  const s = scenes[pt.idx];
  const box = $('#pt-text');
  box.style.fontSize = pt.size + 'px';
  box.replaceChildren(
    h('div', { class: 'meta' }, `Cena ${pt.idx + 1}/${scenes.length} · ${s.id}${s.location ? ' · local: ' + s.location : ''}`),
    s.shot && h('div', { class: 'meta', style: 'font-style:italic' }, `Nota: ${s.shot}`),
    h('p', {}, s.narration),
  );
  box.scrollTop = 0;
}
function stopScroll() {
  clearInterval(pt.timer);
  pt.timer = null;
  $('#pt-play').textContent = '▶ Rolar';
}
$('#pt-close').onclick = () => { stopScroll(); $('#pt').hidden = true; };
$('#pt-small').onclick = () => { pt.size = Math.max(18, pt.size - 4); $('#pt-text').style.fontSize = pt.size + 'px'; };
$('#pt-big').onclick = () => { pt.size = Math.min(90, pt.size + 4); $('#pt-text').style.fontSize = pt.size + 'px'; };
$('#pt-prev').onclick = () => { stopScroll(); pt.idx = Math.max(0, pt.idx - 1); drawPrompter(); };
$('#pt-next').onclick = () => { stopScroll(); pt.idx = Math.min(cur.data.project.scenes.length - 1, pt.idx + 1); drawPrompter(); };
$('#pt-play').onclick = () => {
  if (pt.timer) return stopScroll();
  $('#pt-play').textContent = '■ Parar';
  pt.timer = setInterval(() => ($('#pt-text').scrollTop += Number($('#pt-speed').value) / 20), 50);
};

// ── arranque ──────────────────────────────────────────────────────────────
const wanted = new URLSearchParams(location.search).get('p');
(wanted ? open(wanted) : home()).catch((e) => {
  app.replaceChildren(h('h2', {}, 'Não consegui ligar ao estúdio'), h('p', {}, e.message), h('p', { class: 'muted' }, 'Abra o link completo que aparece no terminal do computador (inclui o código).'));
});
