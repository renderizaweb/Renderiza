// O catálogo das demos para o painel (Missão 7, bloco C; D51): de cada demos/<pasta>/demo.json de eventos e de
// fotografia, só o que o painel e a IA do onboarding usam (o negócio, o contato, o endereço, as cores, os tipos de
// festa ou de ensaio, o que oferece, as avaliações sem o nome de quem avaliou). As óticas e os consultórios ficam de
// fora (o painel é de eventos e fotografia). Testado em test/demos.test.mjs; gravado por scripts/demos.mjs.

const texto = (v, max = 400) => (typeof v === "string" ? v.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "");
const lista = (v, max = 12) => (Array.isArray(v) ? v.map(x => texto(x, 80)).filter(Boolean).slice(0, max) : []);
const cor = v => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);

/** O nicho da demo pelo gerador que a fez: "eventos", "fotografia" ou null (as outras). */
export function nichoDaDemo(d) {
  if (d && d.consulta && Array.isArray(d.carrosseis)) return "eventos";
  if (d && d.site && d.site.hero && Array.isArray(d.site.hero.especialidades)) return "fotografia";
  return null;
}

/** A linha do catálogo: { pasta, nicho, nome, dados }, ou null se a demo não é de eventos nem de fotografia. */
export function dadosDaDemo(d, pasta) {
  const nicho = nichoDaDemo(d);
  if (!nicho || !/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(pasta || "")) return null;
  const nome = texto(d.marca_completa || d.marca, 120);
  if (!nome) return null;
  const whatsapp = String(d.whatsapp || "").replace(/\D/g, "");
  const dados = {
    nome,
    whatsapp: /^\d{10,15}$/.test(whatsapp) ? whatsapp : null,
    instagram: texto(d.instagram, 60).replace(/^@/, "") || null,
    endereco: texto(d.endereco_maps, 200) || null,
    regiao: texto(d.logo_sub || (d.site && d.site.hero && d.site.hero.eyebrow), 80) || null,
    google: d.google_nota ? { nota: texto(d.google_nota, 5), total: texto(d.google_total, 10) } : null,
    cor: cor(d.cores && d.cores.acento),
    cor_escura: cor(d.cores && (d.cores.escuro || d.cores.tinta)),
    descricao: texto(nicho === "eventos" ? d.descricao : d.site && d.site.descricao, 400) || null,
    slogan: texto(d.slogan, 120) || null,
    tipos: nicho === "eventos" ? lista(d.consulta.tipos).filter(t => !/^outr[ao]/i.test(t)) : lista(d.site.hero.especialidades),
    oferece: nicho === "eventos" && d.estrutura ? lista((d.estrutura.itens || []).map(i => (Array.isArray(i) ? i[1] : i))) : [],
    sobre: (s => (s ? (Array.isArray(s.p) ? s.p : [s.p || s.texto]).map(p => texto(p, 500)).filter(Boolean).slice(0, 3) : []))(nicho === "eventos" ? d.sobre : d.site.sobre),
    dono: texto(d.dona, 60) || null,
    dias: texto(d.dias_curto, 40) || null,
    horas: nicho === "fotografia" && d.horarios ? lista(d.horarios.horas, 10) : [],
    // as avaliações do Google mostradas na demo: o tipo e o trecho, sem o nome de quem avaliou
    avaliacoes: (Array.isArray(d.avaliacoes) ? d.avaliacoes : (d.site && Array.isArray(d.site.avaliacoes) ? d.site.avaliacoes : [])).slice(0, 6).map(a => ({ tipo: texto(a.tag, 40), trecho: texto(a.trecho, 300) })).filter(a => a.trecho),
  };
  return { pasta, nicho, nome, dados };
}
