(() => {
  "use strict";
  const client = window.DEMO_CLIENT;
  if (!client) return;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  // Links e dados centralizados no DEMO_CLIENT.
  $$("[data-rating]").forEach(el => el.textContent = client.rating);
  $$("[data-review-total]").forEach(el => el.textContent = client.reviewTotal);
  $$("[data-whatsapp]").forEach(el => { el.href = client.whatsapp; el.target = "_blank"; el.rel = "noopener noreferrer"; });
  $$("[data-instagram]").forEach(el => el.href = client.instagram);
  $$("[data-maps]").forEach(el => el.href = client.maps);
  $$("[data-directions]").forEach(el => el.href = client.directions);
  $$("[data-reviews-link]").forEach(el => el.href = client.reviewsUrl);
  $$("[data-review-write]").forEach(el => el.href = client.writeReviewUrl);
  $$("[data-phone]").forEach(el => el.href = "tel:" + client.phone);
  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Mapa carregado só quando a seção se aproxima.
  const map = $("[data-map-embed]");
  if (map) {
    const loadMap = () => { if (!map.src) map.src = client.mapEmbed; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { loadMap(); io.disconnect(); } }, { rootMargin: "600px" });
      io.observe(map);
    } else loadMap();
  }

  // Aberto agora? Calculado no fuso de São Paulo.
  const dayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const fmt = m => Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : "");
  const spNow = () => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
      const get = type => parts.find(p => p.type === type).value;
      return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
    } catch (error) {
      const d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  };
  const updateStatus = () => {
    const now = spNow();
    const today = client.hours[now.day];
    let open = false, label, detail;
    if (today && now.minutes >= today[0] && now.minutes < today[1]) {
      open = true; label = "Aberto agora"; detail = "fecha às " + fmt(today[1]);
    } else {
      label = "Fechado agora";
      for (let i = 0; i < 8; i++) {
        const day = (now.day + i) % 7, h = client.hours[day];
        if (!h || (i === 0 && now.minutes >= h[0])) continue;
        detail = "abre " + (i === 0 ? "hoje" : i === 1 ? "amanhã" : dayNames[day]) + " às " + fmt(h[0]);
        break;
      }
    }
    $$("[data-open-status]").forEach(el => {
      el.classList.toggle("is-open", open);
      $("[data-status-label]", el).textContent = label;
      $("[data-status-detail]", el).textContent = detail || "";
    });
    $$(".hours li").forEach(li => li.classList.toggle("is-today", li.dataset.days.split(",").map(Number).includes(now.day)));
  };
  if (client.hours) {
    updateStatus();
    setInterval(updateStatus, 60000);
  }

  // Avaliações.
  $("[data-reviews]").innerHTML = client.reviews.map(r => {
    const long = r.quote.length > 130 ? "is-long" : "";
    return '<li><article class="review-card"><div class="review-card-top"><span class="stars" aria-label="Cinco estrelas">★★★★★</span><span class="review-tag">' + escapeHTML(r.tag) + '</span></div>' +
      '<blockquote class="' + long + '">“' + escapeHTML(r.quote) + '”</blockquote>' +
      '<div class="review-person"><span class="review-avatar" aria-hidden="true">' + escapeHTML(r.initials) + '</span><div><strong>' + escapeHTML(r.name) + '</strong><a href="' + escapeHTML(client.reviewsUrl) + '" target="_blank" rel="noopener noreferrer">Avaliação no Google ↗</a></div></div></article></li>';
  }).join("");

  // Formato de rosto.
  const tool = $("[data-face-tool]");
  if (tool) {
    const show = key => {
      const face = client.faces[key];
      $$("[data-face]", tool).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.face === key)));
      $("[data-face-title]", tool).textContent = face.title;
      $("[data-face-text]", tool).textContent = face.text;
      $("[data-face-tags]", tool).innerHTML = face.tags.map(t => "<span>" + escapeHTML(t) + "</span>").join("");
    };
    $$("[data-face]", tool).forEach(b => b.addEventListener("click", () => show(b.dataset.face)));
    show("oval");
  }

  // Carrossel.
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  $$("[data-carousel]").forEach(root => {
    const track = $(".carousel-track", root), prev = $("[data-prev]", root), next = $("[data-next]", root), dots = $("[data-dots]", root), status = $("[data-status]", root);
    let stops = [0], active = 0, frame = 0;
    const go = index => track.scrollTo({ left: stops[Math.max(0, Math.min(index, stops.length - 1))], behavior: motion.matches ? "auto" : "smooth" });
    const update = () => {
      frame = 0;
      active = stops.reduce((best, point, i) => Math.abs(point - track.scrollLeft) < Math.abs(stops[best] - track.scrollLeft) ? i : best, 0);
      prev.disabled = active === 0;
      next.disabled = active === stops.length - 1;
      Array.from(dots.children).forEach((dot, i) => dot.setAttribute("aria-current", String(i === active)));
      const label = "Posição " + (active + 1) + " de " + stops.length;
      if (status.textContent !== label) status.textContent = label;
    };
    const measure = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const origin = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().left + track.scrollLeft : 0;
      stops = Array.from(track.children).map(item => Math.min(max, Math.max(0, item.getBoundingClientRect().left + track.scrollLeft - origin)));
      stops = stops.filter((v, i, all) => i === 0 || Math.abs(v - all[i - 1]) > 3);
      if (!stops.length) stops = [0];
      dots.replaceChildren(...stops.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Ir para a posição " + (i + 1));
        b.setAttribute("aria-controls", track.id);
        b.addEventListener("click", () => go(i));
        return b;
      }));
      update();
    };
    prev.addEventListener("click", () => go(active - 1));
    next.addEventListener("click", () => go(active + 1));
    track.addEventListener("keydown", e => {
      const keys = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: stops.length - 1 };
      if (e.key in keys) { e.preventDefault(); go(keys[e.key]); }
    });
    track.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(track); else window.addEventListener("resize", measure);
    measure();
  });

  // Animação de entrada.
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !motion.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -40px" });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add("is-visible"));

  // Menu mobile.
  const menuButton = $("[data-menu-button]"), menu = $("#menu-mobile");
  const closeMenu = () => { menu.hidden = true; menuButton.setAttribute("aria-expanded", "false"); menuButton.setAttribute("aria-label", "Abrir menu"); };
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".site-header")) closeMenu(); });
  window.matchMedia("(min-width: 981px)").addEventListener("change", e => { if (e.matches) closeMenu(); });
})();