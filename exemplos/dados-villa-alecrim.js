// Dados fictícios da Villa Alecrim, espaço de eventos inventado para os exemplos da Renderiza (/exemplos).
// O painel (painel-eventos) e a agenda online (agenda-online) leem daqui: as datas reservadas são as mesmas nos dois.
// Tudo sai da data de hoje, para a agenda e o financeiro parecerem sempre do mês atual.
// Pedidos feitos na agenda online ficam no navegador (localStorage) e aparecem no painel.
(function () {
  const DIA = 864e5;
  const meiaNoite = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const HOJE = meiaNoite(new Date());
  const somar = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const SAB0 = somar(HOJE, (6 - HOJE.getDay() + 7) % 7); // o sábado desta semana (hoje, se for sábado)
  const sab = n => somar(SAB0, 7 * n), sex = n => somar(SAB0, 7 * n - 1), dom = n => somar(SAB0, 7 * n + 1);
  const dia = n => somar(HOJE, n);
  /** n-ésimo dia útil a partir de hoje (0 = hoje, ou o próximo dia útil se hoje for fim de semana). */
  function util(n) {
    let d = HOJE, k = -1;
    for (;;) { if (d.getDay() % 6 !== 0) k++; if (k === n) return d; d = somar(d, 1); }
  }
  const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const dias = (a, b) => Math.round((meiaNoite(b) - meiaNoite(a)) / DIA);

  const EQUIPE = [
    { id: "marina", nome: "Marina Alves", curto: "Marina", papel: "Proprietária", cor: "#2d6a4f", visto: "online agora",
      acesso: { inicio: "editar", agenda: "editar", clientes: "editar", contratos: "editar", financeiro: "editar", atendimento: "editar", equipe: "editar" } },
    { id: "rafael", nome: "Rafael Costa", curto: "Rafael", papel: "Comercial", cor: "#2f6fe0", visto: "online agora",
      acesso: { inicio: "editar", agenda: "editar", clientes: "editar", contratos: "editar", financeiro: null, atendimento: "editar", equipe: null } },
    { id: "bia", nome: "Beatriz Lima", curto: "Bia", papel: "Financeiro", cor: "#b4542f", visto: "há 20 min",
      acesso: { inicio: "editar", agenda: "ver", clientes: "ver", contratos: "ver", financeiro: "editar", atendimento: null, equipe: null } },
    { id: "leo", nome: "Léo Santos", curto: "Léo", papel: "Produção de eventos", cor: "#9a6a12", visto: "há 2 h",
      acesso: { inicio: "editar", agenda: "editar", clientes: "ver", contratos: null, financeiro: null, atendimento: null, equipe: null } },
  ];

  const TIPOS = {
    casamento: { nome: "Casamento", cor: "#d6456b", fundo: "#fce8ee" },
    quinze: { nome: "15 anos", cor: "#7c4ddb", fundo: "#efe8fd" },
    aniversario: { nome: "Aniversário", cor: "#dd7426", fundo: "#fdeedd" },
    infantil: { nome: "Infantil", cor: "#b98a00", fundo: "#fbf2cf" },
    corporativo: { nome: "Corporativo", cor: "#2f6fe0", fundo: "#e4edfd" },
    visita: { nome: "Visita", cor: "#2d6a4f", fundo: "#e2efe7" },
    degustacao: { nome: "Degustação", cor: "#0f8f8a", fundo: "#dcf2f1" },
    reuniao: { nome: "Reunião", cor: "#58646d", fundo: "#eceff1" },
  };

  const PACOTES = {
    essencial: { nome: "Essencial", base: 16900, ate: 100, inclui: ["Espaço por 5 horas", "Buffet com 4 opções de prato", "Bebidas não alcoólicas", "Decoração da casa"] },
    classico: { nome: "Clássico", base: 26500, ate: 100, inclui: ["Espaço por 6 horas", "Buffet completo", "Chope e bebidas", "Decoração com flores", "DJ"] },
    completo: { nome: "Completo", base: 38900, ate: 100, inclui: ["Espaço por 7 horas", "Buffet e ilha gastronômica", "Open bar", "Decoração assinada", "DJ e iluminação", "Cerimonialista"] },
  };
  const POR_CONVIDADO = 95; // acima do que o pacote cobre

  const ADICIONAIS = {
    openbar: { nome: "Open bar premium", preco: 5200 },
    doces: { nome: "Mesa de doces", preco: 2400 },
    cabine: { nome: "Cabine de fotos", preco: 1900 },
    cerimonia: { nome: "Cerimônia no jardim", preco: 2600 },
    horaextra: { nome: "Hora extra", preco: 1800 },
    dj: { nome: "DJ e iluminação", preco: 3200 },
    telao: { nome: "Telão e som", preco: 1100 },
    recreacao: { nome: "Recreação infantil", preco: 1600 },
  };

  const STATUS = {
    orcamento: { nome: "Orçamento enviado", cor: "#8a6d00", fundo: "#fbf2cf" },
    visita: { nome: "Visita marcada", cor: "#2d6a4f", fundo: "#e2efe7" },
    contrato: { nome: "Contrato enviado", cor: "#2f6fe0", fundo: "#e4edfd" },
    assinado: { nome: "Assinado", cor: "#7c4ddb", fundo: "#efe8fd" },
    quitado: { nome: "Quitado", cor: "#1f7a4d", fundo: "#ddf3e7" },
    realizado: { nome: "Realizado", cor: "#58646d", fundo: "#eceff1" },
  };

  // id, cliente, tipo, data, início, fim, convidados, pacote, adicionais, responsável (comercial), fechado (dias antes de hoje), origem, status
  const E = (id, cliente, tipo, data, ini, fim, conv, pacote, adic, resp, fechado, origem, status) =>
    ({ id, cliente, tipo, data, ini, fim, conv, pacote, adic, resp, producao: "leo", fechado: fechado == null ? null : dia(fechado), origem, status });
  const EVENTOS = [
    E("camila-renato", "Camila & Renato", "casamento", sab(-4), "19:00", "03:00", 160, "completo", ["openbar", "cabine", "cerimonia"], "rafael", -233, "instagram"),
    E("laura-mendes", "Laura Mendes", "quinze", sab(-3), "20:00", "02:00", 120, "classico", ["doces", "cabine"], "rafael", -184, "whatsapp"),
    E("theo", "Theo, 5 anos", "infantil", dom(-3), "12:00", "17:00", 80, "essencial", ["recreacao", "doces"], "marina", -93, "indicacao"),
    E("bruna-felipe", "Bruna & Felipe", "casamento", sab(-2), "19:30", "03:30", 200, "completo", ["openbar", "horaextra", "cerimonia"], "rafael", -262, "instagram"),
    E("grupo-vertice", "Grupo Vértice", "corporativo", sex(-1), "19:00", "00:00", 150, "classico", ["telao", "openbar"], "marina", -77, "google"),
    E("sonia-50", "50 anos da Sônia", "aniversario", sab(-1), "20:00", "02:00", 100, "classico", ["doces"], "rafael", -124, "whatsapp"),
    E("juliana-pedro", "Juliana & Pedro", "casamento", sab(0), "19:00", "03:00", 180, "completo", ["openbar", "cabine", "cerimonia"], "rafael", -244, "instagram"),
    E("alice-7", "Alice, 7 anos", "infantil", dom(0), "13:00", "18:00", 90, "essencial", ["recreacao", "doces"], "marina", -63, "agenda", "quitado"),
    E("nexa", "Nexa Tecnologia", "corporativo", sex(1), "19:00", "01:00", 220, "completo", ["telao", "openbar"], "rafael", -104, "google"),
    E("valentina-rocha", "Valentina Rocha", "quinze", sab(1), "20:00", "03:00", 150, "classico", ["cabine", "doces", "dj"], "rafael", -152, "whatsapp"),
    E("priscila-cha", "Chá revelação da Priscila", "aniversario", dom(2), "14:00", "18:00", 60, "essencial", ["doces"], "rafael", -33, "agenda"),
    E("ana-thiago", "Ana Beatriz & Thiago", "casamento", sab(2), "18:30", "02:30", 170, "completo", ["openbar", "cerimonia", "doces"], "marina", -214, "indicacao"),
    E("bem-viver", "Clínica Bem Viver", "corporativo", sex(3), "20:00", "00:00", 90, "essencial", ["telao"], "rafael", null, "google", "contrato"),
    E("mariana-lucas", "Mariana & Lucas", "casamento", sab(3), "19:00", "03:00", 140, "classico", ["cerimonia", "cabine"], "rafael", -143, "agenda"),
    E("antonio-60", "60 anos do Seu Antônio", "aniversario", sab(4), "13:00", "19:00", 110, "classico", ["doces"], "marina", -52, "whatsapp"),
    E("claudia-roberto", "Bodas de Cláudia & Roberto", "aniversario", sab(5), "20:00", "01:00", 120, "classico", [], "marina", -71, "indicacao"),
    E("larissa-gabriel", "Larissa & Gabriel", "casamento", sab(6), "19:00", "03:00", 190, "completo", ["openbar", "cabine", "horaextra"], "rafael", -120, "instagram"),
    E("bianca-rodrigo", "Bianca & Rodrigo", "casamento", sab(7), "19:30", "03:30", 160, "completo", ["cerimonia", "cabine"], "rafael", -163, "agenda"),
    E("isabela-martins", "Isabela Martins", "quinze", sab(8), "20:00", "03:00", 130, "classico", ["cabine", "dj"], "rafael", null, "instagram", "contrato"),
    E("sophia-andrade", "Sophia Andrade", "quinze", sab(9), "20:00", "03:00", 140, "classico", ["doces"], "rafael", -113, "whatsapp"),
    E("fernanda-diego", "Fernanda & Diego", "casamento", sab(10), "18:00", "02:00", 160, "completo", ["cerimonia", "openbar"], "marina", -97, "indicacao"),
    E("leticia-bruno", "Letícia & Bruno", "casamento", sab(11), "19:00", "03:00", 130, "classico", ["cerimonia"], "rafael", -82, "agenda"),
    E("paula-henrique", "Paula & Henrique", "casamento", sab(13), "19:00", "03:00", 150, "classico", ["cerimonia"], "rafael", null, "instagram", "orcamento"),
    E("carolina-andre", "Carolina & André", "casamento", sab(16), "19:30", "03:30", 200, "completo", ["openbar", "cabine", "cerimonia", "horaextra"], "rafael", -22, "agenda"),
  ];
  for (const e of EVENTOS) {
    if (!e.status) e.status = e.data < HOJE ? "realizado" : "assinado";
    e.valor = valorDe(e);
  }

  function valorDe(e) {
    const p = PACOTES[e.pacote];
    return p.base + Math.max(0, e.conv - p.ate) * POR_CONVIDADO + e.adic.reduce((s, a) => s + ADICIONAIS[a].preco, 0);
  }

  // Parcelas: 30% de entrada na assinatura e o resto todo mês, até 10 dias antes da festa.
  const FORMAS = ["Pix", "Boleto", "Cartão", "Pix"];
  const ATRASADA = new Set(["valentina-rocha"]); // a parcela que venceu por último ficou em aberto
  const PARCELAS = [];
  for (const e of EVENTOS) {
    e.parcelas = [];
    if (!e.fechado) continue;
    const limite = somar(e.data, -10);
    const datas = [e.fechado];
    for (let d = somar(e.fechado, 30); d <= limite && datas.length < 9; d = somar(d, 30)) datas.push(d);
    // a última parcela cai 10 dias antes da festa
    if (datas.length === 1 || (datas.length < 9 && dias(datas[datas.length - 1], limite) > 6)) datas.push(limite > e.fechado ? limite : somar(e.fechado, 7));
    const entrada = Math.round(e.valor * 0.3 / 10) * 10;
    const resto = e.valor - entrada, n = datas.length - 1;
    const cada = Math.floor(resto / n / 10) * 10;
    const ultimaVencida = datas.reduce((k, d, i) => (d < HOJE ? i : k), -1);
    datas.forEach((d, i) => {
      const valor = i === 0 ? entrada : i === n ? resto - cada * (n - 1) : cada;
      const atrasada = ATRASADA.has(e.id) && i === ultimaVencida && i > 0;
      const pago = e.status === "quitado" || e.status === "realizado" || (d < HOJE && !atrasada);
      const p = { evento: e.id, cliente: e.cliente, n: i + 1, de: datas.length, vence: d, valor, forma: i === 0 ? "Pix" : FORMAS[(i + e.conv) % FORMAS.length],
        pago, pagoEm: pago ? (d < HOJE ? d : HOJE) : null, situacao: pago ? "pago" : atrasada ? "atrasada" : mesmoDia(d, HOJE) ? "hoje" : "aberto" };
      e.parcelas.push(p); PARCELAS.push(p);
    });
    e.pago = e.parcelas.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
  }
  for (const e of EVENTOS) if (e.pago == null) e.pago = 0;

  // Visitas, degustações e reuniões da equipe.
  const reuniaoJuliana = somar(SAB0, -2) < HOJE ? HOJE : somar(SAB0, -2);
  const C = (id, tipo, titulo, data, ini, resp, cliente) => ({ id, tipo, titulo, data, ini, resp, cliente });
  const COMPROMISSOS = [
    C("v1", "visita", "Visita · Patrícia Gomes", util(0), "15:00", "rafael", "Patrícia Gomes"),
    C("r1", "reuniao", "Reunião final · Juliana & Pedro", reuniaoJuliana, "18:30", "leo", "Juliana & Pedro"),
    C("v2", "visita", "Visita · Renata & Caio", util(1), "10:00", "rafael", "Renata & Caio"),
    C("d1", "degustacao", "Degustação · Ana Beatriz & Thiago", util(2), "19:00", "marina", "Ana Beatriz & Thiago"),
    C("v3", "visita", "Visita · Empresa Lumina", util(3), "11:00", "rafael", "Empresa Lumina"),
    C("v4", "visita", "Visita · Família Duarte", util(5), "16:00", "rafael", "Família Duarte"),
    C("r2", "reuniao", "Reunião final · Valentina Rocha", util(6), "17:00", "leo", "Valentina Rocha"),
    C("d2", "degustacao", "Degustação · Mariana & Lucas", util(8), "19:30", "marina", "Mariana & Lucas"),
    C("v5", "visita", "Visita · Débora & Marcos", util(9), "14:00", "rafael", "Débora & Marcos"),
  ];

  // Pedidos que chegaram (atendimento): ainda não viraram evento.
  const P = (id, nome, tipo, origem, status, resp, minutos, msg, extra = {}) => ({ id, nome, tipo, origem, status, resp, quando: new Date(Date.now() - minutos * 60000), msg, ...extra });
  const PEDIDOS = [
    P("p-patricia", "Patrícia Gomes", "casamento", "agenda", "visita", "rafael", 38, "Pré-reserva pela agenda online. Visita marcada para hoje, 15h.", { data: sab(20), conv: 150, pacote: "completo" }),
    P("p-gustavo", "Gustavo Prado", "aniversario", "indicacao", "novo", "rafael", 64, "Indicação da Juliana (casamento de sábado). Quer festa de 40 anos.", { data: sab(14), conv: 90 }),
    P("p-renata", "Renata & Caio", "casamento", "instagram", "visita", "rafael", 140, "Viram o casamento da Bruna no Instagram. Visita amanhã, 10h.", { data: sab(24), conv: 170, pacote: "completo" }),
    P("p-lumina", "Empresa Lumina", "corporativo", "google", "orcamento", "marina", 300, "Confraternização para 120 pessoas. Orçamento enviado.", { data: sex(9), conv: 120, pacote: "classico" }),
    P("p-duarte", "Família Duarte", "quinze", "whatsapp", "conversa", "rafael", 560, "Quer saber se ainda tem sábado livre no outono.", { data: sab(22), conv: 140 }),
    P("p-aline", "Aline Ferraz", "infantil", "whatsapp", "orcamento", "marina", 1500, "Orçamento enviado: Essencial para 80 convidados.", { data: dom(5), conv: 80, pacote: "essencial" }),
    P("p-debora", "Débora & Marcos", "casamento", "agenda", "visita", "rafael", 2900, "Pré-reserva pela agenda online. Visita marcada.", { data: sab(26), conv: 130, pacote: "classico" }),
    P("p-horizonte", "Colégio Horizonte", "corporativo", "google", "conversa", "marina", 4300, "Formatura do 9º ano, umas 200 pessoas.", { data: sex(12), conv: 200 }),
  ];
  const ORIGENS = {
    whatsapp: { nome: "WhatsApp", cor: "#1f9d55" },
    instagram: { nome: "Instagram", cor: "#c13584" },
    agenda: { nome: "Agenda online", cor: "#2d6a4f" },
    indicacao: { nome: "Indicação", cor: "#9a6a12" },
    google: { nome: "Google", cor: "#2f6fe0" },
  };
  const ETAPAS_PEDIDO = {
    novo: { nome: "Novo", cor: "#d6456b", fundo: "#fce8ee" },
    conversa: { nome: "Em conversa", cor: "#2f6fe0", fundo: "#e4edfd" },
    visita: { nome: "Visita marcada", cor: "#2d6a4f", fundo: "#e2efe7" },
    orcamento: { nome: "Orçamento enviado", cor: "#8a6d00", fundo: "#fbf2cf" },
  };

  // Pedidos feitos agora na agenda online (neste navegador).
  const CHAVE = "renderiza-exemplo:villa-alecrim:pedidos";
  function pedidosDoNavegador() {
    try { return (JSON.parse(localStorage.getItem(CHAVE) || "[]") || []).map(p => ({ ...p, quando: new Date(p.quando), data: p.data ? new Date(p.data) : null })); }
    catch (e) { return []; }
  }
  function guardarPedido(p) {
    try { const l = JSON.parse(localStorage.getItem(CHAVE) || "[]") || []; l.unshift(p); localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, 10))); return true; }
    catch (e) { return false; }
  }

  /** Datas com festa (para a agenda online): "aaaa-mm-dd" → período ("dia" | "noite"). */
  const chave = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  function ocupadas() {
    const m = {};
    for (const e of EVENTOS) if (e.status !== "orcamento") (m[chave(e.data)] ||= []).push(Number(e.ini.slice(0, 2)) < 17 ? "dia" : "noite");
    for (const p of pedidosDoNavegador()) if (p.data) (m[chave(p.data)] ||= []).push(p.periodo || "noite");
    return m;
  }

  /* ---------- formatos ---------- */
  const moeda = v => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const DS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"], DSL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const dm = d => String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
  const dataCurta = d => DS[d.getDay()] + ", " + dm(d);
  const dataLonga = d => DSL[d.getDay()] + ", " + d.getDate() + " de " + MES[d.getMonth()];
  const iniciais = n => n.replace(/[^A-Za-zÀ-ú& ]/g, "").split(/\s+|&/).filter(w => w && w.length > 1 && !/^(da|de|do|dos|das|e)$/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  function haQuanto(d) {
    const min = Math.max(1, Math.round((Date.now() - d) / 60000));
    if (min < 60) return "há " + min + " min";
    const h = Math.round(min / 60);
    if (h < 24) return "há " + h + " h";
    const n = Math.round(h / 24);
    return n === 1 ? "ontem" : "há " + n + " dias";
  }
  function emQuanto(d) {
    const n = dias(HOJE, d);
    if (n === 0) return "hoje";
    if (n === 1) return "amanhã";
    if (n === -1) return "ontem";
    return n > 0 ? "em " + n + " dias" : "há " + -n + " dias";
  }

  window.VILLA = {
    NOME: "Villa Alecrim", HOJE, DIA, somar, mesmoDia, dias, chave, sab,
    EQUIPE, TIPOS, PACOTES, ADICIONAIS, STATUS, EVENTOS, PARCELAS, COMPROMISSOS, PEDIDOS, ORIGENS, ETAPAS_PEDIDO, POR_CONVIDADO,
    pedidosDoNavegador, guardarPedido, ocupadas, valorDe,
    moeda, dm, dataCurta, dataLonga, iniciais, haQuanto, emQuanto, MES, DS, DSL,
  };
})();
