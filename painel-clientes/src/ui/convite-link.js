// O convite por link (Missão 7, bloco B; D42), a peça comum do Admin (a conta nova, o link novo) e da Equipe: o código
// do link, o usuário sugerido pelo nome, a mensagem pronta e a folha "Mandar o acesso", com o WhatsApp e o copiar.
// O link é /boas-vindas/<código> (src/telas/boas-vindas.js); quem cria o login é a função aceitar-convite.

import { abrirFolha } from "./gaveta.js";
import { icone } from "./icones.js";
import { escapar } from "./formulario.js";
import { linkWhatsapp } from "./formatos.js";
import { ligarCopiar } from "./whatsapp.js";
import { DOMINIO_DO_USUARIO, FORMATO_DO_USUARIO } from "../sessao.js";

const LETRAS = "abcdefghijklmnopqrstuvwxyz0123456789";
const sorteio = n => crypto.getRandomValues(new Uint8Array(n));

/** Um código de link novo: 32 letras e números, sorteados. */
export function novoCodigoDeLink(aleatorio = sorteio) {
  return [...aleatorio(32)].map(b => LETRAS[b % LETRAS.length]).join("");
}

/** O usuário sugerido pelo nome do negócio ("Espaço Jardim" → "espacojardim"): minúsculas, sem acento, até 20. */
export function usuarioDoNome(nome) {
  const u = String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  return u.length >= 3 ? u : "";
}

/**
 * O usuário sugerido para alguém da equipe: o primeiro nome e as duas primeiras palavras do negócio ("Rafael",
 * "Villa Alecrim Eventos" → "rafael.villaalecrim"; "de", "da", "e"… não contam).
 */
export function usuarioDaPessoa(nome, negocio) {
  const limpo = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const primeiro = limpo(String(nome || "").trim().split(/\s+/)[0]).slice(0, 14);
  const deQuem = String(negocio || "").split(/\s+/).map(limpo).filter(w => w.length > 2).slice(0, 2).join("").slice(0, 15);
  const u = [primeiro, deQuem].filter(Boolean).join(".");
  return primeiro && u.length >= 3 ? u : "";
}

export const usuarioValido = u => FORMATO_DO_USUARIO.test(String(u || ""));
export const emailDoUsuario = u => `${u}@${DOMINIO_DO_USUARIO}`;
export const linkDoConvite = (codigo, origem = location.origin) => `${origem}/boas-vindas/${codigo}`;

/** A mensagem pronta para o WhatsApp. `novaSenha`: o link novo de quem esqueceu a senha. */
export function mensagemDoConvite({ nome, negocio, usuario, link, novaSenha = false }) {
  const oi = nome ? `Oi, ${String(nome).trim().split(/\s+/)[0]}!` : "Oi!";
  if (novaSenha) return `${oi} Aqui está o link para criar uma senha nova no Painel Renderiza${negocio ? ` (${negocio})` : ""}:\n${link}\n\nSeu usuário continua o mesmo: ${usuario}. O link vale por 7 dias.`;
  return `${oi} Aqui está o seu acesso ao Painel Renderiza${negocio ? ` do ${negocio}` : ""} 🎉\n${link}\n\nÉ só abrir o link e criar uma senha. Seu usuário: ${usuario}. O link vale por 7 dias.`;
}

/** A folha "Mandar o acesso": a mensagem à vista, o WhatsApp (do número, se houver) e os botões de copiar. */
export function abrirMandarConvite({ numero = "", nome, negocio, usuario, link, novaSenha = false }) {
  const mensagem = mensagemDoConvite({ nome, negocio, usuario, link, novaSenha });
  const whats = linkWhatsapp(numero, mensagem) || `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  const j = abrirFolha({
    titulo: novaSenha ? "Link para a senha nova" : "Mandar o acesso",
    corpo: `<div class="rz-pilha">
        <p class="rz-texto-2">${novaSenha ? "Mande pelo WhatsApp: com o link, a pessoa cria uma senha nova." : "Mande pelo WhatsApp: com o link, a pessoa cria a senha e já entra."} O link vale uma vez, por 7 dias.</p>
        <p class="rz-balao" data-mensagem>${escapar(mensagem)}</p>
        <a class="rz-botao rz-botao--primario rz-botao--bloco" href="${escapar(whats)}" target="_blank" rel="noopener">${icone("whatsapp")}${numero ? "Mandar no WhatsApp do negócio" : "Abrir o WhatsApp"}</a>
        <div class="rz-campos rz-campos--duas">
          <button class="rz-botao" type="button" data-copiar="${escapar(mensagem)}">${icone("copiar")}Copiar a mensagem</button>
          <button class="rz-botao" type="button" data-copiar="${escapar(link)}">${icone("link")}Copiar só o link</button>
        </div>
      </div>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Pronto</button>`,
  });
  ligarCopiar(j.el);
  return j;
}
