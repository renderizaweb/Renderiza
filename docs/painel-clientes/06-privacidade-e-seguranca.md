# Privacidade e segurança

O painel guarda dados do negócio do cliente e dos clientes dele. Este documento diz o que entra, quem responde por
quê e o que nunca fazer. Não é parecer jurídico: os termos e a política precisam de revisão de quem entende de LGPD
antes do primeiro cliente pagante (padrão: eu rascunho, alguém revisa).

## Quem é quem (LGPD)

- **O cliente da Renderiza** (o espaço, o estúdio) é o **controlador** dos dados dos clientes finais: é ele quem
  decide o que anotar sobre quem faz a festa ou o ensaio.
- **A Renderiza** é a **operadora** desses dados: guarda e processa em nome do cliente, só para o painel funcionar.
- **A Renderiza** é **controladora** dos dados dos próprios clientes (cadastro, pessoas da equipe, cobrança).
- Pedido de um cliente final ("quero ver ou apagar meus dados") vai para o cliente controlador; a Renderiza ajuda
  com a exportação ou o apagamento.

## Que dados entram

| De quem | O quê | Cuidado |
|---|---|---|
| Pessoas da equipe | nome, e-mail, papel, o que fizeram no painel, quando entraram e de que aparelho | login pelo Supabase Auth; senha nunca passa pela Renderiza; as entradas aparecem no Admin |
| Clientes finais | nome, WhatsApp, e-mail, Instagram, data e tipo da festa ou ensaio, convidados, valores, o que foi combinado | só o necessário; CPF e endereço só se o contrato do cliente exigir |
| Aceite de contrato | nome de quem aceitou, data, hora, IP, aparelho, a versão do texto | é a prova do aceite; fica guardado com o contrato |
| Pedidos da agenda online | nome, contato, data desejada, tipo, convidados | aviso curto no formulário dizendo para quem vão os dados |
| Meu site | textos, fotos e depoimentos que o cliente publica | o cliente garante nos termos que tem autorização de quem aparece |
| Crianças (fotografia: newborn, smash, infantil) | no máximo o primeiro nome, quando ajudar no atendimento | a LGPD (art. 14) pede cuidado especial com dados de criança; nada de foto de cliente final no painel (a galeria fica fora) |

Nunca entram: número de cartão, senha de terceiros, conversas do WhatsApp copiadas inteiras, fotos de ensaio.

## Documentos que precisam existir (parada 5, Missão 5)

- **Termos de uso do Painel Renderiza:** o que é o serviço, preço e mensalidade, sem fidelidade, atraso (aviso, só
  leitura, desconexão), cancelamento, exportação dos dados, prazo de guarda e apagamento, o papel da Renderiza como
  operadora, as obrigações do cliente (autorização para fotos e depoimentos, texto do contrato é dele), Meu site
  (versão inicial, desconexão e versão final), suporte e limites de responsabilidade.
- **Política de privacidade:** do painel (pessoas da equipe) e da parte pública (agenda online, aceite de contrato,
  sites conectados): que dados, para quê, por quanto tempo, com quem (Supabase, Vercel, serviço de e-mail), direitos
  e contato.
- **Aviso na agenda online:** uma linha, ex.: "Seus dados vão para o <espaço>, que usa o Painel Renderiza para
  organizar os pedidos."
- **Aceite registrado:** no primeiro acesso, a pessoa aceita a versão vigente dos termos; mudou a versão, aceita de
  novo.

**Feito na Missão 5B (30/10/2026):** os termos em `/termos` e a política em `/privacidade` (`publico/termos/` e
`publico/privacidade/`), **rascunhos com a etiqueta "Rascunho em revisão"**: o que a revisão precisa decidir está
marcado em amarelo (razão social, CNPJ e endereço, foro, encarregado de dados, limite de responsabilidade, aviso de
mudança de preço, quanto tempo a cópia de segurança dura depois do apagamento, cláusulas dos fornecedores de fora do
Brasil). O aceite: depois de entrar, antes do painel e do Admin, a tela "Antes de começar" (ou "Os termos mudaram")
com os dois links e "Li e aceito"; grava em `termos_aceites` a versão e o aparelho (D35). A página do contrato
(`/c/<código>`) diz o que fica guardado e aponta a política. **Falta:** o aviso na agenda online (o formulário fica
em `ferramentas/demo/agenda-online/`, fora da Missão 5; ver "Avisos" em `missoes.md`).

## Segurança: o que garante

- **RLS em toda tabela**, com teste de isolamento obrigatório para cada tabela nova (`05`).
- **Chave secreta do Supabase** só em variável de ambiente de função do servidor, se for mesmo necessária. Nunca no
  front, no repositório ou no chat.
- **Funções públicas mínimas**, com checagem de tamanho e formato e limite de uso.
- **Senha** gerida pelo Supabase Auth (mínimo 8 caracteres); sessão que expira; "sair de todos os aparelhos".
- **Cabeçalhos:** fora do Google, sem abrir dentro de outro site, CSP.
- **Uploads:** só imagem, tamanho máximo, conversão para WebP (o arquivo original não é guardado).
- **Admin:** a equipe Renderiza vê contas, pessoas, entradas, pagamentos e números gerais, mas
  **não** os dados dos clientes finais (nomes, contatos, valores das festas). Os indicadores são só contagens.
- **Suporte da Renderiza:** entrar numa conta de cliente só com registro (quem, quando, por quê), visível para o dono.
- **Cadastro aberto:** confirmação de e-mail, verificação contra robô e limite de cadastros por endereço.
- **Contas da Renderiza** (Supabase, Vercel, domínio, e-mail, GitHub) com verificação em duas etapas e pelo menos
  duas pessoas com acesso de dono.

### Revisão de segurança (Missão 5B, 30/10/2026; STG e produção iguais)

| O quê | Como está | O que foi feito |
|---|---|---|
| RLS | ligada em todas as tabelas de `public`; `pedidos_avisos` e `publico_tentativas` sem política nenhuma (fechadas de propósito: só as funções mexem) | nada; o teste `090` já pegava tabela nova sem RLS |
| Visitante (`anon`) nas tabelas | nenhum acesso direto a tabela ou visão; visões só com `security_invoker` | nada |
| Funções que o visitante executa | só as públicas (`publico_*`) eram para ser; as auxiliares e as de gatilho ainda estavam abertas pela API (`/rest/v1/rpc/...`), sem dar dado nenhum | **fechadas** (migração `20261030150000`); o `090` agora falha com função nova aberta ao visitante |
| Funções `security definer` | todas com `search_path` fixo | nada |
| Chaves | só a chave pública vai para o navegador (`/api/config`, sem cache); nenhuma chave ou senha no repositório (conferido com `git grep`); a chave secreta só nas funções do Supabase | nada |
| Login (Auth) | cadastro fechado, senha de no mínimo 8, confirmação de e-mail, troca do token de sessão ligada; verificação contra robô desligada (o cadastro está fechado) | ligar o Turnstile ao abrir o cadastro (D30) |
| Cabeçalhos (produção) | CSP, HSTS de 2 anos, `nosniff`, sem abrir dentro de outro site (`DENY`), `Referrer-Policy`, `X-Robots-Tag: noindex` | nada |
| Uploads (Storage) | `logos` 1 MB (PNG, JPEG, WebP), `site-imagens` 2 MB (só WebP), `privado` 10 MB (só PDF, sem política: fechado); enviar, trocar e tirar só para quem entrou e pode | nada |
| Biblioteca de fora | a do Supabase vem do jsDelivr com a versão fixa (`@2.117.1`), sem conferência de integridade (SRI) | fica para depois: pôr o `integrity` ou servir a biblioteca do próprio painel |
| Páginas públicas | agenda online: formato conferido no banco, 5 pedidos por hora por endereço (`429`) e só do domínio do site (`403`). Contrato: o código do link é longo e aleatório (não dá para adivinhar), o formato é conferido no banco e o aceite vale uma vez só; não tem limite de tentativas (a página chama o banco direto) | o limite no contrato fica para depois, se aparecer abuso |

## Backup

- O plano gratuito do Supabase **não faz backup**. Até subir para o Pro (que guarda 7 dias de backup diário):
  cópia automática **semanal** do banco, **cifrada**, fora do Supabase e fora do repositório.
- **Como ficou (Missão 5B, D34):** toda segunda às 3h17 (Brasília), o GitHub Actions
  (`.github/workflows/backup-painel.yml`) lê a produção pela API de gerenciamento do Supabase, só leitura (a senha do
  banco não fica em lugar nenhum): as tabelas de `public`, os logins (`auth.users` e `auth.identities`), o registro
  do Storage e as imagens dos buckets públicos. Tudo vai num arquivo `.rzbk` comprimido e cifrado (AES-256-GCM, chave
  pela scrypt da `BACKUP_SENHA`), guardado como **artefato da execução por 90 dias**. O log só mostra contagens.
  Enquanto os segredos não estão cadastrados no GitHub, a execução termina com o aviso "Backup não feito", sem ficar
  vermelha: nesse tempo, **não há backup**.
- **Onde:** no artefato do GitHub Actions. O repositório é público, então qualquer pessoa logada no GitHub consegue
  baixar o arquivo: **ele só vale porque está cifrado**. A `BACKUP_SENHA` precisa ser longa e aleatória (ex.:
  `openssl rand -base64 32`) e ficar guardada também fora do GitHub, com a Renderiza: sem ela, o backup não abre.
- As imagens dos buckets públicos (`logos`, `site-imagens`) entram no mesmo arquivo, com o `sha256` de cada uma. O
  bucket `privado` (PDFs) fica de fora: hoje não tem nenhum arquivo, nem no STG nem na produção; quem passar a usar
  põe o download dele no backup (`scripts/lib/backup.mjs`).
- **Backup que nunca foi restaurado não conta:** a mesma execução restaura o arquivo num Postgres vazio (as
  migrações do repositório, os dados, as contagens e as imagens conferidas), toda semana. Na mão:
  `node scripts/restaurar-backup.mjs <arquivo>` (com `BACKUP_SENHA` e `PAINEL_LOCAL_PG` no ambiente). Restaurado de
  verdade em 30/10/2026: um backup do STG (40 tabelas, 1.041 linhas, 9 imagens) voltou inteiro num banco vazio.

## Se algo der errado (incidente)

1. Conter: trocar a chave ou a senha afetada, tirar do ar o que vazou.
2. Entender: o que foi exposto, de quais contas, desde quando.
3. Avisar os clientes afetados (controladores) o quanto antes, com o que aconteceu e o que foi feito. Eles têm prazo
   curto para avisar a ANPD e os titulares (3 dias úteis, Resolução CD/ANPD nº 15/2024; conferir na hora).
4. Registrar no diário de bordo e corrigir a causa.

## Regras para quem desenvolve

- **Nenhum dado real de cliente** no repositório, em teste, em print, em commit ou no chat. Teste com dados
  fictícios (Villa Alecrim, Estúdio Ciranda).
- Toda tabela nova: RLS + teste de isolamento no mesmo commit.
- Toda função pública nova: revisão do que ela devolve (só o mínimo) e limite de uso.
- Nunca pedir senha ou chave pelo chat; nunca usar a chave secreta fora do servidor.
- Logs sem dado pessoal (nada de nome, telefone ou e-mail de cliente final em log).
