import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { decomporChave } from './chaveParser'
import { parseLinhasTexto } from './lineParser'
import {
  extrairChaveAcesso,
  extrairCNPJEmitente,
  extrairDataHora,
  extrairFormasPagamento,
  extrairNomeLoja,
  extrairNumeroSerie,
  extrairTributos,
  extrairValorPorRotulo,
} from './textExtractors'
import type { RawReceipt } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

async function extrairTextoPDF(arquivo: ArrayBuffer): Promise<string> {
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
  return linhas.join('\n')
}

// A "Consulta Resumida" da NFC-e é a fonte mais confiável: texto estruturado, uma
// linha por ocorrência de item (sem agrupar repetições), com o cabeçalho completo.
export async function parsearPDFNFCe(arquivo: ArrayBuffer): Promise<RawReceipt> {
  const texto = await extrairTextoPDF(arquivo)

  const chave_acesso = extrairChaveAcesso(texto)
  const cnpjDaChave = chave_acesso ? decomporChave(chave_acesso).cnpj_emitente : ''
  const { numero, serie } = extrairNumeroSerie(texto)
  const { itens, descontos } = parseLinhasTexto(texto)

  return {
    origem: 'pdf',
    chave_acesso,
    cnpj_emitente: cnpjDaChave || extrairCNPJEmitente(texto),
    nome_loja: extrairNomeLoja(texto),
    endereco: null,
    data_hora: extrairDataHora(texto) ?? new Date().toISOString(),
    numero,
    serie,
    valor_bruto_centavos: extrairValorPorRotulo(texto, /valor total[^\d]*(?:r\$)?\s*([\d.,]+)/i),
    desconto_total_centavos: extrairValorPorRotulo(texto, /desconto[s]?\s*(?:r\$)?\s*([\d.,]+)/i),
    valor_pago_centavos: extrairValorPorRotulo(texto, /valor a pagar[^\d]*(?:r\$)?\s*([\d.,]+)/i),
    tributos_centavos: extrairTributos(texto),
    forma_pagamento: extrairFormasPagamento(texto),
    itens,
    descontos,
  }
}
