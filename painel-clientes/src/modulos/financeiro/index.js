// Módulo Financeiro (Missão 3, bloco D): controle do que entra (02: não recebe nem cobra). Os números do mês, as
// parcelas (a receber, atrasadas, recebidas) com "Recebi" e desfazer, a festa vista pelo dinheiro (festa.js),
// registrar pagamento pelo "+", e, recolhidos, a receita mês a mês e o que mais vende. A parcela mora em
// parcela.js; as regras sem tela, em logica.js. Quem só vê não tem botões (o banco também não deixa).

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { dia, moeda } from "../../ui/formatos.js";
import { resumo, chipsDeParcelas, filtrarParcelas, textoDoVencimento, mesAMes, maisVendidos } from "./logica.js";
import { COLUNAS_PARCELA, etiquetaDaParcela, daReserva, abrirParcela, receber, abrirFormParcela } from "./parcela.js";
import { abrirFesta } from "./festa.js";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const nomeDoMes = m => `${MESES[Number(m.slice(5, 7)) - 1]}${m.slice(2, 4) !== new Date().toISOString().slice(2, 4) ? "/" + m.slice(2, 4) : ""}`;
/** Valor curto para eixo e rótulo: "R$ 12 mil", "R$ 1,2 mil", "R$ 900". */
export const compacto = v => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: v >= 10000 ? 0 : 1 })} mil` : moeda(v));

export async function montar(el, contexto) {
  const { banco, conta, nicho, pode, avisar, navegar } = contexto;
  const edita = pode("financeiro", "editar");
  const fuso = conta.fuso || undefined;
  const hoje = dia(new Date(), fuso);
  const params = new URLSearchParams(location.search);
  let filtro = { grupo: "receber", busca: "", cliente: params.get("cliente") || null };
  let dados = { parcelas: [], reservas: [] };
  const ctx = { banco, conta, nicho, pode, avisar, navegar, fuso, hoje, aoMudar: () => desenhar(), recarregar: () => atualizar(), abrirFesta: id => abrirFesta(id, ctx) };

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Financeiro</h1>
        <p class="rz-texto-2">O que já entrou e o que falta, ${escapar(nicho.palavras.reserva === "festa" ? "festa por festa" : "ensaio por ensaio")}. É controle: o Pix e o boleto continuam como o cliente já paga.</p></div>
      ${edita ? `<div class="rz-cabeca-acoes"><button class="rz-botao" type="button" data-nova-parcela>${icone("adicionar", { tamanho: 18 })}Nova parcela</button>
        <button class="rz-botao rz-botao--primario" type="button" data-registrar>${icone("carteira", { tamanho: 18 })}Registrar pagamento</button></div>` : ""}
    </header>
    ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê o Financeiro. Quem dá baixa é o dono ou quem ele deixar.</span></p>` : ""}
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const linha = p => `<li class="rz-com-acao"><button class="rz-linha" type="button" data-parcela="${escapar(p.id)}">
      <span class="rz-linha-texto"><b class="rz-titulo-valor"><span>${escapar((p.clientes && p.clientes.nome) || "Cliente")}</span><span>· ${escapar(moeda(p.valor))}</span></b><small>${escapar([p.descricao, daReserva(p.reservas, fuso), textoDoVencimento(p, hoje, fuso)].filter(Boolean).join(" · "))}</small></span>
      <span class="rz-linha-fim">${etiquetaDaParcela(p, hoje)}</span></button>
      ${edita && !p.pago_em ? `<button class="rz-botao rz-botao--pequeno" type="button" data-recebi="${escapar(p.id)}">${icone("ok", { tamanho: 16 })}Recebi</button>` : ""}</li>`;

  function grafico() {
    const meses = mesAMes(dados.parcelas, hoje);
    const maximo = Math.max(1, ...meses.map(m => m.recebido + m.previsto));
    const passo = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000].find(p => maximo / p <= 4) || 1000000;
    const topo = Math.ceil(maximo / passo) * passo;
    const linhas = Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => i * passo);
    return `<figure class="rz-grafico" aria-labelledby="graf-titulo">
        <figcaption><span class="rz-rotulo" id="graf-titulo">Mês a mês</span>
          <span class="rz-grafico-legenda"><span><i class="rz-serie-1"></i>Recebido</span><span><i class="rz-serie-2"></i>A receber</span></span></figcaption>
        <div class="rz-grafico-area" role="img" aria-label="Recebido e a receber por mês; os números estão na tabela logo abaixo">
          <div class="rz-grafico-eixo" aria-hidden="true">${linhas.slice().reverse().map(v => `<span>${escapar(compacto(v))}</span>`).join("")}</div>
          <div class="rz-grafico-barras">
            ${linhas.map(v => `<i class="rz-grafico-grade" style="--f:${v / topo}"></i>`).join("")}
            ${meses.map(m => `<div class="rz-grafico-coluna${m.atual ? " rz-grafico-coluna--atual" : ""}" tabindex="0" aria-label="${escapar(`${nomeDoMes(m.mes)}: recebido ${moeda(m.recebido)}, a receber ${moeda(m.previsto)}`)}">
                <div class="rz-grafico-pilha" style="--f:${(m.recebido + m.previsto) / topo}">
                  ${m.previsto ? `<span class="rz-serie-2" style="flex:${m.previsto}"></span>` : ""}${m.recebido ? `<span class="rz-serie-1" style="flex:${m.recebido}"></span>` : ""}
                  ${m.atual && m.recebido + m.previsto ? `<b class="rz-grafico-valor">${escapar(compacto(m.recebido + m.previsto))}</b>` : ""}
                </div>
                <span class="rz-grafico-mes">${escapar(nomeDoMes(m.mes))}</span>
                <span class="rz-grafico-dica" role="tooltip"><b>${escapar(nomeDoMes(m.mes))}</b><span><i class="rz-serie-1"></i>Recebido ${escapar(moeda(m.recebido))}</span><span><i class="rz-serie-2"></i>A receber ${escapar(moeda(m.previsto))}</span></span>
              </div>`).join("")}
          </div>
        </div>
        <details class="rz-grafico-tabela"><summary>Ver em tabela</summary>
          <table><thead><tr><th scope="col">Mês</th><th scope="col">Recebido</th><th scope="col">A receber</th></tr></thead>
          <tbody>${meses.map(m => `<tr><th scope="row">${escapar(nomeDoMes(m.mes))}</th><td>${escapar(moeda(m.recebido))}</td><td>${escapar(moeda(m.previsto))}</td></tr>`).join("")}</tbody></table></details>
      </figure>`;
  }

  function desenhar() {
    const r = resumo(dados.parcelas, hoje);
    const lista = filtrarParcelas(dados.parcelas, { ...filtro, hoje });
    const nomeDoFiltro = filtro.cliente && (dados.parcelas.find(p => p.cliente_id === filtro.cliente) || {}).clientes;
    const vendidos = maisVendidos(dados.reservas);
    corpo.innerHTML = `
      <dl class="rz-funil rz-numeros">
        <div><dt>Recebido no mês</dt><dd>${escapar(moeda(r.recebidoNoMes))}</dd></div>
        <div><dt>Falta receber no mês</dt><dd>${escapar(moeda(r.faltaNoMes))}</dd></div>
        <div><dt>A receber em 30 dias</dt><dd>${escapar(moeda(r.aReceber30))}</dd><small>${r.quantasEm30} ${r.quantasEm30 === 1 ? "parcela" : "parcelas"}</small></div>
        <div${r.quantasAtrasadas ? ' class="rz-numero--atencao"' : ""}><dt>Atrasadas</dt><dd>${escapar(moeda(r.atrasadas))}</dd><small>${r.quantasAtrasadas ? `${r.quantasAtrasadas} ${r.quantasAtrasadas === 1 ? "parcela" : "parcelas"}` : "nenhuma"}</small></div>
      </dl>
      <div class="rz-barra-ferramentas">
        <input class="rz-entrada rz-campo-busca" type="search" placeholder="Buscar por cliente ou descrição" aria-label="Buscar parcela" value="${escapar(filtro.busca)}" data-busca>
        ${nomeDoFiltro ? `<button class="rz-chip" type="button" data-tirar-cliente aria-pressed="true">${escapar(nomeDoFiltro.nome)} ${icone("fechar", { tamanho: 14 })}</button>` : ""}
        ${chips({ rotulo: "Parcelas", opcoes: chipsDeParcelas(dados.parcelas, hoje), ativo: filtro.grupo })}
      </div>
      <div data-lista>${!dados.parcelas.length ? vazio({ icone: "carteira", titulo: "Nenhuma parcela ainda", texto: `Na ${nicho.palavras.reserva === "festa" ? "festa" : "reserva"}, ponha o valor e use "Lançar parcelas": o sinal e o resto em vezes. Ou registre um pagamento que já entrou.`, acao: edita ? { rotulo: "Registrar pagamento", dado: "registrar" } : null })
        : lista.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-linhas--com-botao rz-cartao">${lista.slice(0, 200).map(linha).join("")}</ul>` : `<p class="rz-estado-curto">${filtro.busca ? "Nada com essa busca." : "Nada aqui."}</p>`}</div>
      ${dados.parcelas.length ? `<details class="rz-cartao rz-resumo"${desenhar.aberto ? " open" : ""}><summary>Mês a mês e o que mais vende ${icone("setaBaixo", { tamanho: 18 })}</summary>
        <div class="rz-resumo-corpo">${grafico()}
          <div><p class="rz-rotulo">O que mais vende</p>${vendidos.length ? `<ul class="rz-origens">${vendidos.slice(0, 6).map(v => `<li><span>${escapar(v.nome)} <span class="rz-texto-3">· ${v.n}</span></span><b>${escapar(compacto(v.total))}</b><span class="rz-progresso" aria-hidden="true"><span style="width:${vendidos[0].total ? Math.round((v.total / vendidos[0].total) * 100) : 0}%"></span></span></li>`).join("")}</ul>` : `<p class="rz-texto-3">Aparece quando as reservas tiverem valor.</p>`}</div>
        </div></details>` : ""}`;
    const busca = corpo.querySelector("[data-busca]");
    busca.addEventListener("input", () => { filtro.busca = busca.value; const l = filtrarParcelas(dados.parcelas, { ...filtro, hoje }); corpo.querySelector("[data-lista]").innerHTML = l.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-linhas--com-botao rz-cartao">${l.slice(0, 200).map(linha).join("")}</ul>` : `<p class="rz-estado-curto">Nada com essa busca.</p>`; });
    const grupo = corpo.querySelector(".rz-barra-ferramentas .rz-chips");
    if (grupo) ligarChips(grupo, v => { filtro.grupo = v; desenhar(); });
    corpo.querySelector("details.rz-resumo")?.addEventListener("toggle", e => { desenhar.aberto = e.target.open; });
  }

  const carregar = async () => {
    const [parcelas, reservas] = await Promise.all([
      banco.resultado(banco.tabela("parcelas").select(COLUNAS_PARCELA).eq("conta_id", conta.conta_id).order("vence_em").limit(5000)),
      banco.resultado(banco.tabela("reservas").select("id, situacao, tipos_reserva(nome), servicos(nome), reservas_valores(valor_total, desconto)").eq("conta_id", conta.conta_id).neq("situacao", "cancelada").limit(5000)).catch(() => []),
    ]);
    return { parcelas, reservas };
  };
  async function atualizar() { try { dados = await carregar(); desenhar(); } catch (e) { avisar(e.message, { tipo: "erro" }); } }

  el.addEventListener("click", e => {
    if (e.target.closest("[data-registrar], [data-acao=registrar]")) return abrirFormParcela(ctx, { jaRecebido: true });
    if (e.target.closest("[data-nova-parcela]")) return abrirFormParcela(ctx);
    if (e.target.closest("[data-tirar-cliente]")) { filtro.cliente = null; return desenhar(); }
    const rec = e.target.closest("[data-recebi]");
    if (rec) { const p = dados.parcelas.find(x => x.id === rec.dataset.recebi); if (p) receber(p, ctx); return; }
    const b = e.target.closest("[data-parcela]");
    if (b && corpo.contains(b)) { const p = dados.parcelas.find(x => x.id === b.dataset.parcela); if (p) abrirParcela(p, ctx); }
  });

  await comEstados(corpo, { carregar, desenhar: d => { dados = d; if (filtro.cliente) filtro.grupo = "todas"; desenhar(); }, linhas: 6 });

  // ?reserva=<id> (da Agenda e da ficha), ?parcela=<id>, ?cliente=<id>, ?novo=pagamento (o "+")
  if (["reserva", "parcela", "cliente", "novo"].some(k => params.has(k))) history.replaceState(history.state, "", location.pathname);
  if (params.get("reserva")) abrirFesta(params.get("reserva"), ctx);
  else if (params.get("parcela")) { const p = dados.parcelas.find(x => x.id === params.get("parcela")); if (p) abrirParcela(p, ctx); }
  else if (params.get("novo") === "pagamento" && edita) abrirFormParcela(ctx, { jaRecebido: true });
}
