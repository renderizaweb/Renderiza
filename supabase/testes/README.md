# Testes do banco da prospecção (Postgres local)

Para conferir `supabase/termos-online.sql` sem tocar a produção. `supabase-minimo.sql` imita o que o Supabase traz
(papéis, `auth.uid()`, pgcrypto em `extensions`) e as tabelas do `schema.sql` que os termos usam.

```
# um Postgres de teste (ex.: o 16 do Ubuntu), numa pasta que o usuário postgres alcance
initdb -D /var/tmp/pg -A trust -U postgres && pg_ctl -D /var/tmp/pg -o "-p 54329 -k /var/tmp" -l /var/tmp/pg.log start
P="psql -h /var/tmp -p 54329 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "create database novo"
$P -d novo -f supabase/testes/supabase-minimo.sql
$P -d novo -f supabase/termos-online.sql
$P -d novo -f supabase/testes/termos-de-lead.sql      # termina com "termos de lead: tudo certo"
```

Para testar a atualização de um banco antigo (como a produção estava): rodar a versão anterior do
`termos-online.sql` (`git show <commit>:supabase/termos-online.sql`), criar o termo do vereador com o texto vazio e a
contratada preenchida, rodar o arquivo novo (duas vezes, para ver que é idempotente) e os testes. O teste 8 confere que
o termo do vereador continua assinando com os planos dele.
