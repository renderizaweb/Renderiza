# Trabalho em várias sessões

O painel é construído por **várias sessões do Claude**, tocadas por uma pessoa da Renderiza (decidido em
28/10/2026). Às vezes são tarefas em paralelo, uma em cada sessão; às vezes é **a mesma tarefa continuando em outra
sessão**, porque a primeira bateu o limite de uso e é preciso esperar. Em todos os casos, a sessão nova não sabe nada
do que a anterior fez, a não ser o que estiver no repositório. Por isso valem as regras abaixo. Toda sessão lê este
arquivo antes de começar.

## Onde está a verdade

1. **[`tarefas.md`](tarefas.md):** o que cada tarefa faz, do que depende, o que pode alterar, em que pé está, em que
   branch, e as migrações já aplicadas no banco real.
2. **[`01-trilho.md`](01-trilho.md):** em que parada o projeto está e o diário de bordo.
3. **Os contratos entre as partes:** as tabelas ([`05`](05-dados-e-permissoes.md)), a API pública
   ([`04`](04-arquitetura.md)) e o formato do Meu site ([`03`](03-modulo-meu-site.md)). Quem muda um contrato muda o
   documento no mesmo commit e escreve um aviso no quadro.

## Começar (ou continuar) uma tarefa

1. A Renderiza diz qual tarefa a sessão pega ("você pega a T3.2" ou "continue a T3.2"). Sem tarefa definida, a
   sessão pergunta antes de começar.
2. `git fetch` da `main` e, se a tarefa já tiver branch no quadro, dessa branch. **Continuando?** Comece pela branch
   que está no quadro e pela nota de passagem da tarefa (abaixo); não refaça o que já está feito.
3. Ler: o README da pasta, o trilho, este arquivo, a linha e a nota da tarefa e os documentos que ela cita.
4. Conferir as dependências ("Depende de"). Dependência não pronta: avisar e não começar (ou adiantar só o que não
   depende dela).
5. No primeiro commit, mudar no quadro **só a linha da sua tarefa**: `em andamento` e a branch.

## Durante a tarefa

- **A sessão pode acabar a qualquer hora** (limite de uso). Então: commit e push a cada pedaço que funciona, nunca
  só no fim.
- **Nota de passagem sempre em dia.** No fim do quadro, cada tarefa em andamento tem uma nota curta: o que já está
  feito, o que falta, o próximo passo, decisões tomadas no caminho, migrações aplicadas. Atualize junto com os
  commits, para outra sessão continuar de onde parou.
- **Mexa só no que está em "Mexe em".** Precisa mudar algo fora disso? Se for pequeno (uma linha, um import), faça e
  escreva no aviso do quadro. Se for grande, pare e peça uma tarefa nova.
- **Arquivos comuns têm dono.** O esqueleto (`src/app.js`, `src/rotas.js`, `src/modulos/index.js`,
  `src/admin/index.js`) nasce na T1.5 com todos os módulos já registrados; as peças comuns (`src/ui/`,
  `src/nichos/`, `estilo.css`) nascem na T2.5. Depois disso, mudança nesses arquivos só com aviso no quadro.
- **Um módulo, uma pasta.** Cada módulo vive em `src/modulos/<nome>/` e usa as peças comuns; nada de copiar código
  de outro módulo.
- **Commits pequenos**, com a tarefa no começo da mensagem ("T3.2 · agenda: semana por horário").
- **Dados só fictícios** (Villa Alecrim, Estúdio Ciranda). Nunca dado real de cliente, nem em teste.

## O banco: cada sessão aplica as suas migrações, com cuidado

Cada sessão tem acesso direto ao Supabase e aplica as migrações da própria tarefa. São dois bancos do Painel
Renderiza (`04`): o **STG**, com dados fictícios, e a **produção**, com clientes reais. O banco do Painel de
prospecção nunca é tocado. É o ponto mais sensível do projeto, então:

1. **Toda mudança no banco é uma migração** em `painel-clientes/supabase/migrations/`, com nome
   `AAAAMMDDHHMMSS_assunto.sql` (data e hora no nome: duas sessões nunca criam o mesmo número).
2. **Teste antes, no banco local** (Postgres 16 do ambiente; rotina da T1.6), incluindo a RLS e o teste de
   isolamento de toda tabela nova.
3. **Sempre STG primeiro, produção depois.** Aplicou no STG, confira que o painel funciona lá (a prévia da branch
   na Vercel já usa o STG). Só então aplique a mesma migração na produção. Nunca na produção sem ter passado pelo STG.
4. **Antes de aplicar, confira o que já está no banco:** a lista de migrações aplicadas nele e a tabela "Migrações
   aplicadas" do quadro. Se o banco tem uma migração que você não tem na branch, traga a branch dela antes de seguir.
5. **Aplique pelo caminho que registra a migração no próprio banco** (a ferramenta de migração do conector do
   Supabase ou o `supabase db push`), uma de cada vez, em ordem. Confira duas vezes em qual projeto está conectado.
6. **Logo depois de aplicar:** push da branch com o arquivo da migração e a linha em "Migrações aplicadas" no quadro
   (data, arquivo, tarefa, branch, STG e produção). Assim outra sessão nunca encontra o banco diferente do que está
   no repositório.
7. **Migração aplicada nunca é editada** (nem no STG). Precisa mudar? Migração nova.
8. **Nada destrutivo na produção sem a Renderiza dizer "pode":** apagar tabela ou coluna com dados, `delete` ou `update` em massa,
   mudar a RLS para afrouxar. Na dúvida, pergunte.
9. **Só estrutura, nunca dado de cliente** pelas migrações. A semente de teste (T2.3) roda no banco local e no STG,
   nunca na produção.

A parada 2 cria **o banco inteiro de uma vez** (T2.1 e T2.2). Assim os módulos da parada 3 quase não precisam de
migração, e as que precisarem são pequenas e só da sua área.

## Entregar

1. Trazer a `main` atualizada para a sua branch; resolver conflitos mantendo o trabalho dos dois lados (nunca apagar o
   que outra sessão fez).
2. Rodar os testes (os da pasta e os do banco). Tudo verde.
3. Push da branch e, no quadro: `pronta para subir`, com uma linha do que fez, do que testou e do que ficou de fora.
4. **Juntar e subir para a `main` é com a Renderiza.** A sessão não junta na `main` por conta própria, a não ser que a
   Renderiza peça.
5. Depois de subir: `feita` no quadro e uma linha no diário de bordo do trilho. Se a tarefa fechou uma parada,
   atualizar o painel de bordo do trilho e o "Onde o trem está" do README.

## Quando der problema

- **Conflito no quadro:** cada sessão só mexe na própria linha e na própria nota, então é só manter as duas.
- **Achou um bug fora da sua área:** aviso no quadro; não conserte no meio da sua tarefa.
- **Dúvida de produto** (o que o módulo deve fazer): o exemplo em `exemplos/` decide. Se o exemplo não responde e a
  dúvida trava a tarefa, pergunte à Renderiza e registre a resposta no `07`. Não pergunte o que é operação da
  Renderiza (quem é admin, valores de proposta, como subir).
- **Duas tarefas precisando do mesmo arquivo:** quem chegou primeiro segue; a outra espera ou combina pelo aviso.

## O que não fazer

- Começar sem tarefa definida, ou pegar uma que está `em andamento` em outra sessão sem a Renderiza pedir.
- Aplicar migração na produção sem passar pelo STG, sem conferir o que já está aplicado ou sem registrar no quadro.
- Tocar no banco do Painel de prospecção.
- Mudar o formato de uma tabela, da API ou do Meu site sem atualizar o documento e avisar no quadro.
- Pôr identificador de modelo de IA nos commits, chave no código ou dado real no repositório.
