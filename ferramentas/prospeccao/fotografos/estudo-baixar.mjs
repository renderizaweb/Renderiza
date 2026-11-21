// Estudo de quem esquentou (lote 4): baixa do painel de prospecção os leads, as interações, as visitas e as demos.
// Entra com o login do painel (RLS), como scripts/relato.mjs: SUPABASE_URL, SUPABASE_ANON_KEY, RENDERIZA_EMAIL, RENDERIZA_SENHA.
// Uso (numa pasta de trabalho fora do git): node estudo-baixar.mjs  → leads.json, interacoes.json, visitas.json, demos.json
import {writeFileSync} from 'node:fs';
const U=process.env.SUPABASE_URL.replace(/\/$/,''),K=process.env.SUPABASE_ANON_KEY;
const s=await (await fetch(U+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({email:process.env.RENDERIZA_EMAIL,password:process.env.RENDERIZA_SENHA})})).json();
const h={apikey:K,Authorization:'Bearer '+s.access_token};
async function tudo(p){let out=[],i=0;for(;;){const r=await fetch(U+'/rest/v1/'+p,{headers:{...h,Range:`${i}-${i+999}`}});const d=await r.json();if(!Array.isArray(d)){console.log(p,d);break}out.push(...d);if(d.length<1000)break;i+=1000}return out}
const leads=await tudo('leads?select=*&order=criado_em');
writeFileSync('leads.json',JSON.stringify(leads));
const inter=await tudo('interacoes?select=*&order=ocorreu_em');
writeFileSync('interacoes.json',JSON.stringify(inter));
const vis=await tudo('visitas?select=*&order=criado_em');
writeFileSync('visitas.json',JSON.stringify(vis));
const demos=await tudo('demos?select=*');
writeFileSync('demos.json',JSON.stringify(demos));
console.log({leads:leads.length,inter:inter.length,vis:vis.length,demos:demos.length});
const c={};for(const v of vis){const k=v.pagina+'/'+v.evento;c[k]=(c[k]||0)+1}console.log(c);
console.log('primeira visita',vis[0]?.criado_em,'última',vis.at(-1)?.criado_em);
