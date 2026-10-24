/**
 * Leitor de ZIP mínimo, no próprio aparelho.
 *
 * Lê o diretório central do arquivo e descomprime só as entradas pedidas,
 * com o DecompressionStream nativo ('deflate-raw'). Nada é enviado para
 * servidor nenhum: o arquivo do Instagram nunca sai do celular.
 */

const u16 = (v, o) => v.getUint16(o, true);
const u32 = (v, o) => v.getUint32(o, true);

/** Lista as entradas: [{ nome, metodo, tamanhoComprimido, inicioLocal }]. */
export function listarEntradas(buffer) {
  const v = new DataView(buffer);
  // Fim do diretório central: assinatura 0x06054b50, procurada de trás para a frente
  // (pode haver um comentário de até 64 KB depois dela).
  let fim = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (u32(v, i) === 0x06054b50) { fim = i; break; }
  }
  if (fim < 0) throw new Error('Este arquivo não é um .zip válido.');
  const total = u16(v, fim + 10);
  let p = u32(v, fim + 16);
  const nomes = new TextDecoder();
  const entradas = [];
  for (let n = 0; n < total; n++) {
    if (u32(v, p) !== 0x02014b50) throw new Error('O .zip está corrompido.');
    const metodo = u16(v, p + 10);
    const tamanhoComprimido = u32(v, p + 20);
    const lenNome = u16(v, p + 28), lenExtra = u16(v, p + 30), lenComent = u16(v, p + 32);
    const inicioLocal = u32(v, p + 42);
    const nome = nomes.decode(new Uint8Array(buffer, p + 46, lenNome));
    entradas.push({ nome, metodo, tamanhoComprimido, inicioLocal });
    p += 46 + lenNome + lenExtra + lenComent;
  }
  return entradas;
}

/** Devolve o texto de uma entrada (UTF-8). */
export async function lerTexto(buffer, entrada) {
  const v = new DataView(buffer);
  const p = entrada.inicioLocal;
  if (u32(v, p) !== 0x04034b50) throw new Error('O .zip está corrompido.');
  const inicio = p + 30 + u16(v, p + 26) + u16(v, p + 28);
  const dados = new Uint8Array(buffer, inicio, entrada.tamanhoComprimido);
  if (entrada.metodo === 0) return new TextDecoder().decode(dados);
  if (entrada.metodo !== 8) throw new Error('Formato de compressão não suportado.');
  const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(fluxo).text();
}
