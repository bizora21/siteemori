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
    h('button', { disabled: !canUndo(), title: 'Desfazer a última alteração (Ctrl+Z)', onclick: () => histGo(-1) }, '↶ Desfazer'),
    h('button', { disabled: !canRedo(), title: 'Refazer (Ctrl+Y)', onclick: () => histGo(1) }, '↷ Refazer'),
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

// ── acabamento: filtro de cor, transição, legendas, vinheta, grão, som ─────
// Os mesmos filtros da composição, para ver o efeito já nas miniaturas (sem esperar pelo rascunho).
const LOOK_CSS = {
  natural: 'none',
  cinema: 'sepia(0.22) hue-rotate(-10deg) contrast(1.22) saturate(0.88) brightness(0.94)',
  quente: 'sepia(0.32) saturate(1.3) brightness(1.04) hue-rotate(-10deg)',
  frio: 'saturate(0.9) hue-rotate(18deg) brightness(1.02) contrast(1.12)',
  vivo: 'saturate(1.5) contrast(1.15)',
  suave: 'contrast(0.9) saturate(0.85) brightness(1.08)',
};

// ── treinador de qualidade: o que falta para o vídeo ficar profissional ─────
function qualityCard() {
  const q = state.data.quality;
  if (!q || !q.items) return null;
  const color = q.score >= 90 ? 'ok' : q.score >= 75 ? 'warn' : 'bad';
  const icon = { falta: '⛔', melhorar: '⚠️', ok: '✅' };
  return h('section', { class: 'card stack' },
    h('div', { class: 'row' },
      h('h3', { style: 'margin:0;flex:1' }, 'Qualidade do vídeo'),
      h('span', { class: 'pill ' + color, style: 'font-size:15px;padding:3px 12px' }, q.score + '% · ' + q.verdict),
      h('span', { class: 'muted' }, '~' + q.seconds + ' s')),
    h('div', { style: 'height:8px;border-radius:6px;background:var(--line);overflow:hidden' },
      h('div', { style: 'height:100%;width:' + q.score + '%;background:var(--' + color + ')' })),
    h('ul', { class: 'issues' }, ...q.items.map((x) =>
      h('li', {}, icon[x.level] + ' ' + x.text, x.how && h('div', { class: 'muted', style: 'margin-left:22px' }, '→ ' + x.how)))));
}

const FINISH_LOOKS = [['natural', 'Natural'], ['cinema', 'Cinema'], ['quente', 'Quente'], ['frio', 'Frio'], ['vivo', 'Vivo'], ['suave', 'Suave']];
const FINISH_TRANS = [['fade', 'Fundido'], ['deslizar', 'Deslizar'], ['zoom', 'Zoom'], ['cortina', 'Cortina']];
const FINISH_CAPS = [['karaoke', 'Karaokê'], ['limpo', 'Limpo (caixa)'], ['destaque', 'Destaque']];

function finishBlock(p) {
  if (p.template !== 'reportagem') return null;
  const pro = () => { p.style = { look: 'cinema', transition: 'zoom', captionStyle: 'destaque', vignette: true, grain: false }; p.audio = undefined; dirty(); renderEditor(); toast('Aspeto profissional aplicado: veja no rascunho.'); };
  const st = p.style ?? {};
  const set = (k, v) => { p.style = { ...(p.style ?? {}), [k]: v }; dirty(); renderEditor(); };
  const pick = (label, key, opts, def) => h('label', { class: 'ver-sel' }, label,
    (() => {
      const s = h('select', { onchange: () => set(key, s.value) }, ...opts.map(([v, t]) => h('option', { value: v }, t)));
      s.value = st[key] ?? def;
      return s;
    })());
  const chk = (label, key, title) => h('label', { class: 'ver-sel', title },
    h('input', { type: 'checkbox', checked: Boolean(st[key]), onchange: (e) => set(key, e.target.checked) }), label);
  const au = p.audio ?? {};
  const setAu = (k, v) => { p.audio = { ...(p.audio ?? {}), [k]: v }; dirty(); renderEditor(); };
  return h('details', { class: 'card', open: Boolean(p.style || p.audio) },
    h('summary', {}, '✨ Acabamento (aspeto profissional)'),
    h('p', { class: 'muted' }, 'Tudo opcional e leve para o computador. O efeito de cor já se vê nas miniaturas dos cenários; o resto, no rascunho.'),
    h('div', { class: 'actions' }, h('button', { class: 'primary', onclick: pro }, '✨ Aspeto profissional (um clique)'), h('button', { onclick: () => { p.style = undefined; dirty(); renderEditor(); } }, 'Sem efeitos')),
    h('div', { class: 'actions' },
      pick('Cor:', 'look', FINISH_LOOKS, 'natural'),
      pick('Transição:', 'transition', FINISH_TRANS, 'fade'),
      pick('Legendas:', 'captionStyle', FINISH_CAPS, 'karaoke')),
    h('div', { class: 'actions' },
      chk('Vinheta', 'vignette', 'Escurece suavemente os cantos, como no cinema.'),
      chk('Grão de filme', 'grain', 'Textura fina que dá aspeto de cinema.'),
      h('label', { class: 'ver-sel', title: 'Nivela o volume para o padrão das redes (−14 LUFS) e limpa a voz.' },
        h('input', { type: 'checkbox', checked: au.master !== false, onchange: (e) => setAu('master', e.target.checked ? undefined : false) }), 'Som masterizado'),
      h('label', { class: 'ver-sel', title: 'A música baixa enquanto se fala e sobe nas pausas.' },
        h('input', { type: 'checkbox', checked: au.ducking !== false, onchange: (e) => setAu('ducking', e.target.checked ? undefined : false) }), 'Música baixa quando falo')),
  );
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

/** "Mais opções do vídeo": a minha foto, evento a promover, voz, nome, formato. Usado na página em lista e no editor. */
function moreOptionsBlock(p, open = false) {
  return (
    h('details', open ? { open: true } : {},
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
          })())))
  );
}

// ── a página simples do vídeo personalizado ───────────────────────────────
function renderSimple() {
  const { project: p, brand, issues, scenes, files } = state.data;
  if (p.template === 'reportagem' && typeof renderVideoEditor === 'function' && !edListMode()) return renderVideoEditor();
  const main = $('#main');
  const scroll = window.scrollY;

  const head = h('section', { class: 'card stack' },
    h('div', { class: 'row' },
      h('h2', { style: 'margin:0;flex:1' }, p.title),
      p.template === 'reportagem' && h('button', { class: 'primary', onclick: () => edSetMode('editor') }, '🎞 Abrir o editor com linha do tempo'),
      h('span', { class: 'pill' }, 'Vídeo personalizado'),
      h('span', { class: 'pill' }, `marca: ${brand?.name ?? p.brand}`)),
    field('Título', p.title, (v) => (p.title = v)),
    h('p', { class: 'muted', style: 'margin:0' }, 'Em cada cena: ① escreva o que diz, ② grave (opcional), ③ escolha os cenários que aparecem. No fim, ouça, veja o rascunho e aprove.'),
    h('ul', { class: 'issues', id: 'issues' }, issueItems(issues)),
    // Formato e imagens: as duas escolhas que mais mudam o resultado, sempre à vista.
    h('div', { class: 'zone' },
      h('b', {}, 'Formato do vídeo'),
      h('div', { class: 'row', style: 'gap:8px;margin:6px 0 10px' },
        ...[['9:16', '📱 Vertical 9:16 (TikTok, Reels, Status)'], ['16:9', '🖥 Horizontal 16:9 (YouTube)'], ['1:1', '⬜ Quadrado 1:1']].map(([v, t]) =>
          h('button', { class: 'chip' + ((p.aspect ?? '9:16') === v ? ' on' : ''), onclick: () => { p.aspect = v; dirty(); renderEditor(); } }, t))),
      h('b', {}, 'Imagens dos cenários'),
      h('div', { class: 'row', style: 'gap:8px;margin:6px 0 0' },
        ...[['cover', '🖼 Preencher o ecrã (pode cortar as bordas)'], ['contain', '🔲 Inteiras (nunca cortar: ideal para cartazes)']].map(([v, t]) =>
          h('button', { class: 'chip' + ((p.imageFit ?? 'cover') === v ? ' on' : ''), onclick: () => { p.imageFit = v === 'cover' ? undefined : v; dirty(); renderEditor(); } }, t)))),
    moreOptionsBlock(p),
  );

  const cards = p.scenes.map((s, i) => simpleScene(p, s, i, scenes[i]));
  const add = h('button', { onclick: () => {
    let n = p.scenes.length + 1;
    while (p.scenes.some((x) => x.id === `cena-${n}`)) n++;
    p.scenes.push({ id: `cena-${n}`, narration: 'Escreva aqui o que diz nesta cena.' });
    dirty();
    renderEditor();
  } }, '+ Adicionar cena');

  main.replaceChildren(h('div', { class: 'stack' }, head, qualityCard(), (typeof timelineBlock === 'function' ? timelineBlock(p) : null), ...cards, add, musicBlock(p), finishBlock(p), approvalSection(p), actionsBar()));
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
  const anchored = list.some((c) => c.atWord !== undefined);
  const hint = list.length === 0
    ? (hasFace ? 'Sem cenário, o seu rosto ocupa o ecrã (com o fundo de onde gravou). Junte cenários para mudar o fundo: o rosto passa a uma bolha.' : 'Sem cenário, a cena fica só com o texto. Junte imagens ou vídeos.')
    : `${list.length} cenário(s). ${anchored ? 'Cada cenário entra na palavra que escolheu (⏱) e fica até entrar o seguinte; os sem palavra entram no início.' : customTimes ? 'Com tempos definidos à mão (JSON avançado).' : 'Sem escolha, a cena é dividida em partes iguais, pela ordem em que estão. Carregue em ⏱ para o cenário entrar numa palavra à sua escolha.'} ${list.some((c) => c.fit === 'contain') ? 'Os cartazes aparecem inteiros e o rosto desce para não os tapar. ' : 'Imagens com texto (cartazes)? Marque "Cartaz (inteira)" para não serem cortadas. '}${hasFace ? 'O seu rosto aparece numa bolha por cima.' : ''}`;
  const scenery = h('div', { class: 'zone' },
    h('b', {}, '③ Cenários (o que se vê)'),
    h('p', { class: 'muted', style: 'margin:2px 0 8px' }, hint),
    list.length > 0 && h('div', { class: 'gallery' }, ...list.map((c, k) =>
      h('div', { class: 'cen' }, (() => { const t = thumb(c.media, 96); t.style.filter = LOOK_CSS[p.style?.look ?? 'natural'] ?? 'none'; return t; })(),
        h('button', { class: 'when', title: 'Escolha a palavra do texto em que este cenário aparece', onclick: () => pickWord(s, c) },
          c.atWord !== undefined ? `⏱ Entra em «${(s.narration.trim().split(/\s+/)[c.atWord] ?? '?').replace(/[.,;:!?]+$/, '')}»` : '⏱ Quando entra? (automático)'),
        isVideoPath(c.media) && h('label', { class: 'fit-opt', title: 'Se só quer uma parte do vídeo: segundo do ficheiro em que começa' },
          'Começa aos ', h('input', { type: 'number', min: 0, step: 0.5, value: c.startFrom ?? 0, style: 'width:62px', oninput: (e) => { c.startFrom = Number(e.target.value) || undefined; dirty(); } }), ' s'),
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

  // Tipo de cena: narrada (texto + voz + cenários) ou cena real (o vídeo com o som dele)
  const isClip = s.kind === 'clip';
  const setType = (clip) => {
    if (isClip === clip) return;
    if (clip) {
      const loses = (s.narration.trim() && !/Escreva aqui/.test(s.narration)) || list.length;
      if (loses && !confirm('Passar a "cena real" tira o texto e os cenários desta cena (o vídeo traz o seu próprio som). Continuar?')) return;
      s.kind = 'clip';
      s.narration = '';
      s.cutaways = [];
      s.media = undefined;
    } else {
      s.kind = undefined;
      if (!s.narration) s.narration = 'Escreva aqui o que diz nesta cena.';
    }
    dirty();
    renderEditor();
  };
  const typeBar = h('div', { class: 'row', style: 'gap:6px;margin:2px 0' },
    h('span', { class: 'muted' }, 'Tipo de cena:'),
    h('button', { class: 'chip' + (!isClip ? ' on' : ''), title: 'Escreve o texto e eu narro (a minha voz gravada, ou a sintética), com cenários por baixo', onclick: () => setType(false) }, '🎙 Narrada'),
    h('button', { class: 'chip' + (isClip ? ' on' : ''), title: 'Um vídeo real, com o som original dele (multidão, ambiente, uma entrevista). Sem narração nem legendas', onclick: () => setType(true) }, '🎬 Cena real (som original)'));
  const clipCard = h('div', { class: 'zone' },
    h('b', {}, '🎬 Cena real (com o som dela)'),
    h('p', { class: 'muted', style: 'margin:2px 0 8px' }, 'O vídeo entra no vídeo final com o seu som original (multidão, ambiente, alguém a falar). Não leva narração nem legendas; só se acerta o volume.'),
    h('div', { class: 'rec-row' },
      h('button', { class: 'primary', onclick: () => uploadScene('presenter', s.id, 'video/*', 'Vídeo') }, st?.recorded ? 'Trocar o vídeo' : 'Carregar o vídeo da cena real'),
      st?.recorded && h('button', { class: 'danger', onclick: () => delRec(s.id) }, 'Apagar o vídeo')),
    st?.recorded
      ? h('div', { style: 'margin-top:8px' }, h('video', { controls: true, src: `/api/projects/${p.id}/voice/${s.id}?t=${Date.now()}`, style: 'height:190px;border-radius:8px' }), h('div', { class: 'muted', style: 'font-size:13px' }, `guardado no PC: ${st.file}`))
      : h('p', { style: 'color:var(--warn);margin:8px 0 0' }, '⚠ Falta o vídeo: sem ele esta cena fica 1,5 s em silêncio.'),
  );

  return h('section', { class: 'card scene', id: 'scene-' + i },
    h('header', {},
      h('span', { class: 'no' }, String(i + 1).padStart(2, '0')),
      h('b', {}, s.id), isClip ? h('span', { class: 'pill ok' }, '🎬 cena real') : status, !isClip && est,
      p.scenes.length > 1 && h('button', { class: 'danger', style: 'margin-left:auto;padding:2px 10px', onclick: () => { if (!confirm(`Remover a cena "${s.id}"?`)) return; p.scenes.splice(i, 1); dirty(); renderEditor(); } }, 'Remover cena')),
    typeBar,
    isClip ? clipCard : field('① O que diz (texto)', s.narration, (v) => (s.narration = v), { area: true, rows: 3, after: () => (est.textContent = `${words(s.narration)} palavras · ≈ ${Math.max(1, Math.round(words(s.narration) / 2.6))} s`) }),
    !isClip && rec,
    !isClip && scenery,
    h('details', {},
      h('summary', {}, 'Mais opções desta cena (assinatura, local, nota)'),
      // Assinatura: só aparece NESTA cena (ex.: onde o psicólogo fala). Em branco = não aparece nada.
      h('div', { class: 'zone', style: 'margin-top:10px' },
        h('b', {}, 'Assinatura nesta cena (opcional)'),
        h('p', { class: 'muted', style: 'margin:2px 0 8px' }, 'Para a cena em que aparece a falar: mostra o nome e a função só aqui, durante uns segundos. Deixe em branco nas outras cenas. Escreva só o que é verdade e o que quer mostrar (por exemplo o registo profissional).'),
        h('div', { class: 'grid3' },
          field('Nome', s.signature?.name, (v) => setSig(s, 'name', v)),
          field('Função (ex.: Psicólogo)', s.signature?.role, (v) => setSig(s, 'role', v)),
          field('Linha extra (ex.: Cédula n.º …)', s.signature?.extra, (v) => setSig(s, 'extra', v))),
        h('div', { class: 'grid3', style: 'margin-top:8px' },
          h('label', {}, 'Entra aos (s desde o início da cena)', h('input', { type: 'number', min: 0, step: 0.5, value: s.signature?.at ?? 0.3, oninput: (e) => { setSig(s, 'at', e.target.value === '' ? undefined : Number(e.target.value)); } })),
          h('label', {}, 'Fica (s)', h('input', { type: 'number', min: 1.5, step: 0.5, value: s.signature?.seconds ?? 5, oninput: (e) => { setSig(s, 'seconds', e.target.value === '' ? undefined : Number(e.target.value)); } })),
          p.host?.name && h('button', { style: 'align-self:end', onclick: () => { s.signature = { name: p.host.name, role: p.host.role || undefined }; dirty(); renderEditor(); } }, 'Preencher com "Quem aparece"'))),
      h('div', { class: 'grid2', style: 'margin-top:10px' },
        field('Local mostrado (só locais verdadeiros)', s.location, (v) => (s.location = v || undefined)),
        field('Nota para si (plano, o que mostrar)', s.shot, (v) => (s.shot = v || undefined)))),
  );
}

// ── "Quando entra?": escolher, no próprio texto, a palavra em que o cenário aparece ──
function pickWord(scene, c) {
  const dlg = $('#wordpick');
  const body = $('#wordpick-body');
  const tokens = scene.narration.trim().split(/\s+/).filter(Boolean);
  const choose = (idx) => {
    c.atWord = idx;
    dirty();
    dlg.close();
    renderEditor();
  };
  $('#wordpick-hint').textContent = 'Toque na palavra em que este cenário deve aparecer. Ele fica até o cenário seguinte entrar. Evite as últimas palavras: sobra pouco tempo.';
  body.replaceChildren(
    h('button', { class: 'wchip' + (c.atWord === undefined ? ' on' : ''), onclick: () => choose(undefined) }, 'Automático (partes iguais)'),
    ...tokens.map((t, k) => h('button', { class: 'wchip' + (c.atWord === k ? ' on' : ''), onclick: () => choose(k) }, t)),
  );
  dlg.showModal();
}

/** Altera um campo da assinatura da cena; se ficar tudo vazio, a assinatura deixa de existir. */
function setSig(scene, key, value) {
  const sig = (scene.signature ??= { name: '' });
  sig[key] = value === '' ? undefined : value;
  dirty();
  if (!sig.name && !sig.role && !sig.extra) scene.signature = undefined;
}
