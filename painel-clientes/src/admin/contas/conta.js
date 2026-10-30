// Admin · a gaveta da conta (Missão 5A; 02, "Como a conta nasce e vive"): a situação e o prazo, aprovar (com ou sem
// prazo), dar prazo, desligar e religar; os módulos da conta (ligar e desligar); as pessoas e os convites; os
// pagamentos; entrar para ajudar e exportar os dados a pedido (suporte.js). Desligar pede confirmação (09, regra 4).
// `ctx`: { banco, sessao, navegar, avisar, recarregar, catalogo }.

import { abrirGaveta, abrirFolha, confirmar } from "../../ui/gaveta.js";
import { icone } from "../../ui/icones.js";
import { escapar, ocupado } from "../../ui/formulario.js";
import { campoTexto, campoSelecao, interruptor, lerFormulario } from "../../ui/campos.js";
import { dataNumerica, dia, telefone, linkWhatsapp, moeda, instanteNoFuso } from "../../ui/formatos.js";
import { nicho } from "../../nichos/index.js";
import { estadoDaConta, ultimoAcesso, prazoAte, nomeDoMes, usandoAgora } from "../logica.js";
import { abrirPagamento } from "../pagamentos/pagamento.js";
import { entrarParaAjudar, exportarAPedido } from "../suporte.js";

const PRAZOS = [{ valor: "sem", rotulo: "Sem prazo" }, { valor: "30", rotulo: "30 dias" }, { valor: "90", rotulo: "90 dias" }, { valor: "365", rotulo: "1 ano" }, { valor: "data", rotulo: "Até uma data…" }];

/** A folha de "Aprovar" e "Dar prazo": sem prazo, 30, 90, 365 dias ou uma data. Resolve com a data (ou null) ou undefined. */
function escolherPrazo({ titulo, texto, botao, comSem = true }) {
  return new Promise(resolver => {
    let resposta;
    const hoje = dia(new Date());
    const folha = abrirFolha({
      titulo,
      corpo: `<form class="rz-pilha" novalidate id="form-prazo">
          ${texto ? `<p class="rz-texto-2">${escapar(texto)}</p>` : ""}
          ${campoSelecao({ id: "prazo-opcao", nome: "opcao", rotulo: "Prazo", valor: comSem ? "sem" : "30", opcoes: PRAZOS.filter(p => comSem || p.valor !== "sem") })}
          <div data-data hidden>${campoTexto({ id: "prazo-data", nome: "data", rotulo: "Até", tipo: "date", valor: "" })}</div>
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-prazo">${escapar(botao)}</button>`,
      aoFechar: () => resolver(resposta),
    });
    const form = folha.el.querySelector("form");
    form.opcao.addEventListener("change", () => { folha.el.querySelector("[data-data]").hidden = form.opcao.value !== "data"; });
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      if (d.opcao === "data" && !(d.data > hoje)) return form.data.focus();
      resposta = prazoAte(d.opcao === "data" ? d.data : d.opcao, hoje);
      folha.fechar();
    });
  });
}

export async function abrirConta(c, ctx) {
  const { banco, avisar, catalogo } = ctx;
  const n = nicho(c.nicho);
  const e = estadoDaConta(c);
  const [convites, pagamentos, suportes] = await Promise.all([
    banco.resultado(banco.tabela("convites").select("id, email, nome, dono, expira_em, aceito_em, cancelado_em").eq("conta_id", c.id).is("aceito_em", null).is("cancelado_em", null).order("criado_em", { ascending: false })).catch(() => []),
    banco.resultado(banco.tabela("pagamentos").select("id, mes, valor, pago_em, observacao").eq("conta_id", c.id).order("mes", { ascending: false }).limit(6)).catch(() => []),
    banco.resultado(banco.tabela("acessos_suporte").select("id, motivo, nivel, inicio, fim").eq("conta_id", c.id).order("inicio", { ascending: false }).limit(5)).catch(() => []),
  ]);
  const dono = c.donos[0];
  const acoesDaSituacao = c.situacao === "teste"
    ? `<button class="rz-botao rz-botao--primario" type="button" data-aprovar>${icone("ok")}Aprovar</button><button class="rz-botao" type="button" data-prazo-teste>${icone("relogio")}Mudar o fim do teste</button>`
    : c.situacao === "ativa"
      ? `<button class="rz-botao" type="button" data-prazo>${icone("relogio")}${c.ativa_ate ? "Mudar o prazo" : "Dar prazo"}</button><button class="rz-botao rz-botao--perigo" type="button" data-desligar>Desligar</button>`
      : `<button class="rz-botao rz-botao--primario" type="button" data-religar>${icone("ok")}Religar</button>`;

  const j = abrirGaveta({
    foco: "fechar",
    titulo: c.nome,
    subtitulo: escapar(`${n.nome} · código ${c.codigo}`),
    corpo: `<div class="rz-pilha">
        <div class="rz-etiquetas"><span class="rz-etiqueta${e.tom ? ` rz-etiqueta--${e.tom}` : ""}">${escapar(e.nome)}</span>${e.sub ? `<span class="rz-texto-3">${escapar(e.sub)}</span>` : ""}</div>
        <dl class="rz-fatos">
          <div><dt>Criada</dt><dd>${escapar(dataNumerica(new Date(c.criado_em)))} · ${c.origem === "cadastro" ? "pelo cadastro" : "pela Renderiza"}</dd></div>
          <div><dt>Dono</dt><dd>${dono ? `${escapar(dono.nome)}<br><small class="rz-texto-3">${escapar(dono.email || "")}</small>` : "ainda sem dono (convite)"}</dd></div>
          <div><dt>Pessoas</dt><dd>${c.ativas} de ${c.limite_pessoas}</dd></div>
          <div><dt>Último acesso</dt><dd>${escapar(ultimoAcesso([c.vistoEm]))}</dd></div>
          ${c.whatsapp ? `<div><dt>WhatsApp</dt><dd><a href="${escapar(linkWhatsapp(c.whatsapp))}" target="_blank" rel="noopener">${escapar(telefone(c.whatsapp))}</a></dd></div>` : ""}
        </dl>
        <div class="rz-acoes-ficha">${acoesDaSituacao}</div>

        <section class="rz-pilha-p"><h3 class="rz-titulo-3">Módulos</h3>
          <p class="rz-texto-3">Ligou ou desligou, vale na hora. No plano: 2 módulos; cada um a mais entra na mensalidade seguinte.</p>
          <form class="rz-pilha-p" data-modulos>${catalogo.map(m => interruptor({ nome: m.id, rotulo: n.modulos[m.id] ? n.modulos[m.id].nome : m.nome, ajuda: m.liberado_no_teste ? "" : "só pago: bloqueado no teste", marcado: c.ligados.includes(m.id) })).join("")}</form>
        </section>

        <section class="rz-pilha-p"><h3 class="rz-titulo-3">Pessoas</h3>
          <ul class="rz-linhas rz-cartao">${c.pessoas.map(p => `<li><div class="rz-linha rz-linha--fixa"><span class="rz-linha-texto"><b>${escapar(p.nome)}${p.dono ? " · dono" : ""}</b><small>${escapar([p.email, p.ativa ? (usandoAgora(p.visto_em) ? "usando agora" : ultimoAcesso([p.visto_em])) : "sem acesso"].filter(Boolean).join(" · "))}</small></span></div></li>`).join("")
            || `<li><div class="rz-linha rz-linha--fixa"><span class="rz-linha-texto"><small>Ninguém entrou ainda.</small></span></div></li>`}</ul>
          ${convites.length ? `<p class="rz-texto-3">Convite esperando: ${convites.map(x => `${escapar(x.nome || x.email)} (${escapar(x.email)}${x.dono ? ", dono" : ""}, vence ${escapar(dataNumerica(new Date(x.expira_em)))})`).join("; ")}.</p>` : ""}
          ${convites.length ? `<button class="rz-botao rz-botao--pequeno" type="button" data-reenviar="${escapar(convites[0].id)}">${icone("carta", { tamanho: 16 })}Mandar o convite de novo</button>` : ""}
        </section>

        <section class="rz-pilha-p"><div class="rz-secao-cabeca"><h3 class="rz-titulo-3">Pagamentos</h3><button class="rz-botao rz-botao--pequeno" type="button" data-pagar>${icone("carteira", { tamanho: 16 })}Registrar Pix</button></div>
          ${pagamentos.length ? `<ul class="rz-linhas rz-cartao">${pagamentos.map(p => `<li><div class="rz-linha rz-linha--fixa"><span class="rz-linha-texto"><b>${escapar(nomeDoMes(p.mes))} · ${escapar(moeda(p.valor, { centavos: true }))}</b><small>pago em ${escapar(dataNumerica(new Date(p.pago_em + "T12:00:00Z")))}${p.observacao ? ` · ${escapar(p.observacao)}` : ""}</small></span></div></li>`).join("")}</ul>`
            : `<p class="rz-texto-3">Nenhum pagamento registrado.</p>`}
        </section>

        <section class="rz-pilha-p"><h3 class="rz-titulo-3">Ajudar</h3>
          <p class="rz-texto-3">Entrar ou exportar fica registrado (quem, quando e por quê), e o dono vê.</p>
          <div class="rz-acoes-ficha"><button class="rz-botao" type="button" data-entrar>${icone("seta")}Entrar para ajudar</button><button class="rz-botao" type="button" data-exportar>${icone("baixar")}Exportar os dados</button></div>
          ${suportes.length ? `<ul class="rz-linhas rz-cartao">${suportes.map(s => `<li><div class="rz-linha rz-linha--fixa"><span class="rz-linha-texto"><b>${escapar(s.motivo)}</b><small>${escapar(`${dataNumerica(new Date(s.inicio))} · ${s.nivel === "editar" ? "ver e editar" : "só ver"} · ${Date.parse(s.fim) > Date.now() ? "valendo" : "encerrado"}`)}</small></span></div></li>`).join("")}</ul>` : ""}
        </section>
      </div>`,
  });
  const el = j.el;
  const mudar = async (mudanca, texto) => {
    try {
      await banco.resultado(banco.tabela("contas").update(mudanca).eq("id", c.id));
      j.fechar();
      avisar(texto);
      ctx.recarregar();
    } catch (er) { avisar(er.message, { tipo: "erro" }); }
  };
  el.querySelector("[data-aprovar]")?.addEventListener("click", async () => {
    const ate = await escolherPrazo({ titulo: `Aprovar ${c.nome}`, texto: "A conta passa a ativa: o teste acaba e tudo continua como está.", botao: "Aprovar" });
    if (ate === undefined) return;
    mudar({ situacao: "ativa", ativa_ate: ate }, `${c.nome}: aprovada${ate ? ` até ${dataNumerica(new Date(ate + "T12:00:00Z"))}` : ", sem prazo"}.`);
  });
  el.querySelector("[data-prazo-teste]")?.addEventListener("click", async () => {
    const ate = await escolherPrazo({ titulo: "O fim do teste", texto: "O teste é um só para todos os módulos (02). Use para corrigir um prazo combinado.", botao: "Salvar", comSem: false });
    if (!ate) return;
    mudar({ teste_ate: instanteNoFuso(ate, "23:59", c.fuso || undefined).toISOString() }, `${c.nome}: teste até ${dataNumerica(new Date(ate + "T12:00:00Z"))}.`);
  });
  el.querySelector("[data-prazo]")?.addEventListener("click", async () => {
    const ate = await escolherPrazo({ titulo: `O prazo de ${c.nome}`, texto: "Até quando a conta fica ativa. Sem prazo: até alguém desligar.", botao: "Salvar" });
    if (ate === undefined) return;
    mudar({ ativa_ate: ate }, ate ? `${c.nome}: ativa até ${dataNumerica(new Date(ate + "T12:00:00Z"))}.` : `${c.nome}: ativa, sem prazo.`);
  });
  el.querySelector("[data-desligar]")?.addEventListener("click", async () => {
    const ok = await confirmar({ titulo: `Desligar ${c.nome}?`, texto: "A equipe entra, mas vê só o aviso para falar com a Renderiza, e o site conectado volta à versão inicial. Nada é apagado: religou, tudo volta.", sim: "Desligar", nao: "Voltar", perigo: true });
    if (ok) mudar({ situacao: "desligada" }, `${c.nome}: desligada.`);
  });
  el.querySelector("[data-religar]")?.addEventListener("click", async () => {
    const ate = await escolherPrazo({ titulo: `Religar ${c.nome}`, texto: "A conta volta a ativa, com tudo como estava.", botao: "Religar" });
    if (ate === undefined) return;
    mudar({ situacao: "ativa", ativa_ate: ate }, `${c.nome}: religada.`);
  });
  el.querySelector("[data-modulos]").addEventListener("change", async ev => {
    const caixa = ev.target.closest("input[type=checkbox]");
    if (!caixa) return;
    caixa.disabled = true;
    try {
      await banco.resultado(banco.tabela("contas_modulos").upsert({ conta_id: c.id, modulo_id: caixa.name, ligado: caixa.checked }));
      c.ligados = caixa.checked ? [...new Set([...c.ligados, caixa.name])] : c.ligados.filter(x => x !== caixa.name);
      const m = catalogo.find(x => x.id === caixa.name);
      avisar(`${m ? m.nome : caixa.name}: ${caixa.checked ? "ligado" : "desligado"} em ${c.nome}.`);
      ctx.recarregar();
    } catch (er) { caixa.checked = !caixa.checked; avisar(er.message, { tipo: "erro" }); }
    caixa.disabled = false;
  });
  el.querySelector("[data-reenviar]")?.addEventListener("click", async ev => {
    const b = ev.currentTarget;
    ocupado(b, true, "Mandando…");
    try {
      await banco.funcao("convidar", { convite: b.dataset.reenviar, destino: location.origin + "/convite" });
      avisar("Convite mandado de novo.");
    } catch (er) { avisar(er.message, { tipo: "erro" }); }
    ocupado(b, false);
  });
  el.querySelector("[data-pagar]").addEventListener("click", () => { j.fechar(); abrirPagamento(c, ctx); });
  el.querySelector("[data-entrar]").addEventListener("click", () => { j.fechar(); entrarParaAjudar(c, ctx); });
  el.querySelector("[data-exportar]").addEventListener("click", () => exportarAPedido(c, ctx));
  return j;
}
