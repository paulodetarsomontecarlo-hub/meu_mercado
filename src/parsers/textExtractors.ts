import { decomporChave } from './chaveParser'
import { parseValorBR } from '../lib/money'
import type { FormaPagamento } from '../types'

// Extratores de campos de cabeçalho compartilhados entre o parser de PDF (texto
// limpo, extraído via pdfjs) e o parser de OCR de foto (texto ruidoso do Tesseract).

export function extrairChaveAcesso(texto: string): string | null {
  const soDigitos = texto.replace(/\D/g, ' ')
  const candidatos = soDigitos.match(/\d{44}/g) ?? []
  for (const candidato of candidatos) {
    if (decomporChave(candidato).valida) return candidato
  }
  return candidatos[0] ?? null
}

export function extrairCNPJEmitente(texto: string): string {
  const match = texto.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/)
  return match ? match[1].replace(/\D/g, '') : ''
}

export function extrairDataHora(texto: string): string | null {
  const match = texto.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (!match) return null
  const [, dia, mes, ano, h, m, s] = match
  return `${ano}-${mes}-${dia}T${h}:${m}:${s}-03:00`
}

export function extrairNumeroSerie(texto: string): { numero: string | null; serie: string | null } {
  const numero = texto.match(/n[uú]mero[:\s]*(\d+)/i)?.[1] ?? null
  const serie = texto.match(/s[ée]rie[:\s]*(\d+)/i)?.[1] ?? null
  return { numero, serie }
}

export function extrairValorPorRotulo(texto: string, rotulos: RegExp): number | null {
  const match = texto.match(rotulos)
  return match ? parseValorBR(match[1]) : null
}

export function extrairTributos(texto: string): number | null {
  return extrairValorPorRotulo(texto, /tributos totais incidentes[^\d]*(?:r\$)?\s*([\d.,]+)/i)
}

export function extrairFormasPagamento(texto: string): FormaPagamento[] {
  const tipos = [
    'Dinheiro',
    'Cart[aã]o de Cr[eé]dito',
    'Cart[aã]o de D[eé]bito',
    'Pix',
    'Vale Alimenta[çc][aã]o',
    'Vale Refei[çc][aã]o',
  ]
  const formas: FormaPagamento[] = []
  for (const tipo of tipos) {
    const regex = new RegExp(`(${tipo})[^\\d]*(?:r\\$)?\\s*([\\d.,]+)`, 'i')
    const match = texto.match(regex)
    if (match) {
      formas.push({ tipo: match[1], valor_centavos: parseValorBR(match[2]) })
    }
  }
  return formas
}

export function extrairNomeLoja(texto: string): string {
  const primeiraLinha = texto.split('\n').find((l) => l.trim().length > 3)
  return primeiraLinha?.trim() ?? 'Loja não identificada'
}
