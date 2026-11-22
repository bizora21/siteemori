'use strict';

// ── utilitários ───────────────────────────────────────────────────────────
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
    if (kid === false || kid === true || kid == null) continue; // `cond && elemento` não deve escrever "false"
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
};

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: opts.body && typeof opts.body === 'string' ? { 'Content-Type': 'application/json' } : undefined });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text();
  if (!r.ok) {
    const e = new Error(data?.error || (data?.issues && data.issues.map((i) => i.message).join('; ')) || r.statusText);
    e.data = data;
    throw e;
  }
  return data;
}

const state = { templates: [], brands: [], projects: [], id: null, data: null, dirty: false, rec: null, jobId: null };
const tplOf = (id) => state.templates.find((t) => t.id === id);
const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);

// ── lista de projetos ─────────────────────────────────────────────────────
async function loadState() {
  const s = await api('/api/state');
  Object.assign(state, s);
  renderList();
}

function renderList() {
  const list = $('#list');
  list.replaceChildren(
    ...state.projects.map((p) =>
      h('button', { class: 'card item' + (p.id === state.id ? ' active' : ''), onclick: () => openProject(p.id) },
        h('b', {}, p.title),
        h('small', {}, `${tplOf(p.template)?.label ?? p.template} · ${p.brand}`),
        h('div', { class: 'badges' },
          h('span', { class: 'pill ' + (p.recorded === p.scenes ? 'ok' : p.recorded ? 'warn' : '') }, `voz humana ${p.recorded}/${p.scenes}`),
          p.hasDraft && h('span', { class: 'pill' }, 'rascunho'),
          p.hasFinal && h('span', { class: 'pill ok' }, 'final'),
        ),
      ),
    ),
  );
}

// ── novo projeto ──────────────────────────────────────────────────────────
$('#new-btn').addEventListener('click', () => {
  const f = $('#new-form');
  f.brand.replaceChildren(...state.brands.map((b) => h('option', { value: b.id }, `${b.name} (${b.locale})`)));
  const order = [...state.templates].sort((a, b) => (b.id === 'reportagem') - (a.id === 'reportagem'));
  f.template.replaceChildren(...order.map((t) => h('option', { value: t.id }, t.id === 'reportagem' ? 'Vídeo personalizado (recomendado): você, voz e cenários à sua escolha' : t.label)));
  const hint = () => {
    const t = tplOf(f.template.value);
    $('#tpl-hint').textContent = t.id === 'reportagem' ? 'Qualquer número de cenas. Escolhe os cenários de cada cena (paisagens, animais, locais); o rosto, se gravar, aparece numa bolha.' : t.scenes ? `Cenas fixas (${t.scenes}): ${t.sceneRoles.join(' → ')}.` : t.kind === '2d' ? 'Qualquer número de cenas; pode ter imagem, vídeo ou apresentador por cena.' : 'Narração contínua.';
  };
  f.template.onchange = hint;
  hint();
  $('#new-dialog').showModal();
});
$('#new-form').addEventListener('submit', async (ev) => {
  if (ev.submitter?.value !== 'ok') return;
  const f = ev.target;
  try {
    const r = await api('/api/projects', { method: 'POST', body: JSON.stringify({ id: f.id.value, title: f.title.value, brand: f.brand.value, template: f.template.value }) });
    await loadState();
    openProject(r.id);
    f.reset();
  } catch (e) {
    alert(e.message);
  }
});

// ── editor ────────────────────────────────────────────────────────────────
async function openProject(id) {
  if (state.dirty && !confirm('Há alterações por guardar. Descartar?')) return;
  stopRec();
  state.id = id;
  state.version = '';
  state.dirty = false;
  state.data = await api(`/api/projects/${id}`);
  renderList();
  renderEditor();
}

async function refresh() {
  state.data = await api(`/api/projects/${state.id}`);
  await loadState();
  renderEditor();
}

const dirty = () => {
  state.dirty = true;
  const b = $('#save-btn');
  if (b) b.textContent = 'Guardar *';
  histPush();
  if (typeof autoPlan === 'function') autoPlan();
};

// ── desfazer / refazer: guarda "fotografias" do projeto a cada alteração ──
const HIST = { id: null, stack: [], i: -1, t: 0 };

function histSync() {
  const p = state.data?.project;
  if (!p) return;
  const j = JSON.stringify(p);
  if (HIST.id !== state.id) { HIST.id = state.id; HIST.stack = [j]; HIST.i = 0; return; }
  // alterações vindas de fora (ex.: depois de carregar um ficheiro) também entram no histórico
  if (HIST.stack[HIST.i] !== j && !state.dirty) { HIST.stack = HIST.stack.slice(0, HIST.i + 1); HIST.stack.push(j); HIST.i++; }
}

function histPush() {
  const p = state.data?.project;
  if (!p || HIST.id !== state.id) return;
  const j = JSON.stringify(p);
  if (j === HIST.stack[HIST.i]) return;
  const now = Date.now();
  // escrever ou arrastar um cursor gera muitas alterações seguidas: contam como uma só
  if (HIST.i > 0 && now - HIST.t < 700) HIST.stack[HIST.i] = j;
  else { HIST.stack = HIST.stack.slice(0, HIST.i + 1); HIST.stack.push(j); HIST.i++; if (HIST.stack.length > 80) { HIST.stack.shift(); HIST.i--; } }
  HIST.t = now;
}

const canUndo = () => HIST.id === state.id && HIST.i > 0;
const canRedo = () => HIST.id === state.id && HIST.i < HIST.stack.length - 1;

function histGo(d) {
  const k = HIST.i + d;
  if (HIST.id !== state.id || k < 0 || k >= HIST.stack.length) return toast(d < 0 ? 'Não há mais nada para desfazer.' : 'Não há nada para refazer.');
  HIST.i = k;
  HIST.t = 0;
  state.data.project = JSON.parse(HIST.stack[k]);
  state.dirty = true;
  if (typeof ED !== 'undefined') ED.sel = null;
  renderEditor();
  toast(d < 0 ? '↶ Desfeito' : '↷ Refeito');
}

document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return; // ali o Ctrl+Z é do próprio campo
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); histGo(-1); }
  else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); histGo(1); }
});

function field(label, value, onInput, opts = {}) {
  const input = opts.area ? h('textarea', { rows: opts.rows ?? 3 }) : h('input', { type: 'text' });
  input.value = value ?? '';
  input.addEventListener('input', () => {
    onInput(input.value);
    dirty();
    opts.after?.(input.value);
  });
  return h('label', {}, label, input);
}

function renderEditor() {
  histSync();
  document.body.classList.remove('ed-full', 'ws-full');
  const { project: p, brand, issues, scenes, files } = state.data;
  if (p.template === 'reportagem') return renderSimple();
  const tpl = tplOf(p.template);
  const main = $('#main');
  const scroll = window.scrollY;

  const inst = p.template === 'institucional';
  const rep = p.template === 'reportagem';
  const head = h('section', { class: 'card stack' },
    h('div', { class: 'row' },
      h('h2', { style: 'margin:0;flex:1' }, p.title),
      h('span', { class: 'pill' }, tpl?.label ?? p.template),
      h('span', { class: 'pill' }, `marca: ${brand?.name ?? p.brand}`),
      tpl?.kind === '3d' && h('span', { class: 'pill warn' }, '3D · render pesado'),
    ),
    h('div', { class: 'grid2' },
      field('Título', p.title, (v) => (p.title = v)),
      h('label', {}, 'Origem da voz',
        (() => {
          const s = h('select', { onchange: () => { (p.voice ??= {}).mode = s.value; dirty(); } },
            h('option', { value: 'auto' }, 'Automático (gravada onde existir, senão sintética)'),
            h('option', { value: 'human' }, 'Preferir voz humana (cenas sem gravação usam sintética)'),
            h('option', { value: 'human-only' }, 'Só voz humana (exige todas as cenas gravadas)'),
            h('option', { value: 'synthetic' }, 'Só sintética'));
          s.value = p.voice?.mode ?? 'auto';
          return s;
        })()),
      h('div', {}, h('button', { class: 'primary', title: 'Ouvir e escolher a voz sintética', onclick: () => edDialog('voice') }, '🗣 Escolher a voz sintética'), h('div', { class: 'muted', style: 'font-size:13px;margin-top:4px' }, p.voice?.name ? 'Escolhida: ' + p.voice.name : 'Agora: a voz da marca')),
    ),
    inst && h('div', { class: 'grid3' },
      field('Entidade (quem assina)', p.institutional?.entity, (v) => ((p.institutional ??= {}).entity = v)),
      field('Departamento', p.institutional?.department, (v) => ((p.institutional ??= {}).department = v)),
      field('Aviso legal (rodapé)', p.institutional?.disclaimer, (v) => ((p.institutional ??= {}).disclaimer = v)),
    ),
    rep && h('div', { class: 'grid3' },
      field('Quem aparece (nome)', p.host?.name, (v) => ((p.host ??= { name: '' }).name = v)),
      field('Função / descrição', p.host?.role, (v) => ((p.host ??= { name: '' }).role = v)),
      h('label', {}, 'Formato',
        (() => {
          const s = h('select', { onchange: () => { p.aspect = s.value; dirty(); } },
            h('option', { value: '9:16' }, '9:16 (vertical)'), h('option', { value: '16:9' }, '16:9 (horizontal)'), h('option', { value: '1:1' }, '1:1 (quadrado)'));
          s.value = p.aspect ?? '9:16';
          return s;
        })()),
    ),
    inst && h('div', { class: 'grid3' },
      h('label', {}, 'Formato',
        (() => {
          const s = h('select', { onchange: () => { p.aspect = s.value; dirty(); } },
            h('option', { value: '16:9' }, '16:9 (horizontal)'), h('option', { value: '9:16' }, '9:16 (vertical)'), h('option', { value: '1:1' }, '1:1 (quadrado)'));
          s.value = p.aspect ?? '16:9';
          return s;
        })()),
      field('Aprovado por', p.approval?.by, (v) => ((p.approval ??= { by: '', date: '' }).by = v)),
      field('Data / referência', p.approval?.date, (v) => ((p.approval ??= { by: '', date: '' }).date = v)),
    ),
    h('ul', { class: 'issues', id: 'issues' }, issueItems(issues)),
  );

  const sceneCards = p.scenes.map((s, i) => sceneCard(p, s, i, scenes[i], tpl, inst, rep));

  // Passo a passo: o que já está feito e onde fazer o resto
  const nRec = scenes.filter((x) => x.recorded).length;
  const nImg = p.scenes.filter((s) => s.media || s.cutaways?.length).length;
  const musicOk = Boolean(p.music?.license?.trim() && p.music?.source?.trim());
  const textOk = p.scenes.every((s) => s.narration && !/Escreva aqui/.test(s.narration));
  const mk = (ok, optional) => (ok ? '✅' : optional ? '➖' : '⬜');
  const li = (ok, title, hint, optional) => h('li', {}, h('b', {}, mk(ok, optional) + ' ' + title), h('div', { class: 'muted', style: 'margin:2px 0 8px 26px' }, hint));
  const stepsCard = h('section', { class: 'card' },
    h('h3', { style: 'margin:0 0 8px' }, 'Passo a passo'),
    h('ul', { style: 'list-style:none;margin:0;padding:0' },
      li(textOk, 'Texto das cenas', 'Edite o campo "Narração" de cada cena (também no telemóvel: ✎ Editar texto).'),
      li(nRec === p.scenes.length, `Gravar as cenas — ${nRec} de ${p.scenes.length}`, 'No telemóvel: botão 📱 Telemóvel (QR) → gravar → Enviar; chega sozinho aqui. No PC: "Carregar vídeo/áudio" em cada cena. Sem gravação, a cena usa voz sintética.'),
      (inst || rep) && li(nImg > 0, `Imagens do local — ${nImg} cena(s) com imagem`, 'Em cada cena: "Imagem ou vídeo desta cena" e, na reportagem, "Cortes" (carregar ficheiro ou Pexels). O telemóvel também envia fotos do local.', true),
      li(musicOk, 'Música (opcional)', 'Bloco "Música" mais abaixo: carregar o ficheiro e preencher licença e fonte. Sem música, o vídeo sai só com voz.', true),
      li(false, 'Gerar rascunho → ver → Gerar final', 'Botões no fundo da página. O rascunho é rápido e serve para rever; o final é o vídeo para publicar.'),
    ),
  );

  const adv = h('details', { class: 'card' },
    h('summary', {}, 'Avançado: JSON do projeto (props, cues, lead, tail, música)'),
    h('p', { class: 'muted' }, 'Aqui editas tudo o que não tem campo próprio. Cada cue liga uma prop 3D a uma palavra da voz.'),
    (() => {
      const ta = h('textarea', { rows: 14, style: 'font-family:ui-monospace,Consolas,monospace;font-size:12.5px' });
      ta.value = JSON.stringify(p, null, 2);
      return h('div', {}, ta, h('div', { class: 'row end', style: 'margin-top:8px' },
        h('button', { onclick: () => {
          try { state.data.project = JSON.parse(ta.value); dirty(); renderEditor(); } catch (e) { alert('JSON inválido: ' + e.message); }
        } }, 'Aplicar JSON')));
    })(),
  );

  if (typeof edBar === 'function') {
    document.body.classList.toggle('ws-full', !ED.showProjects);
    main.replaceChildren(h('div', { class: 'ws-app' }, edBar(p),
      h('div', { class: 'ws' },
        h('div', { class: 'ws-left stack' }, head, tpl?.kind === '3d' && personalizeBanner(p), stepsCard, ...sceneCards, !tpl?.scenes && h('button', { class: 'primary', onclick: () => { let n = p.scenes.length + 1; while (p.scenes.some((s) => s.id === `cena-${n}`)) n++; p.scenes.push({ id: `cena-${n}`, narration: 'Escreva aqui o que diz nesta cena.' }); dirty(); renderEditor(); } }, '+ Adicionar cena'), tpl?.scenes && h('p', { class: 'muted' }, `Este modelo tem sempre ${tpl.scenes} cenas (cada uma é um momento do vídeo 3D). Para um vídeo com o número de cenas que quiser, use o modelo "Reportagem pessoal".`), musicBlock(p), adv),
        h('div', { class: 'ws-right stack' }, approvalSection(p)))));
    window.scrollTo(0, scroll);
    loadPublication(files, p.id);
    edSyncDialog();
    return;
  }
  main.replaceChildren(h('div', { class: 'stack' }, head, tpl?.kind === '3d' && personalizeBanner(p), stepsCard, ...sceneCards, musicBlock(p), adv, approvalSection(p), actionsBar()));
  window.scrollTo(0, scroll);
  loadPublication(files, p.id);
}

function issueItems(issues) {
  if (!issues.length) return [h('li', { class: 'ok', style: 'color:var(--ok)' }, '✓ roteiro sem problemas')];
  return issues.map((i) => h('li', { class: i.level }, `${i.level === 'error' ? '✗' : '⚠'} ${i.scene ? `[${i.scene}] ` : ''}${i.message}${i.finalOnly ? ' — só bloqueia o vídeo final (o rascunho gera-se na mesma)' : ''}`));
}

function sceneCard(p, s, i, st, tpl, inst, rep) {
  const rich = inst || rep;
  const role = tpl?.sceneRoles?.[i];
  const est = h('span', { class: 'muted' }, `${words(s.narration)} palavras · ≈ ${Math.max(1, Math.round(words(s.narration) / 2.6))} s`);
  const status = h('span', { class: 'pill ' + (st?.recorded ? 'ok' : '') }, st?.recorded ? (st.kind === 'video' ? 'apresentador gravado' : 'voz humana gravada') : 'voz sintética');
  const meter = h('div', { class: 'meter', hidden: true }, h('i'));
  const preview = h('div');
  const recBtn = h('button', { onclick: () => toggleRec(s.id, 'audio', recBtn, meter, preview) }, '● Gravar voz');
  const vidBtn = h('button', { onclick: () => toggleRec(s.id, 'video', vidBtn, meter, preview) }, '🎥 Gravar com a câmara do computador');
  const row = h('div', { class: 'rec-row' }, recBtn, meter,
    h('button', { onclick: () => openPrompter(s) }, 'Teleprompter'),
    h('button', { onclick: () => uploadScene('voice', s.id, 'audio/*,.m4a,.wav,.mp3,.aac,.ogg,.flac', 'Áudio') }, 'Carregar áudio'),
    rich && vidBtn,
    rich && h('button', { onclick: () => uploadScene('presenter', s.id, 'video/*', 'Vídeo') }, 'Carregar vídeo (telemóvel)'),
    st?.recorded && st.kind === 'audio' && h('audio', { controls: true, src: `/api/projects/${p.id}/voice/${s.id}?t=${Date.now()}`, style: 'height:34px' }),
    st?.recorded && st.kind === 'video' && h('video', { controls: true, src: `/api/projects/${p.id}/voice/${s.id}?t=${Date.now()}`, style: 'height:90px;border-radius:8px' }),
    st?.recorded && h('span', { class: 'muted', style: 'font-size:13px' }, `guardado no PC: ${st.file}`),
    st?.recorded && h('button', { class: 'danger', onclick: () => delRec(s.id) }, 'Apagar gravação'),
  );
  return h('section', { class: 'card scene' },
    h('header', {}, h('span', { class: 'no' }, String(i + 1).padStart(2, '0')), h('b', {}, s.id), role && h('span', { class: 'muted' }, `· ${role}`), status, est),
    field('Narração', s.narration, (v) => (s.narration = v), { area: true, rows: 3, after: () => (est.textContent = `${words(s.narration)} palavras · ≈ ${Math.max(1, Math.round(words(s.narration) / 2.6))} s`) }),
    inst && h('div', { class: 'grid2' },
      field('Título no ecrã', s.title, (v) => (s.title = v)),
      field('Fonte do dado (obrigatória se houver números)', s.source, (v) => (s.source = v)),
    ),
    rep && h('div', { class: 'grid2' },
      field('Local mostrado (só locais verdadeiros)', s.location, (v) => (s.location = v || undefined)),
      field('Título (só se a cena não tiver imagem/vídeo)', s.title, (v) => (s.title = v)),
    ),
    field('Nota de gravação: onde estar, que plano, o que mostrar nesta cena', s.shot, (v) => (s.shot = v || undefined), { area: true, rows: 2 }),
    rich && mediaBlock(p, s),
    rep && cutawaysBlock(p, s),
    row,
    preview,
  );
}

// ── guardar e gerar ───────────────────────────────────────────────────────
async function save(manual) {
  try {
    await api(`/api/projects/${state.id}`, { method: 'PUT', body: JSON.stringify(state.data.project) });
    state.dirty = false;
    await refresh();
    if (manual === true) toast('✓ Guardado. O vídeo já gerado não muda sozinho: carregue em 🎬 Ver rascunho para ver as alterações.', 7000);
    return true;
  } catch (e) {
    alert('Não foi possível guardar: ' + e.message);
    return false;
  }
}

async function build(opts) {
  const ph = state.data.project.scenes.map((s, i) => (/Escreva aqui/i.test(s.narration ?? '') ? i + 1 : 0)).filter(Boolean);
  if (ph.length && !confirm(`A cena ${ph.join(', ')} ainda tem o texto de exemplo ("Escreva aqui…"): a voz vai lê-lo.\n\nEscreva primeiro o que quer dizer.\n\nContinuar mesmo assim?`)) return;
  if (state.dirty && !(await save())) return;
  // Um rascunho nunca é bloqueado pelas regras de conteúdo; só o final.
  const finalRun = !opts.noRender && !opts.draft;
  if (state.data.issues.some((i) => i.level === 'error' && (!i.finalOnly || finalRun))) {
    if (!confirm('O roteiro tem erros (✗) e o build vai falhar. Continuar mesmo assim?')) return;
  }
  if (!opts.noRender && !opts.draft && !curStatus().draft.fresh) return alert('Veja primeiro o rascunho (botão "Ver rascunho"): o vídeo final só se gera a partir de um rascunho atual.');
  if (!opts.noRender && !opts.draft && tplOf(state.data.project.template)?.kind === '3d' && !confirm('Render final 3D: demora vários minutos nesta máquina. Continuar? (O rascunho é bem mais rápido.)')) return;
  try {
    const r = await api(`/api/projects/${state.id}/build`, { method: 'POST', body: JSON.stringify({ ...opts, version: state.version || undefined }) });
    const tot = state.data?.timing?.total;
    const mins = tot ? Math.max(1, Math.round((tot * (opts.draft ? 5.5 : opts.noRender ? 0.5 : 12)) / 60)) : 0;
    const est = !opts.noRender && mins ? `Neste computador leva cerca de ${mins} min.` : '';
    followJob(r.job, opts.noRender ? 'voz e tempos' : opts.draft ? 'rascunho' : 'vídeo final', est);
  } catch (e) {
    alert(e.message);
  }
}

// ── acompanhar um trabalho (voz, rascunho, final): painel flutuante que não se perde quando o editor se redesenha ──
const JOB = { id: 0, status: '', label: '', pct: 0, line: '', err: '', t0: 0, est: '' };
let jobTimer = 0;

function jobPaint() {
  let el = $('#job-float');
  if (!el) { el = h('div', { id: 'job-float', class: 'job-float' }); document.body.append(el); }
  if (!JOB.status) { el.hidden = true; return; }
  el.hidden = false;
  const running = JOB.status === 'queued' || JOB.status === 'running';
  const secs = Math.round((Date.now() - JOB.t0) / 1000);
  el.className = 'job-float ' + (JOB.status === 'failed' ? 'bad' : JOB.status === 'done' ? 'ok' : '');
  el.replaceChildren(...[
    h('div', { class: 'row', style: 'align-items:center;gap:8px' },
      h('b', { style: 'flex:1' }, JOB.status === 'queued' ? '⏳ Na fila: ' + JOB.label : running ? '⏳ A gerar: ' + JOB.label : JOB.status === 'done' ? '✓ Pronto: ' + JOB.label : '✗ Falhou: ' + JOB.label),
      !running && h('button', { title: 'Fechar', onclick: () => { JOB.status = ''; jobPaint(); } }, '✕')),
    running && h('div', { class: 'bar' }, h('i', { style: `width:${JOB.pct}%` })),
    running && h('div', { class: 'muted', style: 'font-size:13px' }, `${JOB.pct}% · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} decorridos${JOB.line ? ' · ' + JOB.line : ''}`),
    running && JOB.est && h('div', { class: 'muted', style: 'font-size:12px' }, JOB.est + ' Pode continuar a editar.'),
    !running && JOB.status === 'failed' && h('div', { style: 'font-size:13px;white-space:pre-wrap' }, JOB.err || 'Veja o motivo em ✅ Ver e publicar.'),
    !running && h('button', { class: 'primary', onclick: () => { JOB.status = ''; jobPaint(); if (typeof edDialog === 'function' && $('#ed-prev')) edDialog('publish'); } }, JOB.status === 'done' ? 'Ver o resultado' : 'Ver detalhes')].filter(Boolean));
}

function followJob(jobId, label = '', est = '') {
  Object.assign(JOB, { id: jobId, status: 'queued', label, pct: 0, line: '', err: '', t0: Date.now(), est });
  clearInterval(jobTimer);
  jobTimer = setInterval(() => { if (JOB.status === 'queued' || JOB.status === 'running') jobPaint(); else clearInterval(jobTimer); }, 1000);
  jobPaint();
  // (o registo completo também aparece no diálogo "Ver e publicar", se estiver aberto)
  let logText = '';
  const es = new EventSource(`/api/jobs/${jobId}/events`);
  es.addEventListener('log', (e) => {
    const l = JSON.parse(e.data);
    logText += l + '\n';
    const cons = $('#console');
    if (cons) { cons.textContent = logText; cons.scrollTop = cons.scrollHeight; $('#console-box') && ($('#console-box').hidden = false); }
  });
  es.addEventListener('progress', (e) => {
    const line = JSON.parse(e.data);
    const m = /(Rendered|Stitched|Encoded)\s+(\d+)\/(\d+)/.exec(line);
    if (m) { JOB.pct = Math.min(99, Math.round((Number(m[2]) / Number(m[3])) * 100)); JOB.line = m[1] === 'Rendered' ? 'a desenhar os quadros' : 'a juntar o vídeo'; }
    else if (/Bundling/.test(line)) JOB.line = 'a preparar';
    else JOB.line = line.replace(/\s+/g, ' ').slice(0, 60);
    const pr = $('#progress');
    if (pr) pr.textContent = line;
    if (m && $('#bar')) $('#bar').style.width = `${JOB.pct}%`;
    jobPaint();
  });
  es.addEventListener('status', async (e) => {
    const st = JSON.parse(e.data);
    JOB.status = st;
    const stateEl = $('#job-state');
    if (stateEl) stateEl.textContent = { queued: 'na fila…', running: 'a gerar…', done: '✓ concluído', failed: '✗ falhou' }[st] ?? st;
    if (st === 'running') JOB.pct = Math.max(JOB.pct, 1);
    if (st === 'done' || st === 'failed') {
      es.close();
      if (st === 'done') JOB.pct = 100;
      else JOB.err = (logText.split('\n').filter((l) => /✗|rro/.test(l)).slice(-2).join('\n') || logText.split('\n').filter(Boolean).slice(-3).join('\n')).slice(0, 400);
      jobPaint();
      try { await refresh(); } catch { /* sem rede */ }
      const cons = $('#console');
      if (cons) { cons.textContent = logText; $('#console-box') && ($('#console-box').hidden = false); }
      if (st === 'done') setTimeout(() => { if (JOB.status === 'done') { JOB.status = ''; jobPaint(); } }, 60000);
    } else jobPaint();
  });
  es.onerror = () => { es.close(); if (JOB.status === 'queued' || JOB.status === 'running') { JOB.status = 'failed'; JOB.err = 'Perdi a ligação ao estúdio. Se ele ainda está aberto, o trabalho continua; carregue Ctrl+F5 para ver.'; jobPaint(); } };
}

async function loadPublication(files, id) {
  const f = `${id}/${id}-publicacao.md`;
  const box = $('#pub');
  if (!box || !files.includes(f)) return;
  const text = await api(`/media/${f}`);
  const desc = /## Descrição\n\n([\s\S]*?)\n\n## Hashtags/.exec(text)?.[1] ?? '';
  const tags = /## Hashtags\n\n(.*)/.exec(text)?.[1] ?? '';
  const copy = (t, btn) => navigator.clipboard.writeText(t).then(() => { const o = btn.textContent; btn.textContent = 'Copiado ✓'; setTimeout(() => (btn.textContent = o), 1500); });
  const b1 = h('button', {}, 'Copiar descrição');
  const b2 = h('button', {}, 'Copiar hashtags');
  b1.onclick = () => copy(desc, b1);
  b2.onclick = () => copy(tags, b2);
  box.replaceChildren(
    h('h4', {}, 'Publicação'),
    h('pre', { class: 'pub' }, `${desc}\n\n${tags}`),
    h('div', { class: 'row', style: 'margin-top:8px' }, b1, b2,
      files.filter((x) => x.endsWith('.srt') || x.endsWith('transcricao.txt') || x.endsWith('publicacao.md')).map((x) => dlButton(`/media/${x}`, x.split('/')[1], '⬇ ' + x.split('/')[1])),
    ),
  );
}

// ── gravação no browser ───────────────────────────────────────────────────
function pickMime(kind) {
  const list = kind === 'video' ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return list.find((m) => window.MediaRecorder?.isTypeSupported(m));
}

function stopRec() {
  if (state.rec) state.rec.stop();
}

async function toggleRec(sceneId, kind, btn, meter, preview, onDone) {
  if (state.rec) {
    const same = state.rec.sceneId === sceneId && state.rec.kind === kind;
    state.rec.stop();
    if (same) return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(
      kind === 'video'
        ? { video: { width: 1280, height: 720 }, audio: { echoCancellation: false, noiseSuppression: false } }
        : { audio: { echoCancellation: false, noiseSuppression: false } },
    );
  } catch (e) {
    alert('Sem acesso ao microfone/câmara: ' + e.message + '\nPermita o acesso no navegador.');
    return;
  }
  const mime = pickMime(kind);
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  let raf = 0;
  const bar = meter.querySelector('i');
  meter.hidden = false;
  const tick = () => {
    analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
    bar.style.width = `${Math.min(100, (peak / 128) * 120)}%`;
    bar.style.background = peak > 124 ? 'var(--bad)' : 'var(--ok)';
    raf = requestAnimationFrame(tick);
  };
  tick();

  if (kind === 'video' && preview) {
    const v = h('video', { class: 'preview-cam', muted: true, autoplay: true, playsinline: true });
    v.srcObject = stream;
    preview.replaceChildren(v);
  }

  const orig = btn.textContent;
  btn.textContent = '■ Parar';
  btn.classList.add('rec');
  const t0 = Date.now();
  const timer = setInterval(() => (btn.textContent = `■ Parar (${Math.round((Date.now() - t0) / 1000)} s)`), 500);

  state.rec = {
    sceneId,
    kind,
    stop: () => mr.state !== 'inactive' && mr.stop(),
  };
  mr.onstop = async () => {
    clearInterval(timer);
    cancelAnimationFrame(raf);
    ctx.close();
    stream.getTracks().forEach((t) => t.stop());
    state.rec = null;
    btn.classList.remove('rec');
    btn.textContent = 'A guardar…';
    meter.hidden = true;
    try {
      const blob = new Blob(chunks, { type: mr.mimeType });
      await api(`/api/projects/${state.id}/${kind === 'video' ? 'presenter' : 'voice'}/${sceneId}`, { method: 'POST', body: blob, headers: { 'Content-Type': 'application/octet-stream' } });
      if (onDone) onDone();
      else await refresh();
    } catch (e) {
      alert('Falhou ao guardar a gravação: ' + e.message);
      btn.textContent = orig;
    }
  };
  mr.start(1000);
}

async function delRec(sceneId) {
  if (!confirm('Apagar a gravação desta cena?')) return;
  await api(`/api/projects/${state.id}/voice/${sceneId}`, { method: 'DELETE' });
  await refresh();
}

// ── teleprompter ──────────────────────────────────────────────────────────
// Guião completo com a cena atual em destaque. Gravar → parar guarda e passa à
// cena seguinte, para se poder ler o vídeo todo de seguida (ou regravar uma cena).
const pt = { idx: 0, size: 40, scroll: 0 };

function openPrompter(scene) {
  const dlg = $('#prompter');
  const scenes = () => state.data.project.scenes;
  pt.idx = Math.max(0, scenes().findIndex((s) => s.id === scene.id));
  const btn = $('#prompter-rec');
  const box = $('#prompter-text');

  const draw = (scrollTo = true) => {
    const list = scenes();
    const recorded = new Set(state.data.scenes.filter((x) => x.recorded).map((x) => x.id));
    box.replaceChildren(
      ...list.map((s, i) =>
        h('p', { class: (i === pt.idx ? 'cur ' : '') + (recorded.has(s.id) && i !== pt.idx ? 'done' : ''), onclick: () => { if (!state.rec) { pt.idx = i; draw(); } } },
          h('small', {}, `Cena ${i + 1}/${list.length} · ${s.id}${s.location ? ' · local: ' + s.location : ''}`),
          s.shot && h('small', { class: 'shot' }, `Nota: ${s.shot}`),
          s.narration),
      ),
    );
    $('#prompter-pos').textContent = `Cena ${pt.idx + 1}/${list.length}`;
    box.style.setProperty('--pt-size', pt.size + 'px');
    btn.textContent = '● Gravar esta cena';
    if (scrollTo) box.querySelector('p.cur')?.scrollIntoView({ block: 'center' });
  };

  const go = (d) => {
    if (state.rec) return;
    pt.idx = Math.min(scenes().length - 1, Math.max(0, pt.idx + d));
    draw();
  };

  btn.onclick = () => {
    const s = scenes()[pt.idx];
    toggleRec(s.id, 'audio', btn, $('#prompter-meter').parentElement, null, async () => {
      // guardada: atualiza o estado e passa à cena seguinte
      state.data = await api(`/api/projects/${state.id}`);
      loadState();
      if (pt.idx < scenes().length - 1) pt.idx += 1;
      draw();
    });
  };
  $('#pt-prev').onclick = () => go(-1);
  $('#pt-next').onclick = () => go(1);
  $('#pt-smaller').onclick = () => { pt.size = Math.max(20, pt.size - 4); draw(false); };
  $('#pt-bigger').onclick = () => { pt.size = Math.min(96, pt.size + 4); draw(false); };
  $('#pt-speed').oninput = (e) => (pt.scroll = Number(e.target.value));
  $('#prompter-close').onclick = async () => {
    stopRec();
    dlg.close();
    await refresh();
  };

  // Rolagem suave dentro da cena atual enquanto grava (px/s definido pelo controlo).
  clearInterval(pt.timer);
  pt.timer = setInterval(() => {
    if (state.rec && pt.scroll > 0) box.scrollTop += pt.scroll / 20;
  }, 50);
  dlg.addEventListener('close', () => clearInterval(pt.timer), { once: true });

  draw();
  dlg.showModal();
}

// ── fila ──────────────────────────────────────────────────────────────────
async function pollQueue() {
  try {
    const jobs = await api('/api/jobs');
    const active = jobs.filter((j) => j.status === 'running' || j.status === 'queued');
    const pill = $('#queue');
    pill.hidden = !active.length;
    if (active.length) pill.textContent = `${active.length} trabalho(s) · ${active[0].project} (${active[0].label})`;
  } catch {
    /* servidor parado */
  }
}

window.addEventListener('beforeunload', (e) => {
  if (state.dirty) e.preventDefault();
});

loadState().then(() => {
  const q = new URLSearchParams(location.search);
  const id = q.get('p');
  // ?p=<projeto>&pt=1 abre direto no teleprompter (link para quem vai gravar)
  if (id) openProject(id).then(() => q.get('pt') && openPrompter(state.data.project.scenes[0]));
});
setInterval(pollQueue, 3000);
