# Trabalho em paralelo (várias sessões de IA ao mesmo tempo)

O painel é construído por **várias sessões do Claude ao mesmo tempo** (pedido de 28/10/2026), cada uma numa parte.
Para elas não se baterem, valem as regras abaixo. Toda sessão lê este arquivo antes de começar.

## Os três lugares que todo mundo consulta

1. **[`tarefas.md`](tarefas.md):** quem está fazendo o quê, em qual branch, e o que cada tarefa pode alterar.
2. **[`01-trilho.md`](01-trilho.md):** em que parada o projeto está e o diário de bordo.
3. **Os contratos entre as partes:** as tabelas ([`05`](05-dados-e-permissoes.md)), a API pública
   ([`04`](04-arquitetura.md)) e o formato do Meu site ([`03`](03-modulo-meu-site.md)). Quem muda um contrato muda o
   documento no mesmo pull request e escreve um aviso no quadro.

## Começar uma tarefa

1. Quem distribui é a pessoa da Renderiza que abre a sessão ("você pega a T3.2"). Sem tarefa definida, a sessão
   pergunta antes de começar.
2. `git fetch origin main` e começar a branch a partir da `main` atualizada.
3. Ler: o README da pasta, o trilho, este arquivo, a linha da tarefa no quadro e os documentos que ela cita.
4. Conferir as dependências da tarefa ("Depende de"). Dependência não pronta: avisar e não começar (ou combinar o
   pedaço que dá para adiantar).
5. No primeiro commit, mudar no quadro **só a linha da sua tarefa**: `em andamento` e o nome da branch.

## Durante a tarefa

- **Mexa só no que está em "Mexe em".** Precisa mudar algo fora disso? Se for pequeno (uma linha, um import), faça e
  escreva no aviso do quadro. Se for grande, pare e peça uma tarefa nova.
- **Arquivos comuns têm dono.** O esqueleto (`src/app.js`, `src/rotas.js`, `src/modulos/index.js`,
  `src/admin/index.js`) nasce na T1.5 com todos os módulos já registrados; as peças comuns (`src/ui/`,
  `src/nichos/`, `estilo.css`) nascem na T2.5. Depois disso, mudança nesses arquivos só com aviso no quadro.
- **Um módulo, uma pasta.** Cada módulo vive em `src/modulos/<nome>/` e usa as peças comuns; nada de copiar código de
  outro módulo.
- **Commits pequenos e frequentes**, com a tarefa no começo da mensagem ("T3.2 · agenda: semana por horário").
- **Dados só fictícios** (Villa Alecrim, Estúdio Ciranda). Nunca dado real de cliente, nem em teste.

## O banco (o ponto mais sensível)

- **Toda mudança no banco é uma migração** em `painel-clientes/supabase/migrations/`, com nome
  `AAAAMMDDHHMMSS_assunto.sql` (data e hora no nome: duas sessões nunca criam o mesmo número).
- **Migração que já está na `main` nunca é editada.** Precisa mudar? Migração nova.
- **Toda tabela nova chega com a RLS e o teste de isolamento** no mesmo pull request.
- **Testes no banco local** (Postgres 16 do ambiente; rotina da T1.6) antes de abrir o pull request.
- **Só migração que já está na `main` vai para o banco real, em ordem, e só uma pessoa ou sessão aplica** (definir
  na rodada 2). Nenhuma sessão muda o banco real por conta própria, nem pelo painel do Supabase, nem pelo conector.
- A parada 2 cria **o banco inteiro de uma vez** (T2.1 e T2.2). Assim os módulos da parada 3 quase não precisam de
  migração, e as que precisarem são pequenas e só da sua área.

## Entregar

1. `git fetch origin main` e trazer a `main` para a sua branch; resolver conflitos mantendo o trabalho dos dois
   lados (nunca apagar o que outra sessão fez).
2. Rodar os testes (`npm test` da pasta e os testes do banco). Tudo verde antes de abrir o pull request.
3. Abrir o pull request para a `main` com o título "T3.2 · Agenda" e, no texto: o que fez, o que testou, o que ficou
   de fora.
4. No quadro: `em revisão`. Depois do merge: `feita`, e uma linha no diário de bordo do trilho.
5. Se a tarefa fechou uma parada, atualizar o painel de bordo do trilho e o "Onde o trem está" do README.

## Quando der problema

- **Conflito no quadro:** cada sessão só mexe na própria linha, então é só manter as duas linhas.
- **Achou um bug fora da sua área:** aviso no quadro; não conserte no meio da sua tarefa.
- **Dúvida de produto** (o que o módulo deve fazer): o exemplo em `exemplos/` decide; se o exemplo não responde,
  pergunte à Renderiza e registre a resposta no `07`.
- **Duas tarefas precisando do mesmo arquivo:** quem chegou primeiro segue; a outra espera ou combina pelo aviso.

## O que não fazer

- Começar sem tarefa no quadro, ou pegar uma que já está `em andamento`.
- Mexer na `main` sem pull request (o resto do repositório, como as demos, segue o fluxo dele).
- Aplicar migração no banco real fora da regra acima.
- Mudar o formato de uma tabela, da API ou do Meu site sem atualizar o documento e avisar no quadro.
- Pôr identificador de modelo de IA nos commits, chave no código ou dado real no repositório.
