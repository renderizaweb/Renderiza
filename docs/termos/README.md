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
  - **o cliente registra e paga.**
- **Garantia** contra defeitos (padrão 30 dias), que não reduz a garantia da lei.
- **Limites:** conteúdo e preços são do cliente; sem garantia de vendas ou de Google; serviços de terceiros fora; teto
  no valor pago.
- Prazo com uma rodada de ajustes e aprovação por escrito; desistência em 7 dias; o site é dele depois de pago;
  assinatura eletrônica e foro.

Só três coisas viram pendência `[[ ]]` se ficarem em branco: o nome do projeto, quem contrata e o valor.

Mudou a base (cláusula nova para todos)? Mude `montarTermoDoSite` e, se for mudança de conteúdo com termos já
assinados, o nome do modelo (`site-v2`). Termos assinados não mudam: eles guardam o texto exato.

## Ricardo Motors (o primeiro)

Os campos estão em [`termos/clientes/ricardo-motors.json`](../../termos/clientes/ricardo-motors.json): o site no modelo
da demo, uma linha do que é entregue (a vitrine dos carros) e uma do que não é (ligação automática com a Webmotors);
ele já tem domínio; o painel é opcional, com os módulos que ele escolher. **Na produção desde 24/11/2026** como
rascunho no card do lead (renderizaweb.com.br/termo/ricardo-motors-v1). **Só falta o valor do site**: no card,
**Editar**, preencher o valor (e o domínio, se quiser que apareça) e **Salvar e abrir**.

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
