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

## O fluxo

1. No card do lead, seção **Termo de aceite** → **Gerar termo**. A janela vem com os campos do modelo, já com o nome da
   empresa, a demo como referência e o valor (se o lead tiver).
2. Preencher o que é deste cliente (aba **Campos**). O texto sai pronto na aba **Texto** e dá para ajustar à mão; a aba
   **Como o cliente vê** mostra igual à página.
3. O que falta aparece como `[[pendência]]`. Com pendência, o termo **não abre** para assinatura (o banco recusa).
4. **Salvar e abrir para assinar** → **Copiar mensagem** (link + instrução) → mandar no WhatsApp.
5. O cliente abre `renderizaweb.com.br/termo/<id>`, preenche os dados (pessoa física ou empresa com CNPJ), escolhe com
   ou sem o painel, confirma o código do e-mail e assina. Chega o comprovante por e-mail (com cópia para
   contato@renderizaweb.com.br).
6. A assinatura aparece no card (nome, empresa, opção, protocolo, IP) e na tela **Atividade** ("Assinou o contrato
   online"), com as aberturas e os cliques da página.
7. Assinado, o texto não muda mais (o banco trava). Mudou algo depois? **Nova versão** (`-v2`), a partir dos mesmos campos.

## O modelo base (`site-v1`, em `painel/src/termos.js`)

O que vale para todo cliente de site, sem precisar escrever de novo:

- **Entrega única, sem manutenção incluída.** Depois da entrega, alteração é trabalho novo (orçado antes) ou pelo
  painel, se contratado. A Renderiza não responde por mudanças feitas por outras pessoas nem pelas contas dele.
- **Tudo no nome do cliente:** código num repositório privado no GitHub dele, hospedagem no **Cloudflare Pages**
  (grátis, permite uso comercial; ou Vercel, que pede plano pago) na conta dele, domínio no Registro.br no CPF/CNPJ
  dele. A Renderiza passa os acessos na entrega (nunca por mensagem) e só fica com acesso se ele quiser.
- **Domínio:** o 1º ano pode estar incluído no preço; **a renovação é sempre dele** (a partir do 2º ano, ou desde o
  início), direto no Registro.br. A Renderiza não responde por domínio vencido ou perdido.
- **Garantia** contra defeitos (padrão 30 dias), que não reduz a garantia da lei.
- **Limites de responsabilidade:** conteúdo e preços são do cliente; sem garantia de vendas ou de Google; serviços de
  terceiros (GitHub, Cloudflare, Registro.br, Google, WhatsApp) fora; teto no valor pago; sem lucros cessantes.
- **Painel Renderiza** (opcional, incluído ou fora): mensalidade, sem fidelidade, Termos de uso próprios; o site não
  depende do painel.
- **Prazo e ajustes:** material em 5 dias úteis, entrega em N dias úteis, **uma rodada de ajustes** com a lista de uma
  vez, aprovação por escrito ("pode publicar"), 10 dias úteis sem resposta = aprovado.
- **Desistência** em 7 dias sem custo; depois, paga o proporcional. Propriedade do site com o cliente depois de pago.
  Dados pessoais, avisos, assinatura eletrônica (MP 2.200-2/2001) e foro.

**Campos de cada cliente:** nome do projeto, quem contrata (e se como pessoa física, empresa ou os dois), referência
aprovada (a demo), o que é entregue, o que não está incluído, **condições deste cliente** (viram uma cláusula própria),
valor, forma de pagamento, prazo, garantia, domínio, 1º ano do domínio, hospedagem, painel (módulos, mensalidade, início)
e foro.

Mudou a base (cláusula nova para todos)? Mude `montarTermoDoSite` e, se for mudança de conteúdo, o nome do modelo
(`site-v2`). Termos já assinados não mudam: eles guardam o texto exato.

## Ricardo Motors (o primeiro)

Os campos estão em [`termos/clientes/ricardo-motors.json`](../../termos/clientes/ricardo-motors.json), montados a partir do
lead (demo, proposta do Estoque, observações). **Na produção desde 24/11/2026**: o termo `ricardo-motors-v1` está no card
do lead como rascunho (fechado para assinatura), em renderizaweb.com.br/termo/ricardo-motors-v1. É só abrir no card,
**Editar**, preencher o que falta e **Salvar e abrir**. Pendências que só a Renderiza decide:

- **Valor do site** (e a forma de pagamento: hoje "tudo na assinatura").
- **Módulo Estoque:** ainda não existe no painel de verdade (só o protótipo da demo). O termo precisa dizer até quando
  entra e o que vale até lá (sugestão no próprio texto).
- Conferir: prazo de 10 dias úteis, garantia de 30 dias, 1º ano do domínio incluído (como na Black Friday), Cloudflare
  Pages, painel opcional a R$ 49/mês (Meu site e Estoque) com a 1ª mensalidade no mês seguinte à entrega.
- O CNPJ e o nome oficial (Ricardo Motors ou RM Consult Car) entram **na assinatura**: o termo aceita pessoa física ou
  empresa.

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
