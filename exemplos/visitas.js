// Contador de visitas do Painel Renderiza e das demos. No painel, só conta quando o link tem o código do lead
// (/exemplos?c=abcd): o código fica guardado no navegador por 30 dias, então o exemplo do painel e a agenda
// online, abertos a partir dali, também contam. Na demo de um lead (/demo/<pasta>, data-pagina="demo"), o
// build põe este script com a pasta (data-demo) e o banco acha o lead pelo link_demo: não precisa de código.
// Cada passo vai para /api/visita (api/visita.js), que grava no Supabase. Passos automáticos: abriu a página,
// rolou até o fim e quanto tempo ficou (na demo, também o tempo em cada parte e os cliques). As páginas avisam
// os outros com window.rzVisita(evento, detalhe). Sem código, no vídeo (?video=1) ou aberto do disco, não faz nada.
(function () {
  const nada = () => {};
  window.rzVisita = nada;
  try {
    if (location.protocol === "file:" || /[?&]video=1/.test(location.search)) return;
    const ler = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: conta só esta página */ } };
    const aleatorio = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

    const script = document.currentScript;
    const pagina = (script && script.dataset.pagina) || "exemplos";
    const demo = pagina === "demo" ? String((script && script.dataset.demo) || "").toLowerCase() : "";
    // Outra página da mesma demo (ex.: "natal", a campanha da fotógrafa): vai no "abriu".
    const sub = pagina === "demo" ? String((script && script.dataset.sub) || "").toLowerCase().slice(0, 40) : "";
    // Página "demo fora do ar" (middleware.js): conta que a pessoa voltou e por quê ("vencida", "reaberta", "fora").
    const fora = pagina === "demo" ? String((script && script.dataset.fora) || "") : "";
    let codigo = "";
    if (pagina === "demo") {
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(demo)) return;
    } else {
      const doLink = new URLSearchParams(location.search).get("c");
      if (doLink && /^[a-z0-9]{3,8}$/i.test(doLink)) {
        codigo = doLink.toLowerCase();
        guardar("renderiza:codigo", JSON.stringify({ c: codigo, em: Date.now() }));
      } else {
        try { const s = JSON.parse(ler("renderiza:codigo") || "null"); if (s && Date.now() - s.em < 30 * 864e5) codigo = s.c; } catch (e) { /* sem código */ }
      }
      if (!codigo) return;
    }

    let visitante = ler("renderiza:visitante");
    if (!visitante) { visitante = aleatorio(10); guardar("renderiza:visitante", visitante); }
    const sessao = aleatorio(10);
    // Navegador que já abriu o painel da Renderiza (sessão do Supabase ou a marca que o painel deixa): somos nós.
    let equipe = ler("renderiza:equipe") === "1";
    try { equipe = equipe || Object.keys(localStorage).some(k => /^sb-[a-z0-9]+-auth-token$/.test(k)); } catch (e) { /* segue */ }

    function enviar(evento, detalhe) {
      const corpo = JSON.stringify({ c: codigo, p: pagina, e: evento, d: detalhe || {}, v: visitante, s: sessao, eq: equipe, ...(demo ? { demo } : {}) });
      try {
        if (navigator.sendBeacon && navigator.sendBeacon("/api/visita", new Blob([corpo], { type: "text/plain" }))) return;
      } catch (e) { /* tenta pelo fetch */ }
      try { fetch("/api/visita", { method: "POST", body: corpo, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(nada); } catch (e) { /* sem rede */ }
    }
    const jaFoi = new Set();
    window.rzVisita = (evento, detalhe, umaVez) => {
      const chave = evento + ":" + (umaVez || "");
      if (umaVez !== undefined && jaFoi.has(chave)) return;
      jaFoi.add(chave);
      enviar(evento, detalhe);
    };

    let origem = "";
    try { origem = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) { /* sem origem */ }
    enviar("abriu", { tela: innerWidth + "x" + innerHeight, ...(sub ? { sub } : {}), ...(origem && origem !== location.hostname ? { de: origem } : {}), ...(fora ? { fora } : {}) });

    // O card de valor na tela (oferta da demo, site/oferta-na-demo.mjs): conta como "viu o valor", uma vez.
    const precos = document.querySelector("[data-rz-precos]");
    if (precos && "IntersectionObserver" in window) {
      const olhar = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) { olhar.disconnect(); enviar("viu_precos", { onde: pagina }); }
      }, { threshold: 0.35 });
      olhar.observe(precos);
    }

    // Rolou até o fim (uma vez).
    let fim = false;
    const olharFim = () => {
      if (fim) return;
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 320) { fim = true; enviar("rolou_fim", {}); removeEventListener("scroll", olharFim); }
    };
    addEventListener("scroll", olharFim, { passive: true });

    // Na demo: as partes da página (capa, sobre, armações, depoimentos…). O nome vem do menu que leva até a
    // parte, do aria-label ou do título; quanto tempo cada uma ficou no meio da tela vai junto com o tempo.
    const curto = t => { t = String(t || "").replace(/\s+/g, " ").trim().replace(/[.!:;]+$/, ""); return t.length <= 28 ? t : t.slice(0, 27).replace(/\s+\S*$/, "") + "…"; };
    const partes = [];
    if (pagina === "demo") {
      const blocos = [...document.querySelectorAll("section, footer")].filter(el => !el.parentElement.closest("section, footer"));
      const usados = new Map();
      blocos.forEach((el, i) => {
        let nome = "";
        if (el.matches("footer")) nome = "Rodapé";
        else if (i === 0 || el.matches(".hero, #inicio")) nome = "Capa";
        else {
          const links = el.id ? [...document.querySelectorAll('nav a[href="#' + el.id + '"]'), ...document.querySelectorAll('a[href="#' + el.id + '"]')] : [];
          const doMenu = links.map(a => a.textContent.replace(/\s+/g, " ").trim()).find(t => t && t.length <= 28 && /\p{L}/u.test(t)) || "";
          const titulo = el.querySelector("h2, h3");
          nome = curto(doMenu || el.getAttribute("aria-label") || (titulo && (titulo.innerText || titulo.textContent)) || (el.id || "").replace(/-/g, " ").replace(/^./, c => c.toUpperCase()) || "Parte " + (i + 1));
        }
        const n = (usados.get(nome) || 0) + 1;
        usados.set(nome, n);
        partes.push({ el, nome: n > 1 ? nome + " " + n : nome });
      });
    }
    const parteDe = el => { const p = el && partes.find(x => x.el.contains(el)); return p ? p.nome : ""; };
    const tempoPorParte = new Map();

    // Na demo: os cliques (WhatsApp, Instagram, rota, avaliações, telefone, menu e botões), cada um uma vez por
    // abertura e no máximo 25, com a parte da página onde foi.
    if (pagina === "demo") {
      const jaClicou = new Set();
      const cliqueDe = el => {
        const href = el.matches("a[href]") ? el.href : "", bruto = el.getAttribute("href") || "";
        // A oferta da Renderiza na demo (valor e prazo): o WhatsApp é o da Renderiza, não o da loja.
        if (el.matches("[data-rz-garantir]")) return { alvo: "oferta", texto: "garantir" };
        if (el.matches("[data-rz-negociar]")) return { alvo: "oferta", texto: "negociar" };
        if (el.dataset.rzAlvo) return { alvo: el.dataset.rzAlvo }; // botões nossos: faixa do valor, reabrir a demo
        if (/wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) return { whatsapp: true };
        if (el.matches("[data-directions]") || /maps\/dir|destination=|waze\.com/i.test(href)) return { alvo: "rota" };
        if (el.matches("[data-review-write]")) return { alvo: "avaliar" };
        if (el.matches("[data-reviews-link]")) return { alvo: "avaliacoes" };
        if (/instagram\.com/i.test(href)) return { alvo: "instagram" };
        if (/facebook\.com/i.test(href)) return { alvo: "facebook" };
        if (/tiktok\.com/i.test(href)) return { alvo: "tiktok" };
        if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(href)) return { alvo: "mapa" };
        if (/^tel:/i.test(bruto)) return { alvo: "telefone" };
        if (/^mailto:/i.test(bruto)) return { alvo: "email" };
        if (/^#./.test(bruto)) {
          const destino = document.getElementById(bruto.slice(1));
          const para = (destino && parteDe(destino)) || curto(el.textContent);
          return para && bruto !== "#conteudo" ? { alvo: "menu", para } : null;
        }
        if (href && /^https?:/i.test(href) && new URL(href).hostname !== location.hostname) return { alvo: "link", para: new URL(href).hostname.replace(/^www\./, "") };
        if (el.matches("button, [role=button]")) {
          if (/menu/i.test((el.getAttribute("aria-controls") || "") + " " + (el.getAttribute("aria-label") || "") + " " + el.className)) return null;
          const texto = curto(el.getAttribute("aria-label") || el.textContent);
          return texto ? { alvo: "botao", texto } : null;
        }
        return null;
      };
      document.addEventListener("click", ev => {
        try {
          const el = ev.target && ev.target.closest && ev.target.closest("a[href], button, [role=button]");
          const c = el && cliqueDe(el);
          if (!c) return;
          const parte = parteDe(el);
          if (c.whatsapp) { window.rzVisita("clicou_whatsapp", { onde: fora ? "fora" : "demo", ...(parte ? { parte } : {}) }, "demo"); return; }
          const chave = c.alvo + ":" + (c.para || c.texto || "");
          if (jaClicou.has(chave) || jaClicou.size >= 25) return;
          jaClicou.add(chave);
          enviar("clicou", { ...c, ...(parte && c.alvo !== "menu" ? { parte } : {}) });
        } catch (e) { /* o contador nunca atrapalha a demo */ }
      }, true);
    }

    // Tempo com a página na frente: conta a cada segundo (e, na demo, a parte no meio da tela). Manda a cada
    // 30 s enquanto a pessoa está na página (2 min depois de 10 min) e ao sair ou trocar de app, com saiu: true.
    // O banco fica com o maior e marca a hora: é o que faz o painel mostrar "vendo agora".
    let totalMs = 0, ultimoTique = Date.now(), ultimoEnvio = 0, saiuEnviado = false;
    const segundos = () => Math.round(totalMs / 1000);
    function mandarTempo(saiu) {
      const s = segundos();
      if (s < 3 || (s === ultimoEnvio && (!saiu || saiuEnviado))) return;
      ultimoEnvio = s; saiuEnviado = saiu;
      const secoes = [...tempoPorParte].filter(([, t]) => t >= 1000).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nome, t]) => [nome, Math.round(t / 1000)]);
      enviar("tempo", { s, saiu, ...(secoes.length ? { secoes } : {}) });
    }
    setInterval(() => {
      const agora = Date.now(), passo = Math.min(2000, agora - ultimoTique);
      ultimoTique = agora;
      if (document.visibilityState !== "visible") return;
      totalMs += passo;
      if (partes.length) {
        const nome = parteDe(document.elementFromPoint(innerWidth / 2, innerHeight * 0.45));
        if (nome) tempoPorParte.set(nome, (tempoPorParte.get(nome) || 0) + passo);
      }
      if (segundos() - ultimoEnvio >= (segundos() < 600 ? 30 : 120)) mandarTempo(false);
    }, 1000);
    document.addEventListener("visibilitychange", () => {
      ultimoTique = Date.now();
      if (document.visibilityState === "hidden") mandarTempo(true);
    });
    addEventListener("pagehide", () => mandarTempo(true));
  } catch (e) {
    window.rzVisita = nada;
  }
})();
