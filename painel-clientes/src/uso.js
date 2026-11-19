// O uso do painel (19/11/2026; migração 20261119004809): enquanto a pessoa está numa conta, com o painel à vista e
// mexendo, um sinal por minuto (registrar_uso) com a parte aberta. Aba escondida, ou ninguém mexe há 5 minutos (o
// painel ficou aberto esquecido): não conta. O banco soma no máximo um minuto por minuto, então duas abas não contam
// em dobro. Falhar nunca atrapalha quem está usando. Quem lê é só o Admin (Pessoas e acessos, e a gaveta da conta).

export const MINUTO = 60000;
export const PARADO = 5 * 60000;

/** Este minuto conta? A aba à vista e um toque, tecla ou rolagem nos últimos 5 minutos. */
export const contaEsteMinuto = ({ visivel, ultimoMexer, agora }) => visivel && agora - ultimoMexer < PARADO;

/**
 * Liga o contador (uma vez, no app.js). Devolve onde(conta, modulo): o app diz onde a pessoa está a cada tela
 * (fora de uma conta: onde(null)). `ambiente`: janela, documento e relógio (os testes trocam).
 */
export function ligarContadorDeUso(banco, { janela = window, doc = document, agora = () => Date.now(), cada = (fn, ms) => setInterval(fn, ms) } = {}) {
  let conta = null, modulo = null, ultimoMexer = agora();
  const mexeu = () => { ultimoMexer = agora(); };
  for (const ev of ["pointerdown", "keydown", "wheel", "touchstart", "scroll"]) janela.addEventListener(ev, mexeu, { passive: true, capture: true });
  cada(() => {
    if (!conta || !contaEsteMinuto({ visivel: doc.visibilityState === "visible", ultimoMexer, agora: agora() })) return;
    Promise.resolve().then(() => banco.rpc("registrar_uso", { conta, modulo: modulo || "outro" })).catch(() => { /* fica para o próximo minuto */ });
  }, MINUTO);
  return {
    onde(novaConta, novoModulo = null) { conta = novaConta || null; modulo = novoModulo; },
  };
}
