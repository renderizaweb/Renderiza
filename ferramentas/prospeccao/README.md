# Prospecção (busca de novos negócios para demo)

Linha usada no lote 3 de óticas (05/10/2026): 160 buscas no Google Maps → 2.643 lugares → 648 no filtro →
385 sem site funcionando → 123 com Instagram ativo → folhas de fotos → 22 + 7 escolhidas, conferidas uma
a uma. Os scripts rodam numa pasta de trabalho (ex.: a scratchpad), não no repositório: os arquivos
gerados (listas, fotos) **não** entram na `main`.

## Passo a passo

Na pasta de trabalho, copie `../maps-lista.mjs`, `../maps-lugar.mjs` e `../proxy.mjs` (os `.mjs` importam
o `proxy.mjs` da mesma pasta).

1. **Buscas no Maps** (`maps-lista.mjs`): escreva as buscas em `q0.txt` … `q5.txt` (uma por linha, ex.:
   `dentista em Tatuapé São Paulo`) e rode as 6 listas em paralelo:
   `for k in 0 1 2 3 4 5; do (mapfile -t Q < q$k.txt; node maps-lista.mjs lista$k.jsonl "${Q[@]}" > log$k.txt 2>&1 &); done`
   Cerca de 35 s por busca, 20 resultados cada. Acompanhe com `cat log*.txt | wc -l`.
2. **Filtro** (`filtrar.py`): junta as listas, tira repetidos (pelo id do lugar `0x…:0x…`), redes e
   franquias, nomes com 3+ unidades, quem já foi analisado, nota abaixo de 4,8 e menos de 40 avaliações.
   Gera `candidatos.jsonl`. Divida em 6 (`cand0.jsonl` …) para o passo 3.
3. **Detalhes** (`maps-lugar.mjs cand$k.jsonl det$k.jsonl`, 6 em paralelo): site, telefone, endereço,
   redes (Instagram/WhatsApp quando o Google mostra), atributos e se está fechado.
4. **Site** (`classificar.py`): classifica o site do Google (sem site, Instagram, Facebook, WhatsApp, link
   na bio, site simples, domínio) e testa os domínios. Fica quem **não** tem site próprio funcionando.
   Gera `det-all.jsonl`. Atenção: `000` no curl pode ser só bloqueio do proxy; confirme o DNS
   (`https://dns.google/resolve?name=<domínio>&type=A`) antes de concluir que o site morreu.
5. **Instagram** (`ig-etapa.py`): usa o @ que o Google mostra ou adivinha pelo nome (`../achar-ig.py`),
   lê o embed público do perfil (`../igembed.py`: seguidores, nº de posts, 6 últimos posts com data e
   legenda) e baixa as 6 fotos em `th/<@>/`. Gera `ig.jsonl`. Demora uns 30 min para ~400 perfis.
6. **Corte** (`juntar.py`): Instagram ativo (post nos últimos 45 dias), 1.000+ seguidores, 60+ posts.
   Gera `finalistas.json`, ordenado por seguidores.
7. **Folhas** (`folhas.py finalistas.json`): 7 perfis por folha, com os 6 últimos posts lado a lado. **Olhe
   todas** e avalie a olho: foto real (gente, dono, equipe, espaço) vale muito mais que arte pronta,
   promoção e banco de imagem.
8. **Conferir cada escolhida antes de entregar:**
   - o @ achado pelo nome é mesmo do lugar do Google? (cidade nas legendas, nome completo do perfil,
     busca na web). No lote 3, 8 eram de outra cidade ou país;
   - não tem site próprio (busca na web pelo nome + cidade e teste de domínios óbvios);
   - é uma unidade só (ou poucas) e não é franquia.

## Para outro nicho

Os scripts vieram das óticas. Antes de rodar para outro nicho, ajuste:
- `filtrar.py`: a expressão que reconhece o nicho (`otic|optic|oculos…`), a lista `redes` (redes e
  franquias do nicho) e a lista `ja` (quem já está no painel ou já foi analisado). Confira as faixas de
  nota e avaliações.
- `../achar-ig.py`: a lista `GEN` (palavras genéricas tiradas do nome antes de montar os @, ex.: para
  dentista `clinica|odontologia|odonto|dr|dra|dental|sorriso|consultorio`) e as variações de @.
- `juntar.py`: a expressão que confere se o perfil "parece do nicho" (`otic|optic|oculo…`) e os cortes de
  seguidores e posts.
