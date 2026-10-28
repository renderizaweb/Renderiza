# Decisões e perguntas

O que **já foi decidido** (com data e fonte), o que segue **por padrão** até alguém vetar, e as **perguntas da
rodada da vez**. As perguntas vão em rodadas curtas e gerais (pedido de 28/10/2026). Resposta nova vira linha em
"Decididas".

## Rodada 3 (aberta, enviada em 28/10/2026)

1. **Admin.** Quem da Renderiza entra no painel administrativo?
2. **Versão final do Meu site.** Qual valor? "Depois" vale.
3. **Juntar o trabalho das sessões.** Quem confere, junta na `main` e aplica as migrações no banco real: você, ou uma
   sessão "integradora"? *Recomendo:* a integradora; você acompanha pelo diário de bordo.
4. **Site do piloto.** Qual é o site, e onde está o código dele: numa pasta de `demos/` deste repositório ou no
   repositório do cliente? (Serve para a tarefa T4.6, que liga o site ao painel quando o cliente quiser.)
5. **Documentos na `main`.** Posso juntar estes documentos na `main` agora, para as outras sessões já começarem por
   eles?

## Decididas

| Data | Decisão | Quem / fonte |
|---|---|---|
| 01/10/2026 | O site do cliente fica no domínio e nas contas do cliente. | Kaue · `CONTEXTO.md` |
| 21/10/2026 | O nome é **Painel Renderiza** ("Bastidor" recusado: ninguém entende). | Kaue · `CONTEXTO.md` |
| 21/10/2026 | Preço: R$ 49/mês com 2 módulos e até 5 pessoas; R$ 14,99 por módulo a mais; sem fidelidade; montagem grátis para quem faz o site. | Kaue · `README.md` |
| 21/10/2026 | Linguagem: "montagem do painel" (nunca taxa); nada de "em breve"; explicar sempre site × painel; cada módulo diz o que **não** faz. | Kaue · `CONTEXTO.md` |
| 28/10/2026 | Fotografia: o painel guarda só o link da galeria, nunca as fotos. | Kaue · `CONTEXTO.md` |
| 28/10/2026 | O Painel Renderiza vai ao ar para clientes, com Supabase e Vercel, começando nos planos gratuitos. Planos e quando subir ficam com a Renderiza. | pedido e resposta de 28/10/2026 |
| 28/10/2026 | Módulo novo **Meu site**: o cliente edita o site pelo painel; o site sempre tem fallback para a versão inicial; a versão final é vendida à parte. É um módulo com o mesmo preço dos outros. | pedido e rodada 1 |
| 28/10/2026 | O domínio do painel é da Renderiza. O site do cliente fica no domínio e nas contas dele e consome a API do painel. | rodada 1 |
| 28/10/2026 | O nome continua **Painel Renderiza**. | rodada 1 |
| 28/10/2026 | **Piloto:** um espaço de **eventos**, no padrão do exemplo `/exemplos/painel-eventos`. Meta: começar a usar em cerca de **2 semanas** (por volta de 11/11/2026). | rodada 1 |
| 28/10/2026 | **Todos os módulos num lote só**, sem entrega parcial. A ordem de construção é técnica (o cliente no centro do banco primeiro). | rodada 1 |
| 28/10/2026 | **Cliente no centro:** todo pedido, reserva, contrato e parcela é de um cliente (`05`). | rodada 1 |
| 28/10/2026 | **Mensalidade por Pix, por fora**, registrada à mão. Cobrança automática fica para a segunda parte. | rodada 1 |
| 28/10/2026 | **Painel administrativo** da Renderiza: contas e quem acessa, pagamentos (simples), indicadores gerais (sem dado de cliente final), ligar e desligar módulos. | rodada 1 |
| 28/10/2026 | **Cadastro sozinho com 7 dias grátis**; a Renderiza aprova à mão, com ou sem prazo; não pagou, a Renderiza desliga à mão (sem regra automática de dias). Contas também podem ser criadas pela Renderiza. | rodada 1 |
| 28/10/2026 | **Trilho por paradas** (6), sem cronograma por dia. | rodada 1 |
| 28/10/2026 | **Várias sessões de IA ao mesmo tempo**, com quadro de tarefas no repositório e regras para não se baterem (`08`, `tarefas.md`). | rodada 1 |
| 28/10/2026 | Endereço do painel: **`painel.renderizaweb.com.br`** (o `renderiza.com.br` é de outra pessoa). | rodada 2 |
| 28/10/2026 | A Renderiza cria as contas de infraestrutura (Supabase, Vercel, e-mail) com o próprio acesso de administrador. Contas de clientes nascem pelo painel administrativo (ou pelo cadastro), cada uma com a sua conta (tenant) no banco. | rodada 2 |
| 28/10/2026 | O piloto já tem site feito pela Renderiza. **O site é do cliente e independente**; a ligação com o painel (agenda online, Meu site) entra quando o cliente quiser. | rodada 2 |
| 28/10/2026 | **Teste de 7 dias:** a pessoa escolhe os módulos no cadastro; o prazo é um só, contado do início da conta (módulo ligado depois não ganha prazo novo); módulo caro de oferecer (ex.: com IA) fica bloqueado no teste; depois do teste, a pessoa entra mas os dados ficam bloqueados, com o aviso para fechar a mensalidade. | rodada 2 |

## Por padrão (vale até alguém vetar)

| # | Padrão | Por quê |
|---|---|---|
| D1 | Projeto Supabase **separado** do painel interno | dado de cliente não se mistura com prospecção; um erro num lado não derruba o outro |
| D2 | Supabase na região **São Paulo** | mais rápido; dados no Brasil |
| D3 | Front em **JavaScript puro** (módulos ES, sem bundler), como o `painel/` e os exemplos | o mesmo jeito do repositório; reaproveita os exemplos |
| D4 | **Front estático, regras no banco (RLS)**; funções da Vercel só para a API pública | segurança pelo banco; hospedagem trocável |
| D5 | Sites dos clientes falam com um **endereço da Renderiza**, nunca direto com o Supabase | dá para trocar o que está atrás sem mexer nos sites |
| D6 | Meu site por **consulta ao painel** a cada visita (com cache), sem republicar o site | mantém o fallback e a regra da versão final (`03`) |
| D7 | No Meu site, **texto entra como texto** (só a marcação `*destaque*`) | ninguém quebra o site nem injeta código |
| D8 | **Valores só no Financeiro e em Contratos**; a ficha completa só no módulo Clientes | o banco esconde o que a pessoa não pode ver |
| D9 | Código em **`painel-clientes/` neste repositório**, por branch e pull request | documentos, exemplos e geradores juntos |
| D10 | Os **exemplos são a especificação** das telas | já foram aprovados e estão na página de venda |
| D11 | **Backup semanal** automático enquanto não houver backup no plano | o gratuito do Supabase não tem |
| D12 | Termos de uso e política: **a IA rascunha**, alguém que entende de LGPD revisa | antes do primeiro cliente pagante |
| D13 | Conta cancelada: dados guardados **90 dias**, com a planilha entregue na saída | prazo comum, dá tempo de voltar |
| D14 | Aceite de contrato **sem CPF** por padrão (nome, contato, data, hora, IP, aparelho) | menos dado guardado; o texto do cliente pode pedir mais |
| D15 | Aviso de pedido novo **por e-mail** e no menu do painel | WhatsApp automático tem custo e burocracia |
| D16 | `/exemplos` continua como vitrine com dados fictícios | é o link que vai para os leads |
| D17 | Sites já entregues (Blulens, Lú Elegante) só entram no Meu site se quiserem | precisam ser adaptados |
| D18 | "+5 pessoas" e "espaço a mais" ficam para depois do piloto | ainda são propostas |
| D19 | Teste vencido ou conta desligada: os dados de quem pede saem numa planilha **pelo WhatsApp**, exportada pela Renderiza no admin (com registro) | cumpre a promessa "leva os seus dados numa planilha" sem liberar o painel |
| D20 | Hoje todos os módulos ficam **liberados no teste** (nenhum usa IA ainda) | a marcação "só pago" existe para os módulos futuros |

## Para as próximas rodadas

- CNPJ da Renderiza (entra nos termos de uso e na cobrança).
- Montagem para quem não fez o site (com o cadastro sozinho, talvez nem precise).

## Rodadas respondidas

- **Rodada 1 (28/10/2026):** endereço e nome; domínio e contas; piloto e nicho; data; módulos do primeiro lote;
  mensalidade por Pix; preço do Meu site.
- **Rodada 2 (28/10/2026):** domínio; quem cria as contas; site do piloto; teste de 7 dias. Ficaram para a rodada 3:
  quem entra no admin, o valor da versão final e quem junta o trabalho das sessões.

As respostas estão em "Decididas".
