# Painel Renderiza

Fica em `/painel`, com login em `/login`: só você entra. O endereço principal (`/`) é o site público
da Renderiza e as demos das óticas ficam em `/demo/<ótica>` (veja o [README da raiz](../README.md)).
A mesma página responde em `/painel` e `/login`: sem sessão, a barra de endereço vai para `/login`;
depois de entrar, volta para `/painel#<aba>`. Os caminhos abaixo são a partir da raiz do repositório.

Planilha de operação da Renderiza: **Pipeline** (tabela ou kanban; é onde o painel abre), **Tarefas** (o
que fazer), **Clientes** (todos, no funil ou fora dele), **Ritmo** (placar do processo) e **Conteúdo**, no
mesmo padrão visual e de uso do planilhão do Compasso (menu lateral verde, cabeçalho verde-escuro, primeira
coluna fixa, linhas zebradas e linha de totais). Sem barra de caminho no topo: a busca fica na barra de cada
tela, ao lado das abas (Tabela/Kanban, filtros); no celular, o topo só tem o botão do menu.

## Pipeline: o funil

Desde 09/10/2026 o funil tem quatro fases, que são as colunas do kanban:

| Fase | Etapa (id no banco) | Quando |
|---|---|---|
| Leads a trabalhar | `a_trabalhar` | lead validado, demo ainda não feita |
| Prontas para trabalhar | `demo_pronta` | demo, vídeo e flyer prontos; falta o primeiro contato |
| **Em andamento** | `primeiro_contato` Primeiro contato | mandou a demo e espera a primeira resposta |
| | `em_negociacao` Em negociação | respondeu e a conversa está andando |
| | `sem_resposta` Sem resposta | não respondeu, ou parou de responder: caminho do encerramento |
| Finalizado | `finalizado` + resultado | **Ganho**, **Perda** ou **Encerrado** (não respondeu: nem ganho, nem perda) |

- **Kanban**: Em andamento é um grupo com uma subcoluna para cada etapa; o cartão muda de etapa ao ser solto
  na subcoluna. Soltar em Finalizado abre a janela do resultado.
- **Tabela e detalhes**: o select de etapa mostra as três de Em andamento num grupo; Em negociação aparece em
  azul, Sem resposta em âmbar e Encerrado em cinza. O filtro tem Em andamento (as três), cada etapa e cada
  resultado (Ganho, Perda, Encerrado).
- **Trilha do lead** (topo dos detalhes): uma barra por fase; em Em andamento, embaixo, a etapa da vez.
- Etapas antigas (antes de 09/10/2026): Demo criada e Gravação realizada viraram Prontas para trabalhar;
  Contato iniciado virou Primeiro contato; Em conversa virou Em negociação (quem tinha interesse registrado)
  ou Sem resposta. O `supabase/schema.sql` migrou os dados e deixou uma linha no histórico de cada lead
  ("etapas reorganizadas"). O histórico antigo continua com os nomes antigos.

## Tarefas: o que fazer

O painel abre aqui (outra tela só pelo endereço, ex.: `/painel#pipeline`).

- Uma tarefa tem: o que fazer, dia (ou sem data), hora opcional, cliente opcional e responsável
  opcional (Kaue ou Milena; é só um rótulo para filtrar, o login é o mesmo).
- Grupos: Atrasadas, Hoje, Amanhã, Próximos 7 dias, Mais adiante e Sem data. No mesmo dia, as com
  hora vêm primeiro.
- Filtro por responsável: Todos, Kaue, Milena ou Sem responsável.
- O círculo marca como feita (e desmarca). As feitas nos últimos 7 dias ficam numa lista recolhida;
  nos detalhes do cliente aparecem todas, como histórico.
- **Próximas ações anotadas nos clientes**: o campo antigo "Próxima ação" de quem ainda não tem tarefa
  aberta aparece como sugestão, com um botão para criar a tarefa. Nada é criado sozinho.
- Na janela da tarefa dá para cadastrar um cliente novo sem sair dela.
- **Contador no menu**: ao lado de "Tarefas", quantas estão em aberto para hoje, somando as atrasadas
  (vermelho se houver atrasada; some quando zera). No celular, um ponto no botão do menu avisa.
- **Selo no Kanban**: cartão de cliente com tarefas em aberto mostra o ícone de tarefas e a quantidade
  (âmbar; vermelho se alguma atrasou). Passar o mouse mostra a próxima.

## Clientes: todos, no funil ou fora dele

- Filtros com contagem: Em venda (no funil, em aberto), Ganhos (pós-venda), Perdas, Encerrados (não
  responderam) e Fora do funil.
  A busca do topo procura por nome, WhatsApp, Instagram e cidade.
- Cada linha mostra a situação e a próxima tarefa. Clicar abre os detalhes (tarefas, andamento,
  interações e contato).
- **Novo cliente**: nome, WhatsApp (opcional) e onde fica: fora do funil, no funil (entra em "Leads a
  trabalhar") ou já é cliente (entra como ganho).
- **Fora do funil** (`leads.fora_do_funil`): para relacionamento com quem não passou pelo funil, como
  clientes antigos. Não aparece no Pipeline nem no Ritmo. Dá para pôr ou tirar nos detalhes do cliente
  (Andamento); a etapa fica guardada.

## Ritmo: o placar do que você controla

A meta é de **processo**: prospectar óticas novas e cuidar das conversas começadas. Fechamentos
aparecem só como contexto. O mesmo placar vale para **semana** (segunda a domingo), **mês** e **ciclo**:

- **Novas óticas prospectadas**: cada ótica conta uma vez, no dia do **primeiro contato**
  personalizado que você fez (WhatsApp, telefone ou outro canal). Cadastrar lead ou criar demo não
  conta. Mudar a etapa para **Em andamento** (ou Finalizado) registra sozinho o primeiro contato do dia,
  se a ótica ainda não tiver um; se foi em outro dia, corrija a data na linha do tempo da ótica.
- **Relacionamento**: retornos **feitos** no período (nova abordagem sua a uma ótica já contatada) e
  retornos **previstos** para o período (os que cumpriram um follow-up marcado para ele, mais os
  pendentes). Resposta da ótica não conta como retorno seu, e reagendar não conta como feito. Sem
  retorno previsto, a tela diz isso em vez de mostrar porcentagem.
- **Retornos previstos daqui para frente**: atrasados, esta semana, próxima, em 2 semanas e depois.
  Cada número abre o Pipeline já filtrado.
- **Ciclo e meta**: início, fim e meta de novas óticas (ex.: 180 até dezembro), mais a cadência de
  retornos. Nada fica fixo no código. A tela mostra a meta proporcional do período e o ritmo necessário.
- **Mês**: a *turma* do mês, ou seja, as óticas cujo primeiro contato foi naquele mês, com etapa,
  interesse, última interação e próximo passo, mais interessadas primeiro.
- **Óticas já contatadas**: para recuperar aos poucos conversas antigas (WhatsApp) com mês aproximado
  ou sem data. Elas ficam como já contatadas e **não contam como novas**. O que o painel antigo guardou
  (ex.: "Enviado em 24/09") aparece só como pista.

## Interações, interesse e cadência (detalhes da ótica)

- **Interações**: primeiro contato, retorno feito, resposta recebida e anotação, cada uma com data e
  resumo curto (canal opcional). Ficam numa linha do tempo junto com as mudanças de etapa e de
  interesse. *Próxima ação* e *Follow-up* continuam sendo o **plano**: não contam no placar.
- **Registrar interação** é um botão discreto nos detalhes (e no menu **…** da linha). A rotina não
  depende dele: a IA pode registrar a partir do seu relato (veja abaixo).
- **Interesse** (Não avaliado, Interessado, Perto de fechar) é opcional e não é etapa. Silêncio
  continua "Não avaliado". O motivo fica visível e dá para corrigir.
- **Cadência** (hipótese de trabalho, ajustável no ciclo): para quem não respondeu, 1º retorno cerca de
  7 dias e 2º retorno cerca de 21 dias depois do primeiro contato. Depois disso a ótica fica em espera. É
  só sugestão de data: nada é enviado e a etapa não muda.
- **Não contatar mais**: tira a ótica da fila de retornos.
- O painel de detalhes tem 689 px em telas que comportam, a largura disponível em telas menores e
  tela inteira no celular.
- **Flyer para Stories** (`leads.link_flyer`): arte em PNG (1080 × 1920) que vai de cortesia no
  retorno, quando a ótica não respondeu depois da demo ("esqueci de te mandar esta cortesia… conseguiu
  ver a demo?"). Com o link preenchido, o detalhe mostra a prévia, **Baixar PNG** (baixa com o nome
  `Stories - <ótica>.png`) e **Copiar mensagem**; o cabeçalho ganha o botão **Baixar flyer**. O PNG fica
  em `flyers/<id>.png` deste repositório e vai ao ar em `/flyer/<id>.png` (só o PNG; a configuração da arte,
  `flyers/<id>.json`, não). Link completo de outro site também vale: se o site não deixar baixar, abre
  em outra aba.
- **Mensagens prontas de WhatsApp, em etapas** (`leads.mensagem_whatsapp`, etapas separadas por `---`):
  **1 · Abrir conversa** (sem link) e **2 · Mandar a prévia** (com o link, depois que responderem) no topo
  do card; na seção **Demo**, uma caixa editável e um botão **Abrir no WhatsApp** por etapa, mais a
  **Retomar** (sem resposta em 1 ou 2 dias). Os botões abrem a conversa com o texto, não enviam; os que
  mandam o link deixam a demo no ar 7 dias a partir dali. Vazio, **Usar o modelo** (`src/mensagem.js`) põe
  as três etapas. Sem a coluna no banco (`supabase/schema.sql`), as caixas não aparecem.
- **Vídeo de apresentação** (`leads.link_gravacao` terminando em `.mp4`): a seção **Demo** mostra
  **Assistir** e **Baixar MP4** (baixa como `Apresentacao - <ótica>.mp4`) e o cabeçalho ganha **Baixar
  vídeo**. O MP4 fica em `gravacoes/<id>.mp4` e vai ao ar em `/gravacao/<id>.mp4`. Outro link (Loom,
  Drive) continua só como link. Quem tem vídeo ganha um selo de câmera na frente do nome no cartão do
  kanban e, na tabela, uma etiqueta de câmera ao lado de "demo ↗" (abre o MP4).
- **Prazo da demo** (tabela `demos`): toda demo fica no ar por 7 dias e depois sai sozinha. No topo do
  detalhe, a etiqueta da demo ("Demo no ar até 13/10", "Demo expirada em 13/10", "Demo fora do ar") leva
  direto à seção **Demo**, logo abaixo de Andamento, onde aparece a situação (No ar até tal dia, Último dia, Expirada, Fora do ar) e os
  controles: a chave **No ar** (desliga ou religa na hora; religar uma vencida já dá mais 7 dias),
  **Vale até** (o último dia no ar, qualquer data), **Reabilitar por 7 dias** / **7 dias a partir de
  hoje** e **No ar sem prazo**. Demo que ainda não tem prazo mostra **Pôr prazo de 7 dias**. Na tabela e
  no kanban, a etiqueta vira "demo expirada" ou "demo fora do ar", e **Copiar link da demo** avisa quando
  o link não está abrindo. Quem abre uma demo fora do prazo vê o aviso "Esta demonstração saiu do ar"
  com um botão para pedir de novo pelo WhatsApp da Renderiza (`middleware.js`, na Vercel).

## Atualização pela IA

Você conta o dia por texto ou voz. Um assistente com acesso autorizado ao Supabase registra os
contatos, as respostas, o próximo passo e o interesse (só com evidência), sem duplicar óticas. Na
dúvida, ele pergunta antes de gravar. Fluxo, regras e o que falta para conectar:
**[docs/atualizacao-por-ia.md](../docs/atualizacao-por-ia.md)**. Testado só localmente, ainda não em um
projeto Supabase real.
HTML e JavaScript puro (módulos ES nativos), sem bundler. Os dados ficam no Supabase.

## Como usar o planilhão

- **Editar**: clique na célula e digite. Salva ao sair do campo. *Enter* salva e desce,
  *Shift+Enter* sobe, *Tab* avança, *Alt+setas* andam entre células, *Esc* desfaz.
- **Adicionar**: campo *Adicionar lead…* no fim da tabela. Colar várias linhas nele cria vários
  registros de uma vez (colunas: Empresa, WhatsApp, Instagram ou site, Próxima ação).
- **Inserir no meio**: passe o mouse na linha e clique no **+** à esquerda do nome.
- **Reordenar**: arraste pela alça (⋮⋮) ao lado do nome, ou *Alt+↑/↓* com a alça em foco.
  Funciona em *Ordenar > Minha ordem*; nas outras ordenações a alça fica desligada.
- **Colar de uma planilha**: copie um bloco (várias linhas e colunas) e cole numa célula.
  Datas em 31/12/2026, valores em 1.800,00 e etapas pelo nome. Se algo não for válido, nada é gravado.
- **Ordenar**: Minha ordem, Empresa, Etapa do funil, Follow-up mais próximo, Atualizados
  recentemente, Maior valor potencial.
- **Colunas**: mostre ou oculte colunas pelo menu *Colunas* ou pelo olho no cabeçalho.
  A escolha fica salva neste navegador. *Atualizado* começa oculta.
- **Detalhes**: ícone ao lado do nome ou menu **…** da linha. O **…** também exclui (pede confirmação).
- **Finalizar**: ao escolher *Finalizado* na etapa, abre a janela de Ganho, Perda ou Encerrado.

## Estrutura

```
painel/index.html                   página e estilos
painel/src/app.js                   telas: Pipeline, Kanban, Conteúdo, painel lateral, finalizar
painel/src/tela-tarefas.js          tela Tarefas, janela de tarefa e tarefas nos detalhes do cliente
painel/src/tela-clientes.js         tela Clientes e cadastro rápido de cliente
painel/src/tarefas.js               contas de tarefas e clientes (sem tela; com testes)
painel/src/tela-ritmo.js            tela Ritmo (semana, mês, ciclo, turma do mês, fila de retornos, ciclo)
painel/src/ritmo.js                 contas do placar, cadência e validação das interações (sem tela; com testes)
painel/src/interacoes-ui.js         registrar/corrigir interação, linha do tempo, óticas já contatadas
painel/src/acoes.js                 gravações usadas por várias telas (interesse, não contatar)
painel/src/planilha.js              planilhão: edição na célula, inserir abaixo, arrastar, colar, totais
painel/src/ui.js                    menu suspenso, janelas, confirmação e avisos (padrão do Compasso)
painel/src/icones.js                ícones (os mesmos do Compasso, em SVG)
painel/src/dados.js                 camada de dados: escolhe o banco, só mostra salvo após confirmação,
                                    bloqueia a edição quando não há conexão
painel/src/adaptadores/supabase.js  Supabase (supabase-js carregado do jsDelivr, versão fixa)
painel/src/adaptadores/claude.js    banco do artifact do Claude (a versão no Claude continua funcionando)
painel/src/modelo.js                etapas, resultados, canais e status
painel/src/migracao.js              mapeamento do painel antigo e SQL de importação
api/config.js                       função da Vercel: entrega a URL e a chave pública do Supabase
supabase/schema.sql                 tabelas, RLS, gatilhos, regras das interações e funções para a IA
scripts/montar-site.mjs             monta publico/ (painel em /, demos em /demo/) para a Vercel (npm run build)
scripts/servidor.mjs                servidor local igual à Vercel (npm run dev)
scripts/relato.mjs                  atualização pela IA (buscar, simular, aplicar) com o seu login
docs/atualizacao-por-ia.md          fluxo da IA: regras de interpretação, formato do plano, o que falta
test/ritmo.test.mjs                 testes das regras do placar (npm test)
test/funil.test.mjs                 testes do funil (fases, etapas antigas, mesma lista no painel e no banco)
vercel.json                         build, pasta publicada, links sem .html e aviso ao Google para não indexar
```

**Sem bundler:** os módulos ES rodam direto no navegador, e a função `api/config.js` entrega as
variáveis de ambiente em tempo de execução. O único passo de build na Vercel é
`scripts/montar-site.mjs`, que só copia o painel e as demos para `publico/`.

## 1. Supabase

1. Crie um projeto no Supabase.
2. **SQL Editor**: cole e rode `supabase/schema.sql`. Pode rodar de novo sem perder dados.
3. **Authentication > Users > Add user**: crie seu usuário com e-mail e senha (marque *Auto Confirm User*).
4. **Authentication > Sign In / Providers**: desligue *Allow new users to sign up*.
   As políticas já isolam os dados por dono; isso só evita contas que você não criou.
5. **Importar os dados atuais**: abra o painel no Claude, clique em *Levar dados para o
   Supabase* (menu lateral, embaixo), copie o SQL, cole no SQL Editor e rode.
   Pode rodar mais de uma vez: o que já existe é ignorado.

## 2. Vercel

1. *Add New > Project* e importe o repositório `renderizaweb/renderiza`.
2. **Root Directory**: deixe a raiz. **Framework Preset**: Other. Build, instalação e pasta
   publicada já vêm do `vercel.json`: não preencha nada.
3. **Settings > Environment Variables** (Supabase: *Project Settings > API Keys* e *Data API*):
   - `SUPABASE_URL`: `https://SEU-PROJETO.supabase.co`
   - `SUPABASE_ANON_KEY`: a chave **pública** (anon ou publishable). Nunca a `service_role`;
     a função se recusa a entregá-la.

   Se usar a integração Supabase na Vercel, os nomes `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` também funcionam.
4. Depois de cadastrar as variáveis, faça um **Redeploy**, abra `/login` e entre com o
   usuário criado no passo 1.3. Sem as variáveis, o painel mostra "Banco não configurado" e não
   mostra nem salva nada.

## Rodar no computador

Na raiz do repositório:

```
cp .env.example .env.local   # preencha URL e chave pública
npm run dev                  # site em http://localhost:5173, painel em /painel, demos em /demo/<ótica>
npm test                     # regras do placar e do site público
```

## Tabelas

**`leads`**: uma linha por empresa.

| coluna | tipo | uso |
|---|---|---|
| `id` | text | chave (ids antigos preservados; novos são UUID) |
| `dono` | uuid | usuário dono da linha (`auth.uid()` automático) |
| `empresa` | text | nome |
| `etapa` | text | `a_trabalhar`, `demo_pronta`, `primeiro_contato`, `em_negociacao`, `sem_resposta`, `finalizado` (ver "Pipeline: o funil") |
| `resultado` | text | `ganho`, `perda` ou `encerrado` (obrigatório quando `etapa = finalizado`) |
| `motivo_perda`, `valor_fechado`, `data_fechamento` | text, numeric, date | preenchidos ao finalizar |
| `whatsapp`, `instagram` | text | contato; `instagram` aceita @perfil ou site |
| `proxima_acao`, `followup_em` | text, date | o que fazer e quando |
| `valor_potencial` | numeric | valor estimado |
| `cidade`, `segmento`, `site_atual`, `link_demo`, `link_gravacao`, `observacoes` | text | painel lateral |
| `link_flyer` | text | flyer de Stories (PNG 1080×1920): `/flyer/<id>.png` ou link completo; seção "Flyer para Stories" |
| `historico` | jsonb | `[{em, de, para, resultado?, origem?}]`: uma linha por mudança de etapa (`origem`: `ia` ou `reorganizacao`, a migração de 09/10/2026) |
| `revisar`, `revisar_motivo` | boolean, text | marcados na migração quando o status antigo era ambíguo |
| `legado` | jsonb | documento original do painel antigo, intacto |
| `posicao` | double precision | ordem manual do planilhão (*Minha ordem*); vazia = ordem de criação |
| `interesse`, `interesse_motivo` | text | `nao_avaliado` (padrão), `interessado`, `perto_de_fechar` e o porquê |
| `nao_contatar` | boolean | pediu para não receber contato: sai da fila de retornos |
| `fora_do_funil` | boolean | só na tela Clientes (relacionamento); fora do Pipeline e do Ritmo |
| `criado_em`, `atualizado_em` | timestamptz | `atualizado_em` é atualizado por gatilho |

**`conteudos`**: `id`, `dono`, `titulo`, `canal` (`instagram`, `linkedin`, `portfolio`, `outro`),
`status` (`ideia`, `em_producao`, `publicado`), `data_planejada`, `link_publicacao`, `texto`,
`gancho`, `cta`, `link_imagem`, `link_video`, `observacoes`, `revisar`, `revisar_motivo`,
`legado`, `posicao`, `criado_em`, `atualizado_em`.

**`tarefas`**: `id`, `dono`, `titulo` (obrigatório), `dia` (vazio = sem data), `hora`, `lead_id`
(cliente, opcional; excluir o cliente exclui as tarefas dele), `responsavel` (texto livre: `Kaue`,
`Milena` ou vazio), `feita_em` (preenchido = feita), `criado_em`, `atualizado_em`. Mesma regra de
acesso das outras tabelas: cada usuário só vê e altera as próprias linhas.

Se o banco foi criado antes dessas colunas e tabelas, rode `supabase/schema.sql` de novo. Ele
acrescenta o que falta (`posicao`, `interesse`, `nao_contatar`, `fora_do_funil`, `interacoes`,
`tarefas`, `ciclos`, `demos`, as regras e as funções) sem mexer nos dados. Sem a tabela `demos`, o
painel funciona e a seção Demo avisa que o prazo está indisponível; as demos ficam no ar.

**Placar começa do zero, de propósito.** Nenhum primeiro contato é deduzido de etapa, de demo criada,
de data de atualização ou das datas do painel antigo. Óticas que parecem já contatadas aparecem na tela
Ritmo para você registrar (com a data certa, mês aproximado ou sem data).

**`interacoes`**: o que aconteceu com cada ótica. `lead_id` (da mesma pessoa, por chave composta),
`tipo` (`primeiro_contato`, `retorno`, `resposta`, `anotacao`), `ocorreu_em` (date), `precisao`
(`exata`, `aproximada` = mês, `desconhecida` = sem data), `canal`, `resumo`, `interesse` (o nível que
esta interação justificou), `previsto_para` (o follow-up que um retorno cumpriu), `origem` (`painel`,
`ia`, `importacao`). Regras no banco: um primeiro contato por ótica; retorno só depois do primeiro
contato; nada com data futura; data não exata só no primeiro contato.

**`ciclos`**: `inicio`, `fim`, `meta_novas`, `dias_primeiro_retorno` (7), `dias_segundo_retorno` (21), `nome`.

**`demos`**: o prazo de cada demo. `id` (o nome da pasta em `demos/`, o mesmo do link `/demo/<id>`),
`dono`, `no_ar` (desligado = fora do ar), `vale_ate` (date: último dia no ar no horário de Brasília;
vazio = sem prazo; padrão = hoje + 7), `criado_em`, `atualizado_em`. A linha nasce sozinha quando um lead
recebe um `link_demo` com `/demo/<pasta>` (gatilho `leads_registrar_demo`). O site consulta
`demo_liberada(pasta)`, a única coisa que a chave pública pode chamar: responde só sim ou não. Pasta
sem linha fica no ar.

**`arquivo_legado`**: `colecao`, `doc_id`, `dono`, `dados` (jsonb), `importado_em`. Guarda o
portfólio, os lançamentos, as semanas e a configuração do painel antigo. Só leitura por enquanto.

**Segurança:** RLS ligado nas três tabelas; cada usuário só lê e altera as próprias linhas
(`dono = auth.uid()`). A chave pública sozinha não lê nada.

## Migração do painel antigo

Nada é apagado: o documento original vai inteiro para `legado`.

| status antigo | etapa nova |
|---|---|
| Lead | Leads a trabalhar |
| Demo em produção | Prontas para trabalhar se a demo estava pronta; senão Leads a trabalhar |
| Pronto para enviar | Prontas para trabalhar (`demo_pronta`) |
| Enviado | Em andamento · Primeiro contato (`primeiro_contato`) |
| Respondeu, Conversando, Proposta | Em andamento · Em negociação (`em_negociacao`) **e marcado para revisar** |
| Fechado | Finalizado · Ganho |
| Perdido | Finalizado · Perda |

Conteúdo: *Produzindo* vira *Em produção*. *Pronto* vira *Em produção* e o canal *Mais de um* vira
*Outro*, os dois marcados para revisar. Registros marcados aparecem com a etiqueta **revisar**
na tabela; o painel lateral explica o motivo e tem *Marcar como revisado*.

## Sem conexão

Toda gravação espera a confirmação do banco. Se a conexão cair, o painel mostra
**Sem conexão com o banco**, volta o campo ao valor salvo e bloqueia a edição até o banco
responder de novo (tenta sozinho a cada 15 s, ou pelo botão *Tentar novamente*).
