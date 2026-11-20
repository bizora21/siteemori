import { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { ReportagemProps, SceneMediaProps } from './types';

const SERIF = "'PT Serif Rep', Georgia, 'Times New Roman', serif";
const SANS = "Roboto, 'Helvetica Neue', Arial, sans-serif";

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/**
 * "Looks": filtros de cor em CSS (leves: não pesam no render como os desfoques). Aplicam-se só às imagens
 * e vídeos, nunca ao texto. Os mesmos valores estão no estúdio, para pré-visualizar.
 */
const LOOKS: Record<string, string> = {
  natural: 'none',
  cinema: 'sepia(0.22) hue-rotate(-10deg) contrast(1.22) saturate(0.88) brightness(0.94)',
  quente: 'sepia(0.32) saturate(1.3) brightness(1.04) hue-rotate(-10deg)',
  frio: 'saturate(0.9) hue-rotate(18deg) brightness(1.02) contrast(1.12)',
  vivo: 'saturate(1.5) contrast(1.15)',
  suave: 'contrast(0.9) saturate(0.85) brightness(1.08)',
};

/** Paletas de gradiente: fundo (a→b), cor de destaque e segunda cor do gradiente dos destaques. */
export const PALETTES: Record<string, { a: string; b: string; accent: string; accent2: string }> = {
  ouro: { a: '#2b1d05', b: '#0b0903', accent: '#f5b82e', accent2: '#ff8a1f' },
  oceano: { a: '#062a4a', b: '#02101f', accent: '#37c2ff', accent2: '#2f6bff' },
  'por-do-sol': { a: '#4a1230', b: '#150817', accent: '#ff7a45', accent2: '#ff3d81' },
  floresta: { a: '#0b3a2a', b: '#04130e', accent: '#5ee3a0', accent2: '#b6f24a' },
  rosa: { a: '#3d0f3a', b: '#14051a', accent: '#ff6fd8', accent2: '#a855f7' },
  aurora: { a: '#0f2a4d', b: '#2a0f4d', accent: '#4dffd2', accent2: '#8a5cff' },
  noite: { a: '#101828', b: '#05070d', accent: '#e8ecf2', accent2: '#8da2c9' },
  terra: { a: '#3a2214', b: '#120a05', accent: '#e0a96d', accent2: '#c0562a' },
};

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Mídia em ecrã inteiro: apresentador, vídeo (em ciclo) ou imagem com movimento lento. */
const FullMedia = ({ m, fadeFrames = 7, box, transition = 'fade', speed = 10, extra = 0 }: { m: SceneMediaProps; fadeFrames?: number; box?: { top: number; bottom: number }; transition?: string; speed?: number; extra?: number }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const total = Math.max(2, Math.round(m.duration * fps)) + extra;
  const fade = interpolate(frame, [0, fadeFrames, total - fadeFrames, total], [0, 1, 1, 0], clamp);
  const fill = { width: '100%', height: '100%', objectFit: 'cover' } as const;
  let body;
  if (m.fit === 'contain' && m.type !== 'presenter') {
    // Cartaz / imagem com texto: mostra-se INTEIRA, sem cortar nem fazer zoom, numa zona própria
    // (o rosto e as legendas ficam fora dela). Atrás, a mesma imagem desfocada preenche o ecrã.
    const startF = Math.round((m.startFrom ?? 0) * fps);
    const clip = Math.max(1, Math.round((m.clipSeconds ?? m.duration) * fps) - startF);
    const media = (style: React.CSSProperties) =>
      m.type === 'image' ? (
        <Img src={staticFile(m.src)} style={style} />
      ) : (
        <Loop durationInFrames={clip}>
          <OffthreadVideo src={staticFile(m.src)} startFrom={startF} muted style={style} />
        </Loop>
      );
    const hold = interpolate(frame, [0, total], [1, 1.012], clamp); // quase parada: o texto tem de se ler
    body = (
      <>
        {media({ ...fill, filter: 'blur(38px) brightness(.42)', transform: 'scale(1.25)' })}
        <div style={{ position: 'absolute', left: 0, right: 0, top: box?.top ?? 0, bottom: box?.bottom ?? 0 }}>
          {media({ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${hold})`, filter: 'drop-shadow(0 10px 34px rgba(0,0,0,.55))' })}
        </div>
      </>
    );
  } else if (m.type === 'image') {
    // Movimento lento (Ken Burns): a imagem parada ganha vida sem distrair.
    const zoom = interpolate(frame, [0, total], [1.02, 1.1], clamp);
    const drift = interpolate(frame, [0, total], [0, -18], clamp);
    body = <Img src={staticFile(m.src)} style={{ ...fill, transform: `scale(${zoom}) translateX(${drift}px)` }} />;
  } else if (m.type === 'video') {
    const startF = Math.round((m.startFrom ?? 0) * fps);
    const clip = Math.max(1, Math.round((m.clipSeconds ?? m.duration) * fps) - startF);
    body = (
      <Loop durationInFrames={clip}>
        <OffthreadVideo src={staticFile(m.src)} startFrom={startF} muted style={fill} />
      </Loop>
    );
  } else {
    // Apresentador: o rosto costuma estar no terço superior, por isso o corte favorece-o.
    body = <OffthreadVideo src={staticFile(m.src)} muted style={{ ...fill, objectPosition: '50% 30%' }} />;
  }
  // Transição de entrada. Com sobreposição (extra > 0) o plano novo entra POR CIMA do anterior, que fica até ser
  // tapado: não há "buracos" pretos entre planos. Sem sobreposição (rosto, primeiro plano) usa-se o fundido simples.
  const prog = easeOut(interpolate(frame, [0, Math.max(2, speed)], [0, 1], clamp));
  const overlap = extra > 0;
  const st: React.CSSProperties = {};
  let opacity = fade;
  if (overlap) {
    opacity = 1;
    switch (transition) {
      case 'deslizar': st.transform = `translateY(${(1 - prog) * 100}%)`; break;
      case 'empurrar': st.transform = `translateX(${(1 - prog) * 100}%)`; break;
      case 'zoom': st.transform = `scale(${1.14 - 0.14 * prog})`; opacity = prog; break;
      case 'cortina': st.clipPath = `inset(0 ${(1 - prog) * 100}% 0 0)`; break;
      case 'iris': st.clipPath = `circle(${prog * 78}% at 50% 50%)`; break;
      case 'diagonal': { const x1 = prog * 150 - 25; st.clipPath = `polygon(0 0, ${x1}% 0, ${x1 - 25}% 100%, 0 100%)`; break; }
      case 'giro': st.transform = `rotate(${(1 - prog) * -5}deg) scale(${1 + (1 - prog) * 0.18})`; opacity = prog; break;
      case 'flash': opacity = Math.min(1, prog * 2.2); st.filter = `brightness(${1 + (1 - prog) * 1.8})`; break;
      case 'persiana': { const w = width / 8; const m2 = `repeating-linear-gradient(90deg, #000 0, #000 ${w * prog}px, transparent ${w * prog}px, transparent ${w}px)`; st.WebkitMaskImage = m2; st.maskImage = m2; break; }
      default: opacity = prog; // fundido cruzado
    }
  } else {
    const enter = interpolate(frame, [0, 10], [0, 1], clamp);
    const exit = interpolate(frame, [total - fadeFrames, total], [1, 0], clamp);
    if (transition === 'deslizar') st.transform = `translateY(${(1 - enter) * 7}%)`;
    else if (transition === 'zoom') st.transform = `scale(${1.08 - 0.08 * enter})`;
    else if (transition === 'cortina') { st.clipPath = `inset(0 ${(1 - enter) * 100}% 0 0)`; opacity = exit; }
  }
  return <AbsoluteFill style={{ opacity, background: '#000', ...st }}>{body}</AbsoluteFill>;
};

/** O rosto num círculo (sem recorte da pessoa: o fundo da gravação fica escondido pela forma). */
/** A pessoa "de pé" à frente do cenário (vídeo sem fundo, com transparência). */
const PersonCutout = ({ m, side, size, look }: { m: SceneMediaProps; side: 'esquerda' | 'centro' | 'direita'; size: number; look: string }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const total = Math.max(2, Math.round(m.duration * fps));
  const inP = easeOut(interpolate(frame, [0, 12], [0, 1], clamp));
  const outP = interpolate(frame, [total - 6, total], [1, 0], clamp);
  const pos: React.CSSProperties = side === 'esquerda' ? { left: '-3%' } : side === 'direita' ? { right: '-3%' } : { left: '50%', marginLeft: 0 };
  return (
    <div style={{ position: 'absolute', bottom: -((1 - inP) * 40), height: (height * size) / 100, ...pos, transform: side === 'centro' ? 'translateX(-50%)' : 'none', opacity: inP * outP, filter: `${look === 'none' ? '' : look + ' '}drop-shadow(0 14px 34px rgba(0,0,0,.5))` }}>
      <OffthreadVideo src={staticFile(m.src)} muted transparent style={{ height: '100%', width: 'auto' }} />
    </div>
  );
};

const FaceBubble = ({ m, size, left, bottom, accent }: { m: SceneMediaProps; size: number; left: number; bottom: number; accent: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.max(2, Math.round(m.duration * fps));
  const pop = interpolate(frame, [0, 9], [0.7, 1], clamp);
  const fade = interpolate(frame, [0, 6, total - 6, total], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left,
        bottom,
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `${Math.max(4, size * 0.02)}px solid ${accent}`,
        boxShadow: '0 12px 44px rgba(0,0,0,.6)',
        background: '#000',
        opacity: fade,
        transform: `scale(${pop})`,
        transformOrigin: 'left bottom',
      }}
    >
      {/* O rosto costuma estar no terço superior do quadro: o corte favorece-o */}
      <OffthreadVideo src={staticFile(m.src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%' }} />
    </div>
  );
};

/** A cena tem cenário (fundo ou cortes)? Então o rosto passa a bolha. */
const hasScenery = (s: ReportagemProps['scenes'][number]) => Boolean(s.media) || (s.cutaways?.length ?? 0) > 0;

const BUBBLE = 380; // diâmetro da bolha (unidades u)
const BUBBLE_BOTTOM = 560;
// Com um cartaz no ecrã (vertical), o cartaz ocupa a parte de cima e o rosto desce, encostado por baixo dele.
const POSTER_BOX_TOP = 130;
const POSTER_BOX_BOTTOM = 820;
const POSTER_BUBBLE = 300; // com um cartaz no ecrã a bolha encolhe, para o cartaz ficar maior
const POSTER_BUBBLE_BOTTOM = POSTER_BOX_BOTTOM - POSTER_BUBBLE;

/**
 * A foto da pessoa que "fala" ao ritmo da voz: pulsa e brilha com o volume. Não anima a boca nem
 * finge que a pessoa está a falar: é uma foto que reage ao som (como o ícone de uma chamada).
 */
const PhotoBubble = ({ src, size, left, bottom, accent, level, y = 12, zoom = 1, levelAt }: { src: string; size: number; left: number; bottom: number; accent: string; level: number; y?: number; zoom?: number; levelAt: (t: number) => number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tt = frame / fps;
  const breathe = 0.008 * Math.sin(frame / 14);
  // Barras de voz à volta da foto: cada uma segue o volume num instante ligeiramente diferente (efeito de onda).
  const BARS = 40;
  const gap = size * 0.045;
  const bw = Math.max(4, size * 0.016);
  return (
    <div style={{ position: 'absolute', left, bottom, width: size, height: size }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
        {Array.from({ length: BARS }, (_, i) => {
          const m = i < BARS / 2 ? i : BARS - 1 - i; // simétrico
          const lv = levelAt(tt + (m - 10) * 0.035);
          const len = size * (0.02 + 0.11 * Math.min(1, lv * 1.5));
          return <div key={i} style={{ position: 'absolute', left: -bw / 2, top: -(size / 2 + gap + len), width: bw, height: len, borderRadius: bw, background: accent, opacity: 0.35 + 0.65 * Math.min(1, lv * 1.5), transformOrigin: `50% ${size / 2 + gap + len}px`, transform: `rotate(${(i * 360) / BARS}deg)` }} />;
        })}
      </div>
      <div style={{ position: 'absolute', inset: -size * 0.06, borderRadius: '50%', border: `${Math.max(3, size * 0.012)}px solid ${accent}`, opacity: 0.25 + 0.6 * level, transform: `scale(${1 + 0.09 * level})` }} />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `${Math.max(4, size * 0.02)}px solid ${accent}`,
          boxShadow: `0 12px 44px rgba(0,0,0,.6), 0 0 ${20 + 60 * level}px ${accent}${level > 0.4 ? '88' : '33'}`,
          background: '#000',
          transform: `scale(${1 + 0.07 * level + breathe}) rotate(${Math.sin(frame / 32) * 1.2}deg)`,
        }}
      >
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `50% ${y}%` }} />
      </div>
    </div>
  );
};

const AVATAR_BIG = 560; // a foto sozinha, sem cenário (unidades u)

const Pin = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
  </svg>
);

export const Reportagem = (props: ReportagemProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const [handle] = useState(() => delayRender('a carregar a fonte'));
  const t = frame / fps;
  const end = durationInFrames / fps;
  const u = Math.min(width, height) / 1080;
  const portrait = height > width * 1.2;
  const { bg, accent: accent0, text } = props.colors;
  const pal = PALETTES[props.style?.palette ?? ''];
  const accent = pal?.accent ?? accent0;
  // Fundo dos destaques: gradiente da paleta (ou a cor da marca) e a cor do texto por cima, sempre legível.
  const accentFill = pal ? `linear-gradient(135deg, ${pal.accent}, ${pal.accent2})` : accent;
  const onAccent = pal ? '#0b0f16' : bg;
  const SPEEDS = { rapida: 6, normal: 10, lenta: 18 } as const;
  const spd = SPEEDS[props.style?.transitionSpeed ?? 'normal'];
  const pad = 56 * u;

  useEffect(() => {
    const face = new FontFace('PT Serif Rep', `url(${staticFile('PTSerif-Bold.ttf')})`, { weight: '700' });
    face
      .load()
      .then((f) => {
        document.fonts.add(f);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  let sceneIdx = 0;
  props.sceneStarts.forEach((s, i) => {
    if (t >= s) sceneIdx = i;
  });
  const scene = props.scenes[sceneIdx];
  const sceneStart = props.sceneStarts[sceneIdx] ?? 0;
  const isLast = sceneIdx === props.scenes.length - 1;
  const bubbleNow = (Boolean(scene?.face) || Boolean(props.avatar)) && hasScenery(scene);

  // Volume da voz neste instante (média de 4 amostras: suaviza o movimento)
  const step = props.levelStep ?? 0.05;
  const lv = props.voiceLevels;
  const levelAt = (tt: number) => {
    if (!lv?.length) return 0;
    const k = Math.floor((tt - props.leadSeconds) / step);
    return lv[Math.min(lv.length - 1, Math.max(0, k))] ?? 0;
  };
  const level = props.avatar ? (levelAt(t - 0.1) + levelAt(t - 0.05) + levelAt(t) + levelAt(t + 0.05)) / 4 : 0;
  const avatarCorner = hasScenery(scene);
  const tr = props.style?.transition;
  const look = LOOKS[props.style?.look ?? 'natural'] ?? 'none';

  // Música por baixo da voz: sobe nas pausas e baixa enquanto se fala (ducking), com entrada e saída suaves.
  const musicVolume = (f: number) => {
    const tt = f / fps;
    const lv = (levelAt(tt - 0.15) + levelAt(tt - 0.05) + levelAt(tt + 0.05)) / 3;
    const speaking = props.voiceLevels?.length ? Math.min(1, lv * 1.7) : 1;
    const base = props.duck === false ? 0.09 : 0.24 - 0.17 * speaking;
    return base * interpolate(tt, [0, 1.2], [0, 1], clamp) * interpolate(tt, [end - 1.5, end], [1, 0], clamp);
  };
  const sceneT = t - sceneStart;

  // Legenda atual (karaoke discreto: a palavra em voz leva a cor da marca).
  let li = -1;
  props.lines.forEach((l, i) => {
    if (t >= l.start) li = i;
  });
  const line = li >= 0 ? props.lines[li] : undefined;
  const showLine = line && t <= line.end + 0.45;

  const fadeOut = interpolate(t, [end - 0.6, end], [1, 0], clamp);
  const progress = Math.min(1, t / end);

  // Etiqueta de nome: aparece no início do vídeo e sai ao fim de ~3,4 s.
  const nameIn = interpolate(t, [props.leadSeconds + 0.5, props.leadSeconds + 1.0], [0, 1], clamp);
  const nameOut = interpolate(t, [props.leadSeconds + 3.4, props.leadSeconds + 3.9], [1, 0], clamp);
  const nameVis = Math.min(nameIn, nameOut);

  // Assinatura da cena (opcional): nome, função e uma linha extra, só enquanto dura.
  const sigNow = props.scenes.map((s) => s.signature).find((sg) => sg && t >= sg.from && t < sg.to);
  const sigVis = sigNow
    ? Math.min(interpolate(t, [sigNow.from, sigNow.from + 0.5], [0, 1], clamp), interpolate(t, [sigNow.to - 0.5, sigNow.to], [1, 0], clamp))
    : 0;

  const locIn = interpolate(sceneT, [0.15, 0.6], [0, 1], clamp);
  // A chamada para a ação só aparece no fim: nos últimos ~5 s da voz (ou no início da última cena,
  // se esta for mais longa). Com uma só cena, sem isto ela aparecia logo no primeiro segundo.
  const ctaStart = Math.max(sceneStart, props.voiceEndSeconds - 5);
  const ctaIn = interpolate(t - ctaStart, [0.2, 0.7], [0, 1], clamp);
  const hasBubble = hasScenery(scene) && ((Boolean(scene?.face) && scene?.face?.type !== 'cutout') || Boolean(props.avatar));
  // Há um cartaz (imagem inteira) no ecrã agora? Então o rosto desce para não o tapar.
  const posterNow = props.scenes.some(
    (s) =>
      (s.media?.fit === 'contain' && t >= s.media.from && t < s.media.from + s.media.duration) ||
      (s.cutaways ?? []).some((c) => c.fit === 'contain' && t >= c.from && t < c.from + c.duration),
  );
  const bubbleBottom = posterNow && portrait ? POSTER_BUBBLE_BOTTOM : BUBBLE_BOTTOM;
  const bubbleSize = posterNow && portrait ? POSTER_BUBBLE : BUBBLE;
  const avatarSize = (avatarCorner ? bubbleSize : AVATAR_BIG) * u;
  const posterBox = portrait ? { top: POSTER_BOX_TOP * u, bottom: POSTER_BOX_BOTTOM * u } : { top: 90 * u, bottom: 90 * u };
  const ctaBottom = props.avatar && !hasScenery(scene) ? 800 + AVATAR_BIG + 40 : hasBubble ? bubbleBottom + bubbleSize + 40 : portrait ? 560 : 250;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${pal?.a ?? bg} 0%, ${pal?.b ?? '#000'} 100%)`, fontFamily: SANS, color: text, opacity: fadeOut }}>
      <AbsoluteFill style={{ filter: look }}>
      {/* Cenário de cada cena (imagem ou vídeo de fundo) */}
      {props.scenes.map((s, i) =>
        s.media ? (
          <Sequence key={`m${i}`} from={Math.round(s.media.from * fps) - Math.min(spd, Math.round(s.media.from * fps))} durationInFrames={Math.max(2, Math.round(s.media.duration * fps)) + Math.min(spd, Math.round(s.media.from * fps))} layout="none">
            <FullMedia transition={tr} speed={spd} extra={s.media.type === 'presenter' ? 0 : Math.min(spd, Math.round(s.media.from * fps))} m={s.media} fadeFrames={s.media.type === 'presenter' ? 4 : 8} box={posterBox} />
          </Sequence>
        ) : null,
      )}

      {/* Rosto em ecrã inteiro: só nas cenas SEM cenário (com cenário passa a bolha) */}
      {props.scenes.map((s, i) =>
        s.face && s.face.type !== 'cutout' && !hasScenery(s) ? (
          <Sequence key={`f${i}`} from={Math.round(s.face.from * fps)} durationInFrames={Math.max(2, Math.round(s.face.duration * fps))} layout="none">
            <FullMedia transition={tr} m={s.face} fadeFrames={4} />
          </Sequence>
        ) : null,
      )}

      {/* Cena sem nada para mostrar: cartão de título */}
      {!scene?.media && !scene?.face && !props.avatar && !(scene?.cutaways?.length) && scene?.title && (
        <div style={{ position: 'absolute', left: pad, right: pad, top: '34%', fontFamily: SERIF, fontWeight: 700, fontSize: (portrait ? 96 : 84) * u, lineHeight: 1.1, opacity: interpolate(sceneT, [0.1, 0.6], [0, 1], clamp) }}>
          {scene.title}
          <div style={{ width: 150 * u, height: 8 * u, background: accent, marginTop: 28 * u }} />
        </div>
      )}

      {/* Cortes para imagens/vídeos do local, enquanto a voz continua */}
      {props.scenes.flatMap((s, i) =>
        (s.cutaways ?? []).map((c, k) => {
          // transição própria deste cenário; "corte" entra de repente (2 imagens de sobreposição, sem animação)
          const cut = c.transition === 'corte';
          const sp = cut ? 1 : spd;
          const ex = Math.min(sp, Math.round(c.from * fps));
          return (
            <Sequence key={`c${i}-${k}`} from={Math.round(c.from * fps) - ex} durationInFrames={Math.max(2, Math.round(c.duration * fps)) + ex} layout="none">
              <FullMedia transition={cut ? 'fade' : c.transition ?? tr} speed={sp} extra={ex} m={c} fadeFrames={7} box={posterBox} />
            </Sequence>
          );
        }),
      )}

      </AbsoluteFill>

      {/* O rosto em bolha, por cima do cenário e dos cortes */}
      {props.scenes.map((s, i) =>
        s.face && s.face.type !== 'cutout' && hasScenery(s) ? (
          <Sequence key={`b${i}`} from={Math.round(s.face.from * fps)} durationInFrames={Math.max(2, Math.round(s.face.duration * fps))} layout="none">
            <FaceBubble m={s.face} size={bubbleSize * u} left={pad} bottom={bubbleBottom * u} accent={accent} />
          </Sequence>
        ) : null,
      )}

      {/* A pessoa recortada, de pé à frente do cenário */}
      {props.scenes.map((s, i) =>
        s.face?.type === 'cutout' && s.person ? (
          <Sequence key={`p${i}`} from={Math.round(s.face.from * fps)} durationInFrames={Math.max(2, Math.round(s.face.duration * fps))} layout="none">
            <PersonCutout m={s.face} side={s.person.side} size={s.person.size} look={look} />
          </Sequence>
        ) : null,
      )}

      {/* A foto animada pela voz (versão "foto"): canto com cenário, centro sem cenário */}
      {props.avatar && !scene?.clip && (
        <PhotoBubble
          src={props.avatar.src}
          y={props.avatar.y}
          zoom={props.avatar.zoom}
          size={avatarSize}
          left={avatarCorner ? pad : (width - avatarSize) / 2}
          bottom={(avatarCorner ? bubbleBottom : portrait ? 800 : 300) * u}
          accent={accent}
          level={level}
          levelAt={levelAt}
        />
      )}

      {props.style?.wash && (() => {
        const wp = pal ?? PALETTES.oceano;
        return <AbsoluteFill style={{ background: `linear-gradient(160deg, ${wp.accent} 0%, ${wp.accent2} 100%)`, opacity: props.style.wash === 'forte' ? 0.4 : 0.2, mixBlendMode: 'soft-light', pointerEvents: 'none' }} />;
      })()}

      {/* Vinheta e grão de filme (opcionais): dão aspeto de cinema, sem peso no render */}
      {props.style?.vignette && <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,.5) 100%)', pointerEvents: 'none' }} />}
      {props.style?.grain && (
        <AbsoluteFill
          style={{
            backgroundImage: `url(${staticFile('grain.png')})`,
            backgroundSize: '256px 256px',
            backgroundPosition: `${(frame * 53) % 256}px ${(frame * 97) % 256}px`,
            opacity: 0.11,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Sombras para o texto ler-se sobre qualquer imagem */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,.72) 100%)', pointerEvents: 'none' }} />

      {/* Progresso */}
      <div style={{ position: 'absolute', left: 0, top: 0, height: 6 * u, width: `${progress * 100}%`, background: accentFill }} />

      {/* Marca d'água */}
      {props.logo && <Img src={staticFile(props.logo)} style={{ position: 'absolute', right: pad, top: (portrait ? 118 : 40) * u, height: 64 * u, width: 'auto', opacity: 0.92 }} />}

      {/* Local */}
      {scene?.location && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            top: (portrait ? 118 : 40) * u,
            display: 'flex',
            alignItems: 'center',
            gap: 12 * u,
            background: 'rgba(0,0,0,.55)',
            border: `${2 * u}px solid ${accent}`,
            borderRadius: 99 * u,
            padding: `${10 * u}px ${24 * u}px ${10 * u}px ${16 * u}px`,
            fontSize: 32 * u,
            fontWeight: 700,
            opacity: locIn,
            transform: `translateX(${(1 - locIn) * -30}px)`,
          }}
        >
          <Pin color={accent} size={36 * u} />
          {scene.location}
        </div>
      )}

      {/* Assinatura da cena (ex.: o psicólogo a falar): painel translúcido para ler-se sobre qualquer fundo */}
      {sigNow && sigVis > 0 && (
        <div
          style={{
            position: 'absolute',
            left: bubbleNow ? pad + (bubbleSize + 28) * u : pad,
            right: pad,
            bottom: bubbleNow ? (bubbleBottom + bubbleSize / 2 - 70) * u : (portrait ? 560 : 250) * u,
            display: 'flex',
            opacity: sigVis,
            transform: `translateX(${(1 - sigVis) * -70}px)`,
          }}
        >
          <div style={{ borderLeft: `${8 * u}px solid ${accent}`, background: 'rgba(0,0,0,.55)', padding: `${16 * u}px ${28 * u}px ${16 * u}px ${24 * u}px`, borderRadius: `0 ${14 * u}px ${14 * u}px 0`, textShadow: '0 2px 10px rgba(0,0,0,.6)', maxWidth: '100%' }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 60 * u, lineHeight: 1.05 }}>{sigNow.name}</div>
            {sigNow.role && <div style={{ fontSize: 38 * u, fontWeight: 600, color: accent, marginTop: 6 * u }}>{sigNow.role}</div>}
            {sigNow.extra && <div style={{ fontSize: 30 * u, opacity: 0.9, marginTop: 6 * u }}>{sigNow.extra}</div>}
          </div>
        </div>
      )}

      {/* Etiqueta de nome (início do vídeo) */}
      {props.host?.name && nameVis > 0 && !sigNow && (
        <div
          style={{
            position: 'absolute',
            // com o rosto em bolha, o nome fica ao lado dela
            left: bubbleNow ? pad + (bubbleSize + 28) * u : pad,
            bottom: bubbleNow ? (bubbleBottom + bubbleSize / 2 - 50) * u : (portrait ? 560 : 250) * u,
            opacity: nameVis,
            transform: `translateX(${(1 - nameVis) * -60}px)`,
            borderLeft: `${8 * u}px solid ${accent}`,
            paddingLeft: 22 * u,
            textShadow: '0 3px 16px rgba(0,0,0,.7)',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64 * u, lineHeight: 1.05 }}>{props.host.name}</div>
          {props.host.role && <div style={{ fontSize: 34 * u, opacity: 0.92, marginTop: 6 * u }}>{props.host.role}</div>}
        </div>
      )}

      {/* Última cena: chamada para a ação */}
      {isLast && t >= ctaStart && !props.event && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad,
            // acima da bolha/da foto, para não ficar por cima delas
            bottom: ctaBottom * u,
            display: 'flex',
            justifyContent: 'center',
            opacity: ctaIn,
            transform: `translateY(${(1 - ctaIn) * 40}px)`,
          }}
        >
          <div style={{ background: accentFill, color: onAccent, fontWeight: 800, fontSize: 54 * u, padding: `${20 * u}px ${40 * u}px`, borderRadius: 18 * u, textAlign: 'center', lineHeight: 1.15, boxShadow: '0 10px 40px rgba(0,0,0,.45)' }}>
            {props.cta}
            <div style={{ fontSize: 34 * u, fontWeight: 700, marginTop: 6 * u, opacity: 0.85 }}>{props.site}</div>
          </div>
        </div>
      )}

      {/* Cartão do evento (marcha, campanha…): data, hora, local e contacto, no fim do vídeo */}
      {isLast && t >= ctaStart && props.event && (
        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad,
            top: (portrait ? 230 : 110) * u,
            background: `${bg}F2`,
            border: `${5 * u}px solid ${accent}`,
            borderRadius: 26 * u,
            padding: `${34 * u}px ${40 * u}px`,
            textAlign: 'center',
            opacity: ctaIn,
            transform: `translateY(${(1 - ctaIn) * 40}px)`,
            boxShadow: '0 20px 70px rgba(0,0,0,.6)',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 60 * u, lineHeight: 1.1, color: accent }}>{props.event.title}</div>
          {(props.event.date || props.event.time) && (
            <div style={{ fontSize: 54 * u, fontWeight: 800, marginTop: 22 * u, lineHeight: 1.15 }}>{[props.event.date, props.event.time].filter(Boolean).join(' · ')}</div>
          )}
          {props.event.place && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * u, fontSize: 42 * u, fontWeight: 600, marginTop: 14 * u }}>
              <Pin color={accent} size={44 * u} />
              {props.event.place}
            </div>
          )}
          {props.event.note && <div style={{ fontSize: 36 * u, marginTop: 16 * u, fontStyle: 'italic', opacity: 0.92 }}>{props.event.note}</div>}
          {props.event.contact && <div style={{ fontSize: 34 * u, marginTop: 18 * u, opacity: 0.85 }}>{props.event.contact}</div>}
          <div style={{ display: 'inline-block', marginTop: 26 * u, background: accentFill, color: onAccent, fontWeight: 800, fontSize: 40 * u, padding: `${12 * u}px ${34 * u}px`, borderRadius: 14 * u }}>{props.cta}</div>
        </div>
      )}

      {/* Textos, emojis e imagens da linha do tempo */}
      {(props.overlays ?? []).map((o, k) => {
        if (t < o.from || t >= o.to) return null;
        const a = Math.min(interpolate(t, [o.from, o.from + 0.35], [0, 1], clamp), interpolate(t, [o.to - 0.3, o.to], [1, 0], clamp));
        const grow = o.anim === 'pop' ? 0.6 + 0.4 * Math.min(1, interpolate(t, [o.from, o.from + 0.3], [0, 1.18], clamp)) : 1;
        const rise = o.anim === 'deslizar' ? (1 - a) * 60 * u : 0;
        const wrap: React.CSSProperties = { position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, transform: `translate(-50%, calc(-50% + ${rise}px)) scale(${grow})`, opacity: a, textAlign: 'center', maxWidth: '86%', pointerEvents: 'none' };
        if (o.kind === 'image' && o.src) return <div key={k} style={wrap}><Img src={staticFile(o.src)} style={{ width: width * 0.4 * o.size, height: 'auto', borderRadius: 18 * u, boxShadow: '0 10px 36px rgba(0,0,0,.5)' }} /></div>;
        if (o.kind === 'emoji') return <div key={k} style={{ ...wrap, fontSize: 150 * u * o.size, lineHeight: 1, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.45))', fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}>{o.text}</div>;
        const fs = 66 * u * o.size;
        const look: React.CSSProperties = o.style === 'caixa'
          ? { background: 'rgba(0,0,0,.62)', color: text, padding: `${14 * u}px ${28 * u}px`, borderRadius: 18 * u }
          : o.style === 'simples'
            ? { color: text, textShadow: `0 0 ${8 * u}px rgba(0,0,0,.9), 0 ${4 * u}px ${18 * u}px rgba(0,0,0,.8)` }
            : o.style === 'gradiente'
              ? { background: accentFill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 4px 14px rgba(0,0,0,.6))' }
              : { background: accentFill, color: onAccent, padding: `${12 * u}px ${28 * u}px`, borderRadius: 16 * u, boxShadow: '0 8px 26px rgba(0,0,0,.4)' };
        return <div key={k} style={wrap}><span style={{ display: 'inline-block', fontWeight: 800, fontSize: fs, lineHeight: 1.12, ...look }}>{o.text}</span></div>;
      })}

      {/* Legenda: dentro da zona segura (a interface das redes cobre a base e a direita). Três estilos. */}
      {showLine && line && (() => {
        const cs = props.style?.captionStyle ?? 'karaoke';
        const c = props.style?.caption ?? {};
        const base = cs === 'limpo' ? { box: 'escura', hl: 'cor' } : cs === 'destaque' ? { box: 'nenhuma', hl: 'pilula' } : { box: 'nenhuma', hl: 'cor' };
        const boxK = c.box ?? base.box;
        const hl = c.hl ?? base.hl;
        const mult = { pequena: 0.8, media: 1, grande: 1.25, enorme: 1.5 }[c.size ?? 'media'];
        const fam = { moderna: undefined, classica: 'Georgia, "Times New Roman", serif', compacta: 'Impact, "Arial Narrow", "Arial Black", sans-serif', redonda: '"Trebuchet MS", "Segoe UI", sans-serif' }[c.font ?? 'moderna'];
        const col = c.color ?? (boxK === 'cor' ? onAccent : text);
        const hcol = c.highlight ?? (boxK === 'cor' ? '#ffffff' : accent);
        const fs = (portrait ? 66 : 54) * u * mult;
        const pos = c.position ?? 'baixo';
        const place: React.CSSProperties = pos === 'meio' ? { top: '50%', transform: 'translateY(-50%)' } : pos === 'cima' ? { top: (portrait ? 260 : 80) * u } : { bottom: (portrait ? 330 : 110) * u };
        const outline = c.outline ?? boxK === 'nenhuma';
        const isOn = (w: { start: number; end: number }) => t >= w.start && t < w.end + 0.04;
        const shadow = boxK === 'nenhuma' ? `0 0 ${8 * u}px rgba(0,0,0,.95), 0 ${4 * u}px ${22 * u}px rgba(0,0,0,.8)` : `0 2px ${10 * u}px rgba(0,0,0,.5)`;
        const inner: React.CSSProperties = {
          fontWeight: c.font === 'classica' ? 700 : 800, fontSize: fs, lineHeight: hl === 'pilula' ? 1.35 : 1.15, fontFamily: fam, textTransform: c.caps ? 'uppercase' : undefined, color: col, textShadow: shadow,
          ...(outline ? { WebkitTextStroke: `${2.5 * u}px rgba(0,0,0,.85)`, paintOrder: 'stroke fill' } : {}),
          ...(boxK === 'escura' ? { background: 'rgba(0,0,0,.55)', padding: `${14 * u}px ${30 * u}px`, borderRadius: 20 * u } : {}),
          ...(boxK === 'cor' ? { background: accentFill, padding: `${14 * u}px ${30 * u}px`, borderRadius: 20 * u, boxShadow: '0 8px 26px rgba(0,0,0,.35)' } : {}),
        };
        return (
          <div style={{ position: 'absolute', left: pad, right: pad + (portrait ? 90 * u : 0), display: 'flex', justifyContent: 'center', textAlign: 'center', ...place }}>
            <div style={inner}>
              {line.words.map((w, i) => {
                const on = hl !== 'nenhum' && isOn(w);
                if (hl === 'pilula') {
                  return <span key={i} style={{ display: 'inline-block', background: on ? accentFill : 'transparent', color: on ? onAccent : col, padding: `0 ${10 * u}px`, borderRadius: 12 * u, transform: on ? 'scale(1.06)' : 'none', margin: `0 ${2 * u}px` }}>{w.text}</span>;
                }
                return <span key={i} style={{ color: on ? hcol : col }}>{w.text}{' '}</span>;
              })}
            </div>
          </div>
        );
      })()}

      <Sequence from={Math.round(props.leadSeconds * fps)}>
        <Audio src={staticFile(props.audio)} />
      </Sequence>
      {props.music && <Audio src={staticFile(props.music)} volume={musicVolume} />}
    </AbsoluteFill>
  );
};
