# 13 · A assinatura do painel (o lado do cliente)

26/11/2026, pedido da Renderiza: "um lugar de cobrança para explicar o tipo da assinatura, quando renova, o dia da
cobrança, o histórico de pagamento". A cobrança continua como em [02](02-produto.md): **Pix, por fora, registrado à
mão no Admin**. Nada aqui cobra, gera Pix ou manda aviso sozinho; a tela mostra o combinado e o que a Renderiza
registrou.

## O que o dono vê (menu · Assinatura)

Só o **dono** (a equipe nem vê o item; a Renderiza no suporte vê). Em `src/modulos/assinatura/`.

1. **Como está hoje, numa frase**, com a cor do estado e o botão certo (WhatsApp da Renderiza com a mensagem pronta):
   - a combinar: "R$ 49 por mês · o dia do vencimento ainda vai ser combinado" → "Combinar o dia";
   - antes da primeira: "A primeira mensalidade vence em 26 de dezembro" (a 5 dias ou menos, "vence em 3 dias" e
     "Pedir o Pix");
   - em dia: "Tudo em dia · a próxima vence em…"; vence logo (até 5 dias) e vence hoje: "Pedir o Pix";
   - em aberto: "A mensalidade de novembro está em aberto · venceu em 17/11 (há 9 dias)" → "Falar sobre o pagamento";
   - conta em teste, desligada ou cancelada: a frase da situação (os termos, cláusulas 5, 7 e 8).
2. **O seu plano:** valor, "todo dia 26", Pix, módulos (o Meu site como incluído), até 5 pessoas, sem fidelidade
   (renova todo mês) e o prazo combinado, quando há.
3. **Pagamentos (o extrato):** cada mês do combinado até a próxima mensalidade, do mais novo ao mais antigo: "Pago ·
   pago em 26/12", "Em aberto", "Vence hoje", "A vencer". Pagamento registrado fora do combinado também aparece.
4. **Como funciona:** as cláusulas 6 a 8 dos termos em cinco linhas (mensal sem fidelidade, Pix, atraso: aviso e 10
   dias, mudar o plano, cancelar) e o link para os termos.

Configurações · "O plano" ganhou o botão "Ver a assinatura e os pagamentos".

## O que a Renderiza faz (Admin · a conta · Pagamentos)

- **Combinar o dia** (`src/admin/pagamentos/combinado.js`): a data da primeira mensalidade (obrigatória), o dia do
  vencimento (1 a 28; vazio: o da primeira) e o valor (vazio: o do plano, R$ 49 com 2 módulos e cada um a mais pelo
  preço dele). A ficha mostra o combinado numa linha. Fazer ao fechar o plano: no termo do site, o painel costuma
  começar "30 dias depois da entrega".
- **Registrar Pix** (como antes): o "mês da mensalidade" é o mês do vencimento. Registrou, o dono vê como pago.

## As regras (testadas em `test/assinatura.test.mjs`)

- O valor: `assinaturas.valor` ou `mensalidadeSugerida` (o do plano, `src/admin/logica.js`).
- O vencimento de cada mês: a primeira em `inicio`; depois, no `dia` (ou no dia da primeira), e no último dia do mês
  quando ele é mais curto (a primeira em 31/01 vence em 28/02).
- Um mês está pago quando há pagamento registrado para ele (`pagamentos.mes`). Em aberto = venceu sem pagamento; a
  frase conta o mais antigo e quantos são.

## O banco (migração `20261126150000_assinatura`)

- `assinaturas` (uma linha por conta: `valor`, `dia`, `inicio`): só a Renderiza lê e grava (RLS).
- `minha_assinatura(p_conta)`: o combinado e os pagamentos (mês, valor, quando entrou), **sem a observação** do
  pagamento, que é interna. Para o dono, o suporte e a Renderiza, **também com a conta desligada** (é quando mais
  precisa saber o que falta; por isso não passa por `pode()`, que exige a conta ativa). Teste `094_assinatura.sql`.

## Fica para depois

Cobrança automática (Pix com QR, boleto, cartão), aviso de vencimento por WhatsApp ou e-mail, recibo em PDF e o
lembrete no Início perto do vencimento.
