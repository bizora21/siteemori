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
import { Scene } from './Scene';
import type { VerseProps } from './types';

const FONT_FILE = 'PTSerif-Bold.ttf';

// Legendas: linha inteira, com a palavra falada em ouro (karaoke).
// Ficam no terço inferior, acima da zona coberta pela interface do TikTok.
function Captions({ lines }: Pick<VerseProps, 'lines'>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let idx = -1;
  lines.forEach((l, i) => {
    if (t >= l.start) idx = i;
  });
  const line = idx >= 0 ? lines[idx] : undefined;
  if (!line || t > line.end + 0.7) return null;

  const pop = spring({ frame: frame - Math.floor(line.start * fps), fps, config: { damping: 16, stiffness: 160 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 1330,
        textAlign: 'center',
        fontFamily: 'PT Serif, serif',
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1.12,
        color: '#fff7e6',
        textShadow: '0 6px 28px rgba(0,0,0,.65), 0 0 2px rgba(0,0,0,.9)',
        transform: `scale(${0.94 + pop * 0.06})`,
        opacity: Math.min(1, pop * 1.4),
      }}
    >
      {line.words.map((w, i) => {
        const active = t >= w.start && t < w.end + 0.04;
        return (
          <span
            key={i}
            style={{
              color: active ? '#ffd36a' : undefined,
              textShadow: active ? '0 0 34px rgba(255,190,70,.85), 0 6px 24px rgba(0,0,0,.6)' : undefined,
            }}
          >
            {w.text}{' '}
          </span>
        );
      })}
    </div>
  );
}

// Fecho: "Link na bio" a entrar depois da última palavra.
function Cta({ cta, site, from, arrow = true }: { cta: string; site: string; from: number; arrow?: boolean }) {
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
        top: 1600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + s * 0.1})`,
        opacity: s,
        fontFamily: 'PT Serif, serif',
      }}
    >
      <div
        style={{
          padding: '24px 64px',
          borderRadius: 999,
          background: 'linear-gradient(180deg,#ffd36a,#e6a93a)',
          color: '#2a1800',
          fontSize: 64,
          fontWeight: 700,
          boxShadow: '0 12px 40px rgba(240,170,60,.45)',
        }}
      >
        {cta}{arrow ? ' ↑' : ''}
      </div>
      <div style={{ color: '#fff7e6', fontSize: 40, letterSpacing: 2, opacity: 0.9 }}>{site}</div>
    </div>
  );
}

export const Verse3D = (props: VerseProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [font, setFont] = useState<opentype.Font | null>(null);
  const [handle] = useState(() => delayRender('a carregar a fonte'));

  useEffect(() => {
    opentype
      .load(staticFile(FONT_FILE))
      .then((f) => {
        setFont(f);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);

  // Fundo: azul-noite com brilho quente ao centro; vinheta nas bordas.
  const glow = interpolate(frame, [0, 30, durationInFrames], [0.55, 1, 0.9]);
  const volume = interpolate(frame, [0, fps, durationInFrames - fps, durationInFrames], [0, 0.11, 0.11, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 55% at 50% 52%, rgba(120,70,20,${0.55 * glow}) 0%, #1a1030 45%, #07050f 100%)`,
      }}
    >
      <style>{`@font-face{font-family:'PT Serif';font-weight:700;src:url(${staticFile(FONT_FILE)})}`}</style>

      {font && <Scene font={font} props={props} />}

      <AbsoluteFill
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)' }}
      />

      <div style={{ position: 'absolute', left: 0, right: 0, top: 1270, height: 460, background: 'linear-gradient(180deg, transparent, rgba(5,3,12,.78) 35%, rgba(5,3,12,.78) 80%, transparent)' }} />
      <Captions lines={props.lines} />
      <Cta cta={props.cta} site={props.site} arrow={props.ctaArrow !== false} from={Math.floor(props.voiceEndSeconds * fps) - 8} />

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      <Audio src={staticFile('music.mp3')} volume={volume} loop />
    </AbsoluteFill>
  );
};
