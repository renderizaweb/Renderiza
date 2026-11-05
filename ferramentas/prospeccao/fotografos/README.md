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
