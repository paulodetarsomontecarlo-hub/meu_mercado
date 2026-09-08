import { createWorker } from 'tesseract.js'
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

// OCR roda 100% no navegador (offline), então a captura da foto nunca depende de
// rede. É o caminho menos confiável dos quatro — a tela de revisão de itens depois
// deste parser é obrigatória, já que a impressão térmica do cupom costuma sair
// borrada e com fonte pequena.
export async function reconhecerTextoDaFoto(
  imagem: File | Blob | string,
  aoProgredir?: (progresso: number) => void,
): Promise<string> {
  const worker = await createWorker('por', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text') aoProgredir?.(m.progress)
    },
  })
  try {
    const {
      data: { text },
    } = await worker.recognize(imagem)
    return text
  } finally {
    await worker.terminate()
  }
}

export async function parsearFotoCupom(
  imagem: File | Blob | string,
  aoProgredir?: (progresso: number) => void,
): Promise<RawReceipt> {
  const texto = await reconhecerTextoDaFoto(imagem, aoProgredir)

  const chave_acesso = extrairChaveAcesso(texto)
  const cnpjDaChave = chave_acesso ? decomporChave(chave_acesso).cnpj_emitente : ''
  const { numero, serie } = extrairNumeroSerie(texto)
  const { itens, descontos } = parseLinhasTexto(texto)

  return {
    origem: 'foto',
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
