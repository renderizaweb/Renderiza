// A casca do painel: carrega a configuração, abre a sessão e desenha a rota da vez.
// Missão 1: o esqueleto. Missão 2 (bloco B): depois de entrar, as contas da pessoa (aceitando os convites), a conta
// escolhida e a casca de verdade (src/telas/casca.js), que mostra só os módulos ligados e tranca os sem acesso.
// Arquivo comum: mudança só com aviso em missoes.md.
//
// Cada módulo recebe em montar(el, contexto):
//   banco, sessao, navegar(caminho), conta (a linha de minhas_contas), nicho (src/nichos/), pessoa (a própria),
//   pode(módulo, nível) (espelho da regra do banco), avisar(texto, opções) (src/ui/aviso.js), ambiente.

import { criarAdaptadorSupabase } from "./adaptadores/supabase.js";
import { criarSessao } from "./sessao.js";
import { decidir, TELAS } from "./rotas.js";
import { acharModulo } from "./modulos/index.js";
import { acharAreaAdmin } from "./admin/index.js";
import { montarCasca, conteudoSemAcesso, avisarTrancado } from "./telas/casca.js";
import { nicho } from "./nichos/index.js";
import { avisar } from "./ui/aviso.js";
import { escapar } from "./ui/formulario.js";

const raiz = document.getElementById("app");
let vez = 0; // cada desenho ganha um número; um desenho antigo que termina depois não sobrescreve o novo

function mostrarFalha(mensagem) {
  raiz.innerHTML = `<main class="falha"><h1 class="titulo">Não consegui abrir o painel</h1><p class="rz-texto-2">${escapar(mensagem)}</p>
    <button class="rz-botao rz-botao--escuro" type="button">Tentar de novo</button></main>`;
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

/** Leva o foco ao título do conteúdo novo (o leitor de tela anuncia onde a pessoa chegou). */
function focarConteudo(el) {
  const h1 = el.querySelector("h1");
  if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
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
  const entradas = new Set(); // contas em que a entrada já foi registrada nesta visita
  let desmontar = null; // o que o módulo aberto devolveu para fechar ao sair (ex.: o tempo real do Atendimento)

  async function desenhar() {
    const minhaVez = ++vez;
    if (desmontar) { try { desmontar(); } catch (e) { /* sair nunca trava a próxima tela */ } desmontar = null; }
    const decisao = decidir({ caminho: location.pathname, busca: location.search, logado: sessao.logado() });
    if (decisao.redirecionar) return navegar(decisao.redirecionar, { substituir: true });
    const { rota } = decisao;

    try {
      if (sessao.logado() && !sessao.contasCarregadas()) await sessao.carregarContas();
      if (minhaVez !== vez) return;

      if (rota.tipo === "tela") {
        const tela = await TELAS[rota.id].carregar();
        if (minhaVez !== vez) return;
        await tela.montar(raiz, { sessao, banco, config, ambiente: config.ambiente, aoEntrar: desenhar, navegar });
        return;
      }

      // Daqui em diante, dentro de uma conta.
      const conta = sessao.conta();
      if (!conta) {
        const volta = location.pathname + location.search;
        return navegar(TELAS.contas.caminho + (volta !== "/" ? "?volta=" + encodeURIComponent(volta) : ""), { substituir: true });
      }
      if (!entradas.has(conta.conta_id)) { entradas.add(conta.conta_id); sessao.registrarEntrada(); }
      await sessao.carregarPessoa();
      if (minhaVez !== vez) return;

      const { conteudo, bloqueada, itens } = montarCasca(raiz, { rota, sessao, banco, navegar, ambiente: config.ambiente });
      if (bloqueada) return focarConteudo(conteudo);

      const naoEncontrada = () => {
        conteudo.innerHTML = '<section class="rz-bloqueio"><h1 class="rz-titulo-1">Página não encontrada</h1><p class="rz-texto-2">O endereço pode ter mudado.</p><div class="rz-bloqueio-acoes"><a class="rz-botao rz-botao--grande" href="/">Voltar ao Início</a></div></section>';
        focarConteudo(conteudo);
      };
      if (rota.tipo === "nao-encontrada") return naoEncontrada();
      if (rota.tipo === "admin" && !sessao.eEquipeRenderiza()) return naoEncontrada();
      if (rota.tipo === "modulo") {
        const item = itens.find(i => i.id === rota.id);
        if (!item || item.estado !== "livre") {
          conteudoSemAcesso(conteudo, item, conta);
          return focarConteudo(conteudo);
        }
      }

      const parte = await (rota.tipo === "admin" ? acharAreaAdmin(rota.id) : acharModulo(rota.id)).carregar();
      if (minhaVez !== vez) return;
      const saida = await parte.montar(conteudo, {
        banco, sessao, navegar, conta, nicho: nicho(conta.nicho), pessoa: sessao.pessoa(),
        pode: (modulo, nivel) => sessao.pode(modulo, nivel), avisar, ambiente: config.ambiente,
      });
      // montar(el, contexto) pode devolver uma função: ela roda quando a pessoa sai do módulo
      if (typeof saida === "function") { if (minhaVez === vez) desmontar = saida; else saida(); }
      if (minhaVez === vez) focarConteudo(conteudo);
    } catch (e) {
      if (minhaVez === vez) mostrarFalha(e.message);
    }
  }

  // Links internos navegam sem recarregar a página; sair e trocar de conta valem de qualquer lugar.
  document.addEventListener("click", evento => {
    const sair = evento.target.closest("[data-sair]");
    if (sair) {
      sair.disabled = true;
      sessao.sair().finally(() => navegar(TELAS.entrar.caminho, { substituir: true }));
      return;
    }
    if (evento.target.closest("[data-trocar-conta]")) {
      navegar(TELAS.contas.caminho + "?trocar=1");
      return;
    }
    const link = evento.target.closest("a[href]");
    if (!link || link.target || link.origin !== location.origin || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
    if (link.dataset.trancado) {
      evento.preventDefault();
      avisarTrancado(link.dataset.trancado);
      return;
    }
    if (link.pathname.startsWith("/publico/") || link.pathname.startsWith("/api/")) return;
    evento.preventDefault();
    navegar(link.pathname + link.search);
  });
  window.addEventListener("popstate", desenhar);
  sessao.aoMudar(desenhar); // entrou ou saiu em outra aba

  desenhar();
}

iniciar();
