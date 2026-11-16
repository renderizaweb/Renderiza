# Entregas com site e Painel Renderiza

Quando o cliente fecha **o site e o painel** juntos. A entrega só de site continua em [`docs/fechamento.md`](../fechamento.md);
aqui fica o que muda quando o site conversa com o Painel Renderiza (Meu site, agenda online) e o que fomos aprendendo.
Cada cliente tem o seu trilho nesta pasta (o primeiro: [`rafaela-damaceno.md`](rafaela-damaceno.md)).

Isto **não está cravado em pedra**: a Rafaela é a primeira. Cada sessão que andar num trilho anota o que aprendeu em
"O que aprendemos" (abaixo) e ajusta o modelo, para o próximo cliente ser mais fácil.

## Como as duas coisas se encaixam

```
 Site do cliente (repositório e hospedagem DELE)              Painel Renderiza (da Renderiza)
 ┌───────────────────────────────────────────┐        ┌─────────────────────────────────────┐
 │ estático: a VERSÃO INICIAL, a que ele     │  lê    │ Meu site: o que ele mudou e publicou │
 │ aprovou (textos, fotos, cores, agenda     │ ─────▶ │ (textos, fotos, preços, depoimentos)│
 │ pelo WhatsApp), tudo dentro do site       │        │                                     │
 │                                           │  pede  │ Agenda: horários livres, campanhas  │
 │ + o script do Meu site e a agenda, que    │ ─────▶ │ com vagas; o pedido entra no        │
 │   pedem à API pública do painel           │        │ Atendimento e vira pré-reserva      │
 └───────────────────────────────────────────┘        └─────────────────────────────────────┘
```

- **O site é um mundo próprio.** É estático e é o que entregamos, ponto. Fica de pé sozinho, sem o painel.
- **O painel muda por cima.** O que o cliente altera no Meu site fica no banco do painel e chega ao site pela API
  pública (`painel.renderizaweb.com.br/api/publico/…`). O site não tem chave nenhuma: só lê a API pública e manda o
  pedido da agenda.
- **Cancelou, volta.** A Renderiza desconecta o site no Admin, a API passa a responder "não encontrado" e o site mostra
  sozinho a versão inicial (e a agenda volta a ser pelo WhatsApp). Ninguém mexe no site. Quem quiser ficar com a última
  versão compra a versão final (`03`, regra 5).
- O contrato completo: [`docs/painel-clientes/03-modulo-meu-site.md`](../painel-clientes/03-modulo-meu-site.md) (Meu site)
  e [`04-arquitetura.md`](../painel-clientes/04-arquitetura.md), "API pública" (agenda online).

## As paradas de um trilho de entrega (o modelo, a partir da Rafaela)

| | Parada | Chegou quando |
|---|---|---|
| A | **O site no repositório dele** | o site abre na hospedagem dele, igual à demo validada, sem nada da Renderiza |
| B | **Revisão** (conteúdo final, layout, Google, segurança) | o cliente aprovou por escrito a versão final do site |
| C | **A ponte** (o site fala com o painel), provada no STG | edição publicada aparece no site, pedido da agenda cai no painel, painel desligado = versão inicial |
| D | **A conta dele no painel** (produção) | ele entra e vê o site dele no Meu site e a agenda dele montada |
| E | **No ar e entregue** | o site está no domínio dele, ligado ao painel, e ele já mudou algo sozinho |

B pode andar junto com C; D depende de C (e das migrações com o "pode" da Renderiza).

## Quem faz o quê

- **Renderiza (Kaue):** fala com o cliente; cria as contas dele (Gmail de dev, GitHub, hospedagem, domínio no CPF/CNPJ
  dele); cria o login dele no Admin; dá o "pode" para migração e função na produção.
- **Claude:** código (gerador, `virar-site`, API, migrações), testes, sobe o site no repositório do cliente, confere
  no ar e mantém o trilho em dia.
- Senha, código e chave **nunca** passam pelo chat. O acesso do Claude ao repositório do cliente é pelo app do Claude
  no GitHub (não é variável de ambiente): repositório privado na conta do cliente → a conta GitHub da Renderiza como
  colaboradora → app do Claude instalado só nesse repositório → `add_repo` na sessão.

## O que aprendemos (o mais novo em cima)

| Data | Cliente | Lição |
|---|---|---|
| 15/11/2026 | Rafaela | A sessão precisa nascer no ambiente certo: com as variáveis `PAINEL_*` e a rede aberta (ambiente "Nuvem kaue"). No "Default", o Drive, o Instagram, o Google e até o site da Renderiza ficam bloqueados. |
| 15/11/2026 | Rafaela | A agenda tem que funcionar no celular como o cliente usa: o "voltar" do aparelho volta um passo, e o "Voltar" não pode ficar embaixo do topo fixo do site. Teste com toques no tamanho de celular, não só cliques. |
| 15/11/2026 | Rafaela | O `virar-site` (até aqui) só sabia transformar uma página; fotógrafa tem o site e a página de Natal. |
| 14/11/2026 | Rafaela | A demo de quem fechou vira a proposta final: sem a faixa nem o preço da Renderiza, com a marca e as fotos reais, e só com o que o painel entrega de verdade. |
