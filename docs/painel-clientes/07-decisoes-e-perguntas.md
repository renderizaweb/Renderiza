# Decisões

O que **já foi decidido** (com data e fonte) e o que segue **por padrão** até alguém vetar.

**Perguntas em aberto: nenhuma.** Não abrir pergunta sobre o que é operação da Renderiza (quem entra no admin, valores
de proposta, como subir para a `main`). Dúvida nova só quando ela travar uma missão: deixe um aviso em
[`missoes.md`](missoes.md) e pergunte à Renderiza; a resposta vira linha aqui.

## Decididas

| Data | Decisão | Quem / fonte |
|---|---|---|
| 29/10/2026 | **Meu site no painel (Missão 4C):** quem tem "edita" no Meu site (o dono ou quem ele deixar) muda, faz prévia e publica; "só vê" só olha (o `03` deixava para a Missão 4 decidir). O rascunho grava ao tocar em "Salvar no rascunho" (com "Desfazer"), não a cada tecla. As fotos são reduzidas e convertidas para WebP no aparelho e servidas pelo endereço do painel. "Usar esta" e "Voltar ao site como foi entregue" vão para o rascunho; só publicar muda o site. Desconectar fica com a Renderiza, pelo Admin (decidido em 28/10). | Missão 4C, padrão dos outros módulos (`02`) |
| 29/10/2026 | **Agenda online (Missão 4A):** é a página `/agenda/` do site do cliente, no desenho do exemplo, com a cara do site; sem o painel, vira WhatsApp com a data escrita. A pré-reserva segura a data por 48 horas (o que o exemplo promete); depois, sem confirmação, a data volta a aparecer livre no site e a reserva fica no painel para a equipe decidir. Limites: 5 pedidos por hora do mesmo endereço, 3 por dia do mesmo WhatsApp, 20 por hora na conta. O aviso ao dono sai por e-mail pela função do Supabase `avisar-pedido`, uma vez só por pedido (a chave do Brevo fica nela, como no convite, D28). | Missão 4A, padrão do exemplo e do `02` |
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
| D33 | **Onboarding como trilho:** boas-vindas com o roteiro, escolha única que segue sozinha (com "Voltar"), a cor do nicho na tela (verde dos eventos, vinho da fotografia, dos exemplos) e "Montando o seu painel" com um check por parte. Pergunta nova: **"Você já tem site?"**, guardada em `contas.ajustes.onboarding.site` | pedido da Renderiza (29/10/2026): a primeira impressão faz diferença; saber quem já tem site interessa à Renderiza e ao painel (agenda online, Meu site) (Missão 2B) |
| D34 | **Backup pela API de gerenciamento do Supabase**, não pelo `pg_dump`: só leitura, num arquivo próprio (`.rzbk`: JSON comprimido e cifrado com AES-256-GCM, chave pela scrypt da `BACKUP_SENHA`), com os logins e as imagens dos buckets públicos; guardado como **artefato do GitHub Actions por 90 dias** e restaurado num Postgres vazio na mesma execução, toda semana | a senha do banco não precisa ficar em lugar nenhum (o token da API já existe para as migrações); fora do Supabase e fora do repositório, sem custo; 90 dias acompanham o D13. O repositório é público: qualquer pessoa logada no GitHub baixa o artefato, então a `BACKUP_SENHA` é longa e aleatória e fica guardada também fora do GitHub (30/10/2026, Missão 5B) |
| D35 | **Termos com versão por data** (`VERSAO_DOS_TERMOS`, a mesma do `data-versao` das páginas): o aceite é **por pessoa** (vale para todas as contas dela), pedido depois de entrar e antes do painel e do Admin; versão nova, aceita de novo ("Os termos mudaram"). Correção de escrita não muda a versão. Se a conferência falhar (internet), o painel abre e pede na próxima vez | `06`: "no primeiro acesso, aceita a versão vigente; mudou a versão, aceita de novo"; uma falha de rede não tranca ninguém fora do trabalho (30/10/2026, Missão 5B) |
| D36 | **O visitante (`anon`) só executa as funções `publico_*`**: todas as outras de `public` (de regra, auxiliares e de gatilho) ficam fechadas a ele, e o teste `090` falha com função nova aberta | revisão de segurança: as auxiliares estavam abertas pela API sem necessidade (30/10/2026, Missão 5B) |
| D37 | **Termos: o site e o Meu site são coisas diferentes.** O site é contratado à parte e é do cliente; o Meu site é um serviço da mensalidade. Saiu, desligou o módulo ou não pagou: o site volta sozinho à versão inicial, e as mudanças do Meu site não fazem parte do site entregue. Levar as mudanças para os arquivos do site (a versão final) é serviço cobrado à parte, **no máximo 3 mensalidades** do plano do cliente, entregue em até 10 dias úteis, com a última versão publicada como está, pedido enquanto a conta existe ou até 90 dias depois; a tela do Meu site avisa a regra a quem publica | pedido da Renderiza (30/10/2026), confirmando as regras 4 e 5 do `03`; termos, cláusula 9 |
| D38 | **Registros de acesso do Marco Civil:** data, hora e IP de cada entrada no painel, numa tabela fechada (`registros_de_acesso`), por 6 meses | Lei 12.965/2014, art. 15: o painel é provedor de aplicações com fins econômicos (30/10/2026) |
| D39 | **Termos e política escritos para contrato entre empresas, sem cláusula que o CDC ou o contrato de adesão anulariam:** limite de responsabilidade (12 meses de mensalidade, sem danos indiretos, ressalvados dolo e culpa grave), saída sem multa, aviso antes de mudar preço e termos, foro do domicílio da Renderiza; sem dados de empresa enquanto não houver CNPJ (escolha da Renderiza); bases legais sem depender de consentimento ("li a política", não "aceito a política") | Código Civil, arts. 421-A, 423 e 424; CPC, art. 63; LGPD, art. 7º; referências em [`termos-referencias.md`](termos-referencias.md) (30/10/2026) |
| D40 | **Parada 7 = onboarding com IA, do convite até a confiança.** Não é só a conversa de perguntas: vai até a pessoa estar usando sozinha, com gente entrando. A IA no dia a dia (colar conversa, sugestões) fica para a **Parada 8**, com levantamento próprio | pedido da Renderiza (30/10/2026): "plug and play" e "encantar o cliente com a experiência" |
| D41 | **A entrada é pela demo.** A demonstração continua como hoje (a demo e os `/exemplos`). Quem se interessa recebe da Renderiza um convite gerado no Admin, ligado à **demo do lead** (a pasta em `demos/`) e ao **histórico da conversa colado** à mão. O painel **não lê o banco do Painel de prospecção**. O teste de 7 dias começa quando a pessoa entra, não quando o link sai | a demo já tem nome, nicho, WhatsApp, Instagram, endereço, cores, horários, tipos e avaliações; os dois sistemas ficam separados (regra das sessões) |
| D42 | **Acesso sem e-mail, só senha.** O link do convite vai pelo WhatsApp, vale uma vez, por 7 dias. A Renderiza cria o **usuário** (ex.: `espacojardim`) e a pessoa só **cria a senha** ("Olá, Espaço Jardim! Crie uma senha"). Depois, entra com o usuário ou o e-mail, e fica conectada até sair. O e-mail é opcional e entra depois, para recuperar a senha sozinha; sem ele, a Renderiza gera um link novo no Admin. Por baixo, o usuário vira um endereço interno da Renderiza que não recebe e-mail. O dono convida a equipe do mesmo jeito | a maioria dos leads não passa e-mail; e-mail e senha no primeiro minuto derrubam a conversão. Sem SMS nem fornecedor novo |
| D43 | **Onboarding conversacional no visual de hoje** (D33): um cartão por pergunta, toque e segue, com a animação. Por trás, a IA escolhe a próxima pergunta e as opções **dentro de um roteiro** (o que o painel precisa saber, `11`), sempre com opções e "pular". Cumprimenta pelo **nome do espaço**, nunca inventa nome nem dado, e **nada é gravado sem o toque da pessoa**. Se a IA falhar ou demorar, o roteiro fixo segue sozinho | encanta sem perder o rumo; erro da IA nunca vira dado errado; plug and play não trava |
| D44 | **Extrair o máximo sem travar:** o que a demo já sabe vira confirmação de um toque; o perfil do negócio vem de perguntas com opções; "mande o que tiver" (fotos, PDFs, prints, planilhas) entra na conversa, mas pode ficar para depois. O que não veio vira o **plano para começar** no Início, com "trazer agora", "mandar para a IA" ou "pedir à Renderiza" | a lista do que extrair está no `11`; quem tem pouco começa logo, quem tem muito traz tudo |
| D45 | **IA: Claude (Anthropic), chamada só do servidor** (função do Supabase, chave no ambiente dela, como a do Brevo). Modelo padrão **Claude Opus 5.5** (US$ 4 e US$ 20 por milhão de tokens de entrada e saída); trocar por um mais barato é decisão da Renderiza depois de medir. Saída em JSON validado (saída estruturada), cache de prompt, limite de uso por conta, registro de uso e custo. Lê fotos e PDFs | estimativa (a medir no STG): a conversa do onboarding, uns US$ 0,30 por conta; ler um arquivo, uns US$ 0,05 a 0,10 por página ou imagem |
| D46 | **Na entrada, a IA é por conta da Renderiza, com teto por conta** (começar com US$ 3; o Admin mostra o gasto). A IA do dia a dia (Parada 8) pode virar módulo "só pago" (D20) | o onboarding é ferramenta de venda; o teto impede o custo de fugir |
| D47 | **Acompanhamento até a confiança:** cada passo do onboarding fica registrado (link aberto, senha criada, cada pergunta, arquivos, o primeiro uso) e vira um **funil no Admin**, com quem travou e onde, e uma mensagem pronta de WhatsApp para destravar. Os **marcos da primeira semana** dizem quando a conta está confiante: primeiro pedido, primeira reserva, contrato mandado, equipe convidada e, se tiver site, agenda online ligada | é o que a Renderiza quer ver como negócio (30/10/2026); "confiante" fica medido, não no achismo |
| D48 | **"Pedir à Renderiza":** a pessoa manda os arquivos pelo painel e a Renderiza monta usando **a mesma ferramenta**, pelo Admin, dentro do suporte com registro (D24) | quem não quer mexer também é atendido, sem caminho paralelo |
| D49 | **Privacidade da IA:** antes de ligar a IA na produção, a política e os termos ganham o fornecedor (Anthropic, Estados Unidos, transferência internacional). Os arquivos mandados para a IA não ficam guardados no painel: só o que a pessoa confirma vira dado | `06`; LGPD, art. 33 |
| D50 | **O painel com a cara dos exemplos validados** (`/exemplos/eventos` e `/exemplos/fotografia`, no celular e no computador) entra na Parada 7, como o primeiro bloco: é a primeira impressão de quem chega pelo convite | a Renderiza validou a experiência dos exemplos, e o painel real ainda não está igual (30/10/2026) |

## Ideias guardadas (para o futuro, sem data)

Não são decisões nem trabalho de nenhuma missão: só para não se perderem. Quem for fazer decide antes, aqui.

| Data | Ideia | O que pesar antes |
|---|---|---|
| 29/10/2026 | **O painel cria e publica o site:** a pessoa entra, cria o acesso, paga, monta o site e publica com domínio próprio, tudo pelo painel. | GitHub e Vercel têm API, então dá para automatizar boa parte; o registro do domínio é a parte mais difícil. Hoje o site fica nas contas do cliente (01/10/2026): isso pede que ele autorize o painel nas contas dele, ou que o site passe a ficar com a Renderiza. |
| 29/10/2026 | **Domínio padrão da Renderiza** para quem não quer pagar domínio: um domínio curto da Renderiza, e o site do cliente num endereço com o nome da loja na frente (ex.: `mansaojesilva.<domínio curto>`), criado por um botão no painel, sem nada do cliente na parte de domínio. | O nome do domínio, a escolher: curto e que faça sentido (algo como "ev" para eventos). O site ficaria hospedado com a Renderiza, diferente da regra de hoje (o site nas contas do cliente), o que mexe na versão final e no "site é do cliente" (`03`). |

## Rodadas de perguntas respondidas

- **Rodada 1 (28/10/2026):** endereço e nome; piloto e nicho; data; módulos do primeiro lote; mensalidade por Pix;
  preço do Meu site.
- **Rodada 2 (28/10/2026):** domínio; quem cria as contas; o site do cliente; teste de 7 dias.
- **Rodada 3 (28/10/2026):** administradores, valor da versão final e quem junta o trabalho são operação da
  Renderiza; o piloto ainda não tem site; documentos liberados para a `main`.

- **Rodada 4 (30/10/2026), levantamento da Parada 7:** de onde vem o lead (a demo), como entra (link no WhatsApp, só
  senha), o onboarding (conversa com IA no visual de hoje, o máximo sem travar), quem paga a IA na entrada, o
  acompanhamento até a confiança, a cara dos exemplos. Decisões D40 a D50; o roteiro no `11`.

As respostas estão em "Decididas".
