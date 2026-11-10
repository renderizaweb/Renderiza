# Vereador Mateuzinho Silva (Itapevi)

Indicação do Dr. Marcos (MS Odontologia). Pesquisa do nicho em `docs/nichos/vereadores.md`.

- **Situação:** demo versão 1 pronta em 10/11/2026, em `/demo/vereador-mateuzinho-silva`.
- **Painel:** lead `vereador-mateuzinho-silva` criado em 10/11/2026, com o ok do Kaue. Segmento "Política", etapa Prontas
  para trabalhar, código `ek9h`, tag "indicação Dr. Marcos". A demo ficou com o prazo automático de 7 dias
  (`vale_ate` 17/11/2026). O contador conta as visitas, as partes vistas, os cliques (Instagram, mapa e os botões
  `pedido-*`, inclusive "pedido-enviado" quando ele testa o formulário) e os outros aparelhos (repassou).
- **Preço:** nenhum na demo (a proposta não foi definida).
- **Gerar de novo:**
  1. `python3 -I ferramentas/demo/fotos-vereador.py demos/vereador-mateuzinho-silva <pasta>`: baixa as fotos pela
     "origem" de cada uma no `demo.json` (Drive do Kaue ou post público). Com `--tudo`, baixa também as 64 fotos do
     Drive e os carrosséis de todos os posts, para escolher outras.
  2. `python3 -I ferramentas/demo/gerar-vereador.py demos/vereador-mateuzinho-silva <pasta>/escolhidas`. O modelo
     fica em `ferramentas/demo/modelos/vereador.html`.
- **Dados no repositório** (públicos, para não pesquisar de novo):
  - `dados/proposituras.json`: as 685 proposituras dele no sistema da Câmara, com tipo, número, data, situação,
    assunto e protocolo da Prefeitura;
  - `dados/instagram.json`: 49 posts com legenda e número de fotos.

## Quem é (só fontes públicas)

- **Nome:** Mateuzinho Silva (nos documentos da Câmara: Mateus Andrade da Silva Santos). PL, número 22222 em 2024.
- **Eleição:** primeiro mandato (2025–2028). Teve 3.351 votos em 2024 e foi o 2º mais votado dos 17.
- **Câmara:** foi 3º Secretário da Mesa em 2025 (documento da Câmara). Não confirmei a Mesa de 2026, por isso a demo
  não cita o cargo.
- **Bio do Instagram:** "Jovem + votado da história · 3.351 votos · Gestão Pública · Engajado em causas sociais · Cristão".
  A demo não usa "jovem mais votado da história" nem "formado em Gestão Pública" porque não deu para confirmar.
- **Família e grupo:** o irmão, Thiaguinho Silva (Thiago da Silva Santos), foi presidente da Câmara e é vice-prefeito
  (2025–2028). O grupo político é o do prefeito Teco e do ex-prefeito Igor Soares. A demo não cita, para não misturar
  o mandato com o grupo. Pode entrar se ele quiser.
- **Fé:** congrega na Igreja Pentecostal Renovada em Cristo (post dele) e posta cultos, a Marcha para Jesus e versículos
  (Salmo 33:12, 2 Crônicas 7:14). A demo fala disso uma vez, em "Quem é", com uma frase dele: "A oração é a chave da
  vitória." O pedido do Kaue foi ter fé presente, sem exagero.
- **Cores dele:** roxo e verde-limão (posts com a assinatura "Mateuzinho Silva · Um olhar para a População"). A frase
  dele virou o título da capa.

## O mandato (sistema da Câmara, consulta em 10/11/2026)

- **Fonte:** `itapevi.siscam.com.br`, Vereadores → Mateus Andrade da Silva Santos (AutoriaId 14947): 686 proposituras.
  - 185 indicações (173 já encaminhadas à Prefeitura, com protocolo PMI);
  - 260 requerimentos;
  - 43 projetos de lei: 10 aprovados, 7 vetados, 11 arquivados, os demais em comissões;
  - 51 moções de aplauso e 91 votos de pesar.

  O sistema vai até 11/09/2026.
- **Projetos aprovados usados na demo:**
  - Dia da Mãe Atípica (PL 11/2025);
  - apoio psicológico às mães atípicas (PL 9/2025);
  - inclusão escolar com ABA para crianças com TEA (PL 179/2025);
  - Nossa Praça – Minha Cidade (PL 172/2025);
  - nomes de cinco ruas (PLs 350, 422, 423, 429 e 461/2025).
- **Em andamento na demo:**
  - remédios disponíveis e em falta nas unidades de saúde (PL 160/2026);
  - vagas de emprego (PL 168/2026);
  - "Não Se Cale" (PL 85/2026);
  - tampas de bueiro niveladas (PL 548/2025);
  - fios sem uso nos postes (PL 24/2026).
- **Ficaram de fora:** os projetos vetados ou arquivados (Festa Nordestina, Moeda Verde, vagas de zona azul para pessoas
  com deficiência e outros) e os de pauta ideológica (Dia do Conservadorismo, combate ao comunismo, sanções sobre aborto),
  porque a demo é para o morador comum. Ele decide se entram.
- **Indicações citadas:** 10527, 10379, 10376 e 10295/2026, com bairro e protocolo da Prefeitura. A Indicação nº 10704
  (fresagem) vem do post de 30/10/2026; ela ainda não aparece no sistema.

## Fotos (todas dele, do Instagram)

| Chave | Arquivo | De onde |
|---|---|---|
| capa | 2026-10-20-portas-abertas.jpg | post "Gabinete de portas abertas", 20/10/2026 (DeuXXbAFS-6, foto 1 de 6; o carrossel inteiro está em 2268 × 3024) |
| fresagem | 2026-10-30-fresagem.jpg | capa do vídeo da fresagem (Indicação 10704), 30/10/2026, cortada acima da legenda |
| moradores | 2026-11-05-moradores.jpg | post "Ouvindo as demandas", 05/11/2026 |
| retrato | 2026-10-27-plenario.jpg | carrossel da sessão de 27/10/2026 (DfA_V33o724, foto 4): ele na mesa do plenário, com a placa e o brasão da Câmara |
| fe | 2024-culto-dia-das-maes.jpg | post do culto de Dia das Mães, 2024 |
| b-* | 2024-*.jpg | visitas aos bairros (feira do Parque Suburbano, comércio do Centro, Arena Mirante, Dona Elvira e Jardim Itaparica, Jardim São Carlos, Nova Itapevi) |

- **Origem dos arquivos:**
  - os de 2024 vêm da página do Instagram salva no Drive do Kaue (pasta `1Tz1sxvcxMPkpgf2JSp5moGdrIDApXxyu`);
  - os de 2026 vêm do embed público do perfil.
- **Fora da demo:** material de campanha ("Agora é Mateuzinho", convenção, número), o vídeo de Flávio Bolsonaro e
  Tarcísio (marcado "propaganda eleitoral") e as artes com texto.

## O que a demo tem

1. **Capa:** "Um olhar para a população.", a foto do gabinete de portas abertas, os votos e as indicações.
2. **O mandato em números**, com a fonte e a data da consulta.
3. **Do pedido à rua:** a fresagem da Indicação 10704 e a visita do WhatsApp, mais as 4 indicações recentes com a
   situação.
4. **Pedido do bairro:**
   - o formulário (tipo, bairro, rua, descrição, foto, nome, WhatsApp e aceite da LGPD) gera um número e uma linha do
     tempo;
   - o "acompanhe" mostra a Indicação 10379/2026 de verdade;
   - na demo nada é enviado: o aviso está na página.
5. **Projetos:** os aprovados e os em andamento.
6. **Pelos bairros:** as visitas.
7. **Quem é:** o primeiro mandato, os valores (ouvir, cuidar, prestar contas) e a fé.
8. **Gabinete de portas abertas:** terças, depois da sessão, com o mapa da Câmara e o Instagram.

Nada pede voto nem mostra o número de urna (Lei 9.504, art. 36-A).

## A confirmar com ele

- **Contato:** o WhatsApp oficial do gabinete (a demo usa o pedido pelo site e o Instagram) e o endereço do gabinete.
- **História:** a formação, onde cresceu e como quer ser apresentado.
- **Bandeiras e conteúdo:** as bandeiras que quer destacar e se os projetos de pauta conservadora entram.
- **Igreja:** se quer citar a igreja pelo nome.
- **Fotos:** fotos originais em alta, principalmente um retrato dele sozinho (o Kaue citou uma do gabinete postada em 10/11,
  que ainda não aparecia no embed público).
