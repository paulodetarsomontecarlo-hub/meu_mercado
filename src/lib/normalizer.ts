import { db } from '../db/schema'

// Abreviações comuns em cupons fiscais de supermercado brasileiro. Cobre só o caso
// frequente/seguro — o resto fica por conta da correção manual, que o app aprende
// por código de produto (ver aprenderCorrecao).
const ABREVIACOES: [RegExp, string][] = [
  [/\bMUSS\b/gi, 'Mussarela'],
  [/\bPRESID\b/gi, 'Président'],
  [/\bFAT\b/gi, 'Fatiado(a)'],
  [/\bCD\b/gi, 'Creme Dental'],
  [/\bCOLG\b/gi, 'Colgate'],
  [/\bAD\b/gi, 'Adulto'],
  [/\bFR\b/gi, 'Frasco'],
  [/\bPH\b/gi, 'Papel Higiênico'],
  [/\bPERS\b/gi, 'Personal'],
  [/\bL T\b/gi, 'Linguiça Toscana'],
  [/\bCAL\b/gi, 'Calabresa'],
  [/\bSAD\b/gi, 'Sadia'],
  [/\bFC\b/gi, 'Fatiada Congelada'],
  [/\bV\b/gi, 'Leve'],
  [/\bNEU\b/gi, 'Neutro'],
  [/\bREFRI\b/gi, 'Refrigerante'],
  [/\bCHOC\b/gi, 'Chocolate'],
  [/\bBISC\b/gi, 'Biscoito'],
  [/\bDET\b/gi, 'Detergente'],
  [/\bSAB\b/gi, 'Sabonete'],
  [/\bDESOD\b/gi, 'Desodorante'],
  [/\bLT\b/gi, 'Lata'],
  [/\bGAR\b/gi, 'Garrafa'],
]

export function normalizarDescricaoHeuristica(descricaoOriginal: string): string {
  let texto = descricaoOriginal.trim()
  for (const [padrao, substituicao] of ABREVIACOES) {
    texto = texto.replace(padrao, substituicao)
  }
  texto = texto.replace(/\s+/g, ' ').trim()
  // Preserva números/medidas como estão, aplica title case ao restante.
  return texto
    .split(' ')
    .map((palavra) =>
      /\d/.test(palavra) || palavra.length <= 2
        ? palavra
        : palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase(),
    )
    .join(' ')
}

const PADRAO_PESO = /(\d+(?:[.,]\d+)?)\s?(KG|G)\b/i
const PADRAO_VOLUME = /(\d+(?:[.,]\d+)?)\s?(ML|L)\b/i

export function extrairPesoVolume(descricao: string): { peso_g: number | null; volume_ml: number | null } {
  let peso_g: number | null = null
  let volume_ml: number | null = null

  const matchPeso = descricao.match(PADRAO_PESO)
  if (matchPeso) {
    const valor = Number.parseFloat(matchPeso[1].replace(',', '.'))
    peso_g = matchPeso[2].toUpperCase() === 'KG' ? valor * 1000 : valor
  }

  const matchVolume = descricao.match(PADRAO_VOLUME)
  if (matchVolume) {
    const valor = Number.parseFloat(matchVolume[1].replace(',', '.'))
    volume_ml = matchVolume[2].toUpperCase() === 'L' ? valor * 1000 : valor
  }

  return { peso_g, volume_ml }
}

export interface ResultadoNormalizacao {
  descricao_normalizada: string
  peso_g: number | null
  volume_ml: number | null
  aprendidoDoDicionario: boolean
}

export async function normalizarItem(
  codigoProduto: string,
  descricaoOriginal: string,
): Promise<ResultadoNormalizacao> {
  const aprendido = await db.produtos.get(codigoProduto)
  if (aprendido) {
    return {
      descricao_normalizada: aprendido.descricao_normalizada,
      peso_g: aprendido.peso_g,
      volume_ml: aprendido.volume_ml,
      aprendidoDoDicionario: true,
    }
  }

  const descricao_normalizada = normalizarDescricaoHeuristica(descricaoOriginal)
  const { peso_g, volume_ml } = extrairPesoVolume(descricaoOriginal)
  return { descricao_normalizada, peso_g, volume_ml, aprendidoDoDicionario: false }
}

// Chamado quando o usuário corrige o nome de um item na tela de detalhe/revisão.
// Memoriza o mapeamento código -> descrição para as próximas notas com esse código.
export async function aprenderCorrecaoDescricao(
  codigo: string,
  descricaoNormalizada: string,
  categoria: import('../types').Categoria,
  peso_g: number | null,
  volume_ml: number | null,
): Promise<void> {
  const existente = await db.produtos.get(codigo)
  await db.produtos.put({
    codigo,
    descricao_normalizada: descricaoNormalizada,
    categoria: existente?.categoria ?? categoria,
    peso_g,
    volume_ml,
    historico_precos: existente?.historico_precos ?? [],
  })
}
