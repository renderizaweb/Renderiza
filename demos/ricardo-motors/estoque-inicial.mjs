// O estoque inicial da Ricardo Motors (trilho docs/entregas/ricardo-motors.md, 3B): os 15 carros da demo (os anúncios
// dele), com fotos, dados e preço, cadastrados no Estoque de uma conta pelo PRÓPRIO PAINEL: entra com um login, e no
// navegador usa o código do módulo (src/modulos/estoque/loja.js: as fotos reduzidas no aparelho, 1600 e 640 px, e o
// banco com a sessão de quem entrou, ou seja, a RLS decide). Nunca a chave secreta. Os 4 carros da capa da demo vêm
// em destaque; a ordem é a da demo.
//
//   ESTOQUE_LOGIN=<e-mail ou usuário> ESTOQUE_SENHA=<senha> \
//     node demos/ricardo-motors/estoque-inicial.mjs --painel https://painel.renderizaweb.com.br --codigo ricardo-motors
//   (o login e a senha vêm do ambiente, nunca do chat nem do repositório; a conta tem de ter o Estoque ligado e o
//    login tem de poder editar nela: o dono ou a Renderiza no suporte)
//   --simular: só mostra o que entraria.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CAPA = ["81662220", "82333708", "77408515", "81200148"]; // os destaques da capa da demo

/** Os carros da demo no formato do Estoque (12, "Contrato v1": os campos do esquema automotivo). */
export function carrosDaDemo(html = fs.readFileSync(path.join(AQUI, "index.html"), "utf8")) {
  const carros = JSON.parse(html.match(/const CARROS=(\[.*?\]);\n/)[1]);
  const img = JSON.parse(html.match(/const IMG=(\{.*?\});/s)[1]);
  const COMB = { "Gasolina e elétrico": "Híbrido", "Gasolina e álcool": "Flex", Gasolina: "Gasolina", Diesel: "Diesel" };
  const combustivel = c => COMB[c.combustivel] || (/H[ÍI]BRIDO|HYBRID|PHEV/.test(c.versao) ? "Híbrido" : /DIESEL/.test(c.versao) ? "Diesel" : /FLEX/.test(c.versao) ? "Flex" : "Gasolina");
  return carros.map((c, ordem) => {
    const [fab, mod] = String(c.ano || "").split("/").map(Number);
    return {
      demo: c.id,
      item: {
        situacao: "disponivel", destaque: CAPA.includes(c.id), ordem, preco: c.preco || null, preco_antes: null,
        selos: (c.tags || []).filter(t => !["Blindado", "Híbrido", "Diesel"].includes(t)),
        descricao: c.descricao || "",
        campos: {
          marca: c.marca, modelo: c.modelo, versao: c.versao || "", ano_fab: fab || null, ano_modelo: mod || fab || null, km: c.km ?? null,
          cor: c.cor || "", cambio: c.cambio ? "Automático" : "", combustivel: combustivel(c), carroceria: c.tipo || "", placa: c.placa || "",
          blindado: (c.tags || []).includes("Blindado"), unico_dono: !!c.unico, revisoes: !!c.revisoes, garantia: !!c.garantia, ipva: !!c.ipva,
          licenciado: !!c.licenciado, troca: !!c.troca, opcionais: c.opcionais || [],
        },
      },
      fotos: (c.f || []).map(k => img[k]).filter(Boolean),
    };
  });
}

/** Entra no painel e cadastra. Devolve [{ demo, id, fotos }]. `entrar(pagina)` faz o login (a tela /entrar). */
export async function cadastrar({ navegador, painel, codigo, entrar, carros = carrosDaDemo(), log = console.log }) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, locale: "pt-BR" });
  const pagina = await ctx.newPage();
  try {
    await entrar(pagina);
    await pagina.evaluate(async codigo => {
      const { criarAdaptadorSupabase } = await import("/src/adaptadores/supabase.js");
      const { criarLoja } = await import("/src/modulos/estoque/loja.js");
      const cfg = await (await fetch("/api/config")).json();
      const banco = await criarAdaptadorSupabase({ url: cfg.supabaseUrl, chave: cfg.supabaseAnonKey });
      const conta = (await banco.rpc("minhas_contas")).find(c => c.codigo === codigo);
      if (!conta) throw new Error(`este login não está na conta ${codigo}`);
      if (!(conta.modulos || []).includes("estoque")) throw new Error(`a conta ${codigo} não tem o Estoque ligado`);
      const loja = criarLoja({ banco, conta });
      await loja.carregar();
      window.__estoque = { loja, jaTem: loja.listar().length };
    }, codigo);
    const jaTem = await pagina.evaluate(() => window.__estoque.jaTem);
    if (jaTem) throw new Error(`a conta ${codigo} já tem ${jaTem} itens no Estoque: nada foi cadastrado (apague antes, ou cadastre pela tela)`);
    const feitos = [];
    for (const c of carros) {
      const r = await pagina.evaluate(async ({ item, fotos }) => {
        const { loja } = window.__estoque;
        const lista = [];
        for (const [k, dado] of fotos.entries()) {
          // de data: para arquivo sem fetch (a CSP do painel não deixa buscar data:)
          const [, tipo, b64] = /^data:([^;]+);base64,(.+)$/.exec(dado);
          const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
          lista.push(await loja.enviarFoto(new File([bytes], `foto-${k + 1}.webp`, { type: tipo })));
        }
        const linha = await loja.salvar({ ...item, fotos: lista });
        return { id: linha.id, fotos: lista.length };
      }, { item: c.item, fotos: c.fotos });
      log(`  ${c.item.campos.marca} ${c.item.campos.modelo}: ${r.fotos} fotos${c.item.destaque ? " · destaque" : ""}`);
      feitos.push({ demo: c.demo, ...r });
    }
    return feitos;
  } finally {
    await ctx.close();
  }
}

async function principal() {
  const arg = n => (process.argv.includes("--" + n) ? process.argv[process.argv.indexOf("--" + n) + 1] : undefined);
  const carros = carrosDaDemo();
  if (process.argv.includes("--simular")) {
    for (const c of carros) console.log(`${c.item.campos.marca} ${c.item.campos.modelo} ${c.item.campos.ano_fab}/${c.item.campos.ano_modelo} · ${c.item.preco ?? "sob consulta"} · ${c.fotos.length} fotos${c.item.destaque ? " · destaque" : ""}`);
    return;
  }
  const painel = arg("painel"), codigo = arg("codigo"), login = process.env.ESTOQUE_LOGIN, senha = process.env.ESTOQUE_SENHA;
  if (!painel || !codigo || !login || !senha) throw new Error("Uso: ESTOQUE_LOGIN=… ESTOQUE_SENHA=… node demos/ricardo-motors/estoque-inicial.mjs --painel <endereço> --codigo <código do site>");
  const { entrar, playwright } = await import("../../painel-clientes/test/fluxos/ambiente.mjs");
  const navegador = await playwright().chromium.launch();
  try {
    console.log(`Cadastrando ${carros.length} carros em ${codigo} (${painel})…`);
    const feitos = await cadastrar({ navegador, painel, codigo, carros, entrar: p => entrar(p, painel, login, senha) });
    console.log(`Pronto: ${feitos.length} carros, ${feitos.reduce((s, f) => s + f.fotos, 0)} fotos.`);
  } finally {
    await navegador.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  principal().catch(e => { console.error("Parou: " + e.message); process.exit(1); });
}
