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

## Documentos que precisam existir (parada 5, tarefa T5.5)

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

## Backup

- O plano gratuito do Supabase **não faz backup**. Até subir para o Pro (que guarda 7 dias de backup diário):
  cópia automática **semanal** do banco (GitHub Actions com `pg_dump`), **cifrada**, guardada num lugar privado
  fora do Supabase e fora do repositório (onde: decidir na tarefa T5.6).
- As imagens do Storage entram na mesma rotina (ou têm cópia própria).
- **Backup que nunca foi restaurado não conta:** restaurar num banco de teste na tarefa T5.6 e a cada 3 meses.

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
