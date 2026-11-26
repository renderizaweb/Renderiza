// A versão de entrega do site da Ricardo Motors (trilho docs/entregas/ricardo-motors.md, 2B), feita da demo aprovada:
// copia a demo e o site.json para uma pasta temporária, aplica as mudanças da entrega e roda o scripts/virar-site.mjs
// (fotos em img/, Google, cabeçalhos, o script do Meu site e o do Estoque). A demo continua como está (é a proposta).
//
//   node demos/ricardo-motors/entrega.mjs <pasta de saída>   (a pasta do repositório do site dele, ou uma de teste)
//   "api" no site.json só para provar no STG (o padrão é o painel de verdade)
//
// O que muda em relação à demo (12-modulo-estoque.md, "Contrato v1", item 3):
// - a VERSÃO DE RESERVA: os carros de hoje SEM PREÇO ("Sob consulta"), inclusive na capa e na página do carro, com o
//   aviso "confirme a disponibilidade pelo WhatsApp"; com o painel respondendo, os carros e os preços vêm dele;
// - window.rzEstoque (o que o ferramentas/estoque/estoque.js chama): troca a vitrine, os filtros, as contagens e a
//   capa (os destaques do painel); null volta à reserva. Card e miniatura usam a foto pequena; a galeria, a grande;
// - a vitrine (#estoque) leva data-estoque e nada de data-site-*: o Meu site não mexe no estoque;
// - as marcações do Meu site na capa, nos serviços, no "quem é o Ricardo" e no contato;
// - sai o ouvinte do painel de exemplo (?rz-estoque=exemplo).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** O WhatsApp da Ricardo Motors: o número por trás do link da bio (wa.me/message/G5X6UUN627ARL1), conferido em 26/11. */
export const WHATSAPP = "5511947882373";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");

/** Troca um trecho que tem de existir exatamente `vezes` vezes (a demo mudou? para, em vez de sair um site torto). */
function trocar(html, velho, novo, vezes = 1) {
  const n = html.split(velho).length - 1;
  if (n !== vezes) throw new Error(`entrega: esperava ${vezes}× "${velho.slice(0, 70)}…", achei ${n}`);
  return html.split(velho).join(novo);
}

export function versaoDeEntrega(demo) {
  let h = demo;
  // ---------- as fotos dos carros (o objeto IMG do script) viram arquivos em img/c/ ----------
  const img = h.match(/const IMG=(\{.*?\});/s);
  if (!img) throw new Error("entrega: não achei const IMG");
  const arquivos = [], caminhos = {};
  for (const [k, v] of Object.entries(JSON.parse(img[1]))) {
    const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/.exec(v);
    if (!m || !/^[A-Za-z0-9-]+$/.test(k)) throw new Error("entrega: foto estranha no IMG: " + k);
    const rel = `img/c/${k}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
    arquivos.push([rel, Buffer.from(m[2], "base64")]);
    caminhos[k] = "/" + rel;
  }
  h = h.replace(img[0], `const IMG=${JSON.stringify(caminhos)};`);
  // ---------- o estilo do aviso ----------
  h = trocar(h, "</style>", `.aviso-est{display:flex;align-items:center;gap:10px;margin:0 0 18px;padding:12px 16px;border-radius:var(--r);background:#fff;box-shadow:var(--sombra);color:var(--tx);font-size:14px}
.aviso-est[hidden]{display:none}.aviso-est svg{flex:none;width:20px;height:20px;color:var(--verde)}.aviso-est a{color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.aviso-carro{margin:-6px 0 14px;color:var(--mu);font-size:14px}
</style>`);
  // ---------- a vitrine: fora do Meu site, com o aviso da versão de reserva ----------
  h = trocar(h, '<section class="sec" id="estoque">', '<section class="sec" id="estoque" data-estoque>');
  h = trocar(h, '<div class="barra" id="barra">', `<p class="aviso-est" data-estoque-aviso><svg class="i" aria-hidden="true"><use href="#wa"/></svg><span>O estoque muda todo dia: <a data-wa="Olá, Ricardo! Vi o estoque no seu site. Quais carros estão disponíveis hoje?" href="#">confirme a disponibilidade pelo WhatsApp</a>.</span></p>
    <div class="barra" id="barra">`);
  // ---------- o Meu site: capa, serviços, quem é o Ricardo, contato ----------
  h = trocar(h, '<section class="capa" aria-label="Capa">', '<section class="capa" aria-label="Capa" data-site-secao="inicio">');
  h = trocar(h, '<span class="k">Consultoria automotiva · São Paulo</span>', '<span class="k" data-site="inicio.etiqueta">Consultoria automotiva · São Paulo</span>');
  h = trocar(h, '<h1><span class="nw">Carros premium</span>', '<h1 data-site="inicio.titulo"><span class="nw">Carros premium</span>');
  h = trocar(h, '<p>Selecionados a dedo, com procedência verificada e negociação direta com o Ricardo.</p>', '<p data-site="inicio.texto">Selecionados a dedo, com procedência verificada e negociação direta com o Ricardo.</p>');
  h = trocar(h, '<a class="bt bt-l" data-wa="Olá, Ricardo! Vim pelo seu site e quero ajuda para encontrar um carro." href="#">', '<a class="bt bt-l" data-site-botao="inicio.botao" data-wa="Olá, Ricardo! Vim pelo seu site e quero ajuda para encontrar um carro." href="#">');
  h = trocar(h, '<section class="sec" id="servicos" style="padding-top:0">', '<section class="sec" id="servicos" style="padding-top:0" data-site-secao="servicos">');
  h = trocar(h, '<span class="k">Serviços</span><h2>Para comprar, vender ou cuidar do seu carro</h2>', '<span class="k" data-site="servicos.etiqueta">Serviços</span><h2 data-site="servicos.titulo">Para comprar, vender ou cuidar do seu carro</h2>');
  h = trocar(h, '<div class="servs">', '<div class="servs" data-site-lista="servicos.itens">');
  h = h.replace(/<article class="serv">(<span class="ic">.*?<\/span>)<h3>(.*?)<\/h3><p>(.*?)<\/p>/g, (_, ic, t, p) => `<article class="serv" data-site-item>${ic}<h3 data-site-campo="titulo">${t}</h3><p data-site-campo="texto">${p}</p>`);
  if ((h.match(/data-site-item/g) || []).length !== 4) throw new Error("entrega: esperava os 4 serviços");
  // o link de cada serviço sabe de que serviço é: um serviço novo ou renomeado no Meu site leva a mensagem com o nome dele
  let servicos = 0;
  h = h.replace(/(<h3 data-site-campo="titulo">([^<]*)<\/h3><p data-site-campo="texto">.*?<\/p>)<a data-wa=/g, (_, a, t) => (servicos += 1, `${a}<a data-wa-de="${t}" data-wa=`));
  if (servicos !== 4) throw new Error("entrega: esperava o link dos 4 serviços");
  h = trocar(h, '<section class="sec" id="sobre" style="padding-top:0">', '<section class="sec" id="sobre" style="padding-top:0" data-site-secao="sobre">');
  h = trocar(h, '<img class="principal" ', '<img class="principal" data-site-img="sobre.foto" ');
  h = trocar(h, '<img class="segunda" ', '<img class="segunda" data-site-img="sobre.foto-2" ');
  h = trocar(h, '<span class="k">Quem cuida do seu negócio</span><h2>Ricardo Neves</h2>', '<span class="k" data-site="sobre.etiqueta">Quem cuida do seu negócio</span><h2 data-site="sobre.titulo">Ricardo Neves</h2>');
  h = trocar(h, '<p>Dez anos no dia a dia', '<p data-site="sobre.texto">Dez anos no dia a dia');
  h = trocar(h, '<section id="contato" aria-label="Contato">', '<section id="contato" aria-label="Contato" data-site-secao="contato">');
  h = trocar(h, '<span class="k">Atendimento em São Paulo</span><h2 style="margin-top:8px">Gostou de algum carro?</h2><p>', '<span class="k" data-site="contato.etiqueta">Atendimento em São Paulo</span><h2 style="margin-top:8px" data-site="contato.titulo">Gostou de algum carro?</h2><p data-site="contato.texto">');
  h = trocar(h, '<a class="bt bt-w" data-wa="Olá, Ricardo! Vim pelo seu site e quero agendar uma visita." href="#">', '<a class="bt bt-w" data-site-botao="contato.botao" data-wa="Olá, Ricardo! Vim pelo seu site e quero agendar uma visita." href="#">');
  // ---------- a versão de reserva: sem preço ----------
  const carros = h.match(/const CARROS=(\[.*?\]);\n/);
  if (!carros) throw new Error("entrega: não achei const CARROS");
  const lista = JSON.parse(carros[1]).map(c => ({ ...c, preco: null }));
  h = h.replace(carros[0], `const CARROS=${JSON.stringify(lista)};\n`);
  h = h.replace(/(<span id="vc-txt"><b>[^<]*<\/b> · )R\$ [\d.]+(<\/span>)/, "$1Sob consulta$2");
  if (/R\$ \d/.test(h.replace(/<script[\s\S]*?<\/script>/g, ""))) throw new Error("entrega: sobrou preço no HTML");
  // ---------- o script da página ----------
  h = trocar(h, "const msg=c=>`Olá, Ricardo! Tenho interesse no ${nome(c)} ${c.ano} (${brl(c.preco)}) que vi no seu site.`;",
    "const msg=c=>`Olá, Ricardo! Vi no seu site o ${nome(c)} ${c.ano}${c.preco?` (${brl(c.preco)})`:\"\"}. Ainda está disponível?`;\nconst ftm=c=>c.fm&&c.fm.length?c.fm:fts(c);\nlet DO_PAINEL=false;");
  h = trocar(h, '["ate250","Até R$ 250 mil",c=>c.preco<=250000]', '["ate250","Até R$ 250 mil",c=>!!c.preco&&c.preco<=250000]');
  h = trocar(h, "$(\"#grade\").innerHTML=l.map((c,i)=>{const f=fts(c).slice(0,6);", "$(\"#grade\").innerHTML=l.map((c,i)=>{const f=ftm(c).slice(0,6);");
  h = trocar(h, '<img src="${fts(x)[0]}" alt="" loading="lazy"><span>${nome(x)}<small>${brl(x.preco)}</small></span>', '<img src="${ftm(x)[0]}" alt="" loading="lazy"><span>${nome(x)}<small>${brl(x.preco)}</small></span>');
  h = trocar(h, '<div class="preco">${brl(c.preco)}</div>', '<div class="preco">${brl(c.preco)}</div>${DO_PAINEL?"":`<p class="aviso-carro">O estoque muda todo dia: confirme a disponibilidade pelo WhatsApp.</p>`}');
  h = trocar(h, "const m=location.hash.match(/^#carro-(\\d+)/);", "const m=location.hash.match(/^#carro-([A-Za-z0-9-]+)/);");
  // ---------- o contato: o número e o Instagram, com o "WhatsApp e redes" do Meu site por cima ----------
  // O número é o do link da bio (wa.me/message/…, da Ricardo Motors): com ele, cada botão abre a conversa com a mensagem
  // dele (o carro, a visita); o link da bio fica de reserva. O meu-site.js grava o contato publicado no DEMO_CLIENT e
  // chama DEMO_RUNTIME.links(): os links (inclusive os da vitrine, refeitos pelo Estoque) passam a usar o número e o
  // Instagram de lá; a "mensagem" de lá vale para os botões gerais (data-wa-geral), não para os de um carro. Botão do
  // Meu site com destino próprio (o porBotao tira o data-whatsapp) fica como o Meu site deixou.
  h = trocar(h, 'const WA_NUM="";', `const WA_NUM=${JSON.stringify(WHATSAPP)};`);
  h = trocar(h, "const wa=m=>WA_NUM?`https://wa.me/${WA_NUM}?text=${encodeURIComponent(m)}`:WA_BIO;",
    "const doContato=()=>{const m=String((window.DEMO_CLIENT||{}).whatsapp||\"\").match(/wa\\.me\\/(\\d{10,15})(?:\\?text=([^#]*))?/);let t=\"\";if(m&&m[2])try{t=decodeURIComponent(m[2])}catch(e){}return{num:m?m[1]:\"\",msg:t}};\n" +
    "const wa=(m,geral)=>{const k=doContato();return k.num?`https://wa.me/${k.num}?text=${encodeURIComponent(geral&&k.msg||m)}`:WA_BIO};");
  h = trocar(h, 'window.DEMO_CLIENT={whatsapp:WA_NUM?`https://wa.me/${WA_NUM}`:WA_BIO,instagram:"https://www.instagram.com/rm.consultcar/",reviews:[]};',
    'window.DEMO_CLIENT={whatsapp:WA_NUM?`https://wa.me/${WA_NUM}?text=`:WA_BIO,instagram:"https://www.instagram.com/rm.consultcar/",reviews:[]};');
  h = trocar(h, 'const ligarWa=(el=document)=>$$("[data-wa]",el).forEach(a=>{a.href=wa(a.dataset.wa);a.target="_blank";a.rel="noopener";a.setAttribute("data-whatsapp","")});',
    'const doServico=a=>{if(a.dataset.waDe===undefined)return"";const it=a.closest("[data-site-item]"),t=it&&it.querySelector(\'[data-site-campo="titulo"]\'),n=t?t.textContent.trim():"";return n&&n!==a.dataset.waDe?n:""};\n' +
    'const ligarWa=(el=document)=>$$("[data-wa]",el).forEach(a=>{if(a.hasAttribute("data-site-botao")&&!a.hasAttribute("data-whatsapp"))return;const s=doServico(a),t=s&&[...a.childNodes].find(x=>x.nodeType===3&&x.nodeValue.trim());if(t)t.nodeValue="Falar com o Ricardo";a.href=wa(s?`Olá, Ricardo! Quero saber mais sobre: ${s}.`:a.dataset.wa,a.hasAttribute("data-wa-geral"));a.target="_blank";a.rel="noopener";a.setAttribute("data-whatsapp","")});\n' +
    'const ligarIg=()=>{const n=(String((window.DEMO_CLIENT||{}).instagram||"").match(/instagram\\.com\\/([A-Za-z0-9._]{1,30})/)||[])[1];if(n)$$("a[data-instagram]").forEach(a=>{a.href=`https://www.instagram.com/${n}/`;const t=[...a.childNodes].find(x=>x.nodeType===3&&x.nodeValue.trim().startsWith("@"));if(t)t.nodeValue="@"+n})};\n' +
    "window.DEMO_RUNTIME={links(){ligarWa();ligarIg()},carrosseis(){},avaliacoes(){}};");
  h = trocar(h, '<a class="bt bt-w" data-wa="Olá, Ricardo! Vim pelo seu site e quero falar sobre um carro." href="#">', '<a class="bt bt-w" data-wa-geral data-wa="Olá, Ricardo! Vim pelo seu site e quero falar sobre um carro." href="#">', 2);
  h = trocar(h, '<a class="wa-f" data-wa="Olá, Ricardo! Vim pelo seu site." href="#"', '<a class="wa-f" data-wa-geral data-wa="Olá, Ricardo! Vim pelo seu site." href="#"');
  // no HTML parado, os links já prontos (sem JavaScript, no Google e para o Meu site saber que são de WhatsApp)
  const iScript = h.lastIndexOf("<script", h.indexOf("const WA_NUM="));
  if (iScript < 0) throw new Error("entrega: não achei o script da página");
  const des = t => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  let estaticos = 0;
  h = h.slice(0, iScript).replace(/data-wa="([^"$]*)" href="#"/g, (_, m) => {
    estaticos += 1;
    return `data-whatsapp data-wa="${m}" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(des(m))}" target="_blank" rel="noopener"`;
  }) + h.slice(iScript);
  if (estaticos < 8) throw new Error("entrega: esperava os links de WhatsApp da página, achei " + estaticos);
  // a capa: os destaques numa lista (os da demo; com o painel, os dele)
  const capaIni = h.indexOf('const HERO=[["81662220",null]');
  const capaFim = h.indexOf('sl.addEventListener("click",()=>$("#ver-capa").click());');
  if (capaIni < 0 || capaFim < 0) throw new Error("entrega: não achei a capa no script");
  h = h.slice(0, capaIni) + `const sl=$("#slides"),primeira=sl.querySelector("img");
let HL=[["81662220",null],["82333708","h2"],["77408515","h3"],["81200148","h4"]].map(([id,k])=>({c:CARROS0.find(x=>x.id===id),src:k?IMG[k]:primeira.src}));
let himgs=[],hi=0,ht;
function montarCapa(lista){HL=lista;sl.innerHTML="";
 HL.forEach((x,i)=>{const im=i===0&&x.src===primeira.src?primeira:new Image();im.src=x.src;im.alt=nome(x.c);im.decoding="async";im.className=i?"":"on";sl.appendChild(im)});
 himgs=$$("#slides img");
 $("#destaques").innerHTML=\`<span class="k">Em destaque</span>\`+HL.map((x,i)=>\`<button class="dq\${i?"":" on"}" data-i="\${i}" aria-label="Destaque: \${nome(x.c)}"><img src="\${x.mini||x.src}" alt=""><span><b>\${nome(x.c)}</b><small>\${x.c.ano} · \${brl(x.c.preco)}</small></span><span class="bp"><i></i></span></button>\`).join("");
 $("#pontos-capa").innerHTML=HL.map((_,i)=>\`<i class="\${i?"":"on"}"></i>\`).join("");heroIr(0)}
function heroIr(i){if(!HL.length)return;hi=(i+HL.length)%HL.length;const c=HL[hi].c;
 himgs.forEach((im,k)=>im.classList.toggle("on",k===hi));$$(".dq").forEach((b,k)=>b.classList.toggle("on",k===hi));$$("#pontos-capa i").forEach((d,k)=>d.classList.toggle("on",k===hi));
 const v=$("#ver-capa");v.dataset.abre=c.id;v.setAttribute("aria-label","Ver "+nome(c));$("#vc-txt").innerHTML=\`<b>\${nome(c)}</b> · \${brl(c.preco)}\`;
 clearTimeout(ht);if(MOV)ht=setTimeout(()=>heroIr(hi+1),6500)}
$("#destaques").onclick=e=>{const b=e.target.closest(".dq");if(b)heroIr(+b.dataset.i)};
let hx=null;sl.addEventListener("touchstart",e=>hx=e.touches[0].clientX,{passive:true});sl.addEventListener("touchend",e=>{if(hx===null)return;const d=e.changedTouches[0].clientX-hx;if(Math.abs(d)>40)heroIr(hi+(d<0?1:-1));hx=null});
` + h.slice(capaFim);
  // o Estoque do painel no lugar do ouvinte do exemplo
  const ouvIni = h.indexOf("// Estoque do painel (docs/painel-clientes/12-modulo-estoque.md): dentro do painel de exemplo");
  const ouvFim = h.indexOf("heroIr(0);\nchips();grade();ligarWa();rota();");
  if (ouvIni < 0 || ouvFim < 0) throw new Error("entrega: não achei o ouvinte do exemplo");
  h = h.slice(0, ouvIni) + `// O Estoque do painel (docs/painel-clientes/12-modulo-estoque.md; ferramentas/estoque/estoque.js chama): a lista e os
// preços do painel no lugar da versão de reserva (sem preço); null volta à reserva.
const CAPA0=HL;
const doPainel=i=>{const c=i.campos||{},tags=[...(i.selos||[])];if(c.blindado&&!tags.includes("Blindado"))tags.push("Blindado");if(c.combustivel==="Híbrido"&&!tags.includes("Híbrido"))tags.push("Híbrido");if(c.combustivel==="Diesel"&&!tags.includes("Diesel"))tags.push("Diesel");if(i.situacao==="reservado")tags.unshift("Reservado");
 return {id:i.id,destaque:!!i.destaque,marca:c.marca||"",modelo:c.modelo||"",versao:String(c.versao||"").toUpperCase(),ano:c.ano_fab&&c.ano_modelo?c.ano_fab+"/"+c.ano_modelo:String(c.ano_modelo||c.ano_fab||""),km:Number(c.km)||0,preco:i.preco||null,tipo:c.carroceria||"",
  combustivel:c.combustivel,cambio:c.cambio,carroceria:c.carroceria,cor:c.cor,placa:c.placa,ipva:c.ipva,licenciado:c.licenciado,troca:c.troca,revisoes:c.revisoes,unico:c.unico_dono,garantia:c.garantia,descricao:i.descricao,opcionais:c.opcionais||[],tags,
  f:(i.fotos||[]).map(x=>x.url),fm:(i.fotos||[]).map(x=>x.mini)}};
// sem preço (a reserva), as ordens por preço saem do "Ordenar"
function ordensDePreco(){$$('#ordem option[value="maior"],#ordem option[value="menor"]').forEach(o=>{o.hidden=o.disabled=!DO_PAINEL});if(!DO_PAINEL&&/maior|menor/.test($("#ordem").value))$("#ordem").value="rel"}
function contagens(){$$("[data-total]").forEach(x=>x.textContent=CARROS.length);$$("[data-blind]").forEach(x=>x.textContent=CARROS.filter(c=>c.tags.includes("Blindado")).length)}
window.rzEstoque=itens=>{
 const l=itens?itens.map(doPainel):CARROS0;DO_PAINEL=!!itens;
 CARROS.splice(0,CARROS.length,...l);$$("[data-estoque-aviso]").forEach(x=>x.hidden=DO_PAINEL);ordensDePreco();
 chips();grade();contagens();
 const comFoto=l.filter(c=>c.f.length),capa=itens?[...comFoto.filter(c=>c.destaque),...comFoto.filter(c=>!c.destaque)].slice(0,4).map(c=>({c,src:c.f[0],mini:(c.fm||[])[0]})):CAPA0;
 montarCapa(capa.length?capa:CAPA0);if(dlg.open)rota()};
montarCapa(HL);ordensDePreco();
chips();grade();ligarWa();rota();` + h.slice(ouvFim + "heroIr(0);\nchips();grade();ligarWa();rota();".length);
  if (/rz-estoque=exemplo/.test(h)) throw new Error("entrega: sobrou o ouvinte do exemplo");
  return { html: h, arquivos };
}

/**
 * Gera o site em `saida`. Para a prova no STG (2C), `codigo` e `api` trocam os do site.json (o código da conta de
 * teste e a API do painel local); na entrega, nada disso: vale o site.json.
 */
export function gerar(saida, { codigo, api, silencioso = false } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ricardo-entrega-"));
  try {
    const { html, arquivos } = versaoDeEntrega(fs.readFileSync(path.join(AQUI, "index.html"), "utf8"));
    fs.writeFileSync(path.join(tmp, "index.html"), html);
    const conf = JSON.parse(fs.readFileSync(path.join(AQUI, "site.json"), "utf8"));
    if (codigo) conf.painel.codigo = codigo;
    if (api) conf.painel.api = api;
    fs.writeFileSync(path.join(tmp, "site.json"), JSON.stringify(conf, null, 2));
    const r = spawnSync("node", ["scripts/virar-site.mjs", tmp, path.resolve(saida)], { cwd: RAIZ, stdio: silencioso ? "pipe" : "inherit", encoding: "utf8" });
    if (r.status !== 0 && silencioso) throw new Error("virar-site: " + (r.stderr || r.stdout));
    // depois do virar-site (ele limpa a pasta de saída): as fotos dos carros
    for (const [rel, buf] of arquivos) { fs.mkdirSync(path.dirname(path.join(saida, rel)), { recursive: true }); fs.writeFileSync(path.join(saida, rel), buf); }
    if (!silencioso) console.log(`Fotos dos carros: ${arquivos.length} em ${path.join(saida, "img/c")}`);
    return r.status;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function principal() {
  const saida = process.argv[2];
  if (!saida) { console.error("Uso: node demos/ricardo-motors/entrega.mjs <pasta de saída>"); process.exit(1); }
  process.exitCode = gerar(saida);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) principal();
