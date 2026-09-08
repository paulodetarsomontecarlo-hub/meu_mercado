import { precoPorKgOuL } from './analytics'
import { formatarDataBR, formatarHoraBR } from './date'
import type { Item, Nota } from '../types'

function formatarNumeroBR(valor: number, casas = 2): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

function csvEscape(valor: string): string {
  if (valor.includes(';') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

const CABECALHO = [
  'Data',
  'Hora',
  'Loja',
  'Item',
  'Item_Original',
  'Qtd',
  'Unidade',
  'Valor_Unitario',
  'Valor_Total',
  'Desconto',
  'Categoria',
  'Preco_Por_Kg',
  'Preco_Por_L',
]

export function gerarCSV(itensComNota: { item: Item; nota: Nota }[]): string {
  const linhas = [CABECALHO.join(';')]

  for (const { item, nota } of itensComNota) {
    const { valor, unidade } = precoPorKgOuL(item)
    const precoPorKg = unidade === 'kg' && valor !== null ? formatarNumeroBR(valor / 100) : ''
    const precoPorL = unidade === 'l' && valor !== null ? formatarNumeroBR(valor / 100) : ''

    const linha = [
      formatarDataBR(nota.data_hora),
      formatarHoraBR(nota.data_hora),
      nota.nome_loja,
      item.descricao_normalizada,
      item.descricao_original,
      formatarNumeroBR(item.quantidade, item.unidade === 'Kg' ? 3 : 0),
      item.unidade,
      formatarNumeroBR(item.valor_unitario_centavos / 100),
      formatarNumeroBR(item.valor_total_centavos / 100),
      formatarNumeroBR(item.desconto_centavos / 100),
      item.categoria,
      precoPorKg,
      precoPorL,
    ].map((v) => csvEscape(String(v)))

    linhas.push(linha.join(';'))
  }

  // BOM para o Excel em português reconhecer UTF-8 corretamente.
  return `﻿${linhas.join('\r\n')}`
}

export function baixarCSV(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
