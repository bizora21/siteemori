# Alternativa em Python ao Edge TTS do Node (o WebSocket do Node falha em algumas redes).
# Uso: python edge_tts_py.py "<texto>" <voz> <ficheiro.mp3> [ritmo]
# Escreve o MP3 e imprime em JSON as palavras com início/fim em segundos.
import sys, os, json, asyncio
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools', 'pylib'))
import edge_tts

async def main(text, voice, out, rate):
    try:
        comm = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary')
    except TypeError:
        comm = edge_tts.Communicate(text, voice, rate=rate)
    words = []
    with open(out, 'wb') as f:
        async for chunk in comm.stream():
            if chunk['type'] == 'audio':
                f.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                s = chunk['offset'] / 1e7
                words.append({'text': chunk['text'], 'start': s, 'end': s + chunk['duration'] / 1e7})
    print(json.dumps({'words': words}))

if __name__ == '__main__':
    t, v, o = sys.argv[1], sys.argv[2], sys.argv[3]
    r = sys.argv[4] if len(sys.argv) > 4 else '-8%'
    asyncio.run(main(t, v, o, r))
