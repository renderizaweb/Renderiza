// Apaga os deploys antigos de UM projeto da Vercel, para liberar o espaço de deploys (Deployment Storage: o plano
// grátis tem 10 GB, e cada deploy do site da Renderiza tem uns 750 MB). Fica sempre o que está no ar, os últimos
// deploys de produção prontos e o que ainda está montando. Nunca apaga o projeto.
//
// Lê o token de VERCEL_TOKEN (crie um token só do projeto, com validade curta: vercel.com/account/tokens). Com token
// da conta inteira, ponha também VERCEL_TEAM_ID. O token nunca vai para o chat nem para o repositório.
//
//   node scripts/limpar-deploys-vercel.mjs renderiza              mostra o que apagaria (não apaga nada)
//   node scripts/limpar-deploys-vercel.mjs renderiza --apagar     apaga
// Opção: --manter <n>   quantos deploys de produção prontos ficam, além do que está no ar (padrão 3)

const API = "https://api.vercel.com";
const MONTANDO = new Set(["BUILDING", "QUEUED", "INITIALIZING"]);

/** Separa o que fica do que pode ir. `deploys`: os da API (uid, created, state, target), de qualquer ordem. */
export function escolher(deploys, { noAr = null, manter = 3 } = {}) {
  const ordem = [...deploys].sort((a, b) => b.created - a.created);
  const ficam = new Set();
  let producao = 0;
  for (const d of ordem) {
    if (d.uid === noAr || MONTANDO.has(d.state)) ficam.add(d.uid);
    else if (d.target === "production" && d.state === "READY" && producao < manter) { ficam.add(d.uid); producao++; }
  }
  return { manter: ordem.filter(d => ficam.has(d.uid)), apagar: ordem.filter(d => !ficam.has(d.uid)) };
}

async function chamar(caminho, { metodo = "GET" } = {}) {
  const url = new URL(API + caminho);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const r = await fetch(url, { method: metodo, headers: { Authorization: "Bearer " + process.env.VERCEL_TOKEN } });
  const texto = await r.text();
  if (!r.ok) throw new Error(`A Vercel respondeu ${r.status} em ${metodo} ${caminho}: ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : null;
}

async function principal() {
  const args = process.argv.slice(2);
  const nome = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--manter");
  const manter = args.includes("--manter") ? Number(args[args.indexOf("--manter") + 1]) : 3;
  if (!nome) throw new Error("Diga o projeto: node scripts/limpar-deploys-vercel.mjs <projeto> [--apagar]");
  if (!process.env.VERCEL_TOKEN) throw new Error("Falta VERCEL_TOKEN no ambiente (nunca no chat).");
  if (!(manter >= 1)) throw new Error("--manter precisa ser 1 ou mais.");

  const projeto = await chamar(`/v9/projects/${encodeURIComponent(nome)}`);
  const noAr = projeto.targets?.production?.id || null;
  const deploys = [];
  for (let ate = null; ;) {
    const pagina = await chamar(`/v6/deployments?projectId=${projeto.id}&limit=100${ate ? `&until=${ate}` : ""}`);
    deploys.push(...pagina.deployments.filter(d => d.name === projeto.name));
    ate = pagina.pagination?.next;
    if (!ate) break;
  }
  const { manter: ficam, apagar } = escolher(deploys, { noAr, manter });
  const linha = d => `  ${new Date(d.created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}  ${(d.target || "preview").padEnd(10)} ${d.state.padEnd(9)} ${d.url}`;
  console.log(`Projeto ${projeto.name}: ${deploys.length} deploys. No ar: ${noAr || "(a Vercel não disse; ficam os últimos de produção)"}`);
  console.log(`Ficam (${ficam.length}):\n${ficam.map(linha).join("\n")}`);
  console.log(`${args.includes("--apagar") ? "Apagando" : "Apagaria"} (${apagar.length})${apagar.length > 20 ? ", os 20 primeiros" : ""}:\n${apagar.slice(0, 20).map(linha).join("\n")}`);
  if (!args.includes("--apagar")) return console.log("\nNada foi apagado. Para apagar, rode de novo com --apagar.");
  let feitos = 0;
  for (const d of apagar) {
    await chamar(`/v13/deployments/${d.uid}`, { metodo: "DELETE" });
    if (++feitos % 10 === 0) console.log(`  ${feitos} de ${apagar.length}`);
  }
  console.log(`Pronto: ${feitos} apagados. A Vercel guarda os apagados por um tempo em Settings → Security → Recently Deleted.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  principal().catch(e => { console.error("Parou: " + e.message); process.exit(1); });
}
