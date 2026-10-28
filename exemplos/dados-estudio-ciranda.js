// Dados fictícios do Estúdio Ciranda, estúdio de fotografia inventado para os exemplos da Renderiza (/exemplos/fotografia).
// O painel (painel-fotografia) e a agenda online (agenda-fotografia) leem daqui: os horários ocupados são os mesmos nos dois.
// Tudo sai da data de hoje, para a agenda, a campanha de Natal e o financeiro parecerem sempre atuais.
// Pré-reservas feitas na agenda online ficam no navegador (localStorage) e aparecem no painel.
(function () {
  const DIA = 864e5;
  const meiaNoite = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const HOJE = meiaNoite(new Date());
  const somar = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const dias = (a, b) => Math.round((meiaNoite(b) - meiaNoite(a)) / DIA);
  const chave = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const deChave = k => { const [a, m, d] = String(k).split("-").map(Number); return new Date(a, m - 1, d); };
  const min = h => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const hora = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const EQUIPE = [
    { id: "lia", nome: "Lia Moreno", curto: "Lia", papel: "Fotógrafa e proprietária", cor: "#8a4a5f" },
    { id: "duda", nome: "Duda Reis", curto: "Duda", papel: "Atendimento e agenda", cor: "#2f6f86" },
  ];

  // Tipos de ensaio: duração (min), valor, sinal pelo Pix e o que entrega.
  const ENSAIOS = {
    natal: { nome: "Mini sessão de Natal", curto: "Natal", dur: 30, valor: 220, sinal: 110, cor: "#b3261e", fundo: "#fbe4e2", entrega: "10 fotos editadas", desc: "30 minutos no cenário de Natal do estúdio" },
    gestante: { nome: "Ensaio gestante", curto: "Gestante", dur: 90, valor: 750, sinal: 250, cor: "#8a4fb5", fundo: "#f1e7f8", entrega: "25 fotos editadas", desc: "Do 7º ao 8º mês, no estúdio, com figurino" },
    newborn: { nome: "Newborn", curto: "Newborn", dur: 180, valor: 1190, sinal: 400, cor: "#c26a2a", fundo: "#fbeadc", entrega: "30 fotos editadas", desc: "Até 15 dias de vida, com calma e no tempo do bebê" },
    familia: { nome: "Ensaio de família", curto: "Família", dur: 60, valor: 650, sinal: 200, cor: "#2f7d55", fundo: "#e0f1e7", entrega: "20 fotos editadas", desc: "Pais, filhos e quem mais vier, no estúdio" },
    acompanhamento: { nome: "Acompanhamento do bebê", curto: "Acompanhamento", dur: 45, valor: 390, sinal: 150, cor: "#2f6f86", fundo: "#e0eef3", entrega: "12 fotos editadas", desc: "Um ensaio curto por mês, no primeiro ano" },
    smash: { nome: "Smash the cake", curto: "Smash", dur: 60, valor: 590, sinal: 200, cor: "#c0477a", fundo: "#fbe3ee", entrega: "20 fotos editadas", desc: "Cenário temático e bolo, para o primeiro aninho" },
  };

  // Horários que o estúdio abre para cada tipo (terça a sábado). Newborn só de manhã.
  const HORARIOS = { newborn: ["09:00"], natal: [] };
  const PADRAO = ["09:00", "10:30", "14:00", "16:00"];
  const horariosDe = tipo => HORARIOS[tipo] || PADRAO;
  const FECHA = min("18:00");

  // Campanha de Natal: 3 dias de mini sessões, a cada 40 minutos, com a contagem de vagas.
  const SAB0 = somar(HOJE, (6 - HOJE.getDay() + 7) % 7);
  const NATAL_DIAS = [somar(SAB0, 14), somar(SAB0, 15), somar(SAB0, 21)];
  const NATAL_HORAS = ["09:00", "09:40", "10:20", "11:00", "11:40", "14:00", "14:40", "15:20", "16:00", "16:40"];
  const ehNatal = d => NATAL_DIAS.some(x => mesmoDia(x, d));

  const NOMES = ["Fernanda Prado", "Juliana Matos", "Patrícia Nogueira", "Renata Lopes", "Bruna Teixeira", "Larissa Campos", "Carolina Pires",
    "Débora Assis", "Natália Freitas", "Paula Siqueira", "Gabriela Moura", "Isabela Ramos", "Letícia Barros", "Priscila Antunes", "Bianca Torres",
    "Elaine Vidal", "Michele Sampaio", "Raquel Dantas", "Sabrina Lacerda", "Thaís Moraes", "Helena Castro", "Joana Peixoto", "Lívia Andrade",
    "Marcela Brito", "Simone Paiva", "Cíntia Pacheco", "Daniela Fontes", "Érica Leal", "Flávia Rezende", "Tatiana Galvão", "Mônica Seixas",
    "Rebeca Amaral", "Yasmin Queiroz", "Luana Bastos", "Cecília Prates", "Adriana Viana", "Kelly Barreto", "Manuela Sardinha", "Vera Lúcia Pinho",
    "Rosana Telles", "Clara Medeiros", "Nádia Furtado", "Silvia Arantes", "Andressa Lima", "Beatriz Couto", "Carla Mendonça", "Denise Valente"];
  let n = 0;
  const proxNome = () => NOMES[n++ % NOMES.length];

  /* ---------- sessões (ensaios marcados) ---------- */
  const SESSOES = [];
  const ROTA = ["familia", "gestante", "acompanhamento", "smash", "familia", "gestante", "acompanhamento"];
  for (let i = -24; i <= 34; i++) {
    const d = somar(HOJE, i), sem = d.getDay();
    if (sem === 0 || sem === 1 || ehNatal(d)) continue;
    const k = ((i + 41) * 7) % 5; // 0 a 4 ensaios no dia, sempre a mesma conta para o mesmo dia
    const futuro = i > 0, longe = i > 14;
    const qtd = longe ? Math.min(k, 1) : Math.min(k, 3);
    if (qtd === 0) continue;
    const usados = [];
    if ((i + 40) % 4 === 0) { usados.push(["newborn", "09:00"]); }
    for (const h of ["14:00", "16:00", "10:30"]) {
      if (usados.length >= qtd) break;
      if (usados.some(([t]) => t === "newborn") && h === "10:30") continue;
      usados.push([ROTA[(i + 40 + usados.length) % ROTA.length], h]);
    }
    for (const [tipo, ini] of usados) {
      const id = "s" + chave(d).replace(/-/g, "") + ini.replace(":", "");
      const status = i < 0 ? "feito" : i === 0 ? "confirmada" : (i + 40) % 6 === 0 ? "pre" : "confirmada";
      SESSOES.push({ id, tipo, data: d, ini, fim: hora(min(ini) + ENSAIOS[tipo].dur), cliente: proxNome(), status, resp: "lia", criada: somar(d, -(12 + ((i + 40) % 9) * 3)) });
    }
  }
  // Natal: 30 vagas; 21 com sinal pago, 3 esperando o sinal, 6 livres.
  const PRE_NATAL = new Set([3, 14, 26]), LIVRE_NATAL = new Set([8, 9, 18, 19, 28, 29]);
  NATAL_DIAS.forEach((d, j) => NATAL_HORAS.forEach((ini, h) => {
    const idx = j * 10 + h;
    if (LIVRE_NATAL.has(idx)) return;
    SESSOES.push({ id: "n" + idx, tipo: "natal", data: d, ini, fim: hora(min(ini) + 30), cliente: proxNome(), status: PRE_NATAL.has(idx) ? "pre" : "confirmada", resp: "lia",
      criada: somar(HOJE, -(idx % 9) - (PRE_NATAL.has(idx) ? 0 : 2)), natal: true });
  }));
  const LISTA_ESPERA = [
    { nome: "Kelly Barreto", quer: "sábado à tarde", quando: Date.now() - 2 * 36e5, origem: "instagram" },
    { nome: "Rosana Telles", quer: "qualquer horário no domingo", quando: Date.now() - 20 * 36e5, origem: "whatsapp" },
    { nome: "Clara Medeiros", quer: "de manhã, com 2 crianças", quando: Date.now() - 30 * 36e5, origem: "instagram" },
    { nome: "Nádia Furtado", quer: "o último sábado", quando: Date.now() - 52 * 36e5, origem: "agenda" },
  ];

  /* ---------- entrega das fotos (ensaios já feitos) ---------- */
  const ENTREGA = { agendado: "A fotografar", selecao: "Cliente escolhendo as fotos", edicao: "Em edição", entregue: "Entregue" };
  for (const s of SESSOES) {
    const passou = dias(s.data, HOJE);
    s.prazo = somar(s.data, 15);
    s.entrega = passou < 0 || (passou === 0) ? "agendado" : passou <= 4 ? "selecao" : passou <= 12 ? "edicao" : "entregue";
    if (s.entrega === "entregue") s.entregueEm = somar(s.data, 11 + (passou % 3));
  }

  /* ---------- pagamentos: sinal pelo Pix ao reservar, o restante no dia do ensaio ---------- */
  const PARCELAS = [];
  let atrasou = false;
  for (const s of SESSOES) {
    const e = ENSAIOS[s.tipo];
    const sinalPago = s.status !== "pre";
    PARCELAS.push({ sessao: s.id, rot: "Sinal (Pix)", valor: e.sinal, vence: s.status === "pre" ? somar(HOJE, 1) : s.criada, pago: sinalPago, pagoEm: sinalPago ? s.criada : null });
    const resto = e.valor - e.sinal;
    let pago = dias(s.data, HOJE) > 0, situacao = "";
    if (pago && !atrasou && dias(s.data, HOJE) > 5 && dias(s.data, HOJE) < 12) { pago = false; atrasou = true; situacao = "atrasada"; }
    PARCELAS.push({ sessao: s.id, rot: "Restante", valor: resto, vence: s.data, pago, pagoEm: pago ? s.data : null, situacao });
  }
  for (const s of SESSOES) {
    const ps = PARCELAS.filter(p => p.sessao === s.id);
    s.valor = ENSAIOS[s.tipo].valor; s.pago = ps.filter(p => p.pago).reduce((t, p) => t + p.valor, 0);
    s.contrato = s.status === "pre" ? "enviado" : "aceito";
  }

  /* ---------- pedidos (atendimento) ---------- */
  const h = n => Date.now() - n * 36e5;
  const PEDIDOS = [
    { id: "p1", nome: "Yasmin Queiroz", origem: "instagram", quando: h(1.5), interesse: "gestante", msg: "Oi! Estou de 28 semanas, quanto fica o ensaio gestante? Dá para levar o meu marido?", status: "novo" },
    { id: "p2", nome: "Luana Bastos", origem: "whatsapp", quando: h(3), interesse: "newborn", msg: "Minha bebê nasce no fim de novembro. Vocês fazem newborn em casa ou só no estúdio?", status: "novo" },
    { id: "p3", nome: "Cecília Prates", origem: "agenda", quando: h(5), interesse: "natal", msg: "Pré-reserva pela agenda online: mini sessão de Natal.", status: "aguardando_sinal" },
    { id: "p4", nome: "Adriana Viana", origem: "instagram", quando: h(9), interesse: "smash", msg: "Vi o smash da Helena no seu perfil! O Theo faz 1 aninho em janeiro.", status: "orcamento" },
    { id: "p5", nome: "Manuela Sardinha", origem: "indicacao", quando: h(26), interesse: "familia", msg: "A Fernanda indicou. Queremos fazer as fotos de família antes do Natal.", status: "orcamento" },
    { id: "p6", nome: "Silvia Arantes", origem: "whatsapp", quando: h(30), interesse: "acompanhamento", msg: "Quero fechar o acompanhamento do primeiro ano.", status: "fechado" },
    { id: "p7", nome: "Andressa Lima", origem: "google", quando: h(50), interesse: "gestante", msg: "Achei vocês no Google. Ainda tem horário em novembro?", status: "orcamento" },
    { id: "p8", nome: "Beatriz Couto", origem: "instagram", quando: h(74), interesse: "natal", msg: "Ainda tem vaga para a mini sessão de Natal?", status: "fechado" },
  ];
  const ORIGENS = {
    instagram: { nome: "Instagram", cor: "#c0477a" }, whatsapp: { nome: "WhatsApp", cor: "#1f9d55" }, agenda: { nome: "Agenda online", cor: "#8a4a5f" },
    google: { nome: "Google", cor: "#2f6fe0" }, indicacao: { nome: "Indicação", cor: "#b98a00" },
  };
  const ETAPAS_PEDIDO = { novo: "Novo", orcamento: "Orçamento enviado", aguardando_sinal: "Esperando o sinal", fechado: "Fechou", perdido: "Não fechou" };

  /* ---------- pré-reservas feitas na agenda online deste navegador ---------- */
  const CHAVE = "renderiza-exemplo:estudio-ciranda:pedidos";
  function pedidosDoNavegador() {
    try { return (JSON.parse(localStorage.getItem(CHAVE) || "[]") || []).map(p => ({ ...p, data: deChave(p.data), quando: p.quando })); } catch (e) { return []; }
  }
  function guardarPedido(p) {
    try { const l = JSON.parse(localStorage.getItem(CHAVE) || "[]") || []; l.unshift({ ...p, data: chave(p.data) }); localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, 20))); } catch (e) { /* sem armazenamento */ }
  }

  /** Horários de um tipo de ensaio num dia: [{ hora, livre }]. Conta os ensaios marcados e as pré-reservas deste navegador. */
  function horariosDoDia(tipo, d) {
    const sem = d.getDay();
    if (d <= HOJE) return [];
    if (tipo === "natal") {
      if (!ehNatal(d)) return [];
      const ocup = SESSOES.filter(s => s.natal && mesmoDia(s.data, d)).map(s => s.ini).concat(pedidosDoNavegador().filter(p => p.tipo === "natal" && mesmoDia(p.data, d)).map(p => p.hora));
      return NATAL_HORAS.map(x => ({ hora: x, livre: !ocup.includes(x) }));
    }
    if (sem === 0 || sem === 1 || ehNatal(d) || dias(HOJE, d) > 60) return [];
    const marcados = SESSOES.filter(s => mesmoDia(s.data, d)).map(s => [min(s.ini), min(s.fim)])
      .concat(pedidosDoNavegador().filter(p => mesmoDia(p.data, d)).map(p => [min(p.hora), min(p.hora) + ENSAIOS[p.tipo].dur]));
    return horariosDe(tipo).map(x => {
      const a = min(x), b = a + ENSAIOS[tipo].dur;
      return { hora: x, livre: b <= FECHA && !marcados.some(([i, f]) => a < f && i < b) };
    });
  }
  const vagasNatal = () => NATAL_DIAS.reduce((t, d) => t + horariosDoDia("natal", d).filter(x => x.livre).length, 0);

  const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const DS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const moeda = v => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const dm = d => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const dataCurta = d => `${DS[d.getDay()].slice(0, 3)}, ${dm(d)}`;
  const dataLonga = d => `${DS[d.getDay()]}, ${d.getDate()} de ${MES[d.getMonth()]}`;
  const iniciais = nome => String(nome).split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  function haQuanto(t) {
    const m = Math.round((Date.now() - t) / 6e4);
    return m < 60 ? `há ${Math.max(1, m)} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : m < 2880 ? "ontem" : `há ${Math.round(m / 1440)} dias`;
  }
  function emQuanto(d) {
    const k = dias(HOJE, d);
    return k === 0 ? "hoje" : k === 1 ? "amanhã" : k < 0 ? `há ${-k} dias` : k < 7 ? `${DS[d.getDay()]}` : `em ${k} dias`;
  }

  window.CIRANDA = {
    HOJE, EQUIPE, ENSAIOS, SESSOES, PARCELAS, PEDIDOS, ORIGENS, ETAPAS_PEDIDO, ENTREGA, LISTA_ESPERA, NATAL_DIAS, NATAL_HORAS,
    horariosDoDia, vagasNatal, ehNatal, pedidosDoNavegador, guardarPedido,
    somar, mesmoDia, dias, chave, deChave, min, hora, moeda, dm, dataCurta, dataLonga, iniciais, haQuanto, emQuanto, MES, DS,
  };
})();
