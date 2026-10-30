// Admin · Pessoas e acessos (Missão 5A; 02): quem entrou, quando e em qual conta (entradas, uma a cada 30 minutos
// por pessoa e conta), quem está usando agora (o "visto em" dos últimos 15 minutos) e o registro do suporte da
// Renderiza (quem entrou numa conta para ajudar, por quê e até quando), com "Encerrar" para o seu que está valendo.

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados } from "../../ui/estados.js";
import { dataNumerica, hora } from "../../ui/formatos.js";
import { aparelho, usandoAgora } from "../logica.js";
import { encerrarSuporte } from "../suporte.js";

const quando = d => `${dataNumerica(new Date(d))} ${hora(new Date(d))}`;
const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export async function montar(el, { banco, sessao, avisar }) {
  let busca = "";
  let dados = null;
  el.innerHTML = `
    <header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Pessoas e acessos</h1>
      <p class="rz-texto-2">Quem entrou, quando e em qual conta; quem está usando agora; e cada vez que a Renderiza entrou numa conta para ajudar.</p></div></header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const carregar = async () => {
    const t = n => banco.tabela(n);
    const [contas, pessoas, entradas, suportes, equipe] = await Promise.all([
      banco.resultado(t("contas").select("id, nome").limit(2000)),
      banco.resultado(t("pessoas").select("id, conta_id, usuario_id, nome, email, dono, ativa, visto_em").limit(10000)),
      banco.resultado(t("entradas").select("id, usuario_id, conta_id, pessoa_id, quando, aparelho").order("quando", { ascending: false }).limit(200)),
      banco.resultado(t("acessos_suporte").select("id, conta_id, usuario_id, motivo, nivel, inicio, fim").order("inicio", { ascending: false }).limit(50)),
      banco.resultado(t("equipe_renderiza").select("usuario_id, nome")),
    ]);
    return { contas: Object.fromEntries(contas.map(c => [c.id, c.nome])), pessoas, entradas, suportes, equipe: Object.fromEntries(equipe.map(e => [e.usuario_id, e.nome])) };
  };

  function desenhar() {
    const { contas, pessoas, entradas, suportes, equipe } = dados;
    const eu = (sessao.usuario() || {}).id;
    const pessoaDe = e => pessoas.find(p => p.id === e.pessoa_id) || pessoas.find(p => p.usuario_id === e.usuario_id && p.conta_id === e.conta_id);
    const termo = semAcento(busca).trim();
    const bate = (...t) => !termo || t.some(x => semAcento(x).includes(termo));
    const agora = pessoas.filter(p => p.ativa && usandoAgora(p.visto_em)).filter(p => bate(p.nome, p.email, contas[p.conta_id]));
    const lista = entradas.map(e => ({ e, p: pessoaDe(e) })).filter(({ e, p }) => bate(p && p.nome, p && p.email, contas[e.conta_id], equipe[e.usuario_id]));
    const sup = suportes.filter(s => bate(s.motivo, contas[s.conta_id], equipe[s.usuario_id]));
    corpo.innerHTML = `
      <div class="rz-barra-ferramentas"><input class="rz-entrada rz-campo-busca" type="search" placeholder="Buscar pela pessoa, e-mail ou conta" aria-label="Buscar" value="${escapar(busca)}" data-busca></div>
      <section class="rz-secao" aria-labelledby="agora-t"><h2 class="rz-titulo-3" id="agora-t">Usando agora <span class="rz-texto-3">${agora.length}</span></h2>
        ${agora.length ? `<ul class="rz-linhas rz-cartao">${agora.map(p => `<li><a class="rz-linha" href="/admin/contas?conta=${escapar(p.conta_id)}"><span class="rz-linha-texto"><b>${escapar(p.nome)}${p.dono ? " · dono" : ""}</b><small>${escapar([contas[p.conta_id], p.email].filter(Boolean).join(" · "))}</small></span></a></li>`).join("")}</ul>`
          : `<p class="rz-texto-3">Ninguém nos últimos 15 minutos.</p>`}
      </section>
      <section class="rz-secao" aria-labelledby="entradas-t"><h2 class="rz-titulo-3" id="entradas-t">Entradas <span class="rz-texto-3">as últimas ${entradas.length}</span></h2>
        ${lista.length ? `<ul class="rz-linhas rz-cartao">${lista.slice(0, 100).map(({ e, p }) => `<li><a class="rz-linha" href="/admin/contas?conta=${escapar(e.conta_id)}"><span class="rz-linha-texto"><b>${escapar((p && p.nome) || (equipe[e.usuario_id] ? `${equipe[e.usuario_id]} (Renderiza, suporte)` : "Pessoa que saiu"))}</b><small>${escapar([contas[e.conta_id], quando(e.quando), aparelho(e.aparelho)].filter(Boolean).join(" · "))}</small></span></a></li>`).join("")}</ul>`
          : `<p class="rz-texto-3">${busca ? "Nada com essa busca." : "Ninguém entrou ainda."}</p>`}
      </section>
      <section class="rz-secao" aria-labelledby="suporte-t"><h2 class="rz-titulo-3" id="suporte-t">Suporte da Renderiza</h2>
        ${sup.length ? `<ul class="rz-linhas rz-cartao">${sup.map(s => {
            const valendo = Date.parse(s.fim) > Date.now();
            return `<li class="rz-com-acao"><a class="rz-linha" href="/admin/contas?conta=${escapar(s.conta_id)}"><span class="rz-linha-texto"><b>${escapar(contas[s.conta_id] || "Conta")} · ${escapar(s.motivo)}</b><small>${escapar(`${equipe[s.usuario_id] || "Renderiza"} · ${s.nivel === "editar" ? "ver e editar" : "só ver"} · ${quando(s.inicio)} até ${hora(new Date(s.fim))}${valendo ? " · valendo" : ""}`)}</small></span></a>
              ${valendo && s.usuario_id === eu ? `<button class="rz-botao rz-botao--pequeno" type="button" data-encerrar="${escapar(s.conta_id)}">${icone("fechar", { tamanho: 16 })}Encerrar</button>` : ""}</li>`;
          }).join("")}</ul>` : `<p class="rz-texto-3">Nenhum registro.</p>`}
      </section>`;
    const campo = corpo.querySelector("[data-busca]");
    campo.addEventListener("input", () => { busca = campo.value; const pos = campo.selectionStart; desenhar(); const c = corpo.querySelector("[data-busca]"); c.focus(); c.setSelectionRange(pos, pos); });
  }

  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-encerrar]");
    if (!b) return;
    b.disabled = true;
    try {
      await encerrarSuporte(banco, b.dataset.encerrar);
      await sessao.carregarContas();
      avisar("Suporte encerrado.");
      dados = await carregar();
      desenhar();
    } catch (er) { b.disabled = false; avisar(er.message, { tipo: "erro" }); }
  });

  await comEstados(corpo, { carregar, desenhar: d => { dados = d; desenhar(); }, linhas: 6 });
}
