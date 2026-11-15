'use strict';
// Envio de ficheiros, imagens do local (carregar ou Pexels), cortes, música e telemóvel.
// Carregado depois de app.js: usa as globais state, h, $, api, refresh, save, dirty.

// ── avisos curtos ─────────────────────────────────────────────────────────
function toast(msg, ms = 2500) {
  let t = $('#toast');
  if (!t) {
    t = h('div', { id: 'toast', class: 'toast' });
    document.body.append(t);
  }
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  if (ms) toast.timer = setTimeout(() => (t.hidden = true), ms);
}

// ── escolher e enviar ficheiros ───────────────────────────────────────────
function pickFile(accept) {
  return new Promise((ok) => {
    const inp = h('input', { type: 'file', accept, hidden: true });
    inp.onchange = () => ok(inp.files[0] ?? null);
    inp.oncancel = () => ok(null);
    document.body.append(inp);
    inp.click();
    setTimeout(() => inp.remove(), 60000);
  });
}

function uploadTo(kind, sceneId, file, label) {
  return new Promise((ok, fail) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${state.id}/upload?kind=${kind}&scene=${sceneId ?? ''}&name=${encodeURIComponent(file.name)}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && toast(`${label}: ${Math.round((e.loaded / e.total) * 100)}%`, 0);
    xhr.onload = () => {
      let d = {};
      try { d = JSON.parse(xhr.responseText || '{}'); } catch { /* resposta não-JSON */ }
      if (xhr.status < 300) { toast(`${label}: concluído ✓`); ok(d); }
      else fail(new Error(d.error || xhr.statusText));
    };
    xhr.onerror = () => fail(new Error('falhou a ligação ao estúdio'));
    xhr.send(file);
  });
}

/** O servidor escreve em project.json (presenter, credits): grava antes para não perder edições por guardar. */
async function flushBeforeUpload() {
  if (state.dirty) return save();
  return true;
}

async function uploadScene(kind, sceneId, accept, label) {
  const f = await pickFile(accept);
  if (!f) return;
  if (!(await flushBeforeUpload())) return;
  try {
    await uploadTo(kind, sceneId, f, label);
    await refresh();
  } catch (e) {
    toast('Erro: ' + e.message, 6000);
  }
}

/** Depois de recarregar o projeto os objetos antigos ficam obsoletos: procura sempre a cena atual. */
const curScene = (id) => state.data.project.scenes.find((x) => x.id === id);

const fileUrl = (path) => `/api/projects/${state.id}/file?p=${encodeURIComponent(path)}`;
const isVideoPath = (p) => /\.(mp4|mov|m4v|webm|mkv|avi|3gp)$/i.test(p || '');

function thumb(path, size = 120) {
  if (!path) return null;
  const style = `height:${size}px;border-radius:8px;border:1px solid var(--line);background:#000;max-width:100%`;
  return isVideoPath(path)
    ? h('video', { src: fileUrl(path), muted: true, controls: true, style })
    : h('img', { src: fileUrl(path), style, alt: path });
}

// ── imagem/vídeo da cena (principal) ──────────────────────────────────────
function mediaBlock(p, s) {
  const box = h('div', { class: 'stack', style: 'gap:8px' },
    h('div', { class: 'muted' }, 'Imagem ou vídeo desta cena (o apresentador, se houver, tem prioridade quando a voz é a dele)'),
    thumb(s.media),
    h('div', { class: 'row' },
      h('button', { onclick: async () => {
        const f = await pickFile('image/*,video/*');
        if (!f) return;
        try { const r = await uploadTo('media', s.id, f, 'Imagem'); s.media = r.path; dirty(); renderEditor(); } catch (e) { toast('Erro: ' + e.message, 6000); }
      } }, s.media ? 'Trocar ficheiro' : 'Carregar imagem/vídeo'),
      h('button', { onclick: () => openPexels(s.id, (path) => { curScene(s.id).media = path; dirty(); renderEditor(); }) }, 'Procurar no Pexels'),
      s.media && h('button', { class: 'danger', onclick: () => { s.media = undefined; dirty(); renderEditor(); } }, 'Remover'),
    ),
  );
  return box;
}

// ── cortes para imagens do local (reportagem) ─────────────────────────────
function cutawaysBlock(p, s) {
  const list = (s.cutaways ??= []);
  const rows = list.map((c, k) =>
    h('div', { class: 'cut' },
      thumb(c.media, 64),
      h('label', { style: 'margin:0' }, 'Entra aos (s)',
        h('input', { type: 'number', min: 0, step: 0.1, value: c.at, oninput: (e) => { c.at = Number(e.target.value); dirty(); } })),
      h('label', { style: 'margin:0' }, 'Dura (s)',
        h('input', { type: 'number', min: 0.5, step: 0.1, value: c.duration, oninput: (e) => { c.duration = Number(e.target.value); dirty(); } })),
      h('button', { class: 'danger', onclick: () => { list.splice(k, 1); dirty(); renderEditor(); } }, 'Remover'),
    ),
  );
  return h('div', { class: 'stack', style: 'gap:8px' },
    h('div', { class: 'muted' }, `Cortes para imagens do local enquanto fala (${list.length}). "Entra aos" conta desde o início da fala desta cena.`),
    ...rows,
    h('div', { class: 'row' },
      h('button', { onclick: async () => {
        const f = await pickFile('image/*,video/*');
        if (!f) return;
        try { const r = await uploadTo('media', s.id, f, 'Corte'); list.push({ media: r.path, at: 1, duration: 2 }); dirty(); renderEditor(); } catch (e) { toast('Erro: ' + e.message, 6000); }
      } }, '+ Carregar imagem/vídeo do local'),
      h('button', { onclick: () => openPexels(s.id, (path) => { (curScene(s.id).cutaways ??= []).push({ media: path, at: 1, duration: 2 }); dirty(); renderEditor(); }) }, '+ Procurar no Pexels'),
    ),
  );
}

// ── Pexels ────────────────────────────────────────────────────────────────
async function openPexels(sceneId, onPicked) {
  const dlg = $('#pexels');
  const res = $('#pexels-results');
  const form = $('#pexels-form');
  const orient = state.data.project.aspect === '16:9' ? 'landscape' : state.data.project.aspect === '1:1' ? 'square' : 'portrait';
  form.orientation.value = orient;
  res.replaceChildren(h('p', { class: 'muted' }, 'Escreva o que procura (em inglês dá mais resultados) e carregue em Procurar.'));
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    res.replaceChildren(h('p', { class: 'muted' }, 'A procurar…'));
    try {
      const hits = await api(`/api/pexels/search?q=${encodeURIComponent(form.q.value)}&type=${form.type.value}&orientation=${form.orientation.value}`);
      if (!hits.length) return res.replaceChildren(h('p', { class: 'muted' }, 'Sem resultados.'));
      res.replaceChildren(...hits.map((x) =>
        h('button', { class: 'pex', title: `${x.author} · ${x.type === 'videos' ? Math.round(x.duration) + ' s' : ''}`, onclick: async () => {
          if (!(await flushBeforeUpload())) return;
          toast('A descarregar do Pexels… (a CDN pode ser lenta)', 0);
          try {
            const r = await api(`/api/projects/${state.id}/pexels`, { method: 'POST', body: JSON.stringify({ type: x.type, link: x.link, author: x.author, url: x.url, scene: sceneId }) });
            // o servidor guardou o crédito no projeto: recarrega e só depois aplica a escolha
            state.data = await api(`/api/projects/${state.id}`);
            dlg.close();
            toast('Descarregado ✓ (crédito guardado)');
            onPicked(r.path);
          } catch (e) { toast('Erro: ' + e.message, 6000); }
        } },
          h('img', { src: x.thumb, alt: '' }),
          h('small', {}, `${x.author}${x.type === 'videos' ? ' · vídeo ' + Math.round(x.duration) + ' s' : ''}`),
        ),
      ));
    } catch (e) {
      res.replaceChildren(h('p', { style: 'color:var(--bad)' }, e.message));
    }
  };
  dlg.showModal();
}

// ── música (licença obrigatória) ──────────────────────────────────────────
function musicBlock(p) {
  const m = p.music;
  const today = new Date().toISOString().slice(0, 10);
  return h('section', { class: 'card stack' },
    h('h3', { style: 'margin:0' }, 'Música (opcional)'),
    h('p', { class: 'muted', style: 'margin:0' },
      'Só com licença que permita uso comercial. Guarde a prova (página da licença) e preencha os campos: o motor recusa música sem licença e fonte, e o crédito entra sozinho na descrição.'),
    m ? h('div', { class: 'stack', style: 'gap:8px' },
      h('div', { class: 'row' }, h('b', {}, m.file), h('button', { class: 'danger', onclick: () => { p.music = undefined; dirty(); renderEditor(); } }, 'Remover música')),
      field('Licença (o que permite, com a data em que a leu)', m.license, (v) => (m.license = v), { area: true, rows: 2 }),
      field('Fonte (link da página da faixa/licença)', m.source, (v) => (m.source = v)),
      field('Crédito a mostrar na descrição (se a licença exigir atribuição)', m.attribution, (v) => (m.attribution = v || undefined)),
      h('div', { class: 'row' },
        h('button', { onclick: () => {
          const name = m.file.split('/').pop().replace(/\.[^.]+$/, '');
          m.license = `FiftySounds: uso gratuito pessoal e comercial; atribuição OBRIGATÓRIA com link para o site; proibido revender/redistribuir as faixas. Lido em ${today} em https://www.fiftysounds.com/pt/informacoes-de-licenciamento.html. Não refere TikTok/Instagram nem vídeos de governo: confirmar.`;
          m.source = 'https://www.fiftysounds.com/pt/';
          m.attribution = `Música: ${name} — FiftySounds (www.fiftysounds.com/pt/)`;
          dirty(); renderEditor();
        } }, 'Preencher para FiftySounds'),
      ),
    ) : h('div', { class: 'row' },
      h('button', { onclick: async () => {
        const f = await pickFile('audio/*');
        if (!f) return;
        if (!(await flushBeforeUpload())) return;
        try {
          const r = await uploadTo('music', undefined, f, 'Música');
          state.data = await api(`/api/projects/${state.id}`);
          state.data.project.music = { file: r.path, license: '', source: '' };
          dirty(); renderEditor();
        } catch (e) { toast('Erro: ' + e.message, 6000); }
      } }, 'Carregar música (mp3, wav, m4a…)'),
    ),
  );
}

// ── telemóvel ─────────────────────────────────────────────────────────────
async function openPhone(pid) {
  const dlg = $('#phone');
  const body = $('#phone-body');
  // com um projeto, o QR abre o telemóvel logo nesse vídeo
  const info = await api('/api/info' + (typeof pid === 'string' && pid ? `?p=${encodeURIComponent(pid)}` : ''));
  if (!info.lan) {
    body.replaceChildren(
      h('p', {}, 'O modo telemóvel está desligado (por segurança, o estúdio só fala com este computador).'),
      h('p', {}, 'Para ligar: feche o estúdio e abra-o assim:'),
      h('pre', { class: 'pub' }, 'npm run studio -- --lan'),
      h('p', { class: 'muted' }, 'Depois abra o link que aparece no terminal, no telemóvel, ligado ao mesmo Wi-Fi.'),
    );
  } else {
    body.replaceChildren(
      h('p', {}, 'Aponte a câmara do telemóvel (ligado ao mesmo Wi-Fi) para este código:'),
      ...info.urls.map((u, i) => {
        const box = h('div', { style: 'display:flex;justify-content:center;margin:8px 0' });
        box.innerHTML = info.qr[i]; // SVG gerado pelo nosso servidor a partir do link
        return h('div', {}, box, h('details', {}, h('summary', {}, 'Prefiro copiar o link'), h('pre', { class: 'pub', style: 'user-select:all;word-break:break-all' }, u)));
      }),
      info.secure && h('div', { class: 'note', style: 'margin:8px 0' }, h('b', {}, '1.ª vez: '), 'o telemóvel vai avisar "a ligação não é privada". É normal: é o seu próprio PC. Toque em Avançado → Continuar (ou "Visitar este site"). Depois deixa gravar com o texto por cima da câmara.'),
      h('p', { class: 'muted' }, 'O código muda sempre que reinicia o estúdio. Use só no Wi-Fi da sua casa. No telemóvel vê o guião cena a cena, escolhe o local, grava e envia.'),
    );
  }
  dlg.showModal();
}
$('#phone-btn')?.addEventListener('click', openPhone);

// ?phone=1 abre já a janela do telemóvel (usado pelo iniciar-estudio.bat)
if (new URLSearchParams(location.search).get('phone')) openPhone();
