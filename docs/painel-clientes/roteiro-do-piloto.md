# Roteiro do piloto

O piloto (Missão 6) é a própria Renderiza usando o painel como se fosse um espaço de eventos, com mais uma pessoa
fazendo o papel da equipe. Este roteiro diz o que fazer, em que ordem, e onde anotar o que travar. Leva uns 40
minutos. Tudo na produção (`painel.renderizaweb.com.br`), **com clientes inventados**: nada de nome ou telefone de
cliente de verdade.

Os mesmos passos rodam sozinhos no STG a cada mudança: `npm run fluxos` (em `painel-clientes/test/fluxos/`).

## Antes de começar

- [ ] **O deploy andou:** abra `https://painel.renderizaweb.com.br/api/config`; o `versao` não pode ser `64c9d8d`.
- [ ] **Quem é quem:**
  - **Renderiza** entra com `contato@renderizaweb.com.br`, que já é admin. Não lembra a senha? Use "Esqueci a senha"
    na tela de entrar.
  - **Dono do espaço** é um e-mail de vocês que **não seja** o `contato@`: o convite chega nele.
  - **Equipe** é um terceiro e-mail, ou um "+" no Gmail (ex.: `seunome+equipe@gmail.com`), se for Gmail.
- [ ] Os dois celulares à mão, com o painel aberto no navegador. Dá para pôr na tela de início: no menu do
  navegador, "Adicionar à tela de início".

## 1. A Renderiza monta a conta (no computador)

1. Entre com o `contato@`. Aparecem os termos: leia por cima e aceite.
2. No menu, **Admin** → **Criar conta**: um nome inventado (ex.: "Espaço Jardim Piloto"), tipo "Espaço de eventos",
   os módulos Agenda, Atendimento, Clientes, Financeiro e Contratos, e o nome e o e-mail do dono.
3. Confira: a conta aparece em "Ativas", com o convite pendente.

## 2. O dono entra (no celular)

1. O convite chega no e-mail do dono (olhe também o spam). Toque no link, crie a senha e aceite os termos.
2. O painel abre no **Início**, com os **Primeiros passos**.
3. Arrume o básico:
   - **Mais → Serviços → Tipos de festa:** "Casamento" e "15 anos".
   - **Serviços → Pacotes:** um pacote com valor, sinal e convidados (ex.: "Pacote Jardim", R$ 12.000, sinal de
     R$ 3.000, 150 convidados).
   - **Mais → Configurações:** o WhatsApp do espaço e uma chave Pix inventada.
   - **Contratos → Modelos → Fazer o modelo:** cole um texto curto e toque nos campos para marcar onde entram
     `{cliente}`, `{data_extenso}`, `{pacote}`, `{valor}` e `{sinal}`. Se puser `{cpf}`, o CPF tem que estar na ficha
     do cliente (Clientes) antes de mandar.

## 3. As 5 tarefas (o teste do `09`)

Cada um faz as 5 no próprio celular, **sem ajuda**, com o outro cronometrando. A meta é **menos de 30 segundos por
tarefa**. Use um cliente inventado diferente para cada pessoa.

| # | Tarefa | Como o robô fez | Tempo | Travou em quê? |
|---|---|---|---|---|
| 1 | Anotar um pedido que chegou pelo WhatsApp (nome, WhatsApp, data, convidados, tipo) | Atendimento → Anotar pedido: 5 toques | | |
| 2 | Marcar uma visita para esse pedido | toque no pedido → Marcar visita: 3 toques | | |
| 3 | Fechar a reserva (com o pacote) | toque no pedido → Fechar → Pacote → Fechar e reservar: 4 toques | | |
| 4 | Registrar o pagamento do sinal | Financeiro → Registrar pagamento → o cliente → valor → Registrar: 3 toques | | |
| 5 | Mandar o contrato | Contratos → Fazer contrato → Usar os valores do pacote → Salvar e mandar → Mandar: 4 toques | | |

Os toques do robô são o caminho mais curto. Se vocês levarem muito mais, anotem por onde foram: é aí que a tela
confunde.

## 4. O resto do caminho

- [ ] **O cliente aceita:** abra o link do contrato num celular **sem entrar no painel** (ou numa aba anônima), leia,
  preencha nome e contato e aceite. Depois do aceite, aparece o Pix do espaço. No painel, o contrato vira "Aceito".
- [ ] **As parcelas:** Financeiro → a festa → **Lançar parcelas** (o resto em vezes) → na data, **Recebi**.
- [ ] **A equipe:** o dono vai em **Mais → Equipe** → Convidar, com o terceiro e-mail, "Só vê" na Agenda e no
  Atendimento e "Sem acesso" no Financeiro e em Contratos. Quem recebeu entra e confere que vê os pedidos e a agenda,
  mas não anota, não reserva e não vê valores.
- [ ] **Início:** "Para fazer agora" mostra o que pede ação (pedido sem resposta, parcela vencendo, contrato
  esperando).
- [ ] **Exportar tudo** (Início, embaixo): baixa um `.zip` que abre no Excel.
- [ ] **A Renderiza no Admin:** registra o Pix da mensalidade da conta (Pagamentos), vê os Indicadores (só números)
  e usa "Entrar para ajudar" na conta: aparece a faixa "Você está ajudando…"; depois, "Encerrar".

## 5. Onde anotar

Anotem aqui embaixo, ou mandem para a sessão: o que travou, o que demorou, o que não ficou claro, com o celular e o
navegador usados. Print ajuda, **sem dado real de ninguém**.

| Quando | Quem | Tela | O que aconteceu | Celular / navegador |
|---|---|---|---|---|
| | | | | |

## Depois

- A conta de simulação pode ficar como está (desligada pelo Admin, se quiser). Apagar uma conta da produção é
  destrutivo: só com o "pode" da Renderiza, por uma sessão.
- O que não entra neste piloto: o e-mail de "pedido novo" da agenda online (falta a chave do Brevo) e o cadastro
  aberto (falta o Turnstile). A conta do piloto nasce pelo Admin, então nenhum dos dois atrapalha.
