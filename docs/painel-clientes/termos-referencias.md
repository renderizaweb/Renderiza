# Termos e privacidade: o que validar e de onde veio

Os **Termos de uso e de prestação de serviço** (`/termos`) e a **Política de privacidade** (`/privacidade`) foram
reescritos em 30/10/2026, a pedido da Renderiza, que valida. Este arquivo diz o que falta preencher, quais decisões
de negócio estão dentro deles e em que lei ou norma cada ponto se apoia. Arquivos: `painel-clientes/publico/termos/`
e `painel-clientes/publico/privacidade/`.

**Objetivo dos textos:** cuidar do cliente (clareza, sem armadilha, sair quando quiser levando os dados) e proteger
a Renderiza (papéis da LGPD bem divididos, limite de responsabilidade, regras do Meu site e da versão final).

> Não é parecer jurídico. Os textos seguem a lei e as normas da ANPD citadas abaixo, com referências conferidas em
> 30/10/2026. Antes de crescer (muitas contas, cliente grande), vale uma leitura única por advogado de direito
> digital: é barato perto do que os textos protegem.

## 1. O que falta preencher (em amarelo nas páginas)

| Onde | O quê | Sugestão |
|---|---|---|
| Termos 1 e Política 1 | razão social, CNPJ e endereço da Renderiza | os do cartão CNPJ |
| Termos 6 | dia do vencimento do Pix | 10 |
| Termos 6 | aviso antes de mudar o preço (fora o reajuste anual) | 30 dias |
| Termos 7 | conta desligada por falta de pagamento vira cancelada depois de | 90 dias |
| Termos 15 | dias e horário do suporte | ex.: segunda a sexta, 9h às 18h |
| Termos 20 | cidade/UF do foro | a da sede (o CPC exige ligação com a sede ou o domicílio de uma parte) |
| Termos 21 | WhatsApp da Renderiza | |
| Política 5 | país da conta Zoho | ver em Zoho → configurações da conta (o centro de dados aparece lá) |
| Política 6 | mecanismo de transferência internacional de cada fornecedor | conferir nos acordos de dados (DPA) da Supabase, Vercel, Brevo, Zoho e GitHub se citam as cláusulas-padrão da ANPD ou outro mecanismo |
| Política 14 | encarregado ou canal | se a Renderiza for ME ou EPP, basta o canal (já está o contato@); se não, nomear o encarregado |

Com tudo preenchido e lido, uma sessão: tira a etiqueta "Rascunho em revisão", troca a versão para a data da
validação (`data-versao` nas duas páginas e `VERSAO_DOS_TERMOS` em `src/telas/termos.js`) e sobe. Todo mundo
aceita de novo no próximo acesso.

## 2. Decisões de negócio que estão nos textos (confirme ou mude)

| Cláusula | O que diz | Por quê |
|---|---|---|
| Termos 9 (Meu site) | o site é um produto à parte e é do cliente; o Meu site é um serviço da mensalidade; **saiu, desligou o módulo ou não pagou: o site volta sozinho à versão inicial**; as mudanças do Meu site não fazem parte do site entregue | o pedido da Renderiza (30/10) e a regra do `03` |
| Termos 9.4 (versão final) | levar as mudanças para os arquivos do site é **serviço cobrado à parte**, com orçamento próprio, pedido enquanto a conta existe ou até 90 dias depois de desligar ou cancelar | depois disso as versões são apagadas (prazo da cláusula 8) |
| Termos 6 | reajuste uma vez por ano pelo IPCA; outras mudanças com aviso; quem não concordar cancela sem custo | protege a Renderiza da inflação sem prender o cliente |
| Termos 8 | cancelamento vale no fim do mês pago, sem devolução proporcional; a Renderiza pode encerrar com 30 dias de aviso | regra simples e justa para os dois lados |
| Termos 12.3 | a Renderiza avisa o cliente de um incidente em até 2 dias úteis | o cliente (controlador) tem 3 dias úteis para avisar a ANPD (Res. 15/2024) |
| Termos 17 | a Renderiza não responde por danos indiretos (lucros cessantes, perda de chance); **teto = mensalidades pagas nos últimos 12 meses**; não vale para dolo ou culpa grave | ver a seção 3 |
| Termos 17 | o cliente ressarce a Renderiza quando ela for cobrada por conteúdo ou dados que ele pôs sem base legal | direito de regresso (LGPD, art. 42, § 4º) |
| Termos 18 | mudança de verdade nos termos: 30 dias de aviso e novo aceite | segurança para os dois lados |
| Política 7 | registros de acesso (data, hora e IP) por 6 meses | obrigação do Marco Civil, art. 15 (implementado em 30/10, ver a seção 4) |

## 3. Por que as cláusulas de proteção foram escritas assim

- **Contrato entre empresas:** o Código Civil (art. 421-A) presume os contratos empresariais paritários e manda
  respeitar a divisão de riscos combinada. É o que sustenta o limite de responsabilidade.
- **Mas é um contrato de adesão** (o cliente não negocia o texto). Aí, cláusula ambígua é lida a favor de quem
  adere (Código Civil, art. 423), e é nula a renúncia antecipada a direito que vem da natureza do negócio (art. 424).
  Por isso o texto **limita** em vez de **excluir** a responsabilidade, ressalva dolo e culpa grave e evita frases
  ambíguas.
- **O CDC pode valer** para um cliente pequeno que prove vulnerabilidade (o STJ aplica a teoria finalista mitigada:
  a pessoa jurídica precisa provar a vulnerabilidade no caso concreto). Por isso os textos evitam o que o CDC
  proíbe: há saída sem multa, aviso antes de mudar preço e termos, os dados vão embora com o cliente e o foro do
  cliente vale quando a lei garantir.
- **Foro:** desde a Lei 14.879/2024, a eleição de foro só vale se tiver ligação com o domicílio de uma das partes
  ou com o local da obrigação (CPC, art. 63, § 1º). Por isso o foro é o da sede da Renderiza.
- **Aceite eletrônico:** o contrato pode ser feito por meio eletrônico (Código Civil, art. 107; MP 2.200-2/2001,
  art. 10, § 2º). O painel guarda quem aceitou, a versão, a data, a hora e o aparelho.
- **Papéis da LGPD:** sobre os dados dos clientes finais, o cliente é o controlador e a Renderiza a operadora
  (art. 5º, VI e VII). A operadora segue as instruções do controlador (art. 39) e só responde solidariamente quando
  descumpre a lei ou as instruções lícitas (art. 42, § 1º, I). A cláusula 12 dos termos é o acordo de tratamento de
  dados: deixa as instruções escritas e autoriza os fornecedores (suboperadores), como o guia da ANPD recomenda.
- **Bases legais, sem depender de consentimento:** execução de contrato, obrigação legal, exercício regular de
  direitos e legítimo interesse (art. 7º, V, II, VI e IX). Por isso a tela do aceite diz "Li e aceito os termos de
  uso, e li a política de privacidade": a política informa, não pede consentimento.
- **Conteúdo do Meu site:** o cliente garante os direitos sobre o que publica (Lei 9.610/1998; Código Civil,
  art. 20). A Renderiza tira do ar por ordem judicial (Marco Civil, art. 19) ou diante de conteúdo claramente
  ilícito.

## 4. O que mudou no sistema por causa dos textos

- **Registros de acesso do Marco Civil** (migração `20261030200000_registros_de_acesso.sql`, local, STG e
  produção): cada entrada no painel grava a data, a hora e o IP numa tabela fechada (ninguém lê pela API), apagada
  depois de 6 meses. Antes, o IP não era guardado.
- A tela do aceite separa "aceito os termos" de "li a política".
- **A fazer, fora deste trabalho:**
  - o aviso curto de privacidade no formulário da agenda online. Ele fica em `ferramentas/demo/agenda-online/`,
    que só muda com o ok da Renderiza (as demos);
  - quando existir uma rotina de apagar contas canceladas, ela deve guardar o registro do aceite dos termos (hoje,
    apagar o login apaga o aceite junto).

## 5. Referências (conferidas em 30/10/2026)

- **LGPD**, Lei nº 13.709/2018: arts. 5º, 7º, 14, 15, 16, 18, 19, 33, 39, 41, 42, 46 e 48.
- **Marco Civil da Internet**, Lei nº 12.965/2014: art. 5º, VIII, e art. 15 (6 meses de registros de acesso);
  art. 19 (retirada de conteúdo por ordem judicial).
- **Código Civil**: arts. 20, 107, 393, 421-A, 423 e 424. **MP nº 2.200-2/2001**, art. 10, § 2º.
- **CPC**, art. 63, § 1º e § 5º, na redação da Lei nº 14.879/2024.
- **Resolução CD/ANPD nº 2/2022** (agentes de pequeno porte: dispensa de encarregado com canal de comunicação,
  art. 11; prazos em dobro, art. 14): [página oficial da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).
- **Resolução CD/ANPD nº 15/2024** (incidente: 3 dias úteis do controlador; complementação em 20 dias úteis):
  [Mattos Filho](https://www.mattosfilho.com.br/unico/regulamento-incidente-seguranca/),
  [Cescon Barrieu](https://cesconbarrieu.com.br/anpd-aprova-o-regulamento-de-comunicacao-de-incidente-de-seguranca/).
- **Resolução CD/ANPD nº 18/2024** (encarregado: identidade e contato divulgados no site):
  [Mattos Filho](https://www.mattosfilho.com.br/?p=106157),
  [texto (TJBA)](https://www.tjba.jus.br/extrajudicial/wp-content/uploads/2024/08/RESOLUCAO-ANPD-No-18-Encarregado-de-Dados.pdf).
- **Resolução CD/ANPD nº 19/2024** (transferência internacional e cláusulas-padrão; prazo de adequação terminou em
  23/08/2025): [Mattos Filho](https://www.mattosfilho.com.br/unico/regulamentacao-transferencia-internacional-dados/),
  [Lefosse](https://lefosse.com/noticias/transferencia-internacional-de-dados-prazo-para-adocao-das-clausulas-padrao-da-anpd-se-encerra-em-23-de-agosto/).
- **Guia da ANPD sobre agentes de tratamento e encarregado** (contrato entre controlador e operador; suboperador):
  [versão 2](https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/Segunda_Versao_do_Guia_de_Agentes_de_Tratamento_retificada.pdf/).
- **Lei nº 14.879/2024** (eleição de foro): [Mattos Filho](https://www.mattosfilho.com.br/unico/modificacao-limita-eleicao-foro/),
  [texto (Câmara)](https://www2.camara.leg.br/legin/fed/lei/2024/lei-14879-4-junho-2024-795714-publicacaooriginal-171960-pl.html).
- **Limitação de responsabilidade em contratos empresariais** (art. 421-A): [Conjur, 2024](https://www.conjur.com.br/2024-mai-08/clausula-de-limitacao-de-responsabilidade-protege-contra-riscos//?print=1).
- **CDC e pessoa jurídica (teoria finalista mitigada; vulnerabilidade a provar)**:
  [Dizer o Direito](https://www.dizerodireito.com.br/2023/12/em-regra-o-cdc-nao-e-aplicado-para-os.html).
- **Marco Civil, art. 15** (comentário): [Legale](https://legale.com.br/blog/prazo-de-guarda-de-dados-no-marco-civil-regras-e-conflitos-juridicos/).
- **LGPD, arts. 39 e 42** (operador e responsabilidade): [Migalhas](https://www.migalhas.com.br/depeso/334240/anotacoes-rapidas-sobre-a-lgpd--4-pontos-que-o-controlador-deve-observar-ao-contratar-um-terceiro).
