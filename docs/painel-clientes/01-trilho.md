# O trilho do Painel Renderiza

O projeto é um trem: sai da partida (o que já existe hoje), passa por uma sequência de paradas e chega ao destino.
Cada parada tem o que fazer, o que precisa estar pronto antes e um **"chegou quando"**: só se sai de uma parada
quando o "chegou quando" é verdade. Este arquivo é vivo: quem trabalha no projeto marca o que fez e anota no
diário de bordo.

**Destino:** o Painel Renderiza no ar (proposta: `painel.renderizaweb.com.br`), com clientes pagantes entrando
com o próprio login, os módulos que eles contrataram funcionando com dados reais, os sites da Renderiza
conectados (agenda online e Meu site, sempre com a versão inicial de pé), a mensalidade sendo cobrada, as regras
de privacidade publicadas e backup rodando.

## Painel de bordo

| | |
|---|---|
| **Onde o trem está** | Parada 1 · Decisões de base |
| **Próxima ação** | Kaue e Milena respondem a rodada 1 de perguntas do [`07`](07-decisoes-e-perguntas.md) (7 perguntas curtas) |
| **Travado por** | rodada 1 |
| **Última atualização** | 28/10/2026 |

## O mapa

```
 PARTIDA      DECISÕES      INFRA        BANCO       CASCA       MÓDULOS     PONTE C/ SITE   MEU SITE
  [0] ━━━━━━━━━ [1] ━━━━━━━━━ [2] ━━━━━━━━ [3] ━━━━━━━━ [4] ━━━━━━━━ [5] ━━━━━━━━ [6] ━━━━━━━━━━ [7]
   ✅           🚂 aqui                                                                         ┃
                                                                                                ┃
  DESTINO                                                                                       ┃
  [11] ━━━━━━━━━ [10] ━━━━━━━━━ [9] ━━━━━━━━━━━━━━━━━━━━━ [8] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 LANÇAMENTO     PILOTO      OPERAÇÃO              PRIVACIDADE E SEGURANÇA
```

- **Primeira viagem** (o painel no ar com o primeiro cliente): paradas 2, 3, 4, 5 (só os módulos escolhidos na
  parada 1), 6, o essencial da 8, 9 e 10. É o caminho mais curto para "no ar o quanto antes".
- **Pode correr em paralelo:** a 8 (termos, política, backup) começa junto com a 3; a 7 (Meu site) começa depois
  da 4 e entra no trem quando ficar pronta, sem segurar o piloto (a não ser que o piloto precise dela).
- **Tamanho** de cada parada: P (pequena), M (média), G (grande). É o esforço relativo, não prazo.
- **Legenda:** ✅ feita · 🚂 o trem está aqui · ⬜ não começou · ⏸ parada (travada). Itens: `[ ]` a fazer, `[x]` feito.

---

## Parada 0 · Partida: o que já existe ✅

O ponto de partida é bom: a página que vende, as telas desenhadas e o jeito de trabalhar com Supabase e Vercel.

- [x] Página de venda por nicho, com preço, calculadora, módulos, "Bom saber" e perguntas: `/exemplos` (eventos) e
  `/exemplos/fotografia` (`exemplos/index.html`, `exemplos/fotografia.html`).
- [x] Painéis de exemplo clicáveis, com dados fictícios que acompanham a data de hoje: `exemplos/painel-eventos.html`
  e `exemplos/painel-fotografia.html`. **São a especificação visual de cada tela** do painel de verdade.
- [x] Agenda online de exemplo (`exemplos/agenda-online.html`, `exemplos/agenda-fotografia.html`): o pedido aparece no
  painel de exemplo (hoje pelo navegador, `localStorage`).
- [x] Preço decidido (Kaue, 21/10/2026): R$ 49/mês com 2 módulos e até 5 pessoas; R$ 14,99 por módulo a mais; sem
  fidelidade; montagem grátis para quem faz o site.
- [x] Experiência com Supabase + Vercel no painel interno: login, RLS, gatilhos, funções chamadas com a chave pública
  (`demo_liberada`, `registrar_visita`), middleware e funções da Vercel (`api/`).
- [x] Geradores de site a partir de um `demo.json` (`ferramentas/demo/gerar*.py`) e a conversão de demo em site do
  cliente (`scripts/virar-site.mjs`). É daqui que sai o "conteúdo inicial" do Meu site.
- [x] Contador de visitas dos links (`exemplos/visitas.js`, tabela `visitas`): já dá para ver quem abriu os exemplos.

## Parada 1 · Decisões de base 🚂 · P

**Para quê:** fechar o que muda o caminho (nome, endereço, nicho e módulos do lançamento, preço do Meu site,
cobrança, onde fica o código) antes de criar qualquer conta ou tabela.
**Precisa antes:** nada.

- [x] Documentos do produto escritos (esta pasta). · 28/10/2026
- [ ] Respostas às perguntas do [`07`](07-decisoes-e-perguntas.md).
- [ ] Respostas registradas como decisões no `07` e documentos ajustados.
- [ ] Definidos: o nicho e os módulos da primeira viagem, o piloto (se já houver) e uma data-alvo.

**Chegou quando:** nenhuma pergunta que trava a parada 1 ou 2 está em aberto no `07`.

## Parada 2 · Infraestrutura no ar (o "olá" com login) ⬜ · M

**Para quê:** ter o endereço, o banco, a hospedagem e o e-mail funcionando, com uma tela de login simples.
**Precisa antes:** parada 1 (P1 a P5 e P23). **Referência:** [`04-arquitetura.md`](04-arquitetura.md).

- [ ] Contas no nome da Renderiza (e-mail da empresa como dono), com verificação em duas etapas, para Kaue e
  Milena: Supabase, Vercel, serviço de e-mail e registro do domínio.
- [ ] Projeto Supabase **novo**, plano gratuito, região São Paulo (`sa-east-1`), separado do painel interno.
  Cadastro aberto **desligado** (só entra quem for convidado).
- [ ] Projeto Vercel novo, com a pasta do código como raiz (Root Directory) e build só quando essa pasta mudar
  (a `main` recebe muitos commits de demos e o plano Hobby tem limite de deploys por dia).
- [ ] Endereço `painel.renderizaweb.com.br` apontado para a Vercel, com HTTPS.
- [ ] E-mail próprio (SMTP) ligado ao login do Supabase, com remetente no domínio da Renderiza e os registros de
  DNS (SPF, DKIM, DMARC). **Sem isso, convite e "esqueci a senha" não chegam:** o e-mail padrão do Supabase só
  manda para a equipe do projeto, 2 por hora (conferido em 28/10/2026).
- [ ] Modelos de e-mail em português: convite, criar senha, recuperar senha, trocar e-mail.
- [ ] Variáveis de ambiente na Vercel: só a URL e a chave **pública** do Supabase.
- [ ] Banco local para desenvolver (o gratuito do Supabase permite 2 projetos ativos: o interno e este; não sobra
  um de testes) e migrações SQL versionadas no repositório.
- [ ] Tela de login mínima no ar: entrar, sair, recuperar senha.

**Chegou quando:** em `painel.renderizaweb.com.br`, uma pessoa de teste convidada recebe o e-mail, cria a senha,
entra, sai e consegue recuperar a senha.

## Parada 3 · Fundação do banco: várias contas, cada uma isolada ⬜ · M

**Para quê:** a base que garante que um cliente nunca vê o dado do outro e que cada pessoa da equipe só vê o que
o dono liberou. É a parada mais importante para a segurança.
**Precisa antes:** parada 2. **Referência:** [`05-dados-e-permissoes.md`](05-dados-e-permissoes.md).

- [ ] Tabelas base: contas, pessoas da equipe (com o acesso por módulo: sem acesso, só vê, edita), módulos
  contratados, convites e registro de atividade.
- [ ] RLS (as regras de acesso do banco) em **toda** tabela, com as funções de apoio (`sou_da_conta`, `pode`).
- [ ] Acesso da equipe Renderiza para suporte, sempre registrado.
- [ ] Testes automáticos de isolamento: pessoa da conta A não lê nem grava na B; quem só vê não edita; módulo não
  contratado não aparece; a chave pública sem login não lê nada.
- [ ] Rotina de "montagem": cria a conta, o nicho, os módulos e o convite ao dono (script primeiro; tela depois,
  na parada 9).

**Chegou quando:** os testes de isolamento passam no banco local e no projeto real.

## Parada 4 · A casca do painel (o que todo cliente vê) ⬜ · M

**Para quê:** o painel com cara de painel: entrar, navegar, convidar a equipe e dar acessos. Os módulos entram
depois, um a um, dentro dessa casca.
**Precisa antes:** parada 3. **Referência:** os exemplos (`exemplos/painel-*.html`) e [`02-produto.md`](02-produto.md).

- [ ] O layout dos exemplos virando o painel real: menu lateral, abas no celular, gaveta de detalhes, avisos.
- [ ] As palavras mudam pelo nicho (eventos: espaço, festa, convidados; fotografia: estúdio, ensaio, sinal).
- [ ] Primeiro acesso pelo convite, login, esqueci a senha, sair.
- [ ] Escolher a conta, para quem participa de mais de uma (a equipe Renderiza, um dono com dois negócios).
- [ ] Menu só com os módulos contratados; o que a pessoa não pode ver aparece trancado, como no exemplo.
- [ ] **Equipe e acessos:** convidar pessoa, escolher "só vê" ou "edita" por módulo, tirar o acesso; limite de 5
  pessoas no plano.
- [ ] **Visão geral** (o início), que ganha os números de cada módulo conforme eles chegam.
- [ ] **Configurações do negócio:** nome, logo, cores, WhatsApp, horário de funcionamento.
- [ ] Ícone na tela do celular (PWA), sem instalar nada da loja.
- [ ] Erros, "sem internet" e telas vazias em português, com o que fazer.

**Chegou quando:** o dono de uma conta de teste convida uma pessoa, dá a ela só a Agenda (só vê), e essa pessoa
entra pelo celular, vê só a Agenda e não consegue editar.

## Parada 5 · Os módulos do dia a dia ⬜ · G

**Para quê:** cada módulo fazendo de verdade o que o exemplo mostra. A ordem abaixo segue o que um usa do outro;
na primeira viagem, só entram os módulos escolhidos na parada 1.
**Precisa antes:** parada 4. **Referência:** [`02-produto.md`](02-produto.md) e os exemplos.

**Vale para todo módulo:** faz o que o exemplo mostra, com dados reais; respeita "só vê" e "edita"; o "Bom saber"
da página continua verdadeiro; exporta em planilha (a página promete "se sair, leva os seus dados numa planilha");
registra no histórico quem fez o quê.

- [ ] **5.1 Serviços** (base de tudo; não é módulo cobrado): pacotes e adicionais (eventos) ou tipos de ensaio com
  duração, valor e sinal (fotografia); dias e horários que o negócio abre; dias bloqueados.
- [ ] **5.2 Clientes** (na fotografia, **Clientes e entregas**): a ficha, o que foi combinado, a checklist da festa,
  o histórico; na fotografia, a entrega (escolhendo, em edição, entregue), o prazo e o link da galeria.
- [ ] **5.3 Agenda da equipe / Agenda do estúdio:** mês, semana e dia; por data (eventos) ou por horário
  (fotografia); cor por tipo; responsável; "só o que é meu"; nunca dois compromissos no mesmo horário. Na
  fotografia, as **campanhas** (mini sessão de Natal): vagas, lista de espera e o texto pronto para o Stories.
- [ ] **5.4 Atendimento:** todo pedido num lugar só, com origem, etapa e quem atende; anotar o pedido do WhatsApp e
  do Instagram em poucos toques; virar cliente e reserva sem digitar de novo.
- [ ] **5.5 Financeiro:** parcelas e sinal de cada festa ou ensaio, dar baixa, a receber, atrasados, total do mês e
  o que mais vende. É controle: não recebe nem cobra.
- [ ] **5.6 Contratos:** modelo com o texto do próprio cliente e campos automáticos (nome, data, pacote, valor);
  link para o cliente final ler e aceitar no celular; registro do aceite (data, hora, quem, IP, aparelho e a
  versão exata do texto); situação (orçamento, enviado, aceito); versão para imprimir ou salvar em PDF.

**Chegou quando:** os módulos da primeira viagem fazem, no painel real, tudo o que o exemplo mostra.

## Parada 6 · A ponte com o site (agenda online) ⬜ · M

**Para quê:** o pedido feito no site do cliente cair sozinho no painel, e o site continuar de pé se o painel cair.
**Precisa antes:** 5.1, 5.3 e 5.4. **Referência:** [`04-arquitetura.md`](04-arquitetura.md) (API pública).

- [ ] Endereço público **estável, no domínio da Renderiza** (ex.: `painel.renderizaweb.com.br/api/publico/...`):
  o site do cliente nunca fala direto com o Supabase.
- [ ] Ler a disponibilidade (dias ou horários livres) sem expor nada de ninguém: só livre ou ocupado.
- [ ] Receber a pré-reserva: vira pedido no Atendimento e separa a data ou o horário na Agenda (fotografia: separado
  até o sinal, com prazo para cair).
- [ ] Proteção contra robô e abuso: campo-isca, limite por endereço e, se precisar, verificação (Cloudflare Turnstile).
- [ ] Aviso ao dono quando chega pedido: e-mail e o número no menu do painel.
- [ ] **Fallback:** painel fora do ar ou conta desconectada → a agenda online vira "consultar pelo WhatsApp", com a
  mensagem pronta (data, tipo e convidados), como as demos fazem hoje.
- [ ] Agenda online como peça dos geradores de site (eventos e fotografia), ligada pelo código da conta.
- [ ] Campanhas (fotografia): as vagas que restam aparecem no site, e o horário some quando lota.

**Chegou quando:** num site de teste, a pessoa pede uma data, o pedido aparece no Atendimento em segundos, a data
fica separada na Agenda e, com o painel desligado, o site continua de pé mandando para o WhatsApp.

## Parada 7 · Meu site (editar o site pelo painel) ⬜ · G

**Para quê:** o cliente atualizar o próprio site (textos, botões, cores, imagens, depoimentos, seções) dentro de
um padrão fechado, com a versão inicial sempre de pé.
**Precisa antes:** parada 4 (e aproveita o endereço público da 6). **Referência:** [`03-modulo-meu-site.md`](03-modulo-meu-site.md).

- [ ] Contrato de conteúdo v1: o que é editável em cada seção, no formato do `03`.
- [ ] Geradores de site marcam o que é editável e guardam o conteúdo inicial; o `virar-site.mjs` põe o script do
  Meu site e o código da conta no site do cliente.
- [ ] Script do site: pede a versão publicada com tempo-limite curto; não veio, fica a versão inicial, sem erro.
- [ ] Editor no painel, por seção, com o que entrar na v1 (P15).
- [ ] Rascunho, prévia no próprio site e publicar; histórico de versões; "voltar para a versão inicial".
- [ ] Imagens: recorte, compressão (WebP) e limite de espaço por conta.
- [ ] Desconectar (atraso ou cancelamento) e gerar a **versão final** para entregar no repositório do cliente.
- [ ] Teste de fogo: com o painel fora do ar, o site abre igual à versão inicial.

**Chegou quando:** num site de teste, o dono troca o texto do topo, uma foto e a cor do botão, publica, e o site
mostra em até 1 minuto; ao desconectar a conta, o site volta sozinho à versão inicial.

## Parada 8 · Privacidade, segurança e as regras do jogo ⬜ · M

**Para quê:** poder guardar dado de cliente com tranquilidade e cumprir o que a página promete.
**Precisa antes:** pode começar junto com a 3. O marcado com ★ é obrigatório antes do piloto.
**Referência:** [`06-privacidade-e-seguranca.md`](06-privacidade-e-seguranca.md).

- [ ] ★ Termos de uso do Painel Renderiza (inclui o papel da Renderiza com os dados, cancelamento, exportação e
  prazo de guarda).
- [ ] ★ Política de privacidade do painel e dos sites conectados.
- [ ] ★ Aceite dos termos no primeiro acesso (guarda a versão e a data).
- [ ] ★ Backup: o gratuito do Supabase não tem. Cópia automática semanal, cifrada, guardada fora do Supabase, e
  **um teste de restauração** feito de verdade.
- [ ] ★ Revisão de segurança: RLS de todas as tabelas, funções públicas só com o mínimo, chave secreta só no
  servidor, cabeçalhos (sem Google, sem abrir dentro de outro site), limites de upload.
- [ ] Aviso curto na agenda online sobre os dados do pedido.
- [ ] Exportar tudo da conta (planilha) e apagar a conta (no prazo combinado).
- [ ] Registro de toda entrada da equipe Renderiza numa conta de cliente (suporte).

**Chegou quando:** termos e política publicados e aceitos no primeiro acesso, backup restaurado com sucesso num
banco de teste e a revisão de segurança sem pendência grave.

## Parada 9 · Operação da Renderiza (o bastidor) ⬜ · M

**Para quê:** vender, montar, cobrar e dar suporte sem depender de quem programou.
**Precisa antes:** paradas 4 e 5 (o que existir delas).

- [ ] **Montagem do painel:** passo a passo (e, depois, uma tela) para criar a conta, escolher nicho e módulos,
  cadastrar os serviços, importar clientes e datas já marcadas de uma planilha e convidar a equipe.
- [ ] **Cobrança da mensalidade** do jeito decidido (P18): onde se registra, como se confere e o que acontece no
  atraso (aviso → só leitura → site desconectado; P14).
- [ ] Trocar módulos (o valor novo vale na mensalidade seguinte), mais pessoas, cancelar.
- [ ] Ligação com o painel interno: lead ganho com painel → conta criada; no card do lead, a situação da conta.
- [ ] Suporte: o cliente pede ajuda pelo WhatsApp; a Renderiza entra na conta (registrado) para ajudar.
- [ ] Números do produto: contas ativas, uso de cada módulo, pedidos que chegaram pelos sites.

**Chegou quando:** alguém da Renderiza monta uma conta nova do zero, seguindo o passo a passo, sem ajuda técnica,
em menos de 1 hora.

## Parada 10 · Piloto (o cliente zero) ⬜ · M

**Para quê:** um cliente real usando de verdade antes de abrir para todos.
**Precisa antes:** primeira viagem completa (2 a 6, o ★ da 8 e o básico da 9).

- [ ] Escolher o piloto (P7) e combinar as condições (ex.: período grátis em troca de conversa semanal).
- [ ] Montar a conta com os dados reais dele.
- [ ] 2 a 4 semanas de uso, com uma conversa por semana e a lista de ajustes no diário de bordo.
- [ ] Corrigir o que atrapalhou o uso.

**Chegou quando:** o piloto usa o painel no dia a dia por 2 semanas seguidas sem pedir ajuda e diz que pagaria.

## Parada 11 · Lançamento (o destino) ⬜ · P

- [ ] Planos no nível certo para cobrar de cliente (tabela "Quando sair do gratuito", abaixo).
- [ ] `/exemplos` conferido com o painel real: o botão leva a começar de verdade e nenhum texto promete o que o
  painel não faz.
- [ ] Preços finais: os "propostos" (P10) viram decididos ou saem da página.
- [ ] Primeiros clientes pagantes montados.
- [ ] Este trilho passa para "manutenção": melhorias viram uma lista no `07` (ou um trilho novo).

**Chegou quando:** há clientes pagantes usando, pelo menos um site conectado recebendo pedidos, a cobrança andando
e o backup rodando.

## Depois do destino (fora do trilho por enquanto)

Google Agenda; Pix ou boleto integrado no financeiro; aviso por WhatsApp; app de loja; contrato com certificado
digital; galeria de fotos hospedada; vários espaços na mesma conta; conta de demonstração no painel real no lugar
dos exemplos; novos nichos (odonto com agenda por profissional; óticas e lojas com catálogo, a ideia guardada no
`CONTEXTO.md`). Nada disso aparece na página de venda antes de existir (regra: nada de "em breve").

---

## Quando sair do gratuito

O começo é no gratuito do Supabase e da Vercel (decisão de 28/10/2026). Limites conferidos nos sites oficiais em
28/10/2026; conferir de novo antes de decidir.

| Serviço | O gratuito hoje | Aperta quando | Próximo passo |
|---|---|---|---|
| **Supabase** | 2 projetos ativos; 500 MB de banco por projeto; 1 GB de arquivos; 5 GB de tráfego; 50 mil usuários por mês; **pausa depois de 1 semana sem uso**; **sem backup** | entram dados de cliente pagante (backup vira obrigação) ou as imagens do Meu site passam de 1 GB | Pro, a partir de US$ 25/mês: backup diário guardado por 7 dias, sem pausa, 8 GB de banco, 100 GB de arquivos |
| **Vercel** | Hobby: **só uso pessoal e não comercial**; 100 deploys por dia; 1 milhão de chamadas de função | o primeiro cliente pagante (a regra de uso comercial) | Pro, US$ 20 por pessoa/mês, ou levar o front (que é estático de propósito) para o Cloudflare Pages |
| **E-mail (SMTP)** | os planos gratuitos dos serviços de e-mail transacional (conferir na hora de contratar) | muitos convites e avisos de pedido por dia | o plano pago do mesmo serviço |

Enquanto o Supabase estiver no gratuito, a cópia semanal da parada 8 é o único backup. A hora de subir de plano é
decisão da Renderiza (28/10/2026); esta tabela é só referência.

---

## Diário de bordo

Uma linha por avanço. O mais novo em cima.

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 28/10/2026 | 1 | Perguntas resumidas numa rodada 1 de 7; o resto segue a recomendação até alguém vetar. Planos ficam com a Renderiza. | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Documentos do produto escritos em `docs/painel-clientes/` (trilho, produto, Meu site, arquitetura, dados, privacidade, decisões e perguntas). Perguntas enviadas. | Claude, a pedido da Renderiza |
