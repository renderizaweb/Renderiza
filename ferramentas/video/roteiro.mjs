// Roteiro padrão do vídeo de apresentação, montado a partir de uma demo da linha comum (ferramentas/demo/gerar.py).
// Uso: node ferramentas/video/roteiro.mjs <pasta-da-demo> [id-do-lead] [--show]
//   --show: versão mais caprichada (~45 s): abertura em montagem de fotos em tela cheia com o nome e a frase da
//   ótica, os dois carrosséis, atendimento e Instagram, e fechamento com o site inteiro rolando num celular.
//   Grava gravacoes/<id-do-lead>.json (id = pasta quando não vem). Depois: revisar o JSON (legendas, nome do
//   dono), rodar o ensaio e gravar:
//     node ferramentas/video/gravar.mjs gravacoes/<id>.json --ensaio   (1 quadro por parada, ~20 s)
//     node ferramentas/video/gravar.mjs gravacoes/<id>.json            (o vídeo, ~3 min)
// Cenas do padrão (só entram as que a demo tem): topo, foto do topo, história, números do Google, primeiro
// carrossel (dois toques passando as fotos), seletor de rosto (dois toques), avaliações (um toque), visita
// (toque no WhatsApp). Cores, fontes, nome, bairro e hora de loja aberta saem da própria demo.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SHOW = process.argv.includes("--show");
const [pasta, idLead] = process.argv.slice(2).filter(x => !x.startsWith("--"));
if (!pasta) { console.error("Uso: node ferramentas/video/roteiro.mjs <pasta-da-demo> [id-do-lead]"); process.exit(1); }
const arqConfig = join(RAIZ, "demos", pasta, "demo.json");
if (!existsSync(arqConfig)) { console.error(`demos/${pasta}/demo.json não existe: esta demo não é da linha comum. Escreva o roteiro à mão (modelo: gravacoes/otica-machado.json).`); process.exit(1); }
const d = JSON.parse(readFileSync(arqConfig, "utf8"));
const html = readFileSync(join(RAIZ, "demos", pasta, "index.html"), "utf8").replace(/data:[^"')]+/g, "");
const tem = s => html.includes(s);

// Cor de fundo mais escura para o degradê das cartelas.
const escurecer = (hex, k = 0.62) => "#" + hex.replace("#", "").match(/../g).map(x => Math.round(parseInt(x, 16) * k).toString(16).padStart(2, "0")).join("");

// Hora com a loja aberta (para o "Aberto agora" do topo): dia útil com horário, 1h15 depois de abrir.
function horaAberta() {
  const m = /hours:\s*(\{[^}]*\})/.exec(html);
  let horas = null;
  try { horas = m && JSON.parse(m[1].replace(/(\d+):/g, '"$1":')); } catch (e) { /* sem horário legível */ }
  const DOMINGO = new Date("2026-10-04T12:00:00-03:00"); // 04/10/2026 foi domingo
  for (const dia of [2, 3, 4, 1, 5, 6]) {
    const faixa = horas && horas[dia];
    if (!faixa || !faixa.length) continue;
    const min = Math.min(faixa[0] + 75, faixa[1] - 45);
    const data = new Date(DOMINGO.getTime() + dia * 86400000).toISOString().slice(0, 10);
    return `${data}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00-03:00`;
  }
  return "2026-10-06T10:30:00-03:00";
}

// "Ótica e Beleza Pocopetz" -> ["Ótica e Beleza", "Pocopetz"]: a última palavra em destaque na montagem.
const dividirNome = n => { const p = String(n).trim().split(/\s+/); return p.length > 1 ? [p.slice(0, -1).join(" "), p[p.length - 1]] : [n]; };
const trilhos = [...html.matchAll(/id="([\w-]+)-track"/g)].map(m => m[1]).filter(id => id !== "reviews");
const cenas = [{ rolar: 0, segura: 1.5 }];
if (tem("hero-photo")) cenas.push({ rolar: ".hero-photo", segura: 1.5, legenda: "Feito para abrir no celular" });
if (tem("story-photos")) cenas.push({ rolar: ".story-photos", segura: 1.6, legenda: "A história da loja" });
if (tem('class="stats"') && d.google_nota) cenas.push({ rolar: ".stats", segura: 1.5, legenda: `Nota ${d.google_nota} no Google em destaque` });
if (trilhos.length) cenas.push({ rolar: `#${trilhos[0]}-track`, alinhar: "topo", segura: 3.0, legenda: "Vitrine com fotos reais",
  acoes: [{ em: 0.5, tipo: "deslizar", alvo: `#${trilhos[0]}-track`, cartoes: 1 }, { em: 1.6, tipo: "deslizar", alvo: `#${trilhos[0]}-track`, cartoes: 1 }] });
if (SHOW && trilhos[1]) cenas.push({ rolar: `#${trilhos[1]}-track`, alinhar: "topo", segura: 2.6, legenda: "Mais fotos reais da loja",
  acoes: [{ em: 0.45, tipo: "deslizar", alvo: `#${trilhos[1]}-track`, cartoes: 1, dur: 0.75 }, { em: 1.35, tipo: "deslizar", alvo: `#${trilhos[1]}-track`, cartoes: 1, dur: 0.75 }] });
if (tem("face-tool") && tem('data-face="redondo"')) cenas.push({ rolar: ".face-tool", alinhar: "topo", segura: 2.6, legenda: "Ajuda a escolher a armação",
  acoes: [{ em: 0.6, tipo: "tocar", alvo: ".face-option[data-face=redondo]", clicar: true }, { em: 1.5, tipo: "tocar", alvo: ".face-option[data-face=coracao]", clicar: true }] });
if (SHOW && tem('id="atendimento"')) cenas.push({ rolar: "#atendimento h2", alinhar: "topo", segura: 2.0, legenda: "O atendimento passo a passo" });
if (tem('id="reviews-track"')) cenas.push({ rolar: "#reviews-track", alinhar: "topo", segura: 2.3, legenda: "Avaliações reais do Google",
  acoes: [{ em: 0.7, tipo: "deslizar", alvo: "#reviews-track", cartoes: 1 }] });
if (SHOW && tem("insta-photo")) cenas.push({ rolar: ".insta-photo", segura: 1.8, legenda: "Ligado ao Instagram da loja" });
if (tem('id="visite"') && tem("button--mustard")) cenas.push({ rolar: "#visite .button--mustard", segura: 2.8, legenda: "WhatsApp e rota a um toque",
  acoes: [{ em: 1.0, tipo: "tocar", alvo: "#visite .button--mustard" }] });

// Demo com menos seções: segura um pouco mais cada parada para o vídeo ficar perto de 28-30 s (show: ~40 s).
const mov = (cenas.length - 1) * 1.05, cartelas = SHOW ? 5.6 + 5.4 - 1 : 3.2 + 3.8 - 1, alvo = SHOW ? 38 : 27;
const somaSegura = cenas.reduce((n, c) => n + c.segura, 0);
if (cartelas + mov + somaSegura < alvo) {
  const k = Math.min(1.35, (alvo - cartelas - mov) / somaSegura);
  cenas.forEach(c => { c.segura = Math.round(c.segura * k * 10) / 10; });
}

const roteiro = {
  demo: pasta,
  marca: d.marca_completa || d.marca,
  local: (Array.isArray(d.endereco) && d.endereco[1]) || d.topline || "",
  cores: { fundo: d.cores?.escuro || "#2b2c3b", fundo2: escurecer(d.cores?.escuro || "#2b2c3b"), acento: d.cores?.acento || "#d6ae66", claro: "#fffdf6" },
  fontes: { titulo: d.fonte || "Montserrat", texto: "DM Sans" },
  hora: horaAberta(),
  musica: "auto",
  abertura: SHOW ? {
    estilo: "montagem", selo: "Prévia do site", chamada: "O novo site da", nome: dividirNome(d.marca_completa || d.marca),
    ...(d.slogan ? { frase: String(d.slogan).replace(/\.$/, "") + "." } : {}),
    fotos: [".hero-photo img", ...(trilhos[0] ? [`#${trilhos[0]}-track li:nth-child(2) img`, `#${trilhos[0]}-track li:nth-child(4) img`] : []), ...(tem("insta-photo") ? [".insta-photo img"] : [])].slice(0, 4),
    // Conferir no ensaio: rosto cortado ou foto repetida, troca o seletor (ou o enquadramento em pos_fotos).
  } : { selo: "Prévia do site", chamada: "O novo site da", foto: ".hero-photo img", pos: d.hero?.foto?.c ? `${Math.round(d.hero.foto.c[0] * 100)}% ${Math.round(d.hero.foto.c[1] * 100)}%` : "50% 30%" },
  fechamento: { ...(SHOW ? { estilo: "rolagem" } : {}), titulo: "Seu site novo", destaque: "já está pronto.", convite: "Gostou? É só responder esta mensagem." },
  cenas,
};
const id = idLead || pasta;
const saida = join(RAIZ, "gravacoes", id + ".json");
mkdirSync(dirname(saida), { recursive: true });
if (existsSync(saida) && !process.env.SOBRESCREVER) { console.error(`${saida} já existe (SOBRESCREVER=1 para trocar).`); process.exit(1); }
writeFileSync(saida, JSON.stringify(roteiro, null, 1) + "\n");
const total = 3.2 + cenas.reduce((s, c) => s + c.segura + 1.05, -1.05) + 3.8 - 1;
console.log(`${saida}: ${cenas.length} cenas, uns ${Math.round(total)} s. Revise as legendas (o nome do dono deixa a "história" mais pessoal).`);
