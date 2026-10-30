// Módulo Contratos (Missão 3, bloco E): do orçamento ao aceite (02). A lista pela situação (esperando o aceite,
// orçamento, sem contrato, aceitos, cancelados), com o próximo passo na linha ("Mandar", "Lembrar", "Fazer
// contrato"); a gaveta e o contrato novo em contrato.js; os modelos em modelos.js; as regras em logica.js. O cliente
// aceita pelo link (/c/<código>, publico/contrato/). Quem só vê não tem botões (o banco também não deixa).

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { dataCurta } from "../../ui/formatos.js";
import { chipsDeContratos, grupoInicial, filtrarContratos, semContrato, esperandoHa } from "./logica.js";
import { COLUNAS_CONTRATO, etiquetaDoContrato, daReserva, abrirContrato, abrirFormContrato, mandar, compartilhar } from "./contrato.js";
import { abrirModelos } from "./modelos.js";

export async function montar(el, contexto) {
  const { banco, conta, nicho, pode, avisar, navegar } = contexto;
  const edita = pode("contratos", "editar");
  const fuso = conta.fuso || undefined;
  const params = new URLSearchParams(location.search);
  let filtro = { grupo: null, busca: "" };
  let dados = { contratos: [], reservas: [], modelos: 0, pix: false };
  const ctx = { banco, conta, nicho, pode, avisar, navegar, fuso, aoMudar: () => desenhar(), recarregar: () => atualizar(), abrirModelos: o => abrirModelos(ctx, o) };

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Contratos</h1>
        <p class="rz-texto-2">Do orçamento ao aceite. O cliente lê e aceita pelo link, no celular, sem papel.</p></div>
      <div class="rz-cabeca-acoes"><button class="rz-botao" type="button" data-modelos>${icone("contrato", { tamanho: 18 })}Modelos</button>
        ${edita ? `<button class="rz-botao rz-botao--primario" type="button" data-novo>${icone("adicionar", { tamanho: 18 })}Novo contrato</button>` : ""}</div>
    </header>
    ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê os Contratos. Quem faz e manda é o dono ou quem ele deixar.</span></p>` : ""}
    <div data-avisos></div>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const nomeDaReserva = r => daReserva(r, fuso);
  const linhaDoContrato = c => {
    const espera = esperandoHa(c);
    const sub = [nomeDaReserva(c.reservas), c.situacao === "aceito" && c.aceito_em ? `aceito ${dataCurta(new Date(c.aceito_em), fuso)}` : espera].filter(Boolean).join(" · ");
    const acao = !edita ? "" : c.situacao === "orcamento" ? `<button class="rz-botao rz-botao--pequeno" type="button" data-mandar="${escapar(c.id)}">${icone("whatsapp", { tamanho: 16 })}Mandar</button>`
      : c.situacao === "enviado" ? `<button class="rz-botao rz-botao--pequeno" type="button" data-lembrar="${escapar(c.id)}">${icone("whatsapp", { tamanho: 16 })}Lembrar</button>` : "";
    return `<li class="rz-com-acao"><button class="rz-linha" type="button" data-contrato="${escapar(c.id)}">
        <span class="rz-linha-texto"><b>${escapar((c.clientes && c.clientes.nome) || "Cliente")}</b><small>${escapar(sub || "sem data")}</small></span>
        <span class="rz-linha-fim">${etiquetaDoContrato(c)}</span></button>${acao}</li>`;
  };
  const linhaSemContrato = r => `<li class="rz-com-acao"><div class="rz-linha rz-linha--fixa">
      <span class="rz-linha-texto"><b>${escapar((r.clientes && r.clientes.nome) || "Cliente")}</b><small>${escapar(nomeDaReserva(r))}${r.situacao === "pre_reserva" ? " · pré-reserva" : ""}</small></span></div>
      ${edita ? `<button class="rz-botao rz-botao--pequeno" type="button" data-fazer="${escapar(r.id)}">${icone("adicionar", { tamanho: 16 })}Fazer contrato</button>` : ""}</li>`;

  function lista() {
    const pendentes = semContrato(dados.reservas, dados.contratos);
    if (filtro.grupo === "sem") {
      const termo = filtro.busca.trim().toLowerCase();
      const l = pendentes.filter(r => !termo || String((r.clientes && r.clientes.nome) || "").toLowerCase().includes(termo));
      return l.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-cartao">${l.slice(0, 200).map(linhaSemContrato).join("")}</ul>`
        : `<p class="rz-estado-curto">${filtro.busca ? "Nada com essa busca." : `Toda ${escapar(nicho.palavras.reserva)} marcada já tem contrato.`}</p>`;
    }
    const l = filtrarContratos(dados.contratos, filtro);
    return l.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-linhas--com-botao rz-cartao">${l.slice(0, 200).map(linhaDoContrato).join("")}</ul>`
      : `<p class="rz-estado-curto">${filtro.busca ? "Nada com essa busca." : "Nada aqui."}</p>`;
  }

  function desenhar() {
    const pendentes = semContrato(dados.reservas, dados.contratos);
    if (!filtro.grupo) filtro.grupo = grupoInicial(dados.contratos, pendentes);
    el.querySelector("[data-avisos]").innerHTML = [
      edita && !dados.modelos ? `<p class="rz-alerta rz-alerta--info">${icone("contrato", { tamanho: 18 })}<span>Comece pelo modelo: cole o texto do seu contrato uma vez e marque os campos (cliente, data, valor). <button class="rz-link" type="button" data-novo-modelo>Fazer o modelo</button></span></p>` : "",
      edita && !dados.pix ? `<p class="rz-alerta">${icone("carteira", { tamanho: 18 })}<span>Depois do aceite, o cliente vê os dados do Pix para pagar o sinal. ${conta.dono ? `<a class="rz-link" href="/configuracoes">Pôr a chave Pix em Configurações</a>` : "Peça ao dono para pôr a chave Pix em Configurações."}</span></p>` : "",
    ].join("");
    if (!dados.contratos.length && !pendentes.length) {
      corpo.innerHTML = vazio({ icone: "contrato", titulo: "Nenhum contrato ainda", texto: `Quando ${nicho.id === "eventos" ? "uma festa for marcada" : "um ensaio for marcado"}, faça o contrato por aqui: o texto sai preenchido e o cliente aceita pelo link.`, acao: edita ? { rotulo: "Novo contrato", dado: "novo" } : null });
      return;
    }
    corpo.innerHTML = `
      <div class="rz-barra-ferramentas">
        <input class="rz-entrada rz-campo-busca" type="search" placeholder="Buscar pelo cliente" aria-label="Buscar contrato" value="${escapar(filtro.busca)}" data-busca>
        ${chips({ rotulo: "Contratos", opcoes: chipsDeContratos(dados.contratos, pendentes), ativo: filtro.grupo })}
      </div>
      <div data-lista>${lista()}</div>`;
    const busca = corpo.querySelector("[data-busca]");
    busca.addEventListener("input", () => { filtro.busca = busca.value; corpo.querySelector("[data-lista]").innerHTML = lista(); });
    const grupo = corpo.querySelector(".rz-barra-ferramentas .rz-chips");
    if (grupo) ligarChips(grupo, v => { filtro.grupo = v; desenhar(); });
  }

  const carregar = async () => {
    const agora = new Date().toISOString();
    const [contratos, reservas, modelos, contaPix] = await Promise.all([
      banco.resultado(banco.tabela("contratos").select(COLUNAS_CONTRATO).eq("conta_id", conta.conta_id).order("criado_em", { ascending: false }).limit(3000)),
      banco.resultado(banco.tabela("reservas").select("id, cliente_id, inicio, fim, titulo, situacao, clientes(id, nome, whatsapp), tipos_reserva(nome), servicos(nome)").eq("conta_id", conta.conta_id).neq("situacao", "cancelada").gte("fim", agora).order("inicio").limit(1000)).catch(() => []),
      banco.resultado(banco.tabela("modelos_contrato").select("id").eq("conta_id", conta.conta_id).eq("ativo", true)).catch(() => []),
      banco.resultado(banco.tabela("contas").select("ajustes").eq("id", conta.conta_id).maybeSingle()).catch(() => null),
    ]);
    const pix = !!(contaPix && contaPix.ajustes && contaPix.ajustes.pix && String(contaPix.ajustes.pix.chave || "").trim());
    return { contratos, reservas, modelos: modelos.length, pix };
  };
  async function atualizar() { try { dados = await carregar(); desenhar(); } catch (e) { avisar(e.message, { tipo: "erro" }); } }

  const doId = id => dados.contratos.find(x => x.id === id);
  el.addEventListener("click", e => {
    if (e.target.closest("[data-modelos]")) return abrirModelos(ctx);
    if (e.target.closest("[data-novo-modelo]")) return abrirModelos(ctx, { novo: true });
    if (e.target.closest("[data-novo], [data-acao=novo]")) return abrirFormContrato(ctx);
    const fazer = e.target.closest("[data-fazer]");
    if (fazer) { const r = dados.reservas.find(x => x.id === fazer.dataset.fazer); if (r) abrirFormContrato(ctx, { cliente: r.clientes, reserva: r.id }); return; }
    const m = e.target.closest("[data-mandar]");
    if (m) { const c = doId(m.dataset.mandar); if (c) banco.resultado(banco.tabela("contratos").select("texto").eq("id", c.id).single()).then(t => mandar(c, ctx, { texto: t.texto })).catch(er => avisar(er.message, { tipo: "erro" })); return; }
    const l = e.target.closest("[data-lembrar]");
    if (l) { const c = doId(l.dataset.lembrar); if (c) compartilhar(c, ctx, { lembrete: true }); return; }
    const b = e.target.closest("[data-contrato]");
    if (b && corpo.contains(b)) { const c = doId(b.dataset.contrato); if (c) abrirContrato(c, ctx); }
  });

  await comEstados(corpo, { carregar, desenhar: d => { dados = d; desenhar(); }, linhas: 6 });

  // ?contrato=<id> (da ficha do cliente), ?novo=contrato[&reserva=<id>] (o "+" e a Agenda)
  if (["contrato", "novo", "reserva"].some(k => params.has(k))) history.replaceState(history.state, "", location.pathname);
  if (params.get("contrato")) {
    const c = doId(params.get("contrato"));
    if (c) abrirContrato(c, ctx); else avisar("Esse contrato não foi encontrado.", { tipo: "erro" });
  } else if (params.get("novo") === "contrato" && edita) {
    const r = params.get("reserva") && (dados.reservas.find(x => x.id === params.get("reserva"))
      || await banco.resultado(banco.tabela("reservas").select("id, clientes(id, nome, whatsapp)").eq("id", params.get("reserva")).maybeSingle()).catch(() => null));
    abrirFormContrato(ctx, r ? { cliente: r.clientes, reserva: r.id } : {});
  }
}
