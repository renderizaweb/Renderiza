# Painel Renderiza: o produto para clientes (comece aqui)

Este é o projeto do **Painel Renderiza de verdade**: o sistema com login que o cliente da Renderiza (espaço de
eventos, fotógrafa e os próximos nichos) e a equipe dele usam no dia a dia, no celular ou no computador. Hoje ele
existe só como exemplo com dados fictícios em `/exemplos`; esta pasta é o mapa para colocá-lo no ar, com Supabase e
Vercel, e para qualquer pessoa ou IA tocar o projeto a partir de onde ele parou.

## Onde o trem está agora

> **Parada 1 · Decisões de base.** Documentos escritos em 28/10/2026. Esperando as respostas da rodada 1 de
> perguntas (7 perguntas curtas) em [`07-decisoes-e-perguntas.md`](07-decisoes-e-perguntas.md). Próxima ação, detalhes e diário de bordo:
> [`01-trilho.md`](01-trilho.md).

(Quem avançar uma parada atualiza este quadro e o painel de bordo do trilho no mesmo commit.)

## Não confundir os dois painéis

| | Painel interno (Pipeline) | Painel Renderiza (este projeto) |
|---|---|---|
| Quem usa | Kaue e Milena | os clientes da Renderiza e as equipes deles |
| Para quê | prospecção: leads, demos, ritmo, atividade | o dia a dia do negócio do cliente: agenda, clientes, contratos, financeiro, atendimento e o site |
| Endereço | `renderizaweb.com.br/painel` | `painel.renderizaweb.com.br` (proposta, P2) |
| Código | `painel/` | `painel-clientes/` (proposta, P23; ainda não existe) |
| Banco | Supabase `gxdwluswpczlfgvzxqvg` | um projeto Supabase **novo e separado** (proposta) |
| Vitrine | — | `/exemplos` (eventos, Villa Alecrim) e `/exemplos/fotografia` (Estúdio Ciranda), com dados fictícios |

Nos documentos desta pasta, "painel" sem mais nada é sempre o **Painel Renderiza** (o dos clientes).

## Os documentos

| Arquivo | O que tem | Quando ler |
|---|---|---|
| [`01-trilho.md`](01-trilho.md) | O trilho: as paradas da partida ao lançamento, o que fazer em cada uma, onde o trem está e o diário de bordo | sempre, primeiro |
| [`02-produto.md`](02-produto.md) | O que vendemos: para quem, preço, módulos, o que cada um faz e não faz, promessas que a página já fez | antes de mexer em qualquer tela |
| [`03-modulo-meu-site.md`](03-modulo-meu-site.md) | O módulo novo: editar o site pelo painel, com a versão inicial sempre de pé | paradas 6 e 7 |
| [`04-arquitetura.md`](04-arquitetura.md) | Como fica de pé: Supabase, Vercel, domínio, e-mail, API pública, estrutura do código, planos gratuitos | paradas 2 a 7 |
| [`05-dados-e-permissoes.md`](05-dados-e-permissoes.md) | As tabelas, o isolamento entre clientes (RLS) e os acessos por módulo | paradas 3 a 7 |
| [`06-privacidade-e-seguranca.md`](06-privacidade-e-seguranca.md) | LGPD, termos, backup, chaves e o que nunca fazer com dado de cliente | parada 8 (e sempre) |
| [`07-decisoes-e-perguntas.md`](07-decisoes-e-perguntas.md) | O que já foi decidido, o que decidi por padrão e as perguntas em aberto | antes de decidir qualquer coisa |

## Como continuar o projeto (pessoa ou IA)

1. Leia este README, o [trilho](01-trilho.md) e o documento da parada atual. As regras gerais da Renderiza valem
   aqui também: [`CONTEXTO.md`](../../CONTEXTO.md) e [`docs/como-trabalhamos.md`](../como-trabalhamos.md)
   (português, direto e curto; **não inventar nada**; nunca pedir senha ou chave pelo chat).
2. Pegue o próximo item não feito da parada atual. Se ele depende de uma pergunta em aberto no `07`, pergunte:
   não decida sozinho o que está marcado como "em aberto".
3. Ao terminar um item: marque `[x]` no trilho, escreva uma linha no **diário de bordo** (data, o que foi feito,
   quem fez) e, se chegou ao fim da parada, atualize "Onde o trem está" aqui e no trilho.
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
- **Montagem do painel:** o trabalho de criar a conta do cliente, cadastrar os pacotes, as datas já marcadas e a
  equipe, e ensinar a usar. Nunca chamar de "taxa de ativação, adesão ou implantação".
