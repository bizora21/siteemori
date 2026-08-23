// Ecrã da Emori desenhado em SVG, para os vídeos.
//
// Porquê simular em vez de gravar: os vídeos com filmagem de banco de imagens
// perdiam sempre a maioria dos espectadores aos 0:02 — é a assinatura visual do
// conteúdo automatizado, e o público salta-a antes de ler o texto. Um ecrã de
// app a ser usado lê-se como real no primeiro instante.
//
// As cores e a tipografia vêm do tailwind.config.ts e do layout do site (Inter
// + PT Serif), para o que se vê aqui não divergir do produto.

export const APP = {
  cream: '#faf5ec',
  creamDeep: '#f3e8d6',
  clay: '#a2481f',
  clayLight: '#f6ddd0',
  ink: '#2a2420',
  inkSoft: '#4a3f38',
  muted: '#9b8d80',
  backdrop: '#efe4d4',
} as const;

const W = 1080;
const H = 1920;

// ZONA SEGURA DO TIKTOK. O vídeo é 9:16, mas os telemóveis atuais são mais
// altos (19,5:9, 20:9) e a app preenche o ecrã cortando topo e base. Somando a
// legenda, o nome de utilizador e os botões de ação, sobra esta janela. O ecrã
// da app vive TODO aqui dentro, como um cartão: se as bordas forem cortadas,
// corta-se o fundo e não a interface.
const CARD_X = 56;
const CARD_Y = 250;
const CARD_W = W - CARD_X * 2;
const CARD_H = 1180;
const PAD = CARD_X + 56;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Quebra texto por largura aproximada em caracteres. */
function wrap(text: string, cols: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > cols && line) {
      out.push(line);
      line = w;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export interface AppFrame {
  /** texto já escrito na entrada (revelado progressivamente) */
  typed: string;
  /** resposta da Emori; quando presente, o cartão dela aparece */
  reply?: string;
  /** cursor a piscar no fim do texto */
  caret?: boolean;
  /** linha discreta por baixo do cartão (usada no fecho) */
  footer?: string;
}

/** Um frame do ecrã de check-in, em 1080×1920. */
export function appScreenSvg(f: AppFrame): string {
  // Texto do diário: 26 caracteres por linha mantém-no dentro do cartão e longe
  // dos botões de ação do TikTok, que ficam colados à direita.
  const linhas = wrap(f.typed, 26);
  // +400 e não +320: o texto começava colado à linha divisória (que está em
  // +318) e passava por cima dela.
  const topoTexto = CARD_Y + 400;
  const lh = 70;

  const ultima = linhas.at(-1) ?? '';
  const caretX = PAD + ultima.length * 23;
  const caretY = topoTexto + (linhas.length - 1) * lh;

  const entrada = linhas
    .map(
      (l, i) =>
        `<text x="${PAD}" y="${topoTexto + i * lh}" font-family="PT Serif" font-size="47" fill="${APP.ink}">${esc(l)}</text>`,
    )
    .join('\n  ');

  let respostaEls = '';
  if (f.reply) {
    const rl = wrap(f.reply, 25);
    const topo = topoTexto + linhas.length * lh + 84;
    const alturaCartao = 140 + rl.length * 62;
    respostaEls = `
  <rect x="${PAD - 26}" y="${topo - 72}" width="${CARD_W - 60}" height="${alturaCartao}" rx="30" fill="${APP.clayLight}" opacity="0.6"/>
  <circle cx="${PAD + 4}" cy="${topo - 20}" r="24" fill="${APP.clay}"/>
  <path d="M ${PAD + 13} ${topo - 31} a 12 12 0 1 0 10 10 a 9 9 0 0 1 -10 -10 z" fill="${APP.cream}"/>
  <text x="${PAD + 44}" y="${topo - 10}" font-family="Inter" font-weight="600" font-size="28" fill="${APP.clay}" letter-spacing="1">Emori</text>
  ${rl
    .map(
      (l, i) =>
        `<text x="${PAD + 4}" y="${topo + 56 + i * 62}" font-family="PT Serif" font-size="43" fill="${APP.inkSoft}">${esc(l)}</text>`,
    )
    .join('\n  ')}`;
  }

  // CTA: uma linha sóbria por baixo do cartão, fora da interface. Não é botão
  // nem badge — a peça inteira deixa de se ler como anúncio se o remate for
  // discreto, e foi um remate de produto que já nos matou a retenção antes.
  const footerEls = f.footer
    ? `<text x="${W / 2}" y="${CARD_Y + CARD_H + 92}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="38" fill="${APP.clay}" letter-spacing="1">${esc(f.footer)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${APP.backdrop}"/>

  <!-- o ecrã da app, dentro da zona segura -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="52" fill="${APP.cream}"/>

  <!-- barra de estado -->
  <text x="${PAD}" y="${CARD_Y + 70}" font-family="Inter" font-weight="600" font-size="28" fill="${APP.ink}">9:41</text>
  <rect x="${CARD_X + CARD_W - 108}" y="${CARD_Y + 48}" width="44" height="23" rx="7" fill="none" stroke="${APP.ink}" stroke-width="2.5" opacity="0.7"/>
  <rect x="${CARD_X + CARD_W - 104}" y="${CARD_Y + 52}" width="30" height="15" rx="4" fill="${APP.ink}" opacity="0.7"/>

  <!-- cabeçalho -->
  <text x="${PAD}" y="${CARD_Y + 180}" font-family="Inter" font-weight="600" font-size="29" fill="${APP.muted}" letter-spacing="4">CHECK-IN DE HOJE</text>
  <text x="${PAD}" y="${CARD_Y + 262}" font-family="PT Serif" font-weight="bold" font-size="60" fill="${APP.ink}">Como você está?</text>
  <line x1="${PAD}" y1="${CARD_Y + 318}" x2="${CARD_X + CARD_W - 56}" y2="${CARD_Y + 318}" stroke="${APP.creamDeep}" stroke-width="3"/>

  ${entrada}
  ${f.caret ? `<rect x="${caretX}" y="${caretY - 39}" width="4" height="50" fill="${APP.clay}"/>` : ''}
  ${respostaEls}

  <!-- indicador inferior do telemóvel, dentro do cartão -->
  <rect x="${W / 2 - 130}" y="${CARD_Y + CARD_H - 44}" width="260" height="8" rx="4" fill="${APP.ink}" opacity="0.16"/>

  ${footerEls}
</svg>`;
}
