# Projetos e issues: como a Renderiza organiza o trabalho

O guia de qualquer pessoa ou sessão que for trabalhar num projeto da Renderiza. Lugar: painel de prospecção, tela
**Projetos** (`/painel#projetos`). A tela e o código estão em `painel/README.md`, seção "Projetos".

## A ideia

- O **Pipeline** é a venda: termina no Ganho.
- Depois do Ganho começa o trabalho. A tela **Projetos** é esse lugar, no jeito do Linear: projetos, issues e ciclos.
- Projetos internos, sem cliente, ficam no mesmo lugar (por exemplo, uma melhoria do painel).
- **A documentação de cada issue é o que faz o trabalho andar entre as sessões.** Quem pega uma issue lê a
  documentação dela. Ao parar, deixa escrito o que fez e onde parou, para a próxima sessão continuar dali.

## Projeto

- **Campos:** nome, cliente (opcional; um lead do Pipeline), início, meta (opcional), situação (Em andamento ou
  Concluído) e a **documentação do projeto**.
- **Documentação do projeto** (em Markdown): o que foi combinado, o escopo, as entregas, as decisões e os links (a
  proposta, o contrato, o trilho em `docs/entregas/`).
- **Um cliente pode ter vários projetos:** a fase 1, a fase 2… Cada fase com começo, meio e fim.

## Issue

- **O que é:** um pedaço do trabalho que **dá para conferir quando acaba**, como "Layout da página inicial" ou "Domínio
  no Registro.br".
- **Tamanho:** cabe em até 8 pontos. Se passar disso, quebre em mais de uma.
- **Título:** curto, dizendo o que sai no fim.
- **Campos:**
  - documentação (em Markdown);
  - projeto (opcional);
  - status;
  - estimativa (opcional);
  - ciclo;
  - responsável (Kaue ou Milena; é só um rótulo);
  - número curto (**#12**), que o painel põe sozinho, por ordem de criação.

### Status (nesta ordem, em inglês)

| Status | Quando |
|---|---|
| **Backlog** | vamos fazer, mas ainda não paramos para pensar (falta definir, falta algo de alguém) |
| **To-do** | pronto para fazer: está claro o que é e nada impede de começar |
| **In progress** | alguém está fazendo agora |
| **Validation** | feito; falta conferir (a Renderiza testa, ou o cliente valida) |
| **Done** | feito e conferido. O painel guarda o dia; sem ciclo, a issue entra no ciclo do dia |

### Estimativa (opcional): 1, 2, 3, 5 ou 8 pontos

O tamanho do esforço. A soma do ciclo mostra quanto cabe numa semana. Esta é uma referência inicial, e o Kaue ajusta:

| Pontos | Tamanho |
|---|---|
| 1 | coisa pequena, de minutos |
| 2 | uma ou duas horas |
| 3 | meio dia |
| 5 | um dia |
| 8 | mais de um dia (melhor quebrar) |

### Ciclos: de segunda a domingo

- **Os mesmos ciclos da prospecção:** o ciclo 9 foi a passagem (27 a 29/11/2026); o ciclo 10 vai de 30/11 a 06/12.
- **Cada segunda começa um ciclo novo:** ciclo 10 + o número de semanas desde 30/11/2026.
- **No ciclo atual entra** o que vai ser feito nesta semana; **no próximo**, o que está planejado para a seguinte.
- **Sem ciclo** fica o que ainda não tem data.

## A documentação da issue (Markdown)

É um documento, não uma descrição curta. O painel mostra formatado, com títulos, listas e uma checklist que se marca
com um clique. Também deixa anotar no Registro com uma linha. **O modelo** (botão "Usar o modelo" no painel):

```markdown
## Contexto
Por que esta issue existe e o que já se sabe. Links: arquivos do repositório (`demos/…/proposta.md`), commits,
trilhos, decisões. Dependências: "depende de #21".

## O que fazer
- [ ] Primeira ação
- [ ] Segunda ação

## Pronto quando
- O que dá para conferir para dizer que acabou (o critério da Validation)

## Registro
- 30/11 · Kaue: o que foi feito, a decisão tomada, onde parou, o próximo passo
```

**Regras:**

- **Contexto:** o suficiente para uma sessão nova começar sem perguntar. Cite os arquivos pelo caminho.
- **O que fazer:** as ações, em checklist (`- [ ]`). Marque (`- [x]`) conforme forem acontecendo.
- **Pronto quando:** o que se confere na Validation.
- **Registro:**
  - É o diário da issue. Só cresce: não se apaga o que já está lá.
  - Uma linha por vez: `- dd/mm · quem: o que aconteceu`.
  - Toda sessão que mexer na issue escreve ali o que fez, o que decidiu, onde parou e o próximo passo.
- **Formato:**
  - Títulos dentro da documentação começam em `##`. O `#` é reservado ao pacote.
  - O painel entende títulos (`##`, `###`), listas, checklist, **negrito**, *itálico*, `código`, blocos de código,
    links e tabelas.
  - HTML não vale: aparece como texto.

## O pacote .md: issues entre o painel e as sessões

As sessões ainda não alcançam o banco do painel. O caminho é um arquivo Markdown, o **pacote**, que vai e volta:

- **Do painel para a sessão:**
  - No projeto, **Copiar para uma sessão** leva o projeto inteiro: a apresentação, a documentação e todas as issues
    com as documentações delas.
  - Numa issue, **Copiar** leva só aquela issue.
  - O Kaue cola o que copiou na sessão.
- **Da sessão para o painel:**
  - A sessão escreve o pacote num arquivo `.md` e entrega ao Kaue.
  - No projeto, **Importar issues**: colar o texto ou abrir o arquivo.
  - O painel mostra antes o que vai criar e o que vai atualizar, e então importa.

### O formato

```markdown
Qualquer texto antes da primeira issue é só apresentação: o painel ignora.

# Layout da página inicial
status: todo
estimativa: 3
ciclo: 10
responsavel: Kaue

## Contexto
…

## O que fazer
- [ ] …

## Pronto quando
- …

## Registro

# Domínio no Registro.br
numero: 22
status: in_progress
```

**Como o painel lê:**

- **Início de cada issue:** uma linha `# Título`, com um só `#`. Linhas com `#` dentro de blocos de código não contam.
- **Dados:** logo abaixo do título, as linhas que quiser, todas opcionais:
  - `status:` backlog, todo (ou To-do), in_progress (ou In progress), validation, done;
  - `estimativa:` 1, 2, 3, 5 ou 8;
  - `ciclo:` 10, C10, atual ou próximo;
  - `responsavel:` Kaue ou Milena;
  - `numero:` o #, para atualizar uma issue que já existe.
- **Documentação:** depois de uma linha em branco, até a próxima `# `.

**Criar ou atualizar:**

- Com `numero:`, atualiza aquela issue, se ela for do projeto.
- Sem número, atualiza a issue do projeto que tiver o mesmo título. Se não houver, cria uma nova.
- Por isso, importar o mesmo arquivo de novo não duplica nada.

**Na atualização:**

- Só muda o que veio no arquivo.
- Documentação vazia não apaga a que já existe.
- Para mudar só o status, basta o título (ou `numero:`) e `status:`.

**Avisos:** o painel avisa o que não entendeu e deixa essa parte de fora. Exemplos: um status que não existe, uma
estimativa fora da escala, um número de outro projeto.

## Como uma sessão trabalha num projeto

1. **Ao começar:**
   - Leia a documentação do projeto e das issues. O Kaue cola o "Copiar para uma sessão", ou só a issue da vez.
   - Leia também os arquivos citados no Contexto.
2. **Para montar as issues de um projeto:**
   - Uma issue por entregável que dá para conferir, na ordem em que o trabalho acontece, de ponta a ponta.
   - Cada uma com o modelo preenchido (o Registro pode começar vazio), a estimativa e o ciclo, quando for desta semana
     ou da próxima.
   - Entregue o pacote num arquivo `.md`.
   - Não repita o que já está no projeto. Para mexer numa issue que existe, use o `numero:`.
3. **Ao trabalhar numa issue:**
   - Ao começar, passe a issue para `in_progress`.
   - Ao parar, mesmo sem terminar:
     - marque a checklist;
     - escreva no Registro o que fez, o que decidiu, onde parou e o próximo passo;
     - devolva a issue no formato do pacote, com o `numero:`, para o Kaue importar.
   - Terminou: `validation`. O Kaue confere e passa para `done`.
4. **Decisões e descobertas:** vão para o Registro da issue (e, se mudarem o projeto, para a documentação do
   projeto). Assim a próxima sessão não refaz o caminho.

**Com acesso ao banco do painel** (o conector do Supabase, no projeto da prospecção), dá para gravar direto, nas
tabelas `projetos` e `issues` (`supabase/projetos.sql`):

- A documentação vai em `issues.descricao` e o status pelo id (`todo`, `in_progress`…).
- `numero` e `feita_em` o banco põe sozinho.
- `dono` é o mesmo do projeto.
- Use texto entre `$md$ … $md$` para o Markdown não quebrar o SQL.
- Sem esse acesso, o pacote resolve tudo.
