// Escolher a conta: para quem é de mais de uma (a Renderiza, uma fotógrafa que também tem um espaço...). Quem não
// tem nenhuma ainda vê o caminho para criar a do negócio (o onboarding, /comecar). Layout das telas de acesso.

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS, voltaSegura } from "../rotas.js";
import { nicho } from "../nichos/index.js";
import { diasDeTeste } from "../sessao.js";
import { icone } from "../ui/icones.js";
import { escapar } from "../ui/formulario.js";
import { iniciais } from "../ui/formatos.js";

/** A etiqueta da situação da conta na lista. */
export function etiquetaDaConta(conta) {
  if (!conta.liberada) return { texto: conta.situacao === "teste" ? "Teste acabou" : "Bloqueada", classe: "rz-etiqueta--alerta" };
  const dias = diasDeTeste(conta);
  if (dias !== null) return { texto: dias <= 1 ? "Último dia de teste" : `Teste: ${dias} dias`, classe: "rz-etiqueta--destaque" };
  return null;
}

export async function montar(el, { sessao, navegar, ambiente }) {
  const busca = new URLSearchParams(location.search);
  const volta = voltaSegura(busca.get("volta"));
  const contas = sessao.contas();

  if (contas.length === 1 && !busca.has("trocar")) {
    sessao.escolherConta(contas[0].conta_id);
    return navegar(volta, { substituir: true });
  }

  // quem é da Renderiza e não é de nenhuma conta vai para o Admin (Missão 5A), não para o "criar a conta"
  if (!contas.length && sessao.eEquipeRenderiza()) return navegar("/admin", { substituir: true });

  if (!contas.length) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      rodape: `Entrou com o e-mail errado? <button class="rz-link" type="button" data-sair>Sair</button>`,
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("inicio", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Vamos criar a conta do seu negócio</h1>
          <p class="rz-texto-2">São 5 perguntas rápidas, e o painel já nasce com a cara do seu negócio. Você usa 7 dias de graça.</p>
        </div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" href="${TELAS.comecar.caminho}">Começar</a>
        </div>
        <p class="rz-texto-3 rz-acesso-nota">Recebeu um convite para a conta de alguém? Abra o link do e-mail do convite. Se ele venceu, peça um novo a quem convidou.</p>`,
    });
    focarTitulo(el);
    return;
  }

  el.innerHTML = telaDeAcesso({
    ambiente,
    rodape: `<button class="rz-link" type="button" data-sair>Sair</button>`,
    conteudo: `
      <div class="rz-acesso-cabeca">
        <h1 class="rz-titulo-1">Qual conta você quer abrir?</h1>
        <p class="rz-texto-2">Você faz parte de ${contas.length} contas. Dá para trocar depois, no menu.</p>
      </div>
      <ul class="rz-lista-contas">
        ${contas.map(c => {
          const etiqueta = etiquetaDaConta(c);
          const atual = sessao.conta() && sessao.conta().conta_id === c.conta_id;
          return `<li><button type="button" data-conta="${escapar(c.conta_id)}"${atual ? ' aria-current="true"' : ""}>
            <span class="rz-conta-sinal" aria-hidden="true">${escapar(iniciais(c.nome))}</span>
            <span class="rz-lista-contas-nome"><b>${escapar(c.nome)}</b><small>${escapar(nicho(c.nicho).nome)}${c.dono ? " · dono" : ""}</small></span>
            ${etiqueta ? `<span class="rz-etiqueta ${etiqueta.classe}">${escapar(etiqueta.texto)}</span>` : ""}
            ${icone("seta", { tamanho: 18 })}
          </button></li>`;
        }).join("")}
      </ul>`,
  });
  el.querySelector(".rz-lista-contas").addEventListener("click", e => {
    const b = e.target.closest("[data-conta]");
    if (!b) return;
    sessao.escolherConta(b.dataset.conta);
    navegar(volta, { substituir: true });
  });
  focarTitulo(el);
}
