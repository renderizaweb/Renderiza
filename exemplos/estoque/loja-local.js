// O estoque do exemplo, guardado no navegador de quem testa (localStorage), com a mesma forma que o banco vai ter na
// Fase 1 (estoque_itens; 12-modulo-estoque.md). Sem espaço ou bloqueado, segue só na memória até recarregar.

const clonar = v => JSON.parse(JSON.stringify(v));

export function criarLojaLocal({ chave, inicial = [] }) {
  const ler = () => { try { const v = JSON.parse(localStorage.getItem(chave)); return Array.isArray(v) ? v : null; } catch (e) { return null; } };
  let itens = ler() || clonar(inicial);
  let semEspaco = false;
  const ouvintes = new Set();
  const gravar = () => {
    try { localStorage.setItem(chave, JSON.stringify(itens)); semEspaco = false; } catch (e) { semEspaco = true; }
  };
  const mudou = () => { gravar(); ouvintes.forEach(f => f(itens.slice())); };
  const agora = () => new Date().toISOString();
  return {
    listar: () => itens.slice(),
    achar: id => itens.find(i => i.id === id) || null,
    semEspaco: () => semEspaco,
    salvar(item) {
      const novo = { ...item, atualizado_em: agora() };
      const k = itens.findIndex(i => i.id === novo.id);
      if (k >= 0) itens[k] = novo; else itens.unshift({ ...novo, criado_em: agora() });
      mudou();
      return novo;
    },
    mudar(id, patch) {
      const k = itens.findIndex(i => i.id === id);
      if (k < 0) return null;
      itens[k] = { ...itens[k], ...patch, atualizado_em: agora() };
      mudou();
      return itens[k];
    },
    remover(id) { itens = itens.filter(i => i.id !== id); mudou(); },
    repor(lista) { itens = clonar(lista); mudou(); },
    zerar() { try { localStorage.removeItem(chave); } catch (e) { /* bloqueado */ } itens = clonar(inicial); mudou(); },
    aoMudar(f) { ouvintes.add(f); return () => ouvintes.delete(f); },
  };
}
