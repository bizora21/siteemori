// Gerador de QR Code sem dependências (modo byte, correção de erros M, versões 1–10).
// Chega para um link de rede local. Usado para o telemóvel abrir o estúdio sem copiar o link.
//
// Referência: ISO/IEC 18004. A divisão em blocos e os polinómios de Reed-Solomon
// seguem a norma; rsRemainder é testado contra o exemplo oficial ("01234567", 1-M).

/** [ec por bloco, blocos do grupo 1, dados por bloco g1, blocos do grupo 2, dados por bloco g2] — nível M. */
const EC_M: number[][] = [
  [],
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
];
const ALIGN: number[][] = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// ── Reed-Solomon em GF(256), polinómio 0x11D ─────────────────────────────
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

export function rsRemainder(data: number[], ecLen: number): number[] {
  const divisor = rsDivisor(ecLen);
  const result = new Array<number>(ecLen).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] ^= gfMul(coef, factor)));
  }
  return result;
}

const bit = (v: number, i: number) => ((v >>> i) & 1) !== 0;

// ── Codificação dos dados ────────────────────────────────────────────────
function dataCodewords(text: string, version: number): number[] {
  const bytes = [...new TextEncoder().encode(text)];
  const [, g1n, g1d, g2n, g2d] = EC_M[version];
  const capacity = g1n * g1d + g2n * g2d;
  const bits: number[] = [];
  const push = (v: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((v >>> i) & 1);
  };
  push(0b0100, 4); // modo byte
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  if (bits.length > capacity * 8) throw new Error('texto demasiado grande para o QR');
  push(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; out.length < capacity; pad ^= 0xec ^ 0x11) out.push(pad);
  return out;
}

/** Divide em blocos, calcula a correção de erros e entrelaça (secção 7.6 da norma). */
function allCodewords(data: number[], version: number): number[] {
  const [ecLen, g1n, g1d, g2n, g2d] = EC_M[version];
  const blocks: number[][] = [];
  let pos = 0;
  for (let i = 0; i < g1n + g2n; i++) {
    const len = i < g1n ? g1d : g2d;
    blocks.push(data.slice(pos, pos + len));
    pos += len;
  }
  const ecs = blocks.map((b) => rsRemainder(b, ecLen));
  const out: number[] = [];
  const maxLen = Math.max(g1d, g2d);
  for (let i = 0; i < maxLen; i++) blocks.forEach((b) => i < b.length && out.push(b[i]));
  for (let i = 0; i < ecLen; i++) ecs.forEach((e) => out.push(e[i]));
  return out;
}

// ── Matriz ───────────────────────────────────────────────────────────────
class Matrix {
  readonly size: number;
  readonly dark: boolean[][];
  readonly fn: boolean[][];
  constructor(readonly version: number) {
    this.size = 17 + 4 * version;
    this.dark = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.fn = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }
  set(x: number, y: number, v: boolean) {
    this.dark[y][x] = v;
    this.fn[y][x] = true;
  }
}

function drawFunctionPatterns(m: Matrix): void {
  const { size, version } = m;
  for (let i = 0; i < size; i++) {
    m.set(6, i, i % 2 === 0);
    m.set(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) m.set(x, y, dist !== 2 && dist !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  const pos = ALIGN[version];
  pos.forEach((px, i) =>
    pos.forEach((py, j) => {
      const overlapsFinder = (i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0);
      if (overlapsFinder) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m.set(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }),
  );
  drawFormat(m, 0); // reserva as áreas (o valor real entra depois da máscara)
  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      m.set(a, b, bit(bits, i));
      m.set(b, a, bit(bits, i));
    }
  }
}

function drawFormat(m: Matrix, mask: number): void {
  const { size } = m;
  const data = (0b00 << 3) | mask; // nível M = 00
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) m.set(8, i, bit(bits, i));
  m.set(8, 7, bit(bits, 6));
  m.set(8, 8, bit(bits, 7));
  m.set(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i++) m.set(14 - i, 8, bit(bits, i));
  for (let i = 0; i < 8; i++) m.set(size - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i++) m.set(8, size - 15 + i, bit(bits, i));
  m.set(8, size - 8, true); // módulo escuro fixo
}

function placeData(m: Matrix, codewords: number[]): void {
  const { size, version } = m;
  const bits: boolean[] = [];
  codewords.forEach((cw) => {
    for (let i = 7; i >= 0; i--) bits.push(bit(cw, i));
  });
  if (version >= 2 && version <= 6) for (let i = 0; i < 7; i++) bits.push(false); // bits restantes
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!m.fn[y][x] && k < bits.length) m.dark[y][x] = bits[k++];
      }
    }
  }
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(m: Matrix, mask: number): void {
  for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (!m.fn[y][x] && MASKS[mask](y, x)) m.dark[y][x] = !m.dark[y][x];
}

function penalty(d: boolean[][]): number {
  const n = d.length;
  let score = 0;
  const line = (get: (i: number) => boolean) => {
    let run = 1;
    for (let i = 1; i < n; i++) {
      if (get(i) === get(i - 1)) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else run = 1;
    }
    // padrão tipo localizador 1:1:3:1:1 com 4 módulos claros de um dos lados
    for (let i = 0; i + 11 <= n; i++) {
      const s = Array.from({ length: 11 }, (_, k) => (get(i + k) ? 1 : 0)).join('');
      if (s === '10111010000' || s === '00001011101') score += 40;
    }
  };
  for (let y = 0; y < n; y++) line((x) => d[y][x]);
  for (let x = 0; x < n; x++) line((y) => d[y][x]);
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) if (d[y][x] === d[y][x + 1] && d[y][x] === d[y + 1][x] && d[y][x] === d[y + 1][x + 1]) score += 3;
  const dark = d.flat().filter(Boolean).length;
  const total = n * n;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

/** Devolve a matriz do QR (true = módulo escuro). */
export function qrMatrix(text: string): boolean[][] {
  const len = new TextEncoder().encode(text).length;
  let version = 1;
  while (version <= 10) {
    const [, g1n, g1d, g2n, g2d] = EC_M[version];
    const capBytes = Math.floor(((g1n * g1d + g2n * g2d) * 8 - 4 - (version < 10 ? 8 : 16)) / 8);
    if (len <= capBytes) break;
    version++;
  }
  if (version > 10) throw new Error('texto demasiado grande para o QR (máx. ~210 bytes)');

  const codewords = allCodewords(dataCodewords(text, version), version);
  let best: { m: Matrix; mask: number; score: number } | null = null;
  for (let mask = 0; mask < 8; mask++) {
    const m = new Matrix(version);
    drawFunctionPatterns(m);
    placeData(m, codewords);
    applyMask(m, mask);
    drawFormat(m, mask);
    const score = penalty(m.dark);
    if (!best || score < best.score) best = { m, mask, score };
  }
  return best!.m.dark;
}

/** SVG com fundo branco e zona de silêncio de 4 módulos (escala-se com o CSS). */
export function qrSvg(text: string, pixels = 320): string {
  const m = qrMatrix(text);
  const border = 4;
  const n = m.length + border * 2;
  let path = '';
  m.forEach((row, y) => row.forEach((on, x) => on && (path += `M${x + border},${y + border}h1v1h-1z`)));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${pixels}" height="${pixels}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
