# O produto: o que vendemos

## Em uma frase

Um sistema na internet para o dia a dia do negócio do cliente (agenda, clientes, contratos, pagamentos, pedidos e
o próprio site) que ele e a equipe usam no celular ou no computador, cada um com a sua senha, pagando um valor por
mês sem fidelidade.

A fonte do que já foi prometido é a página de venda: `exemplos/index.html` (eventos) e `exemplos/fotografia.html`
(fotografia). Os textos de cada módulo ficam em `MODULOS`, no script dessas páginas. **O painel real tem que
cumprir o que elas dizem**; se algo mudar, a página muda junto.

## Para quem

| Nicho | Quem é | O que mais importa | Exemplo |
|---|---|---|---|
| **Eventos** (o do piloto) | salão de festas, chácara, espaço de eventos e de casamento, tocado pelo dono | a **data**: o que está reservado, o que está em negociação, contrato e parcelas de cada festa | Villa Alecrim (`/exemplos/painel-eventos`) |
| **Fotografia** | fotógrafa de família, gestante, newborn e infantil, que atende o próprio WhatsApp | o **horário**: vários ensaios no dia, campanhas com vagas (Natal), sinal pelo Pix, prazo de entrega | Estúdio Ciranda (`/exemplos/painel-fotografia`) |
| Próximos | odonto e estética (agenda por profissional), lojas e óticas (catálogo) | ainda não desenhado | — |

Dentro de cada conta, quem usa: o dono (vê tudo e dá os acessos) e a equipe (comercial, financeiro, produção,
assistente, quem edita as fotos), até 5 pessoas no plano.

## O site e o painel: sempre explicar a diferença

- **O site** é o que o cliente final vê: fotos, avaliações, endereço, o botão do WhatsApp. Qualquer pessoa abre.
  É pago uma vez, e o domínio e as contas dele são do cliente. **O site é independente:** funciona sozinho, e a
  ligação com o painel (agenda online, Meu site) entra só quando o cliente quiser.
- **O painel** é o que a equipe usa para organizar o trabalho. Só entra quem tem senha. É mensalidade, e fica no
  domínio e no banco da Renderiza.
- **Os dois se conversam pela API do painel:** a agenda online fica no site e manda os pedidos para o painel; o Meu
  site deixa o cliente atualizar o site pelo painel. Se o painel não responder, o site continua de pé.

## Preço (a página de venda é a referência)

| Item | Valor |
|---|---|
| Plano | **R$ 49 por mês** com 2 módulos à escolha e até 5 pessoas, cada uma com a sua senha |
| Cada módulo a mais | **R$ 14,99 por mês** (o **Meu site** é um módulo como os outros) |
| Fidelidade | nenhuma: cancela quando quiser e leva os dados numa planilha |
| Montagem do painel para quem faz o site com a Renderiza | **grátis** |
| Teste | **7 dias grátis** para quem se cadastra sozinho, contados do início, com os módulos que a pessoa escolher (menos os marcados como "só pago") |
| Mais 5 pessoas · cada espaço a mais | R$ 9,90 · R$ 29 por mês: **propostos**, ficam para depois do piloto |
| Versão final do site (para quem sai) | a definir (rodada 3) |

O valor fica em `PRECO`, no script das páginas de venda; o teste `test/site.test.mjs` confere que os textos batem.
A mensalidade, por enquanto, é paga por **Pix, por fora**, e registrada à mão no painel administrativo.

## Como a conta nasce e vive

```
 cadastro sozinho ──▶ TESTE (7 dias grátis) ──(a Renderiza aprova)──▶ ATIVA (com ou sem prazo) ──▶ DESLIGADA
 conta criada pela Renderiza ─────────────────────────────────────────▶ ATIVA                       (não pagou)
```

- **Cadastro sozinho:** a pessoa cria o login, o nome do negócio e o nicho, **escolhe os módulos que quer
  experimentar**, confirma o e-mail e entra no teste.
- **O teste é um só, de 7 dias, contados do início da conta.** Ligou outro módulo no 5º dia? Ele vale só até o fim
  dos mesmos 7 dias, não ganha prazo novo.
- **Módulo "só pago":** o que custa caro para a Renderiza oferecer de graça (ex.: um módulo futuro que use IA) fica
  bloqueado no teste. A marcação é por módulo, no painel administrativo.
- **Teste acabou:** a pessoa continua entrando, mas os dados ficam bloqueados e o painel mostra o aviso para fechar o
  plano (a mensalidade). Nada é apagado: assinou, tudo volta como estava.
- **Conta criada pela Renderiza** (como a do piloto): já nasce ativa, pelo painel administrativo, com a conta
  (tenant) certa no banco.
- **Aprovar:** a Renderiza confere e libera, com prazo ou sem prazo.
- **Não pagou:** a Renderiza desliga a conta no admin (é manual, sem regra automática de dias). A pessoa entra, vê o
  aviso e os dados ficam bloqueados; o site conectado volta à versão inicial. Pagou, religa e tudo volta.
- **Os dados de quem sai:** a página promete "se sair, leva os seus dados numa planilha". Quem pede pelo WhatsApp
  recebe a planilha da Renderiza (exportada pelo admin, com registro).

## As partes do painel

**Base (vem em toda conta, não conta como módulo):** Visão geral (o início), Equipe e acessos ("só vê" ou "edita"
por módulo), Configurações do negócio e Serviços (os pacotes ou os tipos de ensaio, que os módulos usam). O
**cliente** é a base de tudo: todo pedido, reserva, contrato e parcela é de um cliente (ver `05`).

**Módulos (todos construídos no mesmo lote; o cliente escolhe quais usa, 2 no plano):**

| Módulo | O que faz | Bom saber (o que **não** faz) |
|---|---|---|
| **Agenda online** | No site, o cliente final vê os dias (eventos) ou horários (fotografia) livres, escolhe o tipo de festa ou ensaio, convidados e pacote, e pede a pré-reserva, que chega no painel com a data separada. Na fotografia, mostra quantas vagas restam nas campanhas. | Fica dentro do site, então só existe com o site da Renderiza. É pré-reserva: quem confirma é o dono (na fotografia, depois do sinal). |
| **Agenda da equipe** (eventos) / **Agenda do estúdio** (fotografia) | Festas, visitas, degustações e reuniões do mês; ou ensaios por horário, com uma cor por tipo e quem cuida de cada um. Na fotografia, o quadro das campanhas, a lista de espera e o texto pronto para o Stories. Cada pessoa pode ver só o que é dela. | Agenda própria do painel: a ligação com o Google Agenda não está incluída (dá para conversar). |
| **Clientes** (eventos) / **Clientes e entregas** (fotografia) | A ficha de cada cliente como uma linha do tempo: pedidos, reservas, contrato, pagamentos, checklist da festa. Na fotografia, a entrega (escolhendo as fotos, em edição, entregue) com o prazo e o link da galeria. | As conversas continuam no WhatsApp; no painel fica o registro do que foi combinado. O painel não guarda as fotos: guarda o link da galeria. |
| **Contratos** | O contrato vai por um link, o cliente final lê e aceita no celular, e o painel guarda a data, a hora e quem aceitou. Mostra quem está com orçamento, contrato enviado e aceito. | Termo de aceite digital, sem certificado digital (e-CPF). O texto é do cliente: a Renderiza não escreve nem revisa contrato. |
| **Financeiro** | Parcelas e sinal de cada festa ou ensaio, com vencimento; dar baixa quando o pagamento chega; total do mês, a receber, atrasados; o que mais vende. | É controle: não recebe nem cobra. Pix, boleto e cartão continuam como o cliente já recebe. |
| **Atendimento** | Todo pedido de orçamento num lugar só: data ou ensaio desejado, convidados, de onde veio (agenda online, WhatsApp, Instagram, Google), etapa e quem está atendendo. "Fechou" vira reserva sem digitar de novo. | Só os pedidos da agenda online entram sozinhos; os do WhatsApp e do Instagram a equipe anota em poucos toques. |
| **Meu site** (novo, 28/10/2026) | Atualizar o site pelo painel: textos, botões (rótulo, destino e posição entre as opções do modelo), cores, imagens, galeria, depoimentos e seções. Rascunho, prévia e publicar. Detalhe em [`03`](03-modulo-meu-site.md). | Só para site feito pela Renderiza. Edita dentro do padrão do site (não é um construtor livre). Desconectado, o site volta sozinho à versão inicial; a versão final é vendida à parte. |

## Painel administrativo (só a Renderiza)

Pedido de 28/10/2026: ao entrar, quem é da equipe Renderiza tem também o painel administrativo. Simples no começo.

| Parte | O que mostra e faz |
|---|---|
| **Contas** | todas as contas, com a situação (teste, ativa, desligada), o nicho, desde quando, os cadastros novos para aprovar; aprovar, dar prazo, desligar, religar; criar uma conta à mão |
| **Módulos** | ligar e desligar os módulos de cada conta |
| **Pessoas e acessos** | quem entrou, quando e em qual conta; quem está usando agora; entrar numa conta para ajudar (sempre registrado) |
| **Pagamentos** | o Pix de cada mês registrado à mão: quem pagou e quem não pagou |
| **Indicadores** | quantas contas, cadastros por semana, pessoas ativas, uso de cada módulo, pedidos que vieram dos sites. **Só números**: nada de nome ou contato dos clientes dos clientes |

## Promessas que a página já fez (o painel real tem que cumprir)

- [ ] "Só você e a sua equipe entram, cada um com a sua senha." (parada 2)
- [ ] "Você decide o que cada pessoa pode ver: dá para esconder o financeiro de quem cuida da agenda." (parada 2)
- [ ] "Abre no navegador, sem instalar nada. Dá para deixar o ícone na tela do celular." (parada 2)
- [ ] "Quando o cliente pede uma data pelo site, o pedido aparece no painel." (parada 4)
- [ ] "O painel guarda a data, a hora e quem aceitou [o contrato]." (parada 3)
- [ ] "Sem fidelidade: cancela quando quiser. Se sair, leva os seus dados numa planilha." (paradas 3 e 5)
- [ ] "Pode mudar os módulos quando quiser; o valor novo vale a partir da mensalidade seguinte." (parada 5)
- [ ] "A gente monta o painel com os seus pacotes, as festas já marcadas e a sua equipe, e ensina todo mundo a
  usar." (parada 6)
- [ ] "Ajuda pelo WhatsApp quando precisar." (parada 5: entrar na conta para ajudar)
- [ ] "O horário fica separado até o sinal, e quem não conseguiu vai para a lista de espera." (paradas 3 e 4, fotografia)
- [ ] "Um painel só para todos os seus espaços" (FAQ de eventos; o preço ainda é proposto, fica para depois do piloto).

## Como falar do produto (regras que já valem na Renderiza)

- O nome é **Painel Renderiza** ("Bastidor" foi recusado em 21/10/2026: ninguém entendeu).
- **Montagem do painel**, nunca "taxa de ativação, adesão ou implantação".
- **Site**, nunca "landing page". Nunca "de bairro".
- Nada de "em breve": módulo futuro não aparece; dá a entender que os outros já estão prontos.
- Sempre explicar a diferença entre site e painel, sem supor que a pessoa já sabe.
- Escrever em "a gente", direto, sem jargão. O "Bom saber" aparece sempre junto do que o módulo faz.
- Nenhuma foto ou dado de cliente real em material da Renderiza sem autorização.

## O que fica de fora (por enquanto)

Cobrança automática da mensalidade, Google Agenda, receber pagamento (Pix, boleto, cartão), certificado digital,
escrever ou revisar contrato, hospedar fotos ou galeria, mensagens automáticas no WhatsApp ou no Instagram, app de
loja. Quem pedir, "dá para conversar"; entra no trilho só com decisão registrada no `07`.

## Os exemplos continuam

`/exemplos` segue como vitrine, com dados fictícios e o contador de visitas (é o link que vai para os leads). Quando o
painel real mudar uma tela, conferir se o exemplo ainda representa o que o cliente vai receber.
