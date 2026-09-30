// Abre o move-web local com sessão falsa e a API interceptada (dados fictícios; nada vai ao banco real).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const B = 'http://localhost:3100';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
export const USUARIO = { id: '00000000-0000-4000-8000-000000000001', email: 'maria.exemplo@move.app' };
const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USUARIO.id, email: USUARIO.email, exp, role: 'authenticated', aud: 'authenticated' })}.assinatura`;
const sessao = { access_token: token, refresh_token: 'r', token_type: 'bearer', expires_in: 86400 * 30, expires_at: exp, user: { id: USUARIO.id, email: USUARIO.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } };

export async function abrir({ largura = 390, altura = 844, mocks = {}, log = false } = {}) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 2, isMobile: largura < 600, hasTouch: largura < 600, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', colorScheme: 'dark' });
  await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, ['sb-supabase-auth-token', JSON.stringify(sessao)]);
  await ctx.addInitScript(() => { const css = 'nextjs-portal{display:none!important}'; const add = () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }; if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); });
  await ctx.route('http://supabase.falso.local/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  const pedidos = [];
  await ctx.route('**/api/v1/**', async r => {
    const u = new URL(r.request().url()); const chave = r.request().method() + ' ' + u.pathname;
    pedidos.push(chave + u.search);
    const m = Object.entries(mocks).find(([p]) => new RegExp('^' + p + '$').test(chave));
    if (log) console.log('API', chave + u.search, m ? 'mock' : 'SEM MOCK');
    if (!m) return r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { message: 'sem mock' } }) });
    const corpo = typeof m[1] === 'function' ? m[1](u, r.request()) : m[1];
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo) });
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERRO', e.message.slice(0, 200)));
  return { b, ctx, p, pedidos };
}
