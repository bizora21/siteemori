import { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import opentype from 'opentype.js';
import { CliWorld } from './CliWorld';
import { Phone } from './Phone';
import { PhoneUI } from './PhoneUI';
import { Talao } from './Talao';
import { clamp01, keyed } from '../rastreio/timing';
import type { RastreioProps } from '../types';

const SANS = "'Segoe UI', Roboto, Arial, sans-serif";

// Legendas: linha inteira, palavra falada realçada. Zona segura: acima da UI das redes.
function Captions({ lines }: Pick<RastreioProps, 'lines'>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = -1;
  lines.forEach((l, i) => {
    if (t >= l.start) idx = i;
  });
  const line = idx >= 0 ? lines[idx] : undefined;
  if (!line || t > line.end + 0.6) return null;

  const pop = spring({ frame: frame - Math.floor(line.start * fps), fps, config: { damping: 16, stiffness: 170 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 1536,
        textAlign: 'center',
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 74,
        lineHeight: 1.12,
        color: '#ffffff',
        textShadow: '0 6px 26px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.95)',
        transform: `scale(${0.95 + pop * 0.05})`,
        opacity: Math.min(1, pop * 1.4),
      }}
    >
      {line.words.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.04;
        return (
          <span
            key={i}
            style={{
              color: active ? '#ffd166' : undefined,
              textShadow: active ? '0 0 30px rgba(255,200,80,.75), 0 6px 22px rgba(0,0,0,.7)' : undefined,
            }}
          >
            {w.text}{' '}
          </span>
        );
      })}
    </div>
  );
}

function Cta({ cta, site, from }: { cta: string; site: string; from: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - from, fps, config: { damping: 13, stiffness: 110 } });
  if (frame < from) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 1708,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + s * 0.1})`,
        opacity: s,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          padding: '20px 62px',
          borderRadius: 999,
          background: 'linear-gradient(180deg,#27cdfc,#0a93c0)',
          color: '#fff',
          fontSize: 56,
          fontWeight: 800,
          boxShadow: '0 12px 40px rgba(1,186,239,.5), inset 0 2px 0 rgba(255,255,255,.35)',
        }}
      >
        {cta}
      </div>
      <div style={{ color: '#eaf8ff', fontSize: 44, fontWeight: 700, letterSpacing: 1 }}>{site}</div>
    </div>
  );
}

const NOME = 'TOACA EXPRESS';

// O logótipo é um JPEG de fundo branco: vai dentro de um cartão branco de cantos
// arredondados (como o ícone de uma aplicação), que lê bem sobre o fundo escuro.
function Logo({ size, radius }: { size: number; radius: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: '#fff', padding: size * 0.05, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Img src={staticFile('toaca-logo.jpeg')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

/** Marca pequena no topo durante o vídeo: logótipo e nome da empresa. */
function MarcaTopo({ opacity }: { opacity: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 36, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity, fontFamily: SANS }}>
      <div style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.5))' }}>
        <Logo size={84} radius={22} />
      </div>
      <div style={{ color: '#fff', fontSize: 44, fontWeight: 900, letterSpacing: 7, textShadow: '0 4px 22px rgba(47,208,255,.7)' }}>{NOME}</div>
    </div>
  );
}

/** Fecho: logótipo grande e, por baixo, o nome da empresa. */
function LogoFinal({ t, starts }: { t: number; starts: number[] }) {
  const a = t - starts[6];
  if (a < 0) return null;
  const p = clamp01(a / 0.7);
  const c1 = 1.70158;
  const back = 1 + (c1 + 1) * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  const name = clamp01((a - 0.35) / 0.5);
  const tag = clamp01((a - 0.8) / 0.5);
  const sway = Math.sin(t * 0.9) * 5;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 38%, rgba(4,12,20,.78) 0%, rgba(4,12,20,.66) 60%, rgba(4,12,20,.5) 100%)', opacity: p }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2), transform: `perspective(1400px) rotateY(${sway}deg) scale(${0.55 + back * 0.45})` }}>
        <div style={{ filter: 'drop-shadow(0 30px 70px rgba(0,0,0,.6)) drop-shadow(0 0 70px rgba(47,208,255,.5))' }}>
          <Logo size={460} radius={104} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 810, textAlign: 'center', fontFamily: SANS, opacity: name, transform: `translateY(${(1 - name) * 40}px)` }}>
        <div style={{ color: '#fff', fontSize: 96, fontWeight: 900, letterSpacing: 6, textShadow: '0 8px 40px rgba(47,208,255,.8)' }}>{NOME}</div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 960, textAlign: 'center', fontFamily: SANS, opacity: tag, color: '#bfe9ff', fontSize: 46, fontWeight: 600, letterSpacing: 1 }}>
        Do recebimento ao destino final
      </div>
    </>
  );
}

export const RastreioComboio3D = (props: RastreioProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [fonts, setFonts] = useState<{ serif: opentype.Font; sans: opentype.Font } | null>(null);
  const [handle] = useState(() => delayRender('a carregar a fonte'));
  const t = frame / fps;
  const end = durationInFrames / fps;
  const starts = props.sceneStarts;

  useEffect(() => {
    Promise.all([opentype.load(staticFile('PTSerif-Bold.ttf')), opentype.load(staticFile('SegoeUI-Bold.ttf'))])
      .then(([serif, sans]) => {
        setFonts({ serif, sans });
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);

  const glow = interpolate(frame, [0, 30, durationInFrames], [0.6, 1, 0.9]);
  const volume = interpolate(frame, [0, fps, durationInFrames - fps, durationInFrames], [0, 0.12, 0.12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // O rótulo do topo entra depois do gancho (no gancho manda o título 3D).
  // A marca fica no topo de S1 a S5 e dá lugar ao logótipo grande no fecho.
  const tag = keyed(t, starts, [0, 1, 1, 1, 1, 1, 0], 0.7);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 55% at 50% 48%, rgba(1,150,200,${0.42 * glow}) 0%, #082233 48%, #040c14 100%)`,
      }}
    >
      {fonts && <CliWorld fontSerif={fonts.serif} fontSans={fonts.sans} t={t} frame={frame} fps={fps} starts={starts} end={end} width={width} height={height} />}

      <Talao t={t} starts={starts} end={end} />
      <Phone t={t} starts={starts}>
        <PhoneUI t={t} starts={starts} end={end} />
      </Phone>

      <LogoFinal t={t} starts={starts} />

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.5) 100%)' }} />

      <MarcaTopo opacity={tag} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1490,
          height: 440,
          background: 'linear-gradient(180deg, transparent, rgba(3,9,15,.82) 30%, rgba(3,9,15,.82) 82%, transparent)',
        }}
      />
      <Captions lines={props.lines} />
      <Cta cta={props.cta} site={props.site} from={Math.floor(props.voiceEndSeconds * fps) - 10} />

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      <Audio src={staticFile(props.music ?? 'music.mp3')} startFrom={Math.round((props.musicStart ?? 0) * fps)} volume={volume} />
    </AbsoluteFill>
  );
};
