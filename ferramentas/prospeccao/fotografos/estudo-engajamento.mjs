import {readFileSync,writeFileSync} from 'node:fs';
// Estudo de quem esquentou (lote 4): tempo, visitas, dias, repasse e partes vistas de cada lead de fotografia, só das clientes
// (a mesma regra do painel para separar as nossas visitas). Uso: node estudo-engajamento.mjs  (na pasta dos .json do estudo-baixar)
import {agruparVisitas,ipsDaEquipe,visitantesDaEquipe,resumoDasVisitas} from '../../../painel/src/visitas.js';
const L=JSON.parse(readFileSync('leads.json')),V=JSON.parse(readFileSync('visitas.json'));
const ipsE=ipsDaEquipe(V),visE=visitantesDaEquipe(V);
const F=L.filter(l=>l.segmento==='Fotografia');
const out=[];
for(const l of F){
  const gs=agruparVisitas(V.filter(v=>v.lead_id===l.id),ipsE,visE);
  const r=resumoDasVisitas(gs);
  const cl=gs.filter(g=>g.quem==='cliente');
  const dias=new Set(cl.map(g=>g.inicio.slice(0,10))).size;
  const fimDemo=cl.some(g=>g.passos.some(p=>p.evento==='rolou_fim'&&p.pagina==='demo'));
  const wa=cl.flatMap(g=>g.passos).filter(p=>p.evento==='clicou_whatsapp').length;
  const alvos=[...new Set(cl.flatMap(g=>g.passos).filter(p=>p.evento==='clicou').map(p=>p.detalhe?.alvo+(p.detalhe?.alvo==='botao'?':'+(p.detalhe.texto||'').slice(0,25):'')))];
  const partes={};for(const g of cl)for(const [n,s] of g.secoes)partes[n]=(partes[n]||0)+s;
  out.push({id:l.id,empresa:l.empresa,etapa:l.etapa,resultado:l.resultado,motivo:l.motivo_perda,interesse:l.interesse,int_motivo:l.interesse_motivo,cidade:l.cidade,tags:l.tags,
    visitas:r.visitas,dias,segundos:r.segundos,maxSess:Math.max(0,...cl.map(g=>g.segundos)),fimDemo,wa,aparelhos:r.aparelhos,painel:r.painel,precos:r.precos,exemplo:r.exemplo,
    locais:[...new Set(cl.map(g=>g.local))],aparelhosLista:[...new Set(cl.map(g=>g.aparelho))],alvos,partes:Object.entries(partes).sort((a,b)=>b[1]-a[1]).slice(0,6),
    nossas:r.nossas});
}
writeFileSync('engaja.json',JSON.stringify(out,null,1));
out.sort((a,b)=>b.segundos-a.segundos);
for(const o of out) console.log([o.empresa.slice(0,32).padEnd(32),o.etapa.slice(0,10).padEnd(10),(o.resultado||'').padEnd(9),o.interesse.slice(0,5),String(o.visitas).padStart(3),String(o.dias).padStart(2),String(Math.round(o.segundos/60)).padStart(4)+'m',o.fimDemo?'fim':'   ',o.wa?'wa'+o.wa:'   ',o.aparelhos>1?'rep'+o.aparelhos:'    ',o.painel?'pnl':'   ',(o.motivo||'').slice(0,40)].join(' '));
