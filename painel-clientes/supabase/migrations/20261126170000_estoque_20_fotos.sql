-- Estoque: até 20 fotos por item (26/11/2026; pedido da Ricardo Motors, com o "pode" da Renderiza). Era 15. Só a regra
-- muda (fica mais larga); nenhum item existente é tocado. O painel (MAX_FOTOS) e o script do site
-- (ferramentas/estoque/estoque.js) acompanham.

alter table public.estoque_itens drop constraint estoque_itens_fotos_check;
alter table public.estoque_itens add constraint estoque_itens_fotos_check
  check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 20);
