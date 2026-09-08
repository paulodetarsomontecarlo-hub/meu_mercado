import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { decomporChave } from './chaveParser'
import { normalizarUnidade, parseLinhasTexto } from './lineParser'
import {
  extrairChaveAcesso,
  extrairCNPJEmitente,
  extrairDataHora,
  extrairFormasPagamento,
  extrairNumeroSerie,
} from './textExtractors'
import { parseValorBR } from '../lib/money'
import type { FormaPagamento, RawDiscountLine, RawItemLine, RawReceipt } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

async function extrairLinhasPDF(arquivo: ArrayBuffer): Promise<string[]> {
  const documento = await pdfjsLib.getDocument({ data: arquivo }).promise
  const linhas: string[] = []
  for (let pagina = 1; pagina <= documento.numPages; pagina++) {
    const page = await documento.getPage(pagina)
    const conteudo = await page.getTextContent()
    let linhaAtual = ''
    let ultimoY: number | null = null
    for (const item of conteudo.items) {
      if (!('str' in item)) continue
      const y = item.transform[5]
      if (ultimoY !== null && Math.abs(y - ultimoY) > 2) {
        linhas.push(linhaAtual)
        linhaAtual = ''
      }
      linhaAtual += (linhaAtual ? ' ' : '') + item.str
      ultimoY = y
    }
    if (linhaAtual) linhas.push(linhaAtual)
  }
  return linhas
}

const PADRAO_DESC_CODIGO = /^(.*?)\s*\(Código:\s*(\d+)\s*\)/i
const PADRAO_QTD_UN_VALOR = /Qtde\.:\s*([\d.,]+)\s*UN:\s*(\S+)?\s*Vl\.\s*Unit\.:\s*([\d.,]+)/i
const PADRAO_SO_NUMERO = /^-?[\d.,]+$/
const PADRAO_DESCONTO_ITEM = /desconto[^0-9]*item\s*(\d+)[^0-9]*(\d+[.,]\d{2})/i

// Layout da "Consulta Resumida" da Sefaz-SP: cada item ocupa 3-4 "linhas" agrupadas
// por coordenada Y — "descrição (Código: N)", depois "Qtde.: X UN: U Vl. Unit.: Y",
// depois o rótulo "Vl. Total" sozinho e por fim o valor numa linha à parte.
// Descrições longas às vezes quebram bem no meio de "(Código:", então mesclamos
// essas duas linhas antes de tentar casar o padrão.
export function extrairItensSefaz(linhas: string[]): { itens: RawItemLine[]; descontos: RawDiscountLine[] } {
  const mescladas: string[] = []
  for (const linha of linhas) {
    const anterior = mescladas[mescladas.length - 1]
    if (anterior && /\(Código:\s*$/i.test(anterior)) {
      mescladas[mescladas.length - 1] = `${anterior} ${linha}`
    } else {
      mescladas.push(linha)
    }
  }

  const itens: RawItemLine[] = []
  const descontos: RawDiscountLine[] = []

  for (let i = 0; i < mescladas.length; i++) {
    const descontoMatch = mescladas[i].match(PADRAO_DESCONTO_ITEM)
    if (descontoMatch) {
      descontos.push({ refIndex: Number(descontoMatch[1]), valor_centavos: parseValorBR(descontoMatch[2]) })
      continue
    }

    const descMatch = mescladas[i].match(PADRAO_DESC_CODIGO)
    if (!descMatch) continue

    const qtdMatch = (mescladas[i + 1] ?? '').match(PADRAO_QTD_UN_VALOR)
    if (!qtdMatch) continue

    let valorTotal: number | null = null
    for (let j = i + 2; j < Math.min(i + 5, mescladas.length); j++) {
      const linha = mescladas[j].trim()
      if (PADRAO_SO_NUMERO.test(linha)) {
        valorTotal = parseValorBR(linha)
        break
      }
      if (PADRAO_DESC_CODIGO.test(linha)) break
    }

    const valorUnitario = parseValorBR(qtdMatch[3])
    itens.push({
      codigo_produto: descMatch[2],
      descricao: descMatch[1].trim(),
      quantidade: Number.parseFloat(qtdMatch[1].replace(',', '.')),
      unidade: normalizarUnidade(qtdMatch[2] ?? 'UN'),
      valor_unitario_centavos: valorUnitario,
      valor_total_centavos: valorTotal ?? valorUnitario,
    })
  }

  return { itens, descontos }
}

interface CabecalhoValores {
  valor_bruto_centavos: number | null
  desconto_total_centavos: number | null
  valor_pago_centavos: number | null
  tributos_centavos: number | null
}

// Nesse template os valores (qtd. de itens, total, desconto, valor a pagar, formas
// de pagamento, tributos) aparecem soltos, em ordem fixa, ANTES do nome da loja — e
// só depois, no rodapé, os rótulos reaparecem sem os valores ao lado (um artefato de
// como a página da Sefaz vira PDF). Por isso extraímos pela posição dentro desse
// bloco numérico, não por "rótulo seguido de valor" como no resto do parser.
export function extrairValoresCabecalho(linhasAntesDaLoja: string[]): CabecalhoValores {
  const numeros = linhasAntesDaLoja.map((l) => l.trim()).filter((l) => PADRAO_SO_NUMERO.test(l))

  return {
    valor_bruto_centavos: numeros[1] !== undefined ? parseValorBR(numeros[1]) : null,
    desconto_total_centavos: numeros[2] !== undefined ? parseValorBR(numeros[2]) : null,
    valor_pago_centavos: numeros[3] !== undefined ? parseValorBR(numeros[3]) : null,
    tributos_centavos: numeros.length > 0 ? parseValorBR(numeros[numeros.length - 1]) : null,
  }
}

// Mesmo problema de ordenação afeta a lista de formas de pagamento: o nome do
// método (ex.: "Dinheiro") fica sem o valor do lado. Como não dá para casar com
// segurança qual valor do bloco numérico pertence a qual método quando há mais de
// um, assumimos o caso comum (pagamento único) e usamos o valor pago total.
function extrairFormaPagamentoPrincipal(linhas: string[], valorPago: number | null): FormaPagamento[] {
  const idxForma = linhas.findIndex((l) => /forma de pagamento/i.test(l))
  if (idxForma === -1 || valorPago === null) return []
  const nomeTipo = linhas
    .slice(idxForma + 1)
    .map((l) => l.trim())
    .find((l) => l && !/^troco$/i.test(l) && !PADRAO_SO_NUMERO.test(l))
  return nomeTipo ? [{ tipo: nomeTipo, valor_centavos: valorPago }] : []
}

// A "Consulta Resumida" da NFC-e é a fonte mais confiável: texto estruturado, uma
// linha por ocorrência de item (sem agrupar repetições), com o cabeçalho completo.
export async function parsearPDFNFCe(arquivo: ArrayBuffer): Promise<RawReceipt> {
  const linhas = await extrairLinhasPDF(arquivo)
  const texto = linhas.join('\n')

  const chave_acesso = extrairChaveAcesso(texto)
  const cnpjDaChave = chave_acesso ? decomporChave(chave_acesso).cnpj_emitente : ''
  const { numero, serie } = extrairNumeroSerie(texto)
  const data_hora = extrairDataHora(texto) ?? new Date().toISOString()

  const indexCNPJ = linhas.findIndex((l) => /^CNPJ:/i.test(l.trim()))

  if (indexCNPJ === -1) {
    // Layout não reconhecido — cai para o parser genérico linha a linha
    // ("código descrição qtd un vl.unit vl.total" tudo na mesma linha).
    const { itens, descontos } = parseLinhasTexto(texto)
    return {
      origem: 'pdf',
      chave_acesso,
      cnpj_emitente: cnpjDaChave || extrairCNPJEmitente(texto),
      nome_loja: 'Loja não identificada',
      endereco: null,
      data_hora,
      numero,
      serie,
      valor_bruto_centavos: null,
      desconto_total_centavos: null,
      valor_pago_centavos: null,
      tributos_centavos: null,
      forma_pagamento: extrairFormasPagamento(texto),
      itens,
      descontos,
    }
  }

  const nome_loja = linhas[indexCNPJ - 1]?.trim() || 'Loja não identificada'
  const cnpj_emitente = cnpjDaChave || extrairCNPJEmitente(linhas[indexCNPJ])

  const indexPrimeiroItem = linhas.findIndex((l, i) => i > indexCNPJ && /\(Código:/i.test(l))
  const fimEndereco = indexPrimeiroItem === -1 ? indexCNPJ + 1 : indexPrimeiroItem
  const endereco =
    linhas
      .slice(indexCNPJ + 1, fimEndereco)
      .join(' ')
      .replace(/\s*,\s*,\s*/g, ', ')
      .replace(/\s+/g, ' ')
      .trim() || null

  const indexFimItens = linhas.findIndex((l, i) => i > indexCNPJ && /Qtd\.\s*total\s*de\s*itens/i.test(l))
  const linhasItens = linhas.slice(
    indexPrimeiroItem === -1 ? linhas.length : indexPrimeiroItem,
    indexFimItens === -1 ? linhas.length : indexFimItens,
  )
  const { itens, descontos } = extrairItensSefaz(linhasItens)

  const valores = extrairValoresCabecalho(linhas.slice(0, Math.max(indexCNPJ - 1, 0)))

  return {
    origem: 'pdf',
    chave_acesso,
    cnpj_emitente,
    nome_loja,
    endereco,
    data_hora,
    numero,
    serie,
    ...valores,
    forma_pagamento: extrairFormaPagamentoPrincipal(linhas, valores.valor_pago_centavos),
    itens,
    descontos,
  }
}
