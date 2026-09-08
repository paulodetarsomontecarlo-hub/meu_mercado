import { describe, expect, it } from 'vitest'
import { parseLinhasTexto } from '../lineParser'

describe('parseLinhasTexto', () => {
  it('extrai itens e vincula desconto ao item correto', () => {
    const texto = [
      '7891100000105 MOLHO TOM FUGINI 300G 1 UN 1,99 1,99',
      '7891100000106 COCA COLA PET 200ML 2 UN 2,25 4,50',
      'Desconto no item 2 - 1,00',
    ].join('\n')

    const { itens, descontos } = parseLinhasTexto(texto)

    expect(itens).toHaveLength(2)
    expect(itens[0]).toMatchObject({
      codigo_produto: '7891100000105',
      descricao: 'MOLHO TOM FUGINI 300G',
      quantidade: 1,
      unidade: 'Un',
      valor_unitario_centavos: 199,
      valor_total_centavos: 199,
    })
    expect(descontos).toEqual([{ refIndex: 2, valor_centavos: 100 }])
  })

  it('reconhece separadores tipo "x" e "=" comuns em OCR de cupom térmico', () => {
    const texto = '7891000000001 ARROZ BRANCO 5KG 1 UN x 28,90 = 28,90'
    const { itens } = parseLinhasTexto(texto)
    expect(itens).toHaveLength(1)
    expect(itens[0].valor_total_centavos).toBe(2890)
  })

  it('ignora linhas que não batem com o padrão de item', () => {
    const texto = 'CUPOM FISCAL ELETRONICO\nSAO JOSE DO RIO PRETO - SP'
    const { itens, descontos } = parseLinhasTexto(texto)
    expect(itens).toHaveLength(0)
    expect(descontos).toHaveLength(0)
  })
})
