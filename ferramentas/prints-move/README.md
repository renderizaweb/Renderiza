# Prints das telas da Move (site público)

As telas do pop-up "Ver tela" (site/estatico/imagens/move/) saem do **app real** (`Kaue7almeida/move-web`),
rodando no computador com a API interceptada por **dados de exemplo** (Maria Santos, Rafael Personal…).
Nada vai ao banco real e nenhum dado de usuário aparece.

1. No move-web: `.env.local` com `NEXT_PUBLIC_SUPABASE_URL=http://supabase.falso.local` e qualquer
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `npx next dev -p 3100`.
2. Aqui: `node sonda.mjs "/app/chat?conversationId=c1" chat.png`, `node clique.mjs /app/treinos "text=Ver treino" treinos.png`,
   `node sonda2.mjs /app/acompanhamento painel.png` (personal), `node refeicao.mjs` (revisão da IA no Diário),
   `node sonda.mjs /app/scan/mock-latest scan.png` (exemplo que já vem no app).
3. Recorte e WebP: `node recorte2.mjs entrada.png saida.webp x y largura altura 540`.

`base.mjs` cria a sessão falsa e intercepta `/api/v1/**`; `dados.mjs` tem os dados de exemplo.
