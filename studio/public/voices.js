// Escolher a voz sintética: lista as vozes disponíveis, ouve uma amostra de cada e liga a que quer.
// A voz escolhida vale para as cenas sem gravação sua (as gravações suas têm sempre prioridade).

const VOICES = { list: null, online: true, loading: false, filter: 'todas', player: null, playing: '' };

async function loadVoices() {
  if (VOICES.list || VOICES.loading) return;
  VOICES.loading = true;
  try {
    const r = await api('/api/voices');
    VOICES.list = r.voices;
    VOICES.online = r.online;
  } catch {
    VOICES.list = [];
  }
  VOICES.loading = false;
  renderVoiceList();
  // os seletores de voz de cada cena (painel da cena) só se desenham depois da lista chegar
  if (typeof ED !== 'undefined' && ED.sel?.type === 'scene') renderEditor();
}

const voiceRateNum = (p) => Number.parseInt(p.voice?.rate ?? '0', 10) || 0;
const voiceRateStr = (n) => `${n >= 0 ? '+' : '-'}${Math.abs(n)}%`;

function voiceFlag(v) {
  return v.multilingual ? '🌍' : /^pt-PT/i.test(v.locale) ? '🇵🇹' : /^pt-BR/i.test(v.locale) ? '🇧🇷' : '🗣';
}

function voicePlay(p, v) {
  VOICES.player?.pause();
  const a = new Audio(`/api/voices/preview?voice=${encodeURIComponent(v.name)}&rate=${encodeURIComponent(voiceRateStr(voiceRateNum(p)))}`);
  VOICES.player = a;
  VOICES.playing = v.name;
  renderVoiceList();
  a.onended = a.onerror = () => { if (VOICES.playing === v.name) { VOICES.playing = ''; renderVoiceList(); } };
  a.play().catch(() => { toast('Não consegui tocar a amostra (precisa de internet).', 5000); VOICES.playing = ''; renderVoiceList(); });
}

function renderVoiceList() {
  const box = $('#voice-list');
  if (!box) return;
  const p = state.data.project;
  const cur = p.voice?.name;
  if (!VOICES.list) { box.replaceChildren(h('p', { class: 'muted' }, 'A procurar as vozes…')); return; }
  const f = VOICES.filter;
  const shown = VOICES.list.filter((v) =>
    f === 'todas' ? true
    : f === 'f' ? v.gender === 'Female'
    : f === 'm' ? v.gender === 'Male'
    : f === 'pt' ? /^pt-PT/i.test(v.locale)
    : f === 'br' ? /^pt-BR/i.test(v.locale) && !v.multilingual
    : v.multilingual);
  box.replaceChildren(
    !VOICES.online && h('p', { class: 'muted', style: 'color:var(--warn)' }, '⚠ Sem internet: mostro só as vozes principais, e não consigo tocar amostras.'),
    ...shown.map((v) => h('div', { class: 'voice-row' + (cur === v.name ? ' on' : '') },
      h('span', { class: 'voice-flag', 'aria-hidden': 'true' }, voiceFlag(v)),
      h('div', { class: 'voice-name' }, h('b', {}, v.label), h('div', { class: 'muted', style: 'font-size:12px' }, `${v.gender === 'Female' ? 'Feminina' : 'Masculina'} · ${v.locale}`)),
      h('button', { title: 'Ouvir uma amostra desta voz', 'aria-label': 'Ouvir ' + v.label, onclick: () => voicePlay(p, v) }, VOICES.playing === v.name ? '⏳ A tocar…' : '▶ Ouvir'),
      h('button', { class: cur === v.name ? 'primary' : '', 'aria-pressed': cur === v.name ? 'true' : 'false', onclick: () => { (p.voice ??= {}).name = v.name; dirty(); renderVoiceList(); const t = $('#voice-cur'); if (t) t.textContent = voiceCurLabel(p); toast('Voz escolhida: ' + v.label + '. Carregue em 🔊 Voz para a ouvir no vídeo.', 4500); } }, cur === v.name ? '✓ Escolhida' : 'Usar'))));
}

function voiceCurLabel(p) {
  const v = VOICES.list?.find((x) => x.name === p.voice?.name);
  return p.voice?.name ? `Voz escolhida: ${v?.label ?? p.voice.name}` : 'Voz da marca (padrão)';
}

function voicePicker(p) {
  loadVoices();
  const chip = (id, t) => h('button', { class: 'chip' + (VOICES.filter === id ? ' on' : ''), onclick: () => { VOICES.filter = id; renderVoiceList(); document.querySelectorAll('#voice-box .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === id)); } }, t);
  const chips = [['todas', 'Todas'], ['f', '♀ Femininas'], ['m', '♂ Masculinas'], ['pt', '🇵🇹 Portugal'], ['br', '🇧🇷 Brasil'], ['ml', '🌍 Multilingues']].map(([id, t]) => {
    const b = chip(id, t);
    b.dataset.f = id;
    return b;
  });
  const rate = voiceRateNum(p);
  return h('div', { id: 'voice-box', class: 'stack' },
    h('div', { class: 'row', style: 'align-items:center' },
      h('b', { id: 'voice-cur', style: 'flex:1' }, voiceCurLabel(p)),
      p.voice?.name && h('button', { onclick: () => { p.voice.name = undefined; dirty(); renderVoiceList(); $('#voice-cur').textContent = voiceCurLabel(p); } }, 'Voltar à voz da marca')),
    h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Vale para as cenas sem gravação sua. As suas gravações têm sempre prioridade. Precisa de internet; sem ela o motor usa uma voz offline.'),
    h('label', {}, `Velocidade da fala: ${rate === 0 ? 'normal' : (rate > 0 ? 'mais rápida ' : 'mais lenta ') + Math.abs(rate) + '%'}`,
      h('input', { type: 'range', min: -30, max: 30, step: 5, value: rate, oninput: (e) => {
        const n = Number(e.target.value);
        (p.voice ??= {}).rate = n === 0 ? undefined : voiceRateStr(n);
        e.target.parentNode.firstChild.textContent = `Velocidade da fala: ${n === 0 ? 'normal' : (n > 0 ? 'mais rápida ' : 'mais lenta ') + Math.abs(n) + '%'}`;
        dirty();
      } })),
    h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...chips),
    h('div', { id: 'voice-list', class: 'voice-list' }));
}

// ── extras de cada cena: voz própria e pessoa à frente do cenário ─────────
function sceneExtras(p, s, i, st) {
  loadVoices();
  const chip = (cur, val, label, on, title) => h('button', { class: 'chip' + (cur === val ? ' on' : ''), title, onclick: () => on(val) }, label);
  const hasVideo = st?.kind === 'video';
  const pl = s.person ?? {};
  const setPl = (k, v) => { s.person = { ...(s.person ?? {}), [k]: v }; dirty(); renderEditor(); };

  // voz desta cena
  const sel = h('select', { onchange: () => { s.voiceName = sel.value || undefined; dirty(); renderEditor(); } },
    h('option', { value: '' }, p.voice?.name ? 'A do projeto (' + (VOICES.list?.find((v) => v.name === p.voice.name)?.label ?? p.voice.name) + ')' : 'A do projeto (voz da marca)'),
    ...(VOICES.list ?? []).map((v) => h('option', { value: v.name }, `${voiceFlag(v)} ${v.label} · ${v.gender === 'Female' ? 'feminina' : 'masculina'}`)));
  sel.value = s.voiceName ?? '';
  const voiceBlock = h('div', { class: 'zone stack' },
    h('b', {}, '🗣 Voz desta cena'),
    h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Para uma conversa com duas vozes, ou uma voz diferente numa cena. Só vale se a cena não tiver gravação sua.'),
    sel,
    s.voiceName && h('div', { class: 'row' },
      h('button', { onclick: () => { const v = VOICES.list?.find((x) => x.name === s.voiceName); if (v) voicePlay(p, v); } }, '▶ Ouvir esta voz'),
      h('button', { onclick: () => { s.voiceName = undefined; dirty(); renderEditor(); } }, 'Usar a do projeto')));

  // pessoa à frente do cenário
  const personBlock = h('div', { class: 'zone stack' },
    h('b', {}, '🧍 A pessoa nesta cena'),
    !hasVideo
      ? h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Para pôr a pessoa à frente do cenário, grave ou carregue o seu vídeo nesta cena (botão "② Gravar" / "Carregar vídeo"). A sua voz passa a ser a do vídeo.')
      : h('div', { class: 'stack' },
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' },
          chip(pl.mode ?? 'bolha', 'bolha', '⚪ Rosto numa bolha', (v) => setPl('mode', v), 'O rosto num círculo no canto, por cima do cenário'),
          chip(pl.mode ?? 'bolha', 'recorte', '🧍 De pé à frente do cenário', (v) => setPl('mode', v), 'A pessoa sem o fundo, como se estivesse no sítio do cenário')),
        pl.mode === 'recorte' && h('div', { class: 'stack' },
          h('div', {}, h('div', { class: 'muted', style: 'font-size:13px' }, 'Onde fica'),
            h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, ...[['esquerda', '◀ Esquerda'], ['centro', '● Centro'], ['direita', 'Direita ▶']].map(([v, t]) => chip(pl.side ?? 'centro', v, t, (x) => setPl('side', x))))),
          h('label', {}, `Tamanho: ${pl.size ?? 78}% do ecrã`, h('input', { type: 'range', min: 40, max: 100, step: 2, value: pl.size ?? 78, oninput: (e) => { (s.person ??= {}).size = Number(e.target.value); e.target.parentNode.firstChild.textContent = `Tamanho: ${e.target.value}% do ecrã`; dirty(); }, onchange: () => renderEditor() })),
          h('label', {}, 'Cor do fundo atrás de si (a que se tira)',
            (() => {
              const k = h('select', { onchange: () => setPl('key', k.value === 'outra' ? '#00ff00' : k.value) },
                h('option', { value: 'auto' }, 'Automática (lê os cantos do vídeo)'), h('option', { value: 'verde' }, 'Verde'), h('option', { value: 'azul' }, 'Azul'), h('option', { value: 'outra' }, 'Outra cor…'));
              k.value = !pl.key || pl.key === 'auto' ? 'auto' : pl.key === 'verde' || pl.key === 'azul' ? pl.key : 'outra';
              return k;
            })()),
          pl.key && !['auto', 'verde', 'azul'].includes(pl.key) && h('label', {}, 'Cor', h('input', { type: 'color', value: pl.key, onchange: (e) => setPl('key', e.target.value) })),
          h('label', {}, `Sensibilidade: ${Math.round((pl.tolerance ?? 0.15) * 100)}%`, h('input', { type: 'range', min: 5, max: 40, step: 1, value: Math.round((pl.tolerance ?? 0.15) * 100), oninput: (e) => { (s.person ??= {}).tolerance = Number(e.target.value) / 100; e.target.parentNode.firstChild.textContent = `Sensibilidade: ${e.target.value}%`; dirty(); }, onchange: () => renderEditor() })),
          h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, 'Como gravar: fundo de UMA só cor, bem iluminado e sem sombras (pano verde ou azul, ou uma parede lisa); não vista roupa dessa cor. Se ficarem restos do fundo, suba a sensibilidade; se a pessoa ficar "furada", baixe-a. O recorte só se vê no rascunho (a pré-visualização aqui é aproximada).'),
          h('button', { title: 'Aplica esta disposição a todas as cenas com vídeo seu', onclick: () => { p.person = { ...s.person }; for (const x of p.scenes) x.person = undefined; dirty(); renderEditor(); toast('Disposição aplicada a todas as cenas.'); } }, 'Usar em todas as cenas'))));
  return h('div', { class: 'stack' }, voiceBlock, personBlock);
}
