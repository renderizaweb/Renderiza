// Família fictícia (Ana e Bruno) para os prints do Compasso. Usa as regras do próprio app.
import { emptyState, validateState, cellKey, currentMonth, addMonths, calculateMonth } from '/home/user/compasso-familiar/lib/finance.ts';
import { writeFileSync } from 'node:fs';
const atual = currentMonth();
const meses = Array.from({ length: 9 }, (_, i) => addMonths(atual, i - 6)); // 6 passados, atual, 2 à frente
const s = emptyState(atual);
const linhas = [
  ['sal-ana', 'Salário Ana', 'income', 'Renda base', 580000],
  ['sal-bruno', 'Salário Bruno', 'income', 'Renda base', 460000],
  ['extras', 'Trabalhos extras', 'income', 'Extra', 60000, true],
  ['aluguel', 'Aluguel', 'expense', 'Moradia', 210000, false, 'essential'],
  ['condominio', 'Condomínio', 'expense', 'Moradia', 62000, false, 'essential'],
  ['energia', 'Energia', 'expense', 'Casa', 21000, false, 'essential'],
  ['internet', 'Internet e celulares', 'expense', 'Casa', 18000, false, 'essential'],
  ['mercado', 'Mercado', 'expense', 'Alimentação', 150000, false, 'essential'],
  ['escola', 'Escola', 'expense', 'Educação', 98000, false, 'essential'],
  ['saude', 'Plano de saúde', 'expense', 'Saúde', 76000, false, 'essential'],
  ['carro', 'Parcela do carro', 'expense', 'Transporte', 89000, false, 'temporary'],
  ['academia', 'Academia', 'expense', 'Saúde', 18000, false, 'adjustable'],
  ['lazer', 'Lazer e restaurantes', 'expense', 'Lazer', 45000, false, 'adjustable'],
  ['reserva', 'Reserva de emergência', 'reserve', 'Proteção', 80000],
  ['viagem', 'Viagem de fim de ano', 'reserve', 'Meta', 30000],
];
for (const [id, name, kind, tag, , extra = false, expenseClass] of linhas) s.rows.push({ id, name, kind, tag, extra, ...(expenseClass ? { expenseClass } : {}) });
meses.forEach((m, i) => {
  s.months[m] = { openingCents: i === 0 ? 120000 : null, ceilingCents: 950000 };
  for (const [id, , kind, , valor] of linhas) {
    const passado = m < atual, variacao = kind === 'expense' && ['mercado', 'energia', 'lazer'].includes(id) ? 1 + ((i * 7) % 5 - 2) / 20 : 1;
    const feito = passado || (m === atual && ['sal-ana', 'sal-bruno', 'aluguel', 'condominio', 'escola', 'saude', 'internet', 'reserva'].includes(id));
    if (id === 'carro' && i > 7) continue;
    s.cells[cellKey(id, m)] = { amountCents: Math.round(valor * variacao / 100) * 100, done: feito };
  }
});
s.strategy = { reserveBalanceCents: 2860000, protectedMonthsTarget: 6, minimumContributionCents: null };
validateState(s);
writeFileSync('./estado.json', JSON.stringify({ state: s, revision: 12, mutationId: null, backend: 'supabase' }));
console.log(atual, JSON.stringify(calculateMonth(s, atual)).slice(0, 300));
