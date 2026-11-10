# Clínica MS Odontologia (Dr. Marcos Silva)

Cliente de antes do painel: aprovou a demo e pediu para fechar quando tivesse as fotos novas. As fotos
saíram no Instagram dele em setembro de 2026; esta é a versão refeita com elas (01/10/2026).

| | |
|---|---|
| Onde | R. Bagre, 46 - São Carlos, Itapevi - SP, 06694-470 |
| Instagram | [@mmarcos_s](https://www.instagram.com/mmarcos_s/) (41,4 mil seguidores) · clínica [@clinicamsodontologia](https://www.instagram.com/clinicamsodontologia/) (3 mil) |
| Google | nota 5,0 · 93 avaliações · conferido em 01/10/2026 |
| WhatsApp | (11) 98755-8202 (Google, site atual e posts da clínica) |
| Site atual | Canva: clinicamsodonto.my.canva.site/bio-ms-odonto (ele não gosta) |
| Entregável | demo de site (`index.html`) |
| Situação | **fechou: R$ 500, Pix, 04/11/2026** (primeira venda da Renderiza) · entrega em andamento, ver "Entrega" no fim · demo: `/demo/ms-odontologia`, versão 5 |

## O que foi mantido da demo aprovada
- Paleta verde-petróleo, menta, creme e coral; logo "Dr. Marcos Silva".
- Textos: "Seu sorriso, do seu jeito.", resultados reais (antes/depois), "Mais que estética", os 4
  tratamentos, "Tem técnica. Tem cuidado. Tem gente.", "Reconhecimento é consequência de constância",
  "+10 mil casos", "5 anos consecutivos melhor dentista de Itapevi", CRO-SP 151839.
- As 6 avaliações do Google, as fotos da clínica e o contato.

## O que mudou
- Fotos do ensaio novo (posts de 23, 28 e 30/09/2026): capa de terno cinza sorrindo; seção nova "Quem cuida
  do seu sorriso" com o retrato no consultório e tira de 3 fotos (cinza, bordô, azul xadrez).
- Oscar Beauty 2026, categoria Dentista (post de 12/09/2026: recebido em Barueri). Fotos do prêmio no
  reconhecimento; citação dele tirada da legenda.
- Nota 5,0 e 93 avaliações na capa e nos depoimentos, com link para avaliar (link do site atual).
- Serviços do site atual: implantes, ortodontia, cirurgia, sedação consciente, odontopediatria,
  odontogeriatria e harmonização (preenchimento labial, lipo de papada, fios de PDO, botox).
- Fonte Cormorant Garamond + Manrope, carrosséis com setas, mapa, Instagram da clínica, menu no celular.

## Conferir antes de mandar
- Horário: o Google diz seg 9h–18h, ter 9h30–18h, qua a sex 9h–18h, sáb 9h–15h; a arte da clínica diz
  seg a sex 9h–19h. No site ficou só "Segunda a sábado, com hora marcada".
- O site atual diz "Avaliação gratuita": não coloquei. Se ainda vale, entra na capa.
- Os títulos "+10 mil casos" e "5 anos melhor dentista de Itapevi" vieram da demo aprovada; não conferi a
  fonte.

## Versão 3 (05/10/2026): fotos originais do ensaio e espaço da equipe
- O Dr. Marcos mandou o ensaio completo no Drive (91 arquivos, 56 coloridos + versões P&B, 4000×6000):
  4 looks (terno vinho em fundo escuro, azul xadrez no escritório de madeira, cinza em fundo claro, cinza em
  fundo escuro). As fotos dele saem dos originais em alta, não mais dos posts do Instagram.
- Escolhas (número do arquivo `0J4A____`): capa 6088 (cinza no sofá claro, sorrindo); "Quem cuida do seu
  sorriso" 5854 (azul, sorrindo no escritório) + tira 6239 / 5560 / 5860; "Mais que estética" 5844 (à mesa,
  mãos juntas) no lugar da arte "Parceria Dr Marcos"; galeria 5826 (notebook) e 5920 (sofá do consultório) no
  lugar da foto antiga da mesa e da de jaleco com texto; 6207 (pensativo); contato 6062 (em pé, sorrindo) no
  lugar da foto de jaleco.
- Seção nova **"Nossa equipe"** (depois do doutor, link "Equipe" no menu): foto horizontal grande, com um
  espaço reservado até a foto da equipe toda chegar. Para trocar: no fonte, substituir o bloco
  `.equipe-vazio` pela imagem `equipe_toda` (1600×900).
- Depoimento longo da Dra. Carla virou trecho (mesmo tamanho dos outros).
- Ficaram as fotos reais da clínica com pacientes (galeria), o antes e depois e as do Oscar Beauty.

## Conferir
- Foto da equipe toda: pedir na horizontal, com todos, de preferência na clínica e com boa luz.

## Versão 4 (04/11/2026): ajustes pedidos depois do fechamento
- Antes e depois: o Dr. Marcos disse que estava invertido. As duas fotos trocaram de lugar (legendas e textos
  ficaram). Ainda vale trocar por um par mais bonito do Instagram (ver "Entrega").
- Seção "Nossa equipe" e o link "Equipe" do menu saíram: ele manda a foto da equipe em outro momento. Para voltar,
  a seção está no `index.html` do commit da versão 3 (CSS `.equipe*` ficou no arquivo).

## Versão 5 (05/11/2026): fotos novas no lugar das fracas (ok do Kaue: "faça o que achar melhor")
Fontes: as páginas do Instagram salvas pelo Kaue no Drive (pasta `1Fj6DVq2v9zdwsS34-mibWWv9PuXlGdu1`: @mmarcos_s e
@clinicamsodontologia), os posts em tamanho cheio por `ferramentas/ig-post.py` e as fotos do Google.
- **Antes e depois:** o par do post da clínica "LENTES EM PORCELANA BL2" (`DCVN-PWRI-O`), no lugar das duas selfies.
  Legenda: "Lentes de contato em porcelana".
- **Dois casos novos em Resultados reais** (legenda embaixo da foto): "Lentes em resina" (post da clínica "LENTES EM
  RESINA BL1", `DJxzg9YxDYq`, girado para o sorriso ficar na horizontal: em cima com a resina, embaixo natural) e
  "Preenchimento labial" (post da clínica "1 ML · Realizado por Dr Marcos Silva", `DEkUN5LRF2e`, recorte horizontal).
  Os posts trazem o aviso de autorização do paciente (CFO 196/19), menos o do preenchimento, que só diz "realizado
  por". No preenchimento há dois pontinhos vermelhos do procedimento: a foto não foi retocada.
- **Carrossel "Tem técnica. Tem cuidado. Tem gente.":** saíram os 4 quadros de vídeo e a foto de evento de costas.
  Entraram a recepção (foto do Google), a parede verde com o logo (`DBFEFzxRNM1`), o Dr. de jaleco ao notebook no
  consultório (`DFZQ_gwRm3n`) e o curso de atualização com o certificado (post do Dr., "Esse final de semana, foi dia
  de buscar mais conhecimento"). Ficaram as 3 do ensaio (notebook, sofá, pensativo).
- Outras candidatas olhadas (para uma próxima troca): o par "lentes em resina" dos incisivos laterais
  (`C75WcBmx2FF`), o reel "Aquele antes & depois!" (`DDk6vW0SGle`, rosto inteiro, só em vídeo) e "+1 sorriso aqui no
  feed" (`CjIUYPvOBLP`).

## Entrega (cliente fechou)
Roteiro: `docs/fechamento.md`.

| | |
|---|---|
| Venda | R$ 500 · Pix · pago em 04/11/2026 (primeira venda da Renderiza) |
| Combinado | site a partir da demo aprovada, com os ajustes abaixo |
| Ajustes pedidos | 1. antes e depois invertido (versão 4; trocado por um par melhor na versão 5); 2. foto da resina (feito, versão 5) |
| Domínio | `msodontologiaitapevi.com.br`: registrado e publicado (registro.br, vence em 04/11/2027; DNS ainda os do registro.br) |
| Contas | Gmail de dev da clínica (o Kaue tem o acesso; não aparece no site), GitHub `msodontologiadev-sudo` e Vercel nessa conta |
| Hospedagem | Vercel (decisão do Kaue, 04/11/2026) |
| Repositório | github.com/msodontologiadev-sudo/msodontologia (público por enquanto). O Kaue subiu o .zip pela tela do GitHub em 05/11/2026 (arquivos na raiz). O app do Claude não está instalado na conta: para mudar o site daqui, instalar antes |
| No ar | **https://www.msodontologiaitapevi.com.br** desde 05/11/2026 (Vercel; conferido: igual ao gerado, 23 fotos, sem erro). A raiz redireciona para o www, mas o endereço oficial do site (canonical, prévia, sitemap) é sem www: na Vercel, deixar a raiz como principal |
| Demo | no ar até 11/11/2026 para ele ver os ajustes; depois fica no painel e no repositório da Renderiza |

- [x] 1 painel (Ganho, R$ 500, 04/11/2026) · [x] 2 levantamento · [ ] 3 ajustes (feitos na versão 5; falta o ok do Kaue e do cliente) · [x] 4 site.json
- [x] 5 gerar e conferir (05/11: conferência ok, 22 fotos, 1,2 MB) · [x] 6 repositório · [x] 7 hospedagem e domínio (05/11/2026)
- [ ] 8 conferência no ar · [ ] 9 entrega · [ ] 10 fechar na Renderiza

**Foto da resina e antes e depois novo**: procurados em 04/11/2026 sem achar. O Instagram sem login só mostra os 6
posts mais recentes de cada perfil (@clinicamsodontologia: memes e artes; @mmarcos_s: o ensaio e o Oscar), o site do
Canva só tem ícones e retratos, e o Google mostra 3 fotos (fachada, recepção e logo). Com o link do post
(Compartilhar → Copiar link), `ferramentas/ig-post.py <shortcode> <pasta>` baixa as fotos em tamanho cheio.
Onde entra a resina: decidir com a foto na mão (no "Resultados reais", como segundo caso, ou junto de "Lentes de
contato dental" nos tratamentos).

Conferir com ele (não trava a entrega): horário (Google: seg 9h–18h, ter 9h30–18h, qua a sex 9h–18h, sáb 9h–15h;
a arte da clínica: seg a sex 9h–19h, sáb 9h–15h), se a "avaliação gratuita" ainda vale, e a fonte de "+10 mil
casos" e "5 anos consecutivos melhor dentista de Itapevi".

**Vídeo de divulgação (cortesia, 05/11/2026):** `gravacoes/ms-odontologia-site.json` (o site no ar rolando no celular,
~35 s, música original, assinatura @clinicamsodontologia, legenda acima dos botões do Instagram). O MP4 fica em
`rascunhos/` e vai para o Dr. Marcos pelo WhatsApp; não vai ao ar.
**Versão em alta (10/11/2026, a pedido dele, para mandar como documento):** 1080 × 1920, crf 14, sem teto de taxa
(6,6 Mb/s, ~30 MB). Fica em `gravacoes/ms-odontologia-site.mp4` e para baixar em
https://www.renderizaweb.com.br/gravacao/ms-odontologia-site.mp4 (o `vercel.json` manda baixar em vez de tocar).
