// A página do contrato (/c/<código>; Missão 3, bloco E): o cliente final lê e aceita no celular, sem login. Três
// passos (09): o resumo do que foi contratado → o texto e "Li e aceito" (nome e contato) → pronto, com os dados do
// Pix e "Imprimir ou salvar em PDF". Fala direto com o banco pela chave pública (publico_contrato e
// publico_aceitar_contrato): quem decide o que sai e grava o aceite é o banco.

import { escapar } from "../../src/ui/formulario.js";
import { icone } from "../../src/ui/icones.js";
import { iniciais } from "../../src/ui/formatos.js";
import { codigoDoCaminho, linhasDoResumo, cabecaDoContrato, validarAceite, textoDoAceite, linkDoComprovante, mensagemDoErro } from "./logica.js";

const raiz = document.getElementById("contrato");
const codigo = codigoDoCaminho(location.pathname);
let config = null;
let contrato = null;

async function rpc(funcao, args) {
  if (!config) config = await fetch("/api/config").then(r => (r.ok ? r.json() : Promise.reject(new Error("config"))));
  const r = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    headers: { apikey: config.supabaseAnonKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`rpc ${r.status}`);
  return r.json();
}

function marca(neg) {
  return `<header class="rz-contrato-marca">
      <span class="rz-contrato-logo" aria-hidden="true">${neg.logo ? `<img src="${escapar(neg.logo)}" alt="">` : escapar(iniciais(neg.nome))}</span>
      <span><b>${escapar(neg.nome)}</b><small>Contrato</small></span>
    </header>`;
}

function fora() {
  document.title = "Contrato";
  raiz.innerHTML = `<div class="rz-contrato-cartao rz-contrato-fora">
      <span class="rz-contrato-icone">${icone("contrato", { tamanho: 28 })}</span>
      <h1 class="rz-titulo-2">Este link não está valendo</h1>
      <p class="rz-texto-2">Pode ter sido trocado ou cancelado. Fale com quem mandou o contrato para receber o link certo.</p>
    </div>`;
}

function semRede(tentar) {
  raiz.innerHTML = `<div class="rz-contrato-cartao rz-contrato-fora">
      <span class="rz-contrato-icone">${icone("alerta", { tamanho: 28 })}</span>
      <h1 class="rz-titulo-2">Não consegui abrir o contrato</h1>
      <p class="rz-texto-2">Confira a internet e tente de novo.</p>
      <button class="rz-botao rz-botao--primario" type="button" data-tentar>Tentar de novo</button>
    </div>`;
  raiz.querySelector("[data-tentar]").addEventListener("click", tentar);
}

/** O texto do contrato, com o registro do aceite embaixo (é o que sai na impressão). */
function textoCompleto(c) {
  return `<article class="rz-contrato-texto" aria-label="Texto do contrato">${escapar(c.texto)}</article>
    ${c.aceito_em ? `<p class="rz-contrato-registro">${escapar(textoDoAceite(c))} Impressão digital do texto (SHA-256): <code>${escapar(c.impressao)}</code></p>` : ""}`;
}

function resumo(c) {
  const cab = cabecaDoContrato(c);
  raiz.innerHTML = `${marca(c.negocio)}
    <section class="rz-contrato-cartao" aria-labelledby="ct-titulo">
      <p class="rz-contrato-passo">1 de 2 · O que você contratou</p>
      <h1 class="rz-titulo-2" id="ct-titulo">${escapar(cab.titulo)}</h1>
      ${cab.sub ? `<p class="rz-texto-2">${escapar(cab.sub)}</p>` : ""}
      <dl class="rz-contrato-resumo">${linhasDoResumo(c).map(([r, v]) => `<div><dt>${escapar(r)}</dt><dd>${escapar(v)}</dd></div>`).join("")}</dl>
      <button class="rz-botao rz-botao--primario rz-botao--bloco" type="button" data-ler>Ler o contrato ${icone("seta", { tamanho: 18 })}</button>
      <p class="rz-contrato-nota">Leia com calma. Ao aceitar, ficam guardados o seu nome, a data, a hora e o aparelho, como prova do aceite.</p>
    </section>`;
  raiz.querySelector("[data-ler]").addEventListener("click", () => { history.pushState({ passo: "ler" }, ""); ler(c); });
}

function ler(c) {
  raiz.innerHTML = `${marca(c.negocio)}
    <section class="rz-contrato-cartao" aria-labelledby="ct-ler">
      <p class="rz-contrato-passo">2 de 2 · Ler e aceitar</p>
      <h1 class="rz-titulo-2" id="ct-ler">O contrato</h1>
      ${textoCompleto(c)}
      <form class="rz-pilha rz-contrato-aceite" novalidate data-aceite>
        <div role="alert" hidden class="rz-alerta rz-alerta--erro"></div>
        <div class="rz-campo"><label class="rz-rotulo" for="ac-nome">Seu nome completo</label>
          <input class="rz-entrada" id="ac-nome" name="nome" autocomplete="name" enterkeyhint="next" maxlength="120"><p class="rz-erro-campo" hidden></p></div>
        <div class="rz-campo"><label class="rz-rotulo" for="ac-contato">Seu WhatsApp ou e-mail</label>
          <input class="rz-entrada" id="ac-contato" name="contato" autocomplete="tel" enterkeyhint="done" maxlength="120"><p class="rz-erro-campo" hidden></p></div>
        <label class="rz-contrato-li"><input type="checkbox" name="li"><span>Li o contrato e aceito os termos.</span></label>
        <p class="rz-erro-campo" data-erro-li hidden></p>
        <button class="rz-botao rz-botao--primario rz-botao--bloco" type="submit">${icone("ok", { tamanho: 18 })}Aceitar o contrato</button>
        <button class="rz-link rz-contrato-voltar" type="button" data-voltar>${icone("voltar", { tamanho: 16 })} Voltar ao resumo</button>
      </form>
    </section>`;
  window.scrollTo(0, 0);
  const form = raiz.querySelector("[data-aceite]");
  const erro = (campo, msg) => {
    const alvo = campo === "li" ? form.querySelector("[data-erro-li]") : form[campo].closest(".rz-campo").querySelector(".rz-erro-campo");
    alvo.textContent = msg || ""; alvo.hidden = !msg;
    if (campo !== "li") form[campo].setAttribute("aria-invalid", msg ? "true" : "false");
  };
  form.querySelector("[data-voltar]").addEventListener("click", () => history.back());
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const dados = { nome: form.nome.value, contato: form.contato.value, li: form.li.checked };
    const erros = validarAceite(dados);
    ["nome", "contato", "li"].forEach(k => erro(k, erros[k]));
    const primeiro = ["nome", "contato", "li"].find(k => erros[k]);
    if (primeiro) return (primeiro === "li" ? form.li : form[primeiro]).focus();
    const botao = form.querySelector("[type=submit]");
    const alerta = form.querySelector("[role=alert]");
    botao.disabled = true; botao.textContent = "Registrando o aceite…"; alerta.hidden = true;
    let r = null;
    try { r = await rpc("publico_aceitar_contrato", { p_codigo: codigo, p_nome: dados.nome, p_contato: dados.contato, p_impressao: c.impressao }); } catch (e) { r = null; }
    if (r && r.ok && r.contrato) { contrato = r.contrato; history.replaceState({ passo: "pronto" }, ""); return pronto(contrato, true); }
    botao.disabled = false; botao.innerHTML = `${icone("ok", { tamanho: 18 })}Aceitar o contrato`;
    if (r && r.erro === "dados") return erro(r.campo === "contato" ? "contato" : "nome", mensagemDoErro(r));
    alerta.innerHTML = `${escapar(mensagemDoErro(r))}${r && r.erro === "mudou" ? ` <button class="rz-link" type="button" data-abrir>Abrir de novo</button>` : ""}`;
    alerta.hidden = false;
    alerta.querySelector("[data-abrir]")?.addEventListener("click", () => location.reload());
  });
}

function pronto(c, agora = false) {
  const comprovante = linkDoComprovante(c);
  raiz.innerHTML = `${marca(c.negocio)}
    <section class="rz-contrato-cartao rz-nao-imprimir" aria-labelledby="ct-pronto">
      <span class="rz-contrato-icone rz-contrato-icone--ok${agora ? " rz-contrato-icone--agora" : ""}">${icone("ok", { tamanho: 28 })}</span>
      <h1 class="rz-titulo-2" id="ct-pronto">${agora ? "Contrato aceito" : "Este contrato já foi aceito"}</h1>
      <p class="rz-texto-2">${escapar(textoDoAceite(c))}</p>
      ${c.pix ? `<div class="rz-contrato-pix">
          <p class="rz-rotulo">${Number(c.resumo && c.resumo.sinal) > 0 ? "O sinal pelo Pix" : "Dados do Pix"}</p>
          ${Number(c.resumo && c.resumo.sinal) > 0 ? `<p class="rz-contrato-valor">${escapar(linhasDoResumo(c).find(l => l[0] === "Sinal")[1])}</p>` : ""}
          <div class="rz-contrato-chave"><span><small>Chave Pix</small><b>${escapar(c.pix.chave)}</b>${c.pix.nome ? `<small>em nome de ${escapar(c.pix.nome)}</small>` : ""}</span>
            <button class="rz-botao rz-botao--pequeno" type="button" data-copiar-pix>${icone("copiar", { tamanho: 16 })}Copiar</button></div>
          ${comprovante ? `<a class="rz-botao rz-botao--bloco" href="${escapar(comprovante)}" target="_blank" rel="noopener">${icone("whatsapp", { tamanho: 18 })}Mandar o comprovante</a>` : ""}
        </div>` : comprovante ? `<a class="rz-botao rz-botao--bloco" href="${escapar(comprovante)}" target="_blank" rel="noopener">${icone("whatsapp", { tamanho: 18 })}Falar com ${escapar(c.negocio.nome)}</a>` : ""}
      <div class="rz-contrato-acoes">
        <button class="rz-botao" type="button" data-imprimir>${icone("baixar", { tamanho: 18 })}Imprimir ou salvar em PDF</button>
        <button class="rz-link" type="button" data-ver-texto aria-expanded="false">Ver o contrato</button>
      </div>
    </section>
    <section class="rz-contrato-cartao rz-contrato-impressao" data-texto hidden aria-label="O contrato aceito">${textoCompleto(c)}</section>`;
  if (agora) window.scrollTo(0, 0);
  const texto = raiz.querySelector("[data-texto]");
  raiz.querySelector("[data-imprimir]").addEventListener("click", () => window.print());
  raiz.querySelector("[data-ver-texto]").addEventListener("click", e => {
    texto.hidden = !texto.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!texto.hidden));
    e.currentTarget.textContent = texto.hidden ? "Ver o contrato" : "Esconder o contrato";
  });
  raiz.querySelector("[data-copiar-pix]")?.addEventListener("click", async e => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(c.pix.chave); b.innerHTML = `${icone("ok", { tamanho: 16 })}Copiada`; }
    catch (erro) { b.textContent = "Selecione e copie"; }
  });
}

function mostrar() {
  document.title = `Contrato · ${contrato.negocio.nome}`;
  if (contrato.situacao === "aceito") return pronto(contrato);
  return history.state && history.state.passo === "ler" ? ler(contrato) : resumo(contrato);
}

async function abrir() {
  if (!codigo) return fora();
  raiz.innerHTML = `<p class="rz-contrato-carregando">Abrindo o contrato…</p>`;
  try {
    contrato = await rpc("publico_contrato", { p_codigo: codigo });
  } catch (e) {
    return semRede(abrir);
  }
  if (!contrato) return fora();
  mostrar();
}

window.addEventListener("popstate", () => { if (contrato) mostrar(); });
abrir();
