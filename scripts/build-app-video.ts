// Vídeo no formato "ecrã da app": a história acontece dentro do check-in.
//
//   npm run social:appvideo -- --slug=choro-por-qualquer-coisa --lang=pt-br --music
//
// Porquê este formato: todas as versões com filmagem de banco de imagens
// perderam a maioria dos espectadores aos 0:02, independentemente de duração,
// voz, brilho ou ritmo de cortes. Oito variações, o mesmo número. O que se
// manteve igual em todas foi o formato — texto sobre stock, que é a assinatura
// visual do conteúdo automatizado. Um ecrã de app a ser escrito lê-se como real
// no primeiro instante, que é onde a decisão acontece.

import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { Resvg } from '@resvg/resvg-js';
import ffmpegPath from 'ffmpeg-static';
import { appScreenSvg } from '../lib/social/appscreen';
import { synthesize, cleanNarration } from '../lib/social/tts';
import { synthesizePiper, piperAvailable } from '../lib/social/piper';
import type { Locale } from '../i18n/config';

const W = 1080;
const FPS = 30;
const ffmpeg = ffmpegPath as unknown as string;
const FONTS = [
  'assets/fonts/PTSerif-Bold.ttf',
  'assets/fonts/PTSerif-Regular.ttf',
  'assets/fonts/Inter-Regular.ttf',
  'assets/fonts/Inter-SemiBold.ttf',
  'assets/fonts/Inter-Bold.ttf',
];

function arg(k: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${k}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}
const has = (k: string) => process.argv.includes(`--${k}`);

function audioDuration(file: string): number {
  const r = spawnSync(ffmpeg, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(`${r.stderr ?? ''}`);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : 0;
}

function musicTrack(): string | null {
  if (!existsSync('assets/audio')) return null;
  const f = readdirSync('assets/audio').find((n) => /\.(mp3|m4a|wav|ogg)$/i.test(n));
  return f ? `assets/audio/${f}` : null;
}

function png(svg: string): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  })
    .render()
    .asPng();
}

/** Uma etapa do vídeo: o que está no ecrã e o que a voz diz por cima. */
interface Beat {
  narration: string;
  /** texto da entrada revelado no fim desta etapa */
  typed: string;
  /** resposta da Emori revelada no fim desta etapa */
  reply?: string;
  /** revela caractere a caractere ao longo da etapa (efeito de escrita) */
  typing?: boolean;
  /** linha discreta de remate por baixo do cartao */
  footer?: string;
}

async function main() {
  const slug = arg('slug');
  const lang = (arg('lang') ?? 'pt-br') as Locale;
  if (!slug) {
    console.error('Uso: --slug=<slug> [--lang=pt-br] [--music] [--no-voice]');
    process.exit(1);
  }

  const scripts = JSON.parse(readFileSync('content/social/app-scripts.json', 'utf8')) as Record<
    string,
    Record<string, Beat[]>
  >;
  const beats = scripts[slug]?.[lang];
  if (!beats) {
    console.error(`Sem guião em content/social/app-scripts.json para ${slug} / ${lang}`);
    process.exit(1);
  }

  const dir = `social/${slug}/${lang}`;
  const tmp = `${dir}/.app`;
  mkdirSync(tmp, { recursive: true });

  const withVoice = !has('no-voice');
  const track = has('music') ? musicTrack() : null;
  if (track) console.log(`  ♪ musica: ${track.split('/').pop()}`);

  const frames: { file: string; seconds: number }[] = [];
  const voices: string[] = [];
  let typedAcc = '';
  let replyAcc = '';

  for (const [bi, b] of beats.entries()) {
    let dur: number;
    if (withVoice) {
      const vf = `${tmp}/v-${bi}.mp3`;
      try {
        await synthesize(cleanNarration(b.narration), lang, vf);
      } catch (err) {
        if (!piperAvailable(lang)) throw err;
        if (bi === 0) console.warn('  Edge TTS indisponivel - a usar Piper (offline).');
        synthesizePiper(cleanNarration(b.narration), lang, vf, tmp);
      }
      voices.push(vf);
      dur = audioDuration(vf) || 3;
    } else {
      dur = Math.max(2.5, b.narration.split(/\s+/).length / 2.5);
    }

    const alvoTyped = b.typed;
    const alvoReply = b.reply ?? replyAcc;
    const escreveResposta = alvoReply !== replyAcc;

    if (b.typing) {
      // Escreve ao longo da etapa. ~8 passos por segundo chega para ler como
      // escrita a sério sem gerar centenas de PNG.
      const passos = Math.max(2, Math.round(dur * 8));
      const destino = escreveResposta ? alvoReply : alvoTyped;
      const inicio = escreveResposta ? replyAcc : typedAcc;
      for (let s = 1; s <= passos; s++) {
        const n = inicio.length + Math.round((destino.length - inicio.length) * (s / passos));
        const parcial = destino.slice(0, n);
        const file = `${tmp}/f-${bi}-${s}.png`;
        writeFileSync(
          file,
          png(
            escreveResposta
              ? appScreenSvg({ typed: alvoTyped, reply: parcial, footer: b.footer })
              : appScreenSvg({ typed: parcial, caret: s < passos, footer: b.footer }),
          ),
        );
        frames.push({ file, seconds: dur / passos });
      }
    } else {
      const file = `${tmp}/f-${bi}.png`;
      writeFileSync(
        file,
        png(appScreenSvg({ typed: alvoTyped, reply: alvoReply || undefined, footer: b.footer })),
      );
      frames.push({ file, seconds: dur });
    }

    typedAcc = alvoTyped;
    replyAcc = alvoReply;
  }

  // Quantiza para frames inteiros — sem isto o erro de arredondamento acumula
  // e a imagem descola da voz ao longo do vídeo.
  let acc = 0;
  let emitted = 0;
  const q = frames.map((f) => {
    acc += f.seconds;
    const n = Math.max(1, Math.round(acc * FPS) - emitted);
    emitted += n;
    return { file: f.file, seconds: n / FPS };
  });
  const total = emitted / FPS;

  const list = `${tmp}/frames.txt`;
  const body = q
    .map((f) => `file '${f.file.split('/').pop()}'\nduration ${f.seconds.toFixed(6)}`)
    .join('\n');
  writeFileSync(list, `${body}\nfile '${q.at(-1)!.file.split('/').pop()}'\n`);

  const inputs = ['-f', 'concat', '-safe', '0', '-i', list];
  const filters = [`[0:v]fps=${FPS},format=yuv420p[v]`];
  const maps = ['-map', '[v]'];
  let base = 1;

  const hasVoice = withVoice && voices.length > 0;
  if (hasVoice) {
    voices.forEach((v) => inputs.push('-i', v));
    const chain = voices.map((_, i) => `[${i + base}:a]`).join('');
    filters.push(`${chain}concat=n=${voices.length}:v=0:a=1[voice]`);
    base += voices.length;
  }

  let mix: string | null = hasVoice ? '[voice]' : null;
  if (track) {
    inputs.push('-stream_loop', '-1', '-i', track);
    filters.push(
      `[${base}:a]atrim=0:${total},volume=${hasVoice ? '0.10' : '0.35'},` +
        `afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0, total - 2)}:d=2[mus]`,
    );
    if (hasVoice) {
      filters.push('[voice][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[m]');
      mix = '[m]';
    } else mix = '[mus]';
  }
  if (mix) {
    filters.push(`${mix}loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
    maps.push('-map', '[aout]');
  }

  const out = `${dir}/app.mp4`;
  try {
    execFileSync(
      ffmpeg,
      [
        '-y',
        ...inputs,
        '-filter_complex',
        filters.join(';'),
        ...maps,
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '20',
        ...(mix ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : []),
        '-movflags',
        '+faststart',
        out,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
  } catch (err) {
    const e = err as { stderr?: Buffer };
    console.error('ffmpeg falhou:\n', e.stderr?.toString().slice(-2000));
    process.exit(1);
  }

  rmSync(tmp, { recursive: true, force: true });
  const extras = `${hasVoice ? ' + voz' : ''}${track ? ' + musica' : ''}`;
  console.log(`OK ${out} - ${total.toFixed(1)}s, ${q.length} frames${extras}`);
}

main().catch((e) => {
  console.error('ERRO', e?.message ?? e);
  process.exit(1);
});
