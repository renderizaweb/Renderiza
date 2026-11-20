# Cliente fechou: roteiro da entrega

Para seguir toda vez que um cliente paga, do painel ao site no ar no domínio dele. Cada passo diz quem faz:
**Kaue** (fala com o cliente, mexe nas contas dele) ou **Claude** (código, painel e conferência, quando o Kaue pedir).
O andamento de cada cliente fica na `ficha.md` da demo, na seção "Entrega" (modelo no fim).

Regras que valem do começo ao fim:
- Tudo fica nas contas do **cliente** (Gmail, GitHub, hospedagem e domínio no CPF/CNPJ dele). A Renderiza só faz o site
  (CONTEXTO, "Quando o cliente aprova").
- Senha, código de verificação e chave **nunca** passam pelo chat com o Claude. O cliente passa os acessos ao Kaue
  (pessoalmente, por ligação ou por um gerenciador de senhas), e o Kaue entra nas contas ele mesmo.
- No `site.json` e no site, só dados públicos da empresa: nada de CPF, endereço ou telefone pessoal.
- As fotos brutas do cliente (Drive, ensaio) não entram no repositório da Renderiza nem no dele: só as que estão no site.

## 1. Painel, no mesmo dia (Kaue ou Claude)

Para o Claude, basta: *"fechou &lt;cliente&gt;, R$ &lt;valor&gt;, pago em &lt;data&gt; (Pix, 2x…)"*.

- [ ] Lead em **Finalizado · Ganho**, com o valor fechado e a data (no painel do lead: Finalizar → Ganho).
- [ ] **Registrar interação**: "Fechou: R$ &lt;valor&gt;, pago por &lt;forma&gt; em &lt;data&gt;. Combinado: &lt;o que entra&gt;."
- [ ] **Próxima ação**: "Entrega do site: &lt;o que falta&gt;".
- [ ] **Demo no ar enquanto durar a entrega** (seção Demo do lead: "Sem prazo" ou "Reabilitar por 7 dias"): o
  cliente confere os ajustes no mesmo link de sempre.

## 2. Uma mensagem com tudo o que falta do cliente (Kaue)

Juntar numa mensagem só, para não ficar pedindo aos poucos:
- [ ] **Ajustes finais**: a lista completa do que ele quer mudar, de uma vez.
- [ ] **Pendências da ficha** (a seção "Conferir" da `ficha.md`): horário, fotos que faltam, informações a confirmar.
- [ ] **Domínio**: o nome que ele quer (o Claude levanta 2 ou 3 livres no registro.br). Quem registra é o cliente, no
  CPF/CNPJ dele, em registro.br (a anuidade é paga por ele, direto ao Registro.br). Se ele já tem domínio, perguntar
  quem tem o acesso.
- [ ] **Contas**: ele tem Gmail e GitHub? Se não, a Renderiza cria um Gmail de dev só para o site dele
  (CONTEXTO, item 4), e o resto (GitHub, hospedagem) é feito nessa conta.

## 3. Ajustes na demo (Claude)

- [ ] Fazer os ajustes em `demos/<pasta>/index.html` (mantendo as marcações `data-site-*`), publicar no main: a demo
  muda no mesmo link. Anotar na ficha o que mudou ("Versão N").
- [ ] O Kaue manda o link e o cliente aprova **por escrito** no WhatsApp ("pode publicar").
- Foto que ainda não chegou: ou espera, ou a seção sai. O site não vai para o ar com "espaço reservado" (a
  conferência do passo 5 barra).

## 4. `site.json` (Claude)

Na pasta da demo. Modelos: `demos/lu-elegante-modas/site.json` (loja) e `demos/ms-odontologia/site.json` (clínica).
- `dominio`: o que o cliente **registrou** (sem ele, o gerador para e avisa).
- `nome`, `corTema`, `favicon` (`{ "texto", "cor" }`; sem ele, vale o ícone da demo, se tiver), `previaCentro`
  (onde centrar a prévia do WhatsApp, de 0 a 1).
- `dadosEstruturados` (schema.org, para o Google): nome, tipo do negócio, telefone comercial, endereço da empresa,
  Instagram. Nada de nota ou avaliações (o Google ignora as do próprio site).
- `painel` (Meu site / agenda): só se o cliente contratou (CONTEXTO, "Quando o cliente aprova", item 2).

## 5. Gerar e conferir (Claude)

```
npm run site -- <pasta>        # gera ../sites/<domínio>/ e confere no fim
```
- O gerador tira o que é só da demo (noindex, ícone duplicado) e termina com a **Conferência**:
  `✗` = não pode ir para o ar (rastreio da Renderiza, card de valor da oferta, link de /demo/, noindex, texto
  provisório, foto faltando); `!` = olhar (sem descrição, sem WhatsApp, foto embutida, prévia em WebP).
  Corrigir os `✗` na demo e gerar de novo. Para conferir de novo à mão: `node scripts/conferir-site.mjs ../sites/<domínio>`.
- Abrir no navegador, no celular e no computador (`python3 -m http.server -d ../sites/<domínio> 8080`): WhatsApp
  abre com o número certo, mapa, Instagram, todas as fotos, menu do celular. Olhar o `og.jpg` (a prévia).

## 6. Repositório do cliente (Kaue cria, Claude sobe)

- [ ] Repositório **privado** na conta GitHub do cliente (ou do Gmail de dev), com o nome do domínio
  (ex.: `clinicamsodontologia`). Vazio, sem README.
- [ ] Para o Claude subir: o app do Claude no GitHub instalado nesse repositório
  (github.com/apps/claude/installations/select_target) e o repositório adicionado à sessão. Se não der, o Claude manda
  um `.zip` com a pasta do site e o Kaue sobe pelo GitHub (Add file → Upload files, arrastando o conteúdo).
- Vai para o repositório só o que saiu do gerador: `index.html`, `img/`, `og.jpg`, `favicon.svg`, `robots.txt`,
  `sitemap.xml`, `vercel.json`, `_headers`, `README.md` (o README explica ao cliente e a qualquer dev como alterar).

## 7. Hospedagem e domínio (Kaue, nas contas do cliente)

Os dois servem o mesmo repositório sem mudar nada (o gerador já põe `vercel.json` e `_headers`):
- **Vercel** (o padrão de hoje): Add New → Project → importar o repositório → Framework Preset **Other**, sem build →
  Deploy. Em Settings → Domains, adicionar `dominio` e `www.dominio`; no registro.br, criar os registros DNS que a
  Vercel mostrar. Atenção: o plano grátis (Hobby) proíbe uso comercial.
- **Cloudflare Pages** (grátis e sem essa restrição): Workers & Pages → Create → Pages → conectar o GitHub →
  repositório → sem comando de build, pasta de saída `/`. Para o domínio, adicionar o site na Cloudflare e trocar, no
  registro.br, os servidores DNS pelos da Cloudflare; depois, em Custom domains, `dominio` e `www.dominio`.
- A cada alteração enviada ao repositório, a hospedagem publica sozinha.

## 8. Conferência no ar (Claude e Kaue)

- [ ] `https://dominio` e `https://www.dominio` abrem, com cadeado (o certificado sai sozinho em minutos).
- [ ] Prévia: mandar o link para si mesmo no WhatsApp (foto, título e descrição).
- [ ] Botões: WhatsApp, Instagram, mapa, rota, avaliar no Google.
- [ ] Google (com a conta do cliente): Search Console → adicionar o domínio → enviar `sitemap.xml`. Opcional, ajuda a
  aparecer mais rápido.
- [ ] Trocar o link antigo pelo novo: campo "Site" do Perfil da Empresa no Google, bio do Instagram, Linktree/Canva.

## 9. Entrega ao cliente (Kaue)

- [ ] Mensagem com o link do site, o que ficou no nome dele (domínio, GitHub, hospedagem) e como pedir alteração.
- [ ] Passar os acessos (fora do chat): e-mail e senha do Gmail de dev, se foi criado. Lembrar que o domínio renova
  todo ano no Registro.br (o aviso chega no e-mail dele).

## 9b. Kit de divulgação (Claude prepara, Kaue manda)

Pedido do Kaue em 20/11/2026: quem fecha ganha o material para divulgar o site novo, pronto para baixar ou copiar,
numa página só dele, com a marca e a assinatura dele (nada da Renderiza nas peças). Não é para vender: é para ele usar
se quiser. A página tem o contador: o card do lead no Painel de prospecção mostra quando ele abriu o kit, viu o vídeo
na tela (mesmo sem baixar), deu play, viu até o fim, baixou cada peça e copiou cada texto.

1. **O vídeo** (~30 s, Stories e Reels): `gravacoes/<pasta>-site.json` no modo "site que já está no ar" do
   `ferramentas/video/gravar.mjs` (url do site no ar, `assinatura` com o @ dele, `legenda_baixo: 170`; modelo:
   `gravacoes/rafaela-damaceno-site.json`). Ensaio (`--ensaio`), conferir os quadros, gravar.
2. **O kit** (`demos/<pasta>/kit.json`; modelo: o da Rafaela): as cores e as fontes do site dele, o vídeo, o flyer de
   Stories e a arte do feed (as fotos saem da demo pelo `data-k`; o gerador de flyer avisa se o texto encosta no botão)
   e os textos prontos: legenda, bio do Instagram, Status do WhatsApp e o pedido de avaliação no Google (com o link de
   avaliar do perfil dele, o mesmo do site). Sem domínio no ar ainda: o endereço que já funciona, e "link na bio".
3. `node ferramentas/kit/gerar.mjs demos/<pasta>/kit.json` → as artes em `flyers/` e a página `demos/<pasta>/kit.html`,
   no ar em **`/kit/<pasta>`** (fora de `/demo`: não sai do ar quando a demo é desligada, no passo 10).
4. O Kaue manda o link: "Preparamos os materiais de divulgação do seu site, caso queira usar: <link>". Depois, olha o
   card do lead (visitas e Atividade).
5. O domínio entrou no ar depois? Trocar o endereço no `kit.json` (e no vídeo, se ele aparecer) e gerar de novo.

## 10. Fechar na Renderiza (Claude, com o ok do Kaue)

- [ ] Painel: interação "Site no ar em &lt;domínio&gt;"; próxima ação: pedir depoimento/avaliação daqui a 15 dias.
- [ ] Demo: desligar (chave "No ar") uma semana depois do site no ar.
- [ ] Ficha: seção "Entrega" completa (domínio, repositório, hospedagem, data).
- [ ] CONTEXTO: cliente na lista de clientes. Home da Renderiza ("Projetos de clientes", `site/config.mjs`): só com
  o ok do cliente.

## Modelo: seção "Entrega" da ficha.md

```
## Entrega (cliente fechou)
| | |
|---|---|
| Venda | R$ … · pago em …/…/…  (forma) |
| Combinado | site (demo aprovada) + … |
| Ajustes pedidos | … |
| Domínio | … (registrado por …, no CPF/CNPJ dele) |
| Contas | Gmail … · GitHub … · hospedagem … |
| Repositório | github.com/…/… (privado) |
| No ar | https://… desde …/…/… |

- [ ] 1 painel · [ ] 2 levantamento · [ ] 3 ajustes · [ ] 4 site.json · [ ] 5 gerar e conferir · [ ] 6 repositório
- [ ] 7 hospedagem e domínio · [ ] 8 conferência no ar · [ ] 9 entrega · [ ] 9b kit de divulgação · [ ] 10 fechar na Renderiza
```
