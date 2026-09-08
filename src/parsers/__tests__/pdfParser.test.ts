import { describe, expect, it } from 'vitest'
import { extrairItensSefaz, extrairValoresCabecalho } from '../pdfParser'
import { extrairChaveAcesso } from '../textExtractors'

// Linhas reais extraídas via pdfjs (agrupadas por coordenada Y) de uma "Consulta
// Resumida" de NFC-e baixada de verdade no site da Sefaz-SP. Nesse template os
// valores do resumo (qtd. de itens, total, desconto, valor pago, tributos)
// aparecem soltos e SEM rótulo logo no início do texto — o rótulo só reaparece,
// sem o valor do lado, lá no rodapé — e cada item ocupa 3-4 linhas em vez de uma
// só. Foi exatamente esse layout que fazia o parser antigo extrair "Itens (0)" e
// pegar "156,28" como nome da loja.
const LINHAS_REAIS_OBA = [
  '8',
  '156,28',
  '7,19',
  '149,09',
  'Valor pago R$:',
  '149,09',
  'NaN',
  '29,99',
  'GRUPO FARTURA DE HORTIFRUT S A',
  'CNPJ: 04.972.092/0094-21',
  'AVENIDA PRESIDENTE JUSCELINO KUBITS , 3530 , , JARDIM',
  'PANORAMA , SAO JOSE DO RIO PRETO , SP',
  'REFRI PINK LEMONADE VIDRO PRATA 200ML   (Código: 235490 )',
  'Qtde.: 1   UN:   UN   Vl. Unit.:   7,99',
  'Vl. Total',
  '7,99',
  'CHOPP DE VINHO DRAFT VALLEY 500ML   (Código: 236459 )',
  'Qtde.: 1   UN:   UN   Vl. Unit.:   11,99',
  'Vl. Total',
  '11,99',
  'KIWI SUNGOLD ZESPRI OBQ PR kg   (Código: 2141 )',
  'Qtde.: 0,47   UN:   KG   Vl. Unit.:   59,99',
  'Vl. Total',
  '28,20',
  'CROSTATA DE ALHO OBQ 100G   (Código: 224374 )',
  'Qtde.: 1   UN:   UN   Vl. Unit.:   11,99',
  'Vl. Total',
  '11,99',
  'FILE FRANGO OBA   (Código: 167634 )',
  'Qtde.: 1,038   UN:   KG   Vl. Unit.:   34,99',
  'Vl. Total',
  '36,32',
  'BOURSIN TOMATE SECO OBQ 200G   (Código: 225905 )',
  'Qtde.: 1   UN:   UN   Vl. Unit.:   27,99',
  'Vl. Total',
  '27,99',
  'COCO SECO LASCAS C PELE OBQ   (Código: 174595 )',
  'Qtde.: 0,296   UN:   KG   Vl. Unit.:   39,9',
  'Vl. Total',
  '11,81',
  'MOLHO IT TOMATE CONCENTRADO BISNAGA COPPOLA 135G   (Código:',
  '237879 )',
  'Qtde.: 1   UN:   UN   Vl. Unit.:   19,99',
  'Vl. Total',
  '19,99',
  'Qtd. total de itens:',
  'Valor total R$:',
  'Descontos R$:',
  'Valor a pagar R$:',
  'Forma de pagamento:',
  'Dinheiro',
  'Troco',
]

describe('extrairValoresCabecalho (fixture real: Oba Hortifruti)', () => {
  it('lê bruto/desconto/pago/tributos pela posição, ignorando os rótulos soltos', () => {
    // tudo antes do nome da loja (índice 8, ou seja indexCNPJ-1=8), como o parser real faz
    const valores = extrairValoresCabecalho(LINHAS_REAIS_OBA.slice(0, 8))
    expect(valores).toEqual({
      valor_bruto_centavos: 15628,
      desconto_total_centavos: 719,
      valor_pago_centavos: 14909,
      tributos_centavos: 2999,
    })
  })
})

describe('extrairItensSefaz (fixture real: Oba Hortifruti)', () => {
  const linhasItens = LINHAS_REAIS_OBA.slice(12, 45) // do 1º item até "Qtd. total de itens:"
  const { itens, descontos } = extrairItensSefaz(linhasItens)

  it('extrai os 8 itens (e não 0, como o parser antigo linha-única extraía)', () => {
    expect(itens).toHaveLength(8)
    expect(descontos).toHaveLength(0)
  })

  it('lê corretamente um item simples (UN)', () => {
    expect(itens[0]).toEqual({
      codigo_produto: '235490',
      descricao: 'REFRI PINK LEMONADE VIDRO PRATA 200ML',
      quantidade: 1,
      unidade: 'Un',
      valor_unitario_centavos: 799,
      valor_total_centavos: 799,
    })
  })

  it('lê corretamente um item por peso (KG)', () => {
    const kiwi = itens.find((i) => i.codigo_produto === '2141')!
    expect(kiwi).toEqual({
      codigo_produto: '2141',
      descricao: 'KIWI SUNGOLD ZESPRI OBQ PR kg',
      quantidade: 0.47,
      unidade: 'Kg',
      valor_unitario_centavos: 5999,
      valor_total_centavos: 2820,
    })
  })

  it('junta a descrição que quebrou no meio de "(Código:"', () => {
    const molho = itens.find((i) => i.codigo_produto === '237879')!
    expect(molho.descricao).toBe('MOLHO IT TOMATE CONCENTRADO BISNAGA COPPOLA 135G')
    expect(molho.valor_total_centavos).toBe(1999)
  })
})

describe('extrairChaveAcesso com chave separada em grupos de 4 dígitos', () => {
  it('concatena os grupos em vez de descartar por não achar 44 dígitos corridos', () => {
    const texto = 'Chave de acesso:\n3526 0904 9720 9200 9421 6520 7000 0527 7314 3005 4013'
    expect(extrairChaveAcesso(texto)).toBe('35260904972092009421652070000527731430054013')
  })
})
