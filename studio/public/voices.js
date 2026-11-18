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
