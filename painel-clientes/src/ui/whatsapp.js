// WhatsApp num toque (09): "Chamar no WhatsApp" com a mensagem pronta (link wa.me) e "Copiar mensagem", para
// lembrete e cobrança. O painel não manda mensagem sozinho: abre o WhatsApp de quem está usando.

import { icone } from "./icones.js";
import { escapar } from "./formulario.js";
import { linkWhatsapp } from "./formatos.js";
import { avisar } from "./aviso.js";

/** Os dois botões. Sem número, só o "Copiar mensagem". */
export function botoesWhatsapp(numero, mensagem = "", { rotulo = "Chamar no WhatsApp" } = {}) {
  const link = linkWhatsapp(numero, mensagem);
  return `<div class="rz-whatsapp">
      ${link ? `<a class="rz-botao" href="${escapar(link)}" target="_blank" rel="noopener">${icone("whatsapp")}${escapar(rotulo)}</a>` : ""}
      ${mensagem ? `<button class="rz-botao rz-botao--fantasma" type="button" data-copiar="${escapar(mensagem)}">${icone("copiar")}Copiar mensagem</button>` : ""}
    </div>`;
}

/** Liga os botões de copiar dentro de `el` (qualquer [data-copiar]). */
export function ligarCopiar(el) {
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-copiar]");
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copiar);
      avisar("Mensagem copiada. É só colar no WhatsApp.");
    } catch (erro) {
      avisar("Não consegui copiar. Selecione o texto e copie.", { tipo: "erro" });
    }
  });
}
