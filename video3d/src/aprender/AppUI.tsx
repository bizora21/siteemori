import type { CSSProperties, ReactNode } from 'react';
import { clamp01, easeIO, sceneProgress } from '../rastreio/timing';

// Ecrã "Aprender a Bíblia" desenhado como na app real (LearnScreen.tsx), com a paleta
// clara do tema: fundo #F4F5F3, cartão #EAECE8, musgo #4A6B57. Dados de DEMONSTRAÇÃO.

const BG = '#F4F5F3';
const SURF = '#EAECE8';
const TXT = '#232A26';
const SEC = '#4A534D';
const TER = '#6B756E';
const ACC = '#4A6B57';
const ACC_L = '#C3D2C8';
const BORDER = '#D2D8D0';
const OK = '#6E9E7F';
const ERR = '#A85A50';
const FONT = "Roboto, 'Segoe UI', Arial, sans-serif";

const ICONS: Record<string, string> = {
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 118 0v3',
  book: 'M2 5c3-1.5 6-1.5 10 1 4-2.5 7-2.5 10-1v13c-3-1.5-6-1.5-10 1-4-2.5-7-2.5-10-1z M12 6v13',
  checkall: 'M2 13l4 4L14 8 M10 15l2 2L21 7',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  close: 'M6 6l12 12 M18 6L6 18',
  ok: 'M12 21a9 9 0 100-18 9 9 0 000 18z M8 12.5l3 3 5-6',
  no: 'M12 21a9 9 0 100-18 9 9 0 000 18z M9 9l6 6 M15 9l-6 6',
  pray: 'M12 3v5 M8 8c0 6-2 8-3 12h14c-1-4-3-6-3-12 M12 8v6',
  people: 'M9 11a3 3 0 100-6 3 3 0 000 6z M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5 M17 11a2.5 2.5 0 100-5 M16 14.5c3 0 5 1.8 5 4.5',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  user: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 12a3 3 0 100-6 3 3 0 000 6z M6.5 18c1.5-2.5 3.2-3.2 5.5-3.2s4 .7 5.5 3.2',
};

function Ico({ n, size = 30, color = TER, sw = 2, fill }: { n: string; size?: number; color?: string; sw?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ?? 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[n]} />
    </svg>
  );
}

const LEVELS = [
  { id: 1, title: 'Primeiros passos', sub: 'As histórias que todos conhecem', best: 90 },
  { id: 2, title: 'Personagens', sub: 'Homens e mulheres de fé', best: 80 },
  { id: 3, title: 'Livros da Bíblia', sub: 'Conhecer a estrutura e a ordem' },
  { id: 4, title: 'Ensinos de Jesus', sub: 'Parábolas, milagres e palavras' },
  { id: 5, title: 'Profetas e Salmos', sub: 'A voz de Deus ao longo dos séculos' },
  { id: 6, title: 'Aprofundar', sub: 'Para quem já conhece bem a Palavra' },
];

function StatusBar() {
  return (
    <div style={{ height: 52, color: TXT, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', fontSize: 22, fontWeight: 600 }}>
      <span>9:41</span>
      <span style={{ letterSpacing: 3 }}>●●● ▮</span>
    </div>
  );
}

function TabBar() {
  const items = ['pray', 'people', 'book', 'cal', 'user'];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 100, background: BG, borderTop: `1.5px solid ${BORDER}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      {items.map((n) => (
        <Ico key={n} n={n} size={42} color={n === 'book' ? ACC : '#8a948d'} sw={n === 'book' ? 2.4 : 2} />
      ))}
    </div>
  );
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Ico n={icon} size={26} color={ACC} />
      <span style={{ fontSize: 23, color: SEC }}>{label}</span>
    </div>
  );
}

function Home({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  // Cena 3 (níveis): primeiro destaca dias/pontos, depois o nível 3 desbloqueia-se.
  const p = sceneProgress(t, starts, 2, end);
  const inScene = t >= starts[2] - 0.2 && t < starts[3] ? 1 : 0;
  const glowStats = inScene * clamp01(Math.sin(clamp01(p / 0.5) * Math.PI) * 1.6);
  const unlock = easeIO(clamp01((p - 0.58) / 0.14));
  const pop = clamp01(Math.sin(clamp01((p - 0.58) / 0.3) * Math.PI) * 1.4) * inScene;
  const glowFirst = t < starts[2] ? 0 : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT }}>
      <StatusBar />
      <div style={{ padding: '26px 30px 0' }}>
        <div style={{ fontSize: 42, fontWeight: 300, color: TXT, marginBottom: 6 }}>Aprender a Bíblia</div>
        <div style={{ fontSize: 23, color: SEC, lineHeight: '32px', marginBottom: 22 }}>Pergunta a pergunta, do mais fácil ao mais profundo.</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 14px',
            margin: '0 -14px 14px',
            borderRadius: 18,
            background: `rgba(74,107,87,${0.12 * glowStats})`,
            boxShadow: glowStats > 0 ? `0 0 0 ${3 * glowStats}px rgba(74,107,87,${0.7 * glowStats})` : 'none',
          }}
        >
          <Stat icon="flame" label="3 dias" />
          <Stat icon="star" label="180 pontos" />
          <Stat icon="checkall" label="7 seguidas" />
        </div>
        {LEVELS.map((l) => {
          const isThree = l.id === 3;
          const locked = isThree ? unlock < 0.5 : l.id > 3;
          const showBest = l.best !== undefined;
          return (
            <div
              key={l.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                background: SURF,
                borderRadius: 24,
                padding: 18,
                marginBottom: 12,
                opacity: locked ? 0.55 : 1,
                transform: isThree ? `scale(${1 + pop * 0.035})` : undefined,
                boxShadow: isThree && pop > 0 ? `0 0 0 ${4 * pop}px rgba(74,107,87,${0.75 * pop}), 0 10px 30px rgba(74,107,87,${0.3 * pop})` : glowFirst ? 'none' : 'none',
              }}
            >
              <div style={{ width: 62, height: 62, borderRadius: 31, background: ACC_L, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico n={locked ? 'lock' : 'book'} size={32} color={locked ? TER : ACC} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 27, color: TXT, fontWeight: 500 }}>
                  Nível {l.id} · {l.title}
                </div>
                <div style={{ fontSize: 20, color: SEC, marginTop: 3 }}>{locked ? `Completa o nível ${l.id - 1} com 70%` : l.sub}</div>
              </div>
              {showBest && <div style={{ fontSize: 24, color: ACC, fontWeight: 600 }}>{l.best}%</div>}
            </div>
          );
        })}
      </div>
      <TabBar />
    </div>
  );
}

// ── Pergunta ────────────────────────────────────────────────────────────────
interface QuizData {
  level: string;
  count: string;
  fill: [number, number];
  question: string;
  options: string[];
  correct: number;
  pick: number;
  head: string;
  body: string;
  ref: string;
}

const OPT_TOP = 372;
const OPT_STEP = 98;
export const optionCenter = (i: number) => OPT_TOP + i * OPT_STEP + 42;

function Quiz({ d, t, tap }: { d: QuizData; t: number; tap: number }) {
  const answered = t >= tap + 0.12;
  const a = easeIO(clamp01((t - tap - 0.12) / 0.5));
  const good = d.pick === d.correct;
  const fill = d.fill[0] + (d.fill[1] - d.fill[0]) * a;

  // Dedo: aproxima-se da opção escolhida e carrega.
  const f = clamp01((t - (tap - 0.8)) / 0.8);
  const fx = 400 + (1 - easeIO(f)) * 90;
  const fy = optionCenter(d.pick) + (1 - easeIO(f)) * 220;
  const press = clamp01(1 - Math.abs(t - tap) / 0.16);
  const fingerVis = clamp01((t - (tap - 0.8)) / 0.25) * (1 - clamp01((t - tap - 0.5) / 0.3));

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT }}>
      <StatusBar />
      <div style={{ padding: '24px 30px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Ico n="close" size={32} color={SEC} />
          <span style={{ fontSize: 21, color: SEC, letterSpacing: 0.5 }}>{d.level}</span>
          <span style={{ fontSize: 21, color: TER }}>{d.count}</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: '#E4E8E2', marginBottom: 30, overflow: 'hidden' }}>
          <div style={{ height: 7, width: `${fill}%`, background: ACC }} />
        </div>
        <div style={{ fontSize: 38, color: TXT, lineHeight: '49px', marginBottom: 0, fontWeight: 400 }}>{d.question}</div>
      </div>

      {d.options.map((opt, i) => {
        const right = answered && i === d.correct;
        const wrong = answered && i === d.pick && i !== d.correct;
        const chosen = !answered && i === d.pick && t > tap - 0.05;
        return (
          <div
            key={opt}
            style={{
              position: 'absolute',
              left: 30,
              right: 30,
              top: OPT_TOP + i * OPT_STEP,
              height: 84,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              background: right ? ACC_L : SURF,
              border: `3px solid ${right ? OK : wrong ? ERR : BORDER}`,
              borderRadius: 24,
              opacity: 1,
              transform: chosen ? 'scale(.985)' : undefined,
            }}
          >
            <span style={{ fontSize: 29, color: TXT, fontWeight: right || wrong ? 600 : 400 }}>{opt}</span>
            {right && <Ico n="ok" size={36} color={OK} sw={2.2} />}
            {wrong && <Ico n="no" size={36} color={ERR} sw={2.2} />}
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          top: OPT_TOP + 4 * OPT_STEP + 6,
          background: SURF,
          borderRadius: 24,
          padding: '20px 24px',
          opacity: a,
          transform: `translateY(${(1 - a) * 40}px)`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: good ? OK : ERR, marginBottom: 6 }}>{d.head}</div>
        <div style={{ fontSize: 24, color: TXT, lineHeight: '34px' }}>{d.body}</div>
        <div style={{ fontSize: 20, color: TER, marginTop: 10 }}>{d.ref}</div>
      </div>

      <div style={{ position: 'absolute', left: 30, right: 30, bottom: 36, height: 78, borderRadius: 39, background: ACC, color: '#fff', fontSize: 28, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: a }}>
        Seguinte
      </div>

      {/* dedo */}
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
          opacity: fingerVis,
        }}
      />
    </div>
  );
}

const QA: QuizData = {
  level: 'Nível 1 · Primeiros passos',
  count: '1/10',
  fill: [0, 10],
  question: 'Quem construiu a arca para sobreviver ao dilúvio?',
  options: ['Moisés', 'Noé', 'Davi', 'Abraão'],
  correct: 1,
  pick: 1,
  head: 'Certo!',
  body: 'Deus avisou Noé e ele construiu a arca segundo as instruções recebidas.',
  ref: 'Génesis 6:14-22',
};

const QB: QuizData = {
  level: 'Nível 1 · Primeiros passos',
  count: '5/10',
  fill: [40, 50],
  question: 'Quem foi engolido por um grande peixe?',
  options: ['Daniel', 'Elias', 'Jonas', 'Pedro'],
  correct: 2,
  pick: 0,
  head: 'Não foi desta.',
  body: 'Jonas fugiu da missão que Deus lhe deu e passou três dias dentro do peixe.',
  ref: 'Jonas 1:17',
};

function Result({ t, from }: { t: number; from: number }) {
  const a = easeIO(clamp01((t - from) / 0.6));
  const n = Math.round(8 * easeIO(clamp01((t - from - 0.2) / 1.1)));
  const btn = (primary: boolean): CSSProperties => ({
    height: 78,
    borderRadius: 39,
    background: primary ? ACC : 'transparent',
    color: primary ? '#fff' : SEC,
    fontSize: primary ? 28 : 25,
    fontWeight: primary ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  });
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, fontFamily: FONT }}>
      <StatusBar />
      <div style={{ padding: '140px 40px 0', textAlign: 'center' }}>
        <div style={{ margin: '0 auto 22px', width: 150, height: 150, borderRadius: 75, background: ACC_L, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + a * 0.4})`, opacity: a, boxShadow: `0 0 ${60 * a}px rgba(212,168,75,.55)` }}>
          <Ico n="star" size={92} color="#c99a2e" fill="#f2c56b" sw={1.6} />
        </div>
        <div style={{ fontSize: 66, fontWeight: 300, color: TXT, marginBottom: 12 }}>{n} de 10</div>
        <div style={{ fontSize: 27, color: SEC, lineHeight: '38px', marginBottom: 52, opacity: a }}>Muito bem! O próximo nível está desbloqueado.</div>
        <div style={{ opacity: a }}>
          <div style={btn(true)}>Próximo nível</div>
          <div style={btn(false)}>Repetir este nível</div>
          <div style={btn(false)}>Voltar aos níveis</div>
        </div>
      </div>
    </div>
  );
}

const fade = (t: number, a: number, b: number, d = 0.4) => clamp01((t - a) / d) * (1 - clamp01((t - b) / d));

export function AppUI({ t, starts, end, tapRight, tapWrong }: { t: number; starts: number[]; end: number; tapRight: number; tapWrong: number }) {
  const layer = (o: number, child: ReactNode, dx = 0) => (
    <div style={{ position: 'absolute', inset: 0, opacity: o, transform: `translateX(${(1 - o) * dx}px)`, display: o > 0.01 ? 'block' : 'none' }}>{child}</div>
  );
  return (
    <div style={{ width: 560, height: 1180, position: 'relative', overflow: 'hidden', background: BG }}>
      {layer(fade(t, starts[0], starts[3] + 0.1), <Home t={t} starts={starts} end={end} />)}
      {layer(fade(t, starts[3], starts[4] + 0.1), <Quiz d={QA} t={t} tap={tapRight} />, 60)}
      {layer(fade(t, starts[4], starts[5] + 0.1), <Quiz d={QB} t={t} tap={tapWrong} />, 60)}
      {layer(fade(t, starts[5], end + 5), <Result t={t} from={starts[5]} />, 60)}
    </div>
  );
}
