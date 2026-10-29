// Meu site (Missão 4, bloco C): o cliente edita o site pelo painel (03-modulo-meu-site.md). As seções vêm do mapa do
// site (sites.conteudo_inicial); cada uma abre numa gaveta com os textos, os botões, as fotos e as listas dela. O que
// se salva vai para o rascunho (sites_versoes, estado rascunho); "Ver no meu site" abre o site de verdade com o
// rascunho (sites_previas); "Publicar" põe no ar em até 1 minuto. O histórico deixa voltar a qualquer versão ou à
// versão inicial. Quem tem "editar" no Meu site publica (a regra do banco); "só vê" olha e não muda.
// A validação é a mesma do site (meu-site.js, cópia de ferramentas/meu-site/meu-site.js, conferida por teste).

import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { abrirGaveta } from "../../ui/gaveta.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { campoTexto, campoArea, campoSelecao, interruptor } from "../../ui/campos.js";
import { telefone, dataNumerica } from "../../ui/formatos.js";
import {
  ACOES, nomeDaSecao, rotulo, resumoDaSecao, mesclar, igual, novoItem, imagemParaVer, caminhoDaImagem,
  enderecoDaImagem, linkDaPrevia, whatsappDoContrato,
} from "./conteudo.js";

let validacao = null;
/** A validação do contrato (window.RZ_MEU_SITE), carregada uma vez como script clássico (a CSP não deixa eval). */
function carregarValidacao() {
  if (validacao) return validacao;
  validacao = new Promise((ok, falhou) => {
    if (window.RZ_MEU_SITE) return ok(window.RZ_MEU_SITE);
    const s = document.createElement("script");
    s.src = new URL("./meu-site.js", import.meta.url).href;
    s.onload = () => (window.RZ_MEU_SITE ? ok(window.RZ_MEU_SITE) : falhou(new Error("A validação do Meu site não carregou.")));
    s.onerror = () => { validacao = null; falhou(new Error("A validação do Meu site não carregou. Recarregue a página.")); };
    document.head.append(s);
  });
  return validacao;
}

/** Reduz a foto (no máximo `lado` px) e converte para WebP no próprio aparelho. Devolve um Blob. */
async function paraWebp(arquivo, lado = 1600) {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(imagem.width * escala);
  tela.height = Math.round(imagem.height * escala);
  tela.getContext("2d").drawImage(imagem, 0, 0, tela.width, tela.height);
  const blob = await new Promise(r => tela.toBlob(r, "image/webp", 0.82));
  if (!blob || blob.type !== "image/webp") throw new Error("Este aparelho não conseguiu converter a foto. Tente outra, ou outro navegador.");
  if (blob.size > 2 * 1024 * 1024) throw new Error("A foto ficou grande demais. Tente uma menor.");
  return blob;
}

const etiqueta = (texto, tipo = "") => `<span class="rz-etiqueta${tipo ? ` rz-etiqueta--${tipo}` : ""}">${escapar(texto)}</span>`;
const quando = iso => (iso ? `${dataNumerica(iso)} às ${new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "");
const MINIATURA = "width:132px;height:88px;object-fit:cover;border-radius:10px;background:var(--rz-fundo-2,#eee);display:block";

export async function montar(el, { banco, conta, pode, avisar, ambiente }) {
  const edita = pode("meu-site", "editar");
  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Meu site</h1>
        <p class="rz-texto-2">Mude os textos, os botões e as fotos do site, veja como fica e publique.</p></div>
      <div class="rz-cabeca-acoes" data-acoes></div>
    </header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");
  const acoes = el.querySelector("[data-acoes]");
  let site = null, inicial = {}, rascunho = null, historico = [], nomes = {};

  const carregar = async () => {
    const sites = await banco.resultado(banco.tabela("sites").select("id, codigo, dominios, situacao, conteudo_inicial").eq("conta_id", conta.conta_id));
    site = sites[0] || null;
    if (!site) return null;
    inicial = site.conteudo_inicial || {};
    const versoes = await banco.resultado(banco.tabela("sites_versoes").select("id, numero, estado, conteudo, publicada_em, pessoa_id")
      .eq("site_id", site.id).in("estado", ["rascunho", "publicada"]).order("numero", { ascending: false }).limit(30));
    rascunho = versoes.find(v => v.estado === "rascunho") || null;
    historico = versoes.filter(v => v.estado === "publicada");
    try {
      const pessoas = await banco.resultado(banco.tabela("pessoas").select("id, nome").eq("conta_id", conta.conta_id));
      nomes = Object.fromEntries(pessoas.map(p => [p.id, p.nome]));
    } catch { nomes = {}; }
    return true;
  };

  const publicada = () => historico[0] || null;
  /** O que está no ar e o que o editor mostra (o rascunho, ou o publicado se não há rascunho). */
  const noAr = () => mesclar(inicial, publicada() ? publicada().conteudo : {});
  const atual = () => mesclar(inicial, rascunho ? rascunho.conteudo : publicada() ? publicada().conteudo : {});
  const pendente = () => Boolean(rascunho) && !igual(rascunho.conteudo, publicada() ? publicada().conteudo : {});

  // ---------- a tela ----------
  const desenhar = ok => {
    acoes.innerHTML = "";
    if (!ok) {
      corpo.innerHTML = `<div class="rz-cartao">${vazio({ icone: "site", titulo: "O seu site ainda não está ligado ao painel", texto: "Quando a Renderiza fizer a montagem do site, ele aparece aqui para você mudar os textos, os botões e as fotos." })}</div>`;
      return;
    }
    if (!Object.keys(inicial.secoes || {}).length) {
      corpo.innerHTML = `<div class="rz-cartao">${vazio({ icone: "site", titulo: "O conteúdo do site ainda não foi cadastrado", texto: "A Renderiza cadastra na montagem do site. Depois disso, é só editar aqui." })}</div>`;
      return;
    }
    const a = atual(), ar = noAr(), p = publicada();
    const dominio = (site.dominios || [])[0];
    acoes.innerHTML = `
      ${dominio ? `<a class="rz-botao" href="https://${escapar(dominio)}" target="_blank" rel="noopener">${icone("link", { tamanho: 18 })}Abrir o site</a>` : ""}
      ${edita && dominio ? `<button class="rz-botao" type="button" data-previa>${icone("olho", { tamanho: 18 })}Ver no meu site</button>` : ""}
      ${edita ? `<button class="rz-botao rz-botao--primario" type="button" data-publicar${pendente() ? "" : " disabled"}>Publicar</button>` : ""}`;
    const situacao = site.situacao === "conectado" ? "" : `<p class="rz-alerta rz-alerta--aviso" role="note">${icone("alerta", { tamanho: 18 })}<span>${site.situacao === "versao_final"
      ? "Este site já recebeu a versão final: ele não depende mais do painel e as mudanças daqui não aparecem nele."
      : "O site está desconectado do painel: ele mostra a versão inicial. Para voltar, fale com a Renderiza."}</span></p>`;
    const estado = p ? `No ar: versão ${p.numero}, publicada em ${escapar(quando(p.publicada_em))}${nomes[p.pessoa_id] ? ` por ${escapar(nomes[p.pessoa_id])}` : ""}.`
      : "No ar: o site como foi entregue.";
    const linhaSecao = id => {
      const s = a.secoes[id], mudou = !igual(s, ar.secoes[id]);
      const conteudo = `<span class="rz-linha-texto"><b>${escapar(nomeDaSecao(id, s))}</b><small>${escapar(resumoDaSecao(s) || " ")}</small></span>
        <span class="rz-linha-fim">${s.visivel === false ? etiqueta("Escondida") : ""}${mudou ? etiqueta("Não publicado", "alerta") : ""}</span>`;
      return `<li>${edita ? `<button class="rz-linha" type="button" data-secao="${escapar(id)}">${conteudo}${icone("editar", { tamanho: 18, classe: "rz-texto-3" })}</button>` : `<div class="rz-linha">${conteudo}</div>`}</li>`;
    };
    const c = a.contato || {};
    const contato = `<li>${edita ? `<button class="rz-linha" type="button" data-contato>` : `<div class="rz-linha">`}<span class="rz-linha-texto"><b>Contato e WhatsApp</b>
      <small>${escapar([c.whatsapp ? telefone(c.whatsapp.replace(/^55/, "")) : "", c.instagram ? "@" + c.instagram : ""].filter(Boolean).join(" · ") || "Sem contato")}</small></span>
      <span class="rz-linha-fim">${!igual(a.contato, ar.contato) ? etiqueta("Não publicado", "alerta") : ""}</span>${edita ? `${icone("editar", { tamanho: 18, classe: "rz-texto-3" })}</button>` : "</div>"}</li>`;
    corpo.innerHTML = `
      ${situacao}
      ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê o Meu site. Quem muda e publica é o dono ou quem ele deixar.</span></p>` : ""}
      <p class="rz-texto-2" data-estado style="margin-bottom:var(--rz-6)">${estado}${pendente() ? ` ${etiqueta("Há mudanças no rascunho", "alerta")}` : ""}</p>
      <section class="rz-secao"><h2 class="rz-titulo-3">As partes do site</h2>
        <ul class="rz-cartao rz-linhas">${Object.keys(a.secoes).map(linhaSecao).join("")}${contato}</ul></section>
      <section class="rz-secao"><h2 class="rz-titulo-3">Versões publicadas</h2>
        ${historico.length ? `<ul class="rz-cartao rz-linhas">${historico.map((v, i) => `<li><div class="rz-linha"><span class="rz-linha-texto"><b>Versão ${v.numero}${i === 0 ? " · no ar" : ""}</b>
          <small>${escapar(quando(v.publicada_em))}${nomes[v.pessoa_id] ? " · " + escapar(nomes[v.pessoa_id]) : ""}</small></span>
          ${edita && i > 0 ? `<span class="rz-linha-fim"><button class="rz-botao rz-botao--pequeno" type="button" data-usar="${escapar(v.id)}">Usar esta</button></span>` : ""}</div></li>`).join("")}</ul>`
          : `<p class="rz-texto-3">Nada publicado ainda: o site está como foi entregue.</p>`}
        ${edita ? `<p class="rz-texto-3" style="margin-top:12px"><button class="rz-link" type="button" data-inicial>Voltar ao site como foi entregue</button> (vai para o rascunho; publique para valer).</p>` : ""}
      </section>`;
  };

  const atualizar = () => comEstados(corpo, { carregar, desenhar });

  // ---------- gravar o rascunho ----------
  async function gravarRascunho(conteudo) {
    const v = await carregarValidacao();
    const erros = v.validar(conteudo);
    if (erros.length) throw new Error("Confira: " + erros.slice(0, 3).join("; ") + ".");
    if (rascunho) {
      await banco.resultado(banco.tabela("sites_versoes").update({ conteudo }).eq("id", rascunho.id));
    } else {
      await banco.resultado(banco.tabela("sites_versoes").insert({ conta_id: conta.conta_id, site_id: site.id, conteudo }));
    }
  }

  async function trocarRascunho(conteudo, mensagem) {
    const antes = rascunho ? rascunho.conteudo : null;
    await gravarRascunho(conteudo);
    await atualizar();
    avisar(mensagem, {
      desfazer: async () => {
        await gravarRascunho(antes || (publicada() ? publicada().conteudo : { esquema: 1, secoes: {} }));
        await atualizar();
      },
    });
  }

  // ---------- a gaveta de uma seção ----------
  const campoDeImagem = (nome, img, rot, prefixo) => `
    <div class="rz-campo" data-imagem="${escapar(nome)}">
      <span class="rz-rotulo">${escapar(rot)}</span>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        ${imagemParaVer(img.src, site.dominios) ? `<img src="${escapar(imagemParaVer(img.src, site.dominios))}" alt="" style="${MINIATURA}" data-miniatura>` : `<span style="${MINIATURA}" data-miniatura></span>`}
        <label class="rz-botao rz-botao--pequeno">${icone("imagem", { tamanho: 16 })}Trocar a foto<input type="file" accept="image/png,image/jpeg,image/webp" data-enviar hidden></label>
      </div>
      <input type="hidden" name="${prefixo}:src" value="${escapar(img.src || "")}">
    </div>
    ${campoTexto({ id: `${prefixo}-alt`, nome: `${prefixo}:alt`, rotulo: "Descrição da foto", valor: img.alt || "", opcional: true, ajuda: "Para quem não enxerga e para o Google. Ex.: Salão montado para casamento." })}`;

  const formBotao = (campo, b) => {
    const pre = `b:${campo}`;
    return `<fieldset class="rz-campo rz-pilha" style="border:1px solid var(--rz-linha,#e6e4df);border-radius:14px;padding:14px">
      <legend class="rz-rotulo">${escapar(rotulo("botoes", campo))}</legend>
      ${campoTexto({ id: `${pre}-rotulo`, nome: `${pre}:rotulo`, rotulo: "O que está escrito", valor: b.rotulo || "" })}
      ${b.acao ? `${campoSelecao({ id: `${pre}-acao`, nome: `${pre}:acao`, rotulo: "O que faz", valor: b.acao, opcoes: ACOES })}
      ${campoTexto({ id: `${pre}-destino`, nome: `${pre}:destino`, rotulo: "Para onde", valor: b.destino || "", opcional: true, ajuda: "Link: comece com https://. Parte da página: o nome dela (ex.: estrutura). Telefone: com DDD. Em branco: o contato do site." })}
      ${campoArea({ id: `${pre}-mensagem`, nome: `${pre}:mensagem`, rotulo: "Mensagem pronta do WhatsApp", valor: b.mensagem || "", opcional: true, linhas: 2, ajuda: "Em branco: a mensagem do contato do site." })}` : ""}
      ${interruptor({ nome: `${pre}:visivel`, rotulo: "Aparece no site", marcado: b.visivel !== false })}
    </fieldset>`;
  };

  const itemDeLista = (campo, it, i) => `
    <li data-item${it.de !== undefined ? ` data-de="${it.de}"` : ""} class="rz-pilha-p" style="border:1px solid var(--rz-linha,#e6e4df);border-radius:14px;padding:12px">
      ${Object.entries(it.textos || {}).map(([k, v]) => k === "texto" && campo !== "itens" && campo !== "tipos" && campo !== "numeros"
        ? campoArea({ id: `l-${campo}-${i}-${k}`, nome: `l:${k}`, rotulo: rotulo("item", k), valor: v || "", linhas: 3 })
        : campoTexto({ id: `l-${campo}-${i}-${k}`, nome: `l:${k}`, rotulo: rotulo("item", k), valor: v || "" })).join("")}
      ${Object.entries(it.imagens || {}).map(([k, img]) => campoDeImagem(`${campo}-${i}-${k}`, img, rotulo("item", k), `li:${k}`)).join("")}
      <div class="rz-cabeca-acoes">
        <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-subir aria-label="Subir">↑</button>
        <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-descer aria-label="Descer">↓</button>
        <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-tirar>${icone("lixo", { tamanho: 16 })}Tirar</button>
      </div>
    </li>`;

  function lerSecao(form, id) {
    const s = {};
    const valor = nome => { const c = form.querySelector(`[name="${CSS.escape(nome)}"]`); return c ? c.value : undefined; };
    const marcado = nome => { const c = form.querySelector(`[name="${CSS.escape(nome)}"]`); return c ? c.checked : undefined; };
    if (form.querySelector('[name="visivel"]')) s.visivel = marcado("visivel");
    const a = atual().secoes[id];
    if (a.textos) s.textos = Object.fromEntries(Object.keys(a.textos).map(k => [k, valor(`t:${k}`) ?? a.textos[k]]));
    if (a.imagens) s.imagens = Object.fromEntries(Object.keys(a.imagens).map(k => [k, { src: valor(`i:${k}:src`), alt: valor(`i:${k}:alt`) }]));
    if (a.botoes) {
      s.botoes = Object.fromEntries(Object.keys(a.botoes).map(k => {
        const b = { rotulo: valor(`b:${k}:rotulo`), visivel: marcado(`b:${k}:visivel`) };
        const acao = valor(`b:${k}:acao`);
        if (acao) {
          b.acao = acao;
          const destino = (valor(`b:${k}:destino`) || "").trim(), mensagem = (valor(`b:${k}:mensagem`) || "").trim();
          if (destino) b.destino = destino;
          if (mensagem && acao === "whatsapp") b.mensagem = mensagem;
        }
        return [k, b];
      }));
    }
    if (a.listas) {
      s.listas = Object.fromEntries(Object.keys(a.listas).map(campo => [campo, [...form.querySelectorAll(`[data-lista="${CSS.escape(campo)}"] [data-item]`)].map(li => {
        const it = {};
        if (li.dataset.de !== undefined) it.de = Number(li.dataset.de);
        const textos = [...li.querySelectorAll('[name^="l:"]')];
        if (textos.length) it.textos = Object.fromEntries(textos.map(c => [c.name.slice(2), c.value]));
        const imagens = [...li.querySelectorAll('[name^="li:"][name$=":src"]')];
        if (imagens.length) it.imagens = Object.fromEntries(imagens.map(c => {
          const k = c.name.split(":")[1];
          return [k, { src: c.value, alt: (li.querySelector(`[name="li:${k}:alt"]`) || {}).value || "" }];
        }));
        return it;
      })]));
    }
    return s;
  }

  /** Liga o "Trocar a foto" e devolve o que espera os envios em andamento (salvar antes perderia a foto nova). */
  function ligarImagens(raiz, secao) {
    const enviando = new Set();
    raiz.addEventListener("change", ev => {
      const entrada = ev.target.closest("[data-enviar]");
      if (!entrada || !entrada.files[0]) return;
      const envio = enviarFoto(entrada, secao);
      enviando.add(envio);
      envio.finally(() => enviando.delete(envio));
    });
    return () => Promise.all([...enviando]);
  }

  async function enviarFoto(entrada, secao) {
    const bloco = entrada.closest("[data-imagem]");
    const rotuloBotao = entrada.closest("label");
    rotuloBotao.classList.add("rz-abrindo");
    try {
      const blob = await paraWebp(entrada.files[0]);
      const caminho = caminhoDaImagem(conta.conta_id, secao, bloco.dataset.imagem);
      await banco.enviarArquivo("site-imagens", caminho, blob, "image/webp", { trocar: false });
      const src = enderecoDaImagem(caminho, { ambiente, origem: location.origin });
      bloco.querySelector('input[type="hidden"]').value = src;
      const mini = bloco.querySelector("[data-miniatura]");
      const img = document.createElement("img");
      img.src = URL.createObjectURL(blob); img.alt = ""; img.setAttribute("style", MINIATURA); img.dataset.miniatura = "";
      mini.replaceWith(img);
    } catch (e) {
      avisar(e.message || "A foto não subiu. Tente de novo.", { tipo: "erro" });
    } finally {
      rotuloBotao.classList.remove("rz-abrindo");
      entrada.value = "";
    }
  }

  function abrirSecao(id) {
    const s = atual().secoes[id];
    const formulario = `<form class="rz-pilha" id="form-secao" novalidate><div role="alert" hidden></div>
      ${id !== "inicio" ? interruptor({ nome: "visivel", rotulo: "Esta parte aparece no site", marcado: s.visivel !== false }) : ""}
      ${Object.entries(s.textos || {}).map(([k, v]) => (String(v).length > 90 || k === "texto"
        ? campoArea({ id: `t-${k}`, nome: `t:${k}`, rotulo: rotulo("textos", k), valor: v, linhas: 3 })
        : campoTexto({ id: `t-${k}`, nome: `t:${k}`, rotulo: rotulo("textos", k), valor: v, ajuda: k === "titulo" ? "Para destacar um trecho, ponha entre asteriscos: *no meio do verde.*" : "" }))).join("")}
      ${Object.entries(s.imagens || {}).map(([k, img]) => campoDeImagem(k, img, rotulo("imagens", k), `i:${k}`)).join("")}
      ${Object.entries(s.botoes || {}).map(([k, b]) => formBotao(k, b)).join("")}
      ${Object.entries(s.listas || {}).map(([campo, itens]) => `<fieldset class="rz-campo" data-lista="${escapar(campo)}">
        <legend class="rz-rotulo">${escapar(rotulo("listas", campo))}</legend>
        <ol class="rz-pilha-p" style="list-style:none;padding:0;margin:0" data-itens>${itens.map((it, i) => itemDeLista(campo, it, i)).join("")}</ol>
        ${itens.length ? `<div><button class="rz-botao rz-botao--pequeno" type="button" data-adicionar>${icone("adicionar", { tamanho: 16 })}Adicionar</button></div>` : ""}
      </fieldset>`).join("")}
    </form>`;
    const g = abrirGaveta({
      titulo: nomeDaSecao(id, s),
      subtitulo: "O que mudar aqui vai para o rascunho. Publique para aparecer no site.",
      corpo: formulario,
      rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-secao">Salvar no rascunho</button>`,
    });
    const form = g.corpo.querySelector("form");
    const esperarFotos = ligarImagens(form, id);
    form.addEventListener("click", ev => {
      const item = ev.target.closest("[data-item]");
      if (ev.target.closest("[data-tirar]") && item) {
        if (item.parentElement.children.length > 1) item.remove();
        else avisar("A lista precisa de pelo menos um item. Para esconder, desligue a parte inteira.", { tipo: "erro" });
      } else if (ev.target.closest("[data-subir]") && item && item.previousElementSibling) {
        item.parentElement.insertBefore(item, item.previousElementSibling);
      } else if (ev.target.closest("[data-descer]") && item && item.nextElementSibling) {
        item.parentElement.insertBefore(item.nextElementSibling, item);
      } else if (ev.target.closest("[data-adicionar]")) {
        const lista = ev.target.closest("[data-lista]"), campo = lista.dataset.lista;
        const ol = lista.querySelector("[data-itens]");
        if (ol.children.length >= 60) return avisar("No máximo 60 itens.", { tipo: "erro" });
        const atuais = lerSecao(form, id).listas[campo];
        ol.insertAdjacentHTML("beforeend", itemDeLista(campo, novoItem(atuais), ol.children.length + Date.now() % 1000));
        ol.lastElementChild.querySelector("input, textarea")?.focus();
      }
    });
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const botao = g.pe.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        await esperarFotos();
        const a = atual();
        await trocarRascunho({ ...a, secoes: { ...a.secoes, [id]: lerSecao(form, id) } }, "Salvo no rascunho. Publique para aparecer no site.");
        g.fechar();
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
  }

  function abrirContato() {
    const c = atual().contato || {};
    const g = abrirGaveta({
      titulo: "Contato e WhatsApp",
      subtitulo: "Vale para todos os botões de WhatsApp e Instagram do site.",
      corpo: `<form class="rz-pilha" id="form-contato" novalidate><div role="alert" hidden></div>
        ${campoTexto({ id: "c-zap", nome: "whatsapp", rotulo: "WhatsApp", valor: c.whatsapp ? telefone(c.whatsapp.replace(/^55/, "")) : "", tipo: "tel", teclado: "tel", placeholder: "(11) 98888-7777" })}
        ${campoArea({ id: "c-msg", nome: "mensagem", rotulo: "Mensagem pronta do WhatsApp", valor: c.mensagem || "", opcional: true, linhas: 2 })}
        ${campoTexto({ id: "c-ig", nome: "instagram", rotulo: "Instagram", valor: c.instagram || "", opcional: true, placeholder: "usuario (sem o @)" })}
        ${campoTexto({ id: "c-tel", nome: "telefone", rotulo: "Telefone", valor: c.telefone ? telefone(c.telefone.replace(/^55/, "")) : "", tipo: "tel", teclado: "tel", opcional: true, ajuda: "O número escrito em \"Como chegar\"." })}
      </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-contato">Salvar no rascunho</button>`,
    });
    const form = g.corpo.querySelector("form");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const botao = g.pe.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      const d = Object.fromEntries(new FormData(form));
      const contato = {};
      const zap = whatsappDoContrato(d.whatsapp), tel = whatsappDoContrato(d.telefone);
      if (zap) contato.whatsapp = zap;
      if (d.mensagem.trim()) contato.mensagem = d.mensagem.trim();
      if (d.instagram.trim()) contato.instagram = d.instagram.trim().replace(/^@/, "");
      if (tel) contato.telefone = tel;
      try {
        await trocarRascunho({ ...atual(), contato }, "Salvo no rascunho. Publique para aparecer no site.");
        g.fechar();
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
  }

  // ---------- publicar, prévia e histórico ----------
  async function publicar(botao) {
    if (!rascunho) return;
    ocupado(botao, true, "Publicando…");
    try {
      await banco.resultado(banco.tabela("sites_versoes").update({ estado: "publicada" }).eq("id", rascunho.id));
      await atualizar();
      avisar("Publicado. Aparece no site em até 1 minuto.");
    } catch (e) {
      ocupado(botao, false);
      avisar(e.message, { tipo: "erro" });
    }
  }

  async function verPrevia(botao) {
    const dominio = (site.dominios || [])[0];
    if (!rascunho || !pendente()) {
      window.open(`https://${dominio}`, "_blank", "noopener");
      avisar("Nada novo para ver: o site já mostra o que está publicado.");
      return;
    }
    const janela = window.open("", "_blank"); // abre já, para o navegador não bloquear
    ocupado(botao, true, "Abrindo…");
    try {
      const [p] = await banco.resultado(banco.tabela("sites_previas").insert({ conta_id: conta.conta_id, site_id: site.id, versao_id: rascunho.id }).select("codigo"));
      const link = linkDaPrevia(site.dominios, p.codigo);
      if (janela) { janela.opener = null; janela.location = link; } else window.location.href = link;
    } catch (e) {
      if (janela) janela.close();
      avisar(e.message, { tipo: "erro" });
    } finally {
      ocupado(botao, false);
    }
  }

  el.addEventListener("click", async ev => {
    const alvo = ev.target.closest("button");
    if (!alvo || !el.contains(alvo)) return;
    if (alvo.dataset.secao) return abrirSecao(alvo.dataset.secao);
    if (alvo.hasAttribute("data-contato")) return abrirContato();
    if (alvo.hasAttribute("data-publicar")) return publicar(alvo);
    if (alvo.hasAttribute("data-previa")) return verPrevia(alvo);
    try {
      if (alvo.dataset.usar) {
        const v = historico.find(x => x.id === alvo.dataset.usar);
        if (v) await trocarRascunho(mesclar(inicial, v.conteudo), `A versão ${v.numero} está no rascunho. Confira e publique.`);
      } else if (alvo.hasAttribute("data-inicial")) {
        await trocarRascunho({ esquema: 1, secoes: {} }, "O site como foi entregue está no rascunho. Publique para valer.");
      }
    } catch (e) {
      avisar(e.message, { tipo: "erro" });
    }
  });

  await atualizar();
}
