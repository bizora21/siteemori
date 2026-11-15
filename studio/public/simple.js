'use strict';
// Interface simples do "vídeo personalizado" (reportagem) + aprovação, partilhada com os outros tipos.
// Carregado depois de app.js e media.js: usa state, h, $, api, field, dirty, save, refresh, build,
// followJob, loadPublication, issueItems, musicBlock, openPexels, openPrompter, openPhone, delRec,
// pickFile, uploadTo, flushBeforeUpload, thumb, curScene, toast.

// ── versões: o mesmo vídeo de várias maneiras (rosto, foto animada, só voz, horizontal) ──
state.version = state.version ?? '';
/** O estado (áudio, rascunho, final) da versão escolhida; '' = o projeto como está. */
function curStatus() {
  const st = state.data.status;
  return state.version && st.versions?.[state.version] ? st.versions[state.version] : st;
}
/** O identificador dos ficheiros gerados: <id> ou <id>--<versão>. */
const outIdOf = (p) => (state.version ? `${p.id}--${state.version}` : p.id);

// ── botões fixos em baixo: ouvir → ver → aprovar ──────────────────────────
function actionsBar() {
  const st = curStatus();
  const p = state.data.project;
  const versions = state.data.versions ?? [];
  const showVersions = p.template === 'reportagem' && versions.length > 0;
  const blockers = state.data.issues.filter((i) => i.level === 'error');
  const why = !st.draft.fresh ? 'Veja primeiro o rascunho' : blockers.length ? 'Corrija os avisos a vermelho (✗) no topo da página' : '';
  const approve = h('button', { class: 'primary', disabled: Boolean(why), title: why, onclick: approveFinal }, '✅ Aprovar e gerar o vídeo final');
  const select = showVersions && h('label', { class: 'ver-sel' }, 'Versão:',
    (() => {
      const s = h('select', { onchange: () => { state.version = s.value; renderEditor(); } },
        h('option', { value: '' }, 'Original (como está)'),
        ...versions.map((v) => h('option', { value: v.id }, v.label)));
      s.value = state.version;
      return s;
    })());
  const cap = h('label', { class: 'ver-sel', title: 'Liga ou desliga as legendas no vídeo. O ficheiro .srt continua a ser gerado.' },
    h('input', { type: 'checkbox', checked: p.captions !== false, onchange: (e) => { p.captions = e.target.checked ? undefined : false; dirty(); renderEditor(); } }), 'Legendas');
  return h('div', { class: 'actions' },
    h('button', { id: 'save-btn', onclick: save }, state.dirty ? 'Guardar *' : 'Guardar'),
    cap,
    select,
    h('button', { onclick: () => build({ noRender: true }) }, '🔊 Ouvir a voz'),
    h('button', { onclick: () => build({ draft: true }) }, '🎬 Ver rascunho'),
    approve,
    h('span', { class: 'muted', id: 'job-state' }, st.draft.exists && !st.draft.fresh ? 'O rascunho está desatualizado (mudou algo): gere-o de novo.' : st.draft.fresh && !st.final.fresh ? 'Rascunho pronto: veja-o e, se estiver bem, aprove.' : ''),
  );
}

async function approveFinal() {
  if (!curStatus().draft.fresh) return alert('Veja primeiro o rascunho (botão "Ver rascunho").');
  if (!confirm('Já ouviu a voz e viu o rascunho, e está tudo certo?\n\nVai gerar o vídeo FINAL em qualidade total.')) return;
  build({});
}

// ── secção: ouvir, ver e aprovar ──────────────────────────────────────────
function approvalSection(p) {
  const st = curStatus();
  const oid = outIdOf(p);
  const tpl = tplOf(p.template);
  const ver = (state.data.versions ?? []).find((v) => v.id === state.version);
  const aspect = ver?.aspect ?? p.aspect ?? (tpl?.aspect === '9:16' ? '9:16' : '16:9');
  const vertical = aspect === '9:16';
  const stale = (x) => x.exists && !x.fresh && h('p', { style: 'color:var(--warn);margin:4px 0;font-size:14px' }, '⚠ Desatualizado: mudou algo depois de gerar. Gere de novo.');
  const row = (n, title, hint, body) =>
    h('div', { class: 'step-row' },
      h('b', { class: 'n' }, n),
      h('div', { style: 'flex:1;min-width:0' }, h('b', {}, title), h('div', { class: 'muted', style: 'margin:2px 0 8px' }, hint), body));
  const none = (t) => h('span', { class: 'muted' }, t);

  // Resumo das versões: o que já foi gerado e aprovado de cada uma (clicar escolhe a versão)
  const chips = (state.data.versions ?? []).length && p.template === 'reportagem'
    ? h('div', { class: 'stack', style: 'gap:6px' },
      h('div', { class: 'muted' }, 'Versões deste vídeo (cada uma tem o seu rascunho e a sua aprovação):'),
      h('div', { class: 'row', style: 'gap:6px' },
        ...[{ id: '', label: 'Original' }, ...state.data.versions].map((v) => {
          const s = v.id ? state.data.status.versions?.[v.id] : state.data.status;
          const mark = s?.final.exists ? '✅' : s?.draft.exists ? '🎬' : '·';
          return h('button', { class: 'chip' + (v.id === state.version ? ' on' : ''), title: v.hint ?? '', onclick: () => { state.version = v.id; renderEditor(); } }, `${mark} ${v.label}`);
        })))
    : null;

  // Resultado do último trabalho: uma falha mostra-se aqui, com o motivo, e não só no registo
  const lj = state.data.lastJob;
  const banner = !lj ? null
    : lj.status === 'failed'
      ? h('div', { class: 'job-banner bad' }, h('b', {}, '✗ O último trabalho falhou (' + lj.label + ')'), h('div', {}, lj.error.replace(/^✗s*/, '')), h('div', { class: 'muted' }, 'Corrija o que a mensagem diz e carregue de novo no botão. Os rascunhos nunca são bloqueados por regras de conteúdo; se isto parece um erro do estúdio, diga-me a mensagem.'))
      : (lj.status === 'running' || lj.status === 'queued')
        ? h('div', { class: 'job-banner' }, '⏳ A gerar (' + lj.label + ')… pode demorar vários minutos nos vídeos 3D.')
        : lj.warnings.length
          ? h('div', { class: 'job-banner warn' }, h('b', {}, '✓ Gerou, com avisos (' + lj.label + '):'), ...lj.warnings.map((w) => h('div', {}, w.replace(/^s*⚠s*/, '⚠ '))))
          : null;

  return h('section', { class: 'card stack', id: 'approve' },
    h('h3', { style: 'margin:0' }, 'Ouvir, ver e aprovar' + (ver ? ` — ${ver.label}` : '')),
    banner,
    chips,
    ver && h('p', { class: 'muted', style: 'margin:0' }, ver.hint),
    ver?.faceMode === 'photo' && !p.avatar && h('p', { style: 'color:var(--warn);margin:0' }, '⚠ Esta versão precisa da sua foto: "Mais opções do vídeo" → "Carregar a minha foto".'),
    row(1, 'Ouvir a voz', 'Carregue em "🔊 Ouvir a voz" (leva segundos). Confirme a ordem das cenas, as pausas e se o que disse é o que está escrito.',
      st.audio.exists ? [stale(st.audio), h('audio', { controls: true, src: `/api/projects/${p.id}/audio?version=${state.version}&t=${Date.now()}`, style: 'width:100%' })] : none('Ainda não gerado.')),
    row(2, 'Ver o rascunho', 'Carregue em "🎬 Ver rascunho": o vídeo completo em baixa resolução, com cenários, legendas e música.',
      st.draft.exists ? [stale(st.draft), h('video', { controls: true, class: vertical ? 'vertical' : '', src: `/media/${oid}-rascunho.mp4?t=${Date.now()}` })] : none('Ainda não gerado.')),
    row(3, 'Aprovar', 'O botão "✅ Aprovar e gerar o vídeo final" só fica ativo depois de ver um rascunho atual. Gera o vídeo em qualidade total.',
      st.final.exists ? [stale(st.final), h('video', { controls: true, class: vertical ? 'vertical' : '', src: `/media/${oid}.mp4?t=${Date.now()}` })] : none('Ainda não gerado.')),
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
      h('summary', {}, 'Mais opções do vídeo (a minha foto, evento a promover, nome, formato)'),
      h('div', { class: 'zone', style: 'margin-top:10px' },
        h('b', {}, 'A minha foto (para a versão "Foto animada pela voz")'),
        h('p', { class: 'muted', style: 'margin:2px 0 8px' }, 'Uma foto sua, de frente, com o rosto bem visível. A foto não é enviada para lado nenhum: fica só neste computador e não é guardada no Git.'),
        h('div', { class: 'rec-row' },
          p.avatar && h('img', { id: 'avatar-prev', src: `/api/projects/${p.id}/file?p=${encodeURIComponent(p.avatar)}&t=${Date.now()}`, style: `height:110px;width:110px;border-radius:50%;object-fit:cover;object-position:50% ${p.avatarFocus?.y ?? 12}%;transform:scale(1);border:2px solid var(--accent)` }),
          h('button', { onclick: async () => {
            const f = await pickFile('image/jpeg,image/png,image/webp');
            if (!f) return;
            if (!(await flushBeforeUpload())) return;
            try { await uploadTo('avatar', undefined, f, 'Foto'); await refresh(); } catch (e) { toast('Erro: ' + e.message, 6000); }
          } }, p.avatar ? 'Trocar a minha foto' : 'Carregar a minha foto')),
        // Enquadramento: a cara tem de ficar dentro do círculo
        p.avatar && h('div', { class: 'grid2', style: 'margin-top:10px' },
          h('label', {}, 'Posição da foto (topo ↔ fundo): a cara tem de ficar no círculo',
            h('input', { type: 'range', min: 0, max: 100, value: p.avatarFocus?.y ?? 12, oninput: (e) => {
              (p.avatarFocus ??= {}).y = Number(e.target.value);
              const img = $('#avatar-prev'); if (img) img.style.objectPosition = `50% ${e.target.value}%`;
              dirty();
            } })),
          h('label', {}, 'Aproximar',
            h('input', { type: 'range', min: 100, max: 300, value: Math.round((p.avatarFocus?.zoom ?? 1) * 100), oninput: (e) => {
              (p.avatarFocus ??= {}).zoom = Number(e.target.value) / 100;
              const img = $('#avatar-prev'); if (img) { img.style.transformOrigin = `50% ${p.avatarFocus.y ?? 25}%`; img.style.transform = `scale(${Number(e.target.value) / 100})`; }
              dirty();
            } })))),
      h('div', { class: 'zone', style: 'margin-top:10px' },
        h('b', {}, 'Evento a promover (opcional)'),
        h('p', { class: 'muted', style: 'margin:2px 0 8px' }, 'Marcha, campanha, formação… No fim do vídeo aparece um cartão com estes dados. Escreva só o que é certo (data, hora e local confirmados).'),
        h('div', { class: 'grid3' },
          field('Título do evento', p.event?.title, (v) => ((p.event ??= { title: '' }).title = v)),
          field('Data', p.event?.date, (v) => ((p.event ??= { title: '' }).date = v || undefined)),
          field('Hora', p.event?.time, (v) => ((p.event ??= { title: '' }).time = v || undefined)),
          field('Local', p.event?.place, (v) => ((p.event ??= { title: '' }).place = v || undefined)),
          field('Contacto', p.event?.contact, (v) => ((p.event ??= { title: '' }).contact = v || undefined)),
          field('Nota (ex.: Entrada livre)', p.event?.note, (v) => ((p.event ??= { title: '' }).note = v || undefined)))),
      h('div', { class: 'grid2', style: 'margin-top:10px' },
        h('label', {}, 'Origem da voz',
          (() => {
            const s = h('select', { onchange: () => { (p.voice ??= {}).mode = s.value; dirty(); } },
              h('option', { value: 'auto' }, 'Automático (gravada onde existir, senão sintética)'),
              h('option', { value: 'human' }, 'Preferir voz humana (cenas sem gravação usam sintética)'),
              h('option', { value: 'human-only' }, 'Só voz humana (exige todas as cenas gravadas)'),
              h('option', { value: 'synthetic' }, 'Só sintética'));
            s.value = p.voice?.mode ?? 'auto';
            return s;
          })())),
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
  loadPublication(files, outIdOf(p));
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
    : `${list.length} cenário(s). ${customTimes ? 'Com tempos definidos à mão (JSON avançado).' : 'A cena é dividida em partes iguais, pela ordem em que estão.'} ${list.some((c) => c.fit === 'contain') ? 'Os cartazes aparecem inteiros e o rosto desce para não os tapar. ' : 'Imagens com texto (cartazes)? Marque "Cartaz (inteira)" para não serem cortadas. '}${hasFace ? 'O seu rosto aparece numa bolha por cima.' : ''}`;
  const scenery = h('div', { class: 'zone' },
    h('b', {}, '③ Cenários (o que se vê)'),
    h('p', { class: 'muted', style: 'margin:2px 0 8px' }, hint),
    list.length > 0 && h('div', { class: 'gallery' }, ...list.map((c, k) =>
      h('div', { class: 'cen' }, thumb(c.media, 96),
        h('label', { class: 'fit-opt', title: 'Mostra a imagem INTEIRA, sem cortar nem fazer zoom. Use em cartazes e imagens com texto.' },
          h('input', { type: 'checkbox', checked: c.fit === 'contain', onchange: (e) => { c.fit = e.target.checked ? 'contain' : undefined; dirty(); } }), ' Cartaz (inteira)'),
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
