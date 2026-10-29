// A casca do painel: carrega a configuração, abre a sessão e desenha a rota da vez.
// Esqueleto da Missão 1: menu simples com todos os módulos; a Missão 2 troca pelo menu de verdade (src/ui/),
// mostrando só os módulos ligados e trancando os sem acesso. Arquivo comum: mudança só com aviso em missoes.md.

import { criarAdaptadorSupabase } from "./adaptadores/supabase.js";
import { criarSessao } from "./sessao.js";
import { decidir, caminhoDe, TELAS } from "./rotas.js";
import { MODULOS, acharModulo } from "./modulos/index.js";
import { AREAS_ADMIN, acharAreaAdmin } from "./admin/index.js";

const raiz = document.getElementById("app");
let vez = 0; // cada desenho ganha um número; um desenho antigo que termina depois não sobrescreve o novo

function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function mostrarFalha(mensagem) {
  raiz.innerHTML = `<main class="falha"><h1 class="titulo">Não consegui abrir o painel</h1><p>${escapar(mensagem)}</p>
    <button class="botao" type="button">Tentar de novo</button></main>`;
  raiz.querySelector("button").addEventListener("click", () => location.reload());
}

async function carregarConfig() {
  let r;
  try {
    r = await fetch("/api/config", { cache: "no-store" });
  } catch (e) {
    throw new Error("Sem conexão. Confira a internet e tente de novo.");
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(corpo.erro || "A configuração do painel não respondeu.");
  return corpo;
}

function desenharCasca(rota, sessao) {
  const ativo = item => (rota.tipo === item.tipo && rota.id === item.id ? ' aria-current="page"' : "");
  const links = MODULOS.map(m => `<a href="${caminhoDe({ tipo: "modulo", id: m.id })}"${ativo({ tipo: "modulo", id: m.id })}>${escapar(m.nome)}</a>`).join("");
  const admin = AREAS_ADMIN.map(a => `<a href="${caminhoDe({ tipo: "admin", id: a.id })}"${ativo({ tipo: "admin", id: a.id })}>${escapar(a.nome)}</a>`).join("");
  const usuario = sessao.usuario();
  raiz.innerHTML = `
    <div class="casca">
      <nav class="menu" aria-label="Menu">
        <div class="menu-marca"><img src="/favicon.svg" alt="" width="28" height="28"><span>Painel Renderiza</span></div>
        ${links}
        <p class="menu-grupo">Admin</p>
        ${admin}
        <div class="menu-pe">
          <span class="suave">${escapar(usuario ? usuario.email : "")}</span>
          <button class="botao" type="button" data-sair>Sair</button>
        </div>
      </nav>
      <main class="conteudo" id="conteudo"></main>
    </div>`;
  return raiz.querySelector("#conteudo");
}

async function iniciar() {
  let config, banco, sessao;
  try {
    config = await carregarConfig();
    banco = await criarAdaptadorSupabase({ url: config.supabaseUrl, chave: config.supabaseAnonKey });
    sessao = criarSessao(banco);
    await sessao.iniciar();
  } catch (e) {
    mostrarFalha(e.message);
    return;
  }

  const navegar = (caminho, { substituir = false } = {}) => {
    history[substituir ? "replaceState" : "pushState"]({}, "", caminho);
    desenhar();
  };

  async function desenhar() {
    const minhaVez = ++vez;
    const decisao = decidir({ caminho: location.pathname, busca: location.search, logado: sessao.logado() });
    if (decisao.redirecionar) return navegar(decisao.redirecionar, { substituir: true });
    const { rota } = decisao;

    try {
      if (rota.tipo === "tela") {
        const tela = await TELAS[rota.id].carregar();
        if (minhaVez !== vez) return;
        await tela.montar(raiz, { sessao, banco, ambiente: config.ambiente, aoEntrar: desenhar });
        return;
      }
      const alvo = desenharCasca(rota, sessao);
      if (rota.tipo === "nao-encontrada") {
        alvo.innerHTML = '<h1 class="titulo">Página não encontrada</h1><p><a href="/">Voltar ao início</a></p>';
        return;
      }
      const item = rota.tipo === "admin" ? acharAreaAdmin(rota.id) : acharModulo(rota.id);
      const parte = await item.carregar();
      if (minhaVez !== vez) return;
      await parte.montar(alvo, { banco, sessao, navegar });
    } catch (e) {
      if (minhaVez === vez) mostrarFalha(e.message);
    }
  }

  // Links internos navegam sem recarregar a página.
  document.addEventListener("click", evento => {
    const sair = evento.target.closest("[data-sair]");
    if (sair) {
      sair.disabled = true;
      sessao.sair().finally(() => navegar(TELAS.entrar.caminho, { substituir: true }));
      return;
    }
    const link = evento.target.closest("a[href]");
    if (!link || link.target || link.origin !== location.origin || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
    if (link.pathname.startsWith("/publico/") || link.pathname.startsWith("/api/")) return;
    evento.preventDefault();
    navegar(link.pathname + link.search);
  });
  window.addEventListener("popstate", desenhar);
  sessao.aoMudar(desenhar); // entrou ou saiu em outra aba

  desenhar();
}

iniciar();
