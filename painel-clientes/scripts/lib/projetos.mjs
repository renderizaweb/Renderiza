// Os dois projetos do Painel Renderiza no Supabase (STG e produção), lidos das variáveis PAINEL_*_SUPABASE_URL.
// Usado pelos scripts que mexem nos projetos (migrar.mjs, auth.mjs): conferem duas vezes em qual projeto estão.

import { projeto, refDaUrl, PROJETO_DA_PROSPECCAO } from "./supabase-api.mjs";

export const ALVOS = {
  stg: { nome: "STG", o: "o STG", no: "no STG", variavel: "PAINEL_STG_SUPABASE_URL" },
  producao: { nome: "PRODUÇÃO", o: "a produção", no: "na produção", variavel: "PAINEL_PROD_SUPABASE_URL" },
};

export function refDo(alvo) {
  const { variavel } = ALVOS[alvo];
  const ref = refDaUrl(process.env[variavel]);
  if (!ref) throw new Error(`${variavel} ausente ou fora do formato https://<ref>.supabase.co.`);
  if (ref === PROJETO_DA_PROSPECCAO) throw new Error(`${variavel} aponta para o banco do Painel de prospecção. Pare e confira o ambiente.`);
  return ref;
}

/** Confere duas vezes o projeto: o ref vem da variável e o nome vem do próprio Supabase. */
export async function conferirProjeto(alvo) {
  const ref = refDo(alvo);
  const outro = refDo(alvo === "stg" ? "producao" : "stg");
  if (ref === outro) throw new Error("PAINEL_STG_SUPABASE_URL e PAINEL_PROD_SUPABASE_URL apontam para o mesmo projeto.");
  const p = await projeto(ref);
  const pareceStg = /\bstg\b/i.test(p.name);
  if (alvo === "stg" && !pareceStg) throw new Error(`O projeto ${ref} ("${p.name}") não parece ser o STG.`);
  if (alvo === "producao" && pareceStg) throw new Error(`O projeto ${ref} ("${p.name}") parece ser o STG, não a produção.`);
  return { ref, nome: p.name, regiao: p.region, situacao: p.status };
}

/** Na produção, o ref tem que vir repetido na linha de comando: --projeto <ref> (08, regra 5). */
export function exigirConfirmacaoDaProducao(p, confirmado) {
  if (confirmado !== p.ref) {
    throw new Error(`Para mexer na produção, confirme o projeto: --projeto ${p.ref} ("${p.nome}"). Confira duas vezes (08, regra 5).`);
  }
}
