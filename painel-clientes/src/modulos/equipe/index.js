// Equipe e acessos (só o dono; 02, 05): quem entra na conta e o que cada pessoa vê em cada módulo ("só vê" ou
// "edita"), convidar, mudar os acessos, tirar e devolver o acesso. O exemplo (exemplos/painel-eventos.html, Equipe)
// é a referência. Quem garante é o banco (pessoas, convites e a função pode); a tela só facilita.
// O e-mail do convite sai da função do servidor "convidar" (supabase/functions/convidar).

import { nicho as nichoDe } from "../../nichos/index.js";
import { icone } from "../../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { iniciais, haQuanto, dataCurta } from "../../ui/formatos.js";
import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { campoTexto, segmentos, interruptor, escolherCor, lerFormulario, CORES } from "../../ui/campos.js";
import { validarEmail } from "../../sessao.js";

const NIVEIS = [{ valor: "", rotulo: "Sem acesso" }, { valor: "ver", rotulo: "Só vê" }, { valor: "editar", rotulo: "Edita" }];

/** Os módulos que entram na grade de acessos: os ligados na conta e, por último, Serviços (todos veem). */
export function modulosDaGrade(conta) {
  const n = nichoDe(conta.nicho);
  const ligados = (conta.modulos || []).filter(m => m !== "agenda-online");
  return [...ligados.map(id => ({ id, nome: (n.modulos[id] && n.modulos[id].nome) || id, niveis: NIVEIS })),
    { id: "servicos", nome: n.palavras.servicos[0].toUpperCase() + n.palavras.servicos.slice(1), niveis: NIVEIS.slice(1) }];
}

/** Os acessos que o formulário marcou: só "ver" e "editar" ficam ("Serviços: só vê" é o padrão e não precisa). */
export function acessosDoFormulario(dados, modulos) {
  const acessos = {};
  for (const m of modulos) {
    const nivel = dados["acesso-" + m.id];
    if (nivel === "editar" || (nivel === "ver" && m.id !== "servicos")) acessos[m.id] = nivel;
  }
  return acessos;
}

/** Os acessos em frase curta, para a lista ("Agenda (só vê)", "Financeiro"). */
export function resumoDosAcessos(pessoa, modulos) {
  if (pessoa.dono) return ["Tudo (dono)"];
  const a = pessoa.acessos || {};
  const lista = modulos.filter(m => a[m.id] === "ver" || a[m.id] === "editar").map(m => (a[m.id] === "ver" ? `${m.nome} (só vê)` : m.nome));
  return lista.length ? lista : ["Só o Início"];
}

/** "agora", "há 20 min", "ainda não entrou". */
export function vistoEm(visto, agora = Date.now()) {
  if (!visto) return "ainda não entrou";
  return agora - Date.parse(visto) < 5 * 60000 ? "agora" : haQuanto(visto, agora);
}

function linhaDaPessoa(p, modulos) {
  const cor = p.cor ? ` style="--cor:${escapar(p.cor)}"` : "";
  return `<li><button class="rz-linha" type="button" data-pessoa="${escapar(p.id)}">
      <span class="rz-avatar"${cor} aria-hidden="true">${escapar(iniciais(p.nome))}</span>
      <span class="rz-linha-texto"><b>${escapar(p.nome)}${p.dono ? ' <span class="rz-etiqueta rz-etiqueta--destaque">Dono</span>' : ""}${!p.ativa ? ' <span class="rz-etiqueta">Sem acesso</span>' : ""}</b>
        <small>${escapar([p.papel, p.email].filter(Boolean).join(" · "))}</small>
        <span class="rz-acessos-chips">${resumoDosAcessos(p, modulos).map(t => `<span class="rz-etiqueta">${escapar(t)}</span>`).join("")}</span></span>
      <span class="rz-linha-fim rz-texto-3">${escapar(p.ativa ? vistoEm(p.visto_em) : "")}</span>
    </button></li>`;
}

function linhaDoConvite(c, modulos) {
  return `<li><div class="rz-linha">
      <span class="rz-avatar rz-avatar--cliente" aria-hidden="true">${icone("carta", { tamanho: 16 })}</span>
      <span class="rz-linha-texto"><b>${escapar(c.nome || c.email)}</b><small>${escapar(c.email)} · convite vale até ${escapar(dataCurta(c.expira_em))}</small>
        <span class="rz-acessos-chips">${resumoDosAcessos(c, modulos).map(t => `<span class="rz-etiqueta">${escapar(t)}</span>`).join("")}</span></span>
      <span class="rz-linha-fim">
        <button class="rz-botao rz-botao--pequeno" type="button" data-reenviar="${escapar(c.id)}">Reenviar</button>
        <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-cancelar="${escapar(c.id)}">Cancelar</button>
      </span>
    </div></li>`;
}

function gradeDeAcessos(modulos, acessos = {}, dono = false) {
  return `<fieldset class="rz-campo" data-grade ${dono ? "disabled" : ""}><legend class="rz-rotulo">O que pode ver e fazer</legend>
      <div class="rz-acessos-grade">${modulos.map(m => `<div class="rz-acesso-linha"><span>${escapar(m.nome)}</span>
        ${segmentos({ nome: "acesso-" + m.id, rotulo: m.nome, opcoes: m.niveis, valor: acessos[m.id] || (m.id === "servicos" ? "ver" : "") })}</div>`).join("")}</div>
      <p class="rz-ajuda">O Início todo mundo vê. Equipe e Configurações são só do dono.</p>
    </fieldset>`;
}

export async function montar(el, { banco, conta, navegar, avisar, sessao }) {
  const modulos = modulosDaGrade(conta);
  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Equipe e acessos</h1>
        <p class="rz-texto-2">Cada pessoa entra com o próprio login. Você decide o que cada uma vê.</p></div>
      <div class="rz-cabeca-acoes"><button class="rz-botao rz-botao--primario" type="button" data-convidar>${icone("adicionar", { tamanho: 18 })}Convidar</button></div>
    </header>
    <div data-lista></div>`;
  const lista = el.querySelector("[data-lista]");
  let pessoas = [], convites = [], limite = 5;

  const carregar = async () => {
    const [p, c, contaLinha] = await Promise.all([
      banco.resultado(banco.tabela("pessoas").select("id, usuario_id, nome, email, papel, cor, dono, acessos, ativa, visto_em").eq("conta_id", conta.conta_id).order("dono", { ascending: false }).order("nome")),
      banco.resultado(banco.tabela("convites").select("id, email, nome, papel, cor, dono, acessos, expira_em").eq("conta_id", conta.conta_id).is("aceito_em", null).is("cancelado_em", null).order("criado_em")),
      banco.resultado(banco.tabela("contas").select("limite_pessoas").eq("id", conta.conta_id).single()),
    ]);
    return { p, c, limite: contaLinha.limite_pessoas };
  };
  const desenhar = ({ p, c, limite: l }) => {
    pessoas = p; convites = c; limite = l;
    const ativas = pessoas.filter(x => x.ativa).length;
    const vagas = limite - ativas - convites.length;
    el.querySelector("[data-convidar]").disabled = vagas <= 0;
    lista.innerHTML = `
      <section class="rz-secao">
        <div class="rz-secao-cabeca"><h2 class="rz-titulo-3">Pessoas</h2><span class="rz-texto-3">${ativas} de ${limite} no plano${convites.length ? ` · ${convites.length} convite${convites.length > 1 ? "s" : ""} esperando` : ""}</span></div>
        <ul class="rz-cartao rz-linhas">${pessoas.filter(x => x.ativa).map(x => linhaDaPessoa(x, modulos)).join("")}</ul>
        ${vagas <= 0 ? `<p class="rz-texto-3">A conta chegou ao limite de ${limite} pessoas do plano. Para mais, fale com a gente.</p>` : ""}
      </section>
      ${convites.length ? `<section class="rz-secao"><h2 class="rz-titulo-3">Convites esperando</h2><ul class="rz-cartao rz-linhas">${convites.map(x => linhaDoConvite(x, modulos)).join("")}</ul></section>` : ""}
      ${pessoas.some(x => !x.ativa) ? `<section class="rz-secao"><h2 class="rz-titulo-3">Sem acesso</h2><ul class="rz-cartao rz-linhas">${pessoas.filter(x => !x.ativa).map(x => linhaDaPessoa(x, modulos)).join("")}</ul></section>` : ""}
      ${pessoas.length === 1 && !convites.length ? vazio({ icone: "equipe", titulo: "Só você por aqui", texto: "Convide quem trabalha com você: cada pessoa entra com o próprio login e vê só o que você deixar.", acao: { rotulo: "Convidar alguém", dado: "convidar" } }) : ""}`;
  };
  const atualizar = () => comEstados(lista, { carregar, desenhar });

  // ---------- convidar ----------
  async function enviarConvite(id) {
    try {
      await banco.funcao("convidar", { convite: id, destino: location.origin + "/convite" });
      return null;
    } catch (e) {
      return e.message;
    }
  }

  const abrirConvidar = () => {
    const g = abrirGaveta({
      titulo: "Convidar alguém",
      subtitulo: "A pessoa recebe um e-mail para criar a senha e entrar.",
      corpo: `<form class="rz-pilha" id="form-convite" novalidate>
          <div role="alert" hidden></div>
          ${campoTexto({ id: "convite-email", nome: "email", rotulo: "E-mail", tipo: "email", teclado: "email", autocompletar: "off", placeholder: "nome@email.com", extra: { autocapitalize: "none", spellcheck: "false" } })}
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "convite-nome", nome: "nome", rotulo: "Nome", opcional: true, placeholder: "Ex.: Rafael" })}
            ${campoTexto({ id: "convite-papel", nome: "papel", rotulo: "Papel", opcional: true, placeholder: "Ex.: Comercial" })}
          </div>
          ${gradeDeAcessos(modulos)}
          ${interruptor({ nome: "dono", rotulo: "Também é dono", ajuda: "Vê e faz tudo, inclusive Equipe e Configurações." })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-convite">Mandar o convite</button>`,
    });
    const form = g.corpo.querySelector("form");
    const grade = form.querySelector("[data-grade]");
    form.dono.addEventListener("change", () => { grade.disabled = form.dono.checked; });
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      const problema = validarEmail(dados.email);
      erroNoCampo(form.email, problema);
      if (problema) return form.email.focus();
      if (pessoas.some(p => p.ativa && p.email && p.email.toLowerCase() === dados.email.toLowerCase())) {
        erroNoCampo(form.email, "Essa pessoa já está na equipe.");
        return form.email.focus();
      }
      const botao = g.pe.querySelector("[type=submit]");
      ocupado(botao, true, "Mandando…");
      try {
        const cor = CORES[(pessoas.length + convites.length) % CORES.length];
        const novo = await banco.resultado(banco.tabela("convites").insert({
          conta_id: conta.conta_id, email: dados.email, nome: dados.nome || null, papel: dados.papel || null, cor,
          dono: !!dados.dono, acessos: dados.dono ? {} : acessosDoFormulario(dados, modulos),
        }).select("id").single());
        const falha = await enviarConvite(novo.id);
        g.fechar();
        avisar(falha ? `O convite ficou salvo, mas o e-mail não saiu (${falha}). Tente "Reenviar" daqui a pouco.` : `Convite mandado para ${dados.email}.`, { tipo: falha ? "erro" : "sucesso" });
        atualizar();
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), /duplicate|convites_um_pendente/i.test(e.message) ? "Já tem um convite esperando para esse e-mail. Use “Reenviar”." : e.message);
      }
    });
  };

  // ---------- editar uma pessoa ----------
  const abrirPessoa = p => {
    const eu = sessao.pessoa() && sessao.pessoa().id === p.id;
    const g = abrirGaveta({
      titulo: p.nome,
      subtitulo: escapar([p.email, p.ativa ? `entrou ${vistoEm(p.visto_em)}` : "sem acesso"].filter(Boolean).join(" · ")),
      corpo: `<form class="rz-pilha" id="form-pessoa" novalidate>
          <div role="alert" hidden></div>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "pessoa-nome", nome: "nome", rotulo: "Nome", valor: p.nome })}
            ${campoTexto({ id: "pessoa-papel", nome: "papel", rotulo: "Papel", valor: p.papel || "", opcional: true, placeholder: "Ex.: Financeiro" })}
          </div>
          ${escolherCor({ valor: p.cor })}
          ${gradeDeAcessos(modulos, p.acessos, p.dono)}
          ${interruptor({ nome: "dono", rotulo: "Dono", ajuda: "Vê e faz tudo, inclusive Equipe e Configurações.", marcado: p.dono })}
        </form>`,
      rodape: `${p.ativa
        ? `<button class="rz-botao rz-botao--fantasma" type="button" data-tirar>${eu ? "Sair da equipe" : "Tirar o acesso"}</button>`
        : `<button class="rz-botao" type="button" data-devolver>Devolver o acesso</button>`}
        <button class="rz-botao rz-botao--primario" type="submit" form="form-pessoa">Salvar</button>`,
    });
    const form = g.corpo.querySelector("form");
    const grade = form.querySelector("[data-grade]");
    form.dono.addEventListener("change", () => { grade.disabled = form.dono.checked; });
    const salvar = async mudanca => {
      const botao = g.pe.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        await banco.resultado(banco.tabela("pessoas").update(mudanca).eq("id", p.id));
        g.fechar();
        return true;
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
        return false;
      }
    };
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      if (!dados.nome) { erroNoCampo(form.nome, "Digite o nome."); return form.nome.focus(); }
      const antes = { acessos: p.acessos, dono: p.dono };
      const ok = await salvar({ nome: dados.nome, papel: dados.papel || null, cor: dados.cor, dono: !!dados.dono, acessos: dados.dono ? p.acessos : acessosDoFormulario(dados, modulos) });
      if (!ok) return;
      avisar(`Acessos de ${dados.nome} salvos.`, {
        desfazer: async () => {
          try { await banco.resultado(banco.tabela("pessoas").update(antes).eq("id", p.id)); atualizar(); } catch (e) { avisar(e.message, { tipo: "erro" }); }
        },
      });
      atualizar();
    });
    g.pe.querySelector("[data-tirar]")?.addEventListener("click", async () => {
      const sim = await confirmar({ titulo: eu ? "Sair da equipe?" : `Tirar o acesso de ${p.nome}?`, texto: eu ? "Você deixa de ver esta conta." : `${escapar(p.nome)} não entra mais nesta conta. O que a pessoa fez continua no histórico, e dá para devolver o acesso depois.`, sim: "Tirar o acesso", perigo: true });
      if (!sim) return;
      if (await salvar({ ativa: false })) { avisar(`${p.nome} ficou sem acesso.`); eu ? navegar("/contas?trocar=1") : atualizar(); }
    });
    g.pe.querySelector("[data-devolver]")?.addEventListener("click", async () => {
      if (await salvar({ ativa: true })) { avisar(`${p.nome} voltou para a equipe.`); atualizar(); }
    });
  };

  // ---------- cliques ----------
  el.addEventListener("click", async e => {
    if (e.target.closest("[data-convidar], [data-acao=convidar]")) return abrirConvidar();
    const pessoa = e.target.closest("[data-pessoa]");
    if (pessoa) return abrirPessoa(pessoas.find(p => p.id === pessoa.dataset.pessoa));
    const reenviar = e.target.closest("[data-reenviar]");
    if (reenviar) {
      ocupado(reenviar, true, "Mandando…");
      try {
        await banco.resultado(banco.tabela("convites").update({ expira_em: new Date(Date.now() + 7 * 864e5).toISOString() }).eq("id", reenviar.dataset.reenviar));
      } catch (erro) { /* o prazo fica como estava */ }
      const falha = await enviarConvite(reenviar.dataset.reenviar);
      ocupado(reenviar, false);
      avisar(falha ? `O e-mail não saiu: ${falha}` : "Convite mandado de novo.", { tipo: falha ? "erro" : "sucesso" });
      return atualizar();
    }
    const cancelar = e.target.closest("[data-cancelar]");
    if (cancelar) {
      const id = cancelar.dataset.cancelar;
      try {
        await banco.resultado(banco.tabela("convites").update({ cancelado_em: new Date().toISOString() }).eq("id", id));
        avisar("Convite cancelado.", { desfazer: async () => { await banco.resultado(banco.tabela("convites").update({ cancelado_em: null }).eq("id", id)); atualizar(); } });
        atualizar();
      } catch (erro) { avisar(erro.message, { tipo: "erro" }); }
    }
  });
  // os cliques já estão ligados: agora carrega (um toque rápido não se perde)
  await atualizar();
}
