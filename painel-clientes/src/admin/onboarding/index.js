// Admin · Onboarding (Missão 7, bloco G; D47): o acompanhamento até a confiança. As contas criadas pela Renderiza
// nos últimos 60 dias (admin_onboarding() no banco), com o funil, a etapa de cada uma, os marcos da primeira semana,
// quem travou e onde, e a mensagem pronta para mandar no WhatsApp do negócio. As regras sem tela, em logica.js.
// No topo, os pedidos "a Renderiza monta" (Missão 7F, D48): "Montar agora" entra no suporte da conta e abre o /trazer,
// com os arquivos que a pessoa mandou.

import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { icone } from "../../ui/icones.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { linkWhatsapp, haQuanto } from "../../ui/formatos.js";
import { etapaDaConta, funilDoOnboarding, oQueTrouxe } from "./logica.js";
import { entrarParaAjudar } from "../suporte.js";

export async function montar(el, { banco, sessao, navegar }) {
  let pedidos = [];
  let filtro = "travadas";
  el.innerHTML = `
    <header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Onboarding</h1>
      <p class="rz-texto-2">As contas que a Renderiza criou nos últimos 60 dias: em que ponto cada uma está, quem travou e a mensagem pronta para destravar.</p></div></header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const linha = ({ l, e }) => `<li class="rz-com-acao"><button class="rz-linha" type="button" data-conta="${escapar(l.conta_id)}">
      <span class="rz-linha-texto"><b>${escapar(l.nome)}</b>
        <small>${escapar([l.dono, e.nome, e.desde ? `desde ${haQuanto(new Date(e.desde))}` : ""].filter(Boolean).join(" · "))}</small>
        ${oQueTrouxe(l) ? `<small>${escapar(oQueTrouxe(l))}</small>` : ""}
        <span class="rz-acessos-chips">${e.marcos.filter(m => m.conta || m.feito).map(m => `<span class="rz-etiqueta${m.feito ? " rz-etiqueta--sucesso" : ""}">${m.feito ? "✓ " : ""}${escapar(m.nome)}</span>`).join("")}</span></span>
      <span class="rz-linha-fim">${l.pedido_renderiza ? `<span class="rz-etiqueta rz-etiqueta--info">Pediu para montar</span>` : ""}${e.travou ? `<span class="rz-etiqueta rz-etiqueta--alerta">Travou</span>` : e.id === "confiante" ? `<span class="rz-etiqueta rz-etiqueta--sucesso">Confiante</span>` : ""}</span></button>
      ${e.mensagem && l.whatsapp ? `<a class="rz-botao rz-botao--pequeno" href="${escapar(linkWhatsapp(l.whatsapp, e.mensagem))}" target="_blank" rel="noopener" title="${escapar(e.mensagem)}">${icone("whatsapp", { tamanho: 16 })}Mandar mensagem</a>` : ""}</li>`;

  const desenhar = linhas => {
    if (!linhas.length) {
      corpo.innerHTML = vazio({ icone: "estrela", titulo: "Nenhuma conta nova", texto: "As contas que a Renderiza criar no Admin aparecem aqui, do convite até a confiança." });
      return;
    }
    const com = linhas.map(l => ({ l, e: etapaDaConta(l) }));
    const grupos = {
      travadas: com.filter(x => x.e.travou),
      andando: com.filter(x => !x.e.travou && x.e.id !== "confiante"),
      confiantes: com.filter(x => x.e.id === "confiante"),
      todas: com,
    };
    if (!grupos[filtro].length && filtro === "travadas") filtro = "todas";
    corpo.innerHTML = `
      ${pedidos.length ? `<section class="rz-secao" aria-labelledby="pedidos-titulo">
        <h2 class="rz-titulo-3" id="pedidos-titulo">Pediram para a Renderiza montar</h2>
        <ul class="rz-linhas rz-linhas--com-botao rz-cartao">${pedidos.map(p => `<li class="rz-com-acao"><div class="rz-linha">
          <span class="rz-linha-texto"><b>${escapar(p.conta)}</b><small>${p.arquivos} ${p.arquivos === 1 ? "arquivo" : "arquivos"} · ${escapar(haQuanto(new Date(p.criado_em)))}${p.recado ? ` · "${escapar(p.recado)}"` : ""}</small></span></div>
          <button class="rz-botao rz-botao--pequeno rz-botao--primario" type="button" data-montar="${escapar(p.conta_id)}">${icone("importar", { tamanho: 16 })}Montar agora</button></li>`).join("")}</ul>
      </section>` : ""}
      <dl class="rz-funil rz-numeros">${funilDoOnboarding(linhas).map(f => `<div><dt>${escapar(f.nome)}</dt><dd>${f.n}</dd></div>`).join("")}</dl>
      <div class="rz-barra-ferramentas">${chips({ rotulo: "Contas", opcoes: [
        { valor: "travadas", rotulo: "Travaram", quantos: grupos.travadas.length },
        { valor: "andando", rotulo: "Andando", quantos: grupos.andando.length },
        { valor: "confiantes", rotulo: "Confiantes", quantos: grupos.confiantes.length },
        { valor: "todas", rotulo: "Todas", quantos: com.length },
      ], ativo: filtro })}</div>
      ${grupos[filtro].length ? `<ul class="rz-linhas rz-linhas--pedidos rz-linhas--com-botao rz-cartao">${grupos[filtro].map(linha).join("")}</ul>` : `<p class="rz-estado-curto">Nenhuma aqui.</p>`}`;
    ligarChips(corpo.querySelector(".rz-chips"), v => { filtro = v; desenhar(linhas); });
  };

  corpo.addEventListener("click", e => {
    const m = e.target.closest("[data-montar]");
    if (m) {
      const p = pedidos.find(x => x.conta_id === m.dataset.montar);
      return entrarParaAjudar({ id: p.conta_id, nome: p.conta }, { banco, sessao, navegar }, { motivo: "Montar o painel com os arquivos que a pessoa mandou", nivel: "editar", destino: "/trazer" });
    }
    const b = e.target.closest("[data-conta]");
    if (b) navegar(`/admin/contas?conta=${b.dataset.conta}`);
  });
  await comEstados(corpo, {
    carregar: async () => {
      const [linhas, abertos] = await Promise.all([banco.rpc("admin_onboarding"), banco.rpc("admin_pedidos_a_renderiza").catch(() => [])]);
      pedidos = abertos || [];
      return linhas;
    },
    desenhar, linhas: 5,
  });
}
