# Joel Santos Fotografia (Fotógrafo em Santana de Parnaíba)

| | |
|---|---|
| Onde | Av. Cândido Portinari, 905a - Colinas da Anhanguera, Santana de Parnaíba - SP, 06537-001 (endereço do Google; a página mostra só o bairro e a cidade, sem "Como chegar": ele fotografa onde o casamento acontece) |
| Instagram | [@fotografoemsantanadeparnaiba](https://www.instagram.com/fotografoemsantanadeparnaiba/) ("Joel Santos \| Fotógrafo - Santana de Parnaíba SP") · 1,9 mil seguidores (1.911 em 22/11/2026), 1.199 posts, último post em 23/11/2026 |
| Google | "Fotógrafo em Santana de Parnaíba", fotógrafo de casamento · nota 4,9 · 131 avaliações (69 por mil seguidores) · conferido em 23/11/2026 |
| WhatsApp | (11) 91331-0830 · celular do Perfil da Empresa no Google |
| Site | não tem: o Google aponta a página grátis dele no Adobe Portfolio (fotografoemsantanadeparnaiba.myportfolio.com, "Joel Santos Fotografias", só com o botão do WhatsApp) |
| Entregável | **portfólio online, versão 4** (23/11/2026): `index.html` (a vitrine) e uma página por ensaio (`casamento`, `civil`, `pre-wedding`). Sai de `ferramentas/demo/gerar-portfolio.py demos/joel-santos-fotografo <pasta dos originais>`; textos, fotos e pacotes no `demo.json` (`portfolio`) |
| Oferta na demo | R$ 399 no Pix ou parcelado no crédito, pagamento único (o portfólio fica 100% dele, sem mensalidade); promoção de uma semana, até 30/11/2026 (`renderiza.valido_ate` no `demo.json` e `demos.vale_ate` no painel) |
| Painel | lead `joel-santos-fotografo` (código `er8b`) |

## Direção
- Lote 4 de fotógrafos (nº 21 de 40, 90 pontos). **Dono: Joel Santos** (homem; as avaliações citam só o Joel). Todo o texto está no masculino ("o Joel", "fotógrafo", "Sou o Joel" nas mensagens da Renderiza).
- Personalidade: fotógrafo de casamento, com edição quente de filme e muito ensaio ao ar livre. Na página: fundo off-white, Libre Caslon Display nos títulos, Hanken Grotesk no texto, "fotografia" em Herr Von Muellerhoff (letra de assinatura), verde-oliva nos botões. Ícone da aba: monograma JS. A marca vem da legenda dele ("É isso que a Joel Santos Fotografia entrega").
- Ensaios pelo que ele vende (bio "Casamentos e eventos reais", categoria do Google, avaliações e a hashtag #CasamentoCivil): casamento, casamento civil e mini wedding, e pré-wedding (que ele oferece como bônus com "direcionamento completo"). Sem Natal (não divulgou).

## Fotos (39 escolhidas de 229 originais sem repetição, uma a uma, na folha de contato grande)
- **Fontes**: (1) a grade salva no Drive ("lote 22 do 11"), que tem os posts de 15 a 22/04/2026; (2) os carrosséis completos desses posts pelo embed público (`ferramentas/ig-post.py`); (3) as capas dos 6 posts de 23/11/2026 (um casamento ao ar livre com o carro antigo), em 4096 px.
- **De quem são**: a página salva é a dele (og:url, bio e nome); as fotos vêm dos posts da grade e dos carrosséis dele.
- **Por ensaio** (a ordem está no `demo.json`): casamento 14 (a noiva com o buquê, a igreja, o altar, as alianças com o terço, o making of, o casamento ao ar livre de 23/11), civil e mini wedding 11 (o arco de flores, o violão, a estufa, a família no bosque, a mesa da recepção), pré-wedding 14 (o guarda-chuva, os balões de coração, a locomotiva antiga, o coreto, o campo). Quem fotografa: duas cenas dos ensaios dele (a câmera antiga e o coreto); não há foto pública dele.
- **Ficaram de fora**: o noivo com carros estacionados atrás, a noiva no celular no making of, as fotos de grupo com dezenas de convidados, a bandeira do Brasil, as fotos de outra conta (nenhuma achada) e as repetidas.
- **Tratamento**: do original, sem ampliar e sem recorte; 1400 px no lado maior (1920 na abertura de cada ensaio), JPEG progressivo, qualidade 82.

## Textos
- Dele (Instagram): "casamentos acontecem uma única vez" (o título da vitrine); "Seu casamento acontece uma vez… mas as memórias precisam durar para sempre"; "Enquanto a música toca, as lágrimas rolam e a vida acontece, nós capturamos cada segundo que importa"; "Cada momento é irrepetível"; "Cada casamento recebe atenção exclusiva, sem produção em massa"; "garantindo fotos naturais, elegantes e inesquecíveis"; "Você não está apenas contratando um fotógrafo… Você está escolhendo como sua história será lembrada"; "📸 Conversamos?"; e as cidades que ele atende (Santana de Parnaíba, Cajamar, Jundiaí e Barueri).
- Avaliações do Google (as 5 que o Google mostra sem login, lidas inteiras em 23/11; erros de digitação corrigidos, sem mudar o sentido): alleson maia fala do casamento; Jaine Machado, da cobertura do "dia mais importante" (civil e mini wedding); Dyy, do pré-wedding; Duda Rocha (o Google marca "Casamentos e noivados") e Francielle Souza ficam na vitrine.
- A nota 4,9 não aparece em número (regra: só a 5,0); a página mostra as estrelas e as 131 avaliações.
- **Não são dele** (mostrar na validação): os pacotes e os valores, que são EXEMPLOS e levam o selo "Pacotes e valores de exemplo: você coloca os seus".

## Conferir com ele
- **"Nossa equipe"**: a página do Adobe Portfolio diz que a equipe oferece espaço para eventos, bufê, assessoria, decoração, filmagem e DJ, e as legendas falam em "nós". Confirmar se ele trabalha sozinho ou com parceiros.
- A foto do perfil do Instagram é de um casal de clientes, não dele.
- Os casamentos de abril e o de 23/11: todos publicados por ele como portfólio. Vale confirmar se podem ficar todos.

## Gerar de novo
- `python3 ferramentas/demo/gerar-portfolio.py demos/joel-santos-fotografo [<pasta dos originais>]`. Sem os originais, o gerador reaproveita as fotos já tratadas das páginas (dá para mudar texto e preço); para trocar foto, baixar de novo (posts pelo `ig-post.py`).
- Conferir: `node ferramentas/demo/conferir-portfolio.cjs <pasta de capturas> joel-santos-fotografo` (passou sem problema em 23/11/2026, nas larguras 390, 1280 e 1440).
