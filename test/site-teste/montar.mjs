// Monta o site de teste do Meu site (dados fictícios): fotos desenhadas na hora, a demo pelo gerador de eventos e o
// site do cliente pelo virar-site.mjs, já com o script do Meu site (código "villa-alecrim").
//
// Uso: node test/site-teste/montar.mjs [pasta-de-saida]      (padrão: test/site-teste/saida, fora do git)
//   <saida>/demo/index.html   a demo, como sai do gerador
//   <saida>/site/             o site do cliente (index.html, img/, …)
// Opções: --gerador <pasta>   usa os geradores de outra pasta (para comparar antes e depois)
//         --api <endereço>    endereço da API do Meu site embutido no site (padrão: o do painel)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

export function montar(saida = path.join(AQUI, 'saida'), { gerador = path.join(RAIZ, 'ferramentas', 'demo'), api, site = true } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-teste-'));
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(AQUI, 'demo.json'), 'utf8'));
    const fotos = [];
    const ajustar = v => {
      if (Array.isArray(v)) return v.forEach(ajustar);
      if (!v || typeof v !== 'object') return;
      if (typeof v.arquivo === 'string') { fotos.push(v.arquivo); v.arquivo = path.join(tmp, v.arquivo); }
      Object.values(v).forEach(ajustar);
    };
    ajustar(cfg);
    cfg.google_json = path.join(AQUI, 'google.json');
    fs.writeFileSync(path.join(tmp, 'demo.json'), JSON.stringify(cfg));
    // fotos fictícias: uma cor por foto, com o número grande (nada de foto de gente ou de lugar de verdade)
    execFileSync('python3', ['-I', '-c', `
import sys, os, colorsys
from PIL import Image, ImageDraw, ImageFont
pasta, nomes = sys.argv[1], sys.argv[2:]
for n, nome in enumerate(nomes, 1):
    r, g, b = (round(c * 255) for c in colorsys.hls_to_rgb((n * 0.13) % 1, 0.55, 0.45))
    im = Image.new('RGB', (1200, 900), (r, g, b)); d = ImageDraw.Draw(im)
    for k in range(0, 900, 60): d.line([(0, k), (1200, k + 300)], fill=(min(255, r + 25), min(255, g + 25), min(255, b + 25)), width=18)
    d.text((80, 600), str(n), fill='white', font=ImageFont.load_default(size=220))
    caminho = os.path.join(pasta, nome); os.makedirs(os.path.dirname(caminho), exist_ok=True)
    im.save(caminho, 'JPEG', quality=80)
`, tmp, ...fotos]);
    fs.mkdirSync(path.join(saida, 'demo'), { recursive: true });
    const demo = path.join(saida, 'demo', 'index.html');
    execFileSync('python3', ['-I', path.join(gerador, 'gerar-eventos.py'), path.join(tmp, 'demo.json'), '--saida', demo], { stdio: 'pipe' });
    if (!site) return { demo };
    const conf = JSON.parse(fs.readFileSync(path.join(AQUI, 'site.json'), 'utf8'));
    if (api) conf.painel.api = api;
    fs.writeFileSync(path.join(saida, 'demo', 'site.json'), JSON.stringify(conf, null, 2));
    execFileSync('node', [path.join(RAIZ, 'scripts', 'virar-site.mjs'), path.join(saida, 'demo'), path.join(saida, 'site')], { stdio: 'pipe' });
    return { demo, site: path.join(saida, 'site') };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opcao = nome => (args.includes(nome) ? args[args.indexOf(nome) + 1] : undefined);
  const saida = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const r = montar(saida && path.resolve(saida), { gerador: opcao('--gerador') && path.resolve(opcao('--gerador')), api: opcao('--api'), site: !args.includes('--so-demo') });
  console.log(Object.values(r).join('\n'));
}
