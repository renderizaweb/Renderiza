# Telefone de celular (WhatsApp do dono) x fixo (WhatsApp Business no balcão).
import re
def digitos(t): return re.sub(r'\D', '', t or '')
def eh_celular(t):
    d = digitos(t)
    if d.startswith('55') and len(d) in (12, 13): d = d[2:]
    return len(d) == 11 and d[2] == '9'
def achar_celulares(texto):
    acha = re.findall(r'(?:\(?\b(?:11|1[1-9])\)?\s?)?9\s?\d{4}[-\s.]?\d{4}', texto or '')
    return [a for a in acha if len(digitos(a)) in (9, 11)]
