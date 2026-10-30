// A casca do painel (09, "As peças que se repetem"; 10): menu lateral no computador e barra de baixo no celular
// (só navegação, até 5 destinos), o "+" das ações rápidas, a busca (Ctrl+K), a conta e quem está logado.
// Mostra só os módulos ligados na conta; os ligados sem acesso aparecem trancados. Conta em teste ganha um aviso
// discreto no topo; teste vencido ou conta desligada: a casca mostra o aviso para fechar o plano no lugar do
// conteúdo (o banco já não entrega nada). Estilo em src/ui/estilo.css (seção 11).

import { MODULOS } from "../modulos/index.js";
import { caminhoDe } from "../rotas.js";
import { estadoDoModulo, diasDeTeste } from "../sessao.js";
import { nicho } from "../nichos/index.js";
import { temaDoNicho } from "./acesso.js";
import { icone } from "../ui/icones.js";
import { escapar } from "../ui/formulario.js";
import { iniciais, hora } from "../ui/formatos.js";
import { abrirFolha } from "../ui/gaveta.js";
import { avisar } from "../ui/aviso.js";
import { linkDaRenderiza } from "./renderiza.js";

const ICONE = {
  inicio: "inicio", agenda: "agenda", atendimento: "conversa", clientes: "clientes", contratos: "contrato",
  financeiro: "carteira", "meu-site": "site", servicos: "servicos", equipe: "equipe", configuracoes: "configuracoes",
};
const DA_CONTA = ["servicos", "equipe", "configuracoes"];
// Na barra de baixo cabem o Início, mais três e o "Mais"; Atendimento primeiro (09, "Barra de baixo").
const PRIORIDADE_DA_BARRA = ["atendimento", "agenda", "clientes", "financeiro", "contratos", "meu-site"];

/** Os itens do menu da conta, na ordem: Início, os módulos (na ordem escolhida no onboarding), e os da conta. */
export function itensDoMenu(conta) {
  const n = nicho(conta && conta.nicho);
  const ordem = conta && conta.ajustes && Array.isArray(conta.ajustes.ordem_menu) ? conta.ajustes.ordem_menu : [];
  const posicao = id => (ordem.includes(id) ? ordem.indexOf(id) : ordem.length + MODULOS.findIndex(m => m.id === id));
  const item = m => ({
    id: m.id,
    nome: (n.modulos[m.id] && n.modulos[m.id].nome) || m.nome,
    icone: ICONE[m.id] || "inicio",
    caminho: caminhoDe({ tipo: "modulo", id: m.id }),
    estado: estadoDoModulo(conta, m.id),
    grupo: DA_CONTA.includes(m.id) ? "conta" : "principal",
  });
  const inicio = MODULOS.filter(m => m.id === "inicio").map(item);
  const modulos = MODULOS.filter(m => !m.base).sort((a, b) => posicao(a.id) - posicao(b.id)).map(item);
  const daConta = DA_CONTA.map(id => MODULOS.find(m => m.id === id)).filter(Boolean).map(item);
  return [...inicio, ...modulos, ...daConta].filter(i => i.estado !== "fora");
}

/** A barra de baixo do celular: Início e até três módulos que a pessoa usa; o resto fica no "Mais". */
export function itensDaBarra(itens) {
  const livres = itens.filter(i => i.estado === "livre");
  const escolhidos = PRIORIDADE_DA_BARRA.map(id => livres.find(i => i.id === id)).filter(Boolean).slice(0, 3);
  return [...livres.filter(i => i.id === "inicio"), ...escolhidos];
}

/** As ações rápidas do "+" (09): as mesmas em qualquer tela, só as que a pessoa pode fazer. */
export function acoesRapidas(conta, pode) {
  const p = nicho(conta && conta.nicho).palavras;
  const lista = [
    pode("atendimento", "editar") && { id: "novo-pedido", rotulo: "Novo pedido", icone: "conversa", caminho: "/atendimento?novo=pedido" },
    pode("agenda", "editar") && { id: "nova-reserva", rotulo: p.novaReserva, icone: "agenda", caminho: "/agenda?novo=reserva" },
    conta && conta.nicho === "eventos" && (pode("agenda", "editar") || pode("atendimento", "editar")) &&
      { id: "nova-visita", rotulo: "Marcar visita", icone: "relogio", caminho: "/agenda?novo=visita" },
    pode("financeiro", "editar") && { id: "novo-pagamento", rotulo: "Registrar pagamento", icone: "carteira", caminho: "/financeiro?novo=pagamento" },
    pode("contratos", "editar") && { id: "novo-contrato", rotulo: "Mandar contrato", icone: "contrato", caminho: "/contratos?novo=contrato" },
    ["agenda", "atendimento", "clientes", "contratos", "financeiro"].some(m => pode(m, "editar")) &&
      { id: "novo-cliente", rotulo: "Novo cliente", icone: "clientes", caminho: pode("clientes", "ver") ? "/clientes?novo=cliente" : null },
  ];
  return lista.filter(Boolean);
}

/** O sinal da conta: o logo, se tiver; senão, as iniciais. */
function sinalDaConta(conta) {
  return conta.logo
    ? `<span class="rz-conta-sinal rz-conta-sinal--logo" aria-hidden="true"><img src="${escapar(conta.logo)}" alt=""></span>`
    : `<span class="rz-conta-sinal" aria-hidden="true">${escapar(iniciais(conta.nome))}</span>`;
}

function avatar(pessoa, email, classe = "") {
  const nome = (pessoa && pessoa.nome) || email || "";
  const cor = pessoa && pessoa.cor ? ` style="--cor:${escapar(pessoa.cor)}"` : "";
  return `<span class="rz-avatar ${classe}"${cor} aria-hidden="true">${escapar(iniciais(nome))}</span>`;
}

function linkDoMenu(i, rota) {
  const ativo = rota.tipo === "modulo" && rota.id === i.id ? ' aria-current="page"' : "";
  if (i.estado === "trancado") {
    return `<a href="${i.caminho}" class="rz-menu-item" data-trancado="${escapar(i.nome)}" aria-disabled="true"${ativo}>${icone(i.icone)}<span>${escapar(i.nome)}</span>${icone("cadeado", { tamanho: 16, classe: "rz-menu-cadeado" })}<span class="rz-oculto">(sem acesso)</span></a>`;
  }
  return `<a href="${i.caminho}" class="rz-menu-item"${ativo}>${icone(i.icone)}<span>${escapar(i.nome)}</span></a>`;
}

function avisoDoTeste(conta) {
  const dias = diasDeTeste(conta);
  if (dias === null || !conta.liberada) return "";
  const texto = dias <= 1 ? "Último dia do teste grátis." : `Teste grátis: faltam ${dias} dias.`;
  // fechar o plano é com o dono; a equipe só fica sabendo do prazo
  return `<div class="rz-faixa-teste" role="status">${icone("relogio", { tamanho: 16 })}<span>${texto}</span>
    ${conta.dono ? `<a href="${linkDaRenderiza(`Oi! Quero fechar o plano do Painel Renderiza para ${conta.nome}.`)}" target="_blank" rel="noopener">Fechar o plano</a>` : ""}</div>`;
}

/** O conteúdo quando a conta está bloqueada (teste vencido, desligada, prazo vencido): o banco não entrega nada. */
export function textoDoBloqueio(conta) {
  if (conta.situacao === "teste") {
    return { titulo: "O teste grátis acabou", texto: `Os 7 dias de teste de ${conta.nome} terminaram. Para continuar usando, é só fechar o plano com a gente.` };
  }
  if (conta.situacao === "ativa") {
    return { titulo: "O prazo da conta venceu", texto: `O prazo combinado para ${conta.nome} terminou. Fale com a gente para renovar.` };
  }
  return { titulo: "A conta está desligada", texto: `${conta.nome} está desligada no momento. Fale com a gente para religar.` };
}

/**
 * Desenha a casca e devolve o lugar do conteúdo. `rota`: a rota da vez; o resto, o contexto do app.
 */
export function montarCasca(raiz, { rota, sessao, banco, navegar, ambiente }) {
  const conta = sessao.conta();
  const n = nicho(conta.nicho);
  const itens = itensDoMenu(conta);
  const barra = itensDaBarra(itens);
  const usuario = sessao.usuario() || {};
  const pessoa = sessao.pessoa ? sessao.pessoa() : null;
  const variasContas = sessao.contas().length > 1;
  const bloqueada = !conta.liberada;
  const etiqueta = ambiente && ambiente !== "production" ? `<span class="rz-etiqueta rz-etiqueta--alerta" title="Banco de teste, com dados fictícios">STG</span>` : "";
  const principais = itens.filter(i => i.grupo === "principal");
  const fazAlgo = acoesRapidas(conta, (m, nivel) => sessao.pode(m, nivel)).length > 0; // só vê: sem o "+"
  const daConta = itens.filter(i => i.grupo === "conta");

  // o tema vale também para o que abre fora da casca (gavetas, folhas e avisos vão para o <body>); o app.js tira a
  // cada tela, e as telas de acesso ficam neutras
  if (temaDoNicho(conta.nicho)) document.body.classList.add(temaDoNicho(conta.nicho));
  raiz.innerHTML = `
    <div class="rz-app ${temaDoNicho(conta.nicho)}${bloqueada ? " rz-app--bloqueada" : ""}">
      <aside class="rz-lateral" aria-label="Menu">
        <a class="rz-lateral-conta" href="/">
          ${sinalDaConta(conta)}
          <span><b>${escapar(conta.nome)}</b><small>Painel do ${escapar(n.palavras.conta)}</small></span>
        </a>
        ${bloqueada ? "" : `<nav class="rz-menu" aria-label="Módulos">
          ${principais.map(i => linkDoMenu(i, rota)).join("")}
          <p class="rz-menu-grupo">${escapar(n.palavras.conta[0].toUpperCase() + n.palavras.conta.slice(1))}</p>
          ${daConta.map(i => linkDoMenu(i, rota)).join("")}
          ${sessao.eEquipeRenderiza() ? `<p class="rz-menu-grupo">Renderiza</p><a href="/admin" class="rz-menu-item"${rota.tipo === "admin" ? ' aria-current="page"' : ""}>${icone("admin")}<span>Admin</span></a>` : ""}
        </nav>`}
        <div class="rz-lateral-pe">
          ${variasContas ? `<button class="rz-menu-item" type="button" data-trocar-conta>${icone("trocar")}<span>Trocar de conta</span></button>` : ""}
          <div class="rz-quem">
            ${avatar(pessoa, usuario.email)}
            <span class="rz-quem-nome"><b>${escapar((pessoa && pessoa.nome) || "")}</b><small>${escapar(usuario.email || "")}</small></span>
            <button class="rz-botao rz-botao--fantasma rz-quem-sair" type="button" data-sair aria-label="Sair">${icone("sair")}</button>
          </div>
        </div>
      </aside>
      <div class="rz-area">
        <header class="rz-topo">
          <a class="rz-topo-conta" href="/">${sinalDaConta(conta)}<span class="rz-topo-nome"><b>${escapar(conta.nome)}</b><small>Painel do ${escapar(n.palavras.conta)}</small></span></a>
          ${etiqueta}
          ${bloqueada ? "" : `<button class="rz-busca" type="button" data-buscar aria-label="Buscar (Ctrl+K)">${icone("buscar", { tamanho: 18 })}<span>Buscar cliente, data ou pedido</span><kbd>Ctrl K</kbd></button>
          ${fazAlgo ? `<button class="rz-botao rz-botao--primario rz-topo-novo" type="button" data-novo>${icone("adicionar", { tamanho: 18 })}Novo</button>
          <button class="rz-topo-mais" type="button" data-novo aria-label="Ações rápidas">${icone("adicionar", { tamanho: 22 })}</button>` : ""}`}
          <button class="rz-topo-quem" type="button" data-mais aria-label="Menu da conta">${avatar(pessoa, usuario.email)}</button>
        </header>
        ${avisoDoTeste(conta)}
        ${conta.suporte_ate ? `<div class="rz-faixa-suporte" role="status">${icone("admin", { tamanho: 16 })}<span>Você está ajudando em ${escapar(conta.nome)} (suporte da Renderiza, registrado) até ${escapar(hora(new Date(conta.suporte_ate)))}.</span><button class="rz-link" type="button" data-encerrar-suporte>Encerrar e voltar ao Admin</button></div>` : ""}
        <main id="conteudo" class="rz-principal" tabindex="-1"></main>
      </div>
      ${bloqueada ? "" : `<nav class="rz-barra" aria-label="Menu principal">
        ${barra.map(i => `<a href="${i.caminho}"${rota.tipo === "modulo" && rota.id === i.id ? ' aria-current="page"' : ""}>${icone(i.icone, { tamanho: 22 })}<span>${escapar(i.nome)}</span></a>`).join("")}
        <button type="button" data-mais>${icone("mais", { tamanho: 22 })}<span>Mais</span></button>
      </nav>
`}
    </div>`;

  const conteudo = raiz.querySelector("#conteudo");
  if (bloqueada) {
    const { titulo, texto } = textoDoBloqueio(conta);
    conteudo.innerHTML = `<section class="rz-bloqueio">
        <span class="rz-icone-grande">${icone("cadeado", { tamanho: 26 })}</span>
        <h1 class="rz-titulo-1">${escapar(titulo)}</h1>
        <p class="rz-texto-2">${escapar(texto)}</p>
        <p class="rz-texto-2">Nada foi apagado: assim que a conta voltar, tudo aparece como estava.</p>
        <div class="rz-bloqueio-acoes">
          <a class="rz-botao rz-botao--primario rz-botao--grande" href="${linkDaRenderiza(`Oi! Quero continuar usando o Painel Renderiza em ${conta.nome}.`)}" target="_blank" rel="noopener">${icone("whatsapp")}Falar com a Renderiza</a>
          ${variasContas ? `<button class="rz-botao rz-botao--grande" type="button" data-trocar-conta>${icone("trocar")}Trocar de conta</button>` : ""}
        </div>
      </section>`;
  }
  ligar(raiz, { conta, itens, sessao, banco, navegar });
  return { conteudo, bloqueada, itens };
}

/** O conteúdo de um módulo trancado (sem acesso) ou que a conta não tem. */
export function conteudoSemAcesso(el, item, conta) {
  const dono = conta && conta.dono;
  el.innerHTML = `<section class="rz-bloqueio">
      <span class="rz-icone-grande">${icone("cadeado", { tamanho: 26 })}</span>
      <h1 class="rz-titulo-1">${item ? `Você não tem acesso a ${escapar(item.nome)}` : "Este módulo não está na sua conta"}</h1>
      <p class="rz-texto-2">${item ? "Quem dá os acessos é o dono da conta, em Equipe e acessos." : dono ? "Para ligar um módulo, fale com a gente: ele entra na mensalidade seguinte." : "Quem decide os módulos é o dono da conta."}</p>
      <div class="rz-bloqueio-acoes"><a class="rz-botao rz-botao--grande" href="/">${icone("inicio")}Voltar ao Início</a></div>
    </section>`;
}

let teclasLigadas = false;

function ligar(raiz, { conta, itens, sessao, banco, navegar }) {
  const pode = (m, nivel) => sessao.pode(m, nivel);

  const abrirNovo = () => {
    const acoes = acoesRapidas(conta, pode);
    const folha = abrirFolha({
      titulo: "O que você quer fazer?",
      corpo: acoes.length
        ? `<ul class="rz-lista-acoes">${acoes.map(a => `<li><button type="button" data-acao="${a.id}">${icone(a.icone)}<span>${escapar(a.rotulo)}</span>${icone("seta", { tamanho: 18 })}</button></li>`).join("")}</ul>`
        : `<p class="rz-texto-2">Você só vê os módulos desta conta: quem dá o acesso para editar é o dono.</p>`,
    });
    folha.corpo.addEventListener("click", e => {
      const b = e.target.closest("[data-acao]");
      if (!b) return;
      const acao = acoes.find(a => a.id === b.dataset.acao);
      folha.fechar();
      if (acao.id === "novo-cliente" && !acao.caminho) {
        import("../ui/para-quem.js").then(m => m.novoCliente({ banco, conta, navegar }));
        return;
      }
      navegar(acao.caminho);
    });
  };

  const abrirMais = () => {
    const variasContas = sessao.contas().length > 1;
    const lugares = conta.liberada ? itens : [];
    const folha = abrirFolha({
      titulo: conta.nome,
      subtitulo: escapar((sessao.usuario() || {}).email || ""),
      corpo: `<ul class="rz-lista-acoes">
          ${lugares.map(i => `<li><a href="${i.caminho}" ${i.estado === "trancado" ? `data-trancado="${escapar(i.nome)}"` : ""}>${icone(i.icone)}<span>${escapar(i.nome)}</span>${i.estado === "trancado" ? icone("cadeado", { tamanho: 16 }) : ""}</a></li>`).join("")}
          ${sessao.eEquipeRenderiza() ? `<li><a href="/admin">${icone("admin")}<span>Admin</span></a></li>` : ""}
          ${variasContas ? `<li><button type="button" data-trocar-conta>${icone("trocar")}<span>Trocar de conta</span></button></li>` : ""}
          <li><button type="button" data-sair>${icone("sair")}<span>Sair</span></button></li>
        </ul>`,
    });
    folha.corpo.addEventListener("click", e => {
      if (e.target.closest("a:not([data-trancado]), [data-trocar-conta], [data-sair]")) folha.fechar();
    });
  };

  // a Renderiza ajudando (Missão 5A): encerrar o suporte agora e voltar ao Admin (o registro fica, com o fim de agora)
  raiz.querySelector("[data-encerrar-suporte]")?.addEventListener("click", async () => {
    try {
      const { encerrarSuporte } = await import("../admin/suporte.js");
      await encerrarSuporte(banco, conta.conta_id);
      await sessao.carregarContas();
      avisar("Suporte encerrado.");
      navegar("/admin/contas");
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
  });
  raiz.querySelectorAll("[data-novo]").forEach(b => b.addEventListener("click", abrirNovo));
  raiz.querySelectorAll("[data-mais]").forEach(b => b.addEventListener("click", abrirMais));
  raiz.querySelectorAll("[data-buscar]").forEach(b => b.addEventListener("click", () => import("../ui/paleta.js").then(m => m.abrirPaleta({ sessao, banco, navegar }))));

  // Atalhos no computador (09): Ctrl+K ou "/" busca; N abre o "+". Ligados uma vez só.
  if (!teclasLigadas) {
    teclasLigadas = true;
    document.addEventListener("keydown", e => {
      const escrevendo = e.target.closest && e.target.closest("input, textarea, select, [contenteditable], dialog");
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.querySelector("[data-buscar]")?.click();
      } else if (!escrevendo && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "/") { e.preventDefault(); document.querySelector("[data-buscar]")?.click(); }
        if (e.key === "n" || e.key === "N") { e.preventDefault(); document.querySelector(".rz-topo-novo")?.click(); }
      }
    });
  }
}

/** Clique num item trancado: diz por quê, sem sair da tela (chamado pelo app, que cuida dos links). */
export function avisarTrancado(nome) {
  avisar(`Você não tem acesso a ${nome}. Quem dá os acessos é o dono da conta.`, { tipo: "erro" });
}

