// Admin · Indicadores (Missão 5A; 02 e 06): só números, pela função admin_indicadores() do banco: contas por
// situação e por nicho, cadastros por semana, pessoas ativas, uso de cada módulo e pedidos que vieram dos sites.
// Nada de nome ou contato dos clientes dos clientes.

import { escapar } from "../../ui/formulario.js";
import { comEstados } from "../../ui/estados.js";
import { dataNumerica } from "../../ui/formatos.js";
import { NICHOS } from "../../nichos/index.js";
import { SITUACOES } from "../logica.js";

const barras = (pares, nomes = {}) => {
  const lista = Object.entries(pares || {}).sort((a, b) => b[1] - a[1]);
  if (!lista.length) return `<p class="rz-texto-3">Nada ainda.</p>`;
  const max = Math.max(...lista.map(([, n]) => n));
  return `<ul class="rz-origens">${lista.map(([k, n]) => `<li><span>${escapar(nomes[k] || k)}</span><b>${n}</b><span class="rz-progresso" aria-hidden="true"><span style="width:${max ? Math.round((n / max) * 100) : 0}%"></span></span></li>`).join("")}</ul>`;
};

export async function montar(el, { banco }) {
  el.innerHTML = `
    <header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Indicadores</h1>
      <p class="rz-texto-2">Só números: nada de nome ou contato dos clientes dos clientes.</p></div></header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");
  const desenhar = ({ ind, modulos }) => {
    const s = ind.contas_por_situacao || {};
    const total = Object.values(s).reduce((t, n) => t + n, 0);
    const nomesModulos = Object.fromEntries(modulos.map(m => [m.id, m.nome]));
    const nomesNichos = Object.fromEntries(Object.values(NICHOS).map(x => [x.id, x.nome]));
    const nomesSituacao = Object.fromEntries(Object.entries(SITUACOES).map(([k, v]) => [k, v.nome]));
    corpo.innerHTML = `
      <section class="rz-secao" aria-label="Os números"><dl class="rz-funil rz-numeros">
        <div><dt>Contas</dt><dd>${total}</dd><small>${s.ativa || 0} ativas · ${s.teste || 0} em teste</small></div>
        <div><dt>Pessoas ativas (7 dias)</dt><dd>${ind.pessoas_ativas_7_dias || 0}</dd><small>${ind.pessoas_ativas_30_dias || 0} em 30 dias</small></div>
        <div><dt>Pedidos dos sites (30 dias)</dt><dd>${ind.pedidos_dos_sites_30_dias || 0}</dd><small>pela agenda online</small></div>
        <div><dt>Desligadas</dt><dd>${(s.desligada || 0) + (s.cancelada || 0)}</dd><small>${s.cancelada || 0} canceladas</small></div>
      </dl></section>
      <div class="rz-inicio-colunas">
        <section class="rz-secao rz-cartao rz-cartao-corpo"><h2 class="rz-titulo-3">Contas por situação</h2>${barras(s, nomesSituacao)}</section>
        <section class="rz-secao rz-cartao rz-cartao-corpo"><h2 class="rz-titulo-3">Contas por nicho</h2>${barras(ind.contas_por_nicho, nomesNichos)}</section>
        <section class="rz-secao rz-cartao rz-cartao-corpo"><h2 class="rz-titulo-3">Módulos ligados</h2>${barras(ind.modulos_ligados, nomesModulos)}</section>
        <section class="rz-secao rz-cartao rz-cartao-corpo"><h2 class="rz-titulo-3">Uso em 30 dias <span class="rz-texto-3">registros criados</span></h2>${barras(ind.uso_por_modulo_30_dias, { ...nomesModulos, inicio: "Início (clientes, agenda)" })}</section>
      </div>
      <section class="rz-secao rz-cartao rz-cartao-corpo"><h2 class="rz-titulo-3">Cadastros por semana <span class="rz-texto-3">últimas 12 semanas</span></h2>
        ${(ind.cadastros_por_semana || []).length ? `<table class="rz-tabela-simples"><thead><tr><th scope="col">Semana de</th><th scope="col">Cadastros</th></tr></thead>
          <tbody>${ind.cadastros_por_semana.map(x => `<tr><td>${escapar(dataNumerica(new Date(x.semana + "T12:00:00Z")))}</td><td>${x.contas}</td></tr>`).join("")}</tbody></table>` : `<p class="rz-texto-3">Nenhum cadastro sozinho nas últimas 12 semanas.</p>`}
      </section>`;
  };
  const carregar = async () => {
    const [ind, modulos] = await Promise.all([banco.rpc("admin_indicadores"), banco.resultado(banco.tabela("modulos").select("id, nome").order("ordem"))]);
    return { ind: ind || {}, modulos };
  };
  await comEstados(corpo, { carregar, desenhar, linhas: 4 });
}
