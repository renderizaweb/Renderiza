// Agenda · campanhas (Missão 3, bloco B; fotografia: a mini sessão de Natal do exemplo). Para cada campanha ativa:
// quantos horários foram reservados, com sinal e esperando o sinal, quantas pessoas na lista de espera; o quadro de
// horários por dia (livre vira "Marcar"); e o texto pronto para o Stories, que muda sozinho a cada reserva.

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { ligarCopiar } from "../../ui/whatsapp.js";
import { dataLonga, instanteNoFuso, dia, horaDoTexto } from "../../ui/formatos.js";
import { resumoDaCampanha, textoDoStories, horariosLivres, quandoFoi } from "./logica.js";
import { COLUNAS_RESERVA, abrirReserva, abrirFormReserva } from "./reserva.js";

export async function montarCampanhas(el, ctx) {
  const { banco, conta, pode, fuso, hoje } = ctx;
  const edita = pode("agenda", "editar");
  let dados = { campanhas: [], reservas: [], servicos: [], espera: [] };

  const carregar = async () => {
    const campanhas = await banco.resultado(banco.tabela("campanhas").select("id, nome, dias, horarios, vagas, servico_id, prazo_sinal_horas").eq("conta_id", conta.conta_id).eq("ativa", true).order("nome"));
    const ids = campanhas.map(c => c.id);
    const [reservas, servicos, espera, equipe] = await Promise.all([
      ids.length ? banco.resultado(banco.tabela("reservas").select(COLUNAS_RESERVA).eq("conta_id", conta.conta_id).in("campanha_id", ids)) : [],
      banco.resultado(banco.tabela("servicos").select("id, nome, duracao_min, entrega").eq("conta_id", conta.conta_id)).catch(() => []),
      ids.length && (pode("atendimento", "ver") || pode("agenda", "ver")) ? banco.resultado(banco.tabela("lista_espera").select("id, campanha_id").eq("conta_id", conta.conta_id).in("campanha_id", ids)).catch(() => []) : [],
      banco.resultado(banco.tabela("pessoas").select("id, nome, cor").eq("conta_id", conta.conta_id).eq("ativa", true).order("nome")).catch(() => []),
    ]);
    ctx.equipe = equipe;
    return { campanhas, reservas, servicos, espera };
  };

  const desenhar = () => {
    if (!dados.campanhas.length) {
      el.innerHTML = vazio({ icone: "estrela", titulo: "Nenhuma campanha ativa", texto: "Mini sessões com vagas (como a de Natal) se cadastram em Serviços, Campanhas. Aqui aparece o quadro de horários e o texto pronto para o Stories.", acao: pode("servicos", "editar") ? { rotulo: "Criar uma campanha", href: "/servicos?aba=campanhas" } : null });
      return;
    }
    el.innerHTML = dados.campanhas.map(c => {
      const servico = dados.servicos.find(s => s.id === c.servico_id) || null;
      const duracao = (servico && servico.duracao_min) || 30;
      const resumo = resumoDaCampanha(c, dados.reservas);
      const dias = [...(c.dias || [])].sort();
      const doDia = d => dados.reservas.filter(r => r.campanha_id === c.id && r.situacao !== "cancelada" && dia(new Date(r.inicio), fuso) === d);
      const livresPorDia = dias.filter(d => d >= hoje).map(d => ({ dia: d, livres: horariosLivres({ d, horarios: [], campanha: c, reservas: dados.reservas, duracao, fuso }).length }));
      const stories = textoDoStories({ campanha: c, livresPorDia, conta, servico, fuso });
      const naEspera = dados.espera.filter(x => x.campanha_id === c.id).length;
      return `<section class="rz-secao">
        <div class="rz-secao-cabeca"><h2 class="rz-titulo-2">${escapar(c.nome)}</h2><span class="rz-texto-3">${dias.length} ${dias.length === 1 ? "dia" : "dias"}${servico ? ` · ${escapar(servico.nome)}, ${duracao} min` : ""}</span></div>
        <dl class="rz-funil">
          <div><dt>Horários reservados</dt><dd>${resumo.reservadas} de ${resumo.total}</dd><small>restam ${resumo.restam}</small></div>
          <div><dt>Com sinal</dt><dd>${resumo.comSinal}</dd><small>confirmados</small></div>
          <div><dt>Esperando o sinal</dt><dd>${resumo.esperandoSinal}</dd><small>${c.prazo_sinal_horas ? `o horário fica separado por ${c.prazo_sinal_horas} h` : "pré-reserva"}</small></div>
          <div><dt>Lista de espera</dt><dd>${naEspera}</dd><small><a href="/atendimento?aba=espera">ver a lista</a></small></div>
        </dl>
        ${dias.map(d => {
          const reservas = doDia(d);
          return `<div class="rz-cartao rz-campanha-dia">
            <div class="rz-painel-dia-cabeca"><h3 class="rz-titulo-3">${escapar(dataLonga(instanteNoFuso(d, "12:00", fuso), fuso))}</h3><span class="rz-texto-3">${escapar(quandoFoi(d, hoje))}</span></div>
            <div class="rz-horarios">${[...(c.horarios || [])].sort().map(h => {
              const hh = h.slice(0, 5);
              const r = reservas.find(x => {
                const comeca = instanteNoFuso(d, hh, fuso).getTime();
                return Date.parse(x.inicio) <= comeca && Date.parse(x.fim) > comeca;
              });
              const rotulo = horaDoTexto(hh);
              if (r) return `<button type="button" class="rz-horario rz-horario--${r.situacao === "pre_reserva" ? "pre" : "ok"}" data-reserva="${escapar(r.id)}"><b>${rotulo}</b><span>${escapar(((r.clientes && r.clientes.nome) || "Reservado").split(/\s+/)[0])}${r.situacao === "pre_reserva" ? " · sinal?" : ""}</span></button>`;
              const passou = d < hoje;
              return edita && !passou
                ? `<button type="button" class="rz-horario rz-horario--livre" data-livre="${d} ${hh}" data-campanha="${escapar(c.id)}"><b>${rotulo}</b><span>livre</span></button>`
                : `<span class="rz-horario rz-horario--livre"><b>${rotulo}</b><span>${passou ? "—" : "livre"}</span></span>`;
            }).join("")}</div></div>`;
        }).join("")}
        <p class="rz-legenda"><span><i class="rz-horario--ok"></i>Com sinal</span><span><i class="rz-horario--pre"></i>Esperando o sinal</span><span><i class="rz-horario--livre"></i>Livre${(conta.modulos || []).includes("agenda-online") ? " (na agenda online)" : ""}</span></p>
        <div class="rz-cartao rz-cartao-corpo">
          <div class="rz-secao-cabeca"><h3 class="rz-titulo-3">Texto pronto para o Stories</h3><button class="rz-botao rz-botao--pequeno" type="button" data-copiar="${escapar(stories)}">${icone("copiar", { tamanho: 16 })}Copiar</button></div>
          <div class="rz-balao">${escapar(stories)}</div>
          <p class="rz-texto-3">O número de horários muda sozinho a cada reserva.</p>
        </div>
      </section>`;
    }).join("");
  };

  ligarCopiar(el);
  el.addEventListener("click", async e => {
    const r = e.target.closest("[data-reserva]");
    if (r) { const x = dados.reservas.find(y => y.id === r.dataset.reserva); if (x) abrirReserva(x, { ...ctx, aoMudar: desenhar, recarregar: atualizar }); return; }
    const l = e.target.closest("[data-livre]");
    if (l) {
      const [d, h] = l.dataset.livre.split(" ");
      const campanha = dados.campanhas.find(c => c.id === l.dataset.campanha);
      await abrirFormReserva({ ...ctx, recarregar: atualizar }, { dia: d, hora: h, campanha });
    }
  });
  async function atualizar() { try { dados = await carregar(); desenhar(); } catch (e) { ctx.avisar(e.message, { tipo: "erro" }); } }
  await comEstados(el, { carregar, desenhar: d => { dados = d; desenhar(); } });
}
