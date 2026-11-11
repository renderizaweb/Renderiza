# Proposta: Gabinete Aberto (vereador Mateuzinho Silva)

Conversa com o Kaue em 11/11/2026. É um **trabalho particular, sob medida, fora do Painel Renderiza**. O nome
"Gabinete Aberto" vem do "gabinete de portas abertas" dele e ainda pode mudar. Fatos e fontes: `ficha.md`.

## As duas ofertas

### A. Site do mandato

- Tudo o que está na demo.
- O "Pedido do bairro" funciona sem banco: abre o WhatsApp do gabinete com a mensagem montada (tipo, bairro, rua e
  descrição) e o morador anexa a foto lá. Falta confirmar o número oficial do gabinete.
- O "Rua por rua" mostra as indicações da Câmara e é atualizado pela Renderiza (por exemplo, uma vez por mês, como
  manutenção).
- Sem número de pedido, sem acompanhamento e sem edição pelo gabinete: as novidades e as fotos chegam e a Renderiza
  sobe.

### B. Site + Portal do Mandato

O dia a dia (o que tira o papel e a planilha):

1. **Central de pedidos:** site, WhatsApp, terça no gabinete e visitas numa fila só, com foto, endereço, quem da
   equipe cuida e a situação.
2. **Portas abertas:** a ficha de atendimento da terça no celular ou no tablet, a fila do dia e o resumo no fim.
3. **Munícipes:** o histórico de cada pessoa atendida, com o aceite da LGPD.
4. **Agenda do mandato:** interna; o que for público aparece no site.
5. **Editar o site:** acontecimentos, fotos, eventos e projetos, pelo próprio gabinete.

O que vende:

6. **O morador acompanha:** número e link; a cada passo, um aviso no WhatsApp.
7. **Ligado à Câmara:** indicações, requerimentos e projetos entram sozinhos (a mesma consulta ao sistema da Câmara
   que foi feita à mão para a demo); o site e os pedidos se atualizam.
8. **IA do gabinete:**
   - escreve a indicação a partir do pedido, no padrão de texto dele;
   - avisa se a rua já tem indicação;
   - lembra de reapresentar o que a Prefeitura não respondeu (em janeiro de 2026 foram 61 reapresentações).
9. **Indicadores e mapa de Itapevi:**
   - pedidos por bairro e tema;
   - tempo de resposta por secretaria;
   - porcentagem de resolvidos;
   - atendimentos por semana;
   - bairros sem visita.
10. **Relatório do mês pronto:** card para os Stories e PDF de prestação de contas.

**Entrega da B em duas etapas, no mesmo contrato:** primeiro os itens 1, 2, 5 e 6, que já fazem o site receber
pedidos de verdade; depois o resto.

**Ficou de fora:** a rede de apoiadores (moradores com "missões", ranking), inspirada no app do Missão. É
militância e tem risco legal; pode virar outra conversa.

## Cobrança (estrutura; os valores são do Kaue)

- **A:** pagamento único, com manutenção opcional.
- **B:** implantação e mensalidade, porque servidor, banco, IA e WhatsApp custam todo mês.
- **Envio automático no WhatsApp:** usa a API oficial, que cobra por mensagem. No começo, o aviso pode ser um botão
  que abre o WhatsApp do gabinete com a mensagem pronta.
- **Domínio e dados no nome dele,** com exportação.
- **Quem paga:** o site e o portal devem ser pagos por ele, não com verba de gabinete (ver
  `docs/nichos/vereadores.md`, seção 4).

## Cuidados

- **A Prefeitura é do grupo dele.** Um "Rua por rua" público também mostra o que a Prefeitura não respondeu. O
  portal precisa deixar o gabinete escolher o que fica público (por exemplo, só "encaminhado" e "atendido", sem a
  contagem de dias). A mensagem é sempre "o vereador cobra", nunca "a Prefeitura falha".
- **LGPD:** o cadastro do morador serve só para atender o pedido. Opinião política é dado sensível, e nada vira
  lista de campanha sem um consentimento próprio.
- **Lei eleitoral:** nada de pedido de voto, número de urna ou "candidato" (Lei 9.504, art. 36-A).
- **IA:** em conteúdo para o público, avisar que é feito com IA e nunca imitar o rosto ou a voz dele (o TSE exige isso
  na propaganda eleitoral; fora da campanha a regra é menos clara, então seguir igual).
- **O Missão** é outro partido (ele é do PL): fica só como referência interna, nunca citado para ele.

## Referência: o app do Missão

Pela página oficial e pela imprensa (a página não abriu nesta rede, então não foi testado), o app tem:
- missão diária com pontos (XP) e nível;
- ranking nacional;
- um feed com mais de 2 mil cortes para compartilhar;
- códigos de entrada e check-in em eventos.

O que foi aproveitado:
- **tarefas da semana da equipe** (no lugar das missões);
- **o "kit de conteúdo"** (cada pedido resolvido vira post de antes e depois);
- **o check-in** do portas abertas.

Fontes:
- [app.missao.org.br](https://app.missao.org.br/)
- [Fundação Perseu Abramo](https://fpabramo.org.br/entre-o-livro-amarelo-e-a-vala-por-dentro-da-convencao-do-missao-de-renan-santos/)
- [Projeto Brief](https://projetobrief.substack.com/p/a-geracao-que-o-missao-quer-recrutar)

## O vídeo

**Agora: um vídeo de proposta, privado, para ele e a equipe.** Vertical, 87 s, para mandar no WhatsApp junto com o
link da demo.
- **Arquivos:**
  - página `instagram/reels-proposta-vereador.html`;
  - texto e voz em `instagram/narracao/reels-proposta-vereador.json`;
  - o vídeo em `gravacoes/vereador-mateuzinho-silva-proposta.mp4` (720p, para o WhatsApp).
- **Gerar de novo:**
  1. Baixar as fotos com `fotos-vereador.py`.
  2. Copiar `retrato`, `gabinete` e `rua` para `rascunhos/vereador-video/` (ver o comentário no topo da página).
  3. Rodar `SSL_CERT_FILE=/root/.ccr/ca-bundle.crt node instagram/gerar.mjs reels-proposta-vereador`.
- **Roteiro:**
  1. 185 indicações: "quantas o morador consegue acompanhar?";
  2. hoje: WhatsApp, papel, rua, e o pedido some de vista; 61 reapresentados em janeiro;
  3. "Agora imagina o Gabinete Aberto";
  4. a demo real no celular (busca "Rua Tilápia" e o pedido de demonstração);
  5. o portal: fila, IA da indicação, Câmara e lembrete de cobrar;
  6. o aviso no WhatsApp, os indicadores e o card dos Stories;
  7. a prévia do vídeo de lançamento, com a marca "PRÉVIA";
  8. o convite: "Te mostro na terça, no gabinete de portas abertas."
- **O que é real e o que é simulação:**
  - **real:** a demo e as fotos dele;
  - **simulação** (com a etiqueta "Simulação · como vai funcionar" na tela): o portal, a conversa no WhatsApp, o card
    dos Stories e o vídeo de lançamento.
- **A narração** é a voz neural "Antonio" (Microsoft), não a dele.
- **Números e onde estão:**

  | Número | Fonte |
  |---|---|
  | 185 indicações, 173 na Prefeitura, 10 projetos aprovados | `dados/proposituras.json` |
  | 61 reapresentações em janeiro de 2026 | `dados/pedidos.json` (indicações de 01/2026 no mesmo pedido de uma de 2025) |
  | os seis bairros com mais pedidos (Jardim Portela 10, Jardim São Carlos 9, Centro 8, Vila Santa Rita 8, Jardim Sorocabano 5, Monte Serrat 5) | `dados/pedidos.json` |
  | 2026 até 11/09: 117 indicações, 143 requerimentos, 14 projetos de lei | `dados/proposituras.json` |
  | Indicações 10527, 10379, 10376 e 10295/2026 (com as datas) | `dados/proposituras.json` |
  | Indicações 1447/2026 e 5867/2025 (câmeras na Rua Tilápia) | `dados/proposituras.json` |

  O "nº 2026-0168" é o número de demonstração do formulário da demo.
- **Pedidos simulados no portal:** "Poste apagado na Rua Quinze de Novembro" e "Limpeza da praça da Av. Brasil" são
  exemplos de pedido em ruas reais, sem fato novo sobre ele.

**Depois de fechar:** o vídeo de lançamento para a população entra no pacote, gravado com ele de verdade.

## A decidir com o Kaue

1. O nome ("Gabinete Aberto" ou outro).
2. Cortes ou acréscimos na lista da opção B.
3. Os valores da A e da B.
4. Se a rede de apoiadores entra em algum momento.
