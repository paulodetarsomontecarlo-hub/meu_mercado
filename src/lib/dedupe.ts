import type { RawItemLine, RawReceipt } from '../types'

export interface ItemDeduplicado extends RawItemLine {
  desconto_centavos: number
}

// O cupom impresso agrupa itens repetidos numa única linha; o PDF da Consulta NFC-e
// lista cada ocorrência separadamente (por isso a mesma compra pode ter 40 linhas
// num e 52 no outro). Este passo:
//  1. Vincula cada "Desconto no item N" (índice 1-based na ordem impressa/original
//     do documento de origem) à respectiva linha bruta.
//  2. Agrupa por código de produto, somando quantidade, valor_total e desconto.
export function deduplicarItens(receipt: RawReceipt): ItemDeduplicado[] {
  const linhasComDesconto = receipt.itens.map((item, index) => {
    const descontosDoItem = receipt.descontos
      .filter((d) => d.refIndex === index + 1)
      .reduce((soma, d) => soma + d.valor_centavos, 0)
    return { ...item, desconto_centavos: descontosDoItem }
  })

  const grupos = new Map<string, ItemDeduplicado>()
  for (const linha of linhasComDesconto) {
    const existente = grupos.get(linha.codigo_produto)
    if (!existente) {
      grupos.set(linha.codigo_produto, { ...linha })
      continue
    }
    existente.quantidade += linha.quantidade
    existente.valor_total_centavos += linha.valor_total_centavos
    existente.desconto_centavos += linha.desconto_centavos
  }

  return Array.from(grupos.values())
}
