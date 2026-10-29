// Ícones do painel: traço de 1,75 em 24 × 24, desenhados aqui (sem dependência). Sempre decorativos
// (aria-hidden): o texto ao lado, ou o aria-label do botão, é que diz o que é. Novo ícone: mesmo estilo, nome em
// português (docs/painel-clientes/10-design-system.md).

const DESENHOS = {
  olho: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  olhoFechado: '<path d="M3.5 3.5l17 17"/><path d="M10.4 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.9 3.7M6.7 6.8C4.1 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/>',
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  okCirculo: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.3l2.6 2.6 5-5.3"/>',
  carta: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.8 7.2l8.2 5.8 8.2-5.8"/>',
  cadeado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  maiusculas: '<path d="M12 4.5l7 7.5h-4v4H9v-4H5z"/><path d="M9 19.5h6"/>',
  voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  conversa: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14.5h4"/>',
  carteira: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/><circle cx="16.5" cy="14" r="1.3"/>',
  contrato: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 14.5l2 2 4-4"/>',
  agenda: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
};

/** `<svg>` do ícone. `tamanho` em px; `classe` para posicionar. */
export function icone(nome, { tamanho = 20, classe = "" } = {}) {
  const desenho = DESENHOS[nome];
  if (!desenho) throw new Error(`Ícone desconhecido: ${nome}`);
  return `<svg class="rz-icone${classe ? " " + classe : ""}" viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" aria-hidden="true" focusable="false">${desenho}</svg>`;
}

export const ICONES = Object.keys(DESENHOS);
