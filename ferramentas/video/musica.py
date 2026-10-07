# Trilha de fundo original para o vídeo de apresentação (sintetizada aqui, sem direitos de terceiros).
# Uso: python3 ferramentas/video/musica.py <saida.wav> <duracao_s> [--entrada 2.7] [--fechamento 27.2] [--bpm 96]
#   Leve e alegre, em dó maior: piano elétrico em arpejo, pad macio, baixo, bumbo e chocalho baixinhos.
#   Compasso 0: só o pad (abertura); depois o groove; no fechamento, o acorde final soando até acabar.
#   Encaixa nos tempos do vídeo: o groove entra perto de --entrada e o acorde final perto de --fechamento.
import argparse, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("saida"); ap.add_argument("duracao", type=float)
ap.add_argument("--entrada", type=float, default=2.7); ap.add_argument("--fechamento", type=float, default=27.2)
ap.add_argument("--bpm", type=float, default=0); ap.add_argument("--semente", type=int, default=7)
ap.add_argument("--toques", default="", help="segundos da abertura em que cai uma nota (ex.: as trocas de foto da montagem)")
a = ap.parse_args()

SR = 44100
rng = np.random.default_rng(a.semente)
dur = a.duracao
# O tempo é escolhido para o groove começar na entrada e o acorde final cair no fechamento (compassos inteiros).
bpm = a.bpm or 96.0
compasso = 4 * 60 / bpm
if not a.bpm:
    n = max(4, round((a.fechamento - a.entrada) / 2.5))
    compasso = (a.fechamento - a.entrada) / n
    bpm = 240 / compasso
inicio_groove = a.entrada
n_comp = round((a.fechamento - a.entrada) / compasso)
batida = compasso / 4
N = int(SR * (dur + 0.5))
t_all = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

def hz(nota):  # "C4", "F#3"
    nomes = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    return 440.0 * 2 ** ((nomes[nota[:-1]] + 12 * (int(nota[-1]) + 1) - 69) / 12)

def filtro(x, baixo=None, alto=None, ordem=2):
    """Passa-baixa / passa-alta suaves no domínio da frequência (sem scipy)."""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if baixo: g *= 1 / np.sqrt(1 + (f / baixo) ** (2 * ordem))
    if alto: g *= 1 / np.sqrt(1 + (alto / np.maximum(f, 1e-6)) ** (2 * ordem))
    return np.fft.irfft(X * g, len(x))

def somar(destino_l, destino_r, sinal, ini, pan=0.0, ganho=1.0):
    i = int(ini * SR)
    if i >= N: return
    s = sinal[: N - i] * ganho
    destino_l[i:i + len(s)] += s * np.sqrt((1 - pan) / 2)
    destino_r[i:i + len(s)] += s * np.sqrt((1 + pan) / 2)

# Acordes (I–vi–IV–V com nonas): baixo e vozes do pad / do arpejo
ACORDES = {
    "C": ("C3", ["E4", "G4", "B4", "D5"]),
    "Am": ("A2", ["C4", "E4", "G4", "B4"]),
    "F": ("F2", ["A3", "C4", "E4", "G4"]),
    "G": ("G2", ["B3", "D4", "E4", "A4"]),
}
seq = (["C", "Am", "F", "G"] * 8)[: max(0, n_comp - 2)] + ["F", "G"]
seq = seq[-n_comp:] if n_comp >= 2 else ["C"] * n_comp

# ---- instrumentos ----
def piano(f, d=1.6, vel=1.0):
    """Piano elétrico (FM, como um Rhodes): ataque suave e brilho que cai rápido."""
    t = np.arange(int(SR * d)) / SR
    ind = 1.5 * np.exp(-t / 0.22)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.9)
    y = np.sin(2 * np.pi * f * t + ind * np.sin(2 * np.pi * f * t)) + 0.12 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3)
    return y * env * vel

def pad(notas, d, ataque=0.5, solta=0.7):
    t = np.arange(int(SR * d)) / SR
    y = np.zeros_like(t)
    for f in notas:
        for desafina in (-0.004, 0, 0.004):  # três vozes levemente desafinadas
            ff = f * (1 + desafina)
            for k in range(1, int(5000 / ff) + 1):  # dente de serra limitada em banda
                y += np.sin(2 * np.pi * k * ff * t + rng.uniform(0, 6.28)) / k
    env = np.minimum(1, t / ataque) * np.minimum(1, np.maximum(0, (d - t) / solta))
    return y * env / (len(notas) * 3 * 2)

def baixo(f, d):
    t = np.arange(int(SR * d)) / SR
    env = np.minimum(1, t / 0.01) * np.exp(-t / 0.6) * np.minimum(1, np.maximum(0, (d - t) / 0.06))
    return np.tanh(1.4 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t))) * env

def bumbo():
    t = np.arange(int(SR * 0.35)) / SR
    freq = 46 + 70 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.16)

def estalo():
    t = np.arange(int(SR * 0.18)) / SR
    return filtro(rng.standard_normal(len(t)), baixo=5200, alto=1300) * np.exp(-t / 0.045)

def chocalho():
    t = np.arange(int(SR * 0.08)) / SR
    return filtro(rng.standard_normal(len(t)), alto=6500) * np.exp(-t / 0.018)

# ---- arranjo ----
padL = np.zeros(N); padR = np.zeros(N); pnL = np.zeros(N); pnR = np.zeros(N)
drL = np.zeros(N); drR = np.zeros(N); bxL = np.zeros(N); bxR = np.zeros(N)

# abertura: o pad de dó cresce até o groove entrar
abre = max(1.0, inicio_groove)
somar(padL, padR, pad([hz(n) for n in ACORDES["C"][1]], abre + 0.6, ataque=abre * 0.45, solta=0.6), 0.0, ganho=1.9)
toques = [float(x) for x in a.toques.split(",") if x.strip()]
if toques:  # uma nota do acorde em cada troca de foto da abertura, subindo
    for k, tq in enumerate(t for t in toques if t < abre - 0.15):
        somar(pnL, pnR, piano(hz(["C5", "E5", "G5", "B5", "D6"][k % 5]), 2.4, 0.5 + 0.06 * k), tq, pan=(-0.3 if k % 2 else 0.3))
else:
    somar(pnL, pnR, piano(hz("G5"), 2.2, 0.55), max(0.0, abre - 1.85), pan=0.3)
    somar(pnL, pnR, piano(hz("E5"), 2.2, 0.5), max(0.0, abre - 1.2), pan=-0.3)
    somar(pnL, pnR, piano(hz("C5"), 2.2, 0.45), max(0.0, abre - 0.6), pan=0.0)

ARPEJO = [0, 1, 2, 3, 4, 3, 2, 1]
for c, nome in enumerate(seq):
    t0 = inicio_groove + c * compasso
    raiz, vozes = ACORDES[nome]
    f_vozes = [hz(n) for n in vozes] + [hz(vozes[0]) * 2]
    somar(padL, padR, pad([hz(n) for n in vozes], compasso + 0.5, ataque=0.25, solta=0.5), t0 - 0.05, ganho=0.85)
    for k, i in enumerate(ARPEJO):  # colcheias, com leve balanço
        tk = t0 + k * batida / 2 + (0.018 if k % 2 else 0)
        vel = (0.9 if k == 0 else 0.62 if k % 2 == 0 else 0.48) * (0.75 if c == 0 else 1)
        somar(pnL, pnR, piano(f_vozes[i] * 2 if i == 4 and nome in ("F", "G") else f_vozes[i], 1.3, vel), tk, pan=(-0.35 if k % 2 else 0.35))
    fb = hz(raiz)
    somar(bxL, bxR, baixo(fb, batida * 1.5), t0)
    somar(bxL, bxR, baixo(fb, batida * 0.9), t0 + 2 * batida, ganho=0.8)
    somar(bxL, bxR, baixo(fb * 1.5, batida * 0.45), t0 + 3.5 * batida, ganho=0.55)
    if c >= 1 or len(seq) < 4:  # a bateria entra no segundo compasso
        for b in range(4):
            tb = t0 + b * batida
            if b in (0, 2): somar(drL, drR, bumbo(), tb, ganho=0.9)
            if b in (1, 3): somar(drL, drR, estalo(), tb, pan=-0.15, ganho=0.22)
        for e in range(8):
            somar(drL, drR, chocalho(), t0 + e * batida / 2 + (0.018 if e % 2 else 0), pan=0.4, ganho=0.10 if e % 2 else 0.06)

# fechamento: dó maior com nona, dedilhado, soando até o fim
fim = inicio_groove + n_comp * compasso
raiz, vozes = ACORDES["C"]
somar(padL, padR, pad([hz(n) for n in vozes], dur - fim + 0.5, ataque=0.15, solta=max(0.5, dur - fim - 0.3)), fim - 0.05, ganho=0.9)
for k, n in enumerate(["C4", "E4", "G4", "B4", "D5", "G5"]):
    somar(pnL, pnR, piano(hz(n), max(1.0, dur - fim), 0.55), fim + k * 0.055, pan=-0.3 + 0.12 * k)
somar(bxL, bxR, baixo(hz("C2") * 2, min(2.5, dur - fim)), fim, ganho=0.9)

# ---- mixagem: filtros, "respiração" do pad com o bumbo, reverb e volume ----
padL, padR = filtro(padL, baixo=1700), filtro(padR, baixo=1700)
kick_env = np.zeros(N)
for c in range(1, len(seq)):
    for b in (0, 2):
        i = int((inicio_groove + c * compasso + b * batida) * SR)
        if i < N:
            n = min(N - i, int(SR * 0.3)); kick_env[i:i + n] = np.maximum(kick_env[i:i + n], np.exp(-np.arange(n) / SR / 0.12))
respira = 1 - 0.3 * kick_env
padL *= respira; padR *= respira
bxL, bxR = filtro(bxL, baixo=420), filtro(bxR, baixo=420)

def reverb(x, segundos=2.2, semente=1):
    r = np.random.default_rng(semente)
    t = np.arange(int(SR * segundos)) / SR
    ir = filtro(r.standard_normal(len(t)), baixo=6000) * np.exp(-t / 0.55)
    ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + len(ir)
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)]

seco_L = 0.55 * padL + 0.75 * pnL + 0.9 * bxL + 0.55 * drL
seco_R = 0.55 * padR + 0.75 * pnR + 0.9 * bxR + 0.55 * drR
envio_L = 0.6 * padL + 0.5 * pnL + 0.12 * drL
envio_R = 0.6 * padR + 0.5 * pnR + 0.12 * drR
L = seco_L + 0.32 * reverb(envio_L, semente=1)
R = seco_R + 0.32 * reverb(envio_R, semente=2)

L, R = L[: int(SR * dur)], R[: int(SR * dur)]
n = len(L); t = np.arange(n) / SR
fade = np.minimum(1, t / 0.15) * np.minimum(1, np.maximum(0, (dur - t) / 1.6))
L *= fade; R *= fade
L -= L.mean(); R -= R.mean()
pico = max(np.abs(L).max(), np.abs(R).max())
rms = np.sqrt(np.mean((L ** 2 + R ** 2) / 2))
ganho = min(0.89 / pico, 10 ** (-17 / 20) / rms)  # pico até -1 dB, média por volta de -17 dBFS
L, R = np.tanh(L * ganho * 1.05) / 1.05, np.tanh(R * ganho * 1.05) / 1.05
pcm = (np.stack([L, R], axis=1) * 32767).astype(np.int16)
with wave.open(a.saida, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{a.saida}: {dur:.1f}s, {bpm:.1f} bpm, {n_comp} compassos no groove, pico {20*np.log10(max(np.abs(L).max(), np.abs(R).max())):.1f} dB, média {20*np.log10(np.sqrt(np.mean((L**2+R**2)/2))):.1f} dB")
