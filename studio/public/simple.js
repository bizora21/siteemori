'use strict';
// Interface simples do "vídeo personalizado" (reportagem) + aprovação, partilhada com os outros tipos.
// Carregado depois de app.js e media.js: usa state, h, $, api, field, dirty, save, refresh, build,
// followJob, loadPublication, issueItems, musicBlock, openPexels, openPrompter, openPhone, delRec,
// pickFile, uploadTo, flushBeforeUpload, thumb, curScene, toast.

// ── botões fixos em baixo: ouvir → ver → aprovar ──────────────────────────
function actionsBar() {
  const st = state.data.status;
  const approve = h('button', { class: 'primary', disabled: !st.draft.fresh, title: st.draft.fresh ? '' : 'Veja primeiro o rascunho', onclick: approveFinal }, '✅ Aprovar e gerar o vídeo final');
  return h('div', { class: 'actions' },
    h('button', { id: 'save-btn', onclick: save }, state.dirty ? 'Guardar *' : 'Guardar'),
    h('button', { onclick: () => build({ noRender: true }) }, '🔊 Ouvir a voz'),
    h('button', { onclick: () => build({ draft: true }) }, '🎬 Ver rascunho'),
    approve,
    h('span', { class: 'muted', id: 'job-state' }, st.draft.exists && !st.draft.fresh ? 'O rascunho está desatualizado (mudou algo): gere-o de novo.' : st.draft.fresh && !st.final.fresh ? 'Rascunho pronto: veja-o e, se estiver bem, aprove.' : ''),
  );
}

async function approveFinal() {
  if (!state.data.status.draft.fresh) return alert('Veja primeiro o rascunho (botão "Ver rascunho").');
  if (!confirm('Já ouviu a voz e viu o rascunho, e está tudo certo?\n\nVai gerar o vídeo FINAL em qualidade total.')) return;
  build({});
}

// ── secção: ouvir, ver e aprovar ──────────────────────────────────────────
function approvalSection(p) {
  const st = state.data.status;
  const id = p.id;
  const tpl = tplOf(p.template);
  const vertical = (p.aspect ?? (tpl?.aspect === '9:16' ? '9:16' : '16:9')) === '9:16';
  const stale = (x) => x.exists && !x.fresh && h('p', { style: 'color:var(--warn);margin:4px 0;font-size:14px' }, '⚠ Desatualizado: mudou algo depois de gerar. Gere de novo.');
  const row = (n, title, hint, body) =>
    h('div', { class: 'step-row' },
      h('b', { class: 'n' }, n),
      h('div', { style: 'flex:1;min-width:0' }, h('b', {}, title), h('div', { class: 'muted', style: 'margin:2px 0 8px' }, hint), body));
  const none = (t) => h('span', { class: 'muted' }, t);
  return h('section', { class: 'card stack', id: 'approve' },
    h('h3', { style: 'margin:0' }, 'Ouvir, ver e aprovar'),
    row(1, 'Ouvir a voz', 'Carregue em "🔊 Ouvir a voz" (leva segundos). Confirme a ordem das cenas, as pausas e se o que disse é o que está escrito.',
      st.audio.exists ? [stale(st.audio), h('audio', { controls: true, src: `/api/projects/${id}/audio?t=${Date.now()}`, style: 'width:100%' })] : none('Ainda não gerado.')),
    row(2, 'Ver o rascunho', 'Carregue em "🎬 Ver rascunho": o vídeo completo em baixa resolução, com cenários, legendas e música.',
      st.draft.exists ? [stale(st.draft), h('video', { controls: true, class: vertical ? 'vertical' : '', src: `/media/${id}-rascunho.mp4?t=${Date.now()}` })] : none('Ainda não gerado.')),
    row(3, 'Aprovar', 'O botão "✅ Aprovar e gerar o vídeo final" só fica ativo depois de ver um rascunho atual. Gera o vídeo em qualidade total.',
      st.final.exists ? [stale(st.final), h('video', { controls: true, class: vertical ? 'vertical' : '', src: `/media/${id}.mp4?t=${Date.now()}` })] : none('Ainda não gerado.')),
    h('section', { class: 'stack', id: 'console-box', hidden: true },
      h('div', { class: 'bar' }, h('i', { id: 'bar' })),
      h('div', { class: 'muted', id: 'progress' }),
      h('div', { class: 'console', id: 'console' })),
    h('div', { id: 'pub' }),
  );
}

// ── 3D: avisar que o visual é fixo e oferecer a versão personalizada ──────
function personalizeBanner(p) {
  return h('section', { class: 'card', style: 'border-color:var(--accent)' },
    h('b', {}, 'Quer cenários diferentes e o seu rosto?'),
    h('p', { class: 'muted', style: 'margin:4px 0 10px' }, 'Este é um modelo 3D com o visual fixo (não aceita imagens suas nem o rosto). Pode criar uma versão personalizada com o mesmo texto e as mesmas gravações, onde escolhe os cenários de cada cena (paisagens, animais, locais).'),
    h('button', { class: 'primary', onclick: async () => {
      if (state.dirty && !(await save())) return;
      try {
        const r = await api(`/api/projects/${p.id}/personalize`, { method: 'POST', body: '{}' });
        await loadState();
        await openProject(r.id);
        toast('Versão personalizada criada ✓');
      } catch (e) { alert(e.message); }
    } }, '✨ Criar versão personalizada'),
  );
}

// ── a página simples do vídeo personalizado ───────────────────────────────
function renderSimple() {
  const { project: p, brand, issues, scenes, files } = state.data;
  const main = $('#main');
  const scroll = window.scrollY;

  const head = h('section', { class: 'card stack' },
    h('div', { class: 'row' },
      h('h2', { style: 'margin:0;flex:1' }, p.title),
      h('span', { class: 'pill' }, 'Vídeo personalizado'),
      h('span', { class: 'pill' }, `marca: ${brand?.name ?? p.brand}`)),
    field('Título', p.title, (v) => (p.title = v)),
    h('p', { class: 'muted', style: 'margin:0' }, 'Em cada cena: ① escreva o que diz, ② grave (opcional), ③ escolha os cenários que aparecem. No fim, ouça, veja o rascunho e aprove.'),
    h('ul', { class: 'issues', id: 'issues' }, issueItems(issues)),
    h('details', {},
      h('summary', {}, 'Mais opções do vídeo (nome de quem aparece, formato)'),
      h('div', { class: 'grid3', style: 'margin-top:10px' },
        field('Nome de quem aparece (opcional)', p.host?.name, (v) => ((p.host ??= { name: '' }).name = v)),
        field('Função (opcional)', p.host?.role, (v) => ((p.host ??= { name: '' }).role = v)),
        h('label', {}, 'Formato',
          (() => {
            const s = h('select', { onchange: () => { p.aspect = s.value; dirty(); } },
              h('option', { value: '9:16' }, '9:16 (vertical: TikTok, Reels)'), h('option', { value: '16:9' }, '16:9 (horizontal)'), h('option', { value: '1:1' }, '1:1 (quadrado)'));
            s.value = p.aspect ?? '9:16';
            return s;
          })()))),
  );

  const cards = p.scenes.map((s, i) => simpleScene(p, s, i, scenes[i]));
  const add = h('button', { onclick: () => {
    let n = p.scenes.length + 1;
    while (p.scenes.some((x) => x.id === `cena-${n}`)) n++;
    p.scenes.push({ id: `cena-${n}`, narration: 'Escreva aqui o que diz nesta cena.' });
    dirty();
    renderEditor();
  } }, '+ Adicionar cena');

  main.replaceChildren(h('div', { class: 'stack' }, head, ...cards, add, musicBlock(p), approvalSection(p), actionsBar()));
  window.scrollTo(0, scroll);
  loadPublication(files, p.id);
}

function simpleScene(p, s, i, st) {
  const hasFace = st?.kind === 'video';
  const list = (s.cutaways ??= []);
  const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  const est = h('span', { class: 'muted' }, `${words(s.narration)} palavras · ≈ ${Math.max(1, Math.round(words(s.narration) / 2.6))} s`);
  const status = h('span', { class: 'pill ' + (st?.recorded ? 'ok' : '') }, st?.recorded ? (hasFace ? '🎥 rosto e voz gravados' : '🎙 voz gravada') : 'voz sintética (ainda sem gravação)');

  // ② gravar
  const upload = async () => {
    const f = await pickFile('video/*,audio/*,.mov,.m4a,.mp4,.webm,.wav,.mp3');
    if (!f) return;
    const isVideo = f.type.startsWith('video/') || /\.(mp4|mov|m4v|mkv|avi|3gp)$/i.test(f.name) || (/\.webm$/i.test(f.name) && f.type.startsWith('video'));
    if (!(await flushBeforeUpload())) return;
    try {
      await uploadTo(isVideo ? 'presenter' : 'voice', s.id, f, isVideo ? 'Vídeo' : 'Áudio');
      await refresh();
    } catch (e) { toast('Erro: ' + e.message, 6000); }
  };
  const rec = h('div', { class: 'zone' },
    h('b', {}, '② Gravar (opcional)'),
    h('p', { class: 'muted', style: 'margin:2px 0 8px' }, 'Grave com o texto no ecrã, ou carregue um vídeo/áudio já gravado. Sem gravação, a cena usa voz sintética.'),
    h('div', { class: 'rec-row' },
      h('button', { class: 'primary', onclick: () => openPhone(state.id) }, '📱 Gravar no telemóvel'),
      h('button', { onclick: upload }, 'Carregar vídeo ou áudio'),
      h('button', { onclick: () => openPrompter(s) }, 'Teleprompter (no PC)'),
      st?.recorded && h('button', { class: 'danger', onclick: () => delRec(s.id) }, 'Apagar gravação')),
    st?.recorded && h('div', { style: 'margin-top:8px' },
      hasFace
        ? h('video', { controls: true, src: `/api/projects/${p.id}/voice/${s.id}?t=${Date.now()}`, style: 'height:110px;border-radius:8px' })
        : h('audio', { controls: true, src: `/api/projects/${p.id}/voice/${s.id}?t=${Date.now()}`, style: 'height:36px;width:100%' }),
      h('div', { class: 'muted', style: 'font-size:13px' }, `guardado no PC: ${st.file}`)),
  );

  // ③ cenários
  const move = (k, d) => { const j = k + d; if (j < 0 || j >= list.length) return; [list[k], list[j]] = [list[j], list[k]]; dirty(); renderEditor(); };
  const customTimes = list.some((c) => c.at !== undefined);
  const hint = list.length === 0
    ? (hasFace ? 'Sem cenário, o seu rosto ocupa o ecrã (com o fundo de onde gravou). Junte cenários para mudar o fundo: o rosto passa a uma bolha.' : 'Sem cenário, a cena fica só com o texto. Junte imagens ou vídeos.')
    : `${list.length} cenário(s). ${customTimes ? 'Com tempos definidos à mão (JSON avançado).' : 'A cena é dividida em partes iguais, pela ordem em que estão.'} ${hasFace ? 'O seu rosto aparece numa bolha por cima.' : ''}`;
  const scenery = h('div', { class: 'zone' },
    h('b', {}, '③ Cenários (o que se vê)'),
    h('p', { class: 'muted', style: 'margin:2px 0 8px' }, hint),
    list.length > 0 && h('div', { class: 'gallery' }, ...list.map((c, k) =>
      h('div', { class: 'cen' }, thumb(c.media, 96),
        h('div', { class: 'row', style: 'gap:4px;margin-top:4px' },
          h('button', { disabled: k === 0, onclick: () => move(k, -1), title: 'Para a frente' }, '◀'),
          h('button', { disabled: k === list.length - 1, onclick: () => move(k, 1), title: 'Para trás' }, '▶'),
          h('button', { class: 'danger', onclick: () => { list.splice(k, 1); dirty(); renderEditor(); }, title: 'Tirar' }, '✕'))))),
    h('div', { class: 'rec-row' },
      h('button', { onclick: async () => {
        const f = await pickFile('image/*,video/*');
        if (!f) return;
        try { const r = await uploadTo('media', s.id, f, 'Cenário'); list.push({ media: r.path }); dirty(); renderEditor(); } catch (e) { toast('Erro: ' + e.message, 6000); }
      } }, '+ Carregar imagem ou vídeo'),
      h('button', { onclick: () => openPexels(s.id, (path) => { (curScene(s.id).cutaways ??= []).push({ media: path }); dirty(); renderEditor(); }) }, '+ Procurar no Pexels (paisagens, animais…)')),
  );

  return h('section', { class: 'card scene' },
    h('header', {},
      h('span', { class: 'no' }, String(i + 1).padStart(2, '0')),
      h('b', {}, s.id), status, est,
      p.scenes.length > 1 && h('button', { class: 'danger', style: 'margin-left:auto;padding:2px 10px', onclick: () => { if (!confirm(`Remover a cena "${s.id}"?`)) return; p.scenes.splice(i, 1); dirty(); renderEditor(); } }, 'Remover cena')),
    field('① O que diz (texto)', s.narration, (v) => (s.narration = v), { area: true, rows: 3, after: () => (est.textContent = `${words(s.narration)} palavras · ≈ ${Math.max(1, Math.round(words(s.narration) / 2.6))} s`) }),
    rec,
    scenery,
    h('details', {},
      h('summary', {}, 'Mais opções desta cena (local, nota)'),
      h('div', { class: 'grid2', style: 'margin-top:10px' },
        field('Local mostrado (só locais verdadeiros)', s.location, (v) => (s.location = v || undefined)),
        field('Nota para si (plano, o que mostrar)', s.shot, (v) => (s.shot = v || undefined)))),
  );
}
