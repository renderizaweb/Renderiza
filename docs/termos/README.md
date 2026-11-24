# Termos de aceite dos leads

Desde 23/11/2026, qualquer lead do painel de prospecção pode receber um **termo de contratação** para ler e assinar
online, com o mesmo método do contrato do vereador Mateuzinho (código no e-mail, impressão do texto, comprovante).

## Os dois tipos de termo da Renderiza (não confundir)

| | Onde mora | Quem aceita | Para quê |
|---|---|---|---|
| **Termo de lead** (este) | Painel de **prospecção** (`/painel`), Supabase da prospecção | o cliente que está fechando com a Renderiza | formalizar o site (entrega, preço, prazo, o que fica com ele) |
| **Termos de uso do Painel Renderiza** | `painel-clientes/publico/termos` (painel.renderizaweb.com.br/termos) | quem usa o Painel Renderiza (fotógrafos, espaços de evento…) | a assinatura mensal do painel (Meu site, Agenda, Estoque…) |

O termo de lead **aponta** para os Termos de uso do painel quando o cliente leva o painel junto: não repete nem
contradiz (o site é dele e fica nas contas dele; o painel é serviço à parte; cancelou, o site volta à versão inicial).
Como os dois se ligam: "Os dois termos de quem leva site e painel", abaixo.

## O fluxo

1. No card do lead, seção **Termo de aceite** → **Gerar termo**. A janela vem com os campos do modelo, já com o nome da
   empresa, a demo como referência e o valor (se o lead tiver).
2. Preencher o que é deste cliente (aba **Campos**). O texto sai pronto na aba **Texto** e dá para ajustar à mão; a aba
   **Como o cliente vê** mostra igual à página.
3. O que falta aparece como `[[pendência]]`. Com pendência, o termo **não abre** para assinatura (o banco recusa).
4. **Salvar e abrir para assinar** → **Copiar mensagem** (link + instrução) → mandar no WhatsApp.
5. O cliente abre `renderizaweb.com.br/termo/<id>`, preenche os dados (pessoa física ou empresa com CNPJ), escolhe
   "Site + Painel Renderiza" ou "Só o site", confirma o código do e-mail e assina. Chega o comprovante por e-mail (com cópia para
   contato@renderizaweb.com.br).
6. A assinatura aparece no card (nome, empresa, opção, protocolo, IP) e na tela **Atividade** ("Assinou o contrato
   online"), com as aberturas e os cliques da página.
7. Assinado, o texto não muda mais (o banco trava). Mudou algo depois? **Nova versão** (`-v2`), a partir dos mesmos campos.

## Os dois termos de quem leva site e painel

São **dois contratos**, cada um no seu lugar, e um aponta para o outro:

1. **O termo do site** (este): assinado em `/termo/<id>`. Na assinatura, o cliente diz se quer o painel ("Site + Painel
   Renderiza" ou "Só o site"). O termo do site **não fixa** plano, módulos nem preço do painel: só diz que é à parte,
   "a partir de R$ 49 por mês, com os módulos que você escolher", e que valem os Termos de uso do painel.
2. **Os Termos de uso do Painel Renderiza**: aceitos no primeiro acesso ao painel (tela "Li e aceito", já existente em
   `painel-clientes/src/telas/termos.js`, por versão, com a data e o aparelho). Ali estão o plano (R$ 49 com 2 módulos,
   cada módulo a mais com valor próprio), os módulos, a cobrança e o cancelamento. Módulo a mais ou a menos muda pelos
   Termos de uso, sem mexer no termo do site.

**A ligação:** quando a assinatura tem "Site + Painel Renderiza", o card do lead mostra o próximo passo: criar a conta dele
no Admin do Painel Renderiza com os módulos que ele quiser; o aceite dos Termos de uso vem no primeiro acesso. Um módulo
que ainda não existe (como o Estoque, em 24/11/2026) é assunto do painel, não do termo do site.

## O modelo base (`site-v1`, em `painel/src/termos.js`)

Enxuto de propósito (24/11/2026): o termo garante a entrega de forma genérica e deixa o detalhe para a conversa.

- **Entrega:** o site no modelo da referência aprovada (a demo), com as páginas e seções combinadas, celular e
  computador, prévia do link, a publicação e os acessos. "O que é entregue" e "O que não está incluído" são
  opcionais: uma ou duas linhas, só se precisar destacar algo.
- **Entrega única, sem manutenção incluída.** Depois, alteração é trabalho novo, orçado antes, ou pelo painel.
- **Tudo no nome do cliente:** código (GitHub), hospedagem (Cloudflare Pages ou Vercel) e domínio.
- **Domínio, três casos:**
  - **o cliente já tem** (o padrão): uma linha só, dizendo que o domínio continua dele (conta, pagamentos e
    renovação). Sem valor, sem Registro.br;
  - **a Renderiza registra** no nome dele, com o 1º ano incluído no preço; a renovação, a partir do 2º ano, é dele;
  - **a Renderiza registra, com o 1º ano incluído e adiantado** (24/11/2026, o caso da Ricardo): no nome dele, com os
    dados da assinatura; o 1º ano está **dentro do preço**, e essa parte (campo "Adiantamento para o domínio", padrão
    R$ 40) é paga na assinatura, para o registro; o restante vai na aprovação. Registrado, o domínio é dele;
    cancelando depois dos 7 dias e antes da versão para aprovação, o custo é só o adiantamento;
  - **o cliente registra e paga.**
- **Garantia** contra defeitos (padrão 30 dias), que não reduz a garantia da lei.
- **Limites:** conteúdo e preços são do cliente; sem garantia de vendas ou de Google; serviços de terceiros fora; teto
  no valor pago.
- **Pagamento** (padrão: na aprovação, nada antes): a Renderiza mostra o site pronto num endereço de prévia; aprovado,
  o cliente paga em até 2 dias úteis e a Renderiza publica no domínio dele. Também dá para cobrar na assinatura, metade
  e metade, ou de outra forma.
- **Desistência e cancelamento:**
  1. nos 7 dias depois da assinatura: desiste sem motivo e sem custo (o direito de arrependimento);
  2. depois disso e antes de aprovar o site: cancela por escrito. Sem custo se a versão para aprovação ainda não foi
     mandada; se já foi, paga metade do preço pelo trabalho feito (ou "sem custo", se escolhido no campo). Cancelado, o
     site não é entregue nem publicado (assim ninguém leva o site pagando metade);
  3. depois da aprovação, o preço é devido por inteiro;
  4. material ou resposta parados por mais de 30 dias: a Renderiza pode encerrar, com a regra do item 2.
- Prazo com uma rodada de ajustes e aprovação por escrito; o site é dele depois de pago; assinatura eletrônica e foro.

Só três coisas viram pendência `[[ ]]` se ficarem em branco: o nome do projeto, quem contrata e o valor.

**Texto ajustado à mão:** no editor, mexer na aba Texto marca o termo como ajustado à mão (`campos.texto_manual`), e
aí os campos não mudam mais o texto (o aviso aparece em qualquer aba, com "Refazer o texto pelos campos"). Sem essa
marca, o texto sempre sai dos campos, com o modelo de agora: um rascunho antigo pega sozinho as mudanças da base.
(Até 24/11/2026 isso era adivinhado comparando com o modelo, e uma mudança no modelo fazia o texto parar de seguir os
campos: foi o caso do valor da Ricardo que "não aparecia".) **Painel aberto há muito tempo roda o código antigo:
recarregue a página depois de uma atualização.**

Mudou a base (cláusula nova para todos)? Mude `montarTermoDoSite` e, se for mudança de conteúdo com termos já
assinados, o nome do modelo (`site-v2`). Termos assinados não mudam: eles guardam o texto exato.

## Ricardo Motors (o primeiro)

Os campos estão em [`termos/clientes/ricardo-motors.json`](../../termos/clientes/ricardo-motors.json). A base é a
que o Kaue preencheu no card em 24/11/2026 (R$ 399,00 na aprovação, 5 dias úteis, painel opcional com Meu site e
Estoque, a 1ª mensalidade 30 dias após a entrega), revisada no mesmo dia com o que mudou na entrega
([`docs/entregas/ricardo-motors.md`](../entregas/ricardo-motors.md)):

- **Domínio:** o `ricardomotors.com.br` é de outra empresa; a Renderiza registra um `.com.br` novo no nome dele. O total
  continua R$ 399,00: R$ 40,00 adiantados na assinatura (o domínio) e R$ 359,00 na aprovação.
- **Condições deste projeto:** com o painel, os carros, os preços e as fotos vêm do Estoque, e ele os mantém em dia
  (o que aparece no site vale como oferta dele); sem o painel, o site mostra a versão de reserva (os carros do dia da
  entrega, sem preço, com o aviso do WhatsApp), e mudar essa vitrine é alteração orçada.
- **Responsabilidades:** passou a citar "nomes e marcas" (existe outra Ricardo Motors, em SC).

O rascunho na produção (renderizaweb.com.br/termo/ricardo-motors-v1) foi gravado com esses campos e o texto deles,
**fechado**: o Kaue confere no card e faz **Salvar e abrir para assinar**.

## Como testar sem cair no cliente

Há um lead só para isso: **Teste dos termos (Renderiza)**, fora do funil (aparece na tela Clientes), com o termo
**teste-termos-v1** aberto em renderizaweb.com.br/termo/teste-termos-v1 (valor R$ 1,00, com a escolha do painel).

1. Abrir o link no celular, preencher com os **próprios dados** (o CPF tem de ser válido) e um e-mail que você lê.
   Dá para testar como pessoa física ou como empresa (CNPJ).
2. Pedir o código: chega em segundos, de nao-responda@renderizaweb.com.br (olhar o spam). Vale 15 minutos.
3. Assinar. Na tela aparecem o protocolo, o IP e a impressão do texto; "Salvar em PDF" imprime o termo assinado.
4. Conferir o **comprovante por e-mail**: os dados, o IP, a impressão e o **texto inteiro do termo assinado**. A cópia
   vai para contato@renderizaweb.com.br.
5. No painel, card do lead de teste: a assinatura (nome, empresa, escolha, protocolo, IP, aparelho) e, se escolheu o
   painel, o próximo passo. Na Atividade: "Abriu o contrato para assinar" e "Assinou o contrato online".

Limites (contra abuso): 1 código por minuto e 3 por hora para o mesmo e-mail; 5 assinaturas por hora do mesmo IP. O
termo de teste aceita várias assinaturas; para apagar as de teste, pedir ao Claude (apaga `termos_aceites`,
`termos_codigos` e os passos `contrato-assinado` em `visitas` do lead `teste-termos`).

## Técnico

- Banco: `supabase/termos-online.sql` (rodar de novo no Supabase da prospecção: só acrescenta). Testes num Postgres local:
  [`supabase/testes/README.md`](../../supabase/testes/README.md).
- Página: `termos/pagina.html` → `/termo/<id>` (rewrite no `vercel.json`; o servidor local faz o mesmo).
- Texto e marcação: `painel/src/termos-texto.js` (o mesmo leitor no painel e na página). Modelo: `painel/src/termos.js`.
  Tela: `painel/src/termos-ui.js`. Testes: `test/termos.test.mjs`.
- E-mail do código e comprovante: função de borda `supabase/functions/termo-codigo` (publicar de novo depois de mudar a
  `logica.js`).
- A impressão é o SHA-256 do texto exato guardado no banco (o gatilho calcula; a página confere antes de assinar).
- A contratada completa (CPF inteiro e endereço do Kaue) vai só no comprovante: o termo novo copia do último termo do
  mesmo dono (o do vereador), sem passar pelo repositório nem pelo painel.
