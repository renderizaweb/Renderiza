# Painel Renderiza: o produto para clientes (comece aqui)

Este é o projeto do **Painel Renderiza de verdade**: o sistema com login que o cliente da Renderiza (espaço de
eventos, fotógrafa e os próximos nichos) e a equipe dele usam no dia a dia, no celular ou no computador. Hoje ele
existe só como exemplo com dados fictícios em `/exemplos`; esta pasta é o mapa para colocá-lo no ar, com Supabase e
Vercel, e para qualquer pessoa ou IA tocar o projeto a partir de onde ele parou.

## Onde o trem está agora

> **Parada 2 de 6 · Fundação: banco e casca.** Decisões fechadas em 28/10/2026, sem perguntas em aberto.
> Endereço: `painel.renderizaweb.com.br`. Piloto: um espaço de eventos (o site dele ainda vai ser feito), com meta de
> começar a usar por volta de 11/11/2026. **Missão 1 feita (29/10/2026):** e-mail (Zoho recebe, Brevo envia),
> Supabase em São Paulo (produção e STG), Vercel em `painel.renderizaweb.com.br`, login configurado pelo repositório
> (e-mails em português, cadastro fechado até a verificação contra robô), esqueleto, migrações, design system e telas
> de acesso, tudo na `main` e conferido. **Missão 2 feita (29/10/2026):** o banco inteiro ([`05`](05-dados-e-permissoes.md)) e as telas base (casca, convite, cadastro, onboarding, Equipe, Configurações, Serviços) na `main`. **Agora: Missões 3, 4 e 5, em paralelo** (da 3, o Atendimento está feito). Detalhes e diário de bordo:
> [`01-trilho.md`](01-trilho.md); as missões: [`missoes.md`](missoes.md).

(Quem fechar uma missão atualiza este quadro e o painel de bordo do trilho no mesmo commit.)

## Não confundir os dois painéis

| | Painel de prospecção | Painel Renderiza (este projeto) |
|---|---|---|
| Quem usa | Kaue e Milena | os clientes da Renderiza e as equipes deles |
| Para quê | prospecção: leads, demos, ritmo, atividade | o dia a dia do negócio do cliente: agenda, clientes, contratos, financeiro, atendimento e o site |
| Endereço | `renderizaweb.com.br/painel` | `painel.renderizaweb.com.br` |
| Código | `painel/` | `painel-clientes/` (esqueleto da Missão 1) |
| Banco | Supabase `gxdwluswpczlfgvzxqvg` (conta atual) | conta nova do Supabase com dois projetos: `painel-renderiza-prod` (produção) e `painel-renderiza-stg` (STG) |
| Vitrine | — | `/exemplos` (eventos, Villa Alecrim) e `/exemplos/fotografia` (Estúdio Ciranda), com dados fictícios |

Nos documentos desta pasta, "painel" sem mais nada é sempre o **Painel Renderiza** (o dos clientes). O de
prospecção é sempre chamado de **Painel de prospecção**, e a área da Renderiza dentro do Painel Renderiza, de
**Admin**.

## Os documentos

| Arquivo | O que tem | Quando ler |
|---|---|---|
| [`01-trilho.md`](01-trilho.md) | O trilho: as 6 paradas até o piloto, o que cada uma entrega, onde o trem está e o diário de bordo | sempre, primeiro |
| [`missoes.md`](missoes.md) | As 6 missões (uma por parada): o que cada uma entrega, os blocos, quem está fazendo, as notas de passagem e o texto para colar ao abrir uma sessão | antes de começar qualquer trabalho |
| [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md) | As regras para várias sessões de IA trabalharem ao mesmo tempo sem se bater | antes de começar qualquer trabalho |
| [`02-produto.md`](02-produto.md) | O que vendemos: para quem, preço, como a conta nasce e vive, módulos, Admin, promessas que a página já fez | antes de mexer em qualquer tela |
| [`03-modulo-meu-site.md`](03-modulo-meu-site.md) | O módulo novo: editar o site pelo painel, com a versão inicial sempre de pé | parada 4 |
| [`04-arquitetura.md`](04-arquitetura.md) | Como fica de pé: Supabase, Vercel, domínio, e-mail, API pública, estrutura do código e o passo a passo das contas | paradas 1, 2 e 4 |
| [`05-dados-e-permissoes.md`](05-dados-e-permissoes.md) | O cliente no centro: como tudo se amarra no banco e na tela; as tabelas; os acessos por módulo | paradas 2 a 5 |
| [`06-privacidade-e-seguranca.md`](06-privacidade-e-seguranca.md) | LGPD, termos, backup, chaves e o que nunca fazer com dado de cliente | parada 5 (e sempre) |
| [`07-decisoes-e-perguntas.md`](07-decisoes-e-perguntas.md) | O que já foi decidido e o que vale por padrão | antes de decidir qualquer coisa |
| [`09-ux.md`](09-ux.md) | A experiência: princípios, o que melhorar em cada tela do exemplo, onboarding, peças comuns, velocidade e referências | antes de desenhar qualquer tela |
| [`prompt-de-sessao.md`](prompt-de-sessao.md) | O texto para colar ao abrir uma sessão nova do Claude (lê a documentação, confere o que está em andamento, segue as regras) | ao abrir qualquer sessão |
| [`10-design-system.md`](10-design-system.md) | As cores, o tipo, os espaços e as peças (`src/ui/`), com as regras de uso | antes de escrever qualquer tela |

## Como continuar o projeto (pessoa ou IA)

1. Leia este README, o [trilho](01-trilho.md) e o documento da parada atual. As regras gerais da Renderiza valem
   aqui também: [`CONTEXTO.md`](../../CONTEXTO.md) e [`docs/como-trabalhamos.md`](../como-trabalhamos.md)
   (português, direto e curto; **não inventar nada**; nunca pedir senha ou chave pelo chat).
2. Leia [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md): o projeto anda em várias sessões, em paralelo ou
   continuando a mesma missão. Pegue só a missão (e o bloco) que a Renderiza indicou, marque-a em
   [`missoes.md`](missoes.md), mantenha a nota de passagem em dia e mexa só no que ela permite. Migração no banco: só
   com as regras do `08`.
3. Ao entregar: branch com push, `pronta para subir` em `missoes.md`, uma linha no **diário de bordo** do trilho (data, o
   que foi feito, quem fez) e, se a parada fechou, "Onde o trem está" atualizado aqui e no trilho. Juntar na `main` é
   com a Renderiza.
4. Decidiu algo novo (ou o Kaue e a Milena decidiram)? Registre no `07` com data e fonte.
5. Mudou o plano? Mude o documento **no mesmo commit** do código. Documento desatualizado é bug.
6. Nunca: dado real de cliente no repositório (nem em print, teste ou commit), chave secreta no front ou no chat,
   identificador de modelo de IA no texto dos commits.

## Glossário

- **Conta:** o negócio cliente (um espaço de eventos, um estúdio). Tudo no banco pertence a uma conta.
- **Pessoa da equipe:** quem entra no painel de uma conta, com e-mail e senha próprios. O dono é a primeira.
- **Módulo:** uma parte do painel que o cliente escolhe e paga (Agenda, Clientes, Financeiro…). O plano vem com 2.
- **Cliente final:** o cliente do nosso cliente (quem faz a festa, a mãe que marca o ensaio).
- **Agenda online:** a página **dentro do site** do cliente onde o cliente final escolhe a data ou o horário e
  pede a pré-reserva, que cai no painel. Só existe com site da Renderiza.
- **Meu site:** o módulo novo, em que o cliente edita o site dele pelo painel (textos, botões, cores, imagens,
  seções). Detalhe em [`03-modulo-meu-site.md`](03-modulo-meu-site.md).
- **Versão inicial do site:** a que foi entregue na venda do site, embutida no próprio site. É o que aparece
  sempre que o painel não responde ou a conta está desconectada.
- **Versão final:** a última versão publicada no Meu site, "congelada" dentro do site, sem depender do painel.
  É vendida à parte para quem sai.
- **Painel de prospecção:** o painel que a Renderiza usa para prospectar (`painel/`, leads, demos). Não é este
  projeto.
- **STG:** o banco de homologação do Painel Renderiza, com dados fictícios; tudo passa por ele antes da produção.
- **Admin:** a área do Painel Renderiza só da equipe Renderiza: contas, quem acessa, pagamentos, indicadores, ligar e
  desligar módulos.
- **Teste de 7 dias:** quem se cadastra sozinho usa grátis por 7 dias; a Renderiza aprova à mão.
- **Montagem do painel:** o trabalho de criar a conta do cliente, cadastrar os pacotes, as datas já marcadas e a
  equipe, e ensinar a usar. Nunca chamar de "taxa de ativação, adesão ou implantação".
