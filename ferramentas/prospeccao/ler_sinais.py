# Lê as avaliações coletadas pelo sinais.mjs: nomes citados no atendimento, menção a dono/dona e respostas do proprietário.
import json, re, collections
NAO = set('Ótica Otica Óptica Optica Google Deus São Paulo Santo André Bernardo Brasil Muito Excelente Ótimo Otimo Ótima Otima Super Top Atendimento Recomendo Parabéns Parabens Gostei Amei Lugar Loja Equipe Pessoal Profissionais Óculos Oculos Lentes Preço Preco Obrigado Obrigada Agradeço Agradeco Local Fui Comprei Fiz Melhor Nota Pessoas Todos Tudo Sempre Muita Rapidez Qualidade Variedade Ray Ban Zeiss Varilux Hoya Essilor Transitions Natal Dia Mães Pais Centro Vila Jardim Rua Avenida Av Shopping Mogi Guarulhos Osasco Diadema Mauá Suzano Cotia Barueri Ele Ela Eles Elas Você Voce Vocês Voces Senhor Senhora Sr Sra Dr Dra Doutor Doutora Mais Menos Com Sem Pela Pelo Uma Um Meu Minha Nosso Nossa Esse Essa Este Esta Isso Aqui Lá Ali Quando Onde Como Porque Pois Mas Tem Vale Bom Boa Bem Lindo Linda Grande Pequena Nova Novo Primeira Segunda Hoje Ontem Semana Ano Anos Mês Meses Sábado Domingo Segunda Terça Quarta Quinta Sexta Instagram WhatsApp Whatsapp Facebook Local Guide Guia'.split())
padrao = re.compile(r'\b(?:pel[ao]|com [ao]|d[ao]|[ao]|à|ao|dona|dono|propriet[áa]ri[ao]|atendente|vendedora?|consultora?|optometrista|t[ée]cnic[ao])\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{2,})\b')
def ler(r):
    txts = r.get('avaliacoes', [])
    nomes = collections.Counter(); dono_mencoes = 0; respostas = 0; corpo = []
    for t in txts:
        partes = re.split(r'Resposta do propriet[áa]rio', t, maxsplit=1)
        if len(partes) == 2: respostas += 1
        c = partes[0]
        linhas = c.split('\n')
        c = '\n'.join(linhas[2:]) if len(linhas) > 2 else c   # tira o nome e o "Local Guide" de quem avaliou
        corpo.append(c)
        if re.search(r'\b(dono|dona|propriet[áa]ri[ao]|s[óo]ci[ao])\b', c, re.I): dono_mencoes += 1
        for m in padrao.finditer(c):
            n = m.group(1)
            if n not in NAO: nomes[n] += 1
    return {'n_aval_lidas': len(txts), 'respostas_dono': respostas, 'mencoes_dono': dono_mencoes,
            'nomes': nomes.most_common(6), 'n_nomes_distintos': sum(1 for n, k in nomes.items() if k >= 2)}
if __name__ == '__main__':
    import sys
    for l in open(sys.argv[1]):
        r = json.loads(l); print(r['nome'][:40], ler(r))
