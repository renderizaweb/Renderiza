# Quadro de tarefas

Cada linha é uma tarefa que **uma sessão** (um agente de IA ou uma pessoa) pega por vez. As regras de como pegar,
entregar e não se bater estão em [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md). A ordem das paradas
está no [trilho](01-trilho.md).

**Situação:** `livre` · `em andamento` · `pronta para subir` (a Renderiza junta na `main`) · `feita` · `travada` (diga
por quê em "Avisos").
**Mexe em:** a pasta ou os arquivos que só essa tarefa altera. Os caminhos sem prefixo são dentro de `painel-clientes/`.
**Ao pegar:** troque `livre` por `em andamento` e escreva a sua branch na última coluna. Mexa só na linha e na nota
de passagem da sua tarefa. **Ao continuar** a tarefa de outra sessão: comece pela branch e pela nota de passagem dela.

## Parada 1 · Organização e infraestrutura

| ID | Tarefa | Depende de | Mexe em | Situação | Sessão / branch |
|---|---|---|---|---|---|
| T1.1 | `painel.renderizaweb.com.br` apontado para a Vercel (a Renderiza, com o passo a passo do `04`) | T1.3 | DNS (fora do repositório) | livre | |
| T1.2 | Conta nova do Supabase (e-mail próprio do Painel Renderiza) com dois projetos, `painel-renderiza-prod` e `painel-renderiza-stg`: região São Paulo, login com confirmação de e-mail, endereços do site (a Renderiza, com o passo a passo) | — | painel do Supabase (fora do repositório) | livre | |
| T1.3 | Projeto Vercel novo na pasta `painel-clientes/`, variáveis públicas, build só quando a pasta muda | T1.5 | `vercel.json` | livre | |
| T1.4 | Serviço de e-mail com remetente no domínio (SPF, DKIM, DMARC), ligado ao Supabase; modelos em português | T1.1, T1.2 | `supabase/emails/` | livre | |
| T1.5 | Esqueleto da pasta: `index.html`, rotas, adaptador do Supabase, **todos os módulos e as áreas do admin já registrados (vazios)**, testes rodando | — | `index.html`, `src/app.js`, `src/rotas.js`, `src/modulos/index.js`, `src/admin/index.js`, `src/adaptadores/`, `test/` | livre | |
| T1.6 | Banco local para testes (Postgres 16, como em `docs/atualizacao-por-ia.md`) e a rotina das migrações: criar, testar no local, aplicar no STG, aplicar na produção | — | `supabase/` (config e scripts), `scripts/banco*.mjs` | livre | |
| T1.7 | Tela de login mínima no ar | T1.2, T1.3, T1.5 | `src/sessao.js`, `src/telas/entrar.js` | livre | |

## Parada 2 · Fundação: banco e casca

| ID | Tarefa | Depende de | Mexe em | Situação | Sessão / branch |
|---|---|---|---|---|---|
| T2.1 | Migração base: contas, módulos, pessoas, convites, atividades, termos, equipe Renderiza; função `pode()`; RLS e testes de isolamento | T1.6 | `supabase/migrations/*_base.sql`, `supabase/testes/base*` | livre | |
| T2.2 | Migração do negócio: clientes (com WhatsApp único), fichas, serviços, horários, campanhas, pedidos, reservas, valores, compromissos, parcelas, contratos, entregas, sites, pagamentos e entradas; situação calculada do cliente; RLS e testes | T2.1 | `supabase/migrations/*_negocio.sql`, `supabase/testes/negocio*` | livre | |
| T2.3 | Semente: Villa Alecrim e Estúdio Ciranda no banco local e no STG (nunca na produção), a partir dos arquivos de `exemplos/` | T2.2 | `supabase/semente/` | livre | |
| T2.4 | Casca: entrar, cadastro com 7 dias grátis (escolhe o nicho e os módulos; um prazo só, contado do início; teste vencido entra com os dados bloqueados e o aviso para assinar), primeiro acesso pelo convite, esqueci a senha, escolher a conta, menu com módulos ligados e trancados | T1.7, T2.1 | `src/sessao.js`, `src/telas/` | livre | |
| T2.5 | Peças comuns dos exemplos (layout, gaveta, tabela, calendário, avisos, exportar CSV, **"Para quem?"**) e as palavras por nicho | T1.5 | `src/ui/`, `src/nichos/`, `estilo.css` | livre | |
| T2.6 | Equipe e acessos: convidar, "só vê" ou "edita" por módulo, tirar acesso, limite de 5 | T2.4, T2.5 | `src/modulos/equipe/` | livre | |
| T2.7 | Configurações do negócio e Serviços (pacotes ou ensaios, adicionais, horários, bloqueios, campanhas) | T2.2, T2.5 | `src/modulos/configuracoes/`, `src/modulos/servicos/` | livre | |

## Parada 3 · Módulos do dia a dia (em paralelo)

| ID | Tarefa | Depende de | Mexe em | Situação | Sessão / branch |
|---|---|---|---|---|---|
| T3.1 | Clientes: lista com a situação, ficha como linha do tempo, juntar clientes, arquivar; na fotografia, entregas | T2.2, T2.5 | `src/modulos/clientes/` | livre | |
| T3.2 | Agenda: reservas e compromissos; mês, semana, dia; por horário na fotografia; conflito de horário; campanhas com vagas e texto do Stories | T2.2, T2.5, T2.7 | `src/modulos/agenda/` | livre | |
| T3.3 | Atendimento: pedidos, etapas, responsável, anotar pedido em poucos toques, "fechar" vira reserva, lista de espera | T2.2, T2.5 | `src/modulos/atendimento/` | livre | |
| T3.4 | Financeiro: parcelas, sinal, dar baixa, a receber, atrasados, total do mês, o que mais vende | T2.2, T2.5 | `src/modulos/financeiro/` | livre | |
| T3.5 | Contratos: modelos com campos, enviar link, página pública de aceite, registro do aceite, versão para imprimir | T2.2, T2.5 | `src/modulos/contratos/`, `publico/contrato/` | livre | |
| T3.6 | Visão geral: os números de cada módulo ligado e "o que a equipe fez" | T3.1 a T3.5 (pode começar antes, com o que existir) | `src/modulos/inicio/` | livre | |
| T3.7 | Exportar tudo da conta (zip com as planilhas) | T2.5 | `src/telas/exportar.js` | livre | |

## Parada 4 · Ponte com o site (em paralelo)

| ID | Tarefa | Depende de | Mexe em | Situação | Sessão / branch |
|---|---|---|---|---|---|
| T4.1 | API pública: código público do site, saúde, regras de acesso (CORS), limites, campo-isca | T2.2 | `api/publico/` (base), migração própria | livre | |
| T4.2 | Agenda online: disponibilidade, pedido (acha ou cria o cliente), aviso por e-mail, fallback para o WhatsApp, peça da agenda nos geradores | T4.1 | `api/publico/agenda/`, `ferramentas/demo/agenda-online/` | livre | |
| T4.3 | Meu site no site: contrato de conteúdo v1, marcações `data-rz` nos geradores, script com fallback, `virar-site.mjs` com o código da conta | T4.1 | `ferramentas/demo/gerar*.py`, `ferramentas/meu-site/`, `scripts/virar-site.mjs` | livre | |
| T4.4 | Meu site no painel: editor por seção, imagens, rascunho, prévia, publicar, histórico, voltar à versão inicial | T4.3 | `src/modulos/meu-site/`, `api/publico/site/` | livre | |
| T4.5 | Desconectar o site e gerar a versão final | T4.3 | `scripts/versao-final.mjs` | livre | |
| T4.6 | Site de teste, gerado de uma demo de eventos, ligado ao painel (agenda online e Meu site) para provar a ponte; quando o site do piloto existir e ele quiser, o mesmo para ele | T4.2, T4.3 | `test/site-teste/`; depois, o repositório do site do piloto | livre | |

## Parada 5 · Admin e regras (em paralelo)

| ID | Tarefa | Depende de | Mexe em | Situação | Sessão / branch |
|---|---|---|---|---|---|
| T5.1 | Admin · Contas: lista, situação, cadastros novos, teste de 7 dias, aprovar, prazo, desligar; ligar e desligar módulos; marcar módulo "só pago" (bloqueado no teste); criar conta à mão; exportar os dados de uma conta a pedido (com registro) | T2.2, T2.5 | `src/admin/contas/` | livre | |
| T5.2 | Admin · Pessoas e acessos: quem entrou, quando, de qual conta; entrar numa conta para ajudar (registrado) | T2.2, T2.5 | `src/admin/pessoas/` | livre | |
| T5.3 | Admin · Pagamentos: registrar o Pix do mês, quem pagou e quem não pagou | T2.2, T2.5 | `src/admin/pagamentos/` | livre | |
| T5.4 | Admin · Indicadores: contas por situação, cadastros, pessoas ativas, uso por módulo, pedidos dos sites (só números) | T2.2, T2.5 | `src/admin/indicadores/`, migração própria (visões) | livre | |
| T5.5 | Termos de uso e política de privacidade (rascunho para revisão) e aceite no primeiro acesso | T2.4 | `publico/termos/`, `publico/privacidade/` | livre | |
| T5.6 | Backup semanal cifrado da produção e um teste de restauração (no STG ou no local) | T1.2, T2.2 | `.github/workflows/backup-painel.yml` (na raiz do repositório) | livre | |
| T5.7 | Revisão de segurança: RLS de todas as tabelas, funções públicas, chaves, cabeçalhos, uploads; abre tarefa para cada correção | paradas 3 e 4 quase prontas | (só lê; as correções viram tarefas) | livre | |

## Parada 6 · Piloto no ar

| ID | Tarefa | Depende de | Mexe em | Situação | Sessão / branch |
|---|---|---|---|---|---|
| T6.1 | Montar a conta do piloto pelo admin: serviços, festas já marcadas, equipe | paradas 3 e 5 | dados no banco real (sem arquivo) | livre | |
| T6.2 | Roteiro de teste de ponta a ponta (Playwright e no celular) e a rodada de correções | paradas 3, 4 e 5 | `test/fluxos/` | livre | |
| T6.3 | Acompanhar a primeira semana do piloto e registrar os ajustes | T6.1 | `docs/painel-clientes/` (diário) | livre | |

## Notas de passagem

Uma por tarefa em andamento, para outra sessão continuar sem refazer nada. Atualize junto com os commits; apague
quando a tarefa ficar `feita`.

```
T0.0 · branch claude/xxxx · atualizada em dd/mm hh:mm
Feito: …
Falta: …
Próximo passo: …
Decisões no caminho: …
Migrações aplicadas (STG / produção): …
```

(nenhuma tarefa em andamento)

## Migrações aplicadas

Uma linha por migração; marque a data em cada banco logo depois de aplicar (regras em `08`: sempre STG primeiro).
Antes de aplicar uma nova, confira esta lista e a do próprio banco.

| Arquivo | Tarefa | Branch | STG | Produção |
|---|---|---|---|---|
| (nenhuma ainda) | — | — | — | — |

## Avisos entre sessões

Recado que outra sessão precisa saber (mudou um nome de coluna, travou numa dependência, achou um bug fora da sua
área). O mais novo em cima: data, tarefa, recado.

| Data | Tarefa | Recado |
|---|---|---|
| 28/10/2026 | — | Supabase: conta nova com `painel-renderiza-prod` e `painel-renderiza-stg`; migração sempre no STG antes da produção. O projeto de hoje é do Painel de prospecção e não se toca. |
| 28/10/2026 | — | Documentos na `main`. Cada sessão aplica as próprias migrações no banco real, com as regras do `08`; juntar e subir para a `main` é com a Renderiza. O piloto ainda não tem site: a T4.6 prova a ponte num site de teste. |
| 28/10/2026 | — | Rodada 2 respondida: T1.1 a T1.4 são da Renderiza (contas e DNS); endereço `painel.renderizaweb.com.br`. |
| 28/10/2026 | — | Quadro criado. T1.5 e T1.6 podem começar já; o resto da parada 1 espera a rodada 2 do `07`. |
