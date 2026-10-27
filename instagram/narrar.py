# Voz do Reels narrado: lê instagram/narracao/<nome>.json, fala cada frase e grava:
#   rascunhos/instagram/<nome>-voz.wav       a narração inteira, com as pausas
#   instagram/narracao/<nome>.tempos.json    início e fim de cada frase e de cada palavra (a página usa)
# Uso: python3 instagram/narrar.py reels-narrado
# Motores ("motor" no JSON):
#   piper (padrão): voz sintética livre ("voz": "pt_BR-faber-medium"), baixada para rascunhos/vozes/. pip install piper-tts
#   clone: Chatterbox multilíngue (licença MIT, roda aqui) imitando a voz de "referencia" (10 a 15 s de fala limpa,
#     ex.: um trecho da voz tratada pelo encaixar-voz.py). Cada frase é conferida pelo Whisper e refeita se sair
#     embolada; as palavras da legenda seguem os tempos que o Whisper ouviu. pip install chatterbox-tts faster-whisper
#   kokoro: voz sintética livre do Kokoro (Apache 2.0, roda na CPU; "voz": "pm_alex", "pm_santa" ou "pf_dora"),
#     bem mais natural que o Piper. Modelo baixado para rascunhos/vozes/. As palavras da legenda seguem os tempos que
#     o Whisper ouviu. pip install kokoro-onnx faster-whisper
#   edge: vozes neurais brasileiras da Microsoft ("voz": "pt-BR-AntonioNeural", "pt-BR-FranciscaNeural" ou
#     "pt-BR-ThalitaMultilingualNeural"; "ritmo": "+12%"; "tom": "-2Hz"), pelo serviço de leitura em voz alta do Edge.
#     As mesmas vozes existem no Azure Speech, que é o caminho com licença para uso comercial. As palavras da legenda
#     seguem os tempos que o próprio serviço devolve. pip install edge-tts imageio-ffmpeg
import difflib, json, re, subprocess, sys, unicodedata, wave
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
nome = sys.argv[1]
cfg = json.loads((RAIZ / "instagram" / "narracao" / f"{nome}.json").read_text())
VOZES = RAIZ / "rascunhos" / "vozes"; VOZES.mkdir(parents=True, exist_ok=True)
tmp = RAIZ / "rascunhos" / "instagram" / f".voz-{nome}"; tmp.mkdir(parents=True, exist_ok=True)
MOTOR = cfg.get("motor", "piper")
SR = 44100
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()).split()

def ler(arq):
    with wave.open(str(arq)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return np.interp(np.arange(0, len(x) / w.getframerate(), 1 / SR), np.arange(len(x)) / w.getframerate(), x).astype(np.float32)

if MOTOR == "piper":
    voz = cfg["voz"]; lang, quem, qual = voz.split("-")
    modelo = VOZES / f"{voz}.onnx"
    for ext in (".onnx", ".onnx.json"):
        arq = VOZES / f"{voz}{ext}"
        if not arq.exists():
            url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang.split('_')[0]}/{lang}/{quem}/{qual}/{voz}{ext}"
            subprocess.run(["curl", "-sSLf", "-m", "300", "-o", str(arq), url], check=True)
    def falar(texto, arq):
        subprocess.run([sys.executable, "-m", "piper", "-m", str(modelo), "-f", str(arq), "--length-scale", str(cfg.get("velocidade", 1.0)),
                        "--sentence-silence", "0.12"], input=texto.encode(), check=True, capture_output=True)
        return ler(arq), None
elif MOTOR == "kokoro":
    from kokoro_onnx import Kokoro
    from faster_whisper import WhisperModel
    for arq in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        if not (VOZES / arq).exists():
            subprocess.run(["curl", "-sSLf", "-m", "900", "-o", str(VOZES / arq),
                            f"https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/{arq}"], check=True)
    kokoro = Kokoro(str(VOZES / "kokoro-v1.0.onnx"), str(VOZES / "voices-v1.0.bin"))
    ouvido = WhisperModel("small", device="cpu", compute_type="int8")
    def falar(texto, arq):
        w, sr = kokoro.create(texto, voice=cfg.get("voz", "pm_alex"), speed=cfg.get("velocidade", 1.0), lang="pt-br")
        x = np.interp(np.arange(0, len(w) / sr, 1 / SR), np.arange(len(w)) / sr, w).astype(np.float32)
        a16 = np.interp(np.arange(0, len(w) / sr, 1 / 16000), np.arange(len(w)) / sr, w).astype(np.float32)
        segs, _ = ouvido.transcribe(a16, language="pt", word_timestamps=True)
        return x, [{"p": p.word.strip(), "ini": p.start, "fim": p.end} for s_ in segs for p in s_.words]
elif MOTOR == "edge":
    import asyncio, os, ssl
    import edge_tts, edge_tts.communicate, imageio_ffmpeg
    if os.environ.get("SSL_CERT_FILE"):  # atrás de um proxy que refaz o TLS
        edge_tts.communicate._SSL_CTX = ssl.create_default_context(cafile=os.environ["SSL_CERT_FILE"])
    def falar(texto, arq):
        async def pedir():
            mp3, ws = bytearray(), []
            c = edge_tts.Communicate(texto, cfg.get("voz", "pt-BR-AntonioNeural"), rate=cfg.get("ritmo", "+0%"), pitch=cfg.get("tom", "+0Hz"),
                                     boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
            async for m in c.stream():
                if m["type"] == "audio": mp3 += m["data"]
                elif m["type"] == "WordBoundary": ws.append({"p": m["text"], "ini": m["offset"] / 1e7, "fim": (m["offset"] + m["duration"]) / 1e7})
            return bytes(mp3), ws
        for tentativa in range(4):  # o serviço às vezes derruba a conexão ou manda o áudio cortado
            try:
                mp3, ws = asyncio.run(pedir())
                pcm = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "quiet", "-i", "-", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     input=mp3, capture_output=True, check=True).stdout
                x = np.frombuffer(pcm, np.float32).copy()
                if ws and ws[-1]["fim"] > len(x) / SR + 0.05: raise RuntimeError(f"áudio cortado em {len(x) / SR:.2f}s")
                break
            except Exception as e: print(f"  {texto!r} tentativa {tentativa + 1}: {e}", flush=True)
        return x, ws
else:
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    from faster_whisper import WhisperModel
    clone = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    ouvido = WhisperModel("medium", device="cpu", compute_type="int8")
    ref = str(RAIZ / cfg["referencia"])
    def falar(texto, arq):
        melhor = None
        for tentativa in range(4):  # refaz quando o Whisper não reconhece a frase (palavra engolida ou inventada)
            torch.manual_seed(7 + tentativa)
            w = clone.generate(texto, language_id="pt", audio_prompt_path=ref, exaggeration=cfg.get("expressao", 0.55),
                               cfg_weight=cfg.get("cfg", 0.5), temperature=0.75).squeeze().numpy()
            x = np.interp(np.arange(0, len(w) / clone.sr, 1 / SR), np.arange(len(w)) / clone.sr, w).astype(np.float32)
            a16 = np.interp(np.arange(0, len(w) / clone.sr, 1 / 16000), np.arange(len(w)) / clone.sr, w).astype(np.float32)
            segs, _ = ouvido.transcribe(a16, language="pt", word_timestamps=True)
            ws = [{"p": p.word.strip(), "ini": p.start, "fim": p.end} for s_ in segs for p in s_.words]
            r = difflib.SequenceMatcher(None, " ".join(norm(texto)), " ".join(norm(" ".join(p["p"] for p in ws)))).ratio()
            if not melhor or r > melhor[0]: melhor = (r, x, ws)
            print(f"  {texto!r} tentativa {tentativa + 1}: {r:.2f}", flush=True)
            if r >= 0.9: break
        return melhor[1], melhor[2]

def aparar(x):
    """Tira o silêncio do começo e do fim. Devolve o trecho e quanto foi cortado do começo (s)."""
    env = np.convolve(np.abs(x), np.ones(220) / 220, mode="same")
    som = np.where(env > max(0.012, env.max() * 0.05))[0]
    if not len(som): return x, 0.0
    ini = max(0, som[0] - int(0.03 * SR))
    return x[ini: som[-1] + int(0.1 * SR)], ini / SR

pedacos, tempos, t = [], [], cfg.get("inicio", 0.0)  # pedacos: (início em s, áudio)
for i, f in enumerate(cfg["frases"]):
    fala = f.get("fala") or re.sub(r"\*", "", f["texto"])
    x, ouvidas = falar(fala, tmp / f"{i:02d}.wav")
    x, corte = aparar(x)
    x = x / max(1e-6, np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2))) * 0.12  # todas as frases no mesmo volume
    dur = len(x) / SR
    brutas = f["texto"].split()
    palavras = []
    if ouvidas:  # legenda no tempo das palavras que o Whisper ouviu
        for j, p in enumerate(brutas):
            a_ = ouvidas[min(len(ouvidas) - 1, int(j * len(ouvidas) / len(brutas)))]
            b_ = ouvidas[min(len(ouvidas) - 1, int((j + 1) * len(ouvidas) / len(brutas)) - 1)] if j < len(brutas) - 1 else ouvidas[-1]
            palavras.append({"p": p.replace("*", ""), "ini": round(t + max(0, a_["ini"] - corte), 3),
                             "fim": round(t + min(dur, max(a_["fim"], b_["fim"]) - corte), 3), "tom": "*" in p})
    else:  # sem Whisper: o tempo da frase dividido pelo tamanho de cada palavra
        pesos = [len(re.sub(r"[^\wÀ-ú]", "", p)) + 2 + (4 if re.search(r"[.?!:,]\*?$", p) else 0) for p in brutas]
        soma, acc = sum(pesos), 0.0
        for p, w in zip(brutas, pesos):
            ini = t + dur * acc / soma; acc += w
            palavras.append({"p": p.replace("*", ""), "ini": round(ini, 3), "fim": round(t + dur * acc / soma, 3), "tom": "*" in p})
    tempos.append({**{k: v for k, v in f.items() if k not in ("texto", "fala")}, "ini": round(t, 3), "fim": round(t + dur, 3), "palavras": palavras})
    pedacos.append((t, x))
    t += dur + f.get("pausa", 0.3)

y = np.zeros(int(SR * t) + 1)
for ini, x in pedacos:
    i = int(ini * SR); y[i:i + len(x)] += x[: len(y) - i]
y = y / max(1e-6, np.abs(y).max()) * 0.79  # pico em -2 dB
with wave.open(str(RAIZ / "rascunhos" / "instagram" / f"{nome}-voz.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
duracao = round(len(y) / SR, 2)
(RAIZ / "instagram" / "narracao" / f"{nome}.tempos.json").write_text(json.dumps({"duracao": duracao, "frases": tempos}, ensure_ascii=False, indent=1))
print(f"{nome}: voz {cfg.get('voz', MOTOR)}, {len(tempos)} frases, {duracao}s")
