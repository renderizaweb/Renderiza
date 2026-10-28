# Decisões e perguntas

Três listas: o que **já foi decidido** (com data e fonte), o que **decidi por padrão** para o projeto andar (vale
até alguém vetar) e as **perguntas em aberto**. Resposta nova vira linha em "Decididas", com data e quem decidiu,
e a pergunta ganha "Respondida em dd/mm".

## Decididas

| Data | Decisão | Quem / fonte |
|---|---|---|
| 01/10/2026 | O site do cliente fica nas contas do cliente (domínio no Registro.br, GitHub e Vercel no CPF/CNPJ dele). A Renderiza faz o site e entrega os acessos. | Kaue · `CONTEXTO.md`, "Quando o cliente aprova" |
| 21/10/2026 | O nome é **Painel Renderiza** ("Bastidor" recusado: ninguém entende). | Kaue · `CONTEXTO.md` |
| 21/10/2026 | Preço: R$ 49/mês com 2 módulos e até 5 pessoas; R$ 14,99 por módulo a mais; sem fidelidade; montagem grátis para quem faz o site. | Kaue · `README.md`, "Exemplos de sistema" |
| 21/10/2026 | Linguagem: "montagem do painel" (nunca taxa de ativação); nada de "em breve"; explicar sempre a diferença entre site e painel; cada módulo diz o que **não** faz ("Bom saber"). | Kaue · `CONTEXTO.md` |
| 28/10/2026 | Fotografia: o painel não guarda fotos nem galeria, só o link da galeria. | Kaue · `CONTEXTO.md` |
| 28/10/2026 | O Painel Renderiza vai ao ar de verdade, para clientes, com Supabase e Vercel, começando nos planos gratuitos (sobe de plano conforme a necessidade). | pedido de 28/10/2026 |
| 28/10/2026 | Módulo novo de **atualização do site** (Meu site): o cliente edita botões, cores, textos, imagens e seções pelo painel; o site sempre tem fallback para a versão inicial; quem sai pode pagar à parte para ficar com a versão final. | pedido de 28/10/2026 |
| 28/10/2026 | O projeto anda por um trilho de paradas documentado nesta pasta, atualizado a cada avanço, para qualquer pessoa ou IA continuar. | pedido de 28/10/2026 |
| 28/10/2026 | Planos do Supabase e da Vercel (gratuito, quando subir, regras de uso): ficam com a Renderiza, que já tem o contexto. O projeto não pergunta mais sobre isso (era a P26). | resposta de 28/10/2026 |
| 28/10/2026 | Perguntas em rodadas curtas e gerais; o detalhe segue a recomendação até alguém vetar. | resposta de 28/10/2026 |

## Decidi por padrão (podem vetar)

Escolhas técnicas para não travar o trem. Cada uma tem o motivo; vetou, vira pergunta.

| # | Padrão | Por quê |
|---|---|---|
| D1 | Projeto Supabase **separado** do painel interno | dado de cliente não se mistura com prospecção; regras de acesso diferentes; um erro num lado não derruba o outro |
| D2 | Supabase na região **São Paulo** | mais rápido para os usuários; dados no Brasil |
| D3 | Front em **JavaScript puro** (módulos ES, sem bundler), como o `painel/` e os exemplos | o mesmo jeito do repositório; reaproveita os exemplos; qualquer IA ou pessoa mexe sem ferramenta nova |
| D4 | **Front estático, regras no banco (RLS)**; funções da Vercel só para a API pública | segurança garantida pelo banco; a hospedagem pode trocar sem reescrever |
| D5 | Sites dos clientes falam com um **endereço da Renderiza**, nunca direto com o Supabase | dá para trocar o que está atrás sem mexer em nenhum site |
| D6 | Meu site por **consulta ao painel** a cada visita (com cache), não republicando o site | mantém o fallback e a regra da versão final simples (`03`) |
| D7 | No Meu site, **texto entra como texto** (só a marcação `*destaque*`) | ninguém quebra o site nem injeta código |
| D8 | **Valores só no Financeiro** (fora da linha da reserva) | o banco esconde o dinheiro de quem não tem o módulo, não só a tela |
| D9 | **Entrada só por convite** (sem cadastro aberto); a conta nasce na montagem | é como a página vende ("a gente monta o painel") |
| D10 | Trabalho no painel por **branch e pull request**, com prévia, não direto na `main` | há dado de cliente; erro no painel custa mais que erro numa demo |
| D11 | Os **exemplos são a especificação** das telas (visual e comportamento) | já foram aprovados e estão na página de venda |
| D12 | **Backup semanal** automático enquanto o Supabase estiver no gratuito | o gratuito não tem backup |

## Perguntas em aberto

As perguntas vão em **rodadas curtas**. O que não está na rodada da vez segue a recomendação até alguém vetar.

### Rodada 1 (enviada em 28/10/2026)

1. O painel fica em `painel.renderizaweb.com.br`, com o nome "Painel Renderiza"? (P1, P2)
2. Quem cuida do domínio (DNS) hoje, e qual e-mail da empresa vai ser o dono das contas? (P3, P4)
3. Já tem cliente para ser o piloto? Se não tiver, começo por eventos ou por fotografia? (P6, P7)
4. Tem uma data em mente para o piloto começar a usar? (P9)
5. Primeiros módulos: Agenda, Atendimento, Clientes e Agenda online. Pode ser? (P8)
6. A mensalidade, no começo, cobrada por Pix e conferida à mão. Pode ser? (P18)
7. Meu site: já tem ideia do preço do módulo e do valor da versão final? "Decido depois" vale. (P12, P13)

### Seguindo a recomendação (vale até alguém vetar)

P10 (os propostos ficam para depois), P14 (só leitura no 10º dia de atraso, site desconectado no 30º), P15 (o que
entra no editor), P16 (sites já entregues só se quiserem), P17 (o site fica na conta do cliente), P19 (dados
guardados 90 dias depois de cancelar), P20 (eu rascunho os termos; recomendo revisão de quem entende de LGPD), P21
(contrato sem CPF por padrão), P22 (aviso de pedido por e-mail), P23 (código neste repositório), P24 (IA desenvolve,
vocês revisam), P25 (os exemplos continuam como vitrine).

### Para as próximas rodadas

P5 (CNPJ, antes das paradas 8 e 9) e P11 (montagem para quem não fez o site, antes da parada 9).

### Detalhe de cada pergunta

A versão completa, com o motivo e a parada que cada uma trava. Serve de consulta.

### A. Nome, endereço e contas

- **P1 · Nome.** Mantemos "Painel Renderiza"? *Recomendo:* sim; já está na página, no vídeo e nos posts, e o nome
  simples foi o que funcionou (o "Bastidor" ninguém entendeu). *Trava:* parada 2.
- **P2 · Endereço.** `painel.renderizaweb.com.br` (sem custo, já dá para usar) ou um domínio novo? Se novo, qual?
  *Recomendo:* o subdomínio. Domínio novo divide a marca e só vale com um nome comercial diferente. *Trava:* parada 2.
- **P3 · DNS.** Onde é gerenciado hoje o DNS do `renderizaweb.com.br` (Registro.br, Vercel, outro) e quem tem acesso?
  *Por quê:* o subdomínio e os registros do e-mail são criados lá. *Trava:* parada 2.
- **P4 · E-mail.** A Renderiza tem e-mail no próprio domínio (ex.: `contato@renderizaweb.com.br`)? Qual e-mail será o
  dono das contas (Supabase, Vercel, serviço de e-mail) e para onde vão as respostas dos e-mails do painel?
  *Recomendo:* um e-mail da empresa, não pessoal, com Kaue e Milena como donos. *Trava:* parada 2.
- **P5 · CNPJ.** A Renderiza tem CNPJ? *Por quê:* entra nos termos de uso, na cobrança e na identificação de quem
  trata os dados. *Trava:* paradas 8 e 9.

### B. A primeira viagem

- **P6 · Nicho.** O primeiro é eventos, fotografia ou os dois juntos? *Recomendo:* o banco já nasce para os dois; as
  telas, primeiro o nicho do primeiro cliente interessado. *Trava:* paradas 4 e 5.
- **P7 · Piloto.** Já existe cliente interessado no painel? Quem pode ser o cliente zero? *Recomendo:* alguém que já
  fechou ou vai fechar o site, com condição especial em troca de conversa semanal. *Trava:* parada 10.
- **P8 · Módulos.** Primeira viagem com **Agenda + Atendimento + Clientes + Agenda online** (e Equipe e acessos, que
  é base); depois Financeiro, Contratos e Meu site. Concorda? Ou seguimos o que o piloto escolher? *Recomendo:* essa
  ordem, que é a combinação que a página já sugere (Agenda online + Agenda) mais o que ela precisa para funcionar.
  *Trava:* parada 5.
- **P9 · Prazo.** Existe uma data-alvo para o painel estar no ar com o piloto? *Por quê:* define o que entra na
  primeira viagem e o que espera. *Trava:* parada 1.
- **P10 · Propostos.** "Mais 5 pessoas por R$ 9,90" e "cada espaço a mais por R$ 29" entram já ou ficam para depois?
  *Recomendo:* depois; o banco nasce preparado e a página tira o que não estiver pronto. *Trava:* parada 11.
- **P11 · Montagem sem site.** Quanto custa a montagem para quem **não** fez o site com a Renderiza? (A página só fala
  do grátis para quem fez.) *Trava:* parada 9.

### C. Meu site

- **P12 · Preço.** O Meu site é um módulo como os outros (entra nos 2 do plano ou custa R$ 14,99) ou tem valor
  próprio? *Por quê:* ele dá mais trabalho e gasta mais espaço (imagens) que os outros. *Trava:* parada 7.
- **P13 · Versão final.** Quanto custa ficar com a versão final ao sair? *Trava:* parada 7.
- **P14 · Atraso.** Com quantos dias de atraso o painel trava (só leitura) e com quantos o site é desconectado (volta
  à versão inicial)? *Recomendo:* aviso no 1º dia, só leitura no 10º, site desconectado no 30º; tudo volta assim que
  pagar. *Trava:* paradas 7 e 9.
- **P15 · Primeira versão do editor.** *Recomendo:* textos, botões (rótulo, destino e posição), imagens, galeria,
  depoimentos, contato e mostrar ou esconder seção; cores e ordem das seções logo em seguida; páginas extras
  depois. *Trava:* parada 7.
- **P16 · Sites já entregues.** A Ótica Blulens e a Lú Elegante entram no Meu site? Precisam ser adaptadas (marcar o
  que é editável e pôr o script). *Recomendo:* só se quiserem; os sites novos já saem prontos. *Trava:* parada 7.
- **P17 · Onde fica o site.** Confirmam que o site continua na conta do cliente (decisão de 01/10) e só consulta o
  painel? *Recomendo:* sim; é o que garante o fallback e a regra da versão final. *Trava:* parada 7.

### D. Cobrança, regras e privacidade

- **P18 · Cobrança.** No começo, como o cliente paga a mensalidade: Pix todo mês conferido à mão, ou uma plataforma
  de cobrança recorrente (Asaas, Mercado Pago, Stripe)? E onde se registra (painel interno ou o próprio painel)?
  *Recomendo:* à mão, registrado no painel, até uns 10 clientes; depois, uma plataforma. *Trava:* parada 9.
- **P19 · Guarda dos dados.** Cancelou: por quanto tempo guardamos os dados antes de apagar? *Recomendo:* 90 dias,
  com a planilha entregue na saída. *Trava:* parada 8.
- **P20 · Termos.** Vocês têm advogado ou um modelo de termos de uso e política de privacidade? *Recomendo:* eu
  escrevo o rascunho; alguém que entende de LGPD revisa antes do primeiro cliente pagante. *Trava:* parada 8.
- **P21 · CPF no contrato.** O aceite do contrato precisa do CPF do cliente final? *Recomendo:* não por padrão: nome,
  WhatsApp ou e-mail, data, hora, IP e aparelho; CPF só se o texto do cliente exigir. *Trava:* 5.6.
- **P22 · Aviso de pedido novo.** E-mail para o dono (mais o número no menu do painel) basta no começo?
  *Recomendo:* sim; aviso automático por WhatsApp tem custo e burocracia, fica para depois. *Trava:* parada 6.

### E. Jeito de tocar

- **P23 · Repositório.** O código fica neste repositório (pasta `painel-clientes/`) ou num repositório novo?
  *Recomendo:* neste, por enquanto (`04`). *Trava:* parada 2.
- **P24 · Quem desenvolve.** O desenvolvimento fica com IA (Claude) e revisão de vocês? Mais alguém precisa de
  acesso (GitHub, Supabase, Vercel)? *Trava:* parada 2.
- **P25 · Exemplos.** Os `/exemplos` continuam como vitrine com dados fictícios? *Recomendo:* sim; mais adiante viram
  uma conta de demonstração dentro do painel real. *Trava:* parada 11.
- **P26 · Planos.** *Decidida em 28/10/2026:* fica com a Renderiza (ver "Decididas").
