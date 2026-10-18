# Trilha do Reels narrado (sintetizada aqui, sem direitos de terceiros): pulsante, em lá menor, sem piano doce.
# Segue as cenas da narração (instagram/narracao/<nome>.tempos.json) e mixa a voz por cima, abaixando a música
# enquanto ela fala.
# Uso: python3 ferramentas/video/trilha-pulso.py <tempos.json> <voz.wav> <saida.wav> <duracao_s> [--bpm 124] [--tom 0]
#   --tom sobe ou desce a trilha em semitons (lá menor é 0), para os Reels da mesma semana não soarem iguais.
#   Sem voz (Reels só com texto): passe um WAV mudo; a música fica sozinha a -15 dBFS RMS. O gerar.mjs faz isso com "pulso".
#   abre: drone grave e batidas de impacto · google: pulso de baixo e chimbal (o relógio) · insta: entra o bumbo
#   reto e a palma; "Nada." corta tudo · volta: a batida abafada · meio: só o drone e um coração batendo
#   ese: subida (ruído e tom crescendo) até o drop · site: tudo, com acordes curtos · fim: só os impactos · cta: fecha
import argparse, json, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("tempos"); ap.add_argument("voz"); ap.add_argument("saida"); ap.add_argument("duracao", type=float)
ap.add_argument("--bpm", type=float, default=124)
ap.add_argument("--tom", type=int, default=0)
a = ap.parse_args()
SR = 44100
rng = np.random.default_rng(11)
fr = json.load(open(a.tempos))["frases"]
dur = a.duracao
N = int(SR * (dur + 1))

def cena(nome, fim=False):
    xs = [f for f in fr if f["cena"] == nome]
    return (xs[-1]["fim"] + xs[-1].get("pausa", 0)) if fim else xs[0]["ini"]
C = {c: (cena(c), cena(c, True)) for c in dict.fromkeys(f["cena"] for f in fr)}
C["abre"] = (0.0, C["abre"][1])
DROP = C["site"][0]
BEAT = 60 / a.bpm
# a grade de tempos é ancorada no drop: ele cai num tempo forte
grade = lambda t0, t1, passo: [DROP + k * passo for k in range(int(np.floor((t0 - DROP) / passo)) - 1, int(np.ceil((t1 - DROP) / passo)) + 1) if t0 - 1e-6 <= DROP + k * passo < t1]

def hz(nota):
    nomes = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    return 440.0 * 2 ** ((nomes[nota[:-1]] + 12 * (int(nota[-1]) + 1) - 69 + a.tom) / 12)

def filtro(x, baixo=None, alto=None, ordem=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if baixo: g *= 1 / np.sqrt(1 + (f / baixo) ** (2 * ordem))
    if alto: g *= 1 / np.sqrt(1 + (alto / np.maximum(f, 1e-6)) ** (2 * ordem))
    return np.fft.irfft(X * g, len(x))

def somar(dest, sinal, ini, ganho=1.0):
    i = int(ini * SR)
    if i < 0: sinal, i = sinal[-i:], 0
    if i >= N: return
    s = sinal[: N - i] * ganho
    dest[i:i + len(s)] += s

T = lambda d: np.arange(int(SR * d)) / SR
def bumbo(forte=1.0):
    t = T(0.42); f = 42 + 110 * np.exp(-t / 0.03)
    return np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.19)) * forte
def palma():
    t = T(0.25); x = filtro(rng.standard_normal(len(t)), baixo=6000, alto=900)
    env = sum(np.exp(-np.maximum(0, t - d) / 0.012) * (t >= d) for d in (0, 0.011, 0.023)) * 0.5 + np.exp(-t / 0.09) * 0.6
    return x * env
def chimbal(aberto=False):
    t = T(0.3 if aberto else 0.06)
    return filtro(rng.standard_normal(len(t)), alto=7500) * np.exp(-t / (0.09 if aberto else 0.014))
def sub(f, d):
    t = T(d); env = np.minimum(1, t / 0.006) * np.minimum(1, np.maximum(0, (d - t) / 0.03)) * np.exp(-t / 0.5)
    return np.tanh(1.8 * np.sin(2 * np.pi * f * t)) * env
def pluck(notas, d=0.32):
    t = T(d); y = np.zeros_like(t)
    for f in notas:
        for k in range(1, int(7000 / f)):
            y += np.sin(2 * np.pi * k * f * t) / k * np.exp(-t * (3 + k * 1.2))
    return y * np.minimum(1, t / 0.003) / len(notas) * 0.9
def drone(f, d):
    t = T(d); y = np.zeros_like(t)
    for des in (-0.003, 0, 0.003):
        for k in range(1, 12):
            y += np.sin(2 * np.pi * k * f * (1 + des) * t + rng.uniform(0, 6.28)) / k
    y = filtro(y, baixo=900)
    return y * np.minimum(1, t / 0.8) * np.minimum(1, np.maximum(0, (d - t) / 0.8)) / 6
def impacto():
    t = T(2.2); f = 30 + 70 * np.exp(-t / 0.08)
    boom = np.tanh(2.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7))
    ar = filtro(rng.standard_normal(len(t)), baixo=3000) * np.exp(-t / 0.35) * 0.5
    return boom + ar
def subida(d):
    t = T(d); x = rng.standard_normal(len(t))
    corte = 300 + 9000 * (t / d) ** 2
    y = np.zeros_like(t); bloco = 2048
    for i in range(0, len(t), bloco):
        y[i:i + bloco] = filtro(x[i:i + bloco], baixo=corte[min(i, len(t) - 1)], alto=200)[: len(y[i:i + bloco])]
    tom = np.sin(2 * np.pi * np.cumsum(hz("A2") * 2 ** (2 * t / d)) / SR) * 0.35
    return (y * 0.9 + tom) * (t / d) ** 1.6

bat = np.zeros(N); grave = np.zeros(N); harm = np.zeros(N); fx = np.zeros(N)
ACORDES = {"Am": ("A1", ["A3", "C4", "E4"]), "F": ("F1", ["A3", "C4", "F4"]), "C": ("C2", ["G3", "C4", "E4"]), "G": ("G1", ["G3", "B3", "D4"])}
PROG = ["Am", "F", "C", "G"]
acorde = lambda t: PROG[int(np.floor((t - DROP) / (4 * BEAT))) % 4]

# abre: drone grave
somar(harm, drone(hz("A1"), C["abre"][1] + 1.0), 0.0, 1.0)
# google: o relógio (chimbal em colcheias) e o pulso de baixo em lá
for t in grade(*C["google"], BEAT / 2): somar(bat, chimbal(), t, 0.35)
for t in grade(*C["google"], BEAT / 2): somar(grave, sub(hz("A1"), BEAT / 2 * 0.9), t, 0.55)
somar(harm, drone(hz("A2"), C["google"][1] - C["google"][0] + 0.5), C["google"][0], 0.5)
# insta: bumbo reto, palma, chimbal em semicolcheias; corta em "Nada."
nada = next(f for f in fr if f["id"] == "nada")["ini"]
for t in grade(C["insta"][0], nada, BEAT): somar(bat, bumbo(), t, 0.9)
for t in grade(C["insta"][0], nada, 2 * BEAT): somar(bat, palma(), t + BEAT, 0.45)
for k, t in enumerate(grade(C["insta"][0], nada, BEAT / 4)): somar(bat, chimbal(), t, 0.22 + 0.12 * (k % 2 == 0))
for t in grade(C["insta"][0], nada, BEAT / 2): somar(grave, sub(hz("A1") if acorde(t) == "Am" else hz(ACORDES[acorde(t)][0]), BEAT / 2 * 0.85), t, 0.6)
# volta: a batida abafada (filtrada depois)
abaf = np.zeros(N)
for t in grade(*C["volta"], BEAT): somar(abaf, bumbo(0.8), t, 0.9)
for t in grade(*C["volta"], BEAT / 2): somar(abaf, sub(hz("A1"), BEAT / 2 * 0.85), t, 0.6)
# meio: drone e um coração (dois bumbos curtos por compasso)
somar(harm, drone(hz("A1"), C["meio"][1] - C["meio"][0] + 1.0), C["meio"][0], 1.1)
for t in grade(*C["meio"], 4 * BEAT): somar(bat, bumbo(0.7), t, 0.7); somar(bat, bumbo(0.5), t + 0.28, 0.6)
# ese: subida até o drop, com caixa acelerando
somar(fx, subida(DROP - C["ese"][0]), C["ese"][0], 0.55)
t = C["ese"][0]
while t < DROP - 0.05:
    resto = DROP - t; passo = BEAT if resto > 2 * BEAT * 2 else (BEAT / 2 if resto > BEAT * 2 else BEAT / 4)
    somar(bat, palma(), t, 0.2 + 0.4 * (1 - resto / (DROP - C["ese"][0])))
    t += passo
# site: o drop, tudo junto, com acordes curtos
for t in grade(*C["site"], BEAT): somar(bat, bumbo(), t, 1.0)
for t in grade(*C["site"], 2 * BEAT): somar(bat, palma(), t + BEAT, 0.5)
for t in grade(*C["site"], BEAT): somar(bat, chimbal(aberto=True), t + BEAT / 2, 0.25)
for t in grade(*C["site"], BEAT / 4): somar(bat, chimbal(), t, 0.18)
for t in grade(*C["site"], BEAT / 2): somar(grave, sub(hz(ACORDES[acorde(t)][0]), BEAT / 2 * 0.85), t, 0.7)
for t in grade(*C["site"], BEAT * 0.75): somar(harm, pluck([hz(n) for n in ACORDES[acorde(t)][1]]), t, 0.55)
# cta: volta o pulso e fecha num acorde de lá menor
for t in grade(C["cta"][0], dur - 1.2, BEAT): somar(bat, bumbo(0.9), t, 0.85)
for t in grade(C["cta"][0], dur - 1.2, BEAT / 2): somar(grave, sub(hz(ACORDES[acorde(t)][0]), BEAT / 2 * 0.85), t, 0.6)
somar(harm, drone(hz("A2"), dur - C["cta"][0] + 0.5), C["cta"][0], 0.8)
# impactos marcados na narração (e o corte do "Nada.")
for f in fr:
    if f.get("impacto"): somar(fx, impacto(), f["ini"] - 0.03, 0.8)

grave = filtro(grave, baixo=380)
abaf = filtro(abaf, baixo=420)
harm = filtro(harm, baixo=5200)
musica = 0.9 * bat + 0.85 * grave + 0.6 * harm + 0.8 * fx + 0.8 * abaf

# a voz por cima: a música abaixa enquanto ela fala
with wave.open(a.voz) as w:
    vsr = w.getframerate(); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
voz = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
voz = np.pad(voz, (0, max(0, N - len(voz))))[:N]
fala = np.convolve(np.abs(voz) > 0.02, np.ones(int(SR * 0.25)) / (SR * 0.25), mode="same")
fala = np.convolve(np.minimum(1, fala * 4), np.ones(int(SR * 0.12)) / (SR * 0.12), mode="same")
musica *= 1 - 0.55 * np.clip(fala, 0, 1)

def nivel(x):  # volume médio só onde há som
    return np.sqrt(np.mean(x[np.abs(x) > 1e-3] ** 2))
tem_voz = np.any(np.abs(voz) > 1e-3)  # Reels sem voz: a voz vem muda e a música fica sozinha, mais alta
alvo_db = 20 * np.log10(nivel(voz)) - 8 if tem_voz else -15  # música 8 dB abaixo da voz (já tratada e nivelada)
mix = voz + musica / nivel(musica) * 10 ** (alvo_db / 20)
mix = mix[: int(SR * dur)]
t = np.arange(len(mix)) / SR
mix *= np.minimum(1, t / 0.02) * np.minimum(1, np.maximum(0, (dur - t) / 1.2))
# limitador limpo (sem saturar): ganho que só abaixa nos picos, com antecipação de 5 ms e volta suave
TETO = 10 ** (-1.5 / 20)
pico = np.abs(mix); k = int(SR * 0.005)
pico = np.lib.stride_tricks.sliding_window_view(np.pad(pico, (k, k)), 2 * k + 1).max(axis=1)
ganho = np.minimum(1, TETO / np.maximum(pico, 1e-9))
volta = np.exp(-1 / (SR * 0.08))
for i in range(1, len(ganho)):  # solta devagar
    ganho[i] = min(ganho[i], 1 - (1 - ganho[i - 1]) * volta)
mix *= ganho
pcm = (np.stack([mix, mix], axis=1) * 32767).astype(np.int16)
with wave.open(a.saida, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{a.saida}: {dur:.1f}s, {a.bpm:.0f} bpm, tom {a.tom:+d}, drop em {DROP:.2f}s")
