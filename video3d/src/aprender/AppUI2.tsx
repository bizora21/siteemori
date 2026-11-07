import type { ReactNode } from 'react';
import { Img, staticFile } from 'remotion';
import { clamp01, easeIO, sceneProgress } from '../rastreio/timing';

// "Aprender a Bíblia" v2 — desenhado como na app real (LearnScreen.tsx / LevelMap.tsx, v23):
// percurso de 15 níveis em 5 etapas, estrelas, meta do dia, dica, rever erros, conquistas
// e lembretes suaves. Textos iguais aos da app. Dados de DEMONSTRAÇÃO.

const BG = '#F4F5F3';
const SURF = '#EAECE8';
const TXT = '#232A26';
const SEC = '#4A534D';
const TER = '#6B756E';
const ACC = '#4A6B57';
const ACC_L = '#C3D2C8';
const BORDER = '#D2D8D0';
const OK = '#6E9E7F';
const GOLD = '#c99a2e';
const FONT = "Roboto, 'Segoe UI', Arial, sans-serif";

const ICONS: Record<string, string> = {
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 118 0v3',
  book: 'M2 5c3-1.5 6-1.5 10 1 4-2.5 7-2.5 10-1v13c-3-1.5-6-1.5-10 1-4-2.5-7-2.5-10-1z M12 6v13',
  check: 'M5 12.5l4.5 4.5L19 7',
  checkall: 'M2 13l4 4L14 8 M10 15l2 2L21 7',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  close: 'M6 6l12 12 M18 6L6 18',
  ok: 'M12 21a9 9 0 100-18 9 9 0 000 18z M8 12.5l3 3 5-6',
  pray: 'M12 3v5 M8 8c0 6-2 8-3 12h14c-1-4-3-6-3-12 M12 8v6',
  people: 'M9 11a3 3 0 100-6 3 3 0 000 6z M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5 M17 11a2.5 2.5 0 100-5 M16 14.5c3 0 5 1.8 5 4.5',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  user: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 12a3 3 0 100-6 3 3 0 000 6z M6.5 18c1.5-2.5 3.2-3.2 5.5-3.2s4 .7 5.5 3.2',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 16a4 4 0 100-8 4 4 0 000 8z M12 12h.01',
  refresh: 'M12 21a9 9 0 100-18 9 9 0 000 18z M16 12a4 4 0 11-1.2-2.9 M16 7.5v3h-3',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 00-3.5 10.9c.7.6 1 1.3 1 2.1h5c0-.8.3-1.5 1-2.1A6 6 0 0012 3z',
  steps: 'M8 14c2 0 3-1 3-3s-1-4-3-4-3 2-3 4 1 3 3 3z M8 18h.01 M16 17c2 0 3-1 3-3s-1-4-3-4-3 2-3 4 1 3 3 3z M16 21h.01',
  sprout: 'M12 21v-8 M12 13c0-4 3-6 7-6 0 4-3 6-7 6z M12 15c0-3-2-5-6-5 0 3 2 5 6 5z',
  crown: 'M4 8l4 4 4-7 4 7 4-4-2 11H6z',
  medal: 'M12 15a5 5 0 100-10 5 5 0 000 10z M8.5 14L6 21l6-3 6 3-2.5-7',
};

function Ico({ n, size = 30, color = TER, sw = 2, fill }: { n: string; size?: number; color?: string; sw?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ?? 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[n]} />
    </svg>
  );
}

const STAGES = [
  { name: 'Fundamentos', ids: [1, 2, 3] },
  { name: 'Conhecer a Palavra', ids: [4, 5, 6] },
  { name: 'Aprofundar', ids: [7, 8, 9] },
  { name: 'Estudo a fundo', ids: [10, 11, 12] },
  { name: 'Maestria', ids: [13, 14, 15] },
];

const LEVEL: Record<number, [string, string]> = {
  1: ['Primeiros passos', 'As histórias que todos conhecem'],
  2: ['Personagens', 'Homens e mulheres de fé'],
  3: ['Livros da Bíblia', 'Conhecer a estrutura e a ordem'],
  4: ['Ensinos de Jesus', 'Parábolas, milagres e palavras'],
  5: ['Profetas e Salmos', 'A voz de Deus ao longo dos séculos'],
  6: ['Aprofundar', 'Para quem já conhece bem a Palavra'],
  7: ['Linha do tempo', 'Do Éden ao regresso do exílio'],
  8: ['Lei e adoração', 'Mandamentos, tabernáculo e festas'],
  9: ['Sabedoria e história', 'Salmos, Provérbios e livros históricos'],
  10: ['A voz dos profetas', 'Profetas maiores e menores'],
  11: ['Evangelhos lado a lado', 'O que cada evangelista nos mostra'],
  12: ['Igreja em movimento', 'Atos e as viagens de Paulo'],
  13: ['Cartas e doutrina', 'Graça, fé e vida cristã'],
  14: ['Esperança final', 'Apocalipse e profecia'],
  15: ['Mestre da Palavra', 'Contexto, línguas e ligações'],
};

const BEST: Record<number, number> = { 1: 100, 2: 90 };
const starsFor = (p: number) => (p >= 95 ? 3 : p >= 85 ? 2 : p >= 70 ? 1 : 0);

function StatusBar() {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 52, background: BG, color: TXT, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', fontSize: 22, fontWeight: 600, zIndex: 5 }}>
      <span>9:41</span>
      <span style={{ letterSpacing: 3 }}>●●● ▮</span>
    </div>
  );
}

function TabBar() {
  const items = ['pray', 'people', 'book', 'cal', 'user'];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 100, background: BG, borderTop: `1.5px solid ${BORDER}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 5 }}>
      {items.map((n) => (
        <Ico key={n} n={n} size={42} color={n === 'book' ? ACC : '#8a948d'} sw={n === 'book' ? 2.4 : 2} />
      ))}
    </div>
  );
}

const glowShadow = (g: number) => (g > 0 ? `0 0 0 ${4 * g}px rgba(74,107,87,${0.65 * g}), 0 10px 30px rgba(74,107,87,${0.28 * g})` : 'none');

function Row({ id, glow = 0 }: { id: number; glow?: number }) {
  const [title, sub] = LEVEL[id];
  const done = id < 3;
  const current = id === 3;
  const locked = id > 3;
  const best = BEST[id];
  const s = best ? starsFor(best) : 0;
  const ell = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 78,
        boxSizing: 'border-box',
        background: SURF,
        borderRadius: 22,
        padding: '0 16px',
        marginBottom: 10,
        border: `2px solid ${current ? ACC : 'transparent'}`,
        opacity: locked ? 0.7 : 1,
        boxShadow: current ? glowShadow(glow) : 'none',
      }}
    >
      <div style={{ width: 46, height: 46, flex: '0 0 46px', borderRadius: 23, background: done || current ? ACC : ACC_L, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {locked ? <Ico n="lock" size={24} color={TER} /> : done ? <Ico n="check" size={26} color="#fff" sw={2.8} /> : <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{id}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 24, color: TXT, fontWeight: 600, ...ell }}>{title}</div>
        <div style={{ fontSize: 17, color: TER, marginTop: 2, ...ell }}>{locked ? `Completa o nível ${id - 1} com 70%` : sub}</div>
      </div>
      {done && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <div style={{ display: 'flex' }}>
            {[1, 2, 3].map((n) => (
              <Ico key={n} n="star" size={20} color={n <= s ? ACC : TER} fill={n <= s ? ACC : 'none'} sw={1.8} />
            ))}
          </div>
          <span style={{ fontSize: 16, color: TER }}>{best}%</span>
        </div>
      )}
      {current && <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', background: ACC, borderRadius: 999, padding: '6px 14px' }}>Continuar</div>}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Ico n={icon} size={26} color={ACC} />
      <span style={{ fontSize: 28, color: TXT, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 17, color: TER }}>{label}</span>
    </div>
  );
}

const S_MAX = 1250;

function Home({ t, starts, end, mode }: { t: number; starts: number[]; end: number; mode: 'journey' | 'review' }) {
  const rv = mode === 'review';
  const sc1 = rv ? 0 : sceneProgress(t, starts, 1, end);
  const inS1 = !rv && t >= starts[1] - 0.2 && t < starts[2];
  const heroGlow = inS1 ? clamp01(Math.sin(clamp01(sc1 / 0.5) * Math.PI) * 1.6) : 0;
  const statGlow = inS1 ? clamp01(Math.sin(clamp01((sc1 - 0.5) / 0.5) * Math.PI) * 1.6) : 0;

  let scroll = 0;
  if (!rv && t >= starts[2]) {
    const a = easeIO(clamp01((t - starts[2]) / 1.1));
    const b = easeIO(clamp01((t - starts[2] - 1.1) / Math.max(1, starts[3] - starts[2] - 2.4)));
    scroll = 620 * a + (S_MAX - 620) * b;
  }

  const pop = rv ? easeIO(clamp01((t - starts[4] - 0.4) / 0.5)) : 0;
  const pulse = rv ? clamp01(Math.sin(clamp01((t - starts[4] - 0.9) / 1.6) * Math.PI) * 1.4) : 0;
  const cardStyle = { background: SURF, borderRadius: 24, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 } as const;

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: '78px 30px 0', transform: `translateY(${-scroll}px)` }}>
        <div style={{ fontSize: 42, fontWeight: 300, color: TXT, marginBottom: 6 }}>Aprender a Bíblia</div>
        <div style={{ fontSize: 22, color: SEC, lineHeight: '30px', marginBottom: 18 }}>Pergunta a pergunta, do mais fácil ao mais profundo.</div>

        <div style={{ background: SURF, borderRadius: 28, padding: 20, marginBottom: 12, boxShadow: glowShadow(heroGlow) }}>
          <div style={{ fontSize: 25, color: TXT, fontWeight: 600, marginBottom: 10 }}>2 de 15 níveis concluídos</div>
          <div style={{ height: 10, borderRadius: 5, background: '#D9DDD6', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: 10, width: `${(2 / 15) * 100}%`, background: ACC }} />
          </div>
          <div style={{ height: 70, borderRadius: 35, background: ACC, color: '#fff', fontSize: 27, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>Continuar · Nível 3</div>
          <div style={{ fontSize: 20, color: TER, textAlign: 'center' }}>Livros da Bíblia</div>
        </div>

        <div style={cardStyle}>
          <Ico n="target" size={32} color={ACC} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, color: TXT, fontWeight: 600 }}>Meta de hoje</div>
            <div style={{ fontSize: 19, color: TER, lineHeight: '26px', marginTop: 2 }}>Faz 1 ronda para manter a tua sequência de 3 dias.</div>
          </div>
        </div>

        <div style={{ display: 'flex', padding: '10px 0', margin: '0 -10px 12px', borderRadius: 20, background: `rgba(74,107,87,${0.12 * statGlow})`, boxShadow: statGlow > 0 ? `0 0 0 ${3 * statGlow}px rgba(74,107,87,${0.6 * statGlow})` : 'none' }}>
          <Stat icon="flame" value="3 dias" label="seguidos" />
          <Stat icon="star" value="180" label="pontos" />
          <Stat icon="checkall" value="7" label="certas seguidas" />
        </div>

        {rv && (
          <div style={{ ...cardStyle, border: `2px solid ${ACC}`, opacity: pop, transform: `translateY(${(1 - pop) * 30}px) scale(${1 + pulse * 0.03})`, boxShadow: glowShadow(pulse) }}>
            <Ico n="refresh" size={36} color={ACC} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 25, color: TXT, fontWeight: 600 }}>Rever o que errei</div>
              <div style={{ fontSize: 19, color: TER, marginTop: 2 }}>3 perguntas para fixar</div>
            </div>
          </div>
        )}

        {STAGES.map((st) => {
          const n = st.ids.filter((id) => id < 3).length;
          return (
            <div key={st.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' }}>
                <span style={{ fontSize: 17, color: TER, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase' }}>{st.name}</span>
                <span style={{ fontSize: 17, color: TER }}>{n}/{st.ids.length}</span>
              </div>
              {st.ids.map((id) => (
                <Row key={id} id={id} glow={id === 3 && t >= starts[2] ? clamp01(Math.sin(t * 3) * 0.5 + 0.5) * 0.7 : 0} />
              ))}
            </div>
          );
        })}
      </div>
      <StatusBar />
      <TabBar />
    </div>
  );
}

// ── Pergunta com dica ────────────────────────────────────────────────────────
interface QuizData {
  question: string;
  opts: string[];
  correct: number;
  hidden: number[];
  body: string;
  ref: string;
  hint: boolean;
}

// Gancho: pergunta sem dica. Demonstração da dica: duas opções somem.
const Q_HOOK: QuizData = {
  question: 'Que livro reúne 150 cânticos e orações?',
  opts: ['Provérbios', 'Cantares', 'Salmos', 'Lamentações'],
  correct: 2,
  hidden: [],
  body: 'É o livro de oração e louvor do povo de Deus.',
  ref: 'Salmos',
  hint: false,
};
const Q_HINT: QuizData = {
  question: 'Qual é o primeiro livro do Novo Testamento?',
  opts: ['Marcos', 'Mateus', 'Atos', 'Romanos'],
  correct: 1,
  hidden: [2, 3],
  body: 'O Novo Testamento abre com o Evangelho de Mateus.',
  ref: 'Mateus 1:1',
  hint: true,
};
const LETTERS = ['A', 'B', 'C', 'D'];
const OPT_TOP = 300;
const STEP = 98;

function Finger({ t, at, x, y }: { t: number; at: number; x: number; y: number }) {
  const f = clamp01((t - (at - 0.8)) / 0.8);
  const fx = x + (1 - easeIO(f)) * 90;
  const fy = y + (1 - easeIO(f)) * 220;
  const press = clamp01(1 - Math.abs(t - at) / 0.16);
  const vis = clamp01((t - (at - 0.8)) / 0.25) * (1 - clamp01((t - at - 0.5) / 0.3));
  return (
    <div
      style={{
        position: 'absolute',
        left: fx - 38,
        top: fy - 38,
        width: 76,
        height: 76,
        borderRadius: 38,
        background: 'rgba(35,42,38,.28)',
        border: '3px solid rgba(255,255,255,.9)',
        boxShadow: `0 6px 20px rgba(0,0,0,.35), 0 0 0 ${press * 22}px rgba(74,107,87,${0.28 * press})`,
        transform: `scale(${1 - press * 0.25})`,
        opacity: vis,
        zIndex: 6,
      }}
    />
  );
}

function Quiz({ d, t, tapHint, tapRight }: { d: QuizData; t: number; tapHint: number; tapRight: number }) {
  const answered = t >= tapRight + 0.12;
  const a = easeIO(clamp01((t - tapRight - 0.12) / 0.5));
  const h = d.hint ? easeIO(clamp01((t - tapHint - 0.15) / 0.6)) : 0;
  const hintPress = d.hint && t > tapHint - 0.05 && h === 0;
  const fill = 10 * a;
  const row = d.hint ? d.correct - d.hidden.filter((x) => x < d.correct).length : d.correct;

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT, overflow: 'hidden' }}>
      <StatusBar />
      <div style={{ position: 'absolute', left: 30, right: 30, top: 76 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Ico n="close" size={32} color={SEC} />
          <span style={{ fontSize: 21, color: SEC, letterSpacing: 0.5 }}>Nível 3 · Livros da Bíblia</span>
          <span style={{ fontSize: 21, color: TER }}>1/10</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: '#E4E8E2', marginBottom: 30, overflow: 'hidden' }}>
          <div style={{ height: 7, width: `${fill}%`, background: ACC }} />
        </div>
        <div style={{ fontSize: 38, color: TXT, lineHeight: '49px' }}>{d.question}</div>
      </div>

      <div style={{ position: 'absolute', left: 30, right: 30, top: OPT_TOP }}>
        {d.opts.map((opt, i) => {
          const hid = d.hidden.includes(i);
          const right = answered && i === d.correct;
          return (
            <div key={opt} style={{ height: hid ? STEP * (1 - h) : STEP, opacity: hid ? 1 - h * 1.3 : 1, overflow: 'hidden' }}>
              <div
                style={{
                  height: 84,
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '0 22px',
                  background: right ? ACC_L : SURF,
                  border: `3px solid ${right ? OK : BORDER}`,
                  borderRadius: 24,
                  transform: right && a < 1 ? 'scale(.985)' : undefined,
                }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 19, background: ACC_L, color: TXT, fontSize: 21, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{LETTERS[i]}</span>
                <span style={{ flex: 1, fontSize: 29, color: TXT, fontWeight: right ? 600 : 400 }}>{opt}</span>
                {right && <Ico n="ok" size={36} color={OK} sw={2.2} />}
              </div>
            </div>
          );
        })}

        <div style={{ height: d.hint ? 64 * (1 - h) : 0, opacity: 1 - h * 1.5, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
          {d.hint && !answered && (
            <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderRadius: 28, background: hintPress ? ACC_L : 'transparent' }}>
              <Ico n="bulb" size={26} color={ACC} />
              <span style={{ fontSize: 23, color: ACC, fontWeight: 600 }}>Dica: tirar duas erradas</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 6, background: SURF, borderRadius: 24, padding: '18px 22px', opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: OK, marginBottom: 6 }}>Certo!</div>
          <div style={{ fontSize: 24, color: TXT, lineHeight: '34px' }}>{d.body}</div>
          <div style={{ fontSize: 20, color: TER, marginTop: 10 }}>{d.ref}</div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 30, right: 30, bottom: 36, height: 78, borderRadius: 39, background: ACC, color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: a }}>Seguinte</div>

      {d.hint && <Finger t={t} at={tapHint} x={280} y={OPT_TOP + 4 * STEP + 32} />}
      <Finger t={t} at={tapRight} x={380} y={OPT_TOP + row * STEP + 42} />
    </div>
  );
}

// ── Resultado ────────────────────────────────────────────────────────────────
function Result({ t, from }: { t: number; from: number }) {
  const a = easeIO(clamp01((t - from) / 0.6));
  const n = Math.round(8 * easeIO(clamp01((t - from - 0.2) / 1.1)));
  const c1 = easeIO(clamp01((t - from - 1.4) / 0.5));
  const c2 = easeIO(clamp01((t - from - 2.7) / 0.5));
  const card = (o: number, bg: string) => ({ display: 'flex', alignItems: 'center', gap: 16, background: bg, borderRadius: 24, padding: 18, marginBottom: 12, opacity: o, transform: `translateY(${(1 - o) * 30}px)` }) as const;
  const btn = (primary: boolean) => ({ height: 72, borderRadius: 36, background: primary ? ACC : 'transparent', color: primary ? '#fff' : SEC, fontSize: primary ? 27 : 24, fontWeight: primary ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }) as const;
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT }}>
      <StatusBar />
      <div style={{ padding: '96px 30px 0' }}>
        <div style={{ margin: '0 auto 14px', width: 130, height: 130, borderRadius: 65, background: ACC_L, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + a * 0.4})`, opacity: a, boxShadow: `0 0 ${60 * a}px rgba(212,168,75,.55)` }}>
          <Ico n="star" size={80} color={GOLD} fill="#f2c56b" sw={1.6} />
        </div>
        <div style={{ fontSize: 52, fontWeight: 300, color: TXT, textAlign: 'center', marginBottom: 8 }}>{n} de 10 certas</div>
        <div style={{ fontSize: 24, color: SEC, lineHeight: '34px', textAlign: 'center', marginBottom: 26, opacity: a }}>Muito bem! O próximo nível está desbloqueado.</div>
        <div style={card(c1, ACC_L)}>
          <Ico n="ok" size={34} color={OK} />
          <div style={{ fontSize: 24, color: TXT, fontWeight: 600 }}>Meta de hoje cumprida. Bom trabalho!</div>
        </div>
        <div style={card(c2, SURF)}>
          <Ico n="sprout" size={36} color={ACC} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, color: TXT, fontWeight: 600 }}>Nova conquista: Aprendiz</div>
            <div style={{ fontSize: 19, color: TER, marginTop: 2 }}>Completaste o nível 3.</div>
          </div>
        </div>
        <div style={{ marginTop: 22, opacity: a }}>
          <div style={btn(true)}>Próximo nível</div>
          <div style={btn(false)}>Repetir este nível</div>
          <div style={btn(false)}>Voltar aos níveis</div>
        </div>
      </div>
    </div>
  );
}

// ── Conquistas ───────────────────────────────────────────────────────────────
const CHIPS: [string, string, boolean][] = [
  ['Primeiro passo', 'steps', true],
  ['Três dias seguidos', 'flame', true],
  ['Aprendiz', 'sprout', true],
  ['Ronda perfeita', 'ok', false],
  ['Uma semana de estudo', 'cal', false],
  ['500 pontos', 'star', false],
  ['Estudante da Palavra', 'book', false],
  ['Fiel ao estudo', 'medal', false],
  ['Mestre da Palavra', 'crown', false],
];

function Badges({ t, from }: { t: number; from: number }) {
  const a = easeIO(clamp01((t - from) / 0.5));
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT }}>
      <StatusBar />
      <div style={{ padding: '96px 30px 0' }}>
        <div style={{ fontSize: 42, fontWeight: 300, color: TXT, marginBottom: 22, opacity: a }}>Aprender a Bíblia</div>
        <div style={{ display: 'flex', marginBottom: 26, opacity: a }}>
          <Stat icon="flame" value="4 dias" label="seguidos" />
          <Stat icon="star" value="260" label="pontos" />
          <Stat icon="checkall" value="8" label="certas seguidas" />
        </div>
        <div style={{ fontSize: 34, color: TXT, fontWeight: 500, marginBottom: 16, opacity: a }}>Conquistas</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {CHIPS.map(([title, icon, got], i) => {
            const p = easeIO(clamp01((t - from - 0.4 - i * 0.16) / 0.4));
            return (
              <div
                key={title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 52,
                  boxSizing: 'border-box',
                  padding: '0 18px',
                  borderRadius: 999,
                  background: got ? ACC_L : SURF,
                  opacity: p,
                  transform: `scale(${0.85 + p * 0.15})`,
                  boxShadow: got ? `0 0 ${18 * (1 - Math.abs(p - 0.5) * 2)}px rgba(110,158,127,.7)` : 'none',
                }}
              >
                <Ico n={got ? icon : 'lock'} size={24} color={got ? ACC : TER} />
                <span style={{ fontSize: 21, color: got ? TXT : TER }}>{title}</span>
              </div>
            );
          })}
        </div>
      </div>
      <TabBar />
    </div>
  );
}

// ── Lembrete suave (notificação) ─────────────────────────────────────────────
function Notice({ t, at }: { t: number; at: number }) {
  const inn = easeIO(clamp01((t - at) / 0.5));
  const out = easeIO(clamp01((t - at - 3.6) / 0.5));
  const o = inn * (1 - out);
  if (o < 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        top: 64,
        zIndex: 9,
        display: 'flex',
        gap: 14,
        padding: 16,
        borderRadius: 28,
        background: 'rgba(252,252,251,.97)',
        boxShadow: '0 18px 44px rgba(0,0,0,.35)',
        fontFamily: FONT,
        opacity: o,
        transform: `translateY(${(1 - inn) * -120 - out * 60}px)`,
      }}
    >
      <Img src={staticFile('emori-icon.png')} style={{ width: 54, height: 54, borderRadius: 13 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: TXT }}>Aprender a Bíblia</span>
          <span style={{ fontSize: 17, color: TER }}>agora</span>
        </div>
        <div style={{ fontSize: 20, color: SEC, lineHeight: '27px', marginTop: 2 }}>A tua sequência de 4 dias continua. Uma ronda leve hoje a mantém.</div>
      </div>
    </div>
  );
}

const fade = (t: number, a: number, b: number, d = 0.4) => clamp01((t - a) / d) * (1 - clamp01((t - b) / d));

export function AppUI2({
  t,
  starts,
  end,
  tapHint,
  tapRight,
  badgesAt,
  remindAt,
  hookAt,
}: {
  t: number;
  starts: number[];
  end: number;
  tapHint: number;
  tapRight: number;
  badgesAt: number;
  remindAt: number;
  /** Instante em que, no gancho, o dedo toca na resposta certa. Sem isto, a cena 0 mostra o percurso. */
  hookAt?: number;
}) {
  const layer = (o: number, child: ReactNode, dx = 0) => (
    <div style={{ position: 'absolute', inset: 0, opacity: o, transform: `translateX(${(1 - o) * dx}px)`, display: o > 0.01 ? 'block' : 'none' }}>{child}</div>
  );
  const hook = hookAt !== undefined;
  return (
    <div style={{ width: 560, height: 1180, position: 'relative', overflow: 'hidden', background: BG }}>
      {hook && layer(1 - clamp01((t - starts[1]) / 0.4), <Quiz d={Q_HOOK} t={t} tapHint={Infinity} tapRight={hookAt} />, -60)}
      {layer(hook ? fade(t, starts[1], starts[3] + 0.1) : fade(t, starts[0], starts[3] + 0.1), <Home t={t} starts={starts} end={end} mode="journey" />, hook ? 60 : 0)}
      {layer(fade(t, starts[3], starts[4] + 0.1), <Quiz d={Q_HINT} t={t} tapHint={tapHint} tapRight={tapRight} />, 60)}
      {layer(fade(t, starts[4], starts[5] + 0.1), <Home t={t} starts={starts} end={end} mode="review" />, 60)}
      {layer(fade(t, starts[5], badgesAt + 0.1), <Result t={t} from={starts[5]} />, 60)}
      {layer(fade(t, badgesAt, end + 5), <Badges t={t} from={badgesAt} />, 60)}
      <Notice t={t} at={remindAt} />
    </div>
  );
}
