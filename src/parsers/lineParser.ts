import { parseValorBR } from '../lib/money'
import type { RawDiscountLine, RawItemLine, Unidade } from '../types'

// Parser de linhas de texto compartilhado entre o parser de PDF (texto extraído via
// pdfjs, mais limpo) e o de OCR de foto (texto do Tesseract, mais ruidoso). Ambos os
// documentos imprimem cada item numa linha "código descrição qtd un vl.unit vl.total",
// com pequenas variações de separador (" ", "x", "="), então o regex é tolerante a isso.
const PADRAO_ITEM =
  /(?<codigo>\d{4,14})\s+(?<descricao>.+?)\s+(?<qtd>\d+(?:[.,]\d+)?)\s*(?<un>UN|KG|PC|L)\b\D*?(?<unit>\d+[.,]\d{2})\D+?(?<total>\d+[.,]\d{2})\s*$/i

const PADRAO_DESCONTO = /desconto[^0-9]*item\s*(\d+)[^0-9]*(\d+[.,]\d{2})/i

const UNIDADES_POR_CODIGO: Record<string, Unidade> = {
  KG: 'Kg',
  L: 'L',
  LT: 'L',
  PC: 'Pc',
  UN: 'Un',
}

export function normalizarUnidade(un: string): Unidade {
  return UNIDADES_POR_CODIGO[un.toUpperCase()] ?? 'Un'
}

export function parseLinhasTexto(texto: string): { itens: RawItemLine[]; descontos: RawDiscountLine[] } {
  const linhas = texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const itens: RawItemLine[] = []
  const descontos: RawDiscountLine[] = []

  for (const linha of linhas) {
    const descontoMatch = linha.match(PADRAO_DESCONTO)
    if (descontoMatch) {
      descontos.push({
        refIndex: Number(descontoMatch[1]),
        valor_centavos: parseValorBR(descontoMatch[2]),
      })
      continue
    }

    const itemMatch = linha.match(PADRAO_ITEM)
    if (itemMatch?.groups) {
      const { codigo, descricao, qtd, un, unit, total } = itemMatch.groups
      itens.push({
        codigo_produto: codigo,
        descricao: descricao.trim(),
        quantidade: Number.parseFloat(qtd.replace(',', '.')),
        unidade: normalizarUnidade(un),
        valor_unitario_centavos: parseValorBR(unit),
        valor_total_centavos: parseValorBR(total),
      })
    }
  }

  return { itens, descontos }
}
