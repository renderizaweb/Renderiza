# Prompt para abrir uma sessão nova

Para colar em qualquer sessão nova do Claude que vai trabalhar no Painel Renderiza (inclusive em outro ambiente com as
variáveis `PAINEL_*`). Ele manda a sessão ler a documentação, conferir o que está em andamento e não se bater com as
outras. Atualize o item 2 ("Onde estamos") quando uma missão fechar.

```
Você vai trabalhar no Painel Renderiza: o sistema com login para os clientes da Renderiza (espaços de eventos e fotógrafas), com Supabase e Vercel. Repositório renderizaweb/Renderiza: o código fica em painel-clientes/ e a documentação em docs/painel-clientes/. Responda sempre em português, direto e curto, e não invente nada.

1. Antes de tudo, rode git fetch origin e leia, nesta ordem: docs/painel-clientes/README.md, 01-trilho.md, 08-trabalho-em-paralelo.md e missoes.md. Depois leia os documentos que a sua missão citar: 02 (produto), 03 (Meu site), 04 (arquitetura), 05 (dados e permissões, com o cliente no centro), 06 (privacidade), 09 (UX) e 10 (design system).

2. Onde estamos (29/10/2026):
- Missão 1, a parte do Claude, já está na main: o esqueleto em painel-clientes/ (todos os módulos e o Admin registrados, vazios), o script de migrações scripts/migrar.mjs (local → STG → produção), a Vercel no ar em painel.renderizaweb.com.br (e renderiza-painel-clientes.vercel.app), o design system em src/ui/ e as telas de entrar, esqueci a senha e nova senha.
- Falta da Missão 1: configurar o login do Supabase pela API (endereço do painel https://painel.renderizaweb.com.br, endereços de retorno com /nova-senha, senha mínima de 8) e o Brevo (e-mail), que fica para antes do piloto.
- Missão 2 liberada: bloco A (banco) e bloco B (telas). Outras sessões podem estar trabalhando nela.

3. Antes de pegar qualquer trabalho:
- Em missoes.md, confira a tabela "Situação", as "Notas de passagem", "Migrações aplicadas" e "Avisos entre sessões"; rode também git branch -r.
- Nunca pegue uma missão ou bloco que esteja "em andamento" em outra sessão.
- Se eu disser a missão, siga a nota de passagem dela. Se eu não disser, me proponha a próxima livre que não conflite com nada em andamento e espere o meu ok.

4. Regras que não mudam (detalhes no 08):
- Mexa só no "Mexe em" da sua missão ou bloco.
- Commits pequenos, começando com "M<n> ·"; push a cada pedaço que funciona; nota de passagem sempre em dia em missoes.md.
- Banco: as 5 variáveis PAINEL_* estão no ambiente (nunca mostre os valores). Toda mudança é migração; aplique pelo scripts/migrar.mjs, sempre no STG antes da produção, e registre em missoes.md. Nada destrutivo na produção sem eu dizer "pode". Nunca toque no banco do Painel de prospecção (variáveis SUPABASE_URL e SUPABASE_ANON_KEY).
- Telas: use as peças .rz-* e os tokens --rz-* de src/ui/ (10-design-system.md) e os exemplos em exemplos/ como especificação. Nada de cor ou tamanho solto no código.
- Não mexa nos /exemplos nem nas demos: eles continuam com dados fictícios e não levam ao painel.
- Nunca: chave ou senha no código ou no chat, dado real de cliente, identificador de modelo de IA nos commits.
- Não junte na main: deixe a branch com push e marque "pronta para subir" em missoes.md.
- Não me pergunte o que é operação da Renderiza (quem é admin, valores de proposta, como subir para a main). Pergunte só o que travar a missão.

5. No fim, me responda curto: o que fez, o que testou e o que eu preciso fazer.
```
