/**
 * tree-access — quem vê o quê no ecossistema.
 *
 * Os planos são uma escada: quem é `pro` vê também o que é `free`, e o
 * `admin` vê tudo. A árvore devolvida agrupa por categoria, na ordem do ARF,
 * e cada projeto leva o `pronto` calculado da checklist (nunca escrito à mão).
 */

export const PLANOS = ['free', 'pro', 'admin'];

const nivel = (plano) => {
  const i = PLANOS.indexOf(plano);
  if (i < 0) throw new Error(`plano desconhecido: ${plano}`);
  return i;
};

/** Percentagem de itens da checklist cumpridos, em passos de 20. */
export function pronto(projeto, itens) {
  const chaves = Object.keys(itens);
  const feitos = chaves.filter((k) => projeto.checklist?.[k] === true).length;
  return Math.round((feitos / chaves.length) * 100);
}

/** O plano `quem` pode abrir o projeto? */
export function podeAcessar(quem, projeto) {
  return nivel(quem) >= nivel(projeto.plano);
}

/**
 * A árvore de acesso de um plano: categorias → projetos que ele pode abrir.
 * Categorias sem nenhum projeto acessível não aparecem.
 */
export function arvore(arf, quem) {
  nivel(quem);
  const ramos = [];
  for (const [id, nome] of Object.entries(arf.categorias)) {
    const projetos = arf.projetos
      .filter((p) => p.categoria === id && podeAcessar(quem, p))
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        etapa: p.etapa,
        plano: p.plano,
        url: p.url,
        pronto: pronto(p, arf.checklist),
      }));
    if (projetos.length) ramos.push({ id, nome, projetos });
  }
  return { plano: quem, total: ramos.reduce((n, r) => n + r.projetos.length, 0), categorias: ramos };
}

/** Confere o ARF: devolve a lista de problemas (vazia = válido). */
export function validar(arf) {
  const erros = [];
  const ids = new Set();
  for (const p of arf.projetos ?? []) {
    if (!p.id || ids.has(p.id)) erros.push(`id em falta ou repetido: ${p.id}`);
    ids.add(p.id);
    if (!arf.categorias?.[p.categoria]) erros.push(`${p.id}: categoria desconhecida ${p.categoria}`);
    if (!PLANOS.includes(p.plano)) erros.push(`${p.id}: plano desconhecido ${p.plano}`);
    if (!arf.etapas?.[p.etapa]) erros.push(`${p.id}: etapa desconhecida ${p.etapa}`);
    for (const k of Object.keys(arf.checklist ?? {})) {
      if (typeof p.checklist?.[k] !== 'boolean') erros.push(`${p.id}: checklist.${k} tem de ser true/false`);
    }
    if (p.url !== null && !/^https:\/\//.test(p.url ?? '')) erros.push(`${p.id}: url tem de ser https ou null`);
    // Coerência: "no ar" exige endereço e checklist.publicado; o contrário também.
    if ((p.etapa === 'no-ar') !== Boolean(p.url && p.checklist?.publicado)) {
      erros.push(`${p.id}: etapa "${p.etapa}" não bate com url/publicado`);
    }
    if (Boolean(p.repo) !== Boolean(p.checklist?.codigo) && p.checklist?.codigo) {
      erros.push(`${p.id}: checklist.codigo sem repositório`);
    }
  }
  return erros;
}
