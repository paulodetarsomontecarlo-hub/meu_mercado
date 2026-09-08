import type { ChaveDecomposta } from '../types'

// Tabela de códigos de UF (IBGE) usados nos 2 primeiros dígitos da chave de acesso.
const UF_POR_CODIGO: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
}

const TIPOS_EMISSAO: Record<string, string> = {
  '1': 'Normal',
  '2': 'Contingência FS-IA',
  '3': 'Contingência SCAN',
  '4': 'Contingência DPEC',
  '5': 'Contingência FS-DA',
  '6': 'Contingência SVC-AN',
  '7': 'Contingência SVC-RS',
  '9': 'Contingência off-line NFC-e',
}

export function limparChave(entrada: string): string {
  return entrada.replace(/\D/g, '')
}

export function calcularDigitoVerificador(chave43: string): number {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9]
  let soma = 0
  let indicePeso = 0
  for (let i = chave43.length - 1; i >= 0; i--) {
    const digito = Number(chave43[i])
    soma += digito * pesos[indicePeso % pesos.length]
    indicePeso++
  }
  const resto = soma % 11
  return resto === 0 || resto === 1 ? 0 : 11 - resto
}

export function decomporChave(entrada: string): ChaveDecomposta {
  const chave = limparChave(entrada)

  const base: ChaveDecomposta = {
    chave,
    valida: false,
    uf_codigo: '',
    uf_nome: null,
    competencia: '',
    ano: 0,
    mes: 0,
    cnpj_emitente: '',
    modelo: '',
    serie: '',
    numero: '',
    tipoEmissao: '',
    codigoNumerico: '',
    digitoVerificador: '',
  }

  if (chave.length !== 44) {
    return base
  }

  const ufCodigo = chave.slice(0, 2)
  const aamm = chave.slice(2, 6)
  const cnpj = chave.slice(6, 20)
  const modelo = chave.slice(20, 22)
  const serie = chave.slice(22, 25)
  const numero = chave.slice(25, 34)
  const tpEmis = chave.slice(34, 35)
  const cNF = chave.slice(35, 43)
  const dvInformado = chave.slice(43, 44)

  const dvCalculado = calcularDigitoVerificador(chave.slice(0, 43))
  const valida = String(dvCalculado) === dvInformado

  const mes = Number(aamm.slice(2, 4))
  const ano = 2000 + Number(aamm.slice(0, 2))

  return {
    chave,
    valida,
    uf_codigo: ufCodigo,
    uf_nome: UF_POR_CODIGO[ufCodigo] ?? null,
    competencia: aamm,
    ano,
    mes,
    cnpj_emitente: cnpj,
    modelo,
    serie: String(Number(serie)),
    numero: String(Number(numero)),
    tipoEmissao: TIPOS_EMISSAO[tpEmis] ?? tpEmis,
    codigoNumerico: cNF,
    digitoVerificador: dvInformado,
  }
}

export function formatarCNPJ(cnpj: string): string {
  const limpo = cnpj.replace(/\D/g, '').padStart(14, '0')
  return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
