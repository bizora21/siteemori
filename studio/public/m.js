'use strict';
// Página do telemóvel: guia passo a passo. Uma cena de cada vez; a personalização
// (quem aparece, local, nota) fica à vista; grava-se DENTRO da página com o texto
// por cima da câmara (precisa de HTTPS) ou, se não der, com a câmara normal do telemóvel.

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
const patchJson = (path, body) => api(path, { method: 'PATCH', body: JSON.stringify(body) });

const app = $('#app');
const S = { id: null, data: null, readSize: 24 };
const canRecordInPage = () => Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
const withVideo = (p) => p.template === 'reportagem' || p.template === 'institucional';

function toast(msg, ms = 2800) {
  let t = $('#toast');
  if (!t) { t = h('div', { id: 'toast', class: 'toast' }); document.body.append(t); }
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  if (ms) toast.t = setTimeout(() => (t.hidden = true), ms);
}

async function reload() {
  S.data = await api(`/api/projects/${S.id}`);
}

// ── 1. escolher o vídeo ───────────────────────────────────────────────────
async function home() {
  S.id = null;
  history.replaceState(null, '', location.pathname + location.search.replace(/([?&])p=[^&]*&?/, '$1').replace(/[?&]$/, ''));
  const s = await api('/api/state');
  app.replaceChildren(
    h('h2', { style: 'margin-top:4px' }, 'Que vídeo vai gravar?'),
    ...s.projects.map((p) =>
      h('button', { class: 'card row-scene', onclick: () => openProject(p.id) },
        h('div', {}, h('b', { style: 'display:block' }, p.title), h('small', { class: 'muted' }, `${p.recorded} de ${p.scenes} cenas enviadas`))),
    ),
  );
}

async function openProject(id) {
  S.id = id;
  const q = new URLSearchParams(location.search);
  q.set('p', id);
  history.replaceState(null, '', `${location.pathname}?${q}`);
  await reload();
  projectScreen();
}

// ── 2. o guião do vídeo ───────────────────────────────────────────────────
function projectScreen() {
  const { project: p, scenes } = S.data;
  const n = p.scenes.length;
  const done = scenes.filter((x) => x.recorded).length;
  const next = scenes.findIndex((x) => !x.recorded);

  app.replaceChildren(
    h('button', { onclick: home }, '← Outros vídeos'),
    h('h2', { style: 'margin:12px 0 4px' }, p.title),
    h('div', { class: 'bar' }, h('i', { style: `width:${(done / n) * 100}%` })),
    h('p', { class: 'muted', style: 'margin:6px 0 12px' }, done === n ? '✓ Todas as cenas enviadas.' : `${done} de ${n} cenas enviadas.`),
    next >= 0
      ? h('button', { class: 'primary block', onclick: () => sceneScreen(next) }, `▶ Gravar a cena ${next + 1}`)
      : h('div', { class: 'note' }, 'Tudo enviado. No computador, abra este vídeo no estúdio e carregue em "Gerar rascunho".'),

    p.template === 'reportagem' && h('section', { class: 'card', style: 'margin-top:14px' },
      h('h3', { style: 'margin:0 0 6px' }, 'Quem aparece no vídeo'),
      h('label', {}, 'Nome',
        h('input', { type: 'text', value: p.host?.name === 'Seu nome' ? '' : (p.host?.name ?? ''), placeholder: 'O seu nome', onchange: (e) => saveMeta({ hostName: e.target.value }) })),
      h('label', {}, 'Função ou descrição (opcional)',
        h('input', { type: 'text', value: p.host?.role ?? '', placeholder: 'ex.: Professora, Fundador da MOVAGO', onchange: (e) => saveMeta({ hostRole: e.target.value }) })),
    ),

    h('h3', { style: 'margin:18px 0 0' }, 'Cenas'),
    ...p.scenes.map((s, i) =>
      h('button', { class: 'card row-scene', onclick: () => sceneScreen(i) },
        h('b', { style: 'color:var(--accent)' }, String(i + 1).padStart(2, '0')),
        h('div', {}, h('b', { style: 'display:block' }, s.id), h('small', { class: 'muted' }, [s.location && `📍 ${s.location}`, s.narration.slice(0, 48) + (s.narration.length > 48 ? '…' : '')].filter(Boolean).join(' · '))),
        h('span', { class: 'st' }, scenes[i].recorded ? '✅' : '⬜')),
    ),

    h('details', { class: 'card', style: 'margin-top:16px' },
      h('summary', {}, 'Como funciona?'),
      h('div', { class: 'stack', style: 'margin-top:10px' },
        step(1, 'Toque numa cena (ou em "Gravar a cena").'),
        step(2, 'Escolha onde vai estar (Local) e escreva uma nota para si, se quiser.'),
        step(3, canRecordInPage() ? 'Toque em "Gravar": o texto aparece por cima da câmara. Leia e pare no fim.' : 'Toque em "Gravar": abre a câmara do telemóvel (o texto não fica no ecrã; leia antes).'),
        step(4, 'Repita nas outras cenas. No fim, no computador, carregue em "Gerar rascunho".'),
      )),
  );
}
const step = (n, t) => h('div', { class: 'step' }, h('b', { class: 'n' }, n), h('span', {}, t));

async function saveMeta(body) {
  try { await patchJson(`/api/projects/${S.id}/meta`, body); toast('Guardado ✓', 1500); await reload(); } catch (e) { toast('Não guardou: ' + e.message, 5000); }
}

// ── 3. uma cena ───────────────────────────────────────────────────────────
function sceneScreen(i) {
  S.cur = i;
  const { project: p, scenes } = S.data;
  const n = p.scenes.length;
  const s = p.scenes[i];
  const st = scenes[i];
  const video = withVideo(p);
  const inPage = canRecordInPage();
  const local = p.template === 'reportagem';
  const locInput = local ? h('input', { type: 'text', value: s.location ?? '', placeholder: 'ex.: Beira · Porto', onchange: (e) => patchScene(s.id, { location: e.target.value }) }) : null;
  const shotInput = h('textarea', { rows: 2, onchange: (e) => patchScene(s.id, { shot: e.target.value }) }, s.shot ?? '');
  // Guarda o que estiver escrito mesmo que o campo ainda não tenha perdido o foco.
  const saveFields = async () => {
    const body = {};
    if (locInput && locInput.value !== (s.location ?? '')) body.location = locInput.value;
    if (shotInput.value !== (s.shot ?? '')) body.shot = shotInput.value;
    if (Object.keys(body).length) await patchScene(s.id, body);
  };
  const mb = st.kb >= 1024 ? (st.kb / 1024).toFixed(1) + ' MB' : st.kb + ' KB';

  app.replaceChildren(
    h('div', { class: 'row', style: 'justify-content:space-between' },
      h('button', { onclick: async () => { await saveFields(); projectScreen(); } }, '← Guião'),
      h('b', {}, `Cena ${i + 1} de ${n}`)),

    h('section', { class: 'card', style: 'margin-top:12px' },
      h('div', { class: 'row' }, h('b', {}, s.id), h('span', { class: 'pill ' + (st.recorded ? 'ok' : '') }, st.recorded ? '✅ enviada' : 'por gravar')),
      h('p', { class: 'reading', style: `--rs:${S.readSize}px;margin:10px 0 8px` }, s.narration),
      h('div', { class: 'row' },
        h('button', { onclick: () => { S.readSize = Math.max(16, S.readSize - 3); sceneScreen(i); } }, 'A−'),
        h('button', { onclick: () => { S.readSize = Math.min(48, S.readSize + 3); sceneScreen(i); } }, 'A+'),
        h('button', { onclick: () => editText(i) }, '✎ Editar texto')),
    ),

    h('section', { class: 'card', style: 'margin-top:12px' },
      h('h3', { style: 'margin:0 0 6px' }, 'Personalizar esta cena'),
      local && h('label', {}, 'Local (onde vai estar — só locais verdadeiros)', locInput),
      h('label', {}, 'Nota para si (plano, o que mostrar)', shotInput),
    ),

    h('section', { class: 'card', style: 'margin-top:12px' },
      h('h3', { style: 'margin:0 0 8px' }, video ? 'Gravar vídeo' : 'Gravar voz'),
      st.recorded && h('div', { class: 'note', style: 'margin-bottom:10px' }, `✅ Enviada e guardada no PC: ${st.file} (${mb}). Pode gravar de novo para substituir.`),
      inPage
        ? h('button', { class: 'primary block', onclick: () => recorder(i) }, video ? '🎥 Gravar (o texto fica no ecrã)' : '🎙 Gravar (o texto fica no ecrã)')
        : h('div', { class: 'note' }, 'Esta ligação não permite gravar dentro da página. Abra o estúdio com iniciar-estudio.bat (liga HTTPS) e use o QR novo. Por agora, leia o texto acima e grave com a câmara normal:'),
      h('div', { class: 'stack', style: 'margin-top:10px' },
        video
          ? fileBtn(inPage ? 'Usar a câmara normal do telemóvel' : '🎥 Gravar com a câmara do telemóvel', 'video/*', 'user', (f) => upload('presenter', s.id, f, 'Vídeo'), !inPage)
          : fileBtn(inPage ? 'Usar o gravador de voz do telemóvel' : '🎙 Gravar com o gravador do telemóvel', 'audio/*', 'user', (f) => upload('voice', s.id, f, 'Áudio'), !inPage),
        fileBtn('📁 Escolher um ficheiro já gravado', video ? 'video/*' : 'audio/*', null, (f) => upload(video ? 'presenter' : 'voice', s.id, f, video ? 'Vídeo' : 'Áudio')),
      ),
      !inPage && h('p', { class: 'muted', style: 'font-size:14px;margin:10px 0 0' }, 'Dica: a câmara normal tira o texto do ecrã. Ponha o teleprompter no PC, ao lado do telemóvel.'),
    ),

    local && h('section', { class: 'card', style: 'margin-top:12px' },
      h('h3', { style: 'margin:0 0 6px' }, 'Imagens do local'),
      h('p', { class: 'muted', style: 'margin:0 0 8px;font-size:14px' }, `${(s.cutaways?.length ?? 0)} corte(s) nesta cena. Entram enquanto fala; no computador ajusta quando e quanto dura.`),
      fileBtn('📷 Tirar foto ou vídeo do local', 'image/*,video/*', 'environment', (f) => upload('cutaway', s.id, f, 'Imagem do local')),
      h('div', { style: 'height:8px' }),
      fileBtn('📁 Escolher da galeria', 'image/*,video/*', null, (f) => upload('cutaway', s.id, f, 'Imagem do local')),
    ),
    h('div', { id: 'upbar', class: 'note', style: 'margin-top:12px', hidden: true }),
    h('div', { class: 'navbar' },
      h('button', { disabled: i === 0, onclick: async () => { await saveFields(); sceneScreen(i - 1); } }, '‹ Anterior'),
      h('button', { class: 'primary', style: 'flex:1', onclick: async () => { await saveFields(); toast('Guardado no PC ✓', 1500); i < n - 1 ? sceneScreen(i + 1) : projectScreen(); } }, i < n - 1 ? 'Guardar e próxima cena →' : 'Guardar e ver o guião ✓')),
  );
  window.scrollTo(0, 0);
}

async function patchScene(sceneId, body) {
  try { await patchJson(`/api/projects/${S.id}/scene/${sceneId}`, body); toast('Guardado ✓', 1500); await reload(); } catch (e) { toast('Não guardou: ' + e.message, 5000); }
}

function editText(i) {
  const s = S.data.project.scenes[i];
  const v = prompt('Texto desta cena:', s.narration);
  if (v == null || !v.trim() || v.trim() === s.narration) return;
  patchScene(s.id, { narration: v }).then(() => sceneScreen(i));
}

// ── envio ─────────────────────────────────────────────────────────────────
function upload(kind, sceneId, file, label) {
  return new Promise((ok, fail) => {
    const bar = $('#upbar') ?? h('div');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${S.id}/upload?kind=${kind}&scene=${sceneId}&name=${encodeURIComponent(file.name || 'gravacao.mp4')}`);
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      bar.hidden = false;
      bar.textContent = `${label}: ${Math.round((e.loaded / e.total) * 100)}% (${(e.loaded / 1048576).toFixed(0)} de ${(e.total / 1048576).toFixed(0)} MB) — não feche esta página`;
    };
    xhr.onload = () => {
      let d = {};
      try { d = JSON.parse(xhr.responseText || '{}'); } catch { /* não-JSON */ }
      xhr.status < 300 ? ok(d) : fail(new Error(d.error || xhr.statusText));
    };
    xhr.onerror = () => fail(new Error('falhou a ligação (telemóvel e PC no mesmo Wi-Fi?)'));
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
      await afterUpload();
    } catch (e) {
      const bar = $('#upbar');
      if (bar) { bar.hidden = false; bar.textContent = 'Erro: ' + e.message; }
    }
  });
  return h('label', { class: 'btn block' + (primary ? ' primary' : '') }, label, inp);
}

/** Depois de enviar: passa à próxima cena por gravar (ou volta ao guião se acabou). */
async function afterUpload() {
  const cur = Number(S.cur ?? 0);
  await reload();
  const next = S.data.scenes.findIndex((x, k) => !x.recorded && k > cur);
  toast('Enviado ✓ — já está guardado no PC');
  if (next >= 0) sceneScreen(next);
  else projectScreen();
}

// ── gravador dentro da página, com o texto por cima da câmara ─────────────
function pickMime(video) {
  const list = video
    ? ['video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    : ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  return list.find((m) => MediaRecorder.isTypeSupported(m));
}

function recorder(i) {
  let idx = i;
  S.cur = i;
  const video = withVideo(S.data.project);
  const cur = () => S.data.project.scenes[idx];
  const total = () => S.data.project.scenes.length;
  let facing = 'user';
  let stream = null;
  let mr = null;
  let chunks = [];
  let scrollTimer = null;
  let clock = null;
  let wake = null;
  const R = { size: 30, speed: 0, clean: true };

  const preview = h('video', { id: 'rec-v', playsinline: true, muted: true, autoplay: true });
  const text = h('div', { id: 'rec-text' }, cur().narration);
  const meta = h('div', { class: 'meta' }, '');
  const prevBtn = h('button', { onclick: () => go(-1) }, '‹ Anterior');
  const nextBtn = h('button', { onclick: () => go(1) }, 'Seguinte ›');
  function setScene(k) {
    idx = k;
    S.cur = k;
    const s = cur();
    meta.textContent = `Cena ${k + 1}/${total()}${s.location ? ' · 📍 ' + s.location : ''}${s.shot ? ' · ' + s.shot : ''}`;
    text.textContent = s.narration;
    text.scrollTop = 0;
    prevBtn.disabled = k === 0;
    nextBtn.disabled = k === total() - 1;
  }
  function go(d) {
    if (mr && mr.state === 'recording') return toast('Pare a gravação antes de mudar de cena.');
    setScene(Math.min(total() - 1, Math.max(0, idx + d)));
  }
  const timerEl = h('span', { class: 'muted', style: 'color:#ccc' }, '');
  const recBtn = h('button', { class: 'rec' }, '● Gravar');
  const cleanBtn = h('button', { onclick: async () => {
    if (mr && mr.state === 'recording') return toast('Pare a gravação antes de mudar.');
    R.clean = !R.clean;
    cleanBtn.textContent = R.clean ? '🔇 Ruído: LIGADO' : '🔈 Ruído: desligado';
    stream?.getTracks().forEach((t) => t.stop());
    await open();
  } }, '🔇 Ruído: LIGADO');
  const speed = h('input', { type: 'range', min: 0, max: 120, value: 0, style: 'width:120px' });
  const overlay = h('div', { id: 'rec' },
    video && preview,
    h('div', { id: 'rec-pt' },
      meta,
      text),
    h('div', { id: 'rec-ctl' },
      h('div', { class: 'r' },
        h('button', { onclick: () => { R.size = Math.max(18, R.size - 3); text.style.setProperty('--rs', R.size + 'px'); } }, 'A−'),
        h('button', { onclick: () => { R.size = Math.min(64, R.size + 3); text.style.setProperty('--rs', R.size + 'px'); } }, 'A+'),
        h('span', { style: 'color:#ccc;font-size:14px' }, 'Rolagem'), speed),
      h('div', { class: 'r' }, prevBtn, recBtn, nextBtn),
      h('div', { class: 'r' },
        h('button', { onclick: cancel }, '✕ Sair'),
        video && h('button', { onclick: flip }, '⟲ Virar'),
        cleanBtn)),
  );
  text.style.setProperty('--rs', R.size + 'px');
  setScene(idx);
  document.body.append(overlay);

  async function open() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } } : false,
        // O telemóvel limpa o som (ruído, eco, volume) melhor do que o motor consegue depois.
        audio: { echoCancellation: R.clean, noiseSuppression: R.clean, autoGainControl: R.clean, channelCount: 1 },
      });
    } catch (e) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: video ? true : false, audio: true });
      } catch (e2) {
        cancel();
        toast('Sem acesso à câmara/microfone: ' + e2.message + '. Permita no navegador e tente de novo.', 8000);
        return;
      }
    }
    if (video) {
      preview.srcObject = stream;
      preview.classList.toggle('mirror', facing === 'user');
    }
    try { wake = await navigator.wakeLock?.request('screen'); } catch { /* opcional */ }
  }

  async function flip() {
    if (mr && mr.state === 'recording') return toast('Pare a gravação antes de virar a câmara.');
    stream?.getTracks().forEach((t) => t.stop());
    facing = facing === 'user' ? 'environment' : 'user';
    await open();
  }

  function start() {
    chunks = [];
    const mime = pickMime(video);
    mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000, ...(video ? { videoBitsPerSecond: 6_000_000 } : {}) } : undefined);
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = review;
    mr.start(1000);
    const t0 = Date.now();
    recBtn.textContent = '■ Parar';
    recBtn.classList.add('rec');
    recBtn.textContent = '■ Parar · 0 s';
    clock = setInterval(() => (recBtn.textContent = `■ Parar · ${Math.round((Date.now() - t0) / 1000)} s`), 500);
    text.scrollTop = 0;
    scrollTimer = setInterval(() => (text.scrollTop += Number(speed.value) / 20), 50);
  }

  function stopTimers() {
    clearInterval(clock);
    clearInterval(scrollTimer);
  }

  recBtn.onclick = () => (mr && mr.state === 'recording' ? mr.stop() : start());

  function cleanup() {
    stopTimers();
    stream?.getTracks().forEach((t) => t.stop());
    try { wake?.release(); } catch { /* opcional */ }
    overlay.remove();
  }
  function cancel() {
    if (mr && mr.state === 'recording') { mr.onstop = null; mr.stop(); }
    cleanup();
  }

  function review() {
    stopTimers();
    stream?.getTracks().forEach((t) => t.stop());
    const type = mr.mimeType || (video ? 'video/webm' : 'audio/webm');
    const blob = new Blob(chunks, { type });
    const ext = video ? (type.includes('mp4') ? 'mp4' : 'webm') : type.includes('mp4') ? 'm4a' : 'webm';
    const url = URL.createObjectURL(blob);
    const up = h('div', { class: 'note', hidden: true });
    const send = h('button', { class: 'primary', onclick: async () => {
      send.disabled = true;
      try {
        up.hidden = false;
        await uploadBlob(video ? 'presenter' : 'voice', cur().id, blob, `rec.${ext}`, up);
        await reload();
        // Modo contínuo: fica no gravador e passa à próxima cena por gravar.
        const next = S.data.scenes.findIndex((x, k) => !x.recorded && k > idx);
        if (next >= 0) {
          overlay.querySelector('#rec-review')?.remove();
          recBtn.textContent = '● Gravar';
          timerEl.textContent = '';
          chunks = [];
          setScene(next);
          toast(`Enviado ✓ guardado no PC. Agora a cena ${next + 1}.`, 3500);
          await open();
        } else {
          cleanup();
          toast('Enviado ✓ — todas as cenas estão guardadas no PC.', 4000);
          projectScreen();
        }
      } catch (e) {
        send.disabled = false;
        up.textContent = 'Erro: ' + e.message;
      }
    } }, '✓ Enviar esta gravação');
    overlay.append(h('div', { id: 'rec-review' },
      h('h3', { style: 'margin:0' }, 'Ouça/veja antes de enviar'),
      video ? h('video', { src: url, controls: true, playsinline: true }) : h('audio', { src: url, controls: true }),
      up, send,
      h('button', { onclick: () => { overlay.querySelector('#rec-review').remove(); timerEl.textContent = ''; recBtn.textContent = '● Gravar'; recBtn.classList.remove('rec'); chunks = []; open(); } }, '↺ Gravar de novo'),
      h('button', { onclick: cleanup }, 'Sair sem enviar')));
  }

  open();
}

function uploadBlob(kind, sceneId, blob, name, bar) {
  return new Promise((ok, fail) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${S.id}/upload?kind=${kind}&scene=${sceneId}&name=${encodeURIComponent(name)}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && (bar.textContent = `A enviar: ${Math.round((e.loaded / e.total) * 100)}% — não feche esta página`);
    xhr.onload = () => {
      let d = {};
      try { d = JSON.parse(xhr.responseText || '{}'); } catch { /* não-JSON */ }
      xhr.status < 300 ? ok(d) : fail(new Error(d.error || xhr.statusText));
    };
    xhr.onerror = () => fail(new Error('falhou a ligação'));
    xhr.send(blob);
  });
}

// ── arranque ──────────────────────────────────────────────────────────────
const wanted = new URLSearchParams(location.search).get('p');
(wanted ? openProject(wanted) : home()).catch((e) => {
  app.replaceChildren(h('h2', {}, 'Não consegui ligar ao estúdio'), h('p', {}, e.message), h('p', { class: 'muted' }, 'Abra o link completo do QR (inclui o código).'));
});
