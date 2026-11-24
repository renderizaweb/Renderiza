# Baixa uma pasta compartilhada do Drive (o link "qualquer pessoa com o link"), com as subpastas, sem o conector:
# lista pela página pública da pasta (embeddedfolderview) e baixa cada arquivo pelo id (drive.usercontent).
#
# Uso: python3 -I ferramentas/demo/baixar-drive.py <id da pasta> <saída>
#   <id da pasta>: o pedaço depois de /folders/ no link do Kaue (ex.: 1Ow85sJ4tiRY1HQklfi84Pv3Aw3kfuHp3).
#   Retoma de onde parou (arquivo que já existe e não está vazio é pulado). Uns 6 arquivos por minuto por pasta:
#   rode uma pasta por fotógrafa em paralelo. A página salva (Instagram.html) vem por último: para ler a bio antes,
#   baixe só ela pelo id.
# A saída fica na pasta de trabalho (fora do git): é material baixado, Python sempre com -I.
import html, os, re, subprocess, sys, time


def listar(pasta_id):
    t = subprocess.run(['curl', '-sSL', '-m', '60', f'https://drive.google.com/embeddedfolderview?id={pasta_id}'],
                       capture_output=True, text=True).stdout
    itens = []
    for m in re.finditer(r'<a href="([^"]+)"[^>]*>.*?<div class="flip-entry-title">([^<]+)</div>', t, re.S):
        url, nome = html.unescape(m.group(1)), html.unescape(m.group(2)).replace('/', '_')
        if '/folders/' in url:
            itens.append(('pasta', re.search(r'/folders/([\w-]+)', url).group(1), nome))
        elif (a := re.search(r'/file/d/([\w-]+)', url)):
            itens.append(('arquivo', a.group(1), nome))
    return itens


def baixar(pasta_id, saida, contagem):
    os.makedirs(saida, exist_ok=True)
    for tipo, i, nome in listar(pasta_id):
        destino = os.path.join(saida, nome)
        if tipo == 'pasta':
            baixar(i, destino, contagem)
            continue
        if os.path.exists(destino) and os.path.getsize(destino) > 0:
            continue
        for tentativa in range(4):
            r = subprocess.run(['curl', '-sSL', '-m', '120', '-o', destino,
                                f'https://drive.usercontent.google.com/download?id={i}&export=download&confirm=t'])
            if r.returncode == 0 and os.path.exists(destino) and os.path.getsize(destino) > 0:
                break
            time.sleep(2 ** tentativa)
        contagem[0] += 1


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit('uso: python3 -I ferramentas/demo/baixar-drive.py <id da pasta> <saída>')
    n = [0]
    baixar(sys.argv[1], sys.argv[2], n)
    print(n[0], 'arquivos baixados em', sys.argv[2])
