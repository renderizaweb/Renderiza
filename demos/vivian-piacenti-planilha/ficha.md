# Estúdio Vivian Piacenti · planilha financeira

| | |
|---|---|
| Onde | Limão, São Paulo (a mesma cliente da demo `vivian-piacenti-fotografia`) |
| Instagram | [@estudiovivianpiacenti](https://www.instagram.com/estudiovivianpiacenti/) |
| Lead no painel | `vivian-piacenti-planilha` (separado do lead do site, `vivian-piacenti-fotografia`) |
| Entregável | a demo/proposta da planilha (`index.html`), a versão de teste (`Planilha-Estudio-Vivian-Piacenti-TESTE.xlsx`) e, depois do Pix, a dela cifrada (`planilha.bin`) |
| Situação | pronta · 18/11/2026 · `/demo/vivian-piacenti-planilha` (a dela ainda não está na página) |
| Valor | R$ 120, valor único (na página; conferir com o Kaue antes de mandar) |

## De onde veio
- Ela recusou o Painel Renderiza e perguntou no WhatsApp (sábado, 14/11/2026): "Vcs fazem planilha personalizada?". Pediu:
  Excel que soma sozinho por mês, gastos fixos pessoais, estúdio por tipo (aluguel, bexigas, cenários, luz), aba de foto
  extra, gastos do mês (Uber, Shopee, Mercado Livre), escrever o que é cada gasto e cada valor, mais linhas, espaço para
  aniversários e ensaios. Mandou a planilha de hoje (feita pelo marido).
- Pesquisa, decisões e passo a passo: `docs/produtos/planilha-financeira.md`.

## Como gerar
- `planilha.json` (aqui) tem o nome, as cores, as categorias, as contas fixas e os textos da página. Nunca valores dela.
- `python3 -I ferramentas/planilha/gerar-planilha.py demos/vivian-piacenti-planilha/planilha.json --conferir --imagens`
- `node ferramentas/planilha/gerar-pagina.mjs vivian-piacenti-planilha` (com `--codigo` depois do Pix).
- Os arquivos gerados e o código ficam em `rascunhos/planilha/vivian-piacenti-planilha/` (fora do git).

## Conferir antes de mandar
- O valor e "os ajustes que faltarem depois do teste, antes da entrega" (no `planilha.json`, `pagina`).
- Abrir a versão de teste no Excel e no Google Planilhas (aqui só no LibreOffice) e a página num celular.
- No painel: a demo vale 7 dias a partir de 18/11; ao mandar o link, usar "7 dias a partir de hoje". Depois do Pix, "No ar
  sem prazo" (ela baixa a dela por esta página).
- Depois do Pix: os nomes das contas como ela usa (Colégio da Isa? a Emily é da casa ou do estúdio?) e os tipos de ensaio
  que ela vende de verdade.
