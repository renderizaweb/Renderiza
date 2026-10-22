// Contador de visitas do Painel Renderiza. Só conta quando o link tem o código do lead (/exemplos?c=abcd):
// o código fica guardado no navegador por 30 dias, então o exemplo do painel e a agenda online, abertos a
// partir dali, também contam. Cada passo vai para /api/visita (api/visita.js), que grava no Supabase.
// Passos automáticos: abriu a página, rolou até o fim e quanto tempo ficou. As páginas avisam os outros com
// window.rzVisita(evento, detalhe). Sem código, no vídeo (?video=1) ou aberto do disco, não faz nada.
(function () {
  const nada = () => {};
  window.rzVisita = nada;
  try {
    if (location.protocol === "file:" || /[?&]video=1/.test(location.search)) return;
    const ler = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: conta só esta página */ } };
    const aleatorio = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

    let codigo = "";
    const doLink = new URLSearchParams(location.search).get("c");
    if (doLink && /^[a-z0-9]{3,8}$/i.test(doLink)) {
      codigo = doLink.toLowerCase();
      guardar("renderiza:codigo", JSON.stringify({ c: codigo, em: Date.now() }));
    } else {
      try { const s = JSON.parse(ler("renderiza:codigo") || "null"); if (s && Date.now() - s.em < 30 * 864e5) codigo = s.c; } catch (e) { /* sem código */ }
    }
    if (!codigo) return;

    const script = document.currentScript;
    const pagina = (script && script.dataset.pagina) || "exemplos";
    let visitante = ler("renderiza:visitante");
    if (!visitante) { visitante = aleatorio(10); guardar("renderiza:visitante", visitante); }
    const sessao = aleatorio(10);
    // Navegador que já abriu o painel da Renderiza (sessão do Supabase ou a marca que o painel deixa): somos nós.
    let equipe = ler("renderiza:equipe") === "1";
    try { equipe = equipe || Object.keys(localStorage).some(k => /^sb-[a-z0-9]+-auth-token$/.test(k)); } catch (e) { /* segue */ }

    function enviar(evento, detalhe) {
      const corpo = JSON.stringify({ c: codigo, p: pagina, e: evento, d: detalhe || {}, v: visitante, s: sessao, eq: equipe });
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
    enviar("abriu", { tela: innerWidth + "x" + innerHeight, ...(origem && origem !== location.hostname ? { de: origem } : {}) });

    // Rolou até o fim (uma vez).
    let fim = false;
    const olharFim = () => {
      if (fim) return;
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 320) { fim = true; enviar("rolou_fim", {}); removeEventListener("scroll", olharFim); }
    };
    addEventListener("scroll", olharFim, { passive: true });

    // Tempo com a página na frente (manda ao sair ou trocar de app; o banco fica com o maior).
    let visivelDesde = document.visibilityState === "visible" ? Date.now() : 0, total = 0;
    const tempo = () => {
      if (visivelDesde) { total += Date.now() - visivelDesde; visivelDesde = 0; }
      const s = Math.round(total / 1000);
      if (s >= 3) enviar("tempo", { s });
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") tempo();
      else visivelDesde = Date.now();
    });
    addEventListener("pagehide", tempo);
  } catch (e) {
    window.rzVisita = nada;
  }
})();
