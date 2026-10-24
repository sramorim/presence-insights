import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arvore, podeAcessar, pronto, validar } from '../src/tree-access.js';
import { responder, arfPublico } from '../dist/worker.js';

const arf = JSON.parse(readFileSync(new URL('../arf.json', import.meta.url), 'utf8'));

test('o ARF é válido e coerente', () => {
  assert.deepEqual(validar(arf), []);
});

test('validar apanha os erros de ficha', () => {
  const ruim = structuredClone(arf);
  ruim.projetos[0].plano = 'vip';
  ruim.projetos[1].etapa = 'no-ar';
  ruim.projetos[1].url = null;
  ruim.projetos.push({ ...ruim.projetos[2] });
  const erros = validar(ruim).join('\n');
  assert.match(erros, /plano desconhecido vip/);
  assert.match(erros, /não bate com url\/publicado/);
  assert.match(erros, /repetido/);
});

test('pronto é a contagem da checklist, em passos de 20', () => {
  const p = (c) => ({ checklist: Object.fromEntries(Object.keys(arf.checklist).map((k, i) => [k, i < c])) });
  for (let c = 0; c <= 5; c++) assert.equal(pronto(p(c), arf.checklist), c * 20);
});

test('os planos são uma escada: pro vê free, free não vê pro, admin vê tudo', () => {
  assert.ok(podeAcessar('pro', { plano: 'free' }));
  assert.ok(!podeAcessar('free', { plano: 'pro' }));
  assert.ok(podeAcessar('admin', { plano: 'admin' }));
  assert.throws(() => podeAcessar('vip', { plano: 'free' }));
  const free = arvore(arf, 'free').total, pro = arvore(arf, 'pro').total, admin = arvore(arf, 'admin').total;
  assert.ok(free < pro && pro < admin, `${free} < ${pro} < ${admin}`);
  assert.equal(admin, arf.projetos.length);
});

test('o público nunca leva projeto admin nem campos internos', () => {
  const pub = arfPublico(arf);
  assert.ok(pub.projetos.every((p) => p.plano !== 'admin'));
  for (const campo of ['repo', 'alerta', 'hospedagem']) {
    assert.ok(pub.projetos.every((p) => !(campo in p)), `campo ${campo} vazou`);
  }
  const html = responder(new Request('https://x/?plano=pro'));
  return html.text().then((t) => {
    assert.ok(!t.includes('Central Operacional IA'), 'projeto admin apareceu na página');
  });
});

test('o Worker responde a página, a API e recusa o resto', async () => {
  const pagina = responder(new Request('https://x/'));
  assert.equal(pagina.status, 200);
  assert.match(pagina.headers.get('content-security-policy'), /default-src 'none'/);
  const t = await pagina.text();
  assert.match(t, /<title>Ecossistema Amorim<\/title>/);
  assert.match(t, /ARGOS/);
  assert.ok(!/Shandon Elite/.test(t), 'no plano free não aparece projeto pro');

  const api = await responder(new Request('https://x/api/arvore?plano=pro')).json();
  assert.equal(api.plano, 'pro');
  assert.ok(api.categorias.length > 0);

  assert.equal(responder(new Request('https://x/?plano=admin')).status, 400);
  assert.equal(responder(new Request('https://x/nada')).status, 404);
  assert.equal(responder(new Request('https://x/', { method: 'POST' })).status, 405);
});

test('tudo o que vem do ARF é escapado no HTML', async () => {
  const mal = structuredClone(arf);
  mal.projetos[0].nome = '<script>alert(1)</script>';
  const t = await responder(new Request('https://x/'), mal).text();
  assert.ok(!t.includes('<script>alert(1)'), 'nome entrou cru no HTML');
  assert.match(t, /&lt;script&gt;/);
});
