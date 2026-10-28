// Oferta com prazo dentro das demos (pedido do Kaue, 28/10/2026): nas demos dos espaços de eventos que ficaram no ar
// até 31/10, uma faixa no topo e um card de valor antes do rodapé, com o valor do mês de inauguração e o prazo. Os
// valores vêm do pacote Essencial de site/nichos/eventos.mjs (os mesmos da página /como-funciona/eventos). O build
// (scripts/montar-site.mjs, comOferta) põe a oferta só nas pastas da lista; o arquivo da demo não muda, e o vídeo,
// os flyers e as capturas (que usam o arquivo) continuam sem preço. Depois do prazo, o próprio card some.

import eventos from "./nichos/eventos.mjs";

const essencial = eventos.pacotes.find(p => p.id === "essencial");

export const OFERTAS = [
  {
    id: "inauguracao-eventos-2026-10",
    ate: "2026-10-31",
    // As 16 demos de eventos com prazo até 31/10 (o Kaue estendeu no painel em 27/10/2026).
    pastas: [
      "buffet-stallieri", "casa-le-charme", "casa-rabello", "casa-samanta-fonseca", "chacara-ouro-verde", "chacara-perracine",
      "che-belle-giardino", "espaco-banquett", "espaco-reserva-da-ilha", "espaco-thamara-d-valu", "ferreira-k-eventos",
      "o-poco-encantado", "sitio-francilene", "spazio-maia-buffet", "victors-buffet", "villa-la-feria",
    ],
    rotulo: "Mês de inauguração da Renderiza",
    titulo: "Este site pode ser seu",
    valor: essencial.inauguracao.valor,
    forma: essencial.inauguracao.forma,
    parcela: essencial.inauguracao.parcela,
    depois: essencial.preco.valor,
    inclui: [
      ...essencial.inclui,
      "Você pede os ajustes no texto e nas fotos antes de decidir",
      "No ar em até 7 dias úteis depois do pagamento",
    ],
    nota: eventos.pacotesNota,
    fecho: "Para garantir esse valor, é só responder a nossa mensagem no WhatsApp.",
  },
];

/** A oferta que vale para a demo (pela pasta), ou null. */
export const ofertaDaDemo = pasta => OFERTAS.find(o => o.pastas.includes(pasta)) || null;
