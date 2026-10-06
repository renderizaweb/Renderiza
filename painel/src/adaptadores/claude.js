// Adaptador do banco do artifact do Claude (window.claude.use("db")).
// Mantém o painel funcionando dentro do Claude enquanto o Supabase não está no ar.
// Documentos no formato antigo são lidos pelo mapeamento de migracao.js; na primeira
// edição o documento é regravado no formato novo, com o original guardado em `legado`.

import { leadEhLegado, conteudoEhLegado, migrarLead, migrarConteudo, completarLead, gerarSqlDeImportacao } from "../migracao.js";
import { validarInteracao, hojeLocal } from "../ritmo.js";

const ERROS_DE_REDE = new Set(["unavailable", "revoked", "not_granted", "capability_disabled", "capability_removed"]);

function erro(e) {
  const code = e && e.code;
  const err = new Error(
    code === "quota_exceeded" ? "O banco do Claude chegou no limite de registros."
    : code === "invalid_argument" ? "O banco do Claude recusou este valor."
    : ERROS_DE_REDE.has(code) || !code ? "Sem conexão com o banco do Claude."
    : String((e && e.message) || e)
  );
  err.rede = !code || ERROS_DE_REDE.has(code);
  err.original = e;
  return err;
}

const agora = () => new Date().toISOString();
const esperar = ms => new Promise(r => setTimeout(r, ms));

export function criarAdaptadorClaude(db) {
  const brutos = {};
  const bruto = tabela => (brutos[tabela] = brutos[tabela] || new Map());
  const col = tabela => db.collection(tabela);

  const paraLinha = (tabela, id, doc) => {
    if (tabela === "leads") return leadEhLegado(doc) ? migrarLead(doc, id) : completarLead({ ...doc, id });
    if (tabela === "conteudos") return conteudoEhLegado(doc) ? migrarConteudo(doc, id) : { ...doc, id };
    return { ...doc, id };
  };
  const ehLegado = (tabela, doc) => (tabela === "leads" ? leadEhLegado(doc) : tabela === "conteudos" ? conteudoEhLegado(doc) : false);

  // Aqui não há gatilhos de banco: as regras das interações (as mesmas do Supabase) são checadas antes de gravar.
  function conferirInteracao(linha) {
    const daOtica = [...bruto("interacoes").entries()].map(([id, d]) => ({ ...d, id })).filter(i => i.lead_id === linha.lead_id);
    if (!bruto("leads").has(linha.lead_id)) throw Object.assign(new Error("Ótica não encontrada. Ela pode ter sido excluída."), { rede: false });
    const msg = validarInteracao(linha, daOtica, hojeLocal());
    if (msg) throw Object.assign(new Error(msg), { rede: false });
  }

  // "unavailable" é passageiro: tenta mais uma vez antes de desistir.
  async function tentar(fn) {
    try { return await fn(); } catch (e) {
      if (e && e.code === "unavailable") { await esperar(400 + Math.random() * 600); try { return await fn(); } catch (e2) { throw erro(e2); } }
      throw erro(e);
    }
  }

  return {
    nome: "Banco do Claude",
    precisaLogin: false,

    async listar(tabela) {
      const snap = await tentar(() => col(tabela).get());
      brutos[tabela] = new Map(snap.docs.map(d => [d.id, d.data()]));
      return snap.docs.map(d => paraLinha(tabela, d.id, d.data())).sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)));
    },

    async inserir(tabela, linha) {
      if (tabela === "interacoes") conferirInteracao(linha);
      const { id: idDado, ...resto } = linha; // demos: o id é o nome da pasta
      const ref = idDado ? col(tabela).doc(idDado) : col(tabela).doc();
      const doc = { ...resto, criado_em: agora(), atualizado_em: agora() };
      await tentar(() => ref.set(doc));
      bruto(tabela).set(ref.id, doc);
      return { ...doc, id: ref.id };
    },

    async atualizar(tabela, id, mudancas) {
      const ref = col(tabela).doc(id);
      const atual = bruto(tabela).get(id);
      if (!atual) throw Object.assign(new Error("Registro não encontrado. Ele pode ter sido excluído."), { rede: false });
      if (tabela === "interacoes") conferirInteracao({ ...atual, ...mudancas, id });
      let doc;
      if (ehLegado(tabela, atual)) {
        // Primeira edição de um registro antigo: grava tudo no formato novo, com o original em `legado`.
        const { id: _id, ...convertido } = paraLinha(tabela, id, atual);
        doc = { ...convertido, ...mudancas, atualizado_em: agora() };
        await tentar(() => ref.set(doc));
      } else {
        const patch = { ...mudancas, atualizado_em: agora() };
        await tentar(() => ref.update(patch));
        doc = { ...atual, ...patch };
      }
      bruto(tabela).set(id, doc);
      return { ...doc, id };
    },

    async excluir(tabela, id) {
      await tentar(() => col(tabela).doc(id).delete());
      bruto(tabela).delete(id);
    },

    verificar: () => tentar(() => col("leads").limit(1).get()),

    assinar(tabela, aoMudar) {
      col(tabela).onSnapshot(snap => {
        if (snap.metadata && snap.metadata.hasPendingWrites) return; // só entrega o que o banco já confirmou
        snap.docChanges().forEach(ch => {
          const id = ch.doc.id;
          if (ch.type === "removed") { bruto(tabela).delete(id); aoMudar("DELETE", null, { id }); return; }
          const doc = ch.doc.data();
          bruto(tabela).set(id, doc);
          aoMudar(ch.type === "added" ? "INSERT" : "UPDATE", paraLinha(tabela, id, doc), null);
        });
      }, () => { /* sem tempo real: segue funcionando */ });
    },

    /** SQL para levar todos os dados daqui para o Supabase (inclui portfólio, lançamentos etc. como arquivo). */
    async exportarSql() {
      const ler = async nome => (await tentar(() => col(nome).get())).docs.map(d => ({ id: d.id, doc: d.data() }));
      const [leads, conteudos, interacoes, ciclos, portfolio, lancamentos, semanas, config] = await Promise.all(["leads", "conteudos", "interacoes", "ciclos", "portfolio", "lancamentos", "semanas", "config"].map(ler));
      return gerarSqlDeImportacao({ leads, conteudos, interacoes, ciclos, outras: { portfolio, lancamentos, semanas, config } });
    },
  };
}
