/**
 * Ecossistema Amorim — Worker do ARF.
 *
 *   GET /                    página do mapa (?plano=free|pro)
 *   GET /api/arf             o ARF público (JSON)
 *   GET /api/arvore?plano=   a árvore de acesso de um plano (JSON)
 *
 * O que é `admin` não sai daqui: nem na página nem na API. Campos internos
 * (repositório, alertas, hospedagem) também ficam de fora da versão pública.
 */
import arf from '../arf.json';
import { arvore, pronto } from './tree-access.js';
import { pagina } from './pagina.js';

const PUBLICOS = ['free', 'pro'];

/** O ARF sem o que é interno: projetos admin e campos de operação. */
export function arfPublico(fonte) {
  return {
    versao: fonte.versao,
    atualizado: fonte.atualizado,
    planos: PUBLICOS,
    etapas: fonte.etapas,
    categorias: fonte.categorias,
    checklist: fonte.checklist,
    projetos: fonte.projetos
      .filter((p) => p.plano !== 'admin')
      .map(({ id, nome, dor, stack, categoria, plano, etapa, url, checklist }) => ({
        id, nome, dor, stack, categoria, plano, etapa, url, checklist, pronto: pronto({ checklist }, fonte.checklist),
      })),
  };
}

const CSP = "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

const cabecalhos = (tipo) => ({
  'content-type': tipo,
  'cache-control': 'public, max-age=300',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': CSP,
});

export function responder(request, fonte = arf) {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Método não permitido', { status: 405, headers: { ...cabecalhos('text/plain; charset=utf-8'), allow: 'GET, HEAD' } });
  }
  const publico = arfPublico(fonte);
  const plano = url.searchParams.get('plano') ?? 'free';
  if (!PUBLICOS.includes(plano)) {
    return Response.json({ erro: `plano tem de ser ${PUBLICOS.join(' ou ')}` }, { status: 400, headers: cabecalhos('application/json; charset=utf-8') });
  }

  switch (url.pathname) {
    case '/':
      return new Response(pagina(publico, arvore(publico, plano), plano), { headers: cabecalhos('text/html; charset=utf-8') });
    case '/api/arf':
      return Response.json(publico, { headers: { ...cabecalhos('application/json; charset=utf-8'), 'access-control-allow-origin': '*' } });
    case '/api/arvore':
      return Response.json(arvore(publico, plano), { headers: { ...cabecalhos('application/json; charset=utf-8'), 'access-control-allow-origin': '*' } });
    case '/favicon.ico':
      return new Response(null, { status: 204, headers: { 'cache-control': 'public, max-age=86400' } });
    default:
      return new Response('Não encontrado', { status: 404, headers: cabecalhos('text/plain; charset=utf-8') });
  }
}

export default { fetch: (request) => responder(request) };
