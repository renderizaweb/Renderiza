# Monta as buscas do lote 2: 5 termos do nicho girando por bairro/cidade da Grande SP (2 termos por local, prioridade às áreas que faltaram no lote 1).
import itertools
T = ['fotógrafa newborn em {}', 'ensaio gestante em {}', 'fotógrafo de família em {}', 'estúdio fotográfico infantil em {}', 'smash the cake em {}']
cap = ['Santana','Tucuruvi','Vila Maria','Casa Verde','Freguesia do Ó','Brasilândia','Pirituba','Jaçanã','Tremembé','Vila Guilherme','Mandaqui','Limão',
 'Tatuapé','Mooca','Penha','Vila Matilde','Itaquera','São Mateus','Guaianases','Itaim Paulista','São Miguel Paulista','Ermelino Matarazzo','Vila Formosa','Aricanduva','Sapopemba','Vila Prudente','Cidade Tiradentes','Artur Alvim','Carrão','Água Rasa',
 'Santo Amaro','Campo Limpo','Capão Redondo','Jabaquara','Saúde','Vila Mariana','Moema','Ipiranga','Cidade Ademar','Grajaú','Interlagos','Cursino','Socorro','Vila Andrade',
 'Lapa','Butantã','Pinheiros','Perdizes','Rio Pequeno','Jaguaré','Vila Leopoldina','Bela Vista']
cid = ['Guarulhos','Osasco','Carapicuíba','Barueri','Santana de Parnaíba','Cotia','Taboão da Serra','Embu das Artes','Itapecerica da Serra','Santo André','São Bernardo do Campo','São Caetano do Sul','Diadema','Mauá','Ribeirão Pires','Mogi das Cruzes','Suzano','Poá','Ferraz de Vasconcelos','Itaquaquecetuba','Arujá','Franco da Rocha','Caieiras','Francisco Morato','Mairiporã','Jandira','Itapevi','Cajamar']
locs = [f'{b} São Paulo' for b in cap] + [f'{c} SP' for c in cid]
# cidades grandes ganham 3 termos
grandes = {'Guarulhos SP','Osasco SP','Santo André SP','São Bernardo do Campo SP','Mogi das Cruzes SP','Mauá SP'}
qs = []; k = 0
for l in locs:
    n = 3 if l in grandes else 2
    for j in range(n):
        qs.append(T[(k + j) % 5].format(l))
    k += 1
print(len(qs))
for i in range(6):
    open(f'q{i}.txt','w').write('\n'.join(qs[i::6]) + '\n')
