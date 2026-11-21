# Lote 4: buscas amplas (qualquer especialidade) na Grande SP. 8 termos girando, 3 por local (4 nas cidades grandes).
T = ['fotógrafa em {}', 'estúdio fotográfico em {}', 'fotógrafa newborn em {}', 'fotógrafo de eventos em {}',
     'ensaio gestante em {}', 'fotógrafo de família em {}', 'estúdio fotográfico infantil em {}', 'smash the cake em {}']
cap = ['Santana','Tucuruvi','Vila Maria','Casa Verde','Freguesia do Ó','Brasilândia','Pirituba','Jaçanã','Tremembé','Vila Guilherme','Mandaqui','Limão',
 'Tatuapé','Mooca','Penha','Vila Matilde','Itaquera','São Mateus','Guaianases','Itaim Paulista','São Miguel Paulista','Ermelino Matarazzo','Vila Formosa','Aricanduva','Sapopemba','Vila Prudente','Cidade Tiradentes','Artur Alvim','Vila Carrão','Água Rasa',
 'Santo Amaro','Campo Limpo','Capão Redondo','Jabaquara','Saúde','Vila Mariana','Moema','Ipiranga','Cidade Ademar','Grajaú','Interlagos','Cursino','Socorro','Vila Andrade',
 'Lapa','Butantã','Pinheiros','Perdizes','Rio Pequeno','Jaguaré','Vila Leopoldina','Bela Vista',
 'Vila Sônia','Morumbi','Brooklin','Campo Belo','Sacomã','Cambuci','Aclimação','Belém','Vila Ema','Cangaíba','Ponte Rasa','Jardim Helena','Parque do Carmo','José Bonifácio','Jardim Ângela','Jardim São Luís','Cidade Dutra','Pedreira','Jaraguá','Perus','Cachoeirinha','Vila Medeiros','Parada Inglesa','Vila Sabrina']
cid = ['Guarulhos','Osasco','Carapicuíba','Barueri','Santana de Parnaíba','Cotia','Taboão da Serra','Embu das Artes','Itapecerica da Serra','Santo André','São Bernardo do Campo','São Caetano do Sul','Diadema','Mauá','Ribeirão Pires','Mogi das Cruzes','Suzano','Poá','Ferraz de Vasconcelos','Itaquaquecetuba','Arujá','Franco da Rocha','Caieiras','Francisco Morato','Mairiporã','Jandira','Itapevi','Cajamar','Santa Isabel','Vargem Grande Paulista','Embu-Guaçu','Rio Grande da Serra','Biritiba Mirim','Guararema']
locs = [f'{b} São Paulo' for b in cap] + [f'{c} SP' for c in cid]
grandes = {'Guarulhos SP','Osasco SP','Santo André SP','São Bernardo do Campo SP','Mogi das Cruzes SP','Mauá SP','Diadema SP','Carapicuíba SP','Barueri SP','Suzano SP','Cotia SP'}
qs = []; k = 0
for l in locs:
    n = 4 if l in grandes else 3
    for j in range(n): qs.append(T[(k + j) % len(T)].format(l))
    k += 3
N = 7
print(len(qs), 'buscas em', len(locs), 'lugares')
for i in range(N): open(f'q{i}.txt','w').write('\n'.join(qs[i::N]) + '\n')
