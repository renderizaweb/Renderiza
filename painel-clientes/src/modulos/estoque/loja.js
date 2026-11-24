// A loja do Estoque no banco (estoque_itens, 12 "Contrato v1"): a lista inteira da conta fica na memória (uma revenda
// tem dezenas de carros, não milhares) e cada mudança vai ao banco com a sessão de quem entrou (a RLS decide). As
// fotos vão ao bucket site-imagens em duas medidas, feitas no aparelho: a grande (1600 px, a página do carro) e a
// pequena (640 px, o card e esta lista). O site só baixa a grande quando abre o carro.

export const BUCKET = "site-imagens";
const COLUNAS = "id,situacao,destaque,ordem,preco,preco_antes,quantidade,campos,selos,descricao,fotos,codigo_interno,vendido_em,criado_em,atualizado_em";
const EDITAVEIS = ["situacao", "destaque", "ordem", "preco", "preco_antes", "quantidade", "campos", "selos", "descricao", "fotos", "codigo_interno"];

/** O endereço da foto para mostrar no painel (o mesmo caminho que o site usa, servido pelo próprio painel). */
export const urlDaFoto = (f, medida = "mini") => (f ? "/api/publico/imagens/" + ((medida === "mini" && f.mini) || f.arquivo) : "");

/** A ordem do site e da lista: destaque, a ordem e o mais novo. */
export function ordenar(itens) {
  return [...itens].sort((a, b) => (b.destaque - a.destaque) || ((a.ordem || 0) - (b.ordem || 0)) || String(b.criado_em || "").localeCompare(String(a.criado_em || "")));
}

/** Reduz no aparelho e converte para WebP (lado maior `lado`). Devolve { blob, w, h }. */
export async function paraWebp(arquivo, lado, qualidade = 0.82) {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(imagem.width * escala);
  tela.height = Math.round(imagem.height * escala);
  tela.getContext("2d").drawImage(imagem, 0, 0, tela.width, tela.height);
  const blob = await new Promise(r => tela.toBlob(r, "image/webp", qualidade));
  if (!blob || blob.type !== "image/webp") throw new Error("Este aparelho não conseguiu converter a foto. Tente outra, ou outro navegador.");
  if (blob.size > 2 * 1024 * 1024) throw new Error("A foto ficou grande demais. Tente uma menor.");
  return { blob, w: tela.width, h: tela.height };
}

export function criarLoja({ banco, conta }) {
  let itens = [];
  const ouvintes = new Set();
  const avisar = () => ouvintes.forEach(f => f(itens));
  const tabela = () => banco.tabela("estoque_itens");
  const so = (obj, campos) => Object.fromEntries(campos.filter(c => obj[c] !== undefined).map(c => [c, obj[c]]));
  const trocar = linha => { const k = itens.findIndex(i => i.id === linha.id); if (k >= 0) itens[k] = linha; else itens.push(linha); itens = ordenar(itens); };

  return {
    async carregar() {
      itens = ordenar(await banco.resultado(tabela().select(COLUNAS).eq("conta_id", conta.conta_id)));
      avisar();
      return itens;
    },
    listar: () => itens.slice(),
    achar: id => itens.find(i => i.id === id) || null,
    /** Cria (sem id) ou grava o item inteiro. Devolve a linha do banco. */
    async salvar(item) {
      const dados = so(item, EDITAVEIS);
      const linha = item.id
        ? await banco.resultado(tabela().update(dados).eq("id", item.id).eq("conta_id", conta.conta_id).select(COLUNAS).single())
        : await banco.resultado(tabela().insert({ ...dados, conta_id: conta.conta_id, esquema: conta.nicho }).select(COLUNAS).single());
      trocar(linha);
      avisar();
      return linha;
    },
    /** Uma mudança pequena (situação, destaque): a lista muda na hora e volta se o banco recusar. */
    async mudar(id, patch) {
      const antes = itens.find(i => i.id === id);
      if (!antes) return null;
      trocar({ ...antes, ...patch });
      avisar();
      try {
        const linha = await banco.resultado(tabela().update(so(patch, EDITAVEIS)).eq("id", id).eq("conta_id", conta.conta_id).select(COLUNAS).single());
        trocar(linha);
        avisar();
        return linha;
      } catch (e) {
        trocar(antes);
        avisar();
        throw e;
      }
    },
    async remover(id) {
      const item = itens.find(i => i.id === id);
      await banco.resultado(tabela().delete().eq("id", id).eq("conta_id", conta.conta_id));
      itens = itens.filter(i => i.id !== id);
      avisar();
      if (item) await this.tirarArquivos(item.fotos || []).catch(() => {});
    },
    /** Envia uma foto nas duas medidas. Devolve { arquivo, mini, w, h }. */
    async enviarFoto(arquivo) {
      const [grande, pequena] = await Promise.all([paraWebp(arquivo, 1600, 0.84), paraWebp(arquivo, 640, 0.78)]);
      const sorteio = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const f = { arquivo: `${conta.conta_id}/estoque-${sorteio}.webp`, mini: `${conta.conta_id}/estoque-${sorteio}-m.webp`, w: grande.w, h: grande.h };
      await Promise.all([
        banco.enviarArquivo(BUCKET, f.arquivo, grande.blob, "image/webp", { trocar: false }),
        banco.enviarArquivo(BUCKET, f.mini, pequena.blob, "image/webp", { trocar: false }),
      ]);
      return f;
    },
    /** Apaga do Storage as fotos que saíram (sem travar a tela se falhar: sobra um arquivo, nada quebra). */
    async tirarArquivos(fotos) {
      const caminhos = fotos.flatMap(f => [f.arquivo, f.mini]).filter(Boolean);
      if (caminhos.length) await banco.removerArquivos(BUCKET, caminhos);
    },
    aoMudar(f) { ouvintes.add(f); return () => ouvintes.delete(f); },
  };
}
