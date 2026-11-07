import type { CSSProperties, ReactNode } from 'react';
import { Ico } from '../rastreio/PhoneUI';
import { clamp01, easeIO, sceneProgress } from '../rastreio/timing';

const SANS = "'Segoe UI', Roboto, Arial, sans-serif";
const RED = '#ff4d4f';
const BLUE = '#3b82f6';
const ORANGE = '#F97316';
const AMBER = '#FFB347';

const back = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp01(p);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Visível durante a cena `i` (com entrada e saída suaves). */
function win(t: number, starts: number[], i: number, end: number, fin = 0.35, fout = 0.35) {
  const a = starts[i];
  const b = i + 1 < starts.length ? starts[i + 1] : end + 1;
  return clamp01((t - a) / fin) * (1 - clamp01((t - (b - fout)) / fout));
}

function Abs({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'absolute', fontFamily: SANS, ...style }}>{children}</div>;
}

// ── Cena 1: o gancho — chamadas a chover ─────────────────────────────────────
function Chamadas({ t, starts }: { t: number; starts: number[] }) {
  const items = [
    { y: 600, x: 40, n: 'Cliente' },
    { y: 770, x: 330, n: 'Cliente' },
    { y: 940, x: 40, n: 'Cliente' },
    { y: 1110, x: 330, n: 'Cliente' },
    { y: 1280, x: 40, n: 'Cliente' },
  ];
  return (
    <>
      {items.map((it, k) => {
        const p = clamp01((t - (starts[0] + 0.5 + k * 0.42)) / 0.5);
        if (p <= 0) return null;
        const e = back(p);
        const fromX = k % 2 ? 500 : -500;
        return (
          <Abs
            key={k}
            style={{
              left: it.x,
              top: it.y,
              width: 700,
              padding: '22px 28px',
              borderRadius: 30,
              background: 'rgba(18,24,48,.92)',
              border: `2px solid ${RED}`,
              boxShadow: `0 14px 40px rgba(255,60,60,.35)`,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              transform: `translateX(${(1 - e) * fromX}px) rotate(${(k % 2 ? 2 : -2) * (1 - p) * 4}deg)`,
              opacity: Math.min(1, p * 2),
            }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 34, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Ico n="send" size={36} color="#fff" sw={2.6} />
            </div>
            <div>
              <div style={{ color: '#ff9b9d', fontSize: 26, fontWeight: 700 }}>{it.n} a ligar…</div>
              <div style={{ color: '#fff', fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>Onde está a minha encomenda?</div>
            </div>
          </Abs>
        );
      })}
    </>
  );
}

// ── Cena 2: o problema — selos ───────────────────────────────────────────────
function Selo({ text, p, rot, style, big }: { text: string; p: number; rot: number; style: CSSProperties; big?: boolean }) {
  if (p <= 0) return null;
  const e = back(p);
  return (
    <Abs
      style={{
        padding: big ? '20px 46px' : '14px 38px',
        border: `${big ? 10 : 8}px solid ${RED}`,
        borderRadius: 22,
        color: big ? '#fff' : RED,
        background: big ? RED : 'rgba(255,77,79,.14)',
        fontWeight: 900,
        fontSize: big ? 88 : 104,
        letterSpacing: 4,
        whiteSpace: 'nowrap',
        textShadow: big ? 'none' : '0 0 30px rgba(255,60,60,.6)',
        transform: `rotate(${rot}deg) scale(${0.4 + e * 0.6 + (1 - p) * 1.4})`,
        opacity: Math.min(1, p * 3),
        boxShadow: '0 20px 60px rgba(255,40,40,.45)',
        ...style,
      }}
    >
      {text}
    </Abs>
  );
}

function Problema({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const p = sceneProgress(t, starts, 1, end);
  const f = (a: number) => clamp01((p - a) / 0.1);
  return (
    <>
      <Selo text="DANO" p={f(0.14)} rot={-8} style={{ left: 70, top: 600 }} />
      <Selo text="ATRASO" p={f(0.3)} rot={6} style={{ right: 60, top: 790 }} />
      <Selo text="QUEM PROVA?" p={f(0.5)} rot={-3} style={{ left: 110, top: 1000, color: '#fff', borderColor: '#fff', background: 'rgba(255,255,255,.1)', fontSize: 92 }} />
      <Abs style={{ left: 0, right: 0, top: 300, textAlign: 'center', color: '#fff', fontSize: 92, fontWeight: 900, lineHeight: 1.05, opacity: clamp01((p - 0.02) / 0.1), textShadow: '0 10px 40px rgba(255,60,60,.6)' }}>
        E SE A CARGA<br />
        <span style={{ color: RED }}>FALHAR?</span>
      </Abs>
      <Selo text="SEM PROVA," p={f(0.78)} rot={2} big style={{ left: 150, top: 1215, fontSize: 84 }} />
      <Selo text="VOCÊ PAGA" p={f(0.84)} rot={-2} big style={{ left: 250, top: 1345, fontSize: 84 }} />
    </>
  );
}

// ── Cena 4: funcionalidades — cartões 3D ─────────────────────────────────────
function Cartao({ p, y, icone, titulo, sub, cor }: { p: number; y: number; icone: string; titulo: string; sub: string; cor: string }) {
  if (p <= 0) return null;
  const e = back(p);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, perspective: 1800, pointerEvents: 'none' }}>
      <Abs
        style={{
          left: 90,
          top: y,
          width: 900,
          padding: '34px 40px',
          borderRadius: 36,
          background: 'linear-gradient(135deg,rgba(37,99,235,.38),rgba(15,23,60,.92))',
          border: `2px solid ${cor}`,
          boxShadow: `0 30px 70px rgba(0,0,0,.5), 0 0 50px ${cor}55`,
          display: 'flex',
          alignItems: 'center',
          gap: 34,
          transformOrigin: '50% 100%',
          transform: `rotateX(${(1 - e) * 55}deg) translateY(${(1 - e) * 120}px) scale(${0.9 + e * 0.1})`,
          opacity: Math.min(1, p * 2.2),
        }}
      >
        <div style={{ width: 130, height: 130, borderRadius: 34, background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: `0 0 40px ${cor}aa` }}>
          <Ico n={icone} size={76} color="#fff" sw={2.4} />
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 58, fontWeight: 800, lineHeight: 1.05 }}>{titulo}</div>
          <div style={{ color: '#c8d8ff', fontSize: 36, marginTop: 8 }}>{sub}</div>
        </div>
      </Abs>
    </div>
  );
}

function Funcionalidades({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const p = sceneProgress(t, starts, 3, end);
  const f = (a: number) => clamp01((p - a) / 0.14);
  return (
    <>
      <Cartao p={f(0.02)} y={520} icone="truck" titulo="Percurso completo" sub="Responsável em cada trecho" cor="#3b82f6" />
      <Cartao p={f(0.38)} y={820} icone="camera" titulo="Prova de entrega" sub="Foto e assinatura registadas" cor="#22c55e" />
      <Cartao p={f(0.74)} y={1120} icone="check" titulo="Funciona sem internet" sub="Sincroniza quando houver rede" cor={ORANGE} />
    </>
  );
}

// ── Cena 5: a oferta — piloto gratuito ───────────────────────────────────────
export function Oferta({ t, starts, end }: { t: number; starts: number[]; end: number }) {
  const p = sceneProgress(t, starts, 4, end);
  const e1 = back(clamp01(p / 0.18));
  const e2 = back(clamp01((p - 0.1) / 0.22));
  const pulse = 1 + Math.sin(t * 6) * 0.025;
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 330, textAlign: 'center', transform: `scale(${e1})`, opacity: clamp01(p * 8) }}>
        <div style={{ display: 'inline-block', padding: '16px 46px', borderRadius: 999, background: ORANGE, color: '#fff', fontSize: 52, fontWeight: 900, letterSpacing: 5, boxShadow: '0 14px 50px rgba(249,115,22,.55)' }}>
          PILOTO GRATUITO
        </div>
      </Abs>
      <Abs
        style={{
          left: 0,
          right: 0,
          top: 450,
          textAlign: 'center',
          fontSize: 270,
          fontWeight: 900,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          background: `linear-gradient(180deg,#fff 0%,${AMBER} 45%,${ORANGE} 100%)`,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          transform: `scale(${e2 * pulse})`,
          filter: 'drop-shadow(0 18px 40px rgba(249,115,22,.5))',
        }}
      >
        7 DIAS
      </Abs>
      <Abs style={{ left: 60, right: 60, top: 820, textAlign: 'center', color: '#fff', fontSize: 54, fontWeight: 700, opacity: clamp01((p - 0.25) / 0.15) }}>
        para as <span style={{ color: AMBER }}>5 primeiras</span> transportadoras
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center', gap: 26 }}>
        {[0, 1, 2, 3, 4].map((k) => {
          const q = back(clamp01((p - (0.32 + k * 0.1)) / 0.12));
          return (
            <div key={k} style={{ width: 136, height: 136, borderRadius: 34, border: `4px solid ${q > 0.5 ? ORANGE : 'rgba(255,255,255,.35)'}`, background: q > 0.5 ? 'linear-gradient(180deg,#fb923c,#ea580c)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.85 + q * 0.15})`, boxShadow: q > 0.5 ? '0 10px 36px rgba(249,115,22,.5)' : 'none' }}>
              <Ico n={q > 0.5 ? 'check' : 'truck'} size={70} color={q > 0.5 ? '#fff' : 'rgba(255,255,255,.55)'} sw={3} />
            </div>
          );
        })}
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1190, textAlign: 'center', opacity: clamp01((p - 0.7) / 0.15) }}>
        <div style={{ display: 'inline-block', padding: '12px 40px', borderRadius: 999, border: `3px solid ${AMBER}`, color: AMBER, fontSize: 44, fontWeight: 800, letterSpacing: 3, transform: `scale(${pulse})` }}>
          VAGAS LIMITADAS
        </div>
      </Abs>
    </>
  );
}

// ── Cena 6: o CTA — Saiba mais ───────────────────────────────────────────────
export function Cta({ t, starts, end, site, cta }: { t: number; starts: number[]; end: number; site: string; cta: string }) {
  const p = sceneProgress(t, starts, 5, end);
  const e = back(clamp01(p / 0.2));
  const pulse = 1 + Math.sin(t * 5.5) * 0.03;
  // cursor: entra, toca no botão, ressalto
  const cur = clamp01((p - 0.28) / 0.22);
  const tap = clamp01(1 - Math.abs(p - 0.56) / 0.05);
  const bounce = Math.abs(Math.sin(t * 5)) * 22;
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 300, textAlign: 'center', opacity: e, transform: `scale(${0.8 + e * 0.2})` }}>
        <div style={{ color: '#fff', fontSize: 132, fontWeight: 900, letterSpacing: 8, textShadow: '0 10px 50px rgba(37,99,235,.9)' }}>MOVAGO</div>
        <div style={{ color: '#b9cfff', fontSize: 40, letterSpacing: 2 }}>Logística e rastreio de encomendas</div>
      </Abs>
      <Abs style={{ left: 40, right: 40, top: 560, textAlign: 'center', color: '#fff', fontSize: 70, fontWeight: 800, lineHeight: 1.1, opacity: clamp01((p - 0.06) / 0.12) }}>
        Teste grátis por <span style={{ color: AMBER }}>7 dias</span>
      </Abs>

      <Abs style={{ left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 800,
            height: 170,
            borderRadius: 85,
            background: `linear-gradient(180deg,#fb923c,${ORANGE} 55%,#ea580c)`,
            color: '#fff',
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            transform: `scale(${(0.85 + e * 0.15) * pulse * (1 - tap * 0.06)})`,
            boxShadow: `0 0 0 ${10 + tap * 26}px rgba(249,115,22,${0.22 + tap * 0.25}), 0 24px 70px rgba(249,115,22,.65), inset 0 3px 0 rgba(255,255,255,.4)`,
          }}
        >
          {cta} <span style={{ fontSize: 100 }}>›</span>
        </div>
      </Abs>

      {/* cursor a clicar */}
      <Abs style={{ left: 720 + (1 - cur) * 220, top: 880 + (1 - cur) * 260 - tap * 0, opacity: cur, transform: `scale(${1 - tap * 0.18})`, filter: 'drop-shadow(0 10px 16px rgba(0,0,0,.5))' }}>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="#fff" stroke="#0A0F1E" strokeWidth="1.1" strokeLinejoin="round">
          <path d="M9 3.5a1.5 1.5 0 013 0V10l1.6-.4a1.5 1.5 0 011.9 1.1l.2.8 1.2-.3a1.5 1.5 0 011.8 1.2l.1.6 1-.2a1.5 1.5 0 011.7 1.6L20 17c-.3 2.5-2 4.5-4.8 4.5h-2.6c-1.7 0-2.9-.7-3.8-1.9L5.2 14.6a1.4 1.4 0 012.2-1.7L9 14.6V3.5z" />
        </svg>
      </Abs>

      <Abs style={{ left: 0, right: 0, top: 1010, textAlign: 'center', opacity: clamp01((p - 0.3) / 0.15) }}>
        <div style={{ display: 'inline-block', padding: '14px 44px', borderRadius: 999, background: 'rgba(255,255,255,.1)', border: '2px solid rgba(255,255,255,.35)', color: '#fff', fontSize: 50, fontWeight: 700 }}>
          {site}
        </div>
      </Abs>

      {/* setas para o botão do anúncio */}
      <Abs style={{ left: 0, right: 0, top: 1745 + bounce, textAlign: 'center', color: ORANGE, fontSize: 90, lineHeight: 0.8, opacity: clamp01((p - 0.35) / 0.15), textShadow: '0 6px 30px rgba(249,115,22,.7)' }}>
        ▼
      </Abs>
    </>
  );
}

// ── Cenas 3 e 4: a marca ─────────────────────────────────────────────────────
function Marca({ t, starts }: { t: number; starts: number[] }) {
  const e = back(clamp01((t - starts[2]) / 0.6));
  const small = easeIO(clamp01((t - starts[3]) / 0.8));
  const sway = Math.sin(t * 0.9) * 3;
  // profundidade: sombras empilhadas na cor da marca
  const depth = Array.from({ length: 9 }, (_, i) => `${i + 1}px ${i + 1}px 0 #1d4ed8`).join(',');
  return (
    <Abs
      style={{
        left: 0,
        right: 0,
        top: 90 - small * 30,
        textAlign: 'center',
        transform: `perspective(1200px) rotateY(${sway}deg) scale(${(0.5 + e * 0.5) * (1 - small * 0.3)})`,
        opacity: Math.min(1, e * 2),
      }}
    >
      <div style={{ color: '#fff', fontSize: 170, fontWeight: 900, letterSpacing: 10, textShadow: `${depth}, 0 30px 60px rgba(37,99,235,.8)` }}>MOVAGO</div>
      <div style={{ color: '#b9cfff', fontSize: 42, letterSpacing: 3, opacity: 1 - small }}>Logística e rastreio de encomendas</div>
    </Abs>
  );
}

export function Overlays({ t, starts, end, site, cta }: { t: number; starts: number[]; end: number; site: string; cta: string }) {
  const w = (i: number) => win(t, starts, i, end);
  const marca = Math.max(w(2), w(3));
  return (
    <>
      {marca > 0 && <div style={{ opacity: marca }}><Marca t={t} starts={starts} /></div>}
      {w(0) > 0 && <div style={{ opacity: w(0) }}><Chamadas t={t} starts={starts} /></div>}
      {w(1) > 0 && <div style={{ opacity: w(1) }}><Problema t={t} starts={starts} end={end} /></div>}
      {w(3) > 0 && <div style={{ opacity: w(3) }}><Funcionalidades t={t} starts={starts} end={end} /></div>}
      {w(4) > 0 && <div style={{ opacity: w(4) }}><Oferta t={t} starts={starts} end={end} /></div>}
      {w(5) > 0 && <div style={{ opacity: Math.min(1, w(5) * 1.3) }}><Cta t={t} starts={starts} end={end} site={site} cta={cta} /></div>}
    </>
  );
}

export { easeIO };
