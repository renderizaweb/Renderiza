// O contato da Renderiza nas telas (o mesmo WhatsApp da página de venda, exemplos/index.html).

export const WHATSAPP_DA_RENDERIZA = "5511988697165";

export function linkDaRenderiza(mensagem = "Oi! Quero conhecer o Painel Renderiza.") {
  return `https://wa.me/${WHATSAPP_DA_RENDERIZA}?text=${encodeURIComponent(mensagem)}`;
}
