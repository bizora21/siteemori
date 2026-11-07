import { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
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
import { CtrlWorld } from './anuncio2/CtrlWorld';
import { OverlaysB } from './anuncio2/Panels';
import { keyed } from './rastreio/timing';
import type { AnuncioProps } from './types';

const SANS = "'Segoe UI', Roboto, Arial, sans-serif";
const AMBER = '#FFB347';

function Captions({ lines }: Pick<AnuncioProps, 'lines'>) {
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
        fontSize: 76,
        lineHeight: 1.1,
        color: '#fff',
        textShadow: '0 6px 26px rgba(0,0,0,.8), 0 0 3px rgba(0,0,0,.95)',
        transform: `scale(${0.95 + pop * 0.05})`,
        opacity: Math.min(1, pop * 1.4),
      }}
    >
      {line.words.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.04;
        return (
          <span key={i} style={{ color: active ? AMBER : undefined, textShadow: active ? '0 0 30px rgba(255,170,60,.8), 0 6px 22px rgba(0,0,0,.7)' : undefined }}>
            {w.text}{' '}
          </span>
        );
      })}
    </div>
  );
}

export const Anuncio3DB = (props: AnuncioProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [fonts, setFonts] = useState<{ serif: opentype.Font; sans: opentype.Font } | null>(null);
  const [handle] = useState(() => delayRender('a carregar as fontes'));
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

  // Música: entra a meio da faixa (já com energia), por baixo da voz; sobe no CTA.
  const vend = props.voiceEndSeconds;
  const volume = (f: number) => {
    const s = f / fps;
    const base = interpolate(s, [0, 0.8, 3, vend - 1, vend + 0.6], [0, 0.14, 0.11, 0.11, 0.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return base * interpolate(s, [end - 1.4, end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  };

  const glow = interpolate(frame, [0, 30, durationInFrames], [0.6, 1, 0.9]);
  const danger = keyed(t, starts, [0, 1, 0, 0, 0, 0, 0], 0.5);
  const glowRgb = danger > 0.5 ? '170,30,40' : '37,99,235';
  // Marca discreta no topo nas cenas de explicação (o topo livre do mapa).
  const brand = keyed(t, starts, [0, 0, 0, 1, 1, 0, 0], 0.7);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 55% at 50% 40%, rgba(${glowRgb},${0.45 * glow}) 0%, #0A0F1E 55%, #04060f 100%)` }}>
      {fonts && <CtrlWorld fontSerif={fonts.serif} fontSans={fonts.sans} t={t} frame={frame} fps={fps} starts={starts} end={end} width={width} height={height} />}

      <OverlaysB t={t} starts={starts} end={end} site={props.site} cta={props.cta} />

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.5) 100%)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 58, letterSpacing: 12, color: '#fff', opacity: brand * 0.95, textShadow: '0 6px 30px rgba(37,99,235,.9)' }}>
        MOVAGO
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 1490, height: 300, background: 'linear-gradient(180deg, transparent, rgba(3,6,15,.82) 30%, rgba(3,6,15,.82) 80%, transparent)' }} />
      <Captions lines={props.lines} />

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      <Audio src={staticFile(props.music)} startFrom={Math.round((props.musicStart ?? 0) * fps)} volume={volume} />
    </AbsoluteFill>
  );
};
