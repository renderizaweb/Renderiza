# Design system do Painel Renderiza

Começou em 29/10/2026, junto com as telas de acesso (entrar, esqueci a senha, nova senha). Tudo mora em
**`painel-clientes/src/ui/`**:

| Arquivo | O que tem |
|---|---|
| `estilo.css` | os tokens (`--rz-*`), a base, os componentes (`.rz-*`) e as telas de acesso. Único arquivo de estilo do painel |
| `icones.js` | `icone(nome)`: os ícones, desenhados aqui (traço de 1,75, 24 × 24) |
| `formulario.js` | `erroNoCampo`, `avisoDoFormulario`, `ocupado`, `ligarMostrarSenha`, `ligarAvisoCapsLock`, `escapar` |
| `fontes/` | a Geist (a fonte da marca, com a licença OFL) |

O jeito de usar vem do [`09-ux.md`](09-ux.md) (princípios e padrões). Este documento diz **com o quê**: as cores,
o tipo, os espaços e as peças. Quem cria uma peça nova põe no `src/ui/` e anota aqui, no mesmo commit.

## A ideia

- **Calmo e rápido.** Fundo claro, muito espaço, uma cor de destaque só. Nada pisca; o movimento é curto e só
  explica (de onde a coisa veio, o que mudou).
- **A cara da Renderiza.** Grafite na estrutura, papel no fundo, **terracota** como única cor de destaque (botão
  principal, link, foco, o que pede ação) e a fonte **Geist**, as mesmas do site da Renderiza.
- **Feito para o polegar.** Alvo de toque de 44 px, campos de 48 px com texto de 16 px (o iPhone não dá zoom), botão
  principal largo no celular.
- **Acessível de verdade.** Contraste AA em todo texto, foco sempre visível, rótulo em todo campo, erro dito em
  palavras (não só em cor) e respeito a "reduzir movimento".

## Tokens

**Cor**

| Token | Valor | Uso |
|---|---|---|
| `--rz-grafite` | `#1e2528` | estrutura: menu lateral, painel da marca, botão escuro |
| `--rz-gelo` | `#f1eee9` | o branco quente do símbolo; etiquetas neutras |
| `--rz-fundo` | `#f6f5f2` | fundo das telas |
| `--rz-superficie` | `#ffffff` | cartões, campos, gavetas |
| `--rz-tinta` / `-2` / `-3` | `#1e2528` / `#5b6467` / `#6b7376` | texto principal / de apoio / legendas (nada mais claro que o `-3` em texto) |
| `--rz-linha` / `-forte` | `#e6e4df` / `#d3d0c9` | divisões / borda de campo e botão |
| `--rz-destaque` | `#b25134` | **a terracota**: botão principal, link, foco. 5,1:1 no branco |
| `--rz-destaque-escuro` / `-claro` / `-fundo` | `#9a4429` / `#e8855e` / `#f9ece6` | passar o mouse / destaque sobre o grafite / fundo de ícone e etiqueta |
| `--rz-sucesso` · `--rz-alerta` · `--rz-perigo` · `--rz-info` (+ `-fundo`) | verde · âmbar · vermelho · azul | **só para situação** (pago, vencendo, erro, aviso), nunca para enfeitar |

**Tipo:** Geist (`--rz-fonte`). Tamanhos `--rz-t-xs` (12) · `sm` (14) · `base` (16) · `lg` (18) · `xl` (22) · `2xl` (28)
· `3xl` (36). Títulos em 600 com espaçamento negativo (`.rz-titulo-1`, `-2`, `-3`); texto em 400; apoio em
`.rz-texto-2`; legenda em `.rz-texto-3`.

**Espaço:** base de 4 px: `--rz-1` (4) · `2` (8) · `3` (12) · `4` (16) · `5` (20) · `6` (24) · `8` (32) · `10` (40) ·
`12` (48) · `16` (64). Entre campos de um formulário, `--rz-5`; entre blocos, `--rz-8`.

**Forma:** cantos `--rz-raio-p` (8) · `--rz-raio` (12, campos e botões) · `-g` (16, cartões) · `-xg` (24) · `-pilula`.
Sombras discretas `--rz-sombra-1` (cartão), `-2` (o que flutua: gaveta, menu), `-3` (painel da marca). Foco:
`--rz-foco` (anel de 3 px na terracota).

**Toque e movimento:** `--rz-alvo` (44 px), `--rz-campo` (48 px); `--rz-rapido` (150 ms) para cor e borda,
`--rz-medio` (240 ms) para algo que aparece; curva `--rz-curva`. Com "reduzir movimento", tudo fica instantâneo.

## Componentes

| Peça | Classes | Regras |
|---|---|---|
| Botão | `.rz-botao` + `--primario` · `--escuro` · `--fantasma` · `--perigo`; tamanho `--grande` · `--pequeno`; `--bloco` (largura toda) | **um** primário por tela; no celular, o principal é `--grande --bloco`. Ocupado: `ocupado(botao, true, "Entrando…")` (gira, troca o texto, não aceita dois toques) |
| Campo | `.rz-campo` > `.rz-rotulo` + `.rz-entrada` + `.rz-erro-campo` (e `.rz-ajuda`) | rótulo sempre visível (placeholder é só exemplo); tipo e teclado certos (`type`, `inputmode`, `autocomplete`, `enterkeyhint`); erro embaixo do campo com `erroNoCampo` (liga o `aria-invalid` e o `aria-describedby`) |
| Campo com botão | `.rz-com-acao` + `.rz-acao-campo` | ex.: mostrar a senha (`ligarMostrarSenha`) |
| Requisitos | `.rz-requisitos` > `li[data-ok]` | o que a senha precisa ter, marcando enquanto digita |
| Aviso | `.rz-alerta` + `--erro` · `--sucesso` · `--aviso` | o aviso do formulário inteiro (`avisoDoFormulario`), com `role="alert"`; ícone + frase que diz o que fazer |
| Etiqueta | `.rz-etiqueta` + `--destaque` · `--alerta` · `--sucesso` | situação curta ("Novo", "Vence hoje", "STG") |
| Cartão | `.rz-cartao` | fundo branco, borda, sombra 1 |
| Divisor | `.rz-divisor` | linha com texto no meio ("ou") |
| Marca | `.rz-marca` | símbolo + "Painel Renderiza" |
| Ícone | `icone("nome")` | sempre com texto ao lado ou `aria-label` no botão |
| Abrindo | `.rz-abrindo` | a tela enquanto o painel carrega (já no `index.html`) |
| Telas de acesso | `telaDeAcesso()` em `src/telas/acesso.js` | uma coluna no celular; no computador, o painel da marca ao lado. Cadastro e convite (Missão 2) usam o mesmo layout |
| Casca | `montarCasca()` em `src/telas/casca.js`; `.rz-lateral`, `.rz-topo`, `.rz-barra`, `.rz-fab`, `.rz-faixa-teste` | menu lateral no computador, barra de baixo (até 5) e "+" no celular; só módulos ligados, o resto trancado com cadeado; o "+" e o "Novo" só para quem edita algo |
| Gaveta, folha, confirmar | `abrirGaveta`, `abrirFolha`, `confirmar` em `src/ui/gaveta.js` (`<dialog>`) | gaveta: detalhes e formulários (tela cheia no celular, ações fixas embaixo); folha: lista curta de ações; `confirmar` só para o que não volta atrás |
| Aviso embaixo | `avisar(texto, { desfazer })` em `src/ui/aviso.js`; `.rz-aviso` | 4 s; com "Desfazer", 7 s (e não some com o mouse em cima) |
| Estados | `vazio`, `erro`, `esqueleto`, `comEstados` em `src/ui/estados.js` | vazio ensina e oferece a ação; erro diz o que fazer; esqueleto só se passar de 1 s |
| Cabeça de página e seções | `.rz-cabeca` (`-titulos`, `-acoes`), `.rz-secao` | título à esquerda, ação principal à direita (quebra no celular) |
| Linha de lista | `.rz-linhas` > `.rz-linha` (`-texto`, `-fim`), `.rz-cor`, `.rz-avatar` | primeira linha: o nome; segunda: o que decide; a ação mais provável na ponta |
| Chips e abas | `.rz-chips` (`--quebra` para várias linhas), `.rz-chip[aria-pressed]`; `.rz-abas` | chips para filtros e escolhas rápidas; abas para partes de um módulo |
| Opções em cartão | `.rz-opcoes` > `label.rz-opcao` (`-icone`, `-texto`, `-marca`) com `input` radio ou checkbox | onboarding (nicho, módulos): uma por linha, grande para o polegar |
| Campos prontos | `campoTexto`, `campoArea`, `campoSelecao`, `interruptor`, `segmentos`, `escolherCor`, `lerFormulario` em `src/ui/campos.js` | rótulo, ajuda, "(opcional)" e o lugar do erro já vêm; cores das pessoas e dos tipos só da lista `CORES` |
| "Para quem?" | `abrirParaQuem`, `novoCliente`, `abrirCliente` em `src/ui/para-quem.js` | busca por nome ou WhatsApp, recentes primeiro, "+ novo cliente" ali mesmo (o mesmo WhatsApp é o mesmo cliente) |
| Paleta | `abrirPaleta` em `src/ui/paleta.js` (Ctrl+K ou "/") | acha módulo, cliente e ação; recentes primeiro |
| WhatsApp, CSV, filtros | `src/ui/whatsapp.js`, `src/ui/csv.js` (`baixarCsv`, `lerCsv`), `src/ui/filtros.js` | CSV com ";" e BOM (abre certo no Excel), protegido contra fórmula |
| Progresso | `.rz-progresso > span` | onboarding ("2 de 5") e primeiros passos |
| Onboarding | `.rz-passo-topo`, `.rz-passo-cabeca`, `.rz-com-botao`, `.rz-duracoes` (`src/telas/comecar.js`) | uma pergunta por tela, "voltar" sempre à mão, "Pular" onde dá |
| Primeiros passos | `.rz-passos`, `.rz-passo[data-feito]`, `.rz-passo-marca` (`src/modulos/inicio/primeiros-passos.js`) | cartão no topo do Início, só para o dono; no celular, o botão desce para baixo do texto |

Ícones disponíveis: `olho`, `olhoFechado`, `alerta`, `ok`, `okCirculo`, `carta`, `cadeado`, `maiusculas`, `voltar`, `seta`,
`relogio`, `conversa`, `carteira`, `contrato`, `agenda`; do menu e das ações (Missão 2): `inicio`, `clientes`, `site`,
`servicos`, `equipe`, `configuracoes`, `admin`, `mais`, `adicionar`, `buscar`, `fechar`, `sair`, `trocar`, `whatsapp`,
`copiar`, `baixar`, `editar`, `lixo`, `desfazer`, `telefone`, `link`, `imagem`, `filtro`, `estrela`, `setaBaixo`,
`importar`; do nicho: `festa`, `camera`. A lista certa é sempre `ICONES` em `src/ui/icones.js`.

## Escrever na tela

Do jeito da Renderiza ([`02`](02-produto.md), "Como falar"): "a gente", frases curtas, o que fazer em vez do que deu
errado ("Digite o seu e-mail.", "Sem conexão. Confira a internet e tente de novo."). Botão diz a ação ("Enviar o
link", "Salvar e entrar"), não "OK" ou "Confirmar".

## Cor da conta (depois)

Quando a conta tiver a cor da marca dela (Configurações), só `--rz-destaque` (e o `-escuro`, `-fundo`) muda, e só
se passar no contraste com o branco (4,5:1). Grafite, papel, tinta e as cores de situação não mudam.

## O que já usa

- **Entrar** (`src/telas/entrar.js`), **Esqueci a senha** (`esqueci-a-senha.js`) e **Nova senha** (`nova-senha.js`),
  com o layout `acesso.js`.
- **Missão 2, bloco B:** a casca (menu lateral, barra de baixo, "+", busca, faixa do teste), escolher a conta,
  cadastro, convite e onboarding (com `acesso.js`), Equipe e acessos, Configurações, Serviços e os primeiros passos
  do Início, todos com as peças acima (`estilo.css`, seções 10 a 15).
- Os **e-mails do login** (`supabase/emails/`): papel no fundo, cartão branco, terracota só no botão, textos em
  tinta, tinta-2 e tinta-3 (o rodapé, sobre o papel, em tinta-2 pelo contraste). E-mail não lê CSS de fora: as
  cores vão escritas, e o teste (`test/auth.test.mjs`) só aceita as dos tokens `--rz-*`. A fonte é a Geist quando
  o programa de e-mail tem, senão a do sistema.
