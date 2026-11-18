#!/usr/bin/env python3
"""Planilha financeira sob medida (Excel .xlsx) para fotógrafa com estúdio.

Pedido de 18/11/2026 (Estúdio Vivian Piacenti): "do Excel, que vai somando sozinho, por mês", com gastos fixos
pessoais, gastos do estúdio por tipo (aluguel, bexigas, cenários, luz), aba de foto extra, aba de gastos do mês
(Uber, Shopee, Mercado Livre), espaço para aniversários e ensaios, e "escrever o que é cada gasto e cada valor".
O porquê de cada decisão: docs/produtos/planilha-financeira.md.

Uso:
  python3 -I ferramentas/planilha/gerar-planilha.py demos/vivian-piacenti-planilha/planilha.json
      gera as duas versões em rascunhos/planilha/<pasta>/:
        <arquivo>-TESTE.xlsx  com dados de exemplo (inventados), poucas linhas e a faixa "versão de teste"
        <arquivo>.xlsx        a dela: limpa, com 2.000 linhas em cada aba de lançamentos
  --ano 2027 --mes 1      ano e mês que a planilha abre mostrando (padrão: hoje)
  --saida <pasta>         outra pasta de saída
  --conferir              ao final, recalcula no LibreOffice e confere as contas da versão de teste
  --imagens               gera as imagens da página da proposta (WebP) em <saida>/img

As abas (nesta ordem): Início (o mês em números grandes e como usar), Resumo do ano (sozinho), Ensaios, Fotos extras,
Estúdio, Fixos pessoais, Gastos do mês e Categorias (as opções das setinhas). Só fórmulas que funcionam igual no
Excel, no Google Planilhas e no LibreOffice (SUMIFS, COUNTIFS, INDEX, MATCH, IF), sem macro e sem tabela dinâmica.
"""
import argparse
import datetime as dt
import json
import os
import sys

import xlsxwriter

# ---------------------------------------------------------------- nomes das abas e posições fixas
S_INI, S_RES, S_ENS, S_FOT, S_EST, S_FIX, S_MES, S_CAT = (
    "Início", "Resumo do ano", "Ensaios", "Fotos extras", "Estúdio", "Fixos pessoais", "Gastos do mês", "Categorias")
MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro",
         "Novembro", "Dezembro"]
MES3 = [m[:3] for m in MESES]
LIVRES = 2            # espaços em branco no fim de cada lista de categorias (para ela criar outras)
CAT_INI = 5           # primeira linha das listas na aba Categorias
LOG_INI = 6           # primeira linha de lançamento nas abas de lançamento (a 5 é o cabeçalho)
FIX_INI, FIX_N = 5, 30  # Fixos pessoais: 30 contas a partir da linha 5

ANO = f"'{S_INI}'!$C$4"     # o ano escolhido no Início
MES_SEL = f"'{S_INI}'!$C$5"  # o mês escolhido no Início (nome)


def q(aba):
    return f"'{aba}'"


def col(n):
    """0 -> A, 1 -> B ..."""
    s = ""
    n += 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


# ---------------------------------------------------------------- dados de exemplo (inventados, só na versão de teste)
FAMILIAS = ["Souza", "Alves", "Costa", "Nunes", "Prates", "Ribeiro", "Moura", "Teixeira", "Barros", "Campos", "Freitas",
            "Duarte", "Rocha", "Prado", "Lima"]


def exemplo(ano):
    d = lambda m, dia: dt.date(ano, m, dia)
    ensaios = [
        (d(9, 3), "Helena · 1 ano", "Aniversário", 690, "pacote com 20 fotos"),
        (d(9, 6), "Theo · 6 meses", "Acompanhamento mensal", 280, ""),
        (d(9, 10), "Marina", "Gestante", 520, ""),
        (d(9, 13), "Lorenzo · 1 ano", "Smash the cake", 450, "bolo por conta da família"),
        (d(9, 20), "Alice · 2 anos", "Aniversário", 690, ""),
        (d(9, 17), "Família Souza", "Família", 600, ""),
        (d(9, 23), "Benício · 1 mês", "Bebê / newborn", 650, ""),
        (d(9, 24), "Mariana · 4 meses", "Acompanhamento mensal", 280, ""),
        (d(9, 27), "Bianca", "Feminino", 480, ""),
        (d(9, 30), "Heitor · 1 ano", "Aniversário", 690, ""),
        (d(10, 4), "Theo · 7 meses", "Acompanhamento mensal", 280, ""),
        (d(10, 8), "Valentina · 1 ano", "Aniversário", 690, ""),
        (d(10, 11), "Gael · 1 ano", "Smash the cake", 450, ""),
        (d(10, 15), "Família Lima", "Ensaio externo", 750, "no parque"),
        (d(10, 18), "Clara · 15 dias", "Bebê / newborn", 650, ""),
        (d(10, 22), "Família Rocha", "Natal", 390, "pré-venda"),
        (d(10, 25), "Família Prado", "Natal", 390, "pré-venda"),
        (d(10, 26), "Mariana · 5 meses", "Acompanhamento mensal", 280, ""),
        (d(10, 29), "Rafaela", "Gestante", 520, ""),
        (d(10, 30), "Família Barros", "Família", 600, ""),
        (d(10, 31), "Antônio · 1 ano", "Aniversário", 690, ""),
        (d(11, 3), "Theo · 8 meses", "Acompanhamento mensal", 280, ""),
        (d(11, 5), "Laura · 1 ano", "Aniversário", 690, ""),
        (d(11, 10), "Pedro · 1 ano", "Smash the cake", 450, ""),
        (d(11, 12), "Sofia · 3 meses", "Acompanhamento mensal", 280, ""),
        (d(11, 15), "Júlia · 2 anos", "Aniversário", 690, ""),
        (d(11, 17), "Carla", "Gestante", 520, ""),
    ]
    for i, fam in enumerate(FAMILIAS[:12]):  # campanha de Natal: 12 famílias em novembro
        ensaios.append((d(11, 1 + i * 2 if i < 9 else 19 + i - 9), f"Família {fam}", "Natal", 390, ""))
    ensaios.sort(key=lambda e: e[0])
    fotos = [
        (d(9, 12), "Helena · 1 ano", 6, 150, ""), (d(9, 25), "Alice · 2 anos", 10, 250, ""),
        (d(10, 14), "Valentina · 1 ano", 8, 200, ""), (d(10, 24), "Família Lima", 12, 300, ""),
        (d(11, 9), "Laura · 1 ano", 5, 125, ""), (d(11, 13), "Família Alves", 8, 200, ""),
        (d(11, 16), "Pedro · 1 ano", 4, 100, ""), (d(11, 18), "Família Costa", 10, 250, "pacote de 10"),
    ]
    est = []
    for m, luz in ((9, 286.4), (10, 312.9), (11, 341.7)):
        est += [(d(m, 5), "Aluguel do estúdio", "Aluguel", 1800, "Pix"),
                (d(m, 10), "Conta de luz do estúdio", "Luz do estúdio", luz, "Boleto"),
                (d(m, 15), "Internet do estúdio", "Internet e telefone", 110, "Boleto"),
                (d(m, 20), "DAS do MEI", "MEI (DAS)", 81.9, "Pix"),
                (d(m, 8), "Lightroom (assinatura)", "Programas e assinaturas", 49, "Crédito")]
    est += [
        (d(9, 2), "Bexigas da Shopee", "Bexigas e balões", 89.9, "Crédito"),
        (d(9, 12), "Bolo do smash (Lorenzo)", "Bolo e doces (smash)", 120, "Pix"),
        (d(9, 18), "Tiara e tutu", "Figurinos e acessórios", 79.9, "Crédito"),
        (d(10, 1), "Árvore e laços do cenário de Natal", "Cenários e decoração", 680, "Crédito"),
        (d(10, 3), "Lareira cenográfica", "Cenários e decoração", 450, "Pix"),
        (d(10, 7), "Bexigas (loja da rua)", "Bexigas e balões", 145, "Pix"),
        (d(10, 20), "Anúncio no Instagram: Natal", "Divulgação e anúncios", 150, "Crédito"),
        (d(10, 26), "Fotos impressas para o mural", "Impressão e álbuns", 230, "Pix"),
        (d(11, 2), "Bexigas", "Bexigas e balões", 120, "Pix"),
        (d(11, 9), "Bolo do smash (Pedro)", "Bolo e doces (smash)", 120, "Pix"),
        (d(11, 11), "Mantas e gorrinhos de Natal (Shopee)", "Figurinos e acessórios", 95, "Crédito"),
        (d(11, 14), "Anúncio no Instagram: Natal", "Divulgação e anúncios", 100, "Crédito"),
        (d(11, 16), "Conserto do flash", "Equipamento e manutenção", 180, "Pix"),
    ]
    est.sort(key=lambda e: e[0])
    mes = [
        (d(9, 4), "Uber para o estúdio", "Uber / 99", 23.5, "Crédito"), (d(9, 11), "Uber", "Uber / 99", 18.9, "Crédito"),
        (d(9, 9), "Capinha do celular", "Shopee", 34.9, "Crédito"), (d(9, 14), "Mercado do mês", "Mercado", 412.35, "Débito"),
        (d(9, 19), "Pizza", "iFood e delivery", 58, "Crédito"), (d(9, 22), "Farmácia", "Farmácia e saúde", 46.8, "Débito"),
        (d(9, 26), "Consulta médica", "Farmácia e saúde", 139, "Crédito"),
        (d(10, 2), "Uber", "Uber / 99", 31.2, "Crédito"), (d(10, 9), "99 para casa", "Uber / 99", 15.8, "Pix"),
        (d(10, 12), "Tênis", "Mercado Livre", 159, "Crédito"), (d(10, 13), "Mercado do mês", "Mercado", 398.1, "Débito"),
        (d(10, 17), "Lanche", "iFood e delivery", 72.5, "Crédito"), (d(10, 28), "Presente de aniversário", "Presentes", 89.9, "Pix"),
        (d(11, 1), "Uber", "Uber / 99", 27.4, "Crédito"), (d(11, 6), "Uber", "Uber / 99", 19.6, "Crédito"),
        (d(11, 7), "Organizadores de gaveta", "Shopee", 67.4, "Crédito"), (d(11, 10), "Fone de ouvido", "Mercado Livre", 129, "Crédito"),
        (d(11, 12), "Mercado do mês", "Mercado", 431.2, "Débito"), (d(11, 14), "Japonês", "iFood e delivery", 64, "Crédito"),
        (d(11, 17), "Farmácia", "Farmácia e saúde", 38.9, "Débito"),
    ]
    mes.sort(key=lambda e: e[0])
    fixos = {  # conta: {mês: valor}
        "Colégio": {9: 980, 10: 980, 11: 980}, "Condomínio": {9: 650, 10: 650, 11: 650},
        "Energia": {9: 210.4, 10: 235.1, 11: 198.6}, "Internet": {9: 120, 10: 120, 11: 120},
        "Gás": {9: 110, 11: 115}, "Celular": {9: 65, 10: 65, 11: 65}, "Seguro de vida": {9: 89, 10: 89, 11: 89},
        "Convênio odontológico": {9: 59, 10: 59, 11: 59},
    }
    vence = {"Colégio": 10, "Condomínio": 5, "Energia": 12, "Internet": 15, "Gás": 20, "Celular": 18, "Seguro de vida": 25,
             "Convênio odontológico": 10}
    return {"ensaios": ensaios, "fotos": fotos, "estudio": est, "mes": mes, "fixos": fixos, "vence": vence}


# ---------------------------------------------------------------- a planilha
def gerar(cfg, caminho, ano, mes_sel, teste):
    c = cfg["cores"]
    LIN = 60 if teste else 2000           # linhas de lançamento por aba
    LOG_FIM = LOG_INI + LIN - 1
    VERDE, VERDE_F = "#2f6b47", "#e4f1e8"
    VERM, VERM_F = "#a3364a", "#f9e4e7"
    CINZA, BORDA, INPUT = "#7a6d6f", "#e2d6d2", "#fffaf0"

    wb = xlsxwriter.Workbook(caminho)
    wb.set_properties({"title": f"Planilha financeira · {cfg['nome']}", "author": "Renderiza", "company": "Renderiza",
                       "comments": "Feita sob medida pela Renderiza."})
    BASE = {"font_name": "Calibri", "font_size": 11, "font_color": c["tinta"], "valign": "vcenter"}
    cache = {}

    def F(**kw):
        k = tuple(sorted(kw.items()))
        if k not in cache:
            cache[k] = wb.add_format({**BASE, **kw})
        return cache[k]

    MOEDA = '"R$" #,##0.00;-"R$" #,##0.00;"–"'
    MOEDA_IN = '"R$" #,##0.00'
    DATA = "dd/mm/yyyy"
    borda = dict(border=1, border_color=BORDA)

    titulo = F(bold=True, font_size=18, font_color=c["acento_escuro"])
    instr = F(italic=True, font_color=CINZA, text_wrap=True, valign="top")
    cab = F(bold=True, bg_color=c["areia"], font_color=c["acento_escuro"], bottom=2, bottom_color=c["rosa"], **{"top": 1, "top_color": BORDA})
    aviso = F(bold=True, font_color=VERM)

    # As listas (aba Categorias) ------------------------------------------------------------
    listas = {
        "tipos": (0, "Tipos de ensaio", cfg["tipos_de_ensaio"] + [""] * LIVRES),
        "estudio": (1, "Gastos do estúdio", cfg["gastos_do_estudio"] + [""] * LIVRES),
        "mes": (2, "Gastos do mês", cfg["gastos_do_mes"] + [""] * LIVRES),
        "pagou": (3, "Como pagou", cfg["como_pagou"]),
        "meses": (4, "Meses (não mexer)", MESES),
    }

    def faixa(nome):
        ci, _, itens = listas[nome]
        L = col(ci)
        return f"{q(S_CAT)}!${L}${CAT_INI}:${L}${CAT_INI + len(itens) - 1}"

    def celula_cat(nome, i):
        ci = listas[nome][0]
        return f"{q(S_CAT)}!${col(ci)}${CAT_INI + i}"

    abas = {}
    for nome in (S_INI, S_RES, S_ENS, S_FOT, S_EST, S_FIX, S_MES, S_CAT):
        abas[nome] = wb.add_worksheet(nome)
        abas[nome].hide_gridlines(2)
        abas[nome].set_paper(9)
        abas[nome].set_margins(0.4, 0.4, 0.5, 0.5)
    for nome, cor in ((S_INI, c["acento"]), (S_RES, c["acento_escuro"]), (S_ENS, "#5f9b75"), (S_FOT, "#5f9b75"),
                      (S_EST, c["rosa"]), (S_FIX, c["rosa"]), (S_MES, c["rosa"]), (S_CAT, "#b8aeb0")):
        abas[nome].set_tab_color(cor)

    # ------------------------------------------------------------ abas de lançamento (o mesmo jeito em todas)
    def aba_de_lancamento(nome, tit, explicacao, colunas, linhas_exemplo, extra_topo=None):
        ws = abas[nome]
        ws.set_column("H:H", None, None, {"hidden": True})
        for i, (cab_txt, larg, tipo, lista) in enumerate(colunas):
            ws.set_column(i, i, larg)
        ws.set_row(0, 30)
        ws.merge_range(0, 0, 0, len(colunas) - 1, tit, titulo)
        ws.set_row(1, 34)
        ws.merge_range(1, 0, 1, len(colunas) - 1, explicacao, instr)
        # linha 3: total do mês escolhido no Início e do ano; linha 4: aviso de linha que não entrou nas contas
        rD, rA = f"$D${LOG_INI}:$D${LOG_FIM}", f"$A${LOG_INI}:$A${LOG_FIM}"
        ws.write_formula("H1", f"={ANO}", None, ano)
        ws.write_formula("H2", f"=IFERROR(MATCH({MES_SEL},{faixa('meses')},0),1)", None, mes_sel)
        ws.write_formula("H3", f'=COUNT({rD})-COUNTIFS({rA},">="&DATE($H$1,1,1),{rA},"<"&DATE($H$1+1,1,1),{rD},"<>")')
        ws.set_row(2, 22)
        ws.merge_range("A3:B3", "", F(bold=True, align="right", font_color=CINZA))
        ws.write_formula("A3", f'="Em "&LOWER({MES_SEL})&" de "&$H$1&":"', F(bold=True, align="right", font_color=CINZA))
        ws.write_formula("C3", f'=SUMIFS({rD},{rA},">="&DATE($H$1,$H$2,1),{rA},"<"&DATE($H$1,$H$2+1,1))',
                         F(bold=True, num_format=MOEDA, font_size=13, font_color=c["acento_escuro"], align="left"))
        ws.write_formula("D3", '="No ano:"', F(bold=True, align="right", font_color=CINZA))
        ws.write_formula("E3", f'=SUMIFS({rD},{rA},">="&DATE($H$1,1,1),{rA},"<"&DATE($H$1+1,1,1))',
                         F(bold=True, num_format=MOEDA, font_size=13, font_color=c["acento_escuro"], align="left"))
        if extra_topo:
            extra_topo(ws, rA)
        ws.merge_range(3, 0, 3, len(colunas) - 1, "", aviso)
        ws.write_formula("A4", '=IF($H$3>0,"Atenção: "&$H$3&IF($H$3=1," linha sem data ou de outro ano: ela não entra nas contas."," linhas sem data ou de outro ano: elas não entram nas contas."),"")', aviso)
        # cabeçalho e linhas
        for i, (cab_txt, larg, tipo, lista) in enumerate(colunas):
            ws.write(LOG_INI - 2, i, cab_txt, cab)
        ws.set_row(LOG_INI - 2, 24)
        fmt = {
            "data": F(num_format=DATA, align="center", **borda),
            "texto": F(**borda),
            "lista": F(**borda),
            "moeda": F(num_format=MOEDA_IN, **borda),
            "numero": F(num_format="0", align="center", **borda),
        }
        for r in range(LOG_INI - 1, LOG_FIM):
            ws.set_row(r, 19)
            for i, (_, _, tipo, _) in enumerate(colunas):
                ws.write_blank(r, i, None, fmt[tipo])
        for r, linha in enumerate(linhas_exemplo):
            for i, v in enumerate(linha):
                tipo = colunas[i][2]
                if v in ("", None):
                    continue
                if tipo == "data":
                    ws.write_datetime(LOG_INI - 1 + r, i, dt.datetime.combine(v, dt.time()), fmt["data"])
                elif tipo in ("moeda", "numero"):
                    ws.write_number(LOG_INI - 1 + r, i, v, fmt[tipo])
                else:
                    ws.write_string(LOG_INI - 1 + r, i, v, fmt[tipo])
        # validações: data, setinha, número
        for i, (cab_txt, _, tipo, lista) in enumerate(colunas):
            rng = (LOG_INI - 1, i, LOG_FIM - 1, i)
            if tipo == "data":
                ws.data_validation(*rng, {"validate": "date", "criteria": "between", "minimum": dt.date(2020, 1, 1),
                                          "maximum": dt.date(2040, 12, 31), "error_title": "Data",
                                          "error_message": "Escreva a data assim: 15/11/2026 (dia/mês/ano). Só o dia e o mês (15/11) também vale: entra o ano de hoje."})
            elif tipo == "lista":
                ws.data_validation(*rng, {"validate": "list", "source": "=" + faixa(lista), "error_title": "Escolha na setinha",
                                          "error_message": "Escolha uma das opções da setinha. Para criar outra, escreva na aba Categorias, num espaço em branco."})
            elif tipo in ("moeda", "numero"):
                ws.data_validation(*rng, {"validate": "decimal", "criteria": ">=", "value": 0, "error_title": "Só o número",
                                          "error_message": "Escreva só o número, sem R$. Ex.: 150 ou 89,90"})
        # data faltando (com valor) fica vermelha; data de outro ano fica laranja
        ws.conditional_format(LOG_INI - 1, 0, LOG_FIM - 1, 0, {"type": "formula", "criteria": f'=AND($A{LOG_INI}="",$D{LOG_INI}<>"")',
                                                               "format": wb.add_format({"bg_color": VERM_F, "border": 1, "border_color": VERM})})
        ws.conditional_format(LOG_INI - 1, 0, LOG_FIM - 1, 0, {"type": "formula", "criteria": f"=AND(ISNUMBER($A{LOG_INI}),YEAR($A{LOG_INI})<>$H$1)",
                                                               "format": wb.add_format({"bg_color": "#fde9cf", "font_color": "#8a5a00"})})
        ws.freeze_panes(LOG_INI - 1, 0)
        ws.autofilter(LOG_INI - 2, 0, LOG_FIM - 1, len(colunas) - 1)
        ws.set_landscape()
        ws.fit_to_pages(1, 0)
        ws.repeat_rows(LOG_INI - 2)
        return ws

    ex = exemplo(ano) if teste else {"ensaios": [], "fotos": [], "estudio": [], "mes": [], "fixos": {}, "vence": {}}

    aba_de_lancamento(S_ENS, "Ensaios e aniversários",
                      "Uma linha para cada ensaio: a data, o nome do cliente, o tipo (na setinha) e o valor que você cobrou. "
                      "O Resumo e o Início somam sozinhos.",
                      [("Data", 12, "data", None), ("Cliente", 30, "texto", None), ("Tipo de ensaio", 24, "lista", "tipos"),
                       ("Valor", 14, "moeda", None), ("Observação", 34, "texto", None)], ex["ensaios"])

    def topo_fotos(ws, rA):
        rC = f"$C${LOG_INI}:$C${LOG_FIM}"
        ws.write_formula("F3", f'=SUMIFS({rC},{rA},">="&DATE($H$1,$H$2,1),{rA},"<"&DATE($H$1,$H$2+1,1))&" fotos no mês"',
                         F(bold=True, font_color=CINZA))

    aba_de_lancamento(S_FOT, "Fotos extras",
                      "Vendeu foto extra? Uma linha por venda: a data, o cliente, quantas fotos e o valor total. "
                      "Entra no Resumo como \"Fotos extras\".",
                      [("Data", 12, "data", None), ("Cliente", 30, "texto", None), ("Quantas fotos", 14, "numero", None),
                       ("Valor", 14, "moeda", None), ("Observação", 34, "texto", None)], ex["fotos"], topo_fotos)
    abas[S_FOT].set_column("F:F", 18)

    aba_de_lancamento(S_EST, "Gastos do estúdio",
                      "Tudo o que é do estúdio: aluguel, luz, bexigas, cenários, figurinos… Uma linha por gasto: a data, o que foi, "
                      "o tipo (na setinha) e o valor. Comprou na Shopee para o estúdio? Lance aqui.",
                      [("Data", 12, "data", None), ("O que foi", 34, "texto", None), ("Tipo de gasto", 26, "lista", "estudio"),
                       ("Valor", 14, "moeda", None), ("Como pagou", 14, "lista", "pagou")], ex["estudio"])

    aba_de_lancamento(S_MES, "Gastos do mês",
                      "Uber, Shopee, Mercado Livre, mercado, iFood… O que é seu ou da casa e não é conta fixa. Uma linha por gasto: "
                      "a data, o que foi, o tipo (na setinha) e o valor.",
                      [("Data", 12, "data", None), ("O que foi", 34, "texto", None), ("Tipo de gasto", 22, "lista", "mes"),
                       ("Valor", 14, "moeda", None), ("Como pagou", 14, "lista", "pagou")], ex["mes"])

    # ------------------------------------------------------------ Fixos pessoais (contas × meses, como a planilha antiga)
    ws = abas[S_FIX]
    FIX_FIM = FIX_INI + FIX_N - 1
    FIX_TOT = FIX_FIM + 1
    ws.set_column("A:A", 28)
    ws.set_column("B:B", 9)
    ws.set_column("C:N", 11)
    ws.set_column("O:O", 14)
    ws.set_row(0, 30)
    ws.merge_range("A1:O1", "", titulo)
    ws.write_formula("A1", f'="Gastos fixos pessoais de "&{ANO}', titulo)
    ws.set_row(1, 34)
    ws.merge_range("A2:O2", "As contas que chegam todo mês (colégio, condomínio, energia, internet…). Escreva o nome da conta uma vez e, "
                            "em cada mês, o valor que pagou. Tem espaço para 30 contas.", instr)
    for i, t in enumerate(["Conta", "Vence dia"] + MES3 + ["Total do ano"]):
        ws.write(FIX_INI - 2, i, t, cab if i < 2 else F(bold=True, bg_color=c["areia"], font_color=c["acento_escuro"], bottom=2,
                                                       bottom_color=c["rosa"], top=1, top_color=BORDA, align="center"))
    ws.set_row(FIX_INI - 2, 24)
    nome_in = F(locked=False, **borda)
    dia_in = F(locked=False, num_format="0", align="center", **borda)
    val_in = F(locked=False, num_format=MOEDA_IN, **borda)
    tot_lin = F(num_format=MOEDA, bold=True, bg_color=c["areia"], **borda)
    contas = cfg["fixos_pessoais"] + [""] * (FIX_N - len(cfg["fixos_pessoais"]))
    for k, conta in enumerate(contas):
        r = FIX_INI - 1 + k
        ws.set_row(r, 19)
        ws.write_string(r, 0, conta, nome_in) if conta else ws.write_blank(r, 0, None, nome_in)
        dia = ex["vence"].get(conta)
        ws.write_number(r, 1, dia, dia_in) if dia else ws.write_blank(r, 1, None, dia_in)
        for m in range(12):
            v = ex["fixos"].get(conta, {}).get(m + 1)
            ws.write_number(r, 2 + m, v, val_in) if v else ws.write_blank(r, 2 + m, None, val_in)
        ws.write_formula(r, 14, f"=SUM(C{r + 1}:N{r + 1})", tot_lin)
    ws.set_row(FIX_TOT - 1, 24)
    ws.write(FIX_TOT - 1, 0, "Total do mês", F(bold=True, bg_color=c["acento"], font_color="#ffffff"))
    ws.write_blank(FIX_TOT - 1, 1, None, F(bg_color=c["acento"]))
    for m in range(13):
        L = col(2 + m)
        ws.write_formula(FIX_TOT - 1, 2 + m, f"=SUM({L}{FIX_INI}:{L}{FIX_FIM})",
                         F(num_format=MOEDA, bold=True, bg_color=c["acento"], font_color="#ffffff"))
    ws.data_validation(FIX_INI - 1, 1, FIX_FIM - 1, 1, {"validate": "integer", "criteria": "between", "minimum": 1, "maximum": 31,
                                                        "error_title": "Dia", "error_message": "Só o dia do vencimento, de 1 a 31."})
    ws.data_validation(FIX_INI - 1, 2, FIX_FIM - 1, 13, {"validate": "decimal", "criteria": ">=", "value": 0, "error_title": "Só o número",
                                                         "error_message": "Escreva só o número, sem R$. Ex.: 650 ou 89,90"})
    ws.freeze_panes(FIX_INI - 1, 2)
    ws.protect("", {"format_cells": True, "format_columns": True, "format_rows": True, "sort": True, "autofilter": True})
    ws.set_landscape()
    ws.fit_to_pages(1, 0)

    # ------------------------------------------------------------ Categorias
    ws = abas[S_CAT]
    ws.set_row(0, 30)
    ws.merge_range("A1:E1", "Categorias", titulo)
    ws.set_row(1, 50)
    ws.merge_range("A2:E2", "Estas são as opções das setinhas. Para criar uma nova, escreva num espaço em branco (fica amarelinho): "
                            "ela aparece na setinha e no Resumo. Evite trocar o nome de uma que você já usou: os lançamentos antigos "
                            "passam a contar como \"sem tipo\".", instr)
    for nome, (ci, cab_txt, itens) in listas.items():
        ws.set_column(ci, ci, 26 if ci < 3 else 16)
        ws.write(CAT_INI - 2, ci, cab_txt, cab)
        for k, item in enumerate(itens):
            r = CAT_INI - 1 + k
            if nome == "meses":
                ws.write(r, ci, item, F(font_color=CINZA, **borda))
            elif item:
                ws.write(r, ci, item, F(locked=False, **borda))
            else:
                ws.write_blank(r, ci, None, F(locked=False, bg_color="#fff6d6", **borda))
    ws.set_row(CAT_INI - 2, 24)
    ws.set_column("E:E", None, None, {"hidden": True})  # os meses (setinha do Início): escondidos, para ela não mexer
    ws.protect("", {"format_cells": True, "format_columns": True, "format_rows": True})

    # ------------------------------------------------------------ Resumo do ano (sozinho)
    ws = abas[S_RES]
    ws.set_column("A:A", 36)
    ws.set_column("B:M", 11.5)
    ws.set_column("N:N", 14)
    ws.set_row(0, 30)
    ws.merge_range("A1:N1", "", titulo)
    ws.write_formula("A1", f'="Resumo de "&{ANO}', titulo)
    ws.merge_range("A2:N2", "Esta aba se preenche sozinha. Para lançar, use as abas Ensaios, Fotos extras, Estúdio, Fixos pessoais "
                            "e Gastos do mês. O tracinho (–) quer dizer zero.", instr)
    ws.set_row(1, 22)
    cab_c = F(bold=True, bg_color=c["areia"], font_color=c["acento_escuro"], align="center", bottom=2, bottom_color=c["rosa"])
    ws.write("A4", "", F(bg_color=c["areia"], bottom=2, bottom_color=c["rosa"]))
    for m in range(12):
        ws.write(3, 1 + m, MES3[m], cab_c)
    ws.write(3, 13, "Total do ano", cab_c)
    ws.set_row(3, 22)
    ws.freeze_panes(4, 1)

    linhas = {}   # nome -> número da linha (1-based)
    r = [5]       # próxima linha livre (1-based)

    def periodo(aba, m):
        a = f"{q(aba)}!$A${LOG_INI}:$A${LOG_FIM}"
        return f'{a},">="&DATE({ANO},{m},1),{a},"<"&DATE({ANO},{m + 1},1)'

    def soma(aba, m, coluna="D", cat=None, cat_col="C", cat_val=None):
        v = f"{q(aba)}!${coluna}${LOG_INI}:${coluna}${LOG_FIM}"
        crit = ""
        if cat is not None:
            crit = f",{q(aba)}!${cat_col}${LOG_INI}:${cat_col}${LOG_FIM},{cat}"
        return f"SUMIFS({v}{crit},{periodo(aba, m)})"

    def linha(chave, rotulo, formula_mes, fmt_rot, fmt_val, fmt_tot=None, total="soma", altura=19, rotulo_formula=False):
        n = r[0]
        linhas[chave] = n
        ws.set_row(n - 1, altura)
        if rotulo_formula:
            ws.write_formula(n - 1, 0, rotulo, fmt_rot)
        else:
            ws.write(n - 1, 0, rotulo, fmt_rot)
        for m in range(1, 13):
            ws.write_formula(n - 1, m, "=" + formula_mes(m, n), fmt_val)
        if total == "soma":
            ws.write_formula(n - 1, 13, f'=IF($A{n}="","",SUM(B{n}:M{n}))' if rotulo_formula else f"=SUM(B{n}:M{n})", fmt_tot or fmt_val)
        elif total:
            ws.write_formula(n - 1, 13, "=" + total(n), fmt_tot or fmt_val)
        r[0] += 1
        return n

    def secao(texto, cor_fundo, cor_texto="#ffffff"):
        n = r[0]
        ws.set_row(n - 1, 22)
        ws.merge_range(n - 1, 0, n - 1, 13, texto, F(bold=True, bg_color=cor_fundo, font_color=cor_texto, font_size=12))
        r[0] += 1

    def espaco(h=10):
        ws.set_row(r[0] - 1, h)
        r[0] += 1

    rot = F(**borda)
    rot_sub = F(font_color=CINZA, italic=True, **borda)
    val = F(num_format=MOEDA, **borda)
    tot = F(num_format=MOEDA, bold=True, bg_color=c["areia"], **borda)
    rot_tot = F(bold=True, bg_color=c["areia"], **borda)
    L = lambda m: col(m)  # coluna do mês m (1 = B)

    # O resultado primeiro (o que ela quer saber), o detalhe depois.
    secao("O MÊS EM UMA LINHA", c["acento_escuro"])
    pos_res = r[0]
    r[0] += 6  # reservado: entrou, saiu, sobrou, estúdio deu, acumulado (preenchido no fim) + espaço
    secao("ENTRADAS: de onde veio o dinheiro", "#5f9b75")
    ini_tipos = r[0]
    for k in range(len(listas["tipos"][2])):
        linha(f"tipo{k}", f'=IF({celula_cat("tipos", k)}="","",{celula_cat("tipos", k)})',
              lambda m, n: f'IF($A{n}="","",{soma(S_ENS, m, cat=f"$A{n}")})', rot, val, rotulo_formula=True)
    fim_tipos = r[0] - 1
    linha("sem_tipo", "Ensaios sem tipo escolhido",
          lambda m, n: f"ROUND({soma(S_ENS, m)}-SUM({L(m)}{ini_tipos}:{L(m)}{fim_tipos}),2)", rot_sub, val)
    linha("fotos", "Fotos extras", lambda m, n: soma(S_FOT, m), rot, val)
    linha("entrou", "TOTAL QUE ENTROU", lambda m, n: f"SUM({L(m)}{ini_tipos}:{L(m)}{n - 1})", rot_tot, tot, altura=22)
    espaco()

    secao("GASTOS DO ESTÚDIO", c["acento"])
    ini_est = r[0]
    for k in range(len(listas["estudio"][2])):
        linha(f"est{k}", f'=IF({celula_cat("estudio", k)}="","",{celula_cat("estudio", k)})',
              lambda m, n: f'IF($A{n}="","",{soma(S_EST, m, cat=f"$A{n}")})', rot, val, rotulo_formula=True)
    fim_est = r[0] - 1
    linha("est_sem", "Sem tipo escolhido", lambda m, n: f"ROUND({soma(S_EST, m)}-SUM({L(m)}{ini_est}:{L(m)}{fim_est}),2)", rot_sub, val)
    linha("estudio", "TOTAL DO ESTÚDIO", lambda m, n: f"SUM({L(m)}{ini_est}:{L(m)}{n - 1})", rot_tot, tot, altura=22)
    espaco()

    secao("GASTOS FIXOS PESSOAIS", c["acento"])
    linha("fixos", "TOTAL DAS CONTAS FIXAS", lambda m, n: f"{q(S_FIX)}!{col(1 + m)}{FIX_TOT}", rot_tot, tot, altura=22)
    espaco()

    secao("GASTOS DO MÊS (Uber, Shopee, Mercado Livre…)", c["acento"])
    ini_mes = r[0]
    for k in range(len(listas["mes"][2])):
        linha(f"mes{k}", f'=IF({celula_cat("mes", k)}="","",{celula_cat("mes", k)})',
              lambda m, n: f'IF($A{n}="","",{soma(S_MES, m, cat=f"$A{n}")})', rot, val, rotulo_formula=True)
    fim_mes = r[0] - 1
    linha("mes_sem", "Sem tipo escolhido", lambda m, n: f"ROUND({soma(S_MES, m)}-SUM({L(m)}{ini_mes}:{L(m)}{fim_mes}),2)", rot_sub, val)
    linha("gastos_mes", "TOTAL DOS GASTOS DO MÊS", lambda m, n: f"SUM({L(m)}{ini_mes}:{L(m)}{n - 1})", rot_tot, tot, altura=22)
    espaco()

    secao("NÚMEROS DO MÊS", "#b8aeb0", c["tinta"])
    num = F(num_format='0;-0;"–"', align="right", **borda)
    linha("qtd_ensaios", "Ensaios feitos (quantos)",
          lambda m, n: f'COUNTIFS({periodo(S_ENS, m)})', rot, num)
    linha("ticket", "Valor médio por ensaio",
          lambda m, n: f'IF({L(m)}{n - 1}=0,0,ROUND((SUM({L(m)}{ini_tipos}:{L(m)}{fim_tipos})+{L(m)}{linhas["sem_tipo"]})/{L(m)}{n - 1},2))',
          rot, val, total=lambda n: f'IF(N{n - 1}=0,0,ROUND((SUM(N{ini_tipos}:N{fim_tipos})+N{linhas["sem_tipo"]})/N{n - 1},2))')
    linha("qtd_fotos", "Fotos extras vendidas (quantas)", lambda m, n: soma(S_FOT, m, coluna="C"), rot, num)
    linha("credito", "Pago no cartão de crédito (para conferir a fatura)",
          lambda m, n: f'{soma(S_EST, m, cat=chr(34) + "Crédito" + chr(34), cat_col="E")}+{soma(S_MES, m, cat=chr(34) + "Crédito" + chr(34), cat_col="E")}',
          rot, val)
    fim_tabela = r[0] - 1

    # o bloco do topo, agora que as linhas existem
    r_fim = r[0]
    r[0] = pos_res
    linha("r_entrou", "Entrou", lambda m, n: f"{L(m)}{linhas['entrou']}", F(bold=True, font_color=VERDE, **borda),
          F(num_format=MOEDA, bold=True, font_color=VERDE, **borda))
    linha("r_saiu", "Saiu (estúdio + fixos + gastos do mês)",
          lambda m, n: f"{L(m)}{linhas['estudio']}+{L(m)}{linhas['fixos']}+{L(m)}{linhas['gastos_mes']}",
          F(bold=True, font_color=VERM, **borda), F(num_format=MOEDA, bold=True, font_color=VERM, **borda))
    sob_fmt = F(num_format=MOEDA, bold=True, font_size=12, bg_color=c["areia"], **borda)
    linha("r_sobrou", "SOBROU (entrou − saiu)", lambda m, n: f"{L(m)}{n - 2}-{L(m)}{n - 1}",
          F(bold=True, font_size=12, bg_color=c["areia"], **borda), sob_fmt, altura=24)
    linha("r_estudio", "O estúdio deu (entrou − gastos do estúdio)",
          lambda m, n: f"{L(m)}{linhas['entrou']}-{L(m)}{linhas['estudio']}", rot, val)
    linha("r_acum", "Sobra acumulada no ano",
          lambda m, n: f'IF(AND({L(m)}{n - 4}=0,{L(m)}{n - 3}=0),"",SUM($B{n - 2}:{L(m)}{n - 2}))', rot_sub, val, total=None)
    r[0] = r_fim
    for chave in ("r_sobrou", "r_estudio"):
        n = linhas[chave]
        ws.conditional_format(n - 1, 1, n - 1, 13, {"type": "cell", "criteria": "<", "value": 0,
                                                    "format": wb.add_format({"font_color": VERM, "bg_color": VERM_F})})
        ws.conditional_format(n - 1, 1, n - 1, 13, {"type": "cell", "criteria": ">", "value": 0,
                                                    "format": wb.add_format({"font_color": VERDE, "bg_color": VERDE_F})})
    n = linhas["r_acum"]
    ws.conditional_format(n - 1, 1, n - 1, 12, {"type": "cell", "criteria": "<", "value": 0, "format": wb.add_format({"font_color": VERM})})

    # gráfico: entrou × saiu por mês, com a linha do que sobrou
    graf = wb.add_chart({"type": "column"})
    graf.add_series({"name": "Entrou", "categories": [S_RES, 3, 1, 3, 12], "values": [S_RES, linhas["r_entrou"] - 1, 1, linhas["r_entrou"] - 1, 12],
                     "fill": {"color": "#6aa883"}, "border": {"none": True}, "gap": 60})
    graf.add_series({"name": "Saiu", "categories": [S_RES, 3, 1, 3, 12], "values": [S_RES, linhas["r_saiu"] - 1, 1, linhas["r_saiu"] - 1, 12],
                     "fill": {"color": "#d08a98"}, "border": {"none": True}})
    graf.add_series({"name": "Sobrou", "categories": [S_RES, 3, 1, 3, 12], "values": [S_RES, linhas["r_sobrou"] - 1, 1, linhas["r_sobrou"] - 1, 12],
                     "fill": {"color": c["acento_escuro"]}, "border": {"none": True}})
    graf.set_title({"name": "Entrou, saiu e sobrou em cada mês", "name_font": {"size": 12, "bold": True, "color": c["tinta"]}})
    graf.set_y_axis({"num_format": '"R$" #,##0', "major_gridlines": {"visible": True, "line": {"color": "#eee6e3"}},
                     "line": {"none": True}, "num_font": {"color": CINZA}})
    graf.set_x_axis({"num_font": {"color": CINZA}, "line": {"color": BORDA}, "label_position": "low"})
    graf.set_legend({"position": "bottom"})
    graf.set_chartarea({"border": {"none": True}})
    graf.set_size({"width": 1010, "height": 330})
    ws.insert_chart(fim_tabela + 1, 0, graf, {"x_offset": 4, "y_offset": 12})
    ws.protect("", {"format_cells": True, "format_columns": True, "format_rows": True})
    ws.set_landscape()
    ws.fit_to_pages(1, 0)
    ws.repeat_rows(3)

    # ------------------------------------------------------------ Início
    ws = abas[S_INI]
    ws.activate()
    ws.set_column("A:A", 2)
    ws.set_column("B:D", 25)
    ws.set_column("E:E", 3)
    ws.set_column("F:F", 2)
    ws.set_column("H:H", None, None, {"hidden": True})
    acento = c["acento"]
    ws.set_row(0, 38)
    ws.merge_range("B1:D1", "Planilha financeira", F(bold=True, font_size=22, font_color="#ffffff", bg_color=acento, indent=1))
    ws.set_row(1, 24)
    ws.merge_range("B2:D2", cfg["nome"], F(italic=True, font_size=13, font_color="#fbe9ec", bg_color=acento, indent=1, valign="top"))
    if teste:
        ws.set_row(2, 34)
        ws.merge_range("B3:D3", "VERSÃO DE TESTE, com dados de exemplo (inventados). Mexa à vontade: a sua vem limpa, com as suas contas.",
                       F(bold=True, text_wrap=True, font_color="#7a4b00", bg_color="#fff1c9", indent=1))
    else:
        ws.set_row(2, 10)
    ws.set_row(3, 24)
    ws.set_row(4, 24)
    lab = F(bold=True, font_color=c["acento_escuro"], align="right", indent=1)
    entrada = F(locked=False, bold=True, font_size=13, bg_color=INPUT, border=2, border_color=c["rosa"], align="center")
    ws.write("B4", "Ano", lab)
    ws.write_number("C4", ano, entrada)
    ws.write("B5", "Mês que você quer ver", lab)
    ws.write("C5", MESES[mes_sel - 1], entrada)
    ws.write("D5", "← troque o mês na setinha", F(italic=True, font_color=CINZA, font_size=10))
    ws.data_validation("C4", {"validate": "integer", "criteria": "between", "minimum": 2020, "maximum": 2040,
                              "error_title": "Ano", "error_message": "Escreva o ano com 4 números. Ex.: 2026"})
    ws.data_validation("C5", {"validate": "list", "source": "=" + faixa("meses"), "error_title": "Mês",
                              "error_message": "Escolha o mês na setinha."})
    ws.write_formula("H5", f"=IFERROR(MATCH(C5,{faixa('meses')},0),1)", None, mes_sel)

    def do_mes(chave):
        n = linhas[chave]
        return f"INDEX({q(S_RES)}!$B${n}:$M${n},1,$H$5)"

    ws.set_row(5, 12)
    ws.set_row(6, 20)
    ws.set_row(7, 40)
    ws.set_row(8, 18)
    cartoes = [("B", "ENTROU", "r_entrou", VERDE, VERDE_F, "ensaios + fotos extras"),
               ("C", "SAIU", "r_saiu", VERM, VERM_F, "estúdio + fixos + gastos do mês"),
               ("D", "SOBROU", "r_sobrou", c["acento_escuro"], c["areia"], None)]
    for L_, txt, chave, cor_t, cor_f, legenda in cartoes:
        ws.write(f"{L_}7", txt, F(bold=True, font_size=10, font_color=cor_t, bg_color=cor_f, indent=1, top=2, top_color=cor_t))
        ws.write_formula(f"{L_}8", "=" + do_mes(chave), F(bold=True, font_size=20, font_color=cor_t, bg_color=cor_f, num_format=MOEDA, indent=1))
        if legenda:
            ws.write(f"{L_}9", legenda, F(font_size=9, italic=True, font_color=CINZA, bg_color=cor_f, indent=1))
    ws.write_formula("D9", '=IF(D8<0,"ficou no vermelho",IF(D8>0,"ficou no azul",""))',
                     F(font_size=9, italic=True, bold=True, font_color=CINZA, bg_color=c["areia"], indent=1))
    ws.conditional_format("D8", {"type": "cell", "criteria": "<", "value": 0, "format": wb.add_format({"font_color": VERM, "bg_color": VERM_F})})
    ws.conditional_format("D8", {"type": "cell", "criteria": ">", "value": 0, "format": wb.add_format({"font_color": VERDE, "bg_color": VERDE_F})})
    ws.conditional_format("D7", {"type": "formula", "criteria": "=$D$8<0", "format": wb.add_format({"font_color": VERM, "bg_color": VERM_F})})
    ws.conditional_format("D7", {"type": "formula", "criteria": "=$D$8>0", "format": wb.add_format({"font_color": VERDE, "bg_color": VERDE_F})})
    ws.conditional_format("D9", {"type": "formula", "criteria": "=$D$8<0", "format": wb.add_format({"font_color": VERM, "bg_color": VERM_F})})
    ws.conditional_format("D9", {"type": "formula", "criteria": "=$D$8>0", "format": wb.add_format({"font_color": VERDE, "bg_color": VERDE_F})})

    sec = F(bold=True, font_color=c["acento_escuro"], bottom=2, bottom_color=c["rosa"], font_size=12)
    item = F(indent=1, bottom=1, bottom_color="#efe7e4")
    item_v = F(num_format=MOEDA, align="right", bottom=1, bottom_color="#efe7e4")
    item_n = F(num_format='0;-0;"–"', align="right", bottom=1, bottom_color="#efe7e4")
    item_dest = F(bold=True, bottom=1, bottom_color="#efe7e4")

    def bloco(linha0, titulo_bloco, itens):
        ws.set_row(linha0 - 1, 26)
        ws.merge_range(f"B{linha0}:D{linha0}", titulo_bloco, sec)
        for k, (rotulo, formula, fmt) in enumerate(itens):
            n = linha0 + 1 + k
            ws.set_row(n - 1, 20)
            ws.merge_range(f"B{n}:C{n}", rotulo, item)
            ws.write_formula(f"D{n}", "=" + formula, fmt)
        return linha0 + 1 + len(itens)

    soma_tipos = f"SUM(INDEX({q(S_RES)}!$B${ini_tipos}:$M${linhas['sem_tipo']},0,$H$5))"
    prox = bloco(11, "De onde veio o dinheiro", [
        ("Ensaios e aniversários", soma_tipos, item_v),
        ("Fotos extras", do_mes("fotos"), item_v),
        ("Ensaios feitos no mês (quantos)", do_mes("qtd_ensaios"), item_n),
        ("Fotos extras vendidas (quantas)", do_mes("qtd_fotos"), item_n),
    ])
    para_ini = prox + 2  # primeira linha dos itens de "Para onde foi" (a rosquinha usa as três primeiras)
    prox = bloco(prox + 1, "Para onde foi", [
        ("Gastos do estúdio", do_mes("estudio"), item_v),
        ("Fixos pessoais", do_mes("fixos"), item_v),
        ("Gastos do mês (Uber, Shopee, Mercado Livre…)", do_mes("gastos_mes"), item_v),
        ("Disso, no cartão de crédito", do_mes("credito"), item_v),
    ])
    # destaques: rótulo em B, nome da categoria em C, valor em D
    d0 = prox + 1
    ws.set_row(d0 - 1, 26)
    ws.merge_range(f"B{d0}:D{d0}", "Destaques do mês", sec)

    def destaque(n, rotulo, ini, fim):
        faixa_val = f"INDEX({q(S_RES)}!$B${ini}:$M${fim},0,$H$5)"
        ws.set_row(n - 1, 20)
        ws.write(f"B{n}", rotulo, item)
        ws.write_formula(f"C{n}", f'=IF(MAX({faixa_val})<=0,"–",INDEX({q(S_RES)}!$A${ini}:$A${fim},MATCH(MAX({faixa_val}),{faixa_val},0)))', item_dest)
        ws.write_formula(f"D{n}", f"=MAX(0,MAX({faixa_val}))", item_v)

    ws.set_row(d0, 20)
    ws.merge_range(f"B{d0 + 1}:C{d0 + 1}", "O estúdio deu (entrou − gastos do estúdio)", item)
    ws.write_formula(f"D{d0 + 1}", "=" + do_mes("r_estudio"), F(num_format=MOEDA, align="right", bold=True, bottom=1, bottom_color="#efe7e4"))
    ws.conditional_format(f"D{d0 + 1}", {"type": "cell", "criteria": "<", "value": 0, "format": wb.add_format({"font_color": VERM})})
    destaque(d0 + 2, "O ensaio que mais rendeu", ini_tipos, fim_tipos)
    destaque(d0 + 3, "O maior gasto do estúdio", ini_est, fim_est)
    destaque(d0 + 4, "O maior gasto do mês", ini_mes, fim_mes)
    prox = d0 + 5
    # aviso de lançamentos que ficaram fora das contas
    ws.set_row(prox - 1, 8)
    ws.set_row(prox, 30)
    ws.merge_range(f"B{prox + 1}:D{prox + 1}", "", F(bold=True, font_color=VERM, text_wrap=True))
    soma_avisos = "+".join(f"{q(a)}!$H$3" for a in (S_ENS, S_FOT, S_EST, S_MES))
    ws.write_formula(f"B{prox + 1}", f'=IF(({soma_avisos})>0,"Atenção: "&({soma_avisos})&" lançamento(s) sem data ou de outro ano não entraram nas contas. A data fica vermelha na aba.","")',
                     F(bold=True, font_color=VERM, text_wrap=True))
    # como usar
    c0 = prox + 2
    ws.set_row(c0 - 1, 26)
    ws.merge_range(f"B{c0}:D{c0}", "Como usar (é só isso)", sec)
    passos = [
        ("Fez um ensaio ou aniversário?", S_ENS),
        ("Vendeu foto extra?", S_FOT),
        ("Gasto do estúdio (aluguel, luz, bexigas, cenários…)?", S_EST),
        ("Conta fixa da casa (colégio, condomínio, internet…)?", S_FIX),
        ("Uber, Shopee, Mercado Livre, mercado, iFood…?", S_MES),
    ]
    link = F(font_color=c["acento"], bold=True, underline=1, bottom=1, bottom_color="#efe7e4")
    for k, (pergunta, aba) in enumerate(passos):
        n = c0 + 1 + k
        ws.set_row(n - 1, 21)
        ws.merge_range(f"B{n}:C{n}", pergunta, item)
        ws.write_url(f"D{n}", f"internal:'{aba}'!A1", link, string=f"→ aba {aba}")
    n = c0 + 1 + len(passos)
    ws.set_row(n - 1, 64)
    ws.merge_range(f"B{n}:D{n}", "Em cada aba, uma linha por coisa: a data, o que foi, o tipo (na setinha) e o valor. "
                                 "O Resumo do ano e esta página somam sozinhos. O cartão de crédito não é um gasto, é um jeito de pagar: "
                                 "lance cada compra no tipo dela e marque \"Crédito\" em Como pagou.",
                   F(text_wrap=True, valign="top", font_color=c["tinta"], indent=1, top=1, top_color="#efe7e4"))
    ws.set_row(n + 1, 18)
    ws.merge_range(f"B{n + 2}:D{n + 2}", f"Feita sob medida para o {cfg['nome']} pela Renderiza · renderizaweb.com.br",
                   F(font_size=9, italic=True, font_color="#a89b9d"))

    # rosquinha: para onde foi o dinheiro no mês
    rosca = wb.add_chart({"type": "doughnut"})
    rosca.add_series({"name": "Para onde foi", "categories": [S_INI, para_ini - 1, 1, para_ini + 1, 1],
                      "values": [S_INI, para_ini - 1, 3, para_ini + 1, 3],
                      "points": [{"fill": {"color": c["acento"]}}, {"fill": {"color": c["rosa"]}}, {"fill": {"color": "#e8c9a9"}}],
                      "data_labels": {"percentage": True, "font": {"color": "#ffffff", "bold": True}}})
    rosca.set_title({"name": "Para onde foi o dinheiro no mês", "name_font": {"size": 11, "bold": True, "color": c["tinta"]}})
    rosca.set_legend({"position": "bottom", "font": {"size": 9}})
    rosca.set_hole_size(55)
    rosca.set_chartarea({"border": {"none": True}})
    rosca.set_size({"width": 360, "height": 300})
    ws.insert_chart("G4", rosca, {"x_offset": 6})
    ws.protect("", {"format_cells": True, "format_columns": True, "format_rows": True})
    ws.fit_to_pages(1, 1)
    wb.close()
    return {"linhas": linhas, "ini_tipos": ini_tipos, "fim_tipos": fim_tipos, "exemplo": ex, "LOG_FIM": LOG_FIM}


# ---------------------------------------------------------------- LibreOffice: recalcula de verdade (e em português)
def libreoffice(caminho, formato, pasta):
    """Converte com o LibreOffice num perfil próprio: recalcula as fórmulas ao abrir e formata como no Brasil
    (R$ 1.234,56). Devolve o caminho do arquivo convertido."""
    import subprocess
    perfil = os.path.join(pasta, "perfil")
    os.makedirs(os.path.join(perfil, "user"), exist_ok=True)
    with open(os.path.join(perfil, "user", "registrymodifications.xcu"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><oor:items xmlns:oor="http://openoffice.org/2001/registry" '
                'xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
                '<item oor:path="/org.openoffice.Office.Calc/Formula/Load"><prop oor:name="OOXMLRecalcMode" oor:op="fuse">'
                '<value>0</value></prop></item><item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooSetupSystemLocale" '
                'oor:op="fuse"><value>pt-BR</value></prop></item></oor:items>')
    subprocess.run(["soffice", f"-env:UserInstallation=file://{perfil}", "--headless", "--convert-to", formato, "--outdir", pasta, caminho],
                   check=True, capture_output=True, timeout=180)
    return os.path.join(pasta, os.path.splitext(os.path.basename(caminho))[0] + "." + formato)


def imagens(caminho, pasta_saida):
    """A imagem da página da proposta (WebP): a primeira aba da versão de teste, como o LibreOffice imprime."""
    import subprocess
    import tempfile
    from PIL import Image
    tmp = tempfile.mkdtemp(prefix="planilha-img-")
    pdf = libreoffice(caminho, "pdf", tmp)
    paginas = int(next(l.split()[1] for l in subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout.splitlines()
                       if l.startswith("Pages:")))
    primeira = {}
    for p in range(1, paginas + 1):
        txt = subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), pdf, "-"], capture_output=True, text=True).stdout
        linha = next((l.strip() for l in txt.splitlines() if l.strip()), "")
        primeira.setdefault(linha.split("  ")[0], p)
    dpi = 160
    k = dpi / 70  # os recortes foram medidos a 70 dpi
    recortes = {  # nome: (primeira linha da página, página seguinte?, caixa a 70 dpi)
        "inicio": ("Planilha financeira", 0, (30, 30, 522, 440)),
    }
    os.makedirs(pasta_saida, exist_ok=True)
    feitas = []
    for nome, (inicio, salto, (x0, y0, x1, y1)) in recortes.items():
        pag = next(v for t, v in primeira.items() if t.startswith(inicio)) + salto
        base = os.path.join(tmp, f"p{pag}")
        subprocess.run(["pdftoppm", "-r", str(dpi), "-png", "-singlefile", "-f", str(pag), "-l", str(pag), pdf, base], check=True)
        im = Image.open(base + ".png").convert("RGB").crop((int(x0 * k), int(y0 * k), int(x1 * k), int(y1 * k)))
        destino = os.path.join(pasta_saida, nome + ".webp")
        im.save(destino, "WEBP", quality=88, method=6)
        feitas.append((destino, im.size))
        # o recorte que a página usa: a primeira aba sem a rosquinha (a coluna da página é estreita)
        cel = im.crop((0, 0, int(im.size[0] * 0.62), im.size[1]))
        destino = os.path.join(pasta_saida, nome + "-cel.webp")
        cel.save(destino, "WEBP", quality=88, method=6)
        feitas.append((destino, cel.size))
    return feitas


# ---------------------------------------------------------------- conferência no LibreOffice (recalcula de verdade)
def conferir(caminho, info, ano, mes_sel, cfg):
    import shutil
    import tempfile
    from openpyxl import load_workbook
    tmp = tempfile.mkdtemp(prefix="planilha-")
    wb = load_workbook(libreoffice(caminho, "xlsx", tmp), data_only=True)
    ex = info["exemplo"]
    erros = []

    def perto(a, b):
        return abs((a or 0) - b) < 0.005

    res = wb[S_RES]
    L = info["linhas"]
    for m in range(1, 13):
        ent = sum(e[3] for e in ex["ensaios"] if e[0].month == m) + sum(f[3] for f in ex["fotos"] if f[0].month == m)
        est = sum(e[3] for e in ex["estudio"] if e[0].month == m)
        fix = sum(v.get(m, 0) for v in ex["fixos"].values())
        gm = sum(e[3] for e in ex["mes"] if e[0].month == m)
        cred = sum(e[3] for e in ex["estudio"] + ex["mes"] if e[0].month == m and e[4] == "Crédito")
        qtd = sum(1 for e in ex["ensaios"] if e[0].month == m)
        esperado = {"r_entrou": ent, "r_saiu": est + fix + gm, "r_sobrou": ent - est - fix - gm, "estudio": est, "fixos": fix,
                    "gastos_mes": gm, "credito": cred, "qtd_ensaios": qtd, "r_estudio": ent - est}
        for chave, v in esperado.items():
            got = res.cell(L[chave], 1 + m).value
            if not perto(got if isinstance(got, (int, float)) else 0, v):
                erros.append(f"Resumo {chave} mês {m}: {got} ≠ {v}")
        for k, tipo in enumerate(cfg["tipos_de_ensaio"]):
            v = sum(e[3] for e in ex["ensaios"] if e[0].month == m and e[2] == tipo)
            got = res.cell(L[f"tipo{k}"], 1 + m).value
            if not perto(got if isinstance(got, (int, float)) else 0, v):
                erros.append(f"Resumo {tipo} mês {m}: {got} ≠ {v}")
    ini = wb[S_INI]
    m = mes_sel
    ent = sum(e[3] for e in ex["ensaios"] if e[0].month == m) + sum(f[3] for f in ex["fotos"] if f[0].month == m)
    print(f"  Início ({MESES[m - 1]}): entrou {ini['B8'].value} · saiu {ini['C8'].value} · sobrou {ini['D8'].value} · {ini['D9'].value}")
    if not perto(ini["B8"].value, ent):
        erros.append(f"Início entrou {ini['B8'].value} ≠ {ent}")
    for r in range(10, 40):
        vals = [ini.cell(r, cc).value for cc in (2, 3, 4)]
        if any(v not in (None, "") for v in vals):
            print("   ", " | ".join("" if v is None else str(v) for v in vals))
    for aba in (S_RES, S_INI, S_ENS, S_FOT, S_EST, S_MES, S_FIX):
        for row in wb[aba].iter_rows():
            for cel in row:
                if isinstance(cel.value, str) and cel.value.startswith("#") or cel.value in ("#NAME?", "#VALUE!", "#REF!", "Err:504", "Err:508"):
                    erros.append(f"{aba}!{cel.coordinate}: {cel.value}")
    shutil.rmtree(tmp, ignore_errors=True)
    return erros


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("config")
    hoje = dt.date.today()
    ap.add_argument("--ano", type=int, default=hoje.year)
    ap.add_argument("--mes", type=int, default=hoje.month)
    ap.add_argument("--saida", default=None, help="padrão: rascunhos/planilha/<pasta da config>")
    ap.add_argument("--conferir", action="store_true")
    ap.add_argument("--imagens", action="store_true", help="gera as imagens da página da proposta em <saida>/img")
    a = ap.parse_args()
    with open(a.config, encoding="utf-8") as f:
        cfg = json.load(f)
    a.saida = a.saida or os.path.join("rascunhos", "planilha", os.path.basename(os.path.dirname(os.path.abspath(a.config))))
    os.makedirs(a.saida, exist_ok=True)
    teste = os.path.join(a.saida, cfg["arquivo"] + "-TESTE.xlsx")
    final = os.path.join(a.saida, cfg["arquivo"] + ".xlsx")
    info = gerar(cfg, teste, a.ano, a.mes, True)
    gerar(cfg, final, a.ano, a.mes, False)
    print(f"{teste}\n{final}")
    if a.conferir:
        erros = conferir(teste, info, a.ano, a.mes, cfg)
        if erros:
            print("CONFERÊNCIA: " + str(len(erros)) + " problema(s)\n  " + "\n  ".join(erros[:40]))
            sys.exit(1)
        print("Conferência no LibreOffice: as contas batem com os lançamentos de exemplo.")
    if a.imagens:
        for destino, tam in imagens(teste, os.path.join(a.saida, "img")):
            print(f"{destino} ({tam[0]}×{tam[1]})")


if __name__ == "__main__":
    main()
