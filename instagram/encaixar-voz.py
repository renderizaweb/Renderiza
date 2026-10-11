# Voz gravada no Reels narrado: pega o áudio que a pessoa gravou (com testes, erros e repetições), trata a voz,
# transcreve palavra a palavra e acha cada frase de instagram/narracao/<nome>.json. Grava o mesmo que o narrar.py:
#   rascunhos/instagram/<nome>-voz.wav       só as frases, na ordem, com as pausas do roteiro
#   instagram/narracao/<nome>.tempos.json    início e fim de cada frase e de cada palavra (a página e a trilha usam)
# Uso: python3 instagram/encaixar-voz.py reels-narrado <gravacao.m4a>
# Precisa de: python3 -m pip install faster-whisper numpy imageio-ffmpeg (o modelo "medium" baixa na primeira vez)
# Na frase, "ouvir" diz como ela aparece na transcrição (quando difere da legenda) e "tomada": "ultima" fica com a
# última vez que ela foi gravada (as outras ficam com a primeira boa depois da frase anterior).
import difflib, json, re, subprocess, sys, unicodedata, wave
from pathlib import Path
import numpy as np
import imageio_ffmpeg

RAIZ = Path(__file__).resolve().parent.parent
nome, entrada = sys.argv[1], sys.argv[2]
cfg = json.loads((RAIZ / "instagram" / "narracao" / f"{nome}.json").read_text())
TMP = RAIZ / "rascunhos" / "instagram"; TMP.mkdir(parents=True, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100

# 1. trata a voz: corta graves e ruído, tira o "embolado", dá presença, comprime e acelera um pouco (sem mudar o tom)
tratada = TMP / f"{nome}-gravacao.wav"
filtros = ",".join(["highpass=f=85", "afftdn=nf=-28", "equalizer=f=220:t=q:w=1.2:g=-2.5", "equalizer=f=3200:t=q:w=1.5:g=3",
                    "equalizer=f=9000:t=q:w=1:g=1.5", "acompressor=threshold=-22dB:ratio=3.2:attack=6:release=90:makeup=2",
                    f"atempo={cfg.get('gravacao', {}).get('acelerar', 1.0)}"])
subprocess.run([FF, "-y", "-loglevel", "error", "-i", entrada, "-af", filtros, "-ac", "1", "-ar", str(SR), str(tratada)], check=True)
with wave.open(str(tratada)) as w:
    voz = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

# 2. transcreve (fica guardada: só refaz se a gravação mudar)
cache = TMP / f"{nome}-transcricao.json"
assinatura = f"{Path(entrada).stat().st_size}-{filtros}"
dados = json.loads(cache.read_text()) if cache.exists() else {}
if dados.get("assinatura") != assinatura:
    from faster_whisper import WhisperModel
    a16 = np.interp(np.arange(0, len(voz) / SR, 1 / 16000), np.arange(len(voz)) / SR, voz).astype(np.float32)
    segs, _ = WhisperModel("medium", device="cpu", compute_type="int8").transcribe(
        a16, language="pt", word_timestamps=True, beam_size=5, initial_prompt="Instagram. Google. WhatsApp. Comenta prévia. Renderiza.")
    dados = {"assinatura": assinatura, "palavras": [{"p": w.word.strip(), "ini": w.start, "fim": w.end} for s in segs for w in s.words]}
    cache.write_text(json.dumps(dados, ensure_ascii=False, indent=1))
P = dados["palavras"]

# 3. acha cada frase na transcrição
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()).split()
fala = [norm(p["p"])[0] if norm(p["p"]) else "" for p in P]
def achar(alvo, desde, ultima):
    n, melhores = len(alvo), []
    for i in range(desde, len(P)):
        for m in (n - 2, n - 1, n, n + 1, n + 2):
            if m < 1 or i + m > len(P): continue
            r = difflib.SequenceMatcher(None, " ".join(alvo), " ".join(fala[i:i + m])).ratio()
            melhores.append((r, i, m))
    topo = max(r for r, _, _ in melhores)
    boas = [x for x in melhores if x[0] >= topo - 0.04]
    r, i, m = max(boas, key=lambda x: (x[1] + x[2], x[0], -x[1])) if ultima else min(boas, key=lambda x: (x[1], -x[0]))
    return r, i, m

frases, desde, pedacos, t = [], 0, [], cfg.get("inicio", 0.15)
for f in cfg["frases"]:
    alvo = norm(f.get("ouvir") or f["texto"].replace("*", ""))
    r, i, m = achar(alvo, desde, f.get("tomada") == "ultima")
    if r < 0.6: raise SystemExit(f"não achei a frase {f['id']} na gravação (melhor: {' '.join(fala[i:i+m])!r}, {r:.2f})")
    desde = i + m
    ws = P[i:i + m]
    # recorte com folga, sem invadir a palavra vizinha
    ini = max(ws[0]["ini"] - 0.08, P[i - 1]["fim"] + 0.02 if i > 0 else 0)
    fim = min(ws[-1]["fim"] + 0.16, P[i + m]["ini"] - 0.02 if i + m < len(P) else len(voz) / SR)
    # o Whisper estica o fim da última palavra pelo silêncio: corta pelo som de verdade
    env = np.convolve(np.abs(voz[int(ini * SR): int(fim * SR)]), np.ones(441) / 441, mode="same")
    som = np.where(env > max(0.02, env.max() * 0.06))[0]
    if len(som): ini, fim = ini + max(0, som[0] - 0.05 * SR) / SR, ini + min(len(env), som[-1] + 0.12 * SR) / SR
    x = voz[int(ini * SR): int(fim * SR)].copy()
    k = int(0.012 * SR); x[:k] *= np.linspace(0, 1, k); x[-k:] *= np.linspace(1, 0, k)
    # palavras da legenda no tempo das palavras faladas (a legenda pode ter outra grafia: 22h47 x "dez e quarenta")
    leg = f["texto"].split()
    palavras = []
    for j, p in enumerate(leg):
        a = ws[min(len(ws) - 1, int(j * len(ws) / len(leg)))]
        b = ws[min(len(ws) - 1, int((j + 1) * len(ws) / len(leg)) - 1)] if j < len(leg) - 1 else ws[-1]
        palavras.append({"p": p.replace("*", ""), "ini": round(t + max(0, a["ini"] - ini), 3), "fim": round(t + min(max(a["fim"], b["fim"]) - ini, fim - ini), 3), "tom": "*" in p})
    dur = len(x) / SR
    frases.append({**{k2: v for k2, v in f.items() if k2 not in ("texto", "ouvir", "tomada")}, "ini": round(t, 3), "fim": round(t + dur, 3),
                   "palavras": palavras, "ouvido": " ".join(w["p"] for w in ws), "acerto": round(r, 2)})
    pedacos.append((t, x))
    t += dur + f.get("pausa", 0.3)

y = np.zeros(int(SR * t) + 1)
for ini, x in pedacos:
    j = int(ini * SR); y[j:j + len(x)] += x[: len(y) - j]
y = y / max(1e-6, np.abs(y).max()) * 0.89
with wave.open(str(TMP / f"{nome}-voz.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
duracao = round(len(y) / SR, 2)
(RAIZ / "instagram" / "narracao" / f"{nome}.tempos.json").write_text(json.dumps({"duracao": duracao, "frases": frases}, ensure_ascii=False, indent=1))
for f in frases: print(f"{f['id']:8} {f['ini']:6.2f} {f['acerto']:.2f}  {f['ouvido']}")
print(f"{nome}: voz gravada, {len(frases)} frases, {duracao}s")
