# Mensagem de primeiro contato das fotógrafas (a do Kaue, que fechou 2 vendas em nov/2026), pronta para o botão
# "Copiar mensagem" do card no painel de prospecção (leads.mensagem_whatsapp com um texto só).
# Uso: python3 -I ferramentas/demo/mensagem-fotografia.py <pasta> [<pasta> ...]          → SQL (só preenche quem está vazio)
#      python3 -I ferramentas/demo/mensagem-fotografia.py --texto <pasta> [<pasta> ...]  → as mensagens, para conferir
# O nome vem de demos/<pasta>/demo.json ("renderiza.ola", o mesmo da faixa "<nome>, a Renderiza montou para você");
# sem nome, a mensagem começa com "Oi! Tudo bem?". O parágrafo do Natal só entra se a demo tem natal.html.
import json, os, sys

SITE = "https://www.renderizaweb.com.br"
NATAL = ("O site também conta com uma página exclusiva para os ensaios de *Natal*, onde as clientes podem visualizar "
         "os horários disponíveis, escolher o melhor e entrar em contato diretamente pelo WhatsApp para agendar.")

def mensagem(pasta, raiz):
    d = json.load(open(os.path.join(raiz, "demos", pasta, "demo.json"), encoding="utf8"))
    nome = str((d.get("renderiza") or {}).get("ola") or "").strip()
    partes = [
        f"Oi, {nome}! Tudo bem? 😊" if nome else "Oi! Tudo bem? 😊",
        "Sou a Milena, da Renderiza, uma empresa especializada em soluções digitais.",
        "Preparei uma proposta especial para o seu Studio e já montei uma prévia de como ficaria o site, "
        "utilizando as suas próprias fotos, avaliações e etc! 💜",
    ]
    if os.path.exists(os.path.join(raiz, "demos", pasta, "natal.html")): partes.append(NATAL)
    partes += ["✨ Dá uma olhadinha em como ficou:", f"{SITE}/demo/{pasta}",
               "O investimento também está disponível no próprio site.",
               "Espero que goste! Qualquer dúvida, estou por aqui. 😊"]
    return "\n\n".join(partes)

if __name__ == "__main__":
    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = sys.argv[1:]
    so_texto = "--texto" in args
    pastas = [a for a in args if a != "--texto"]
    if not pastas: sys.exit(__doc__ or "uso: mensagem-fotografia.py [--texto] <pasta> ...")
    for p in pastas:
        m = mensagem(p, raiz)
        if so_texto: print(f"===== {p}\n{m}\n")
        else:
            q = lambda s: "'" + s.replace("'", "''") + "'"
            print(f"update leads set mensagem_whatsapp = {q(m)} where id = {q(p)} and link_demo = {q('/demo/' + p)}"
                  " and coalesce(mensagem_whatsapp, '') = '';")
