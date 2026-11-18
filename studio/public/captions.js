// Legendas premium: formato, tamanho, posição, letra, cores, fundo e destaque da palavra. Liga/desliga.
// Usado pelo painel "Efeitos" do editor (editor-ui.js).

const CAP_COLORS = [['#ffffff', 'Branco'], ['#ffe14d', 'Amarelo'], ['#4dd2ff', 'Azul claro'], ['#7dff9a', 'Verde'], ['#ff7ab8', 'Rosa'], ['#ff9a3c', 'Laranja'], ['#101820', 'Preto']];
const CAP_PRESETS = [
  ['Karaokê', { captionStyle: 'karaoke', caption: undefined }],
  ['Caixa escura', { captionStyle: 'limpo', caption: undefined }],
  ['Destaque', { captionStyle: 'destaque', caption: undefined }],
  ['Cinema', { captionStyle: 'limpo', caption: { font: 'classica', size: 'media', position: 'baixo', hl: 'nenhum', box: 'nenhuma', outline: false } }],
  ['Redes (grande)', { captionStyle: 'karaoke', caption: { font: 'compacta', size: 'grande', position: 'meio', caps: true, highlight: '#ffe14d' } }],
  ['Cor da marca', { captionStyle: 'limpo', caption: { box: 'cor', hl: 'cor', size: 'media' } }],
];

function capOptions(p, st, set, chip, sw) {
  const c = st.caption ?? {};
  const setC = (k, v) => { set('caption', { ...(p.style?.caption ?? {}), [k]: v }); };
  const row = (label, ...kids) => h('div', {}, h('div', { class: 'muted', style: 'font-size:13px' }, label), h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' }, ...kids));
  const colors = (cur, key, auto) => [
    chip(cur, undefined, auto, () => setC(key, undefined)),
    ...CAP_COLORS.map(([v, t]) => h('button', { class: 'chip' + (cur === v ? ' on' : ''), title: t, 'aria-label': t, style: `min-width:34px;background:${v};color:${v === '#101820' || v === '#ffffff' ? '#888' : v};border:2px solid ${cur === v ? '#f5b82e' : 'rgba(255,255,255,.3)'}`, onclick: () => setC(key, v) }, '●')),
    h('input', { type: 'color', value: cur ?? '#ffffff', title: 'Outra cor', 'aria-label': 'Outra cor', onchange: (e) => setC(key, e.target.value) }),
  ];
  const boxNow = c.box ?? (st.captionStyle === 'limpo' ? 'escura' : 'nenhuma');
  return h('div', { class: 'stack' },
    row('Modelos prontos', ...CAP_PRESETS.map(([t, v]) => h('button', { class: 'chip', onclick: () => { p.style = { ...(p.style ?? {}), ...v }; dirty(); renderEditor(); } }, t))),
    row('Tamanho', ...[['pequena', 'Pequena'], ['media', 'Média'], ['grande', 'Grande'], ['enorme', 'Enorme']].map(([v, t]) => chip(c.size ?? 'media', v, t, (x) => setC('size', x)))),
    row('Onde aparece', ...[['cima', '⬆ Em cima'], ['meio', '⬌ No meio'], ['baixo', '⬇ Em baixo']].map(([v, t]) => chip(c.position ?? 'baixo', v, t, (x) => setC('position', x)))),
    row('Tipo de letra', ...[['moderna', 'Moderna'], ['classica', 'Clássica'], ['compacta', 'Compacta'], ['redonda', 'Redonda']].map(([v, t]) => chip(c.font ?? 'moderna', v, t, (x) => setC('font', x)))),
    row('Fundo atrás do texto', ...[[undefined, 'Do modelo'], ['nenhuma', 'Sem fundo'], ['escura', 'Caixa escura'], ['cor', 'Cor da marca']].map(([v, t]) => chip(c.box, v, t, (x) => setC('box', x)))),
    row('Palavra que se está a dizer', ...[[undefined, 'Do modelo'], ['cor', 'Muda de cor'], ['pilula', 'Marcador'], ['nenhum', 'Sem destaque']].map(([v, t]) => chip(c.hl, v, t, (x) => setC('hl', x)))),
    row('Cor do texto', ...colors(c.color, 'color', 'Automática')),
    row('Cor da palavra em destaque', ...colors(c.highlight, 'highlight', 'Cor da marca')),
    sw('LETRAS MAIÚSCULAS', Boolean(c.caps), (on) => setC('caps', on || undefined)),
    sw('Contorno escuro nas letras', c.outline ?? boxNow === 'nenhuma', (on) => setC('outline', on)));
}
