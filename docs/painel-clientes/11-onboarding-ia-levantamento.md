# Parada 7 · Onboarding com IA (levantamento, nada decidido)

Rascunho da conversa de 30/10/2026 entre a Renderiza e a sessão da Missão 4. **Nada aqui está decidido.** Serve de
ponto de partida para a sessão que vai fazer o levantamento com a Renderiza e, no fim, escrever a Parada 7 no
[`01-trilho.md`](01-trilho.md) e as missões no [`missoes.md`](missoes.md).

## O problema

Um lead que vira cliente precisa ver o painel com a cara do negócio dele: clientes, pacotes e preços, datas já
marcadas, contrato. **Ninguém vai digitar isso um a um**, e sem isso o painel não vende. A Renderiza não quer que o
lead leve dias para começar e desista no meio: **tem que ser plug and play.** Ela também não sabe ainda o que os
leads têm em mãos (agenda de papel? planilha? só o WhatsApp?) nem se vão ter tudo de uma vez.

## O que já existe (não refazer)

- Onboarding em trilho (D33, `/comecar`) e os Primeiros passos no Início (`src/modulos/inicio/primeiros-passos.js`),
  com a importação das datas já marcadas: "digitar rápido" (uma data e um nome por linha) ou planilha CSV.
- O Admin (Missão 5A) cria a conta; ela nasce sem pacotes nem tipos de festa (os Primeiros passos pedem).
- A demo de cada lead (`demos/<pasta>/demo.json`) já tem: nome, WhatsApp, Instagram, endereço, cores, horário,
  tipos de festa (`consulta.tipos`), estrutura, avaliações, textos e fotos. **Não tem pacotes nem preços.**
- Exportar tudo (zip de CSVs) e o Meu site (o site da demo pode virar site ligado ao painel; `03`).

## Ideias levantadas (para discutir, não decididas)

| Dado | Onde costuma estar | Como poderia entrar |
|---|---|---|
| Nome, contato, endereço, cores, tipos de festa, estrutura, avaliações | na demo que a Renderiza fez | sem IA: a conta nasce da demo |
| Pacotes e preços | PDF ou arte do orçamento mandado no WhatsApp | IA lê o arquivo ou o print |
| Datas marcadas | agenda de papel, Google Agenda, planilha | foto → IA; Google Agenda → arquivo .ics; planilha → já existe |
| Clientes | contatos do celular, conversas do WhatsApp | contatos (.vcf) sem IA; prints de conversa → IA |
| Contrato | modelo em Word ou PDF | IA vira modelo com campos |

- **A. Conta nasce da demo** (Admin: "Criar conta a partir da demo"): zero esforço do lead, sem IA.
- **B. "Mande o que você tiver"**: arrasta fotos, PDFs, prints e planilhas; a IA propõe pacotes, datas e clientes;
  uma tela de conferência em lote (desmarca o errado, corrige, grava). **A IA nunca grava sozinha.**
- **C. "A Renderiza monta para você"**: a mesma ferramenta no Admin; o lead manda tudo no WhatsApp e a equipe monta.
- **D. No dia a dia, "colar conversa"**: no Atendimento, cola a mensagem do cliente e a IA cria o pedido preenchido.
- Para o plug and play: começar a usar no primeiro minuto e completar aos poucos ("traga quando tiver"), sem etapa
  obrigatória que trave.
- **Instagram e WhatsApp automáticos:** sem caminho oficial simples (API do Instagram pede app aprovado pela Meta;
  a oficial do WhatsApp tem custo e aprovação). As ideias acima não dependem deles.

**Cuidados:** os dados dos clientes do lead passariam por um fornecedor de IA (a política de privacidade precisa
dizer; os termos estão sendo ajustados agora, 5B); a chave da IA fica no servidor (função do Supabase, como a do
Brevo); limite de uso por conta para o custo não fugir; a IA só propõe.

**Rascunho de missões** (a sessão do levantamento confirma ou refaz): 7A conta a partir da demo · 7B leitor com IA e
tela de conferência · 7C importações sem IA (contatos, Google Agenda, planilha de clientes) · 7D onboarding refeito
("o que você tem aí?" e "a Renderiza monta") · 7E colar conversa → pedido.

## Perguntas para a Renderiza (a sessão faz, uma ou duas por vez, curtas)

1. Como o lead chega ao painel hoje: sempre pela demo da prospecção? Em que momento da venda o painel é entregue?
2. O que é o mínimo para ele já usar no primeiro dia (ex.: pacotes e datas marcadas)? O resto pode vir depois?
3. Quem monta primeiro: o lead sozinho, a Renderiza (quanto tempo da equipe por conta é aceitável?) ou os dois?
4. O que os leads costumam ter (dá para perguntar a 2 ou 3 leads reais, sem trazer dado deles para o repositório)?
5. Só eventos primeiro, ou fotografia junto?
6. Quanto pode custar a IA por conta (por mês ou só na entrada)?
7. Pode pôr o uso de IA nos termos e na política agora?
8. O "colar conversa" do dia a dia entra já ou depois do onboarding?

## Como fechar

Com as respostas: registrar as decisões no `07`, escrever a Parada 7 no `01-trilho.md` (para quê, o que entrega,
"chegou quando") e as missões com blocos e "Mexe em" no `missoes.md`, e apagar deste arquivo o que virou decisão
(ou marcar como decidido).
