# Parada 7 · Onboarding com IA, do convite até a confiança

Levantamento feito com a Renderiza em 30/10/2026. **Decidido:** D40 a D50 no [`07`](07-decisoes-e-perguntas.md); a
parada no [`01-trilho.md`](01-trilho.md); a Missão 7 (blocos e "Mexe em") no [`missoes.md`](missoes.md). Este arquivo é
a referência de **como** a experiência funciona e **o que** o onboarding extrai.

## O problema

Um lead que vira cliente precisa ver o painel com a cara do negócio dele (clientes, pacotes e preços, datas já
marcadas, contrato), e ninguém vai digitar isso um a um. Tem que ser plug and play e **encantar**: quem não tem nada
começa em minutos; quem tem muito (planilhas, outro sistema, agenda de papel) traz tudo sem sofrer.

## O caminho da pessoa

1. **Demonstração** (como hoje): a Renderiza manda a demo do lead e os exemplos (`/exemplos/eventos`,
   `/exemplos/fotografia`).
2. **Convite:** quem se interessa recebe pelo WhatsApp um link que a Renderiza gera no Admin. Ele está ligado à demo e
   ao histórico da conversa colado, e vale uma vez, por 7 dias (D41, D42).
3. **Primeiro minuto:** "Olá, Espaço Jardim! Você recebeu um convite. Crie uma senha." É um campo só, com o usuário à
   vista. O teste de 7 dias começa aqui.
4. **A conversa (onboarding):** cartões no visual de hoje (D33), com a IA escolhendo a próxima pergunta. Primeiro,
   confirmações de um toque com o que a demo já sabe; depois, perguntas com opções; no meio, "mande o que tiver",
   que pode ficar para depois (D43, D44).
5. **O painel montado:** a pessoa termina com os dados conferidos, os tipos de festa ou ensaio, os pacotes com preço,
   os horários, o Pix e o que tiver mandado de datas, clientes e contrato.
6. **O plano para começar** (no Início): o que falta, personalizado pelas respostas. Para cada item: "trazer agora",
   "mandar para a IA" ou "pedir à Renderiza" (D44, D48).
7. **Acompanhamento:** a Renderiza vê no Admin cada passo, quem travou e onde, e tem uma mensagem pronta para
   destravar. A conta fica **confiante** quando cumpre os marcos da primeira semana (D47).

## O roteiro do que extrair (o máximo, sem travar)

**Da demo (só confirmar, um toque cada):** nome do negócio; nicho (eventos ou fotografia); cidade e endereço;
WhatsApp; Instagram; cores e logo; horário de funcionamento; tipos de festa ou de ensaio; estrutura (salão, área
externa, capacidade); avaliações do Google (nota e total); se já tem site (a demo pode virar site, `03`).

**Perguntas com opções (sempre com "pular"):**

| Assunto | Exemplo de pergunta | Para que serve |
|---|---|---|
| Quem está falando | dona ou dono, sócio, gerente, outro | o tom e quem é dono no painel |
| Tamanho | só eu, 2 a 3 pessoas, 4 ou mais | sugerir convidar a equipe |
| Volume | festas ou ensaios por mês: até 4, 5 a 15, mais de 15 | o que mostrar primeiro no Início |
| Porte do evento | até 50, 50 a 150, 150 a 300, mais de 300 convidados | os pacotes sugeridos |
| Faixa de preço | ticket médio por faixa | os pacotes sugeridos e o Financeiro |
| De onde vêm os pedidos | WhatsApp, Instagram, indicação, site | o Atendimento e a agenda online |
| Como organiza hoje | caderno, planilha, Google Agenda, outro sistema, de cabeça | o jeito de trazer as datas |
| Pacotes | já tem com preço, tem num PDF ou arte, ainda não tem | ler o arquivo ou montar com a IA |
| Clientes | tem lista, tem só no celular, começa do zero | a planilha, os contatos (.vcf) ou nada |
| Datas marcadas | quantas pela frente; onde estão | importar agora ou depois |
| Contrato | tem modelo em Word ou PDF, não tem | virar modelo com campos, ou um modelo base |
| Sinal e pagamento | cobra sinal? quanto? parcela o resto? | as parcelas sugeridas e o Pix |
| Objetivo principal | não perder pedido, organizar a agenda, controlar o dinheiro, vender mais | a ordem do menu e o plano para começar |

**"Mande o que tiver"** (opcional, a IA lê e propõe, a pessoa confere): fotos ou PDF do orçamento (pacotes e
preços), foto da agenda de papel (datas), prints de conversas (clientes), planilhas (clientes, datas), o contrato em
Word ou PDF (modelo com campos). Sem IA: contatos do celular (.vcf), Google Agenda (.ics), planilha CSV.

**O que o painel entrega no fim:** a conta com o perfil confirmado; os módulos e a ordem do menu pelo objetivo; tipos
de festa ou ensaio; pacotes com preço e sinal; horários; Pix; o que veio de datas, clientes e contrato; e o plano para
começar com o que faltou.

## Os marcos da confiança (primeira semana)

Primeiro pedido anotado; primeira reserva; primeiro contrato mandado; equipe convidada (se tiver equipe); agenda
online ligada (se tiver site); uso em pelo menos 3 dias diferentes. Cumpriu: a conta está confiante. Parou: aparece
para a Renderiza no Admin, com a mensagem pronta.

## A IA (D45 a D49)

- Claude (Anthropic), chamado só por uma função do Supabase, com a chave no ambiente dela. Modelo padrão Claude
  Opus 5.5; a troca por um mais barato é decisão da Renderiza, depois de medir no STG.
- Saída em JSON validado; o roteiro e o contexto da demo ficam em cache (mais barato a cada pergunta); limite por
  conta (começa em US$ 3 na entrada) e registro de uso e custo, que o Admin mostra.
- Estimativa, a medir: a conversa do onboarding, uns US$ 0,30 por conta; ler um arquivo, uns US$ 0,05 a 0,10 por
  página ou imagem.
- A IA só propõe: nada é gravado sem o toque da pessoa. Se ela falhar ou demorar, segue o roteiro fixo.
- Privacidade: a política e os termos ganham o fornecedor antes de ligar na produção; os arquivos lidos não ficam
  guardados.

## Fora da Parada 7

- **Parada 8 · IA no dia a dia** (levantamento próprio): colar a conversa do cliente e virar pedido, sugestões nas
  telas, respostas prontas.
- **Instagram e WhatsApp automáticos:** sem caminho oficial simples (a API do Instagram pede app aprovado pela Meta;
  a oficial do WhatsApp tem custo e aprovação).
- **Cadastro aberto para quem não veio de demo:** continua como está (D30). A conversa com IA serve para ele também
  quando for aberto (sem demo, a IA pergunta o que a demo responderia).
