# Decisões

O que **já foi decidido** (com data e fonte) e o que segue **por padrão** até alguém vetar.

**Perguntas em aberto: nenhuma.** Não abrir pergunta sobre o que é operação da Renderiza (quem entra no admin, valores
de proposta, como subir para a `main`). Dúvida nova só quando ela travar uma missão: deixe um aviso em
[`missoes.md`](missoes.md) e pergunte à Renderiza; a resposta vira linha aqui.

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
| 28/10/2026 | **Admin** da Renderiza: contas e quem acessa, pagamentos (simples), indicadores gerais (sem dado de cliente final), ligar e desligar módulos. | rodada 1 |
| 28/10/2026 | **Cadastro sozinho com 7 dias grátis**; a Renderiza aprova à mão, com ou sem prazo; não pagou, a Renderiza desliga à mão (sem regra automática de dias). Contas também podem ser criadas pela Renderiza. | rodada 1 |
| 28/10/2026 | **Trilho por paradas** (6), sem cronograma por dia. | rodada 1 |
| 28/10/2026 | **Várias sessões de IA ao mesmo tempo**, com as missões no repositório e regras para não se baterem (`08`, `missoes.md`). | rodada 1 |
| 28/10/2026 | Endereço do painel: **`painel.renderizaweb.com.br`** (o `renderiza.com.br` é de outra pessoa). | rodada 2 |
| 28/10/2026 | A Renderiza cria as contas de infraestrutura (Supabase, Vercel, e-mail) com o próprio acesso de administrador. Contas de clientes nascem pelo Admin (ou pelo cadastro), cada uma com a sua conta (tenant) no banco. | rodada 2 |
| 28/10/2026 | **O site do cliente é dele e independente.** A demo é a versão inicial que a Renderiza faz para a prospecção (`demos/`); o site fechado vai para um Git e uma Vercel novos, com os acessos do cliente, separado da Renderiza. A ligação com o painel (agenda online, Meu site) entra quando o cliente quiser. | rodadas 2 e 3 |
| 28/10/2026 | **O piloto ainda não tem site** (vai ser feito). O painel não depende disso: a ponte com o site é testada num site de teste gerado de uma demo. | rodada 3 |
| 28/10/2026 | **Administradores:** quantos a Renderiza quiser, cadastrados por ela (tabela `equipe_renderiza`). Não é assunto do projeto. | rodada 3 |
| 28/10/2026 | **Valor da versão final do Meu site:** combinado na proposta de cada cliente, fora do painel. O painel só precisa gerar a versão final. | rodada 3 |
| 28/10/2026 | **Missões, não tarefas:** 6 missões, uma por parada (`missoes.md`); as missões 3, 4 e 5 podem ser divididas em blocos para rodar em mais de uma sessão. | pedido de 28/10/2026 |
| 28/10/2026 | **Acesso das sessões:** mesmo repositório; o Supabase novo entra pelas variáveis `PAINEL_*` do ambiente do Claude (o conector do Supabase fica numa conta só). | pedido de 28/10/2026 |
| 29/10/2026 | **Os exemplos continuam como estão:** `/exemplos` (eventos e fotografia) e as demos seguem com dados fictícios e não levam ao painel real; nenhum link de demo ou exemplo aponta para o Painel Renderiza. | pedido de 29/10/2026 |
| 29/10/2026 | **Design system desde o login:** a cara da Renderiza (grafite, papel, terracota como única cor de destaque, fonte Geist), moderno e simples, no celular e no computador (`10`). | pedido de 29/10/2026 |
| 29/10/2026 | **Cadastro fechado até a verificação contra robô:** o cadastro pela API (`disable_signup`) fica fechado nos dois projetos até existir a tela de cadastro com verificação contra robô (`06`). Até lá, as contas entram pelo convite ou pela Renderiza. | a Renderiza autorizou em 29/10/2026 |
| 29/10/2026 | **E-mail:** Zoho Mail recebe (`contato@`), Brevo envia (SMTP do Supabase, remetente `nao-responda@`), os dois no plano grátis. | 29/10/2026 |
| 29/10/2026 | **Domínio:** `painel.renderizaweb.com.br` no ar no mesmo dia (subdomínio grátis do `renderizaweb.com.br`, com CNAME no Registro.br); `renderiza-painel-clientes.vercel.app` continua respondendo. | 29/10/2026 |
| 28/10/2026 | **Nomes:** o painel que a Renderiza usa para prospectar é o **Painel de prospecção**; o produto para clientes é o **Painel Renderiza**; a área da Renderiza dentro dele é o **Admin**. | pedido de 28/10/2026 |
| 28/10/2026 | **Supabase:** o projeto de hoje (`gxdwluswpczlfgvzxqvg`) continua só do Painel de prospecção. O Painel Renderiza ganha uma **conta nova** (e-mail próprio) com dois projetos: `painel-renderiza-prod` e `painel-renderiza-stg`. Migração sempre no STG antes da produção. | pedido de 28/10/2026 |
| 28/10/2026 | **Sessões e banco:** uma pessoa (da Renderiza) toca o projeto com várias sessões do Claude, em tarefas paralelas ou continuando a mesma tarefa em outra sessão. Cada sessão tem acesso direto ao Supabase e aplica as próprias migrações, com cuidado (`08`). Juntar e subir para a `main` é com a Renderiza. | rodada 3 |
| 28/10/2026 | **Teste de 7 dias:** a pessoa escolhe os módulos no cadastro; o prazo é um só, contado do início da conta (módulo ligado depois não ganha prazo novo); módulo caro de oferecer (ex.: com IA) fica bloqueado no teste; depois do teste, a pessoa entra mas os dados ficam bloqueados, com o aviso para fechar a mensalidade. | rodada 2 |

## Por padrão (vale até alguém vetar)

| # | Padrão | Por quê |
|---|---|---|
| D1 | Supabase **separado** do Painel de prospecção (conta nova, com produção e STG) | dado de cliente não se mistura com prospecção; um erro num lado não derruba o outro |
| D2 | Supabase na região **São Paulo** | mais rápido; dados no Brasil |
| D3 | Front em **JavaScript puro** (módulos ES, sem bundler), como o `painel/` e os exemplos | o mesmo jeito do repositório; reaproveita os exemplos |
| D4 | **Front estático, regras no banco (RLS)**; funções da Vercel só para a API pública | segurança pelo banco; hospedagem trocável |
| D5 | Sites dos clientes falam com um **endereço da Renderiza**, nunca direto com o Supabase | dá para trocar o que está atrás sem mexer nos sites |
| D6 | Meu site por **consulta ao painel** a cada visita (com cache), sem republicar o site | mantém o fallback e a regra da versão final (`03`) |
| D7 | No Meu site, **texto entra como texto** (só a marcação `*destaque*`) | ninguém quebra o site nem injeta código |
| D8 | **Valores só no Financeiro e em Contratos**; a ficha completa só no módulo Clientes | o banco esconde o que a pessoa não pode ver |
| D9 | Código em **`painel-clientes/` neste repositório**, cada missão na sua branch; a Renderiza junta e sobe | documentos, exemplos e geradores juntos |
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
| D21 | **Tipos de festa em tabela própria** (`tipos_reserva`), separados dos pacotes (`servicos`); o **checklist é da festa** (`reservas_checklist`), não da ficha do cliente | o exemplo de eventos tem as duas coisas (cor por tipo de festa e pacote) e o checklist fica na festa (29/10/2026, Missão 2A) |
| D22 | **Equipe e Configurações só o dono**; Início e Serviços todos veem; editar Serviços pede acesso; quem edita qualquer módulo cria cliente (o "Para quem?") | `05`: "o dono tem tudo, incluindo Equipe e acessos, Configurações" (29/10/2026, Missão 2A) |
| D23 | **O teste de 7 dias é um por pessoa:** quem já é dono de uma conta criada pelo cadastro não cria outra pelo cadastro | `02`: "o teste é um só" (29/10/2026, Missão 2A) |
| D24 | **Suporte da Renderiza** com nível ("ver" ou "editar") e no máximo 8 horas por entrada, só encurtável; o dono vê o registro | `06`: entrar na conta sempre registrado e visível para o dono (29/10/2026, Missão 2A) |
| D25 | **Histórico gravado pelo banco** (gatilhos), com o nome das colunas e as mudanças de etapa e situação, **nunca valores**; cada um vê o histórico do que pode ver | nenhuma tela esquece de registrar; ninguém grava histórico falso; o valor não vaza pelo histórico (29/10/2026, Missão 2A) |
| D26 | **Origem e etapa:** origem ganha `outro` (telefone, passou na porta); etapa ganha `em_conversa` (está no exemplo de eventos) | o exemplo é a especificação (D10) (29/10/2026, Missão 2A) |
| D27 | **Limite de pessoas no banco** (`contas.limite_pessoas`, 5): a Renderiza muda quando vender mais pessoas (D18) | `02`: até 5 pessoas no plano (29/10/2026, Missão 2A) |
| D28 | **O e-mail do convite sai de uma função do Supabase** (Edge Function `convidar`), não da Vercel: o dono grava o convite (a RLS decide quem pode) e a função, lendo o convite com o login de quem chamou, manda o convite do Auth ou, para quem já tem login, o link de acesso. A chave secreta fica só no ambiente da função (o Supabase põe lá); publicar com `supabase/functions/publicar.mjs`, STG primeiro | ninguém copia a chave secreta para a Vercel; a função fica ao lado do Auth que manda o e-mail (29/10/2026, Missão 2B) |
| D29 | **Onboarding: a conta nasce no fim.** As respostas ficam no aparelho a cada passo e `cadastrar_conta` só roda no passo 5 (ou no "Pular"), então "voltar" sempre funciona. No passo 4, Agenda e Atendimento já vêm marcados (os dois primeiros do `09`); quem pula começa com eles. Nicho "Outro" não cria conta: leva ao WhatsApp da Renderiza | a conta só pode nascer uma vez pelo cadastro (D23) (29/10/2026, Missão 2B) |
| D30 | **O cadastro abre com o Cloudflare Turnstile:** a chave pública vai na Vercel (`TURNSTILE_SITE_KEY`), a secreta no Auth do Supabase; sem a chave pública, `/cadastro` leva ao WhatsApp da Renderiza. O e-mail de confirmação leva ao onboarding (`/comecar`) | `06`: cadastro aberto só com verificação contra robô; o Turnstile é grátis e o Supabase já aceita (29/10/2026, Missão 2B) |
| D31 | **Primeiros passos só para o dono**, escondidos em `contas.ajustes.primeiros_passos_escondidos`. Na importação das datas: data sem ano é a próxima; sem hora, o horário do nicho (festa às 19h, ensaio às 9h); o mesmo WhatsApp é o mesmo cliente; data que já passou entra como realizada; até 500 por vez. O item "copiar o link da agenda online" espera a Missão 4 | o `09` e o "teste das 5 tarefas" (29/10/2026, Missão 2B) |
| D32 | **"Fechar o plano" só para o dono**; a equipe vê só o prazo do teste | quem fecha o plano é o dono (29/10/2026, Missão 2B) |

## Rodadas de perguntas respondidas

- **Rodada 1 (28/10/2026):** endereço e nome; piloto e nicho; data; módulos do primeiro lote; mensalidade por Pix;
  preço do Meu site.
- **Rodada 2 (28/10/2026):** domínio; quem cria as contas; o site do cliente; teste de 7 dias.
- **Rodada 3 (28/10/2026):** administradores, valor da versão final e quem junta o trabalho são operação da
  Renderiza; o piloto ainda não tem site; documentos liberados para a `main`.

As respostas estão em "Decididas".
