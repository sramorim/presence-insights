/**
 * A página pública do ARF: o mapa do ecossistema por plano.
 * HTML montado no servidor, sem JavaScript no cliente. Tudo o que vem do
 * ARF passa por `esc` antes de entrar no HTML.
 */

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ROTULO_PLANO = { free: 'Free', pro: 'Pro', admin: 'Admin' };

function cartao(p, etapas) {
  return `<article class="proj">
    <header>
      <h3>${esc(p.nome)}</h3>
      <span class="etapa" data-e="${esc(p.etapa)}">${esc(etapas[p.etapa])}</span>
    </header>
    <p>${esc(p.dor)}</p>
    <div class="pronto" role="img" aria-label="${p.pronto}% da checklist cumprida">
      <span class="barra"><i style="width:${p.pronto}%"></i></span><b>${p.pronto}%</b>
    </div>
    ${p.stack.length ? `<ul class="stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    <footer>
      <span class="plano" data-p="${esc(p.plano)}">${esc(ROTULO_PLANO[p.plano])}</span>
      ${p.url ? `<a href="${esc(p.url)}" rel="noopener">Abrir <span aria-hidden="true">→</span></a>` : '<span class="sem">Sem endereço</span>'}
    </footer>
  </article>`;
}

export function pagina(publico, arvore, plano) {
  const porId = new Map(publico.projetos.map((p) => [p.id, p]));
  const abas = ['free', 'pro'].map((k) =>
    `<a class="aba" href="/?plano=${k}"${k === plano ? ' aria-current="page"' : ''}>${ROTULO_PLANO[k]}</a>`).join('');
  const noAr = publico.projetos.filter((p) => p.etapa === 'no-ar').length;
  const secoes = arvore.categorias.map((c) => `
    <section>
      <h2>${esc(c.nome)} <span>${c.projetos.length}</span></h2>
      <div class="grade">${c.projetos.map((p) => cartao({ ...porId.get(p.id), pronto: p.pronto }, publico.etapas)).join('')}</div>
    </section>`).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Ecossistema Amorim</title>
<meta name="description" content="Os projetos do ecossistema Sr. Amorim: o que está no ar, em construção e o que cada plano acessa.">
<meta name="theme-color" content="#07080b">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
<style>
:root{--bg:#07080b;--card:#101217;--line:#21252e;--text:#f2f3f5;--muted:#9aa0ab;--accent:#ff1f2d;--ok:#3ddc84;--warn:#f5b23d;--idle:#7d8594}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;background:radial-gradient(90% 50% at 50% 0%,#171a20 0%,var(--bg) 60%) fixed;color:var(--text);font:15px/1.55 Inter,system-ui,-apple-system,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:32px max(18px,env(safe-area-inset-right)) 56px max(18px,env(safe-area-inset-left))}
.topo{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px}
.eyebrow{margin:0 0 6px;font-size:12px;letter-spacing:.32em;color:var(--muted)}
h1{margin:0;font-size:clamp(1.8rem,5vw,2.6rem);font-weight:800;letter-spacing:-.01em}
h1 em{font-style:normal;color:var(--accent)}
.lead{margin:8px 0 0;max-width:60ch;color:var(--muted)}
.abas{display:flex;gap:6px;padding:4px;border:1px solid var(--line);border-radius:999px;background:var(--card)}
.aba{padding:8px 18px;border-radius:999px;color:var(--muted);text-decoration:none;font-weight:600;font-size:14px}
.aba[aria-current]{background:var(--accent);color:#fff;box-shadow:0 0 18px rgba(255,31,45,.35)}
.resumo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 28px}
.resumo div{padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--card)}
.resumo b{display:block;font-size:1.6rem;font-weight:800;font-variant-numeric:tabular-nums}
.resumo span{font-size:13px;color:var(--muted)}
section{margin-top:26px}
h2{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:1.05rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
h2 span{font-size:12px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:1px 9px}
.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.proj{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent),var(--card);min-width:0}
.proj header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.proj h3{margin:0;font-size:1.05rem}
.proj p{margin:0;color:var(--muted);font-size:14px}
.etapa{flex:0 0 auto;font-size:11.5px;font-weight:600;padding:4px 9px;border-radius:999px;border:1px solid currentColor}
.etapa[data-e=no-ar]{color:var(--ok)}.etapa[data-e=construcao]{color:var(--warn)}.etapa[data-e=parado],.etapa[data-e=ideia]{color:var(--idle)}
.pronto{display:flex;align-items:center;gap:10px}
.barra{flex:1;height:6px;border-radius:6px;background:#1c2028;overflow:hidden}
.barra i{display:block;height:100%;background:linear-gradient(90deg,#b30f1a,var(--accent))}
.pronto b{font-size:13px;font-variant-numeric:tabular-nums}
.stack{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.stack li{font-size:12px;padding:2px 8px;border-radius:6px;background:#181b22;color:#c7cbd3}
.proj footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:6px;border-top:1px solid var(--line)}
.plano{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.plano[data-p=pro]{color:var(--accent)}
.proj a{color:var(--text);font-weight:600;text-decoration:none}
.proj a:hover{color:var(--accent)}
.sem{font-size:13px;color:var(--idle)}
.nota{margin-top:34px;font-size:13px;color:var(--muted);border-top:1px solid var(--line);padding-top:16px}
.nota a{color:var(--text)}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media(max-width:560px){.resumo{grid-template-columns:repeat(3,minmax(0,1fr))}.resumo b{font-size:1.3rem}}
</style>
</head>
<body>
<div class="wrap">
  <div class="topo">
    <div>
      <p class="eyebrow">ECOSSISTEMA SR.AMORIM</p>
      <h1>Os projetos, <em>de verdade.</em></h1>
      <p class="lead">O que está no ar, o que está em construção e o que cada plano abre. Levantado do código e dos endereços no ar em ${esc(publico.atualizado.split('-').reverse().join('/'))}.</p>
    </div>
    <nav class="abas" aria-label="Plano">${abas}</nav>
  </div>
  <div class="resumo">
    <div><b>${publico.projetos.length}</b><span>projetos</span></div>
    <div><b>${noAr}</b><span>no ar</span></div>
    <div><b>${arvore.total}</b><span>no plano ${esc(ROTULO_PLANO[plano])}</span></div>
  </div>
  ${secoes}
  <p class="nota">“Pronto” é a contagem de uma checklist de cinco itens: código num repositório, no ar, endereço próprio, testes automáticos e publicação automática. Os dados também saem em <a href="/api/arf">/api/arf</a> e <a href="/api/arvore?plano=${esc(plano)}">/api/arvore</a>.</p>
</div>
</body>
</html>`;
}
