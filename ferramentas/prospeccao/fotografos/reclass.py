import re
SUB = r'(^|\.)(alboompro\.com|46graus\.com|myportfolio\.com|my\.canva\.site|canva\.site|wixsite\.com|negocio\.site|carrd\.co|webnode\.[a-z.]+|godaddysites\.com|site123\.me|sites\.google\.com|google\.com|picsize\.com\.br|fotografo\.me)$'
def reclass(d):
    h = (d.get('host') or '').lower()
    if d.get('tipo_site') == 'funcionando' and re.search(SUB, h):
        d['tipo_site'] = 'subdominio'; d['subdominio'] = h
    return d
