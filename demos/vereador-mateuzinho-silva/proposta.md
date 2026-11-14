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

## O vídeo (versão 2, 11/11/2026)

A primeira versão (87 s, que falava com ele pelo nome e mostrava aviso automático no WhatsApp) foi recusada pelo Kaue:
parecia amadora e prometia o que não dá para entregar. A versão 2 é uma **peça institucional**.
- **Para quem:** explica a ideia a quem nunca ouviu falar dela e serve para ele postar como "o que estamos
  preparando".
- **Como chega a ele:** o Kaue manda no WhatsApp como quem diz "tive algumas ideias e tentei colocar num vídeo".
- **Arquivos:**
  - página `instagram/reels-proposta-vereador.html`;
  - texto e voz em `instagram/narracao/reels-proposta-vereador.json`;
  - vídeo em `gravacoes/vereador-mateuzinho-silva-proposta.mp4` (720p, para o WhatsApp).
- **Gerar de novo:**
  1. Baixar as fotos com `fotos-vereador.py`.
  2. Copiar para `rascunhos/vereador-video/` as fotos `gabinete.jpg` (post DeuXXbAFS-6, foto 1) e
     `rua-sem-asfalto.jpg` (post DfX7haJo7it, foto 4).
  3. Rodar `SSL_CERT_FILE=/root/.ccr/ca-bundle.crt node instagram/gerar.mjs reels-proposta-vereador`.
- **Regras:**
  - sem o nome dele na narração e sem falar com ele;
  - sem convite da Renderiza no fim;
  - nada de WhatsApp automático;
  - nada de pedir voto.
- **Roteiro (71 s, voz sintética "Antonio"):**
  1. "Todo dia, um pedido chega ao gabinete": foto do gabinete de portas abertas.
  2. "Uma rua sem asfalto. Um poste apagado. Uma praça esquecida.": foto da visita de 05/11/2026 e dois desenhos.
  3. "Desde 2025, foram 185 indicações à Prefeitura": 185 pontos acendendo.
  4. "Mas, no caminho, quem pediu nem sempre sabe em que pé está o seu pedido": o caminho Pedido → Indicação →
     Prefeitura → "E depois?".
  5. "Por isso, estamos preparando o Gabinete Aberto": a luz de uma porta e a marca.
  6. "Uma plataforma que conecta o morador, a equipe do gabinete e a Câmara".
  7. **01 · Para o morador:** a demo de verdade no celular. O pedido sai com foto (um asfalto desenhado) e recebe um
     número, e a linha do tempo anda.
  8. **02 · Para a equipe:** o quadro de pedidos (Novos, Em andamento, Na Prefeitura) e a equipe do gabinete, com
     acesso por pessoa e um responsável por pedido.
  9. **03 · Ligado à Câmara:** indicações reais e, em seguida, a IA redigindo e o lembrete de cobrança.
  10. **04 · Para a cidade:** "Rua por rua", com a busca "Rua Tilápia" e os bairros em bolhas.
  11. **05 · Para o mandato:** os números.
  12. Fecho: "Gabinete Aberto. Um olhar para a população." com "Vereador Mateuzinho Silva · Itapevi" e "Conceito em
      desenvolvimento".
- **Só o que dá para entregar:**
  - **pedido pelo site e acompanhamento por link:** precisa de banco;
  - **acesso por pessoa:** login;
  - **indicações a partir do sistema da Câmara:** a consulta da demo, automatizada;
  - **IA que ajuda a redigir:** API de IA, que custa por uso;
  - **lembretes e números:** regras simples no portal.
- **O que é real e o que é exemplo:**
  - as telas do produto levam a etiqueta "Conceito em desenvolvimento";
  - os pedidos novos do quadro são exemplos: buraco na Rua Tilápia, poste na Rua Quinze de Novembro, calçada no
    Centro e praça da Av. Brasil;
  - as bolhas dos bairros não são um mapa: só mostram quantos pedidos cada bairro tem.
- **Números e onde estão:**

  | Número | Fonte |
  |---|---|
  | 185 indicações, 173 na Prefeitura, 10 projetos aprovados | `dados/proposituras.json` |
  | os bairros com mais pedidos (Jardim Portela 10, Jardim São Carlos 9, Centro 8, Vila Santa Rita 8, Jardim Sorocabano 5, Monte Serrat 5, Jardim Briquet 4 e sete bairros com 3) | `dados/pedidos.json` |
  | Indicações 10527, 10379 (na Prefeitura desde 03/09/2026), 10376 e 10295/2026 | `dados/proposituras.json` |
  | Indicação 1447/2026 (câmeras na Rua Tilápia, PMI 011839/2026) | `dados/proposituras.json` |

  O "nº 2026-0168" é o número de demonstração do formulário da demo.
- **Se ele for postar:** a narração é voz sintética, e convém dizer isso na legenda do post (o TSE exige o aviso na
  propaganda eleitoral; fora da campanha não é obrigatório, mas é o mais seguro).

**Depois de fechar:** o vídeo de lançamento para a população, gravado com ele de verdade.

## A decidir com o Kaue

1. O nome ("Gabinete Aberto" ou outro).
2. Cortes ou acréscimos na lista da opção B.
3. Os valores da A e da B.
4. Se a rede de apoiadores entra em algum momento.

## Proposta, contrato e assinatura (14/11/2026)

- **Páginas:** `propostas/vereador-mateuzinho-silva.html` (/proposta/vereador-mateuzinho-silva) e
  `contratos/vereador-mateuzinho-silva.html` (/contrato/vereador-mateuzinho-silva). Os "Quero seguir" da proposta levam
  ao contrato. As duas contam visita no card do lead (`data-sub` "proposta" e "contrato").
- **Condições combinadas com o Kaue:**
  - R$ 3.300 (60 h a R$ 55; tabela R$ 75, ou R$ 4.500);
  - entrega única e completa em até 5 semanas: a proposta mostra a ordem prevista do trabalho e as horas de cada
    funcionalidade, sem prometer entregas por fase (pedido do Kaue em 14/11);
  - nada a pagar nos primeiros 15 dias; 40% (R$ 1.320) no 15º dia, com a prévia (o andamento até ali) já enviada;
  - 60% (R$ 1.980) até o dia útil seguinte à validação da entrega final; o vereador valida em até 1 dia útil, e o
    silêncio vale como validação;
  - entrega final em até 25 dias úteis (cerca de 5 semanas);
  - garantia de 90 dias só para defeitos (erros de funcionamento), não para melhorias;
  - desistência sem custo nos 7 primeiros dias (Código de Defesa do Consumidor, art. 49: contrato fechado pela internet);
  - planos: Essencial R$ 300 (o mínimo), Gabinete R$ 590 (recomendado) e Completo R$ 990, sem prazo mínimo (aviso de
    30 dias). A hospedagem, o banco e os e-mails ficam por conta da Renderiza;
  - ou **sem plano**: o gabinete contrata e administra a própria estrutura (Supabase Pro de referência, US$ 25 por mês),
    a entrega já vai para as contas dele e a Renderiza atende por hora;
  - sem a declaração de "recursos próprios": ele declara que contrata como pessoa física e é o responsável pelos
    pagamentos. Se ele quiser reembolso pela verba da Câmara, conferir antes a regra de lá (costuma exigir nota fiscal).
- **Dados da Renderiza no contrato:** Kaue de Almeida Cunha. Na página, o CPF aparece mascarado (***.406.148-**) e o
  endereço só como "São Paulo/SP", porque a página é aberta a quem tiver o link. O número completo e o endereço vão no
  comprovante por e-mail (coluna `contratada` do termo, gravada direto no banco, fora do repositório).
- **Custos por cliente (14/11/2026, estimativa):** Supabase Pro US$ 25 (cerca de R$ 145; a organização da Renderiza no
  Supabase está no plano grátis, que não faz cópia diária e pausa projetos parados, então o projeto do gabinete precisa
  do Pro), Vercel cerca de R$ 20 de rateio (o plano grátis não permite uso comercial), IA cerca de R$ 20. Estrutura:
  cerca de R$ 185 por mês. Com cerca de 1,5 h de trabalho, o Essencial custa cerca de R$ 267.
- **"Mandato":** é o período do cargo (2025 a 2028). "Site do mandato" é o site oficial do vereador no cargo, diferente
  de um site de campanha, que tem regras próprias.

### Como a assinatura funciona

- **Banco:** projeto do Supabase da prospecção, `supabase/termos-online.sql`.
- **Termo:** `vereador-mateuzinho-silva-v1` guarda o texto do contrato e a impressão SHA-256 dele (texto de `#contrato`,
  espaços juntados). A página só assina se a impressão for a mesma. Mudou o texto: criar o termo v2 e trocar `TERMO`
  na página.
- **Código por e-mail:**
  - a função de borda `termo-codigo` (`supabase/functions/termo-codigo`) sorteia 6 números, guarda só o hash e manda
    pelo Brevo, de nao-responda@renderizaweb.com.br;
  - o banco confere o código na assinatura: vale 15 minutos e 5 tentativas, e só o último pedido vale;
  - limites: um código por minuto e 3 por hora para o mesmo e-mail, 6 por hora para o mesmo IP;
  - precisa da chave `BREVO_API_KEY` em Edge Functions → Secrets desse projeto;
  - `exige_codigo` no termo liga ou desliga esse passo.
- **O que fica registrado:**
  - nome, CPF, e-mail (e se foi confirmado), WhatsApp, endereço e plano;
  - as três declarações;
  - o IP e o aparelho, lidos dos cabeçalhos dentro do banco;
  - a data e a impressão;
  - um passo "Assinou o contrato online" na Atividade do lead.
- **Comprovante:** logo depois da assinatura, a página pede à função `termo-codigo` (acao "comprovante") o e-mail com o
  protocolo, os dados, a impressão e os dados completos da Renderiza, para quem assinou, com cópia para
  contato@renderizaweb.com.br. Sai uma vez só (`comprovante_em`).
- **Para apagar um teste:** apagar as linhas de `termos_aceites` e `termos_codigos` e o passo `contrato-assinado` em
  `visitas` do lead.

### Compromissos de segurança do contrato (Anexo II): conferir na implantação

1. HTTPS em tudo.
2. Projeto do Supabase exclusivo do mandato, em São Paulo, no plano Pro (cópia diária; o grátis não serve).
3. Login individual, com verificação em duas etapas para toda a equipe.
4. Perfis de acesso com RLS em todas as tabelas.
5. Registro de quem criou, alterou ou excluiu cada coisa; registros de acesso guardados por 6 meses.
6. Cópia diária guardada por 7 dias, mais uma semanal guardada à parte por 4 semanas (some tudo em até 30 dias depois
   do fim, como promete a cláusula 13).
7. Formulário público com proteção contra robôs (Turnstile) e limite de envios.
8. Página do pedido só pelo link ou pelo número com confirmação.
9. O site público nunca mostra nome, telefone ou endereço de quem pediu.
10. Atualizações de segurança, monitoramento e revisão de segurança antes de cada entrega.
11. Domínio na conta do vereador no Registro.br, com duas etapas.
12. Acesso da Renderiza só com duas etapas e só pelo tempo necessário.
13. A IA nunca recebe nome, telefone, e-mail ou endereço de morador.
14. Avisar o vereador de incidente em até 2 dias úteis.
