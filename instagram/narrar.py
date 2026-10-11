# Voz do Reels narrado: lê instagram/narracao/<nome>.json, fala cada frase com o Piper (voz livre, roda aqui, sem
# serviço de fora) e grava:
#   rascunhos/instagram/<nome>-voz.wav       a narração inteira, com as pausas
#   instagram/narracao/<nome>.tempos.json    início e fim de cada frase e de cada palavra (a página usa)
# Uso: python3 instagram/narrar.py reels-narrado
# A voz (.onnx) é baixada na primeira vez para rascunhos/vozes/ (huggingface.co/rhasspy/piper-voices).
# Precisa de: python3 -m pip install piper-tts numpy
import json, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
nome = sys.argv[1]
cfg = json.loads((RAIZ / "instagram" / "narracao" / f"{nome}.json").read_text())
VOZES = RAIZ / "rascunhos" / "vozes"; VOZES.mkdir(parents=True, exist_ok=True)
voz = cfg["voz"]; lang, quem, qual = voz.split("-")
modelo = VOZES / f"{voz}.onnx"
for ext in (".onnx", ".onnx.json"):
    arq = VOZES / f"{voz}{ext}"
    if not arq.exists():
        url = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang.split('_')[0]}/{lang}/{quem}/{qual}/{voz}{ext}"
        subprocess.run(["curl", "-sSLf", "-m", "300", "-o", str(arq), url], check=True)

tmp = RAIZ / "rascunhos" / "instagram" / f".voz-{nome}"; tmp.mkdir(parents=True, exist_ok=True)
SR = None
def falar(texto, arq):
    global SR
    subprocess.run([sys.executable, "-m", "piper", "-m", str(modelo), "-f", str(arq), "--length-scale", str(cfg.get("velocidade", 1.0)),
                    "--sentence-silence", "0.12"], input=texto.encode(), check=True, capture_output=True)
    with wave.open(str(arq)) as w:
        SR = w.getframerate()
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

def aparar(x):
    """Tira o silêncio do começo e do fim (o Piper deixa uma folga)."""
    env = np.convolve(np.abs(x), np.ones(220) / 220, mode="same")
    voz = np.where(env > 0.012)[0]
    if not len(voz): return x
    return x[max(0, voz[0] - 300): voz[-1] + 900]

pedacos, tempos, t = [], [], cfg.get("inicio", 0.0)  # pedacos: (início em s, áudio)
for i, f in enumerate(cfg["frases"]):
    fala = f.get("fala") or re.sub(r"\*", "", f["texto"])
    x = aparar(falar(fala, tmp / f"{i:02d}.wav"))
    dur = len(x) / SR
    # palavras da legenda: o tempo da frase dividido pelo tamanho de cada palavra (aproximado, sem alinhamento fino)
    brutas = f["texto"].split()
    pesos = [len(re.sub(r"[^\wÀ-ú]", "", p)) + 2 + (4 if re.search(r"[.?!:,]\*?$", p) else 0) for p in brutas]
    soma, acc, palavras = sum(pesos), 0.0, []
    for p, w in zip(brutas, pesos):
        ini = t + dur * acc / soma; acc += w
        palavras.append({"p": p.replace("*", ""), "ini": round(ini, 3), "fim": round(t + dur * acc / soma, 3), "tom": "*" in p})
    tempos.append({**{k: v for k, v in f.items() if k not in ("texto", "fala")}, "ini": round(t, 3), "fim": round(t + dur, 3), "palavras": palavras})
    pedacos.append((t, x))
    t += dur + f.get("pausa", 0.3)

y = np.zeros(int(SR * t) + 1)
for ini, x in pedacos:
    i = int(ini * SR); y[i:i + len(x)] += x[: len(y) - i]
y = y / max(1e-6, np.abs(y).max()) * 0.89
with wave.open(str(RAIZ / "rascunhos" / "instagram" / f"{nome}-voz.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
duracao = round(len(y) / SR, 2)
(RAIZ / "instagram" / "narracao" / f"{nome}.tempos.json").write_text(json.dumps({"duracao": duracao, "frases": tempos}, ensure_ascii=False, indent=1))
print(f"{nome}: voz {cfg['voz']}, {len(tempos)} frases, {duracao}s")
