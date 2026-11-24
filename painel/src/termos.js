// Termo de aceite de um lead (seção "Termo de aceite" do card, no painel de prospecção): o modelo base do site e o
// que muda de cliente para cliente. Sem tela e sem banco (testado em test/termos.test.mjs); a tela fica em
// termos-ui.js e o banco em supabase/termos-online.sql. O texto sai na marcação de termos-texto.js e é ele, exato,
// que o banco guarda, mostra em /termo/<id> e cuja impressão (SHA-256) a pessoa assina. Regras e como adaptar:
// docs/termos/README.md.
//
// O modelo "site-v1" é a base geral de quem fecha um site: entrega única, sem manutenção incluída, tudo nas contas do
// cliente (código no GitHub, hospedagem no Cloudflare Pages ou na Vercel, domínio no Registro.br), a renovação do
// domínio por conta dele, a garantia contra defeitos, os limites de responsabilidade e o Painel Renderiza como serviço à
// parte (opcional). O que é do cliente entra pelos campos (o que é entregue, valor, prazo, condições próprias); o texto
// final ainda pode ser ajustado à mão antes de abrir para assinatura.

import { pendencias } from "./termos-texto.js";

export const MODELO_SITE = "site-v1";

/** A Renderiza no termo (o CPF em parte; o número completo e o endereço vão no comprovante, pela coluna contratada). */
const RENDERIZA = "Kaue de Almeida Cunha, inscrito no CPF sob o nº •••.406.148-••, com endereço em São Paulo/SP, que atua com o nome "
  + "Renderiza (renderizaweb.com.br), e-mail contato@renderizaweb.com.br e WhatsApp (11) 98869-7165";

export const TIPOS_DE_CONTRATANTE = [
  { id: "pf_ou_pj", nome: "Pessoa física ou empresa (quem assina escolhe)" },
  { id: "pf", nome: "Só pessoa física (CPF)" },
  { id: "pj", nome: "Só empresa (CNPJ e razão social)" },
];
export const PAGAMENTOS = [
  { id: "integral", nome: "Tudo na assinatura" },
  { id: "metade", nome: "50% na assinatura e 50% na entrega" },
  { id: "entrega", nome: "Tudo na entrega" },
  { id: "outro", nome: "Outra forma (escrever)" },
];
export const HOSPEDAGENS = [
  { id: "cloudflare", nome: "Cloudflare Pages (grátis, permite uso comercial)" },
  { id: "vercel", nome: "Vercel (uso comercial pede o plano pago)" },
];
export const DOMINIO_PRIMEIRO_ANO = [
  { id: "incluido", nome: "1º ano incluído no preço (a Renderiza paga)" },
  { id: "contratante", nome: "Pago pelo cliente desde o 1º ano" },
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
  { id: "escopo", rotulo: "O que é entregue", tipo: "linhas", dica: "Um item por linha. Celular, prévia do link, Google e a publicação já entram sozinhos." },
  { id: "fora_do_escopo", rotulo: "O que não está incluído (além do padrão)", tipo: "linhas", dica: "Um item por linha. Manutenção, conteúdo e anúncios já entram sozinhos." },
  { id: "condicoes", rotulo: "Condições deste cliente", tipo: "linhas", dica: "Um item por linha: o que é só deste projeto (vira uma cláusula própria)." },
  { id: "valor", rotulo: "Valor do site", tipo: "valor", dica: "Ex.: 399 ou 1.200,00" },
  { id: "pagamento", rotulo: "Pagamento", tipo: "opcoes", opcoes: PAGAMENTOS },
  { id: "pagamento_outro", rotulo: "Pagamento (outra forma)", tipo: "texto", dica: "Continua a frase \"por Pix, para a conta indicada pela Renderiza, …\"", so: c => c.pagamento === "outro" },
  { id: "prazo", rotulo: "Prazo (dias úteis)", tipo: "numero", dica: "Contados do material completo" },
  { id: "garantia", rotulo: "Garantia (dias corridos)", tipo: "numero", dica: "Contra defeitos, depois da entrega" },
  { id: "dominio", rotulo: "Domínio", tipo: "texto", dica: "Ex.: ricardomotors.com.br (vazio: o que o cliente escolher)" },
  { id: "dominio_primeiro_ano", rotulo: "Primeiro ano do domínio", tipo: "opcoes", opcoes: DOMINIO_PRIMEIRO_ANO },
  { id: "hospedagem", rotulo: "Hospedagem", tipo: "opcoes", opcoes: HOSPEDAGENS },
  { id: "painel", rotulo: "Painel Renderiza", tipo: "opcoes", opcoes: PAINEL },
  { id: "painel_modulos", rotulo: "Módulos do painel", tipo: "texto", dica: "Ex.: Meu site e Estoque", so: c => c.painel !== "nao" },
  { id: "painel_preco", rotulo: "Mensalidade do painel", tipo: "valor", dica: "Ex.: 49", so: c => c.painel !== "nao" },
  { id: "painel_inicio", rotulo: "Primeira mensalidade vence", tipo: "texto", dica: "Continua a frase \"A primeira mensalidade vence …\"", so: c => c.painel !== "nao" },
  { id: "foro", rotulo: "Foro (cidade/UF)", tipo: "texto" },
];

export const PADRAO_DO_SITE = {
  projeto: "", contratante: "", tipo_contratante: "pf_ou_pj", referencia: "", escopo: "", fora_do_escopo: "", condicoes: "",
  valor: "", pagamento: "integral", pagamento_outro: "", prazo: "10", garantia: "30", dominio: "", dominio_primeiro_ano: "incluido",
  hospedagem: "cloudflare", painel: "opcional", painel_modulos: "Meu site", painel_preco: "49", painel_inicio: "no mês seguinte à entrega",
  foro: "São Paulo/SP",
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

/** Os campos completos (os que faltam com o padrão do modelo), já limpos. */
export function camposDoSite(campos = {}) {
  const c = { ...PADRAO_DO_SITE, ...campos };
  return {
    ...c,
    tipo_contratante: daLista(TIPOS_DE_CONTRATANTE, c.tipo_contratante, "pf_ou_pj"),
    pagamento: daLista(PAGAMENTOS, c.pagamento, "integral"),
    hospedagem: daLista(HOSPEDAGENS, c.hospedagem, "cloudflare"),
    dominio_primeiro_ano: daLista(DOMINIO_PRIMEIRO_ANO, c.dominio_primeiro_ano, "incluido"),
    painel: daLista(PAINEL, c.painel, "opcional"),
  };
}

/** As opções para escolher na assinatura: com ou sem o painel (só quando o painel é opcional). */
export function opcoesDoSite(campos) {
  const c = camposDoSite(campos);
  if (c.painel !== "opcional") return [];
  const preco = lerReais(c.painel_preco);
  const modulos = limpo(c.painel_modulos);
  return [
    { id: "com-painel", nome: `Site com o Painel Renderiza${preco ? ` · ${reais(preco)} por mês` : ""}`, detalhe: modulos ? `${modulos}, para você mesmo atualizar o site. Sem fidelidade.` : "Sem fidelidade." },
    { id: "so-site", nome: "Só o site, sem o painel", detalhe: "Depois da entrega, cada alteração é orçada à parte." },
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
  const painelPreco = lerReais(c.painel_preco);
  const painelModulos = limpo(c.painel_modulos);
  const escopo = linhas(c.escopo);
  const fora = linhas(c.fora_do_escopo);
  const condicoes = linhas(c.condicoes);
  const domInc = c.dominio_primeiro_ano === "incluido";
  const opcoes = opcoesDoSite(c);
  const VALOR = valor ? reais(valor) : pendente("valor do site");

  // As cláusulas, na ordem; a numeração (e as referências "cláusula N") sai daqui.
  const chaves = ["partes", "objeto", "prazo", "preco", "onde", "dominio", "depois", "garantia",
    ...(comPainel ? ["painel"] : []), ...(condicoes.length ? ["condicoes"] : []),
    "conteudo", "propriedade", "dados", "desistencia", "avisos", "assinatura", "foro"];
  const n = Object.fromEntries(chaves.map((k, i) => [k, i + 1]));
  const cl = k => `cláusula ${n[k]}`;

  const pagamento = {
    integral: `em parcela única de ${VALOR}, em até 2 dias úteis depois da assinatura`,
    metade: valor ? `em duas parcelas: ${reais(Math.round(valor * 50) / 100)} (50%) em até 2 dias úteis depois da assinatura e ${reais(Math.round((valor - Math.round(valor * 50) / 100) * 100) / 100)} (50%) até o dia útil seguinte à aprovação da entrega (${cl("prazo")}), antes da publicação no domínio`
      : `em duas parcelas de 50%: a primeira em até 2 dias úteis depois da assinatura e a segunda até o dia útil seguinte à aprovação da entrega (${cl("prazo")})`,
    entrega: `em parcela única de ${VALOR}, até o dia útil seguinte à aprovação da entrega (${cl("prazo")}), antes da publicação no domínio`,
    outro: limpo(c.pagamento_outro) || pendente("forma de pagamento"),
  }[c.pagamento];
  const pagamentoCurto = {
    integral: "tudo na assinatura, por Pix", metade: "metade na assinatura e metade na entrega, por Pix",
    entrega: "tudo na entrega, por Pix", outro: limpo(c.pagamento_outro) || pendente("forma de pagamento"),
  }[c.pagamento];
  const contaDoPrazo = c.pagamento === "integral" ? " e do pagamento" : c.pagamento === "metade" ? " e do pagamento da primeira parcela" : "";
  const tipo = {
    pf: "Contrata em nome próprio, como pessoa física.",
    pj: "Assina em nome da empresa informada na assinatura (razão social e CNPJ), que é a Contratante, e declara ter poderes para isso.",
    pf_ou_pj: "Se informar uma empresa (razão social e CNPJ) na assinatura, assina em nome dela, que passa a ser a Contratante, e declara ter poderes para isso; se não informar, contrata em nome próprio, como pessoa física.",
  }[c.tipo_contratante];

  const t = [];
  const bloco = (...ls) => { t.push(...ls, ""); };
  const lista = (itens, numerada = false) => itens.map((s, i) => (numerada ? `${i + 1}. ` : "- ") + s);

  bloco("# Em poucas palavras");
  bloco(...lista([
    `**O que você recebe:** o ${projeto}, pronto e publicado no seu endereço${referencia ? `, seguindo ${referencia}` : ""}.`,
    `**Quanto e como paga:** ${VALOR}, ${pagamentoCurto}.`,
    `**Prazo:** até ${prazo || pendente("prazo")} dias úteis depois do material completo.`,
    `**Tudo fica no seu nome:** o código (GitHub), a hospedagem (${hospedagem}) e o domínio (Registro.br).`,
    `**Depois da entrega:** não há manutenção incluída; ${garantia || pendente("garantia")} dias de garantia contra defeitos; o domínio renova todo ano por sua conta${domInc ? ", a partir do 2º ano" : ""}.`,
    ...(comPainel ? [`**Painel Renderiza${c.painel === "opcional" ? " (opcional)" : ""}:** ${painelModulos ? painelModulos + ", " : ""}por ${painelPreco ? reais(painelPreco) : pendente("mensalidade do painel")} por mês, sem fidelidade, para você mesmo atualizar o site.`] : []),
    "**Desistência:** nos 7 primeiros dias depois da assinatura, sem custo.",
  ]));
  bloco("O resumo ajuda a ler; o que vale são as cláusulas abaixo.");

  bloco(`# ${n.partes}. As partes`);
  bloco(`**Contratada:** ${RENDERIZA}, aqui chamado de **Renderiza**. O CPF aparece em parte para proteger o dado nesta página; o número completo e o endereço vão no comprovante da assinatura, enviado por e-mail ao Contratante.`);
  bloco(`**Contratante:** a pessoa que assina este termo ao final, identificada pelo nome, CPF, endereço, e-mail e WhatsApp informados na assinatura, que declara ser ${contratante}, aqui chamado de **Contratante**. ${tipo}`);

  bloco(`# ${n.objeto}. O que a Renderiza entrega`);
  bloco(`A Renderiza vai criar e publicar o **${projeto}**, como descrito abaixo.${referencia ? ` A referência é ${referencia}: o site entregue segue esse modelo, com os ajustes da ${cl("prazo")}.` : ""} Se houver diferença entre o que foi conversado ou mostrado antes e este termo, vale este termo.`);
  bloco("## O que está incluído");
  bloco(...lista([
    ...(escopo.length ? escopo : [pendente("o que é entregue")]),
    "Versão para celular e para computador, com o endereço seguro (HTTPS).",
    "Prévia com foto quando o link é compartilhado (WhatsApp, Instagram) e o mapa do site para o Google (sitemap).",
    `A publicação no domínio do Contratante e a passagem de todos os acessos (${cl("onde")}).`,
  ]));
  bloco("## O que não está incluído");
  bloco(...lista([
    ...fora,
    `Manutenção, atualizações e alterações depois da entrega (${cl("depois")}).`,
    "Produção de conteúdo (textos novos, fotos, vídeos), anúncios pagos e gestão de redes sociais.",
    "E-mail com o domínio (como contato@…), que pode ser contratado à parte num serviço de e-mail.",
    ...(c.painel === "opcional" ? [`O Painel Renderiza, que é um serviço à parte, escolhido na assinatura (${cl("painel")}).`] : c.painel === "nao" ? ["O Painel Renderiza ou qualquer outro sistema para editar o site."] : []),
  ]));

  bloco(`# ${n.prazo}. Prazo, ajustes e aprovação`);
  bloco(...lista([
    `O Contratante envia o material em até 5 dias úteis depois da assinatura: textos, fotos, logotipo, informações do negócio e o que mais for pedido para o site. O registro do domínio é feito junto com a Renderiza (${cl("dominio")}).`,
    `A Renderiza entrega a versão para aprovação em até **${prazo || pendente("prazo")} dias úteis**, contados do recebimento do material completo${contaDoPrazo}. Pode entregar antes. Atraso do Contratante em enviar material, dar acesso ou responder estende o prazo pelo mesmo tempo.`,
    `Está incluída **uma rodada de ajustes**: sobre a versão para aprovação, o Contratante manda, em até 5 dias úteis, a lista completa do que quer mudar, de uma vez, e a Renderiza ajusta em até 5 dias úteis. Ajustes dentro do que está incluído (${cl("objeto")}), como trocar textos, fotos, ordem e cores, não têm custo. Página nova, função nova ou outro layout são trabalho novo (${cl("depois")}).`,
    "A aprovação é por escrito: uma mensagem no WhatsApp ou um e-mail dizendo \"pode publicar\" vale. Sem resposta em 10 dias úteis depois da versão ajustada, a entrega é considerada aprovada.",
    "Aprovada, a Renderiza publica o site no domínio do Contratante (ou num endereço provisório, enquanto o domínio não estiver pronto) e passa os acessos. Isso é a **entrega**.",
  ], true));

  bloco(`# ${n.preco}. Preço e pagamento`);
  bloco(...lista([
    `O preço é de **${VALOR}**, fechado para o que está incluído (${cl("objeto")}).`,
    `O pagamento é feito por Pix, para a conta indicada pela Renderiza, ${pagamento}. A Renderiza dá recibo de cada pagamento.`,
    `${domInc ? `O preço inclui o registro do domínio por 1 ano (${cl("dominio")}). ` : ""}A hospedagem no ${hospedagem} ${c.hospedagem === "vercel" ? "é contratada e paga pelo Contratante" : "não tem custo no plano gratuito"} (${cl("onde")}).`,
    "Atraso no pagamento gera multa de 2% e juros de 1% ao mês, proporcionais aos dias. Com mais de 10 dias de atraso, a Renderiza pode parar o trabalho até o pagamento, e o prazo para junto.",
  ], true));

  bloco(`# ${n.onde}. Onde o site fica: tudo no nome do Contratante`);
  bloco(...lista([
    "O site é **estático**: um conjunto de arquivos (as páginas, as imagens e o código) que não depende de banco de dados nem de servidor próprio para funcionar.",
    "**Código:** fica num repositório privado no GitHub, na conta do Contratante (ou numa conta criada só para o site, com o e-mail e a senha entregues a ele). Ali fica a versão oficial do site, com um guia de como alterar.",
    `**Hospedagem:** o site é publicado no ${hospedagem}, na conta do Contratante, ligado a esse repositório: cada mudança enviada ao repositório vai ao ar sozinha. ${c.hospedagem === "vercel" ? "Na Vercel, o uso comercial pede o plano pago (Pro), contratado e pago pelo Contratante." : "O plano gratuito do Cloudflare Pages permite uso comercial e atende um site como este."}`,
    `**Domínio:** registrado no Registro.br, no CPF ou no CNPJ do Contratante (${cl("dominio")}).`,
    "A Renderiza ajuda a criar e configurar essas contas e, na entrega, passa todos os acessos ao Contratante, pessoalmente, por ligação ou por um gerenciador de senhas (nunca por mensagem de texto). As senhas são do Contratante: ele deve trocá-las e ativar a verificação em duas etapas. Depois da entrega, a Renderiza só mantém algum acesso se o Contratante quiser, e ele pode tirar quando quiser.",
    `GitHub, ${hospedagem} e Registro.br são serviços de outras empresas, com termos e preços próprios, que podem mudar. Como o site é estático e o código é do Contratante, ele pode levar o site para outra hospedagem quando quiser.`,
  ], true));

  bloco(`# ${n.dominio}. Domínio`);
  bloco(...lista([
    `O domínio (${dominio ? `**${dominio}**` : "o endereço escolhido pelo Contratante"}) é registrado no nome do Contratante, na conta dele no Registro.br.`,
    domInc ? "O primeiro ano do registro está incluído no preço: a Renderiza paga o Registro.br nesse primeiro ano, e o domínio continua no nome do Contratante."
      : "O registro é pago pelo Contratante, direto ao Registro.br (hoje, cerca de R$ 40 por ano).",
    `**A renovação é do Contratante.** ${domInc ? "A partir do segundo ano" : "Todo ano"}, o Contratante renova o domínio direto no Registro.br (hoje, cerca de R$ 40 por ano), que manda o aviso ao e-mail cadastrado na conta dele. A Renderiza não renova o domínio e não responde por domínio vencido, suspenso ou perdido por falta de renovação, nem pelos dados de cadastro da conta do Contratante.`,
  ], true));

  bloco(`# ${n.depois}. Depois da entrega: sem manutenção incluída`);
  bloco(...lista([
    `Este termo é de **entrega única**. Depois da entrega, não estão incluídos manutenção, atualizações, monitoramento, cópias de segurança, suporte contínuo nem alterações, além da garantia (${cl("garantia")}).`,
    `Alterações e novidades depois da entrega (textos, fotos, preços, páginas, funções) são trabalho novo: a Renderiza manda o orçamento antes e só faz com a aprovação por escrito do Contratante.${comPainel ? ` Com o Painel Renderiza, o próprio Contratante faz as alterações que o painel permite (${cl("painel")}).` : ""}`,
    "Como o código e as contas são do Contratante, ele pode pedir a qualquer pessoa técnica que altere o site. A Renderiza não responde por alterações feitas por outras pessoas, nem pelo que acontecer nas contas do Contratante depois da entrega.",
  ], true));

  bloco(`# ${n.garantia}. Garantia`);
  bloco(`Por **${garantia || pendente("garantia")} dias** corridos depois da entrega, a Renderiza corrige sem custo os **defeitos** do que entregou: erro de funcionamento, como página que não abre, link ou botão que não funciona, ou parte que não aparece direito no celular. A garantia não cobre mudanças pedidas depois, conteúdo novo, problemas causados por alterações de outras pessoas ou nas contas do Contratante, nem falhas dos serviços de outras empresas (${cl("onde")}). Esta garantia não reduz as que a lei dá ao Contratante.`);

  if (comPainel) {
    bloco(`# ${n.painel}. Painel Renderiza`);
    bloco(...lista([
      `O **Painel Renderiza** (painel.renderizaweb.com.br) é um serviço à parte, por assinatura mensal, com os Termos de uso próprios (painel.renderizaweb.com.br/termos), aceitos no primeiro acesso. Para este site: ${painelModulos || pendente("módulos do painel")}, por **${painelPreco ? reais(painelPreco) : pendente("mensalidade do painel")} por mês**, sem fidelidade.`,
      c.painel === "opcional" ? "O Contratante escolhe na assinatura deste termo se quer o painel. Pode contratar depois ou cancelar quando quiser, como nos Termos de uso do painel."
        : "O Contratante contrata o painel junto com o site e pode cancelar quando quiser, como nos Termos de uso do painel.",
      `Com o painel, a primeira mensalidade vence ${limpo(c.painel_inicio) || pendente("quando vence a primeira mensalidade")}, e as seguintes no mesmo dia de cada mês, por Pix.`,
      "O site não depende do painel para ficar no ar. Com o painel ativo, o que o Contratante muda nele aparece no site. Se o painel for cancelado ou desligado, o site volta a mostrar a versão entregue (a **versão inicial**); levar as mudanças feitas pelo painel para os arquivos do site é um serviço à parte, como nos Termos de uso do painel.",
    ], true));
  }

  if (condicoes.length) {
    bloco(`# ${n.condicoes}. Condições deste projeto`);
    bloco(...lista(condicoes, true));
  }

  bloco(`# ${n.conteudo}. Conteúdo e limites de responsabilidade`);
  bloco(...lista([
    "O Contratante responde pelo que manda publicar (textos, fotos, logotipos, preços e informações do negócio), garante que tem o direito de usar cada um e a autorização de quem aparece nas fotos, e responde pela exatidão das informações, como preço e disponibilidade.",
    "O site é uma vitrine: a Renderiza não garante vendas, contatos nem posição no Google.",
    `A Renderiza não responde por falhas, mudanças ou cobranças de serviços de outras empresas (GitHub, ${hospedagem}, Registro.br, Google, WhatsApp, Instagram), nem pelo uso das contas e senhas do Contratante.`,
    "No que a lei permitir, a responsabilidade da Renderiza por danos fica limitada ao valor pago por este termo, e nenhuma das partes responde por lucros cessantes ou danos indiretos. Esses limites não valem em caso de dolo ou culpa grave.",
  ], true));

  bloco(`# ${n.propriedade}. De quem é o site`);
  bloco(...lista([
    "Pago o preço inteiro, ficam do Contratante os direitos sobre o site feito para ele: o código, o layout e os textos. As fotos, os logotipos e o conteúdo dele continuam dele.",
    "Ferramentas e componentes genéricos que a Renderiza já tinha ou usa em outros projetos continuam dela, e o Contratante pode usá-los neste site sem custo e sem prazo. Bibliotecas de código aberto seguem as próprias licenças.",
    "A Renderiza só mostra o site no portfólio dela com autorização do Contratante.",
  ], true));

  bloco(`# ${n.dados}. Dados pessoais`);
  bloco(...lista([
    "Os dados do Contratante informados na assinatura (nome, CPF, endereço, e-mail, WhatsApp e, se for o caso, a empresa) são usados só para este termo e guardados enquanto houver obrigação legal.",
    "Se o site receber dados de visitantes (por exemplo, por um formulário ou pela agenda do painel), quem decide como usá-los é o Contratante, como controlador (Lei 13.709/2018). O botão de WhatsApp leva a conversa direto ao WhatsApp do Contratante.",
  ], true));

  bloco(`# ${n.desistencia}. Desistência e encerramento`);
  bloco(...lista([
    "Nos 7 primeiros dias contados da assinatura, o Contratante pode desistir sem nenhum custo, e o que tiver pago volta em até 10 dias.",
    "Depois disso, se desistir antes da entrega, paga o trabalho já feito, proporcional ao preço e sem passar dele; o que tiver pago além disso volta em até 10 dias, e o que estiver pronto é entregue a ele. Depois da entrega, o preço é devido por inteiro.",
    "Qualquer das partes pode encerrar este termo por descumprimento grave da outra, se não for corrigido em 10 dias depois do aviso.",
  ], true));

  bloco(`# ${n.avisos}. Avisos`);
  bloco("Os avisos deste termo valem quando enviados pelo e-mail ou pelo WhatsApp informados na assinatura (do Contratante) e no início deste termo (da Renderiza).");

  bloco(`# ${n.assinatura}. Assinatura eletrônica`);
  bloco(`Este termo é assinado eletronicamente. A Renderiza concorda com este texto ao publicá-lo, e o termo se forma com o aceite do Contratante, que confirma o e-mail com um código de 6 números enviado a ele na hora da assinatura. Ficam registrados o nome, o CPF, o endereço, o e-mail confirmado, o WhatsApp e, se for o caso, a razão social e o CNPJ informados${opcoes.length ? ", a opção escolhida" : ""}, a data e a hora, o endereço IP, o aparelho e a impressão digital (SHA-256) deste texto. Logo depois, a Renderiza envia o comprovante com esses dados ao e-mail do Contratante, com cópia para o e-mail da Renderiza, o que confirma a assinatura pelas duas partes. As partes reconhecem a validade dessa forma de assinatura (Medida Provisória 2.200-2/2001, art. 10, § 2º).`);

  bloco(`# ${n.foro}. Foro`);
  t.push(`Fica escolhido o foro da Comarca de ${limpo(c.foro) || pendente("foro")} para resolver qualquer questão deste termo.`);

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
