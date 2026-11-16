# Rafaela Damaceno: o trilho da entrega (site + Painel Renderiza)

Primeiro cliente real com **site e painel**: a Rafaela Damaceno, Estúdio Fotográfico, Centro de Franco da Rocha (SP),
nicho fotografia. O modelo e as lições gerais estão no [README](README.md). Este arquivo é o painel de bordo dela:
quem continuar, lê primeiro "Onde o trem está" e o diário, e atualiza os dois no mesmo commit do que fizer.

**Prazo combinado:** 72 horas a partir de 14/11/2026 (até 17/11/2026).

## Onde o trem está

| | |
|---|---|
| **Parada** | A · O site no repositório dela (no repositório; falta a hospedagem) |
| **Feito** | Fase 1 (a demo é a proposta final, no ar); o repositório dela criado (`rafaelafotografiadev-del/estudiorafaeladamaceno`, privado) e o site gerado pelo `virar-site` (as duas páginas) subido na `main` dele em 15/11 (`a946cd1`), testado como na hospedagem (celular e computador) |
| **Próxima ação** | Renderiza: o Cloudflare Pages na conta dela (A5) e o endereço `….pages.dev`; depois, o GitHub da Kaue7almeida de volta no claude.ai, com a Kaue7almeida colaboradora (Write) no repositório dela. Claude: conferir no ar (A6) |
| **Esperando a Renderiza** | a hospedagem; o domínio comprado no CPF dela (no site está `estudiorafaeladamaceno.com.br`, provisório, pelo nome do repositório); as respostas de "Perguntas em aberto" |
| **Última atualização** | 16/11/2026 |

Demo (a proposta que ela viu):
- Site: https://www.renderizaweb.com.br/demo/rafaela-damaceno-fotografia
- Natal: https://www.renderizaweb.com.br/demo/rafaela-damaceno-fotografia/natal

## O que já existe (não refazer)

- **A demo:** `demos/rafaela-damaceno-fotografia/` (`demo.json` é a fonte; `index.html`, `natal.html` e `ficha.md` saem
  de `python3 ferramentas/demo/gerar-fotografia.py demos/rafaela-damaceno-fotografia/demo.json`). Nunca editar o HTML à
  mão. Sem os originais das fotos (outra sessão), o gerador reaproveita as fotos já tratadas das páginas (`data-k`):
  dá para mudar texto à vontade; trocar foto pede os originais (o Drive dela e a pasta do lote 3, ver a ficha).
- **O que a ficha diz** (`ficha.md`): de onde veio cada foto e cada texto, o que conferir com ela.
- **A agenda da demo:** ensaio ou campanha de Natal (com vagas) → dia → horário livre → nome e WhatsApp → "Pedido
  enviado. A Rafaela confirma pelo WhatsApp", abrindo o WhatsApp dela. Os dados vêm de `agenda` no `demo.json`
  (`window.AGENDA` na página) e seguem a regra da Agenda do painel (`horariosLivres`, `seguraHorario`,
  `resumoDaCampanha` em `painel-clientes/src/modulos/agenda/logica.js`). **Hoje nada chega ao painel.**
- **No painel:** o Meu site (editor, prévia, publicar, versões, voltar ao entregue), a API pública do site e a agenda
  online **de eventos** (por turno ou dia). O banco já tem o que a fotografia precisa (`servicos` = tipos de ensaio,
  `horarios` = horários de início por dia da semana, `campanhas` com dias, horários e vagas, `reservas.campanha_id`,
  `pedidos.hora_desejada`), mas as funções públicas da agenda só sabem turnos. O Meu site nunca foi testado num site
  real: a Rafaela é o primeiro.
- **O roteiro de entrega de site** (sem painel): [`docs/fechamento.md`](../fechamento.md). Vale para o que não muda
  (contas no nome dela, domínio, hospedagem, conferência no ar).

## O mapa

```
 [A] SITE NO REPOSITÓRIO DELA ━━ [B] REVISÃO ━━━━━━━━━━━━━━━━━━━━┓
       (agora)                     (com ela)                     ┣━━ [E] NO AR E ENTREGUE 🏁
                                   [C] A PONTE, NO STG ━━ [D] A CONTA DELA ┛
```

### A · O site no repositório dela
**Chegou quando:** o site abre na hospedagem dela (um endereço `….vercel.app`), igual à demo validada, nas duas
páginas, sem nada da Renderiza (`conferir-site` sem ✗), e a demo continua no ar.

| | Quem | O quê |
|---|---|---|
| A1 ✅ | Renderiza | Gmail de dev e GitHub dela (se ela não tiver), repositório **privado** vazio (ficou `estudiorafaeladamaceno`), a conta GitHub da Renderiza como colaboradora e o app do Claude instalado só nele. Mandar `usuario/rafaeladamaceno` ao Claude |
| A2 ✅ | Claude | `scripts/virar-site.mjs` aprende o site de várias páginas: `natal.html` vira `/natal`, os links `/demo/<pasta>` viram `/` e `/natal`, o sitemap leva as duas, cada página com a prévia dela. Sem mudar o resultado dos sites de uma página (os testes de hoje) |
| A3 ✅ | Claude | `demos/rafaela-damaceno-fotografia/site.json` (domínio, nome, cor, ícone a partir do selo dela, dados para o Google). Até o domínio ser comprado, o recomendado (`rafaeladamaceno.com.br`), anotado como provisório |
| A4 ✅ | Claude | Gerar (`npm run site -- rafaela-damaceno-fotografia`), conferir, olhar no celular e no computador, subir para o repositório dela (`add_repo`, push) |
| A5 | Renderiza | **Cloudflare Pages** na conta dela (decidido em 16/11: o grátis permite uso comercial, o da Vercel não): Workers & Pages → Create → Pages → Connect to Git → o repositório → preset None, sem build, saída `/`. Mandar o endereço `….pages.dev`. O domínio: o DNS passa para o Cloudflare (servidores trocados no Registro.br; se o DNSSEC estiver ligado lá, desligar antes) |
| A6 | Claude | Conferir no ar (as duas páginas, fotos, WhatsApp, agenda, prévia do link) |

Mexe em: raiz `scripts/virar-site.mjs` (e o teste dele), `demos/rafaela-damaceno-fotografia/site.json`, o repositório dela.

### B · Revisão: conteúdo final, layout, Google e segurança
**Chegou quando:** ela aprovou por escrito ("pode publicar") a versão final do site.

- B1 (Renderiza → Rafaela): as pendências da ficha numa mensagem só: os dias e horários de verdade, a duração dos
  ensaios, a campanha de Natal (dias, horários, vagas), as duas fotos da família dela, a marca d'água, o endereço com
  número e sala, a autorização das fotos de crianças e os ajustes que ela quiser.
- B2 (Claude): aplicar no `demo.json` e gerar de novo (a demo e o site mudam juntos); tirar a linha "Dias e horários
  de exemplo" quando os horários forem os dela.
- B3 (Claude): revisão de layout (celular e computador, tela cheia das fotos, menu, agenda com toques), acessibilidade
  (contraste, foco, textos alternativos), velocidade (fotos em `img/`, carregamento sob demanda) e Google (título,
  descrição, dados da empresa, `sitemap.xml`, prévia do link).
- B4 (Claude): segurança do site: estático, **nenhuma chave no código** (só a API pública do painel; segredo, se um dia precisar, só em código de servidor, Pages Functions, nunca no HTML), cabeçalhos
  (`vercel.json`, `_headers`), links externos com `noopener`, nada de dado pessoal dela (CPF, endereço de casa,
  nomes dos filhos) no repositório. Avaliar uma política de conteúdo (CSP) que libere só o painel, as fontes e o mapa.

### C · A ponte: o site fala com o painel (no STG)
**Chegou quando:** num site de teste da Rafaela ligado ao **STG**: uma edição publicada no Meu site aparece no site em
até 1 minuto; um pedido feito na agenda cai no Atendimento com a pré-reserva na Agenda (e o horário some do site); com
o painel desligado, o site abre com a versão validada e a agenda volta a ser pelo WhatsApp.

| | O quê | Mexe em |
|---|---|---|
| C1 | **Meu site no site dela:** as marcações `data-site-*` no `gerar-fotografia.py`, **por opção no `demo.json`** (as outras demos de fotógrafa não mudam), no padrão do `gerar.py` e do `gerar-eventos.py`. O mapa do que ela edita: textos, botões, fotos, as galerias do portfólio, os ensaios (com um campo de **preço** que começa vazio, e vazio não aparece), os depoimentos, o contato e mostrar/esconder seções. Conferir com `ferramentas/meu-site/extrair.mjs` | raiz `ferramentas/demo/gerar-fotografia.py`, raiz `ferramentas/meu-site/` (se precisar), `docs/painel-clientes/03` (a tabela "O que cada site deixa editar") |
| C2 | **Agenda online de fotografia no painel:** `publico_disponibilidade` e `publico_pedido` passam a atender a fotografia (horários de início do dia, campanhas com dias, horários e vagas, a duração do ensaio, a mesma regra de `horariosLivres` e `seguraHorario`); a API (`api/publico/agenda/[codigo]`) aceita ensaio, campanha e horário. Migração nova pelo `scripts/migrar.mjs`, **STG primeiro**; produção só com o "pode" | `painel-clientes/supabase/migrations/`, `painel-clientes/api/publico/agenda/`, `supabase/testes/040_publico_agenda.sql`, `test/agenda-online.test.mjs`, `docs/painel-clientes/04` e `05` |
| C3 | **A agenda do site usa a API:** lê a disponibilidade (os ensaios = Serviços na agenda online, a campanha ativa com vagas) e manda o pedido; mostra "Pedido enviado. A Rafaela confirma pelo WhatsApp". Se a API não responder, a agenda de hoje (os horários do `demo.json` e o WhatsApp) | raiz `ferramentas/demo/gerar-fotografia.py` (o JS da agenda) |
| C4 | **`virar-site` com o painel para fotografia:** `"painel": { "codigo", "agenda": true }` embute o script do Meu site e liga a agenda própria do site (não a página `/agenda/` de eventos) | raiz `scripts/virar-site.mjs` |
| C5 | **Prova no STG:** uma conta de teste de fotografia no STG com o site de teste dela (domínio `localhost` e o `….vercel.app`), o caminho inteiro com o Playwright: publicar, pedir, desligar | `test/` |

Antes de qualquer migração: ler `docs/painel-clientes/08-trabalho-em-paralelo.md` e deixar um aviso em
`docs/painel-clientes/missoes.md` ("Avisos entre sessões"), porque C mexe em arquivos do painel.

### D · A conta dela no painel (produção)
**Chegou quando:** ela entra no painel (login dela), vê o site dela no Meu site, parte por parte, e a Agenda com os
horários dela e a campanha de Natal.

- D1 (Renderiza): a conta dela no Admin (nicho fotografia), com o convite pelo WhatsApp. O Meu site vem em todo plano
  (D de 14/11 no `07`); os módulos que ela contratou, ligados.
- D2 (Claude, com a Renderiza): os ensaios em Serviços (com duração e, se ela quiser, valor), os horários de início
  por dia da semana, a campanha de Natal (dias, horários, vagas), as folgas.
- D3 (Claude, com o "pode"): as migrações e funções da Parada C na produção; o site cadastrado em `sites` (código,
  domínios, `conteudo_inicial` = a saída do `extrair.mjs` do site validado).

### E · No ar e entregue
**Chegou quando:** o site está no domínio dela, ligado ao painel, e ela já mudou algo sozinha e viu no site.

- E1 (Renderiza): o domínio no CPF dela (recomendado `rafaeladamaceno.com.br`, mais `rafaeladamasceno.com.br` com S
  apontando para ele; o antigo `rafaeladamacenofotografia.com.br` ainda é dela, venceu em 04/10/2026: se ela recuperar
  o acesso ao Registro.br, renova e aponta também); na Vercel, os domínios; no Registro.br, o DNS que a Vercel mostrar.
- E2 (Claude): `site.json` com o domínio de verdade e o `"painel"`, gerar, conferir (`scripts/conferir-site.mjs`),
  subir; os domínios no cadastro do site no painel.
- E3 (Claude e Renderiza): o teste de ponta a ponta na produção: ela muda um texto e publica; um pedido de teste na
  agenda (apagado depois, com o "pode"); desconectar no Admin → o site volta à versão inicial → reconectar.
- E4 (Claude): `npm run conferir-producao` (em `painel-clientes/`) e o `versao` de
  https://painel.renderizaweb.com.br/api/config depois de qualquer deploy do painel.
- E5 (Renderiza): a entrega: o link no Perfil da Empresa no Google e na bio do Instagram, o Search Console com o
  `sitemap.xml`, os acessos com ela (fora do chat). Fechar a ficha (seção "Entrega", modelo no `fechamento.md`).

## Perguntas em aberto (para a Renderiza; não travam o que não depende delas)

1. **Ela validou a demo?** A Fase 2 começa com o "validou" (combinado em 14/11).
2. **Quais módulos ela contratou?** (o plano tem 2, mais o Meu site; a agenda online é o módulo `agenda-online`.)
3. **Preço no site:** ela quer o "a partir de R$" em cada ensaio? A ideia é um campo no Meu site (ela digita, aparece;
   vazio, some). A outra opção é ler o valor de Serviços no painel.
4. **Métricas:** o que ela espera ver? Hoje o painel conta os pedidos da agenda (Atendimento, por origem), mas **não
   mede visitas nem cliques do site**. Visitas seriam coisa nova (contador no site e tabela no painel, com aviso de
   privacidade): decidir antes de prometer.
5. **A página de Natal no Meu site:** o `03` deixa páginas extras para depois. Começar só pela página inicial?
6. ~~Hospedagem~~ **Decidido em 16/11: Cloudflare Pages.**
7. **Pedido falso na agenda:** a API pública só lê o que já está publicado e só aceita o pedido da agenda (com campo-isca, tempo mínimo, os domínios do site e limites por endereço, WhatsApp e conta). Se aparecer pedido falso, pôr o Turnstile (a verificação antirrobô do Cloudflare) no formulário da agenda.

## Diário de bordo (o mais novo em cima)

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 16/11/2026 | A | Hospedagem: Cloudflare Pages (decisão da Renderiza). Pergunta da Renderiza sobre a API pública: ela não deixa mexer no site (ler = só o que já está publicado; editar = só com login no painel; o único envio público é o pedido da agenda, com limites); anotado o Turnstile para o caso de pedido falso. |
| 15/11/2026 | A | Repositório da Rafaela criado e ligado à sessão; o `virar-site` aprendeu o site de várias páginas (os sites de uma página saem idênticos) e a conferência olha todas as páginas; o site dela subiu na `main` dele (`a946cd1`). Para ligar o repositório, o claude.ai foi conectado ao GitHub dela, e o repositório da Renderiza ficou sem escrita até voltar para a Kaue7almeida (ver "O que aprendemos"). |
| 15/11/2026 | A | Trilho escrito com a Renderiza. Domínio: o antigo ainda está no nome dela (venceu em 04/10/2026); recomendado `rafaeladamaceno.com.br` + o com S. | Claude, a pedido da Renderiza |
| 15/11/2026 | demo | Teste da Renderiza: na agenda não dava para voltar às opções. Corrigido: "Voltar" preso abaixo do topo, passos clicáveis, o voltar do celular volta um passo, botão de novo pedido. Revisão foto a foto (marca d'água em 7) e do texto (4 ajustes). | Claude |
| 14/11/2026 | demo | Fase 1: a demo virou a proposta final (marca, fotos de Natal 2026, letras leves, sem a oferta, agenda de verdade). | Claude |

## Para colar ao abrir a próxima sessão

Abrir no ambiente **"Nuvem kaue"** (tem as variáveis `PAINEL_*` e a rede aberta), com os repositórios
`renderizaweb/Renderiza` e `rafaelafotografiadev-del/estudiorafaeladamaceno` selecionados. Antes: o GitHub conectado
no claude.ai é a Kaue7almeida, colaboradora (Write) no repositório dela, e o app do Claude instalado na conta dela.

> Você vai continuar a entrega da Rafaela Damaceno (Estúdio Fotográfico, Franco da Rocha): o site dela no repositório e
> no domínio dela, ligado ao Painel Renderiza (Meu site e agenda online). Responda sempre em português, direto e curto,
> e não invente nada.
>
> Antes de tudo: `git fetch origin` e leia, nesta ordem, `docs/entregas/rafaela-damaceno.md` (o trilho: onde o trem
> está, as paradas, as perguntas em aberto e o diário), `docs/entregas/README.md`, `CONTEXTO.md`,
> `docs/painel-clientes/README.md`, `08-trabalho-em-paralelo.md`, `missoes.md` (os "Avisos entre sessões"),
> `03-modulo-meu-site.md` e `04-arquitetura.md` ("API pública"), `docs/fechamento.md` e a `ficha.md` e o `demo.json` em
> `demos/rafaela-damaceno-fotografia/`.
>
> Siga o trilho a partir de "Onde o trem está". Ele não é cravado em pedra: se algo não fizer sentido, proponha o
> ajuste e registre. Em cada passo: atualize "Onde o trem está" e o diário no mesmo commit; anote em "O que
> aprendemos" (`docs/entregas/README.md`) o que vale para o próximo cliente.
>
> Regras:
> - A demo continua sendo a proposta: tudo sai do `demo.json` pelos geradores; nunca editar à mão um HTML gerado. Mudou
>   o gerador? Por opção no `demo.json`, sem mudar as outras demos (confira gerando uma de antes e comparando).
> - O site dela é estático e fica de pé sozinho; o painel só muda por cima, pela API pública; desconectado, volta à
>   versão inicial. O site só promete o que o painel entrega.
> - Banco: variáveis `PAINEL_*` (nunca mostre os valores); nunca toque no banco do Painel de prospecção
>   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Migração pelo `scripts/migrar.mjs`, sempre STG antes da produção, e
>   registrada em `missoes.md`. Migração ou função na produção e qualquer coisa destrutiva só com o "pode" da Renderiza.
> - Nunca: chave ou senha no código ou no chat, foto bruta ou dado pessoal dela no git, identificador de modelo de IA
>   nos commits.
> - Pode subir para a `main` do `renderizaweb/Renderiza` (autorizado), sempre testado antes, em commits pequenos; sem
>   PR. Antes de subir algo do painel: os testes do `painel-clientes` e o `npm run fluxos` (STG); depois do deploy,
>   `npm run conferir-producao` e o `versao` de https://painel.renderizaweb.com.br/api/config.
> - Não pergunte o que é operação da Renderiza; pergunte só o que travar o trabalho.
>
> No fim de cada parada, responda curto: o que fez, o que testou, os links (a demo e o site dela) e o que a Renderiza
> precisa fazer.
