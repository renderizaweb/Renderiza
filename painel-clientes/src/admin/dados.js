// Admin (Missão 5A): o que as partes leem do banco, junto. A Renderiza vê contas, pessoas, módulos, entradas e
// pagamentos (RLS, 05); nunca os dados das contas (clientes, festas, valores) sem suporte registrado.

const COLUNAS_CONTA = "id, nome, nicho, codigo, whatsapp, fuso, logo, situacao, teste_ate, ativa_ate, origem, limite_pessoas, criado_em";

/** As contas com as pessoas, os donos, os módulos ligados e o último acesso; e o catálogo de módulos. */
export async function carregarContas(banco) {
  const t = n => banco.tabela(n);
  const [contas, pessoas, ligados, catalogo] = await Promise.all([
    banco.resultado(t("contas").select(COLUNAS_CONTA).order("criado_em", { ascending: false }).limit(2000)),
    banco.resultado(t("pessoas").select("id, conta_id, usuario_id, nome, email, dono, ativa, visto_em, acessos, criado_em").limit(10000)),
    banco.resultado(t("contas_modulos").select("conta_id, modulo_id, ligado, desde").limit(20000)),
    banco.resultado(t("modulos").select("id, nome, preco, liberado_no_teste, ordem").order("ordem")),
  ]);
  for (const c of contas) {
    c.pessoas = pessoas.filter(p => p.conta_id === c.id);
    c.donos = c.pessoas.filter(p => p.dono && p.ativa);
    c.ativas = c.pessoas.filter(p => p.ativa).length;
    c.ligados = catalogo.map(m => m.id).filter(id => ligados.some(l => l.conta_id === c.id && l.modulo_id === id && l.ligado));
    c.vistoEm = c.pessoas.map(p => p.visto_em).filter(Boolean).sort().at(-1) || null;
  }
  return { contas, catalogo, ligados };
}
