// Meu site · Indicadores: as visitas do site (03, "Indicadores"). O resumo vem pronto do banco (site_indicadores:
// só números, nenhum dado de pessoa); aqui é só a tela, com as peças que o painel já tem (os números do funil, o
// gráfico do Financeiro com uma série só e as barras de "de onde vêm os pedidos").

import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { nomeDaSecao, duracao, nomeDoClique, nomeDaOrigem, escalaDoGrafico } from "./conteudo.js";

const PERIODOS = [[7, "7 dias"], [30, "30 dias"], [90, "90 dias"]];
const numero = n => Number(n || 0).toLocaleString("pt-BR");
const diaCurto = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const plural = (n, um, varios) => `${numero(n)} ${Number(n) === 1 ? um : varios}`;

/** Uma lista com barra: [{ nome, valor (o texto à direita), parte (0 a 1), nota? }]. */
const barras = (itens, semNada) => `<ul class="rz-origens">${itens.map(i => `<li><span>${escapar(i.nome)}${i.nota ? ` <span class="rz-texto-3">· ${escapar(i.nota)}</span>` : ""}</span><b>${escapar(i.valor)}</b>
    <span class="rz-progresso" aria-hidden="true"><span style="width:${Math.round(Math.min(1, Math.max(0, i.parte)) * 100)}%"></span></span></li>`).join("") || `<li class="rz-texto-3">${escapar(semNada)}</li>`}</ul>`;

function grafico(porDia) {
  const { topo, linhas } = escalaDoGrafico(Math.max(...porDia.map(d => d.visitas), 1));
  const cada = Math.ceil(porDia.length / 10); // o nome do dia embaixo: uns 10, para não encavalar
  return `<figure class="rz-grafico" aria-labelledby="ind-graf">
      <figcaption><span class="rz-rotulo" id="ind-graf">Visitas por dia</span></figcaption>
      <div class="rz-grafico-area" role="img" aria-label="Visitas por dia; os números estão na tabela logo abaixo">
        <div class="rz-grafico-eixo" aria-hidden="true">${linhas.slice().reverse().map(v => `<span>${numero(v)}</span>`).join("")}</div>
        <div class="rz-grafico-barras">
          ${linhas.map(v => `<i class="rz-grafico-grade" style="--f:${v / topo}"></i>`).join("")}
          ${porDia.map((d, i) => {
            const hoje = i === porDia.length - 1;
            return `<div class="rz-grafico-coluna${hoje ? " rz-grafico-coluna--atual" : ""}" tabindex="0" aria-label="${escapar(`${diaCurto(d.dia)}: ${plural(d.visitas, "visita", "visitas")}, ${plural(d.aparelhos, "aparelho", "aparelhos")}`)}">
              <div class="rz-grafico-pilha" style="--f:${d.visitas / topo}">${d.visitas ? '<span class="rz-serie-1" style="flex:1"></span>' : ""}
                ${hoje && d.visitas ? `<b class="rz-grafico-valor">${numero(d.visitas)}</b>` : ""}</div>
              ${hoje || (porDia.length - 1 - i) % cada === 0 ? `<span class="rz-grafico-mes">${hoje ? "hoje" : diaCurto(d.dia)}</span>` : ""}
              <span class="rz-grafico-dica" role="tooltip"><b>${diaCurto(d.dia)}</b><span>${plural(d.visitas, "visita", "visitas")}</span><span>${plural(d.aparelhos, "aparelho", "aparelhos")}</span></span>
            </div>`;
          }).join("")}
        </div>
      </div>
      <details class="rz-grafico-tabela"><summary>Ver em tabela</summary>
        <table><thead><tr><th scope="col">Dia</th><th scope="col">Visitas</th><th scope="col">Aparelhos</th></tr></thead>
        <tbody>${porDia.slice().reverse().map(d => `<tr><th scope="row">${diaCurto(d.dia)}</th><td>${numero(d.visitas)}</td><td>${numero(d.aparelhos)}</td></tr>`).join("")}</tbody></table></details>
    </figure>`;
}

/** `conteudo()` devolve o conteúdo do site de agora (para os nomes das partes e dos botões). */
export function montarIndicadores(lugar, { banco, conta, conteudo }) {
  let dias = 30;
  lugar.innerHTML = `
    <div class="rz-barra-ferramentas">
      <div class="rz-segmentos" role="group" aria-label="Período">${PERIODOS.map(([n, nome]) => `<button type="button" data-dias="${n}" aria-pressed="${n === dias}">${nome}</button>`).join("")}</div>
      <button class="rz-botao rz-botao--pequeno" type="button" data-atualizar>Atualizar</button>
    </div>
    <div data-ind></div>`;
  const corpo = lugar.querySelector("[data-ind]");

  const desenhar = r => {
    if (!r) { corpo.innerHTML = `<div class="rz-cartao">${vazio({ icone: "cadeado", titulo: "Você não vê os indicadores deste site", texto: "Peça ao dono o acesso ao Meu site." })}</div>`; return; }
    if (!Number(r.visitas)) {
      corpo.innerHTML = `<div class="rz-cartao">${vazio({ icone: "olho", titulo: "Nenhuma visita nos últimos " + dias + " dias", texto: "A contagem começa quando alguém abre o site. Site publicado antes de 16/11/2026 precisa ser atualizado pela Renderiza para contar." })}</div>`;
      return;
    }
    const c = conteudo() || {}, visitas = Number(r.visitas);
    const cliquesTotal = r.cliques.reduce((t, x) => t + Number(x.cliques), 0), maisClicado = Math.max(...r.cliques.map(x => Number(x.cliques)), 1);
    const origens = Object.entries(r.origens.reduce((t, o) => { const n = nomeDaOrigem(o.origem); t[n] = (t[n] || 0) + Number(o.visitas); return t; }, {})).sort((a, b) => b[1] - a[1]);
    const pct = n => `${Math.round((Number(n) / visitas) * 100)}%`;
    corpo.innerHTML = `
      <dl class="rz-funil rz-numeros">
        <div><dt>Visitas</dt><dd>${numero(visitas)}</dd><small>páginas abertas</small></div>
        <div><dt>Aparelhos</dt><dd>${numero(r.aparelhos)}</dd><small>somando dia a dia</small></div>
        <div><dt>Tempo médio</dt><dd>${escapar(duracao(r.segundos))}</dd><small>com a página à vista</small></div>
        <div><dt>Cliques em botões</dt><dd>${numero(cliquesTotal)}</dd><small>${cliquesTotal ? "veja quais, abaixo" : "nenhum no período"}</small></div>
      </dl>
      <div class="rz-cartao rz-ms-quadro">${grafico(r.por_dia)}</div>
      <div class="rz-ms-quadros">
        <section class="rz-cartao rz-ms-quadro"><h2 class="rz-titulo-3">As partes mais vistas</h2>
          <p class="rz-texto-3">Em quantas visitas a parte ficou no meio da tela, e por quanto tempo.</p>
          ${barras(r.secoes.map(s => ({ nome: nomeDaSecao(s.secao, (c.secoes || {})[s.secao]), nota: duracao(Number(s.segundos) / Number(s.visitas)) + " em média", valor: pct(s.visitas), parte: Number(s.visitas) / visitas })), "Ainda sem partes vistas.")}</section>
        <section class="rz-cartao rz-ms-quadro"><h2 class="rz-titulo-3">Os botões mais clicados</h2>
          <p class="rz-texto-3">Quantas vezes cada botão foi clicado.</p>
          ${barras(r.cliques.map(x => ({ nome: nomeDoClique(x.nome, c), valor: numero(x.cliques), parte: Number(x.cliques) / maisClicado })), "Ninguém clicou num botão neste período.")}</section>
        <section class="rz-cartao rz-ms-quadro"><h2 class="rz-titulo-3">De onde vieram</h2>
          <p class="rz-texto-3">O Instagram e o WhatsApp muitas vezes não dizem de onde a pessoa veio: essas visitas entram como "Direto".</p>
          ${barras(origens.map(([nome, n]) => ({ nome, valor: pct(n), parte: n / visitas })), "")}</section>
        <section class="rz-cartao rz-ms-quadro"><h2 class="rz-titulo-3">Como abriram</h2>
          ${barras([{ nome: "Celular", valor: pct(r.telas.celular), parte: Number(r.telas.celular) / visitas }, { nome: "Computador", valor: pct(r.telas.computador), parte: Number(r.telas.computador) / visitas }], "")}
          ${r.paginas.length > 1 ? `<h3 class="rz-rotulo rz-ms-sub">As páginas</h3>${barras(r.paginas.map(p => ({ nome: p.pagina === "/" ? "Página inicial" : p.pagina, valor: numero(p.visitas), parte: Number(p.visitas) / visitas })), "")}` : ""}</section>
      </div>
      <p class="rz-texto-3 rz-ms-regra">Como contamos: sem cookie e sem identificar ninguém. Cada página aberta é uma visita. "Aparelhos" soma os aparelhos diferentes de cada dia: o mesmo celular em dois dias conta duas vezes. Robôs não entram. Os números ficam guardados por 13 meses.</p>`;
  };

  const atualizar = () => comEstados(corpo, { carregar: () => banco.rpc("site_indicadores", { p_conta: conta.conta_id, p_dias: dias }), desenhar });
  lugar.addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.dias) {
      dias = Number(b.dataset.dias);
      lugar.querySelectorAll("[data-dias]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      atualizar();
    } else if (b.hasAttribute("data-atualizar")) atualizar();
  });
  return atualizar();
}
