// Meu site: o editor ao vivo (03-modulo-meu-site.md). À esquerda, as partes do site (o mapa é o sites.conteudo_inicial)
// e os campos da parte aberta; à direita, o site de verdade num quadro (?rz-editor=1), que mostra o rascunho a cada
// tecla e avisa onde a pessoa clicou (o script do site, ferramentas/meu-site/meu-site.js). O que muda vai sozinho para
// o rascunho (sites_versoes, estado rascunho); "Publicar" põe no ar em até 1 minuto. As versões publicadas deixam
// voltar a qualquer uma ou à versão entregue. Quem tem "editar" no Meu site muda e publica; "só vê" olha.
// A validação é a mesma do site (meu-site.js, cópia de ferramentas/meu-site/meu-site.js, conferida por teste).

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { confirmar } from "../../ui/gaveta.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { campoTexto, campoArea, campoSelecao, interruptor } from "../../ui/campos.js";
import { telefone, dataNumerica } from "../../ui/formatos.js";
import {
  ACOES, nomeDaSecao, ondeFica, rotulo, mesclar, igual, novoItem, nomeDoItem, resumoDoItem, dicaDaFoto, imagemParaVer,
  caminhoDaImagem, enderecoDaImagem, enderecoDoSite, linkDaPrevia, whatsappDoContrato,
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

const CONTATO = "@contato"; // a parte que não é uma seção: o WhatsApp e as redes, que valem para o site todo
const TELAS = { celular: 390, computador: 1280 };
const etiqueta = (texto, tipo = "") => `<span class="rz-etiqueta${tipo ? ` rz-etiqueta--${tipo}` : ""}">${escapar(texto)}</span>`;
const quando = iso => (iso ? `${dataNumerica(iso)} às ${new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "");
const DESTINO = {
  link: ["Endereço do link", "Comece com https://"], telefone: ["Telefone", "Com DDD. Em branco: o telefone do site."],
  instagram: ["Perfil do Instagram", "Sem o @. Em branco: o Instagram do site."], rota: ["Endereço no mapa", "Rua, número e cidade."],
  email: ["E-mail", ""], secao: ["Qual parte", "A parte da página para onde o botão leva."],
};

export async function montar(el, { banco, conta, pode, avisar, ambiente }) {
  const edita = pode("meu-site", "editar");
  el.innerHTML = `<div class="rz-ms">
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Meu site</h1>
        <p class="rz-texto-2">Clique numa parte do site, mude e veja na hora. Só vai ao ar quando você publicar.</p></div>
      <div class="rz-cabeca-acoes" data-acoes></div>
    </header>
    <div data-corpo></div></div>`;
  const raiz = el.querySelector(".rz-ms"), corpo = el.querySelector("[data-corpo]"), acoes = el.querySelector("[data-acoes]");
  let site = null, inicial = {}, rascunho = null, historico = [], nomes = {};
  let trabalho = null, aberta = null, tela = "celular";
  let relogio = null, gravando = 0, fila = Promise.resolve(), problema = "";
  let editor = null, quadro = null, palco = null, origemDoSite = "";
  const ponte = { pronta: false, imagens: {}, ancoras: [] };

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
    trabalho = mesclar(inicial, rascunho ? rascunho.conteudo : publicada() ? publicada().conteudo : {});
    return true;
  };

  const publicada = () => historico[0] || null;
  /** O que está no ar: a versão inicial com a última publicada por cima. */
  const noAr = () => mesclar(inicial, publicada() ? publicada().conteudo : {});
  const pendente = () => Boolean(trabalho) && !igual(trabalho, noAr());
  const dominio = () => (site && site.dominios || [])[0] || "";

  // ---------- o rascunho: grava sozinho, pouco depois da última mudança ----------
  async function gravarRascunho(conteudo) {
    const erros = (await carregarValidacao()).validar(conteudo);
    if (erros.length) {
      const [onde, oQue] = erros[0].split(": "), secao = onde.split(".")[1];
      throw Object.assign(new Error(`${secao && conteudo.secoes[secao] ? nomeDaSecao(secao, conteudo.secoes[secao]) + ": " : ""}${oQue || erros[0]}`), { doConteudo: true });
    }
    if (rascunho) {
      await banco.resultado(banco.tabela("sites_versoes").update({ conteudo }).eq("id", rascunho.id));
      rascunho = { ...rascunho, conteudo };
    } else {
      [rascunho] = await banco.resultado(banco.tabela("sites_versoes").insert({ conta_id: conta.conta_id, site_id: site.id, conteudo }).select("id, numero, estado, conteudo"));
    }
  }

  /** Grava o `trabalho` no rascunho, uma gravação por vez. Devolve a promessa da fila (pronta = tudo gravado). */
  function salvar() {
    clearTimeout(relogio); relogio = null;
    gravando += 1;
    fila = fila.then(async () => {
      try {
        await gravarRascunho(trabalho);
        problema = "";
      } catch (e) {
        problema = e.doConteudo ? e.message : "Não salvou (" + e.message + "). Tento de novo na próxima mudança.";
      } finally {
        gravando -= 1;
        situacao();
      }
    });
    return fila;
  }

  /** Algo mudou no `trabalho`: o site mostra já e o rascunho grava logo depois. */
  function mudou() {
    mostrarNoSite();
    clearTimeout(relogio);
    relogio = setTimeout(salvar, 900);
    situacao();
  }

  /** Troca o rascunho inteiro (uma versão antiga, a versão entregue, descartar) e volta para a lista. */
  async function trocarTudo(conteudo, mensagem) {
    clearTimeout(relogio); relogio = null;
    await fila;
    trabalho = mesclar(inicial, conteudo);
    try {
      await gravarRascunho(trabalho);
      problema = "";
      avisar(mensagem);
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
    aberta = null;
    desenharEditor(); mostrarNoSite(); situacao(); mostrarAba("editar");
  }

  // ---------- o que está no alto: a situação, descartar e publicar ----------
  function situacao() {
    const st = acoes.querySelector("[data-situacao]");
    if (!st) return;
    const p = publicada(), falta = pendente();
    st.textContent = problema ? `Confira: ${problema}` : relogio || gravando ? "Salvando…" : falta ? "Rascunho salvo. Falta publicar."
      : p ? `No ar: versão ${p.numero}, de ${quando(p.publicada_em)}.` : "No ar: o site como foi entregue.";
    st.dataset.tom = problema ? "erro" : falta ? "alerta" : "";
    const pub = acoes.querySelector("[data-publicar]"), desc = acoes.querySelector("[data-descartar]");
    if (pub) pub.disabled = !falta || Boolean(problema);
    if (desc) desc.hidden = !falta;
    if (editor && aberta === null) marcarAlteradas();
  }

  async function publicar(botao) {
    botao.disabled = true;
    await salvar();
    if (problema || !rascunho) return situacao();
    try {
      await banco.resultado(banco.tabela("sites_versoes").update({ estado: "publicada" }).eq("id", rascunho.id));
      await carregar();
      desenharVersoes();
      avisar("Publicado. Aparece no site em até 1 minuto.");
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
    situacao();
  }

  async function verEmOutraAba() {
    const janela = window.open("", "_blank"); // abre já, para o navegador não bloquear
    try {
      await salvar();
      if (!rascunho || !pendente()) { if (janela) janela.location = enderecoDoSite(dominio()); return; }
      const [p] = await banco.resultado(banco.tabela("sites_previas").insert({ conta_id: conta.conta_id, site_id: site.id, versao_id: rascunho.id }).select("codigo"));
      if (janela) { janela.opener = null; janela.location = linkDaPrevia(site.dominios, p.codigo); }
    } catch (e) {
      if (janela) janela.close();
      avisar(e.message, { tipo: "erro" });
    }
  }

  // ---------- a conversa com o site (o quadro) ----------
  const dizer = m => { if (ponte.pronta && quadro && quadro.contentWindow) quadro.contentWindow.postMessage({ rz: "meu-site", ...m }, origemDoSite); };
  const mostrarNoSite = () => dizer({ tipo: "conteudo", conteudo: trabalho });
  let ultimoAlvo = null;
  const destacar = alvo => { ultimoAlvo = alvo; dizer({ tipo: "foco", ...alvo }); };

  function aoReceber(ev) {
    const d = ev.data;
    if (!quadro || ev.source !== quadro.contentWindow || ev.origin !== origemDoSite || !d || d.rz !== "meu-site") return;
    if (d.tipo === "pronto" || d.tipo === "medidas") {
      ponte.pronta = true;
      ponte.imagens = d.imagens || {};
      ponte.ancoras = Array.isArray(d.ancoras) ? d.ancoras : [];
      corpo.querySelector("[data-sem-ponte]").hidden = true;
      if (d.tipo === "pronto") mostrarNoSite();
      corpo.querySelectorAll("[data-dica-foto]").forEach(p => { p.textContent = dicaDaFoto(ponte.imagens[p.dataset.dicaFoto]); });
    } else if (d.tipo === "clique" && edita && typeof d.secao === "string" && trabalho.secoes[d.secao]) {
      raiz.classList.remove("rz-ms--vendo");
      abrirParte(d.secao, d);
    }
  }

  /** O quadro no tamanho de um celular ou de um computador, encolhido para caber no palco. */
  function ajustar() {
    // no computador, as duas colunas têm a altura que sobra na janela: a da esquerda rola sozinha e o alto não some
    const grade = corpo.querySelector(".rz-ms-grade");
    if (grade) grade.style.setProperty("--rz-ms-altura", Math.max(420, window.innerHeight - (grade.getBoundingClientRect().top + window.scrollY) - 24) + "px");
    if (!palco || !palco.clientWidth) return;
    const largura = TELAS[tela], escala = Math.min(1, palco.clientWidth / largura);
    quadro.style.width = largura + "px";
    quadro.style.height = Math.round(palco.clientHeight / escala) + "px";
    quadro.style.transform = `scale(${escala})`;
    quadro.style.left = Math.max(0, Math.round((palco.clientWidth - largura * escala) / 2)) + "px";
  }
  const olharPalco = new ResizeObserver(ajustar);

  // ---------- os campos ----------
  const chaveDaFoto = (secao, campo, lista) => (lista ? `${secao}.${lista}.${campo}` : `${secao}.${campo}`);
  const miniatura = src => (imagemParaVer(src, site.dominios) ? `<img class="rz-ms-mini" src="${escapar(imagemParaVer(src, site.dominios))}" alt="" data-miniatura>` : `<span class="rz-ms-mini" data-miniatura></span>`);

  const campoDeFoto = (prefixo, img, rot, chave, original) => `
    <div class="rz-campo rz-ms-foto" data-imagem="${escapar(prefixo)}">
      <span class="rz-rotulo">${escapar(rot)}</span>
      <div class="rz-ms-foto-linha">${miniatura(img.src)}
        <div class="rz-pilha-p">
          <label class="rz-botao rz-botao--pequeno">${icone("imagem", { tamanho: 16 })}Trocar a foto<input type="file" accept="image/png,image/jpeg,image/webp" data-enviar hidden></label>
          ${original !== undefined ? `<button class="rz-link" type="button" data-original="${escapar(original)}"${img.src === original ? " hidden" : ""}>Voltar à foto original</button>` : ""}
        </div></div>
      <p class="rz-ajuda" data-dica-foto="${escapar(chave)}">${escapar(dicaDaFoto(ponte.imagens[chave]))}</p>
      <input type="hidden" name="${prefixo}:src" value="${escapar(img.src || "")}">
      ${campoTexto({ id: `${prefixo}-alt`, nome: `${prefixo}:alt`, rotulo: "O que aparece na foto", valor: img.alt || "", opcional: true, ajuda: "Para quem não enxerga e para o Google. Ex.: Bebê dormindo num cesto.", extra: { maxlength: 200 } })}
    </div>`;

  function campoDoDestino(pre, b) {
    const [rot, ajuda] = DESTINO[b.acao] || ["Para onde", ""];
    if (b.acao === "secao" && ponte.ancoras.length) {
      const opcoes = ponte.ancoras.map(a => ({ valor: a.id, rotulo: nomeDaSecao(a.secao, trabalho.secoes[a.secao]) }));
      if (b.destino && !opcoes.some(o => o.valor === b.destino)) opcoes.push({ valor: b.destino, rotulo: b.destino });
      return campoSelecao({ id: `${pre}-destino`, nome: `${pre}:destino`, rotulo: rot, valor: b.destino || "", opcoes, ajuda });
    }
    return campoTexto({ id: `${pre}-destino`, nome: `${pre}:destino`, rotulo: rot, valor: b.destino || "", opcional: b.acao !== "link" && b.acao !== "secao", ajuda, extra: { maxlength: 300 } });
  }

  const formBotao = (campo, b) => {
    const pre = `b:${campo}`;
    return `<fieldset class="rz-ms-caixa rz-pilha" data-botao="${escapar(campo)}">
      <legend class="rz-rotulo">${escapar(rotulo("botoes", campo))}</legend>
      ${campoTexto({ id: `${pre}-rotulo`, nome: `${pre}:rotulo`, rotulo: "O que está escrito", valor: b.rotulo || "", extra: { maxlength: 60 } })}
      ${b.acao ? `${campoSelecao({ id: `${pre}-acao`, nome: `${pre}:acao`, rotulo: "O que acontece ao clicar", valor: b.acao, opcoes: ACOES })}
      <div data-destino${b.acao === "whatsapp" ? " hidden" : ""}>${campoDoDestino(pre, b)}</div>
      <div data-mensagem${b.acao === "whatsapp" ? "" : " hidden"}>${campoArea({ id: `${pre}-mensagem`, nome: `${pre}:mensagem`, rotulo: "Mensagem que já vai escrita", valor: b.mensagem || "", opcional: true, linhas: 2, ajuda: "Em branco: a mensagem de \"WhatsApp e redes\"." })}</div>` : ""}
      ${interruptor({ nome: `${pre}:visivel`, rotulo: "Este botão aparece no site", marcado: b.visivel !== false })}
    </fieldset>`;
  };

  const itemDeLista = (secao, campo, it, i, nome, aberto = false) => {
    const foto = Object.values(it.imagens || {})[0];
    return `<li data-item${it.de !== undefined ? ` data-de="${it.de}"` : ""}><details class="rz-ms-item"${aberto ? " open" : ""}>
      <summary>${foto ? miniatura(foto.src) : ""}<span class="rz-ms-item-nome" data-resumo>${escapar(resumoDoItem(it, i, nome))}</span>
        <span class="rz-ms-item-acoes">
          <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-subir aria-label="Subir">↑</button>
          <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-descer aria-label="Descer">↓</button>
          <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-tirar aria-label="Tirar">${icone("lixo", { tamanho: 16 })}</button>
        </span></summary>
      <div class="rz-pilha-p">
        ${Object.entries(it.textos || {}).map(([k, v]) => (k === "texto" && campo !== "itens" && campo !== "tipos" && campo !== "numeros"
          ? campoArea({ id: `l-${campo}-${i}-${k}`, nome: `l:${k}`, rotulo: rotulo("item", k), valor: v || "", linhas: 3 })
          : campoTexto({ id: `l-${campo}-${i}-${k}`, nome: `l:${k}`, rotulo: rotulo("item", k), valor: v || "", extra: { maxlength: 600 } }))).join("")}
        ${Object.entries(it.imagens || {}).map(([k, img]) => campoDeFoto(`li:${k}`, img, rotulo("item", k), chaveDaFoto(secao, k, campo))).join("")}
      </div></details></li>`;
  };

  function formDaSecao(id) {
    const s = trabalho.secoes[id], ini = (inicial.secoes || {})[id] || {};
    const grupo = (titulo, html) => (html ? `<fieldset class="rz-ms-grupo rz-pilha"><legend class="rz-titulo-3">${titulo}</legend>${html}</fieldset>` : "");
    return `<form class="rz-pilha" id="form-secao" novalidate>
      ${id !== "inicio" ? interruptor({ nome: "visivel", rotulo: "Esta parte aparece no site", marcado: s.visivel !== false }) : ""}
      ${grupo("Textos", Object.entries(s.textos || {}).map(([k, v]) => (String(v).length > 90 || k === "texto"
        ? campoArea({ id: `t-${k}`, nome: `t:${k}`, rotulo: rotulo("textos", k), valor: v, linhas: 3 })
        : campoTexto({ id: `t-${k}`, nome: `t:${k}`, rotulo: rotulo("textos", k), valor: v, extra: { maxlength: 600 }, ajuda: k === "titulo" ? "Para destacar um trecho, ponha entre asteriscos: *assim*." : "" }))).join(""))}
      ${grupo("Fotos", Object.entries(s.imagens || {}).map(([k, img]) => campoDeFoto(`i:${k}`, img, rotulo("imagens", k), chaveDaFoto(id, k), ((ini.imagens || {})[k] || {}).src || "")).join(""))}
      ${grupo("Botões", Object.entries(s.botoes || {}).map(([k, b]) => formBotao(k, b)).join(""))}
      ${Object.entries(s.listas || {}).map(([campo, itens]) => {
        const nome = nomeDoItem(campo, itens);
        return `<fieldset class="rz-ms-grupo rz-pilha" data-lista="${escapar(campo)}" data-nome="${escapar(nome)}">
          <legend class="rz-titulo-3">${escapar(rotulo("listas", campo))}</legend>
          <p class="rz-ajuda">Toque num item para abrir e mudar. As setas mudam a ordem; a lixeira tira do site.</p>
          <ol class="rz-ms-itens" data-itens>${itens.map((it, i) => itemDeLista(id, campo, it, i, nome)).join("")}</ol>
          ${itens.length ? `<div><button class="rz-botao rz-botao--pequeno" type="button" data-adicionar>${icone("adicionar", { tamanho: 16 })}Adicionar ${escapar(nome)}</button></div>` : ""}
        </fieldset>`;
      }).join("")}
    </form>`;
  }

  function formDoContato() {
    const c = trabalho.contato || {};
    return `<form class="rz-pilha" id="form-contato" novalidate>
      ${campoTexto({ id: "c-zap", nome: "whatsapp", rotulo: "WhatsApp", valor: c.whatsapp ? telefone(c.whatsapp.replace(/^55/, "")) : "", tipo: "tel", teclado: "tel", placeholder: "(11) 98888-7777" })}
      ${campoArea({ id: "c-msg", nome: "mensagem", rotulo: "Mensagem que já vai escrita no WhatsApp", valor: c.mensagem || "", opcional: true, linhas: 2 })}
      ${campoTexto({ id: "c-ig", nome: "instagram", rotulo: "Instagram", valor: c.instagram || "", opcional: true, placeholder: "usuario (sem o @)" })}
      ${campoTexto({ id: "c-tel", nome: "telefone", rotulo: "Telefone", valor: c.telefone ? telefone(c.telefone.replace(/^55/, "")) : "", tipo: "tel", teclado: "tel", opcional: true, ajuda: "O número que aparece escrito no site." })}
    </form>`;
  }

  /** O que está nos campos da parte aberta, no formato do contrato. */
  function lerSecao(form, id) {
    const a = trabalho.secoes[id], s = {};
    const valor = nome => { const c = form.querySelector(`[name="${CSS.escape(nome)}"]`); return c ? c.value : undefined; };
    const marcado = nome => { const c = form.querySelector(`[name="${CSS.escape(nome)}"]`); return c ? c.checked : undefined; };
    if (form.querySelector('[name="visivel"]')) s.visivel = marcado("visivel");
    if (a.textos) s.textos = Object.fromEntries(Object.keys(a.textos).map(k => [k, valor(`t:${k}`) ?? a.textos[k]]));
    if (a.imagens) s.imagens = Object.fromEntries(Object.keys(a.imagens).map(k => [k, { src: valor(`i:${k}:src`), alt: valor(`i:${k}:alt`) }]));
    if (a.botoes) {
      s.botoes = Object.fromEntries(Object.keys(a.botoes).map(k => {
        const b = { rotulo: valor(`b:${k}:rotulo`), visivel: marcado(`b:${k}:visivel`) };
        const acao = valor(`b:${k}:acao`);
        if (acao) {
          b.acao = acao;
          const destino = (valor(`b:${k}:destino`) || "").trim(), mensagem = (valor(`b:${k}:mensagem`) || "").trim();
          if (destino && acao !== "whatsapp") b.destino = destino;
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

  function lerContato(form) {
    const d = Object.fromEntries(new FormData(form)), contato = {};
    const zap = whatsappDoContrato(d.whatsapp), tel = whatsappDoContrato(d.telefone);
    if (zap) contato.whatsapp = zap;
    if (d.mensagem.trim()) contato.mensagem = d.mensagem.trim();
    if (d.instagram.trim()) contato.instagram = d.instagram.trim().replace(/^@/, "");
    if (tel) contato.telefone = tel;
    return contato;
  }

  /** Leva o que está nos campos para o `trabalho` (e daí para o site e o rascunho). */
  function colher() {
    const form = editor.querySelector("form");
    if (!form || aberta === null) return;
    const novo = aberta === CONTATO ? { ...trabalho, contato: lerContato(form) } : { ...trabalho, secoes: { ...trabalho.secoes, [aberta]: lerSecao(form, aberta) } };
    if (igual(novo, trabalho)) return; // sair de um campo sem mudar nada não regrava (nem mexe na tela)
    trabalho = novo;
    if (aberta !== CONTATO) {
      form.querySelectorAll("[data-lista]").forEach(lista => lista.querySelectorAll("[data-item]").forEach((li, i) => {
        li.querySelector("[data-resumo]").textContent = resumoDoItem(trabalho.secoes[aberta].listas[lista.dataset.lista][i], i, lista.dataset.nome);
      }));
    }
    mudou();
  }

  async function enviarFoto(entrada) {
    const bloco = entrada.closest("[data-imagem]"), botao = entrada.closest("label");
    botao.classList.add("rz-ms-enviando");
    try {
      const blob = await paraWebp(entrada.files[0]);
      const caminho = caminhoDaImagem(conta.conta_id, aberta, bloco.dataset.imagem);
      await banco.enviarArquivo("site-imagens", caminho, blob, "image/webp", { trocar: false });
      bloco.querySelector('input[type="hidden"]').value = enderecoDaImagem(caminho, { ambiente, origem: location.origin });
      // data: e não blob: (a CSP do painel só aceita imagem de data: e https:)
      const src = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
      trocarMiniatura(bloco, src);
      const original = bloco.querySelector("[data-original]");
      if (original) original.hidden = false;
      colher();
    } catch (e) {
      avisar(e.message || "A foto não subiu. Tente de novo.", { tipo: "erro" });
    } finally {
      botao.classList.remove("rz-ms-enviando");
      entrada.value = "";
    }
  }

  function trocarMiniatura(bloco, src) {
    const img = document.createElement("img");
    img.className = "rz-ms-mini"; img.alt = ""; img.dataset.miniatura = ""; img.src = src;
    bloco.querySelector("[data-miniatura]").replaceWith(img);
    const doItem = bloco.closest("[data-item]");
    if (doItem && doItem.querySelector("summary [data-miniatura]")) doItem.querySelector("summary [data-miniatura]").replaceWith(img.cloneNode());
  }

  // ---------- a coluna da esquerda: a lista das partes ou a parte aberta ----------
  function marcarAlteradas() {
    const ar = noAr();
    editor.querySelectorAll("[data-secao]").forEach(b => {
      const id = b.dataset.secao, mudou = id === CONTATO ? !igual(trabalho.contato, ar.contato) : !igual(trabalho.secoes[id], ar.secoes[id]);
      b.querySelector("[data-marcas]").innerHTML = `${id !== CONTATO && trabalho.secoes[id].visivel === false ? etiqueta("Escondida") : ""}${mudou ? etiqueta("Alterada", "alerta") : ""}`;
    });
  }

  function desenharEditor() {
    if (aberta === null) {
      const linha = (id, nome, onde, n) => {
        const dentro = `<span class="rz-ms-num" aria-hidden="true">${n}</span><span class="rz-linha-texto"><b>${escapar(nome)}</b><small>${escapar(onde || " ")}</small></span><span class="rz-linha-fim" data-marcas></span>`;
        return `<li>${edita ? `<button class="rz-linha" type="button" data-secao="${escapar(id)}">${dentro}${icone("seta", { tamanho: 18, classe: "rz-texto-3" })}</button>` : `<div class="rz-linha" data-secao="${escapar(id)}">${dentro}</div>`}</li>`;
      };
      const ids = Object.keys(trabalho.secoes);
      editor.innerHTML = `
        <h2 class="rz-titulo-3">As partes do site, de cima para baixo</h2>
        <ul class="rz-cartao rz-linhas">${ids.map((id, i) => linha(id, nomeDaSecao(id, trabalho.secoes[id]), ondeFica(id), i + 1)).join("")}
          ${linha(CONTATO, "WhatsApp e redes", "O número e a mensagem de todos os botões de WhatsApp, e o Instagram.", icone("whatsapp", { tamanho: 16 }))}</ul>
        ${site.situacao === "conectado" && edita ? `<p class="rz-texto-3 rz-ms-regra">Bom saber: o que você publica aparece no site enquanto o Meu site estiver ativo. Se ele for desligado ou o painel cancelado, o site volta à versão entregue. Para manter as mudanças nos arquivos do site, a Renderiza faz a versão final, por até 3 mensalidades. <a href="/termos#site" target="_blank" rel="noopener">Ver nos termos</a></p>` : ""}`;
      marcarAlteradas();
      return;
    }
    const contato = aberta === CONTATO, s = contato ? null : trabalho.secoes[aberta];
    editor.innerHTML = `
      <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-voltar>${icone("voltar", { tamanho: 16 })}Todas as partes</button>
      <div class="rz-ms-parte">
        <h2 class="rz-titulo-2">${escapar(contato ? "WhatsApp e redes" : nomeDaSecao(aberta, s))}</h2>
        <p class="rz-texto-2">${escapar(contato ? "Vale para todos os botões de WhatsApp e de Instagram do site." : ondeFica(aberta))}</p>
      </div>
      ${contato ? formDoContato() : formDaSecao(aberta)}`;
  }

  /** Abre uma parte; com `alvo` (um clique no site), abre o item da lista e leva o cursor ao campo. */
  function abrirParte(id, alvo = null) {
    if (aberta !== id) { aberta = id; desenharEditor(); editor.scrollTop = 0; if (window.innerWidth < 1100) editor.scrollIntoView({ block: "start" }); }
    if (!alvo || !alvo.grupo) { destacar({ secao: id }); return; }
    const form = editor.querySelector("form");
    let campo = null;
    if (alvo.grupo === "textos") campo = form.querySelector(`[name="t:${CSS.escape(alvo.campo)}"]`);
    else if (alvo.grupo === "botoes") campo = form.querySelector(`[name="b:${CSS.escape(alvo.campo)}:rotulo"]`);
    else if (alvo.grupo === "imagens") campo = form.querySelector(`[data-imagem="i:${CSS.escape(alvo.campo)}"]`);
    else if (alvo.grupo === "listas") {
      const lista = form.querySelector(`[data-lista="${CSS.escape(alvo.campo)}"]`);
      const item = lista && typeof alvo.indice === "number" ? lista.querySelectorAll("[data-item]")[alvo.indice] : null;
      if (item) item.querySelector("details").open = true;
      campo = (item && ((alvo.subcampo && item.querySelector(`[name="l:${CSS.escape(alvo.subcampo)}"], [data-imagem="li:${CSS.escape(alvo.subcampo)}"]`)) || item)) || lista;
    }
    if (!campo) return;
    const bloco = campo.closest(".rz-campo, [data-item], fieldset") || campo;
    bloco.scrollIntoView({ block: "center" });
    bloco.classList.remove("rz-ms-piscar"); void bloco.offsetWidth; bloco.classList.add("rz-ms-piscar");
    if (campo.matches("input, textarea, select")) campo.focus({ preventScroll: true });
  }

  /** De um campo do editor para a marcação dele no site ({ secao, grupo, campo, indice }). */
  function alvoDoCampo(e) {
    if (aberta === null || aberta === CONTATO) return null;
    const lista = e.closest("[data-lista]"), item = e.closest("[data-item]");
    if (lista) return { secao: aberta, grupo: "listas", campo: lista.dataset.lista, ...(item ? { indice: [...item.parentElement.children].indexOf(item) } : {}) };
    const foto = e.closest("[data-imagem]"), botao = e.closest("[data-botao]");
    if (foto) return { secao: aberta, grupo: "imagens", campo: foto.dataset.imagem.slice(2) };
    if (botao) return { secao: aberta, grupo: "botoes", campo: botao.dataset.botao };
    return e.name && e.name.startsWith("t:") ? { secao: aberta, grupo: "textos", campo: e.name.slice(2) } : { secao: aberta };
  }

  function ligarEditor() {
    let espera = null;
    editor.addEventListener("click", ev => {
      const b = ev.target.closest("button, summary");
      if (!b) return;
      if (b.dataset.secao) return abrirParte(b.dataset.secao);
      if (b.hasAttribute("data-voltar")) { aberta = null; desenharEditor(); return; }
      const item = b.closest("[data-item]");
      if (b.matches("[data-subir], [data-descer], [data-tirar]")) {
        ev.preventDefault(); // dentro do <summary>: não abre nem fecha o item
        if (b.hasAttribute("data-tirar")) {
          if (item.parentElement.children.length < 2) return avisar("A lista precisa de pelo menos um item. Para esconder tudo, desligue \"Esta parte aparece no site\".", { tipo: "erro" });
          item.remove();
        } else if (b.hasAttribute("data-subir") && item.previousElementSibling) item.parentElement.insertBefore(item, item.previousElementSibling);
        else if (b.hasAttribute("data-descer") && item.nextElementSibling) item.parentElement.insertBefore(item.nextElementSibling, item);
        return colher();
      }
      if (b.hasAttribute("data-adicionar")) {
        const lista = b.closest("[data-lista]"), campo = lista.dataset.lista, ol = lista.querySelector("[data-itens]");
        if (ol.children.length >= 60) return avisar("No máximo 60 itens.", { tipo: "erro" });
        ol.insertAdjacentHTML("beforeend", itemDeLista(aberta, campo, novoItem(trabalho.secoes[aberta].listas[campo]), ol.children.length, lista.dataset.nome, true));
        colher();
        const novo = ol.lastElementChild;
        novo.scrollIntoView({ block: "center" });
        (novo.querySelector("input:not([type=hidden]):not([type=file]), textarea") || novo.querySelector("summary")).focus({ preventScroll: true });
        return;
      }
      if (b.dataset.original !== undefined) {
        const bloco = b.closest("[data-imagem]");
        bloco.querySelector('input[type="hidden"]').value = b.dataset.original;
        trocarMiniatura(bloco, imagemParaVer(b.dataset.original, site.dominios));
        b.hidden = true;
        colher();
      }
    });
    editor.addEventListener("submit", ev => ev.preventDefault());
    editor.addEventListener("change", ev => {
      if (ev.target.matches("[data-enviar]")) { if (ev.target.files[0]) enviarFoto(ev.target); return; }
      const caixa = ev.target.closest("[data-botao]");
      if (caixa && ev.target.name.endsWith(":acao")) { // o que o botão faz mudou: os campos de "para onde" mudam junto
        const acao = ev.target.value, pre = `b:${caixa.dataset.botao}`;
        caixa.querySelector("[data-destino]").innerHTML = campoDoDestino(pre, { acao, destino: "" });
        caixa.querySelector("[data-destino]").hidden = acao === "whatsapp";
        caixa.querySelector("[data-mensagem]").hidden = acao !== "whatsapp";
      }
      colher();
    });
    editor.addEventListener("input", ev => { if (!ev.target.matches("[type=file]")) colher(); });
    editor.addEventListener("focusin", ev => { const a = alvoDoCampo(ev.target); if (a) destacar(a); });
    // na lista, parar o mouse (ou o foco) numa parte mostra onde ela fica no site
    editor.addEventListener("mouseover", ev => {
      const b = ev.target.closest("[data-secao]");
      clearTimeout(espera);
      if (b && aberta === null && b.dataset.secao !== CONTATO) espera = setTimeout(() => destacar({ secao: b.dataset.secao }), 220);
    });
  }

  // ---------- as versões publicadas ----------
  function desenharVersoes() {
    const lugar = corpo.querySelector('[data-painel="versoes"]');
    if (!lugar) return;
    lugar.innerHTML = `${historico.length ? `<ul class="rz-cartao rz-linhas">${historico.map((v, i) => `<li><div class="rz-linha"><span class="rz-linha-texto"><b>Versão ${v.numero}${i === 0 ? " · no ar" : ""}</b>
        <small>${escapar(quando(v.publicada_em))}${nomes[v.pessoa_id] ? " · " + escapar(nomes[v.pessoa_id]) : ""}</small></span>
        ${edita && i > 0 ? `<span class="rz-linha-fim"><button class="rz-botao rz-botao--pequeno" type="button" data-usar="${escapar(v.id)}">Usar esta</button></span>` : ""}</div></li>`).join("")}</ul>`
      : `<p class="rz-texto-2">Nada publicado ainda: o site está como foi entregue.</p>`}
      ${edita ? `<p class="rz-texto-3 rz-ms-regra"><button class="rz-link" type="button" data-inicial>Voltar ao site como foi entregue</button> (vai para o rascunho; publique para valer).</p>` : ""}`;
  }

  function mostrarAba(nome) {
    corpo.querySelectorAll("[data-aba]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.aba === nome)));
    corpo.querySelectorAll("[data-painel]").forEach(p => { p.hidden = p.dataset.painel !== nome; });
    raiz.classList.toggle("rz-ms--fora-do-editor", nome !== "editar"); // o "Ver o site" do celular é só do editor
    if (nome === "editar") ajustar();
    // os indicadores carregam na primeira vez que a aba abre (e têm o próprio "Atualizar")
    const ind = corpo.querySelector('[data-painel="indicadores"]');
    if (nome === "indicadores" && !ind.dataset.montado) {
      ind.dataset.montado = "sim";
      import("./indicadores.js").then(m => m.montarIndicadores(ind, { banco, conta, conteudo: () => trabalho }))
        .catch(e => { delete ind.dataset.montado; avisar(e.message, { tipo: "erro" }); });
    }
  }
  // a altura das colunas depende do que está acima delas (a situação e os botões podem quebrar a linha)
  new ResizeObserver(ajustar).observe(acoes);

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
    const endereco = enderecoDoSite(dominio());
    origemDoSite = endereco ? new URL(endereco).origin : "";
    acoes.classList.add("rz-ms-acoes");
    acoes.innerHTML = `
      <span class="rz-ms-situacao" data-situacao role="status"></span>
      ${endereco ? `<a class="rz-botao" href="${escapar(endereco)}" target="_blank" rel="noopener">${icone("link", { tamanho: 18 })}Abrir o site</a>` : ""}
      ${edita ? `<button class="rz-botao" type="button" data-descartar hidden>Descartar mudanças</button>
      <button class="rz-botao rz-botao--primario" type="button" data-publicar disabled>Publicar</button>` : ""}`;
    corpo.innerHTML = `
      ${site.situacao === "conectado" ? "" : `<p class="rz-alerta rz-alerta--aviso" role="note">${icone("alerta", { tamanho: 18 })}<span>${site.situacao === "versao_final"
        ? "Este site já recebeu a versão final: ele não depende mais do painel e as mudanças daqui não aparecem nele."
        : "O site está desconectado do painel: ele mostra a versão inicial. Para voltar, fale com a Renderiza."}</span></p>`}
      ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê o Meu site. Quem muda e publica é o dono ou quem ele deixar.</span></p>` : ""}
      <div class="rz-abas" role="tablist">
        <button type="button" role="tab" data-aba="editar" aria-selected="true">Editar</button>
        <button type="button" role="tab" data-aba="indicadores" aria-selected="false">Indicadores</button>
        <button type="button" role="tab" data-aba="versoes" aria-selected="false">Versões publicadas</button>
      </div>
      <div class="rz-ms-grade" data-painel="editar">
        <div class="rz-ms-editor" data-editor></div>
        <aside class="rz-ms-previa" aria-label="O site, com o rascunho">
          <div class="rz-ms-barra">
            <button class="rz-botao rz-botao--pequeno rz-ms-fechar" type="button" data-fechar-previa>${icone("voltar", { tamanho: 16 })}Voltar a editar</button>
            <div class="rz-segmentos" role="group" aria-label="Tamanho da tela">
              <button type="button" data-tela="celular" aria-pressed="true">Celular</button><button type="button" data-tela="computador" aria-pressed="false">Computador</button>
            </div>
            <span class="rz-texto-3 rz-ms-dica">${edita ? "Clique no site para editar aquela parte" : "O site com o rascunho"}</span>
          </div>
          <div class="rz-ms-palco" data-palco>
            ${endereco ? `<iframe title="O seu site, com o rascunho" src="${escapar(endereco)}/?rz-editor=1" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" data-quadro></iframe>` : ""}
            <div class="rz-ms-sem-ponte" data-sem-ponte hidden><p><b>A prévia ao vivo ainda não está ligada neste site.</b></p>
              <p class="rz-texto-2">Você pode editar normalmente e ver o rascunho no site em outra aba.</p>
              <button class="rz-botao" type="button" data-outra-aba>${icone("olho", { tamanho: 18 })}Ver o rascunho no site</button></div>
          </div>
        </aside>
      </div>
      <div data-painel="indicadores" hidden></div>
      <div data-painel="versoes" hidden></div>
      <button class="rz-botao rz-botao--primario rz-ms-ver" type="button" data-ver>${icone("olho", { tamanho: 18 })}Ver o site</button>`;
    editor = corpo.querySelector("[data-editor]"); quadro = corpo.querySelector("[data-quadro]"); palco = corpo.querySelector("[data-palco]");
    ponte.pronta = false;
    ligarEditor();
    desenharEditor(); desenharVersoes(); situacao();
    if (quadro) { olharPalco.observe(palco); ajustar(); }
    setTimeout(() => { if (!ponte.pronta && corpo.isConnected) corpo.querySelector("[data-sem-ponte]").hidden = false; }, 7000);
  };

  el.addEventListener("click", async ev => {
    const b = ev.target.closest("button");
    if (!b || !el.contains(b)) return;
    if (b.dataset.aba) return mostrarAba(b.dataset.aba);
    if (b.dataset.tela) {
      tela = b.dataset.tela;
      corpo.querySelectorAll("[data-tela]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      ajustar();
      if (ultimoAlvo) setTimeout(() => destacar(ultimoAlvo), 300); // a página mudou de largura: volta para a parte
      return;
    }
    if (b.hasAttribute("data-ver")) { raiz.classList.add("rz-ms--vendo"); return ajustar(); }
    if (b.hasAttribute("data-fechar-previa")) return raiz.classList.remove("rz-ms--vendo");
    if (b.hasAttribute("data-outra-aba")) return verEmOutraAba();
    if (b.hasAttribute("data-publicar")) return publicar(b);
    if (b.hasAttribute("data-descartar")) {
      const ok = await confirmar({ titulo: "Descartar as mudanças?", texto: "O rascunho volta a ser igual ao que está no ar. O site não muda.", sim: "Descartar", nao: "Voltar", perigo: true });
      if (ok) await trocarTudo(publicada() ? publicada().conteudo : { esquema: 1, secoes: {} }, "Mudanças descartadas: o rascunho está igual ao site.");
      return;
    }
    if (b.dataset.usar) {
      const v = historico.find(x => x.id === b.dataset.usar);
      if (v) await trocarTudo(v.conteudo, `A versão ${v.numero} está no rascunho. Confira e publique.`);
    } else if (b.hasAttribute("data-inicial")) {
      await trocarTudo({ esquema: 1, secoes: {} }, "O site como foi entregue está no rascunho. Publique para valer.");
    }
  });

  window.addEventListener("message", aoReceber);
  window.addEventListener("resize", ajustar);
  await comEstados(corpo, { carregar, desenhar });
  return () => {
    window.removeEventListener("message", aoReceber);
    window.removeEventListener("resize", ajustar);
    olharPalco.disconnect();
    if (relogio) salvar(); // sair no meio de uma mudança: o rascunho grava antes
  };
}
