// Equipe e acessos (só o dono; 02, 05): quem entra na conta e o que cada pessoa vê em cada módulo ("só vê" ou
// "edita"), convidar, mudar os acessos, tirar e devolver o acesso. O exemplo (exemplos/painel-eventos.html, Equipe)
// é a referência. Quem garante é o banco (pessoas, convites e a função pode); a tela só facilita.
// O convite vai por link no WhatsApp (o padrão; Missão 7, D42: a pessoa ganha um usuário e só cria a senha, em
// src/telas/boas-vindas.js) ou por e-mail (a função do servidor "convidar", supabase/functions/convidar). A peça do
// link e da mensagem pronta é a mesma do Admin: src/ui/convite-link.js.

import { nicho as nichoDe } from "../../nichos/index.js";
import { icone } from "../../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { iniciais, haQuanto, dataCurta } from "../../ui/formatos.js";
import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { campoTexto, segmentos, interruptor, escolherCor, lerFormulario, CORES } from "../../ui/campos.js";
import { validarEmail, usuarioDoEmail } from "../../sessao.js";
import { novoCodigoDeLink, usuarioDaPessoa, usuarioValido, emailDoUsuario, linkDoConvite, abrirMandarConvite } from "../../ui/convite-link.js";

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

/** Como a pessoa entra, para a lista: "usuário rafael.villa" (quem veio pelo link) ou o e-mail. */
export const comoEntra = email => (usuarioDoEmail(email) ? `usuário ${usuarioDoEmail(email)}` : email || "");

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
        <small>${escapar([p.papel, comoEntra(p.email)].filter(Boolean).join(" · "))}</small>
        <span class="rz-acessos-chips">${resumoDosAcessos(p, modulos).map(t => `<span class="rz-etiqueta">${escapar(t)}</span>`).join("")}</span></span>
      <span class="rz-linha-fim rz-texto-3">${escapar(p.ativa ? vistoEm(p.visto_em) : "")}</span>
    </button></li>`;
}

function linhaDoConvite(c, modulos) {
  const porLink = !!c.usuario;
  return `<li><div class="rz-linha">
      <span class="rz-avatar rz-avatar--cliente" aria-hidden="true">${icone(porLink ? "whatsapp" : "carta", { tamanho: 16 })}</span>
      <span class="rz-linha-texto"><b>${escapar(c.nome || c.usuario || c.email)}</b><small>${escapar(porLink ? `usuário ${c.usuario}` : c.email)} · ${porLink ? "link" : "convite"} vale até ${escapar(dataCurta(c.expira_em))}</small>
        <span class="rz-acessos-chips">${resumoDosAcessos(c, modulos).map(t => `<span class="rz-etiqueta">${escapar(t)}</span>`).join("")}</span></span>
      <span class="rz-linha-fim">
        ${porLink
          ? `<button class="rz-botao rz-botao--pequeno" type="button" data-mandar-link="${escapar(c.id)}">${icone("whatsapp", { tamanho: 16 })}Mandar o link</button>
             <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-link-novo="${escapar(c.id)}">Link novo</button>`
          : `<button class="rz-botao rz-botao--pequeno" type="button" data-reenviar="${escapar(c.id)}">Reenviar</button>`}
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
      banco.resultado(banco.tabela("convites").select("id, email, nome, papel, cor, dono, acessos, expira_em, usuario, link_codigo, link_usado_em").eq("conta_id", conta.conta_id).is("aceito_em", null).is("cancelado_em", null).order("criado_em")),
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

  /** A mensagem pronta do link (com o WhatsApp da pessoa, se o dono pôs). */
  const mandarLink = (x, { numero = "", novaSenha = false } = {}) =>
    abrirMandarConvite({ numero, nome: x.nome, negocio: conta.nome, usuario: x.usuario, link: linkDoConvite(x.link_codigo), novaSenha });
  const prazoDoLink = () => new Date(Date.now() + 7 * 864e5).toISOString();
  const erroDoUsuario = msg => (/convites_usuario_pendente|já é de outra pessoa|duplicate/i.test(msg) ? "Esse usuário já existe. Escolha outro." : msg);

  const abrirConvidar = () => {
    const g = abrirGaveta({
      titulo: "Convidar alguém",
      subtitulo: "Cada pessoa entra com o próprio login e vê só o que você deixar.",
      corpo: `<form class="rz-pilha" id="form-convite" novalidate>
          <div role="alert" hidden></div>
          <fieldset class="rz-campo"><legend class="rz-rotulo">Como a pessoa entra</legend>
            ${segmentos({ nome: "jeito", rotulo: "Como a pessoa entra", valor: "link", opcoes: [{ valor: "link", rotulo: "Link no WhatsApp" }, { valor: "email", rotulo: "Convite por e-mail" }] })}</fieldset>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "convite-nome", nome: "nome", rotulo: "Nome", placeholder: "Ex.: Rafael" })}
            ${campoTexto({ id: "convite-papel", nome: "papel", rotulo: "Papel", opcional: true, placeholder: "Ex.: Comercial" })}
          </div>
          <div class="rz-pilha" data-jeito="link">
            ${campoTexto({ id: "convite-usuario", nome: "usuario", rotulo: "Usuário", ajuda: "Com ele e a senha que a pessoa criar, ela entra. Sai do nome; dá para mudar.", extra: { maxlength: 30, autocapitalize: "none", spellcheck: "false", autocomplete: "off" } })}
            ${campoTexto({ id: "convite-whatsapp", nome: "whatsapp", rotulo: "WhatsApp da pessoa", tipo: "tel", teclado: "tel", opcional: true, placeholder: "(11) 98888-7777", ajuda: "Para abrir a conversa com ela já com a mensagem." })}
          </div>
          <div data-jeito="email" hidden>
            ${campoTexto({ id: "convite-email", nome: "email", rotulo: "E-mail", tipo: "email", teclado: "email", autocompletar: "off", placeholder: "nome@email.com", extra: { autocapitalize: "none", spellcheck: "false" } })}
          </div>
          ${gradeDeAcessos(modulos)}
          ${interruptor({ nome: "dono", rotulo: "Também é dono", ajuda: "Vê e faz tudo, inclusive Equipe e Configurações." })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-convite">Criar o convite</button>`,
    });
    const form = g.corpo.querySelector("form");
    const grade = form.querySelector("[data-grade]");
    const jeito = () => form.querySelector("[name=jeito]:checked").value;
    let usuarioMexido = false;
    form.dono.addEventListener("change", () => { grade.disabled = form.dono.checked; });
    form.addEventListener("change", e => {
      if (e.target.name !== "jeito") return;
      form.querySelectorAll("[data-jeito]").forEach(x => { x.hidden = x.dataset.jeito !== jeito(); });
      g.pe.querySelector("[type=submit]").textContent = jeito() === "link" ? "Criar o convite" : "Mandar o convite";
    });
    form.nome.addEventListener("input", () => { if (!usuarioMexido) form.usuario.value = usuarioDaPessoa(form.nome.value, conta.nome); });
    form.usuario.addEventListener("input", () => { usuarioMexido = true; erroNoCampo(form.usuario, ""); });
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      const porLink = jeito() === "link";
      const usuario = String(dados.usuario || "").trim().toLowerCase();
      if (porLink) {
        if (!dados.nome) { erroNoCampo(form.nome, "Digite o nome."); return form.nome.focus(); }
        const problema = usuarioValido(usuario) ? "" : "Use de 3 a 30 letras minúsculas, números, ponto, hífen ou _ (sem espaço nem acento).";
        erroNoCampo(form.usuario, problema);
        if (problema) return form.usuario.focus();
      } else {
        const problema = validarEmail(dados.email);
        erroNoCampo(form.email, problema);
        if (problema) return form.email.focus();
        if (pessoas.some(p => p.ativa && p.email && p.email.toLowerCase() === dados.email.toLowerCase())) {
          erroNoCampo(form.email, "Essa pessoa já está na equipe.");
          return form.email.focus();
        }
      }
      const botao = g.pe.querySelector("[type=submit]");
      ocupado(botao, true, porLink ? "Criando…" : "Mandando…");
      try {
        if (porLink && !(await banco.rpc("usuario_disponivel", { p_usuario: usuario }).catch(() => true))) {
          ocupado(botao, false);
          erroNoCampo(form.usuario, "Esse usuário já existe. Escolha outro.");
          return form.usuario.focus();
        }
        const cor = CORES[(pessoas.length + convites.length) % CORES.length];
        const link = porLink ? { usuario, link_codigo: novoCodigoDeLink(), expira_em: prazoDoLink() } : {};
        const novo = await banco.resultado(banco.tabela("convites").insert({
          conta_id: conta.conta_id, email: porLink ? emailDoUsuario(usuario) : dados.email, nome: dados.nome || null, papel: dados.papel || null, cor,
          dono: !!dados.dono, acessos: dados.dono ? {} : acessosDoFormulario(dados, modulos), ...link,
        }).select("id").single());
        g.fechar();
        if (porLink) {
          mandarLink({ nome: dados.nome, ...link }, { numero: dados.whatsapp });
        } else {
          const falha = await enviarConvite(novo.id);
          avisar(falha ? `O convite ficou salvo, mas o e-mail não saiu (${falha}). Tente "Reenviar" daqui a pouco.` : `Convite mandado para ${dados.email}.`, { tipo: falha ? "erro" : "sucesso" });
        }
        atualizar();
      } catch (e) {
        ocupado(botao, false);
        const msg = /duplicate|convites_um_pendente/i.test(e.message) && !porLink ? "Já tem um convite esperando para esse e-mail. Use “Reenviar”." : erroDoUsuario(e.message);
        if (porLink && msg !== e.message) { erroNoCampo(form.usuario, msg); return form.usuario.focus(); }
        avisoDoFormulario(form.querySelector("[role=alert]"), msg);
      }
    });
  };

  /** O link para a senha nova de quem entra com usuário e esqueceu (o mesmo convite, com os mesmos acessos). */
  async function linkParaSenhaNova(p, botao) {
    const usuario = usuarioDoEmail(p.email);
    ocupado(botao, true, "Gerando…");
    try {
      const link = { link_codigo: novoCodigoDeLink(), expira_em: prazoDoLink() };
      const pendente = convites.find(v => v.usuario === usuario);
      if (pendente) await banco.resultado(banco.tabela("convites").update(link).eq("id", pendente.id));
      else await banco.resultado(banco.tabela("convites").insert({ conta_id: conta.conta_id, email: p.email, nome: p.nome, papel: p.papel, cor: p.cor, dono: p.dono, acessos: p.acessos || {}, usuario, ...link }));
      mandarLink({ nome: p.nome, usuario, ...link }, { novaSenha: true });
      atualizar();
    } catch (e) {
      avisar(/já é de outra pessoa/i.test(e.message) ? `${p.nome} também entra em outra conta com esse usuário. Peça o link para a senha nova à Renderiza.` : e.message, { tipo: "erro" });
    }
    ocupado(botao, false);
  }

  // ---------- editar uma pessoa ----------
  const abrirPessoa = p => {
    const eu = sessao.pessoa() && sessao.pessoa().id === p.id;
    const g = abrirGaveta({
      titulo: p.nome,
      subtitulo: escapar([comoEntra(p.email), p.ativa ? `entrou ${vistoEm(p.visto_em)}` : "sem acesso"].filter(Boolean).join(" · ")),
      corpo: `<form class="rz-pilha" id="form-pessoa" novalidate>
          <div role="alert" hidden></div>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "pessoa-nome", nome: "nome", rotulo: "Nome", valor: p.nome })}
            ${campoTexto({ id: "pessoa-papel", nome: "papel", rotulo: "Papel", valor: p.papel || "", opcional: true, placeholder: "Ex.: Financeiro" })}
          </div>
          ${escolherCor({ valor: p.cor })}
          ${gradeDeAcessos(modulos, p.acessos, p.dono)}
          ${interruptor({ nome: "dono", rotulo: "Dono", ajuda: "Vê e faz tudo, inclusive Equipe e Configurações.", marcado: p.dono })}
          ${p.ativa && !eu && usuarioDoEmail(p.email) ? `<div class="rz-campo"><p class="rz-rotulo">Esqueceu a senha?</p>
            <button class="rz-botao" type="button" data-senha-nova>${icone("cadeado", { tamanho: 18 })}Link para a senha nova</button>
            <p class="rz-ajuda">Vai pelo WhatsApp; ${escapar(String(p.nome).split(/\s+/)[0])} cria uma senha nova e continua com o usuário ${escapar(usuarioDoEmail(p.email))}.</p></div>` : ""}
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
    form.querySelector("[data-senha-nova]")?.addEventListener("click", e => linkParaSenhaNova(p, e.currentTarget));
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
    const mandar = e.target.closest("[data-mandar-link]");
    if (mandar) {
      const x = convites.find(v => v.id === mandar.dataset.mandarLink);
      if (x) mandarLink(x);
      return;
    }
    const novoLink = e.target.closest("[data-link-novo]");
    if (novoLink) {
      const x = convites.find(v => v.id === novoLink.dataset.linkNovo);
      if (!x) return;
      ocupado(novoLink, true, "Gerando…");
      try {
        const link = { link_codigo: novoCodigoDeLink(), expira_em: prazoDoLink() };
        await banco.resultado(banco.tabela("convites").update(link).eq("id", x.id));
        Object.assign(x, link, { link_usado_em: null });
        mandarLink(x);
        atualizar();
      } catch (erro) { ocupado(novoLink, false); avisar(erroDoUsuario(erro.message), { tipo: "erro" }); }
      return;
    }
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
