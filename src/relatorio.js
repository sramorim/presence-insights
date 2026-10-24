/**
 * As contas dos relatórios: quem chegou, quem saiu e quem não segue de volta.
 * Tudo sai das listas exportadas; nada é estimado.
 */

const DIA = 86400;

const chaves = (lista) => new Set(lista.map((p) => p.u.toLowerCase()));

/**
 * Compara o relatório `atual` com o `anterior` (ou com nada, no primeiro).
 * - novos: no primeiro relatório, quem começou a seguir nos últimos 30 dias
 *   (o Instagram grava a data de cada seguidor); depois, quem não estava antes.
 * - deixaram: quem estava no anterior e já não está (precisa de dois relatórios).
 * - naoSeguem: quem a pessoa segue e não a segue de volta.
 */
export function comparar(atual, anterior = null) {
  const seguidoresAgora = chaves(atual.seguidores);
  let novos, deixaram = [];
  if (anterior) {
    const antes = chaves(anterior.seguidores);
    novos = atual.seguidores.filter((p) => !antes.has(p.u.toLowerCase()));
    deixaram = anterior.seguidores
      .filter((p) => !seguidoresAgora.has(p.u.toLowerCase()))
      .map((p) => ({ u: p.u, t: Math.floor(Date.parse(atual.data) / 1000) }));
  } else {
    const desde = Math.floor(Date.parse(atual.data) / 1000) - 30 * DIA;
    novos = atual.seguidores.filter((p) => p.t >= desde);
  }
  const naoSeguem = atual.seguindo.filter((p) => !seguidoresAgora.has(p.u.toLowerCase()));
  const porData = (a, b) => b.t - a.t;
  return {
    seguidores: atual.seguidores.length,
    seguindo: atual.seguindo.length,
    difSeguidores: anterior ? atual.seguidores.length - anterior.seguidores.length : null,
    difSeguindo: anterior ? atual.seguindo.length - anterior.seguindo.length : null,
    novos: novos.sort(porData),
    deixaram: deixaram.sort(porData),
    naoSeguem: naoSeguem.sort(porData),
    temAnterior: Boolean(anterior),
  };
}

/** O relatório imediatamente anterior a `r` (por data), ou null. */
export function anteriorDe(relatorios, r) {
  const antes = relatorios.filter((x) => x.data < r.data).sort((a, b) => b.data.localeCompare(a.data));
  return antes[0] ?? null;
}

/**
 * Plano Free: um relatório por mês. Um novo relatório no mesmo mês substitui
 * o que lá estava; noutro mês, soma. Devolve a lista nova e se substituiu.
 */
export function guardarNoPlano(relatorios, novo, plano = 'free') {
  if (plano !== 'free') return { lista: [...relatorios, novo], substituiu: false };
  const mes = novo.data.slice(0, 7);
  const resto = relatorios.filter((r) => r.data.slice(0, 7) !== mes);
  return { lista: [...resto, novo], substituiu: resto.length !== relatorios.length };
}

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
/** "2026-10-15" → "15 de out. de 2026"; curto → "15 de out." */
export function dataBr(iso, curto = false) {
  const d = new Date(typeof iso === 'number' ? iso * 1000 : iso);
  if (Number.isNaN(d.getTime())) return '';
  const base = `${String(d.getUTCDate()).padStart(2, '0')} de ${MESES[d.getUTCMonth()]}`;
  return curto ? base : `${base} de ${d.getUTCFullYear()}`;
}

/** 12480 → "12.480" */
export const num = (n) => Number(n || 0).toLocaleString('pt-BR');
