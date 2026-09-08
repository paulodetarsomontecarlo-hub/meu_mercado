import jsQR from 'jsqr'
import { decomporChave, limparChave } from './chaveParser'
import type { ChaveDecomposta } from '../types'

// O conteúdo do QR code de uma NFC-e é uma URL para o site da Sefaz do estado,
// algo como: https://www.fazenda.sp.gov.br/nfce/qrcode?p=CHAVE|2|1|1|HASH
// Não seguimos essa URL (a consulta ao site é manual, fora de escopo) — só extraímos
// a chave de acesso (44 dígitos) e, a partir dela, o CNPJ do emitente.
export function extrairChaveDeConteudoQR(conteudo: string): ChaveDecomposta | null {
  const paramP = conteudo.match(/[?&]p=([^&]+)/)?.[1]
  const candidato = paramP ? decodeURIComponent(paramP).split('|')[0] : conteudo

  const soDigitos = limparChave(candidato)
  const chave44 = soDigitos.length >= 44 ? soDigitos.slice(0, 44) : null
  if (!chave44) return null

  const decomposta = decomporChave(chave44)
  return decomposta.chave.length === 44 ? decomposta : null
}

export function decodificarQRDeImagem(imageData: ImageData): string | null {
  const resultado = jsQR(imageData.data, imageData.width, imageData.height)
  return resultado?.data ?? null
}
