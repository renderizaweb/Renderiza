# painel-clientes: o código do Painel Renderiza

O sistema com login dos clientes da Renderiza. O plano, as regras e as missões estão em
[`docs/painel-clientes/`](../docs/painel-clientes/README.md): comece por lá.

JavaScript puro em módulos ES, sem bundler e sem dependências; Supabase (login, banco com RLS) e Vercel (front
estático + `api/`). Tudo roda com o Node do ambiente.

## Comandos (dentro de `painel-clientes/`)

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local em `http://localhost:5180`, contra o banco **STG** (`-- --banco producao` para a produção) |
| `npm test` | testes do front e do banco local (`node --test`) |
| `node scripts/migrar.mjs` | situação das migrações no STG e na produção (só lê) |
| `node scripts/migrar.mjs local` | banco local do zero + todas as migrações + `supabase/testes/` |
| `node scripts/migrar.mjs stg` | testa no local e aplica no STG as que faltam |
| `node scripts/migrar.mjs producao --projeto <ref>` | testa no local e aplica na produção o que já passou pelo STG |

As variáveis vêm do ambiente: `PAINEL_STG_*`, `PAINEL_PROD_*` e `PAINEL_SUPABASE_ACCESS_TOKEN`
(`docs/painel-clientes/missoes.md`, Missão 1). As do Painel de prospecção (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
nunca são lidas aqui. No computador, podem ficar em `painel-clientes/.env.local` (fora do git).

## Onde fica cada coisa

```
index.html                 a página única: liga o src/ui/estilo.css e o src/app.js (nenhum estilo ou script embutido)
src/app.js                 carrega a configuração, abre a sessão e desenha a rota
src/rotas.js               endereços: /entrar, /, /<módulo>, /admin/<parte>
src/sessao.js              entrar, sair, quem está logado
src/adaptadores/supabase.js
src/telas/                 telas fora dos módulos: entrar, esqueci-a-senha, nova-senha (layout comum em acesso.js)
src/ui/                    o design system: estilo.css, icones.js, formulario.js, fontes/ (docs/painel-clientes/10-design-system.md)
src/modulos/index.js       o registro de todos os módulos; cada um em src/modulos/<id>/index.js
src/admin/index.js         o registro das partes do Admin; cada uma em src/admin/<id>/index.js
api/config.js              entrega a URL e a chave pública ao navegador (recusa chave secreta)
supabase/migrations/       a estrutura do banco, em ordem (AAAAMMDDHHMMSS_assunto.sql, hora em UTC)
supabase/testes/           testes do banco (SQL), rodam no local depois das migrações
supabase/local/            a imitação do Supabase para o Postgres local (nunca vai para o STG nem para a produção)
scripts/                   servidor local e migrações
test/                      testes do front (node --test)
```

**Um módulo** exporta `montar(el, contexto)`: desenha dentro de `el`; `contexto` traz `banco` (o adaptador),
`sessao` e `navegar(caminho)`. A Missão 2 acrescenta a conta escolhida e o acesso da pessoa.

## Migrações

Regras em [`08-trabalho-em-paralelo.md`](../docs/painel-clientes/08-trabalho-em-paralelo.md) ("O banco"). O
script aplica pela API de gerenciamento do Supabase: a migração e o registro dela em
`supabase_migrations.schema_migrations` (o mesmo do `supabase db push`) vão numa transação só; se falhar, nada fica.
Ele para sozinho se: o banco tem migração que a branch não tem, um arquivo aplicado foi editado, a migração é mais
antiga que a última aplicada, a produção ainda não tem no STG, ou há comando destrutivo na produção (só com
`--pode-destrutivo`, depois de a Renderiza dizer "pode").

**Testes do banco:** cada arquivo de `supabase/testes/` roda numa transação desfeita no fim, com os ajudantes de
`supabase/local/imitacao-supabase.sql`:

```sql
select testes.entrar_como(testes.criar_usuario('ana@villa-alecrim.teste'));  -- age como a Ana logada
select testes.afirmar((select count(*) from public.clientes) = 3, 'Ana vê os 3 clientes da conta dela');
select testes.afirmar_erro($$insert into public.clientes …$$, 'Ana não grava em outra conta');
reset role;
select testes.entrar_como(null);  -- visitante sem login
```

A imitação dá aos papéis da API acesso a tudo que é criado em `public`, como o Supabase: quem barra é a RLS. Tabela
sem RLS vaza, aqui e lá.
