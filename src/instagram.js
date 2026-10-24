/**
 * Lê o arquivo "Baixar suas informações" do Instagram (formato JSON).
 *
 * Só usa o que a própria pessoa exportou: seguidores, quem ela segue e o
 * nome de usuário. Aceita os dois formatos que o Instagram já usou
 * (`value` com o usuário, ou `title` com o usuário e `string_list_data` só
 * com a data), e corrige o texto que o Instagram grava com acentos estragados.
 */
import { listarEntradas, lerTexto } from './zip.js';

/** "JoÃ£o" → "João": o Instagram escreve UTF-8 como se fosse Latin-1. */
export function corrigirTexto(s) {
  if (typeof s !== 'string' || !/[À-ÿ]/.test(s)) return s ?? '';
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch { return s; }
}

/** Uma lista de perfis num dos formatos do Instagram → [{ u, t }]. */
export function perfisDe(lista) {
  const saida = [];
  for (const item of Array.isArray(lista) ? lista : []) {
    const dado = item?.string_list_data?.[0] ?? {};
    const u = String(dado.value || item.title || '').trim().replace(/^@/, '');
    if (!u) continue;
    saida.push({ u, t: Number(dado.timestamp) || 0 });
  }
  return saida;
}

const ehSeguidores = (n) => /(^|\/)followers(_\d+)?\.json$/i.test(n);
const ehSeguindo = (n) => /(^|\/)following\.json$/i.test(n);
const ehPessoal = (n) => /personal_information\.json$/i.test(n);

/**
 * Lê o .zip e devolve { usuario, nome, seguidores, seguindo }.
 * Lança um erro com mensagem para a pessoa quando falta o que é preciso.
 */
export async function lerExportacao(buffer) {
  const entradas = listarEntradas(buffer);
  if (entradas.some((e) => /followers(_\d+)?\.html$/i.test(e.nome)) && !entradas.some((e) => ehSeguidores(e.nome))) {
    throw new Error('Este arquivo veio em HTML. Peça de novo no Instagram escolhendo o formato JSON.');
  }
  const seguidores = [], seguindo = [];
  for (const e of entradas.filter((x) => ehSeguidores(x.nome))) {
    seguidores.push(...perfisDe(JSON.parse(await lerTexto(buffer, e))));
  }
  const fSeg = entradas.find((x) => ehSeguindo(x.nome));
  if (fSeg) {
    const j = JSON.parse(await lerTexto(buffer, fSeg));
    seguindo.push(...perfisDe(Array.isArray(j) ? j : j.relationships_following));
  }
  if (!seguidores.length && !fSeg) {
    throw new Error('Não encontrei seguidores neste arquivo. Na exportação, marque "Seguidores e seguindo".');
  }
  let usuario = '', nome = '';
  const fPes = entradas.find((x) => ehPessoal(x.nome));
  if (fPes) {
    try {
      const j = JSON.parse(await lerTexto(buffer, fPes));
      const mapa = j?.profile_user?.[0]?.string_map_data ?? {};
      for (const [k, v] of Object.entries(mapa)) {
        if (/^(username|nome de usu[aá]rio)$/i.test(corrigirTexto(k))) usuario = corrigirTexto(v?.value);
        if (/^(name|nome)$/i.test(corrigirTexto(k))) nome = corrigirTexto(v?.value);
      }
    } catch { /* sem dados pessoais: o resto continua a valer */ }
  }
  const unicos = (l) => [...new Map(l.map((p) => [p.u.toLowerCase(), p])).values()];
  return { usuario, nome, seguidores: unicos(seguidores), seguindo: unicos(seguindo) };
}
