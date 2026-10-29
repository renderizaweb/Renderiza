# Trabalho em várias sessões

O painel é construído por **várias sessões do Claude**, tocadas por uma pessoa da Renderiza (decidido em
28/10/2026). O trabalho é dividido em **missões** ([`missoes.md`](missoes.md)), uma por parada; as missões 3, 4 e 5
podem rodar ao mesmo tempo e ser divididas por blocos. Às vezes uma sessão **continua a missão de outra**, porque a
primeira bateu o limite de uso. A sessão nova não sabe nada do que a anterior fez, a não ser o que estiver no
repositório. Por isso valem as regras abaixo. Toda sessão lê este arquivo antes de começar.

## Onde está a verdade

1. **[`missoes.md`](missoes.md):** o que cada missão entrega, em que pé está, em que branch, o que cada bloco pode
   alterar, as notas de passagem e as migrações já aplicadas.
2. **[`01-trilho.md`](01-trilho.md):** em que parada o projeto está e o diário de bordo.
3. **Os contratos entre as partes:** as tabelas ([`05`](05-dados-e-permissoes.md)), a API pública
   ([`04`](04-arquitetura.md)), o formato do Meu site ([`03`](03-modulo-meu-site.md)) e as peças de tela
   ([`09`](09-ux.md)). Quem muda um contrato muda o documento no mesmo commit e deixa um aviso em `missoes.md`.

## Começar (ou continuar) uma missão

1. A Renderiza diz a missão (e o bloco, se for dividida). Sem isso, a sessão pergunta antes de começar.
2. `git fetch` da `main` e, se a missão já tiver branch em `missoes.md`, dessa branch. **Continuando?** Comece pela
   branch e pela nota de passagem; não refaça o que já está feito.
3. Ler: o README da pasta, o trilho, este arquivo, a missão em `missoes.md` e os documentos que ela cita.
4. Conferir se a missão anterior está pronta (a tabela "Situação"). Não está: avisar e adiantar só o que não depende
   dela.
5. No primeiro commit, mudar em `missoes.md` **só a linha da sua missão**: `em andamento` e a branch.

## Durante a missão

- **A sessão pode acabar a qualquer hora** (limite de uso). Commit e push a cada pedaço que funciona, nunca só no fim.
- **Nota de passagem sempre em dia** (em `missoes.md`): o que está feito, o que falta, o próximo passo, decisões
  tomadas no caminho, migrações aplicadas. Outra sessão tem que conseguir continuar só com ela.
- **Mexa só no que está em "Mexe em"** da sua missão ou bloco. Precisa mudar algo fora disso? Se for pequeno, faça e
  deixe um aviso; se for grande, pare e pergunte.
- **Arquivos comuns têm dono.** O esqueleto (`src/app.js`, `src/rotas.js`, `src/modulos/index.js`,
  `src/admin/index.js`) nasce na Missão 1 com todos os módulos já registrados; as peças comuns (`src/ui/`,
  `src/nichos/`, `estilo.css`) nascem na Missão 2. Depois disso, mudança nesses arquivos só com aviso.
- **Um módulo, uma pasta** (`src/modulos/<nome>/`), usando as peças comuns; nada de copiar código de outro módulo.
- **Commits pequenos**, com a missão no começo da mensagem ("M3 · agenda: semana no celular").
- **Dados só fictícios** (Villa Alecrim, Estúdio Ciranda). Nunca dado real de cliente, nem em teste.

## O banco: cada sessão aplica as suas migrações, com cuidado

Cada sessão aplica as migrações da própria missão, usando as variáveis `PAINEL_*` do ambiente (Missão 1). São dois
bancos do Painel Renderiza (`04`): o **STG**, com dados fictícios, e a **produção**, com clientes reais. O banco do
Painel de prospecção (variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`) nunca é tocado.

1. **Toda mudança no banco é uma migração** em `painel-clientes/supabase/migrations/`, com nome
   `AAAAMMDDHHMMSS_assunto.sql` (data e hora no nome: duas sessões nunca criam o mesmo número).
2. **Teste antes, no banco local**, incluindo a RLS e o teste de isolamento de toda tabela nova.
3. **Sempre STG primeiro, produção depois.** Aplicou no STG, confira que funciona lá (a prévia da branch na Vercel
   usa o STG). Só então aplique na produção.
4. **Antes de aplicar, confira o que já está no banco** e a tabela "Migrações aplicadas" de `missoes.md`. Se o banco
   tem uma migração que você não tem, traga a branch dela antes de seguir.
5. **Aplique pelo caminho que registra a migração no próprio banco** (o script da Missão 1,
   `painel-clientes/scripts/migrar.mjs`, ou o `supabase db push`), uma de cada vez, em ordem. Confira duas vezes em
   qual projeto está (o script pede `--projeto <ref>` para a produção). Como usar: `painel-clientes/README.md`.
6. **Logo depois de aplicar:** push da branch com o arquivo e a linha em "Migrações aplicadas" (STG e produção).
7. **Migração aplicada nunca é editada** (nem no STG). Precisa mudar? Migração nova.
8. **Nada destrutivo na produção sem a Renderiza dizer "pode":** apagar tabela ou coluna com dados, `delete` ou
   `update` em massa, afrouxar a RLS.
9. **Só estrutura, nunca dado de cliente** pelas migrações. A semente de teste roda no local e no STG, nunca na
   produção.

A Missão 2 cria **o banco inteiro de uma vez**. Assim as missões 3, 4 e 5 quase não precisam de migração, e as que
precisarem são pequenas e da sua área.

## Entregar

1. Trazer a `main` atualizada para a sua branch; resolver conflitos mantendo o trabalho dos dois lados.
2. Rodar os testes (os da pasta e os do banco). Tudo verde.
3. Push da branch e, em `missoes.md`: `pronta para subir`, com uma linha do que fez, do que testou e do que ficou de
   fora.
4. **Juntar e subir para a `main` é com a Renderiza.** A sessão não junta na `main` sozinha, a não ser que peçam.
5. Depois de subir: `feita` e uma linha no diário de bordo do trilho. Se a missão fechou uma parada, atualizar o
   painel de bordo do trilho e o "Onde o trem está" do README.

## Quando der problema

- **Conflito em `missoes.md`:** cada sessão só mexe na própria linha e na própria nota; é só manter as duas.
- **Achou um bug fora da sua área:** aviso em `missoes.md`; não conserte no meio da sua missão.
- **Dúvida de produto:** o exemplo em `exemplos/` e o `09` decidem. Se não respondem e a dúvida trava a missão,
  pergunte à Renderiza e registre a resposta no `07`. Não pergunte o que é operação da Renderiza (quem é admin,
  valores de proposta, como subir).
- **Dois blocos precisando do mesmo arquivo:** quem chegou primeiro segue; o outro espera ou combina pelo aviso.

## O que não fazer

- Começar sem missão definida, ou pegar uma que está `em andamento` em outra sessão sem a Renderiza pedir.
- Aplicar migração na produção sem passar pelo STG, sem conferir o que já está aplicado ou sem registrar.
- Tocar no banco do Painel de prospecção.
- Mudar o formato de uma tabela, da API, do Meu site ou de uma peça de tela sem atualizar o documento e avisar.
- Pôr identificador de modelo de IA nos commits, chave no código ou dado real no repositório.
