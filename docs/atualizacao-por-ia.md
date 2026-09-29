# Atualização dos leads pela IA, a partir do seu relato

Você conta o que aconteceu no dia (texto ou voz). Um assistente de IA com acesso autorizado ao
Supabase transforma o relato em um **plano**, confere, grava e devolve um resumo curto.
A IA **não lê o seu WhatsApp**: tudo vem do que você relatar.

> **Situação:** o fluxo foi testado só localmente (Postgres 16 + PostgREST imitando o Supabase,
> com login e RLS). **Ainda não foi testado em um projeto Supabase real.** O que falta para
> conectar está no fim deste documento.

## O fluxo

1. **Relato.** Ex.: "Hoje prospectei as óticas A, B e C. A B pediu para receber o vídeo. A C falou
   para eu procurá-la na quinta. Também retomei contato com a ótica D e ela disse que vai decidir
   no mês que vem."
2. **Achar as óticas certas.** Para cada nome: `node scripts/relato.mjs buscar "nome"`.
   - Um resultado claro: usa o `id` dele.
   - Nenhum: é ótica nova no painel.
   - Mais de um, ou nome só parecido (ex.: duas "Ótica Estrela" em cidades diferentes):
     **pergunta antes de gravar**.
3. **Montar o plano** (formato abaixo) seguindo as regras de interpretação.
4. **Simular:** `node scripts/relato.mjs simular plano.json`. Faz tudo dentro do banco, mostra o
   resultado e desfaz. Se houver dúvida, mostra a simulação a você antes de aplicar.
5. **Aplicar:** `node scripts/relato.mjs aplicar plano.json`. É uma transação só: ou grava tudo,
   ou nada.
6. **Responder com o resumo** que o script imprime, por exemplo:

```
Gravado:
- Ótica Aurora (nova no painel): primeiro contato em 25/09; follow-up 02/10
- Ótica Bela Vista: primeiro contato em 25/09; resposta em 25/09 → Interessado; interesse Não avaliado → Interessado; follow-up — → 26/09; próxima ação: "Mandar o vídeo"
- Ótica Cristal (nova no painel): primeiro contato em 25/09; resposta em 25/09; follow-up 01/10
- Ótica Delta: retorno feito em 25/09; resposta em 25/09; follow-up 17/09 → 05/10; próxima ação: "Perguntar da decisão"
Placar: +3 ótica(s) nova(s), +1 retorno(s) feito(s).
```

## Regras de interpretação (para o assistente)

**Só o que aconteceu vira interação.** O que vai acontecer vai em `proxima_acao` e `followup_em`.

| No relato | Registro |
|---|---|
| "prospectei X", "mandei a demo para X" (X sem primeiro contato) | `primeiro_contato` |
| "prospectei X", mas X **já tem** primeiro contato | **não é ótica nova**: é `retorno`. Na dúvida, pergunte |
| "retomei contato", "mandei de novo", "cobrei", "liguei de novo" | `retorno` |
| "X respondeu / pediu / disse / falou" | `resposta` (nunca conta como retorno seu) |
| algo pontual que vale guardar | `anotacao` |
| "conversei com X há uns meses", conversa antiga no WhatsApp | `primeiro_contato` com `precisao: "aproximada"` (mês, dia 1) ou `"desconhecida"` (sem data). Nunca `exata` sem você dizer o dia |

**Datas.** "Hoje" é o dia do relato (`data` do plano). "Ontem" é o dia anterior. Interação com
data futura é recusada pelo banco. "Na quinta" vira a próxima quinta depois do relato; se puder
ser outra, pergunte.

**Interesse** (`nao_avaliado`, `interessado`, `perto_de_fechar`) muda só com evidência clara:
- `interessado`: pediu vídeo, orçamento ou mais informações, ou quer ver a demo;
- `perto_de_fechar`: falou em fechar, pediu contrato ou forma de pagamento, ou combinou começar;
- silêncio, "vai pensar", "vai decidir mês que vem": **não muda**. Silêncio nunca vira interesse baixo.

Quando mudar, coloque `interesse` na interação que justifica. O banco atualiza a ótica e usa o
resumo como motivo (visível e corrigível no painel).

**Próximo passo.**
- Combinou uma data: use essa data em `followup_em`.
- Não respondeu: `"followup_em": "cadencia"`. O banco calcula 1º retorno em ~7 dias e 2º retorno
  em ~21 dias depois do primeiro contato (ajustável no ciclo). Depois disso, sem data: fica em espera.
- Pediu para não receber mais contato: `"nao_contatar": true`. Registre também a resposta. O
  follow-up é apagado e a ótica sai da fila.
- Sem informação suficiente: não mexa em `followup_em`. Diga isso no resumo.

**Etapa não muda** por causa de contato ou de interesse. Só mude `etapa` (e `resultado` etc. ao
finalizar) se você pedir explicitamente.

**Dúvida que pode alterar a linha errada** (nome repetido, ótica parecida, "a ótica do centro"):
pergunte antes de gravar. O banco recusa ótica nova com nome igual a uma existente. Para gravar
mesmo assim, só depois de você confirmar que é outra ótica (`"permitir_nome_repetido": true`).

## Formato do plano

```json
{
  "data": "2026-09-25",
  "itens": [
    {
      "lead": { "novo": { "empresa": "Ótica Aurora", "cidade": "Santo André" } },
      "interacoes": [{ "tipo": "primeiro_contato", "canal": "whatsapp", "resumo": "Mandei a demo" }],
      "atualizar": { "proxima_acao": "1º retorno", "followup_em": "cadencia" }
    },
    {
      "lead": { "id": "66d56636-…" },
      "interacoes": [
        { "tipo": "primeiro_contato", "resumo": "Mandei a demo" },
        { "tipo": "resposta", "resumo": "Pediu para receber o vídeo", "interesse": "interessado" }
      ],
      "atualizar": { "proxima_acao": "Mandar o vídeo", "followup_em": "2026-09-26" }
    }
  ]
}
```

- `lead`: `{"id": ...}` para ótica existente ou `{"novo": {"empresa", "cidade", "whatsapp", "instagram", "segmento", "etapa"}}`.
- `interacoes[]`: `tipo`, `resumo` (curto), e opcionais `canal` (`whatsapp`, `telefone`,
  `instagram`, `email`, `presencial`, `outro`), `ocorreu_em` (padrão: `data`), `precisao` e `interesse`.
- `atualizar`: só `proxima_acao`, `followup_em` (data, `"cadencia"` ou `null`), `interesse`,
  `interesse_motivo`, `nao_contatar` e, se você pedir, `etapa`, `resultado`, `valor_fechado`,
  `motivo_perda` e `data_fechamento`. Qualquer outro campo é recusado.

## O que o banco garante (mesmo que a IA erre)

Tudo em `supabase/schema.sql`, com as mesmas regras para o painel, a IA e o SQL Editor:
- uma ótica tem **um** primeiro contato, então conta uma vez só como nova;
- retorno exige primeiro contato antes (e não pode ser anterior a ele);
- nenhuma interação com data futura;
- data aproximada ou desconhecida só no primeiro contato, e nunca conta como ótica nova;
- ótica nova com nome igual a uma existente é recusada;
- o plano inteiro roda numa transação: se um item falhar, nada é gravado;
- RLS: o assistente entra com o seu login e só enxerga e altera as suas linhas.

## O que falta para conectar

1. Projeto Supabase com `supabase/schema.sql` rodado (o mesmo passo do README) e o seu usuário criado.
2. No ambiente onde o assistente roda (nunca no navegador e nunca no git), as variáveis:
   - `SUPABASE_URL` e `SUPABASE_ANON_KEY` (a chave **pública**; o script recusa a `service_role`);
   - `RENDERIZA_EMAIL` e `RENDERIZA_SENHA`: o login do painel.
   No computador, podem ficar em `.env.local`, na raiz do repositório, que já é ignorado pelo git. No
   Claude Code na web, cadastre-as como segredos do ambiente.
3. Acesso de rede do ambiente do assistente ao seu `https://<projeto>.supabase.co` (no Claude
   Code na web, a política de rede do ambiente precisa permitir esse endereço).
4. Rodar uma vez `node scripts/relato.mjs buscar "a"` para confirmar login e acesso.

**Alternativa:** um conector do Supabase (MCP) que rode SQL também funciona. Ele costuma entrar
como administrador e pular o RLS, então antes de chamar a função é preciso dizer quem é o usuário:
`select set_config('request.jwt.claims', '{"sub":"<seu-uuid>","role":"authenticated"}', true);`
e depois `select renderiza_aplicar_relato('<plano>'::jsonb, true);` (simulação) ou `false` (aplicar).
Prefira o script: com ele, o acesso é o do seu login, com RLS.
