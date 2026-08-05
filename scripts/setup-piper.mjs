// Instala o Piper TTS (voz off offline) — corre uma vez por máquina.
//
//   npm run tts:setup
//
// Descarrega o binário do Piper e os modelos de voz PT para tools/ (gitignored).
// Serve de alternativa ao Edge TTS, que passou a devolver 403.

import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';

const PIPER_RELEASE = '2023.11.14-2';
const BIN = {
  win32: 'piper_windows_amd64.zip',
  linux: 'piper_linux_x86_64.tar.gz',
  darwin: 'piper_macos_x64.tar.gz',
}[process.platform];

const VOICES = [
  ['pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx', 'tools/voices/pt_BR-faber-medium.onnx'],
  ['pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json', 'tools/voices/pt_BR-faber-medium.onnx.json'],
  ['pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx', 'tools/voices/pt_PT-tugao-medium.onnx'],
  ['pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx.json', 'tools/voices/pt_PT-tugao-medium.onnx.json'],
];

async function download(url, dest) {
  if (existsSync(dest)) {
    console.log(`  ✓ já existe: ${dest}`);
    return;
  }
  process.stdout.write(`  ↓ ${dest} … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`falhou (${res.status}): ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log('ok');
}

mkdirSync('tools/voices', { recursive: true });

console.log('\n▸ Binário do Piper');
if (!existsSync('tools/piper/piper/piper.exe') && !existsSync('tools/piper/piper/piper')) {
  const url = `https://github.com/rhasspy/piper/releases/download/${PIPER_RELEASE}/${BIN}`;
  await download(url, `tools/${BIN}`);
  mkdirSync('tools/piper', { recursive: true });
  if (BIN.endsWith('.zip')) {
    execFileSync('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path tools/${BIN} -DestinationPath tools/piper -Force`,
    ]);
  } else {
    execFileSync('tar', ['-xzf', `tools/${BIN}`, '-C', 'tools/piper']);
  }
  console.log('  ✓ extraído');
} else {
  console.log('  ✓ já instalado');
}

console.log('\n▸ Vozes portuguesas');
for (const [path, dest] of VOICES) {
  const url = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${encodeURI(path)}`;
  await download(url, dest);
}

console.log('\n✅ Piper pronto. Os vídeos voltam a ter voz off (offline, gratuita).\n');
