# Prints do Compasso (site público)

As telas em site/estatico/imagens/compasso/ saem do **app real** (`Kaue7almeida/compasso-familiar`) com uma
**família fictícia** (Ana e Bruno), gerada pelas regras do próprio app. Nada vem do banco real, e o nome do casal
(Kaue & Milena) fica escondido nos prints.

1. `node --experimental-strip-types gerar.mjs` (com o compasso-familiar em /home/user/compasso-familiar) → estado.json.
2. No compasso-familiar, crie **só localmente** `app/print-demo/page.tsx` renderizando `<FinanceApp />` e rode
   `npx next dev -p 3200`. Apague a página depois (e os AGENTS.md/CLAUDE.md que o next dev cria).
3. `node print.mjs saida.png 1366 900` (desktop) ou `INTEIRA=1 node print.mjs saida.png 390 844` (celular, página
   inteira). Ações extras separadas por `>>>` (seletor para clicar ou `ESC`).
4. Recorte com `../prints-move/recorte2.mjs`.
