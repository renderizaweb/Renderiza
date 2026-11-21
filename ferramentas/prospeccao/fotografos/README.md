# Prospecção de fotógrafas (família, gestante, newborn e infantil)

Scripts do lote 2 (05/11/2026). Critérios, funil e lições em `docs/nichos/fotografos.md`; a lista do lote 2 em
`docs/nichos/fotografos-lote2.md`. Rode tudo numa pasta de trabalho (a scratchpad), nunca no repositório, com
`maps-lista.mjs`, `maps-lugar.mjs` e `proxy.mjs` (de `ferramentas/`) e `sinais.mjs` e `ler_sinais.py` (de `../`) copiados para lá.

1. `montar_q.py` → `q0.txt` … `q5.txt` (5 termos girando por bairros e cidades); rode as 6 filas do `maps-lista.mjs`
   como no `../README.md` (~25 min para 166 buscas de 120 resultados).
2. `filtro_foto.py` → `candidatos.jsonl`: categoria do card, exclusões pelo nome, nota 4,7+, 15 a 150 avaliações, fora o
   lote 1 (pelo id do lugar). **Para o lote 3, acrescente em `L1` os ids das escolhidas do lote 2.**
3. Confira primeiro o site do card (`checa_site.py`, com `site` = `site_card`): quem tem site funcionando sai sem precisar
   dos detalhes. Depois `maps-lugar.mjs` só para o resto e `checa_site.py` de novo nos detalhes (marque `passa_site`).
4. `ig_foto.py site.jsonl ig.jsonl` (FILAS=5; retoma de onde parou): @ do Google ou variações do nome no embed
   (`igler.py`, com foto do perfil e local dos posts). Uns 40 min para 440 lugares.
5. `proximas.py <prefixo>`: corte (`juntar_foto.py`: 1 a 30 mil, post em 30 dias, sinais de Natal e da cidade) e folhas
   (`folha_foto.py`, 5 perfis por folha) só de quem ainda não tem nota. **Olhe cada folha** e grave a nota em `notas.jsonl`
   (`{"ig", "f": 0 a 5, "c": comentário, "fora": motivo}`; o comentário "dona com rosto" vale ponto).
6. Avaliações (`sinais.mjs`, 4 filas) das notas 4+; `dominios_foto.py` (domínios óbvios com e sem www) e `abrir.mjs`
   (abre no Chromium e tira captura) para conferir de quem é cada domínio; o que for confirmado vai em `extra.json`
   (`site_morto`, `site_txt`, `dona`, `equipe`).
7. `pontua_foto.py` → `ranking.json`, com a fórmula aberta no topo do arquivo.

Daqui a busca na web não funciona (DuckDuckGo pede captcha, Google bloqueia): a cidade do @ se prova pelo local dos posts,
pelo 📍, pelo telefone do Google nas legendas ou por um site com o @.

## Lote 4 (21/11/2026): a régua do estudo de quem esquentou

Critérios e estudo em `docs/nichos/fotografos.md` (seção 11); a lista em `docs/nichos/fotografos-lote4.md`. Copie para a
pasta de trabalho estes scripts, mais `../ler_sinais.py`, `../sinais.mjs`, `../../maps-lista2.mjs`, `../../maps-lugar2.mjs`,
`../../proxy.mjs` e `../../igembed.py`.

0. **Estudo** (opcional, para rever a régua): `estudo-baixar.mjs` baixa do painel os leads, as interações e as visitas
   (login do painel, como o `scripts/relato.mjs`); `estudo-engajamento.mjs` dá o tempo de cada lead de fotografia, só das
   clientes. `ja_painel.py leads.json <repositório>` gera o `ja.json` (quem já está no painel ou nos lotes).
1. `montar_q4.py` → `q0.txt` … `q6.txt` (8 termos, de "fotógrafa em" a "fotógrafo de eventos em", por 110 lugares). Rode as
   filas com `maps-lista2.mjs` (**5 filas**; com 7, o Chromium antigo estourou a memória).
2. `filtro4.py` → `candidatos.jsonl` (categoria, nome, nota 4,8+, 15 a 250 avaliações, fora o `ja.json`).
3. `checa_site.py` com o site do card; `reclass.py` separa a **página grátis em subdomínio** (Alboom, 46graus, Adobe
   Portfolio, Canva, Wix, Google Sites), que **passa**. Detalhes (`maps-lugar2.mjs`) só de quem não tem site funcionando;
   depois `etapa_site.py` confere o site dos detalhes e grava `site.jsonl`.
4. `ig_foto.py site.jsonl ig.jsonl` (FILAS=6), `ig_site.py` (segunda passada: o @ que está na página do site) e
   `recupera.py` (terceira: a página na Alboom pelo nome ou pelo domínio morto, só com o telefone do Google na página, e o
   @ igual ao domínio; grava `rec.jsonl`, que entra no lugar de quem estava sem @).
5. `juntar4.py ig.jsonl fin.json AAAA-MM-DD` (1 mil a 15 mil, post em 30 dias, sinais do estudo e a pré-nota) e
   `folhas4.py fin.json <prefixo>` (só quem ainda não tem nota em `notas.jsonl`). **Olhe as folhas** e grave a nota.
6. `pendentes.py` separa as aprovadas (3,5+) sem avaliações lidas (`sin*.jsonl`, para o `sinais.mjs`) e sem domínios
   testados (`dom_in.json`, para `dominios_foto.py` e `alboom.py`).
7. `pontua4.py` → `ranking.json`, com a fórmula aberta no topo. O que for lido à mão (dona, equipe, site conferido no
   navegador, "fora") vai num `extra.py` da pasta de trabalho (fora do git). **Antes de entregar**, confira à mão as 30
   primeiras: o @ (o da página do site vale mais que o achado pelo nome), o celular, a cidade e o site morto no navegador.
