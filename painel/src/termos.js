// Termo de aceite de um lead (seção "Termo de aceite" do card, no painel de prospecção): o modelo base do site e o
// que muda de cliente para cliente. Sem tela e sem banco (testado em test/termos.test.mjs); a tela fica em
// termos-ui.js e o banco em supabase/termos-online.sql. O texto sai na marcação de termos-texto.js e é ele, exato,
// que o banco guarda, mostra em /termo/<id> e cuja impressão (SHA-256) a pessoa assina. Regras e como adaptar:
// docs/termos/README.md.
//
// O modelo "site-v1" é a base geral de quem fecha um site, enxuta de propósito (24/11/2026, pedido do Kaue): a entrega
// garantida de forma genérica (o site no modelo da referência aprovada), entrega única sem manutenção, tudo no nome do
// cliente (código, hospedagem e domínio), a garantia contra defeitos e os limites de responsabilidade. O domínio tem três
// casos: o cliente já tem (só uma linha, sem custo), a Renderiza registra com o 1º ano incluído, ou o cliente registra.
// O Painel Renderiza é outro contrato: aqui o cliente só diz se quer; o plano, os módulos (que ele escolhe e muda quando
// quiser) e o valor são os dos Termos de uso do painel, aceitos no primeiro acesso a ele.

import { pendencias } from "./termos-texto.js";

export const MODELO_SITE = "site-v1";

/** A Renderiza no termo (o CPF em parte; o número completo e o endereço vão no comprovante, pela coluna contratada). */
const RENDERIZA = "Kaue de Almeida Cunha, inscrito no CPF sob o nº •••.406.148-••, com endereço em São Paulo/SP, que atua com o nome "
  + "Renderiza (renderizaweb.com.br), e-mail contato@renderizaweb.com.br e WhatsApp (11) 98869-7165";
/** Os Termos de uso do Painel Renderiza (painel-clientes/publico/termos): o contrato do painel, aceito no primeiro acesso. */
export const TERMOS_DO_PAINEL = "painel.renderizaweb.com.br/termos";

export const TIPOS_DE_CONTRATANTE = [
  { id: "pf_ou_pj", nome: "Pessoa física ou empresa (quem assina escolhe)" },
  { id: "pf", nome: "Só pessoa física (CPF)" },
  { id: "pj", nome: "Só empresa (CNPJ e razão social)" },
];
export const PAGAMENTOS = [
  { id: "entrega", nome: "Tudo na aprovação (nada antes)" },
  { id: "integral", nome: "Tudo na assinatura" },
  { id: "metade", nome: "50% na assinatura e 50% na aprovação" },
  { id: "outro", nome: "Outra forma (escrever)" },
];
/** Se o cliente desistir depois dos 7 dias e antes de aprovar o site. */
export const CANCELAMENTOS = [
  { id: "metade_apos_versao", nome: "Sem custo até a versão para aprovação; depois dela, metade do preço" },
  { id: "sem_custo", nome: "Sem custo em qualquer momento antes de aprovar" },
];
export const HOSPEDAGENS = [
  { id: "cloudflare", nome: "Cloudflare Pages (grátis, permite uso comercial)" },
  { id: "vercel", nome: "Vercel (uso comercial pede o plano pago)" },
];
export const DOMINIOS = [
  { id: "cliente_tem", nome: "O cliente já tem domínio (sem custo, só aponta)" },
  { id: "registrar_incluido", nome: "A Renderiza registra no nome dele, 1º ano incluído" },
  { id: "registrar_adiantado", nome: "A Renderiza registra no nome dele; 1º ano incluído no preço e adiantado na assinatura" },
  { id: "registrar_cliente", nome: "O cliente registra e paga" },
];
export const PAINEL = [
  { id: "opcional", nome: "Opcional: o cliente escolhe na assinatura" },
  { id: "incluido", nome: "Contratado junto com o site" },
  { id: "nao", nome: "Não oferecer neste termo" },
];

/** Os campos do modelo, na ordem da tela. tipo: "texto" | "linhas" (um item por linha) | "valor" | "numero" | "opcoes". */
export const CAMPOS_DO_SITE = [
  { id: "projeto", rotulo: "Nome do projeto", tipo: "texto", dica: "Vira o título do termo. Ex.: Site da Ricardo Motors" },
  { id: "contratante", rotulo: "Quem contrata", tipo: "texto", dica: "Quem assina declara ser isto. Ex.: Ricardo Neves, responsável pela Ricardo Motors" },
  { id: "tipo_contratante", rotulo: "Contrata como", tipo: "opcoes", opcoes: TIPOS_DE_CONTRATANTE },
  { id: "referencia", rotulo: "Referência aprovada", tipo: "texto", dica: "Ex.: a demonstração em renderizaweb.com.br/demo/ricardo-motors (vazio: sem referência)" },
  { id: "escopo", rotulo: "O que é entregue (opcional)", tipo: "linhas", dica: "Uma ou duas linhas, se precisar destacar algo. O site no modelo da referência, celular, prévia e publicação já entram sozinhos." },
  { id: "fora_do_escopo", rotulo: "O que não está incluído (opcional)", tipo: "linhas", dica: "Só o que o cliente pode achar que está incluído. Manutenção, conteúdo e anúncios já entram sozinhos." },
  { id: "condicoes", rotulo: "Condições deste cliente (opcional)", tipo: "linhas", dica: "Um item por linha, só se houver algo próprio deste projeto (vira uma cláusula)." },
  { id: "valor", rotulo: "Valor do site", tipo: "valor", dica: "Ex.: 399 ou 1.200,00" },
  { id: "pagamento", rotulo: "Pagamento", tipo: "opcoes", opcoes: PAGAMENTOS },
  { id: "pagamento_outro", rotulo: "Pagamento (outra forma)", tipo: "texto", dica: "Ex.: em duas parcelas, na assinatura e na aprovação", so: c => c.pagamento === "outro" },
  { id: "cancelamento", rotulo: "Se desistir no meio do caminho", tipo: "opcoes", opcoes: CANCELAMENTOS },
  { id: "prazo", rotulo: "Prazo (dias úteis)", tipo: "numero", dica: "Contados do material completo" },
  { id: "garantia", rotulo: "Garantia (dias corridos)", tipo: "numero", dica: "Contra defeitos, depois da entrega" },
  { id: "dominio_situacao", rotulo: "Domínio", tipo: "opcoes", opcoes: DOMINIOS },
  { id: "dominio_valor", rotulo: "Adiantamento para o domínio (parte do preço)", tipo: "valor", dica: "Pago na assinatura para registrar o domínio; o restante do preço vai na aprovação. Ex.: 40", so: c => c.dominio_situacao === "registrar_adiantado" },
  { id: "dominio", rotulo: "Endereço do domínio (opcional)", tipo: "texto", dica: "Ex.: ricardomotors.com.br (vazio: o que o cliente tiver ou escolher)" },
  { id: "hospedagem", rotulo: "Hospedagem", tipo: "opcoes", opcoes: HOSPEDAGENS },
  { id: "painel", rotulo: "Painel Renderiza", tipo: "opcoes", opcoes: PAINEL },
  { id: "painel_modulos", rotulo: "Módulos combinados (opcional)", tipo: "texto", dica: "Ex.: Meu site e Estoque. Vazio: os que ele escolher no painel. Ele pode mudar depois.", so: c => c.painel !== "nao" },
  { id: "painel_preco", rotulo: "Painel a partir de (por mês)", tipo: "valor", dica: "O valor de hoje do plano, como nos Termos de uso do painel", so: c => c.painel !== "nao" },
  { id: "painel_inicio", rotulo: "1ª mensalidade do painel (opcional)", tipo: "texto", dica: "Ex.: 30 dias depois da entrega. Vazio: como nos Termos de uso do painel.", so: c => c.painel !== "nao" },
  { id: "foro", rotulo: "Foro (cidade/UF)", tipo: "texto" },
];

export const PADRAO_DO_SITE = {
  projeto: "", contratante: "", tipo_contratante: "pf_ou_pj", referencia: "", escopo: "", fora_do_escopo: "", condicoes: "",
  valor: "", pagamento: "entrega", pagamento_outro: "", cancelamento: "metade_apos_versao", prazo: "10", garantia: "30", dominio_situacao: "cliente_tem", dominio: "", dominio_valor: "40",
  hospedagem: "cloudflare", painel: "opcional", painel_modulos: "", painel_preco: "49", painel_inicio: "", foro: "São Paulo/SP",
};

const limpo = v => String(v == null ? "" : v).replace(/\s+/g, " ").trim();
const linhas = v => String(v == null ? "" : v).split(/\r?\n/).map(l => l.replace(/^\s*[-•*]\s*/, "").replace(/\s+/g, " ").trim()).filter(Boolean);
const pendente = rotulo => `[[${rotulo}]]`;
const daLista = (lista, id, padrao) => (lista.some(o => o.id === id) ? id : padrao);

/** "399", "399,9", "1.200,50", "R$ 1200" → 1200.5; vazio ou inválido → null. */
export function lerReais(v) {
  const s = String(v == null ? "" : v).replace(/R\$\s*/i, "").replace(/\s+/g, "").trim();
  if (!s) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = /,/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s) ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
/** 1200.5 → "R$ 1.200,50". */
export const reais = n => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inteiro = (v, min, max) => { const n = Number(String(v == null ? "" : v).trim()); return Number.isInteger(n) && n >= min && n <= max ? n : null; };

/** Os campos completos (os que faltam com o padrão do modelo), já limpos. Campos da primeira versão viram os novos. */
export function camposDoSite(campos = {}) {
  const antigo = campos && !campos.dominio_situacao && campos.dominio_primeiro_ano
    ? { dominio_situacao: campos.dominio_primeiro_ano === "contratante" ? "registrar_cliente" : "registrar_incluido" } : {};
  const c = { ...PADRAO_DO_SITE, ...campos, ...antigo };
  delete c.dominio_primeiro_ano;
  return {
    ...c,
    tipo_contratante: daLista(TIPOS_DE_CONTRATANTE, c.tipo_contratante, "pf_ou_pj"),
    pagamento: daLista(PAGAMENTOS, c.pagamento, "entrega"),
    cancelamento: daLista(CANCELAMENTOS, c.cancelamento, "metade_apos_versao"),
    hospedagem: daLista(HOSPEDAGENS, c.hospedagem, "cloudflare"),
    dominio_situacao: daLista(DOMINIOS, c.dominio_situacao, "cliente_tem"),
    painel: daLista(PAINEL, c.painel, "opcional"),
  };
}

/** "a partir de R$ 49,00 por mês" (ou nada, sem valor). */
const precoDoPainel = c => { const p = lerReais(c.painel_preco); return p ? `a partir de ${reais(p)} por mês` : ""; };

/** As opções para escolher na assinatura: com ou sem o painel (só quando o painel é opcional). */
export function opcoesDoSite(campos) {
  const c = camposDoSite(campos);
  if (c.painel !== "opcional") return [];
  const preco = precoDoPainel(c);
  return [
    { id: "com-painel", nome: "Site + Painel Renderiza", detalhe: `Assinatura mensal à parte${preco ? `, ${preco}` : ""}, com os módulos que você escolher. Sem fidelidade.` },
    { id: "so-site", nome: "Só o site", detalhe: "Depois da entrega, cada alteração é orçada à parte." },
  ];
}

/** Monta o termo: { modelo, titulo, texto, opcoes, tipo_contratante }. O que falta vira [[pendência]] no texto. */
export function montarTermoDoSite(campos = {}) {
  const c = camposDoSite(campos);
  const projeto = limpo(c.projeto) || pendente("nome do projeto");
  const contratante = limpo(c.contratante) || pendente("quem contrata");
  const referencia = limpo(c.referencia);
  const valor = lerReais(c.valor);
  const prazo = inteiro(c.prazo, 1, 365);
  const garantia = inteiro(c.garantia, 1, 3650);
  const dominio = limpo(c.dominio).toLowerCase();
  const hospedagem = c.hospedagem === "vercel" ? "Vercel" : "Cloudflare Pages";
  const comPainel = c.painel !== "nao";
  const modulos = limpo(c.painel_modulos);
  const escopo = linhas(c.escopo);
  const fora = linhas(c.fora_do_escopo);
  const condicoes = linhas(c.condicoes);
  const dom = c.dominio_situacao;
  const opcoes = opcoesDoSite(c);
  const VALOR = valor ? reais(valor) : pendente("valor do site");
  const PRAZO = prazo || pendente("prazo");
  const GARANTIA = garantia || pendente("garantia");

  // As cláusulas, na ordem; a numeração (e as referências "cláusula N") sai daqui.
  const chaves = ["partes", "objeto", "prazo", "preco", "onde", "depois", "garantia",
    ...(comPainel ? ["painel"] : []), ...(condicoes.length ? ["condicoes"] : []),
    "limites", "propriedade", "desistencia", "assinatura", "foro"];
  const n = Object.fromEntries(chaves.map((k, i) => [k, i + 1]));
  const cl = k => `cláusula ${n[k]}`;

  const metade = valor ? Math.round(valor * 50) / 100 : 0;
  const METADE = valor ? reais(metade) : "metade do preço";
  const antecipado = c.pagamento === "integral" || c.pagamento === "metade" || c.pagamento === "outro"; // pode ter pago antes da entrega
  // O domínio adiantado (24/11/2026): o 1º ano do domínio está INCLUÍDO no preço, e essa parte é adiantada na
  // assinatura, para o registro; o restante, na aprovação. Só faz diferença com o pagamento "na aprovação".
  const valorDoDominio = lerReais(c.dominio_valor);
  const VALOR_DO_DOMINIO = valorDoDominio ? reais(valorDoDominio) : pendente("valor do adiantamento");
  const adiantaDominio = dom === "registrar_adiantado" && c.pagamento === "entrega";
  const restante = valor && valorDoDominio && valorDoDominio < valor ? Math.round((valor - valorDoDominio) * 100) / 100 : null;
  const RESTANTE = restante ? reais(restante) : "o restante";
  const comoPaga = {
    entrega: adiantaDominio
      ? `**${VALOR_DO_DOMINIO} são adiantados** em até 2 dias úteis depois da assinatura, para registrar o domínio (${cl("onde")}); **o restante, ${RESTANTE}, só na aprovação:** a Renderiza mostra o site pronto num endereço de prévia; aprovado, o Contratante paga em até 2 dias úteis, e a Renderiza publica o site no domínio dele e passa os acessos.`
      : "**Nada é pago antes da entrega:** a Renderiza mostra o site pronto num endereço de prévia; aprovado, o Contratante paga em até 2 dias úteis, e a Renderiza publica o site no domínio dele e passa os acessos.",
    integral: "O pagamento é em parcela única, em até 2 dias úteis depois da assinatura.",
    metade: `O pagamento é em duas parcelas: ${METADE} em até 2 dias úteis depois da assinatura e o restante na aprovação, antes da publicação.`,
    outro: `O pagamento é ${limpo(c.pagamento_outro).replace(/\.$/, "") || pendente("forma de pagamento")}.`,
  }[c.pagamento];
  const pagamentoCurto = { entrega: adiantaDominio ? `por Pix: ${VALOR_DO_DOMINIO} na assinatura, para registrar o domínio, e ${RESTANTE} na aprovação do site` : "por Pix, só na aprovação (nada antes)", integral: "por Pix, na assinatura", metade: "por Pix, metade na assinatura e metade na aprovação",
    outro: limpo(c.pagamento_outro) || pendente("forma de pagamento") }[c.pagamento];
  const contaDoPrazo = c.pagamento === "integral" ? " e do pagamento" : c.pagamento === "metade" ? " e da primeira parcela" : "";
  const tipo = {
    pf: "Contrata em nome próprio, como pessoa física.",
    pj: "Assina em nome da empresa informada na assinatura (razão social e CNPJ), que é a Contratante, e declara ter poderes para isso.",
    pf_ou_pj: "Se informar uma empresa (razão social e CNPJ) na assinatura, assina em nome dela, que passa a ser a Contratante, e declara ter poderes para isso; se não, contrata como pessoa física.",
  }[c.tipo_contratante];
  const oDominio = dominio ? `o domínio **${dominio}**` : dom === "cliente_tem" ? "o domínio que o Contratante já tem" : "o domínio escolhido pelo Contratante";
  const clausulaDoDominio = {
    cliente_tem: `**Domínio:** o site é publicado n${oDominio}, que continua sob a responsabilidade dele (a conta, os pagamentos e a renovação). Ele dá o acesso necessário para apontar o domínio para o site.`,
    registrar_incluido: `**Domínio:** ${oDominio} é registrado no nome do Contratante, com o primeiro ano incluído no preço. A partir do segundo ano, a renovação é dele, direto com o registro de domínios, e a Renderiza não responde por domínio vencido ou perdido por falta de renovação.`,
    registrar_adiantado: `**Domínio:** ${oDominio} é registrado pela Renderiza no nome do Contratante, com os dados informados na assinatura (CPF ou CNPJ), e o primeiro ano está incluído no preço${adiantaDominio ? ` (é o adiantamento de ${VALOR_DO_DOMINIO}, ${cl("preco")})` : ""}. Registrado, o domínio é do Contratante, mesmo que este termo seja cancelado. A partir do segundo ano, a renovação é dele, direto com o registro de domínios, e a Renderiza não responde por domínio vencido ou perdido por falta de renovação.`,
    registrar_cliente: `**Domínio:** ${oDominio} é registrado e pago pelo Contratante, no nome dele, assim como a renovação anual. A Renderiza não responde por domínio vencido ou perdido por falta de renovação.`,
  }[dom];

  const t = [];
  const bloco = (...ls) => { t.push(...ls, ""); };
  const lista = (itens, numerada = false) => itens.map((s, i) => (numerada ? `${i + 1}. ` : "- ") + s);

  bloco("# Em poucas palavras");
  bloco(...lista([
    `**O que você recebe:** o ${projeto}, pronto e publicado no seu domínio${referencia ? `, seguindo ${referencia}` : ""}.`,
    `**Valor:** ${VALOR}, ${pagamentoCurto}.`,
    ...(dom === "registrar_adiantado" ? ["**Domínio:** registrado no seu nome, com o 1º ano incluído no preço."] : []),
    `**Prazo:** até ${PRAZO} dias úteis depois do material completo.`,
    "**Tudo fica no seu nome:** o código, a hospedagem e o domínio.",
    `**Depois da entrega:** sem manutenção incluída e ${GARANTIA} dias de garantia contra defeitos.`,
    ...(comPainel ? [`**Painel Renderiza${c.painel === "opcional" ? " (opcional)" : ""}:** assinatura à parte${precoDoPainel(c) ? `, ${precoDoPainel(c)}` : ""}, com os módulos que você escolher.`] : []),
    c.cancelamento === "sem_custo" ? "**Desistência:** a qualquer momento antes de aprovar o site, sem custo."
      : adiantaDominio ? "**Desistência:** até 7 dias depois de assinar, sem custo. Depois, e antes de aprovar o site: só o adiantamento do domínio, se a versão para aprovação ainda não foi enviada; se já foi, metade do preço."
      : "**Desistência:** até 7 dias depois de assinar, sem custo. Depois, e antes de aprovar o site: sem custo se a versão para aprovação ainda não foi enviada; se já foi, metade do preço.",
  ]));
  bloco("O resumo ajuda a ler; o que vale são as cláusulas abaixo.");

  bloco(`# ${n.partes}. As partes`);
  bloco(`**Contratada:** ${RENDERIZA}, aqui chamado de **Renderiza**. O CPF aparece em parte para proteger o dado; o número completo e o endereço vão no comprovante da assinatura, enviado por e-mail.`);
  bloco(`**Contratante:** quem assina este termo ao final, identificado pelos dados informados na assinatura, que declara ser ${contratante}. ${tipo}`);

  bloco(`# ${n.objeto}. O que a Renderiza entrega`);
  // "a demonstração…" → "da demonstração…"; "o site…" → "do site…"; outro começo → "de …"
  const daReferencia = /^(a|o)s? /i.test(referencia) ? "d" + referencia : "de " + referencia;
  bloco(`A Renderiza cria e publica o **${projeto}**${referencia ? `, no modelo ${daReferencia}, com os ajustes da ${cl("prazo")}` : ""}. Inclui:`);
  bloco(...lista([
    ...escopo,
    "As páginas e seções combinadas, com os textos, as fotos e os contatos do Contratante.",
    "A versão para celular e para computador, com o endereço seguro (HTTPS) e a prévia com foto quando o link é compartilhado.",
    `A publicação no domínio do Contratante e a passagem de todos os acessos (${cl("onde")}).`,
  ]));
  bloco("Não inclui:");
  bloco(...lista([...fora.map(f => (/[.!?]$/.test(f) ? f : f + ".")), `Manutenção e alterações depois da entrega (${cl("depois")}).`, "Produção de conteúdo, anúncios e redes sociais.",
    ...(c.painel === "opcional" ? [`O Painel Renderiza, que é à parte (${cl("painel")}).`] : [])]));

  bloco(`# ${n.prazo}. Prazo, ajustes e aprovação`);
  bloco(...lista([
    `O Contratante envia o material (textos, fotos, logotipo, informações${dom === "cliente_tem" ? " e o acesso ao domínio" : ""}) em até 5 dias úteis depois da assinatura.`,
    `A Renderiza manda a versão para aprovação (o site pronto, num endereço de prévia) em até **${PRAZO} dias úteis**, contados do material completo${contaDoPrazo}. Atraso do Contratante em mandar o material ou responder estende o prazo pelo mesmo tempo.`,
    `Está incluída **uma rodada de ajustes**, com a lista do que mudar mandada de uma vez. Página nova, função nova ou outro layout são trabalho novo (${cl("depois")}).`,
    `A aprovação é por escrito (WhatsApp ou e-mail: "pode publicar"). Sem resposta em 10 dias úteis depois da versão ajustada, a entrega é considerada aprovada. Aprovada${c.pagamento === "entrega" || c.pagamento === "metade" ? " e paga" : ""}, a Renderiza publica o site e passa os acessos: isso é a **entrega**.`,
  ], true));

  bloco(`# ${n.preco}. Preço e pagamento`);
  bloco(`O preço é de **${VALOR}**, fechado para o que está incluído, pago por Pix na conta indicada pela Renderiza, com recibo. ${comoPaga}${dom === "registrar_incluido" ? " O preço inclui o registro do domínio por 1 ano." : ""} Atraso gera multa de 2% e juros de 1% ao mês; com mais de 10 dias, a Renderiza pode parar o trabalho ou não publicar o site até o pagamento.`);

  bloco(`# ${n.onde}. Onde o site fica: tudo no nome do Contratante`);
  bloco(...lista([
    `O site é **estático** (páginas, imagens e código, sem banco de dados). O código fica num repositório privado no GitHub e a hospedagem no ${hospedagem}, nas contas do Contratante; cada mudança enviada ao repositório vai ao ar sozinha.${c.hospedagem === "vercel" ? " Na Vercel, o uso comercial pede o plano pago, contratado pelo Contratante." : ""}`,
    clausulaDoDominio,
    "Na entrega, a Renderiza passa todos os acessos ao Contratante (nunca por mensagem de texto); depois, só mantém algum acesso se ele quiser. Essas contas são de serviços de outras empresas, com termos e preços próprios, e o Contratante pode levar o site para outra hospedagem quando quiser.",
  ], true));

  bloco(`# ${n.depois}. Depois da entrega: sem manutenção incluída`);
  bloco(`Este termo é de **entrega única**: não inclui manutenção, atualizações, monitoramento, cópias de segurança nem suporte contínuo, além da garantia (${cl("garantia")}). Alterações depois da entrega são trabalho novo, orçado antes e feito só com aprovação por escrito${comPainel ? `, ou feitas pelo próprio Contratante no Painel Renderiza, se contratado (${cl("painel")})` : ""}. Como o código e as contas são dele, ele também pode pedir a outra pessoa; a Renderiza não responde por alterações de terceiros.`);

  bloco(`# ${n.garantia}. Garantia`);
  bloco(`Por **${GARANTIA} dias** depois da entrega, a Renderiza corrige sem custo os **defeitos** do que entregou (página que não abre, link ou botão que não funciona, parte que não aparece direito no celular). Não cobre mudanças pedidas depois, nem problemas causados por alterações de terceiros ou por falhas dos serviços de outras empresas. Esta garantia não reduz as que a lei dá ao Contratante.`);

  if (comPainel) {
    bloco(`# ${n.painel}. Painel Renderiza`);
    bloco(...lista([
      `O **Painel Renderiza** (painel.renderizaweb.com.br) é um serviço à parte, por assinatura mensal e sem fidelidade, regido pelos **Termos de uso do painel** (${TERMOS_DO_PAINEL}), que o Contratante aceita no primeiro acesso. Este termo não muda aqueles.`,
      `O plano, os módulos e o valor são os dos Termos de uso${precoDoPainel(c) ? ` (hoje, ${precoDoPainel(c)})` : ""}. ${modulos ? `Para este site, os módulos combinados são: ${modulos}. ` : ""}${limpo(c.painel_inicio) ? `A primeira mensalidade vence ${limpo(c.painel_inicio).replace(/\.$/, "")}. ` : ""}O Contratante liga ou desliga módulos quando quiser, e o valor acompanha.`,
      c.painel === "opcional" ? "O Contratante diz na assinatura deste termo se quer o painel; pode contratar depois ou cancelar quando quiser."
        : "O painel é contratado junto com o site; o Contratante pode cancelar quando quiser.",
      "O site não depende do painel. Se o painel for cancelado, o site volta à versão entregue, como nos Termos de uso do painel.",
    ], true));
  }

  if (condicoes.length) {
    bloco(`# ${n.condicoes}. Condições deste projeto`);
    bloco(...lista(condicoes, true));
  }

  bloco(`# ${n.limites}. Responsabilidades e limites`);
  bloco(`O Contratante responde pelo que manda publicar (textos, fotos, preços, informações, nomes e marcas) e por ter o direito de usar cada um. O site é uma vitrine: a Renderiza não garante vendas, contatos nem posição no Google, e não responde por falhas ou mudanças de serviços de outras empresas (GitHub, ${hospedagem}, domínio, Google, WhatsApp). No que a lei permitir, a responsabilidade da Renderiza fica limitada ao valor pago por este termo, sem lucros cessantes ou danos indiretos, salvo dolo ou culpa grave.`);

  bloco(`# ${n.propriedade}. De quem é o site`);
  bloco("Pago o preço, o site feito para o Contratante (código, layout e textos) é dele; o conteúdo dele sempre foi dele. Componentes genéricos que a Renderiza usa em outros projetos continuam dela, com uso livre neste site. A Renderiza só mostra o site no portfólio com autorização.");

  bloco(`# ${n.desistencia}. Desistência e cancelamento`);
  const devolve = antecipado ? " O que tiver pago além disso volta em até 10 dias." : "";
  const custoAntes = adiantaDominio
    ? (c.cancelamento === "sem_custo" ? "O custo é só o adiantamento do domínio, que fica com ele."
      : `Se a Renderiza ainda não tiver mandado a versão para aprovação (${cl("prazo")}), o custo é só o adiantamento do domínio, que fica com ele; se já tiver mandado, o Contratante paga metade do preço (${METADE}), já contado o adiantamento, pelo trabalho feito.`)
    : c.cancelamento === "sem_custo" ? "Não há custo."
      : `Se a Renderiza ainda não tiver mandado a versão para aprovação (${cl("prazo")}), não há custo; se já tiver mandado, o Contratante paga metade do preço (${METADE}) pelo trabalho feito.`;
  bloco(...lista([
    `**Nos 7 dias depois da assinatura:** o Contratante pode desistir deste termo sem dar motivo e sem nenhum custo${antecipado || adiantaDominio ? "; o que tiver pago volta em até 10 dias" : ""}.`,
    `**Depois disso e antes de aprovar o site:** pode cancelar avisando por escrito. ${custoAntes}${devolve} Cancelado, o site não é entregue nem publicado.`,
    "**Depois da aprovação**, o preço é devido por inteiro.",
    "Se o Contratante não mandar o material ou não responder por mais de 30 dias, a Renderiza pode encerrar o termo, com a mesma regra do item 2. Qualquer parte também pode encerrar por descumprimento grave da outra, não corrigido em 10 dias depois do aviso.",
  ], true));

  bloco(`# ${n.assinatura}. Dados, avisos e assinatura eletrônica`);
  bloco(`Os dados informados na assinatura são usados só para este termo. Os avisos valem pelo e-mail ou WhatsApp de cada parte. O termo é assinado eletronicamente: a Renderiza concorda ao publicá-lo, e ele se forma com o aceite do Contratante, que confirma o e-mail com um código de 6 números. Ficam registrados os dados informados${opcoes.length ? ", a opção escolhida" : ""}, a data e a hora, o IP, o aparelho e a impressão digital (SHA-256) deste texto, e o comprovante vai ao e-mail do Contratante, com cópia para a Renderiza (Medida Provisória 2.200-2/2001, art. 10, § 2º).`);

  bloco(`# ${n.foro}. Foro`);
  t.push(`Fica escolhido o foro da Comarca de ${limpo(c.foro) || pendente("foro")} para qualquer questão deste termo.`);

  return { modelo: MODELO_SITE, titulo: `Termo de contratação · ${projeto}`, texto: t.join("\n"), opcoes, tipo_contratante: c.tipo_contratante };
}

/** "Ricardo Motors | RM Consult Car" → "ricardo-motors". */
export function baseDoId(empresa) {
  const s = String(empresa || "").split(/[|·(/]/)[0].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return s.length >= 3 ? s : "termo";
}
/** O id da próxima versão: "ricardo-motors-v1", ou "-v2" se a v1 já existe (entre os ids de `existentes`). */
export function idDoTermo(empresa, existentes = []) {
  const base = baseDoId(empresa);
  const re = new RegExp(`^${base}-v(\\d+)$`);
  const versoes = existentes.map(id => re.exec(String(id))).filter(Boolean).map(m => Number(m[1]));
  return `${base}-v${versoes.length ? Math.max(...versoes) + 1 : 1}`;
}

/** O começo dos campos a partir do lead: o projeto com o nome da empresa, a demo como referência, o valor fechado. */
export function camposDoLead(lead = {}) {
  const empresa = limpo(String(lead.empresa || "").split("|")[0]);
  const demo = limpo(lead.link_demo).replace(/^https?:\/\/(www\.)?renderizaweb\.com\.br/i, "");
  const valor = lead.valor_fechado || lead.valor_potencial;
  return camposDoSite({
    projeto: empresa ? `Site da ${empresa}` : "",
    referencia: /^\/demo\/[a-z0-9-]+/i.test(demo) ? `a demonstração em renderizaweb.com.br${demo.replace(/\/+$/, "")}` : "",
    valor: valor ? String(valor).replace(".", ",") : "",
  });
}

/**
 * Situação do termo para o card: "rascunho" (fechado, nunca assinado, com ou sem pendência), "aberto", "assinado"
 * (tem assinatura) ou "fechado" (fechado depois de aberto ou assinado). `aceites`: as assinaturas desse termo.
 */
export function situacaoDoTermo(termo, aceites = []) {
  if (!termo) return { id: "nenhum", nome: "Sem termo" };
  const falta = pendencias(termo.texto);
  if (aceites.length) return { id: "assinado", nome: aceites.length > 1 ? `Assinado ${aceites.length} vezes` : "Assinado", falta };
  if (termo.aberto) return { id: "aberto", nome: "Aberto para assinar", falta };
  return { id: "rascunho", nome: falta.length ? `Rascunho · falta ${falta.length}` : "Rascunho · pronto para abrir", falta };
}

/** O link público do termo. */
export const linkDoTermo = (id, origem = "https://www.renderizaweb.com.br") => `${origem.replace(/\/+$/, "")}/termo/${id}`;
