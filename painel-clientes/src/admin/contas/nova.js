// Admin · criar uma conta à mão (Missão 5A; 02: "Conta criada pela Renderiza: já nasce ativa, pelo Admin"). O nome,
// o nicho, o código público (sai do nome, dá para mudar), o WhatsApp, os módulos, o prazo e o dono: a conta nasce
// ativa, com os módulos ligados. O dono entra de um de dois jeitos (Missão 7, D42): pelo **link no WhatsApp**, com o
// usuário que sai do nome (o padrão: quase ninguém passa e-mail), ou pelo convite por e-mail (a função "convidar").
// A conta pode nascer da demo do lead (Missão 7, bloco C; D41, D51): escolher a demo preenche o nome, o tipo, o
// código, o WhatsApp e o dono; a demo, o que ela sabia e a conversa colada ficam em contas_contexto (só a Renderiza e
// a IA veem). O catálogo das demos vem de scripts/demos.mjs.
// `ctx`: { banco, avisar, recarregar, catalogo }.

import { abrirGaveta } from "../../ui/gaveta.js";
import { icone } from "../../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { campoTexto, campoSelecao, campoArea, segmentos, lerFormulario } from "../../ui/campos.js";
import { novoCodigoDeLink, usuarioDoNome, usuarioValido, emailDoUsuario, linkDoConvite, abrirMandarConvite } from "../../ui/convite-link.js";
import { dia, normalizarWhatsapp, whatsappValido, telefone } from "../../ui/formatos.js";
import { NICHOS } from "../../nichos/index.js";
import { codigoDoNome, codigoValido, prazoAte, mensalidadeSugerida, moeda } from "../logica.js";

const PADRAO = ["agenda", "clientes"];

export function abrirNovaConta(ctx) {
  const { banco, avisar, catalogo } = ctx;
  let codigoMexido = false, usuarioMexido = false;
  const j = abrirGaveta({
    titulo: "Criar conta",
    subtitulo: "Já nasce ativa. O dono recebe o link no WhatsApp (ou o convite por e-mail) para criar a senha.",
    corpo: `<form class="rz-pilha" novalidate id="form-nova-conta">
        <div role="alert" hidden></div>
        ${campoSelecao({ id: "nc-demo", nome: "demo", rotulo: "Veio de uma demo?", opcional: true, ajuda: "Escolha a demo do lead: a conta já nasce com o que ela sabe.", opcoes: [{ valor: "", rotulo: "Carregando as demos…" }] })}
        ${campoTexto({ id: "nc-nome", nome: "nome", rotulo: "Nome do negócio", placeholder: "Ex.: Villa Alecrim", extra: { maxlength: 120 } })}
        ${campoSelecao({ id: "nc-nicho", nome: "nicho", rotulo: "Tipo de negócio", valor: "eventos", opcoes: Object.values(NICHOS).map(x => ({ valor: x.id, rotulo: x.nome })) })}
        ${campoTexto({ id: "nc-codigo", nome: "codigo", rotulo: "Código público", ajuda: "Vai no endereço do site e da agenda online. Letras minúsculas, números e hífen.", extra: { maxlength: 40, autocapitalize: "off", spellcheck: "false" } })}
        ${campoTexto({ id: "nc-whats", nome: "whatsapp", rotulo: "WhatsApp do negócio", tipo: "tel", teclado: "tel", opcional: true, placeholder: "(11) 98888-7777" })}
        <fieldset class="rz-campo"><legend class="rz-rotulo">Módulos <span class="rz-texto-3" data-preco></span></legend>
          <div class="rz-chips rz-chips--quebra">${catalogo.map(m => `<label class="rz-chip"><input type="checkbox" name="modulos" value="${escapar(m.id)}"${PADRAO.includes(m.id) ? " checked" : ""}>${escapar(m.nome)}</label>`).join("")}</div></fieldset>
        ${campoSelecao({ id: "nc-prazo", nome: "prazo", rotulo: "Prazo", valor: "sem", opcoes: [{ valor: "sem", rotulo: "Sem prazo" }, { valor: "30", rotulo: "30 dias" }, { valor: "90", rotulo: "90 dias" }, { valor: "365", rotulo: "1 ano" }] })}
        ${campoTexto({ id: "nc-dono-nome", nome: "dono_nome", rotulo: "Nome do dono", extra: { maxlength: 120, autocomplete: "off" } })}
        <fieldset class="rz-campo"><legend class="rz-rotulo">Como o dono entra</legend>
          ${segmentos({ nome: "jeito", rotulo: "Como o dono entra", valor: "link", opcoes: [{ valor: "link", rotulo: "Link no WhatsApp" }, { valor: "email", rotulo: "Convite por e-mail" }] })}</fieldset>
        <div data-jeito="link">${campoTexto({ id: "nc-usuario", nome: "usuario", rotulo: "Usuário do dono", ajuda: "Com ele e a senha, o dono entra. Sai do nome; dá para mudar.", extra: { maxlength: 30, autocapitalize: "off", spellcheck: "false" } })}</div>
        <div data-jeito="email" hidden>${campoTexto({ id: "nc-dono-email", nome: "dono_email", rotulo: "E-mail do dono", tipo: "email", teclado: "email", extra: { maxlength: 120, autocomplete: "off" } })}</div>
        ${campoArea({ id: "nc-conversa", nome: "conversa", rotulo: "A conversa com o lead", opcional: true, linhas: 4, placeholder: "Cole aqui o que vocês conversaram no WhatsApp.", ajuda: "Fica só com a Renderiza. Ajuda a IA a montar o painel do jeito do negócio (o que ele contou, o que pediu)." })}
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-nova-conta">${icone("ok")}Criar a conta</button>`,
  });
  const form = j.el.querySelector("form");
  const preco = () => {
    const ligados = [...form.querySelectorAll("[name=modulos]:checked")].map(x => x.value);
    form.querySelector("[data-preco]").textContent = `mensalidade ${moeda(mensalidadeSugerida(ligados, catalogo), { centavos: true })}`;
  };
  preco();
  const jeito = () => (form.querySelector("[name=jeito]:checked") || {}).value || "link";
  form.addEventListener("change", e => {
    if (e.target.name === "modulos") preco();
    if (e.target.name === "jeito") form.querySelectorAll("[data-jeito]").forEach(x => { x.hidden = x.dataset.jeito !== jeito(); });
  });
  form.nome.addEventListener("input", () => {
    if (!codigoMexido) form.codigo.value = codigoDoNome(form.nome.value);
    if (!usuarioMexido) form.usuario.value = usuarioDoNome(form.nome.value);
  });
  form.codigo.addEventListener("input", () => { codigoMexido = true; });
  // as demos (só a Renderiza vê): escolher uma preenche o que ela sabe; dá para mudar tudo depois
  let demos = [];
  banco.resultado(banco.tabela("demos").select("pasta, nicho, nome, dados").order("nome")).then(lista => {
    demos = lista;
    form.demo.innerHTML = `<option value="">Não veio de demo</option>${["eventos", "fotografia"].map(ni => `<optgroup label="${escapar(NICHOS[ni].nome)}">${lista.filter(x => x.nicho === ni).map(x => `<option value="${escapar(x.pasta)}">${escapar(x.nome)}</option>`).join("")}</optgroup>`).join("")}`;
  }).catch(() => { form.demo.innerHTML = `<option value="">Não deu para carregar as demos</option>`; });
  form.demo.addEventListener("change", () => {
    const x = demos.find(v => v.pasta === form.demo.value);
    if (!x) return;
    const dd = x.dados || {};
    form.nome.value = x.nome;
    form.nicho.value = x.nicho;
    if (codigoValido(x.pasta)) { form.codigo.value = x.pasta; codigoMexido = true; } else if (!codigoMexido) form.codigo.value = codigoDoNome(x.nome);
    if (dd.whatsapp) form.whatsapp.value = telefone(dd.whatsapp);
    if (dd.dono && !form.dono_nome.value) form.dono_nome.value = dd.dono;
    if (!usuarioMexido) form.usuario.value = usuarioDoNome(x.nome);
  });
  form.usuario.addEventListener("input", () => { usuarioMexido = true; });

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const d = lerFormulario(form);
    const modulos = [].concat(d.modulos || []).filter(Boolean);
    const porLink = jeito() === "link";
    const usuario = String(d.usuario || "").trim().toLowerCase();
    const email = porLink ? emailDoUsuario(usuario) : String(d.dono_email || "").trim().toLowerCase();
    const erros = {
      nome: String(d.nome || "").trim() ? "" : "Digite o nome do negócio.",
      codigo: codigoValido(d.codigo) ? "" : "Só letras minúsculas, números e hífen (3 a 40).",
      whatsapp: d.whatsapp && !whatsappValido(d.whatsapp) ? "Confira o WhatsApp: DDD e número." : "",
      dono_nome: String(d.dono_nome || "").trim() ? "" : "Digite o nome do dono.",
      dono_email: porLink || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "" : "Confira o e-mail do dono.",
      usuario: !porLink || usuarioValido(usuario) ? "" : "Só letras minúsculas, números, ponto, hífen ou _ (3 a 30).",
    };
    for (const [k, v] of Object.entries(erros)) erroNoCampo(form[k], v);
    const aviso = form.querySelector("[role=alert]");
    if (Object.values(erros).some(Boolean)) return;
    if (!modulos.length) return avisoDoFormulario(aviso, "Escolha pelo menos um módulo.");
    const botao = j.el.querySelector("[type=submit]");
    ocupado(botao, true, "Criando…");
    if (porLink && !(await banco.rpc("usuario_disponivel", { p_usuario: usuario }).catch(() => true))) {
      ocupado(botao, false);
      erroNoCampo(form.usuario, "Esse usuário já existe. Escolha outro (ex.: com a cidade no fim).");
      return form.usuario.focus();
    }
    let conta = null;
    try {
      conta = await banco.resultado(banco.tabela("contas").insert({
        nome: d.nome.trim(), nicho: d.nicho, codigo: d.codigo, whatsapp: normalizarWhatsapp(d.whatsapp) || null,
        situacao: "ativa", origem: "renderiza", ativa_ate: prazoAte(d.prazo, dia(new Date())),
      }).select("id, nome").single());
      await banco.resultado(banco.tabela("contas_modulos").insert(modulos.map(m => ({ conta_id: conta.id, modulo_id: m }))));
      const daDemo = demos.find(v => v.pasta === d.demo);
      const conversa = String(d.conversa || "").trim();
      if (daDemo || conversa) {
        await banco.resultado(banco.tabela("contas_contexto").insert({ conta_id: conta.id, demo: daDemo ? daDemo.pasta : null, dados: daDemo ? daDemo.dados : {}, conversa: conversa || null }));
      }
      if (porLink) {
        const codigo = novoCodigoDeLink();
        await banco.resultado(banco.tabela("convites").insert({ conta_id: conta.id, email, nome: d.dono_nome.trim(), dono: true, usuario, link_codigo: codigo }));
        avisar(`${conta.nome}: criada. Agora mande o acesso para ${d.dono_nome.trim()}.`);
        j.fechar();
        ctx.recarregar();
        abrirMandarConvite({ numero: d.whatsapp, nome: d.dono_nome, negocio: conta.nome, usuario, link: linkDoConvite(codigo) });
        return;
      }
      const convite = await banco.resultado(banco.tabela("convites").insert({ conta_id: conta.id, email, nome: d.dono_nome.trim(), dono: true }).select("id").single());
      try {
        await banco.funcao("convidar", { convite: convite.id, destino: location.origin + "/convite" });
        avisar(`${conta.nome}: criada. O convite foi para ${email}.`);
      } catch (e) {
        avisar(`${conta.nome}: criada, mas o e-mail do convite não saiu (${e.message}). Na conta, "Mandar o convite de novo".`, { tipo: "erro" });
      }
      j.fechar();
      ctx.recarregar();
    } catch (e) {
      ocupado(botao, false);
      const msg = /contas_codigo_key|duplicate key.*codigo/.test(e.message) ? "Esse código já é de outra conta. Mude o código." : e.message;
      avisoDoFormulario(aviso, conta ? `A conta foi criada, mas faltou uma parte: ${msg}. Abra a conta na lista para conferir.` : msg);
      if (conta) ctx.recarregar();
    }
  });
  return j;
}
