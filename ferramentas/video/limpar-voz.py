# Tratamento de voz gravada no celular, para narração: tira o ruído e as vozes de fundo, limpa e nivela sem estourar.
# Uso: python3 ferramentas/video/limpar-voz.py <entrada (m4a, mp3, wav...)> <saida.wav>
#   1. DeepFilterNet 3 (rede neural de redução de ruído, roda aqui): ruído, eco do cômodo e vozes ao fundo caem ~25 dB
#   2. ffmpeg: corta o grave que embola, tira o "som de caixa", um pouco de presença e ar, tira o chiado do "s",
#      compressão leve, volume no padrão de narração (-16 LUFS) e limitador em -2 dBTP, sem saturar nada.
# Precisa de: python3 -m pip install deepfilternet imageio-ffmpeg numpy; torch e torchaudio (CPU:
#   --index-url https://download.pytorch.org/whl/cpu). O modelo baixa na primeira vez para rascunhos/vozes/.
import subprocess, sys, tempfile, types, wave, zipfile
from pathlib import Path
import numpy as np
import imageio_ffmpeg

RAIZ = Path(__file__).resolve().parent.parent.parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
entrada, saida = sys.argv[1], sys.argv[2]
POLIMENTO = ",".join([
    "highpass=f=75:p=2",                          # grave de manuseio e vento
    "equalizer=f=180:t=q:w=1.1:g=-1.5",           # embolado do peito perto do celular
    "equalizer=f=420:t=q:w=1.4:g=-2",             # "som de caixa" do cômodo
    "equalizer=f=3800:t=q:w=1.3:g=1.5",           # presença (entendimento)
    "treble=g=1.5:f=11000",                       # ar
    "deesser=i=0.35:m=0.5:f=0.5",
    "acompressor=threshold=-24dB:ratio=2.2:attack=15:release=160:knee=6",
    "loudnorm=I=-16:TP=-2:LRA=8",
    "alimiter=limit=0.79:attack=3:release=60:level=disabled",
])

def ler(p):
    with wave.open(str(p)) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768

with tempfile.TemporaryDirectory() as tmp:
    bruto, limpo = Path(tmp) / "bruto48.wav", Path(tmp) / "limpo48.wav"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", entrada, "-ac", "1", "-ar", "48000", str(bruto)], check=True)
    # o deepfilternet ainda importa um módulo que o torchaudio novo removeu: um substituto vazio basta
    for nome in ("torchaudio.backend", "torchaudio.backend.common"):
        sys.modules.setdefault(nome, types.ModuleType(nome))
    sys.modules["torchaudio.backend.common"].AudioMetaData = type("AudioMetaData", (), {})
    import torch
    from df.enhance import enhance, init_df
    modelos = RAIZ / "rascunhos" / "vozes"; modelos.mkdir(parents=True, exist_ok=True)
    if not (modelos / "DeepFilterNet3").exists():
        zipf = modelos / "DeepFilterNet3.zip"
        subprocess.run(["curl", "-sSLf", "-m", "300", "-o", str(zipf),
                        "https://raw.githubusercontent.com/Rikorose/DeepFilterNet/main/models/DeepFilterNet3.zip"], check=True)
        zipfile.ZipFile(zipf).extractall(modelos)
    modelo, estado, _ = init_df(str(modelos / "DeepFilterNet3"), log_level="ERROR")
    y = enhance(modelo, estado, torch.from_numpy(ler(bruto)[None, :])).numpy()[0]
    with wave.open(str(limpo), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(limpo), "-af", POLIMENTO, "-ar", "44100", "-ac", "1", saida], check=True)
print(f"{saida}: voz tratada (DeepFilterNet 3 + polimento, -16 LUFS, pico -2 dB)")
