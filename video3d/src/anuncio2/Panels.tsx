import type { CSSProperties, ReactNode } from 'react';
import { Ico } from '../rastreio/PhoneUI';
import { clamp01, easeIO, sceneProgress } from '../rastreio/timing';
import { Cta, Oferta } from '../anuncio/Overlays';

const SANS = "'Segoe UI', Roboto, Arial, sans-serif";
const RED = '#ff4d4f';
const BLUE = '#3b82f6';
const GREEN = '#22c55e';
const ORANGE = '#F97316';
const AMBER = '#FFB347';
const CODE = 'TR-2026-10-00384';

const back = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp01(p);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function win(t: number, starts: number[], i: number, end: number, fin = 0.35, fout = 0.35) {
  const a = starts[i];
  const b = i + 1 < starts.length ? starts[i + 1] : end + 1;
  return clamp01((t - a) / fin) * (1 - clamp01((t - (b - fout)) / fout));
}

function Abs({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', fontFamily: SANS, ...style }}>{children}</div>;
}

const STOPS = [0, 0.33, 0.66, 1];

// ── Cena 2: a perda do rasto ────────────────────────────────────────────────
function Perda({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const p = sceneProgress(t, starts, 1, end);
  const e = back(clamp01((p - 0.52) / 0.12));
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 230, textAlign: 'center', color: '#fff', fontSize: 88, fontWeight: 900, lineHeight: 1.05, opacity: clamp01(p / 0.1), textShadow: '0 10px 40px rgba(255,60,60,.55)' }}>
        SEM CONTROLO<br />
        <span style={{ color: RED }}>DO PERCURSO</span>
      </Abs>
      {e > 0 && (
        <Abs
          style={{
            left: 90,
            top: 1130,
            padding: '18px 36px',
            borderRadius: 24,
            background: RED,
            color: '#fff',
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            transform: `rotate(-2deg) scale(${0.5 + e * 0.5 + (1 - e) * 0.8})`,
            opacity: Math.min(1, e * 3),
            boxShadow: '0 20px 60px rgba(255,40,40,.5)',
          }}
        >
          TRECHO SEM RESPONSÁVEL
        </Abs>
      )}
    </>
  );
}

// ── Cena 3: o percurso, paragem a paragem ───────────────────────────────────
const PARAGENS = [
  { c: 'Maputo', s: 'Recebida · código emitido' },
  { c: 'Xai-Xai', s: 'A caminho · Viatura MMB-12-34' },
  { c: 'Inhambane', s: 'A caminho · Viatura MMB-12-34' },
  { c: 'Beira', s: 'Chegou ao destino' },
];

function Percurso({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const a = starts[2];
  const b = starts[3];
  const chase = clamp01((t - a - 0.5) / Math.max(1, b - a - 1.2));
  const chip = back(clamp01((t - a) / 0.5));
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 150, textAlign: 'center', transform: `scale(${chip})`, opacity: clamp01((t - a) / 0.3) }}>
        <div style={{ display: 'inline-block', padding: '14px 34px', borderRadius: 999, background: 'rgba(15,23,60,.92)', border: `2px solid ${BLUE}`, color: '#cfe0ff', fontSize: 38, fontWeight: 700 }}>
          Código único · <span style={{ color: '#fff', letterSpacing: 2 }}>{CODE}</span>
        </div>
      </Abs>
      {PARAGENS.map((g, i) => {
        const q = back(clamp01((chase - (STOPS[i] - 0.01)) / 0.1));
        if (q <= 0.01) return null;
        return (
          <Abs
            key={i}
            style={{
              right: 40,
              top: 290 + i * 128,
              width: 640,
              padding: '16px 26px',
              borderRadius: 26,
              background: 'rgba(12,20,52,.92)',
              border: `2px solid ${i === 3 ? GREEN : BLUE}`,
              boxShadow: `0 12px 36px ${i === 3 ? 'rgba(34,197,94,.35)' : 'rgba(59,130,246,.35)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              transform: `translateX(${(1 - q) * 300}px)`,
              opacity: Math.min(1, q * 2),
            }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 29, background: i === 3 ? GREEN : BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Ico n={i === 3 ? 'check' : i === 0 ? 'box' : 'truck'} size={32} color="#fff" sw={2.6} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 38, fontWeight: 800, lineHeight: 1.05 }}>{g.c}</div>
              <div style={{ color: '#aac4ff', fontSize: 27 }}>{g.s}</div>
            </div>
          </Abs>
        );
      })}
    </>
  );
}

// ── Cena 4: o painel de controlo ────────────────────────────────────────────
const TRECHOS = [
  { r: 'Maputo → Xai-Xai', q: 'Viatura MMB-12-34', h: '27 out., 08:15' },
  { r: 'Xai-Xai → Inhambane', q: 'Viatura MMB-12-34', h: '27 out., 17:40' },
  { r: 'Inhambane → Beira', q: 'Viatura MMB-98-76', h: '28 out., 22:05' },
];

function Controlo({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const p = sceneProgress(t, starts, 3, end);
  const e = back(clamp01(p / 0.14));
  const float = Math.sin(t * 1.1) * 6;
  const rotY = -9 + Math.sin(t * 0.8) * 2.5;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, perspective: 1800 }}>
      <Abs
        style={{
          left: 70,
          top: 520 + float,
          width: 940,
          padding: '30px 34px',
          borderRadius: 38,
          background: 'linear-gradient(145deg,rgba(37,99,235,.34),rgba(10,16,46,.95))',
          border: '2px solid rgba(96,165,250,.7)',
          boxShadow: '0 40px 90px rgba(0,0,0,.6), 0 0 60px rgba(59,130,246,.35)',
          transformOrigin: '50% 100%',
          transform: `rotateX(${(1 - e) * 50 + 7}deg) rotateY(${rotY}deg) scale(${0.92 + e * 0.08})`,
          opacity: Math.min(1, e * 2),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#9ec0ff', fontSize: 26, letterSpacing: 4, fontWeight: 700 }}>CONTROLO DA CARGA</div>
            <div style={{ color: '#fff', fontSize: 50, fontWeight: 900, letterSpacing: 1 }}>{CODE}</div>
          </div>
          <div style={{ background: GREEN, color: '#fff', borderRadius: 999, padding: '10px 26px', fontSize: 30, fontWeight: 800 }}>Entregue</div>
        </div>

        {TRECHOS.map((r, i) => {
          const q = back(clamp01((p - (0.16 + i * 0.17)) / 0.14));
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '18px 20px', marginBottom: 12, borderRadius: 22, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', transform: `translateX(${(1 - q) * 120}px)`, opacity: Math.min(1, q * 2) }}>
              <Ico n="truck" size={44} color={AMBER} sw={2.4} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 36, fontWeight: 800 }}>{r.r}</div>
                <div style={{ color: AMBER, fontSize: 29, fontWeight: 700 }}>Responsável: {r.q}</div>
              </div>
              <div style={{ color: '#b7cdff', fontSize: 27, textAlign: 'right' }}>{r.h}</div>
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: 18, marginTop: 8, opacity: clamp01((p - 0.7) / 0.15) }}>
          {[
            ['Recebidas', '128'],
            ['Entregues', '119'],
          ].map(([a, b]) => (
            <div key={a} style={{ flex: 1, padding: '14px 22px', borderRadius: 20, background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.45)' }}>
              <div style={{ color: '#a7f3c4', fontSize: 24 }}>{a} este mês</div>
              <div style={{ color: '#fff', fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ color: 'rgba(200,215,255,.55)', fontSize: 20, textAlign: 'right', marginTop: 10 }}>Dados de exemplo</div>
      </Abs>
    </div>
  );
}

// ── Cena 5: o cliente vê tudo, e a entrega fica provada ─────────────────────
function Caixa() {
  return (
    <div style={{ position: 'relative', width: 230, height: 190, borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(160deg,#cdbfa8,#9a8a70)', flex: 'none' }}>
      <div style={{ position: 'absolute', left: 48, top: 44, width: 130, height: 100, background: 'linear-gradient(180deg,#c89a5c,#b48443)', borderRadius: 5, boxShadow: '0 16px 20px rgba(0,0,0,.35)' }}>
        <div style={{ position: 'absolute', left: 52, top: 0, width: 24, height: 100, background: 'rgba(226,206,160,.8)' }} />
        <div style={{ position: 'absolute', left: 10, top: 56, width: 34, height: 30, background: '#fff', borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Cliente({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const p = sceneProgress(t, starts, 4, end);
  const e1 = back(clamp01((p - 0.02) / 0.16));
  const e2 = back(clamp01((p - 0.5) / 0.16));
  const card = (e: number, border: string): CSSProperties => ({
    position: 'relative',
    width: 940,
    padding: '28px 34px',
    borderRadius: 36,
    background: 'linear-gradient(135deg,rgba(37,99,235,.34),rgba(10,16,46,.95))',
    border: `2px solid ${border}`,
    boxShadow: `0 30px 70px rgba(0,0,0,.55), 0 0 50px ${border}55`,
    display: 'flex',
    alignItems: 'center',
    gap: 30,
    transformOrigin: '50% 100%',
    transform: `rotateX(${(1 - e) * 55}deg) translateY(${(1 - e) * 110}px)`,
    opacity: Math.min(1, e * 2.2),
  });
  return (
    <div style={{ position: 'absolute', left: 70, top: 540, width: 940, perspective: 1800, fontFamily: SANS, display: 'flex', flexDirection: 'column', gap: 30 }}>
      <div style={card(e1, BLUE)}>
        <Caixa />
        <div>
          <div style={{ color: '#9ec0ff', fontSize: 26, letterSpacing: 3, fontWeight: 700 }}>O CLIENTE RASTREIA SOZINHO</div>
          <div style={{ color: '#fff', fontSize: 44, fontWeight: 900 }}>{CODE}</div>
          <div style={{ color: '#cfe0ff', fontSize: 31, marginTop: 6 }}>Percurso, estado e a <span style={{ color: AMBER, fontWeight: 800 }}>foto da carga</span> na recepção</div>
        </div>
      </div>
      <div style={card(e2, GREEN)}>
        <div style={{ width: 230, flex: 'none' }}>
          <svg width="230" height="150" viewBox="0 0 230 150">
            <rect x="0" y="0" width="230" height="150" rx="18" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" />
            <path d="M24 100 C 44 40, 62 40, 74 86 S 100 118, 118 70 S 150 48, 164 92 S 190 90, 206 56" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="520" strokeDashoffset={520 * (1 - clamp01((p - 0.55) / 0.3))} />
          </svg>
        </div>
        <div>
          <div style={{ color: '#86efac', fontSize: 26, letterSpacing: 3, fontWeight: 700 }}>ENTREGA PROVADA</div>
          <div style={{ color: '#fff', fontSize: 46, fontWeight: 900 }}>Foto + assinatura</div>
          <div style={{ color: '#cfe0ff', fontSize: 30, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Ico n="check" size={34} color={GREEN} sw={3.4} /> Prova guardada para qualquer reclamação
          </div>
        </div>
      </div>
    </div>
  );
}

export function OverlaysB({ t, starts, end, site, cta }: { t: number; starts: number[]; end: number; site: string; cta: string }) {
  const w = (i: number) => win(t, starts, i, end);
  // Oferta e CTA reutilizam os do criativo A: esperam os seus tempos nos índices 4 e 5.
  const startsAB = [0, 0, 0, 0, starts[5], starts[6]];
  return (
    <>
      {w(1) > 0 && <div style={{ opacity: w(1) }}><Perda t={t} starts={starts} end={end} /></div>}
      {w(2) > 0 && <div style={{ opacity: w(2) }}><Percurso t={t} starts={starts} end={end} /></div>}
      {w(3) > 0 && <div style={{ opacity: w(3) }}><Controlo t={t} starts={starts} end={end} /></div>}
      {w(4) > 0 && <div style={{ opacity: w(4) }}><Cliente t={t} starts={starts} end={end} /></div>}
      {w(5) > 0 && <div style={{ opacity: w(5) }}><Oferta t={t} starts={startsAB} end={end} /></div>}
      {w(6) > 0 && <div style={{ opacity: Math.min(1, w(6) * 1.3) }}><Cta t={t} starts={startsAB} end={end} site={site} cta={cta} /></div>}
    </>
  );
}

export { easeIO, ORANGE };
