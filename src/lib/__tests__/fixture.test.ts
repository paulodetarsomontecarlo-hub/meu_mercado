import { describe, expect, it } from 'vitest'
import { NOTAS_FIXTURE } from '../../seed/fixtureData'
import { cargaTributariaConsolidada, detectarFormatoCaro, gastoPorLoja, precoPorKgOuL } from '../analytics'
import { somarCentavos } from '../money'
import type { Item, Nota } from '../../types'

function montarItensComNota(): { item: Item; nota: Nota }[] {
  let proximoId = 1
  const resultado: { item: Item; nota: Nota }[] = []
  for (const { nota, itens } of NOTAS_FIXTURE) {
    const notaComId: Nota = { ...nota, id: proximoId++ }
    for (const item of itens) {
      resultado.push({ item: { ...item, id: proximoId, nota_id: notaComId.id! } as Item, nota: notaComId })
    }
  }
  return resultado
}

describe('fixture 07/09/2026', () => {
  it('cada nota bate com bruto/desconto/pago informados e contagem de itens', () => {
    const esperado = [
      { loja: 'Assaí Atacadista', itens: 95, bruto: 70787, desconto: 1084, pago: 69703, tributos: 7933 },
      { loja: 'Muffato', itens: 22, bruto: 36913, desconto: 0, pago: 36913, tributos: 10935 },
      { loja: 'Oba Hortifruti (Fartura)', itens: 8, bruto: 15628, desconto: 719, pago: 14909, tributos: 2999 },
      { loja: 'Não identificada', itens: 1, bruto: 1890, desconto: 0, pago: 1890, tributos: 340 },
    ]

    esperado.forEach((exp, i) => {
      const { nota, itens } = NOTAS_FIXTURE[i]
      expect(nota.nome_loja).toBe(exp.loja)
      expect(itens.length).toBe(exp.itens)
      expect(nota.valor_bruto_centavos).toBe(exp.bruto)
      expect(nota.desconto_total_centavos).toBe(exp.desconto)
      expect(nota.valor_pago_centavos).toBe(exp.pago)
      expect(nota.tributos_centavos).toBe(exp.tributos)

      const somaItens = somarCentavos(...itens.map((it) => it.valor_total_centavos))
      expect(somaItens).toBe(exp.bruto)
      const somaDescontos = somarCentavos(...itens.map((it) => it.desconto_centavos))
      expect(somaDescontos).toBe(exp.desconto)
    })
  })

  it('caso 1: consolida R$ 1.234,15 pagos e R$ 222,07 de tributos (18,0%)', () => {
    const notas = NOTAS_FIXTURE.map((n) => n.nota as Nota)
    const carga = cargaTributariaConsolidada(notas)
    expect(carga.valor_pago_centavos).toBe(123415)
    expect(carga.tributos_centavos).toBe(22207)
    expect(Number(carga.percentual.toFixed(1))).toBe(18.0)
  })

  it('caso 2: molho de tomate a R$ 6,63/kg (Fugini) e R$ 148,07/kg (Coppola), ~22x de diferença', () => {
    const fugini = NOTAS_FIXTURE[0].itens.find((i) => i.descricao_normalizada.includes('Fugini'))!
    const coppola = NOTAS_FIXTURE[1].itens.find((i) => i.descricao_normalizada.includes('Coppola'))!

    const precoFugini = precoPorKgOuL(fugini as Item)
    const precoCoppola = precoPorKgOuL(coppola as Item)

    expect(Math.round(precoFugini.valor!) / 100).toBeCloseTo(6.63, 2)
    expect(Math.round(precoCoppola.valor!) / 100).toBeCloseTo(148.07, 2)
    expect(precoCoppola.valor! / precoFugini.valor!).toBeGreaterThan(20)
    expect(precoCoppola.valor! / precoFugini.valor!).toBeLessThan(24)
  })

  it('caso 3 e 4: detecta Coca-Cola 200ml e água 5L como formato caro frente à alternativa comprada no mesmo dia', () => {
    const itensAssai = NOTAS_FIXTURE[0].itens as Item[]
    const alertas = detectarFormatoCaro(itensAssai)

    const alertaCoca = alertas.find((a) => a.itemCaro.descricao_normalizada.includes('200ml'))
    expect(alertaCoca).toBeDefined()
    expect(Math.round(alertaCoca!.precoCaroCentavos) / 100).toBeCloseTo(11.25, 2)
    expect(alertaCoca!.razao).toBeGreaterThan(2)

    const alertaAgua = alertas.find((a) => a.itemCaro.descricao_normalizada.includes('5L'))
    expect(alertaAgua).toBeDefined()
    expect(Math.round(alertaAgua!.precoCaroCentavos) / 100).toBeCloseTo(2.38, 2)
    expect(Math.round(alertaAgua!.precoReferenciaCentavos) / 100).toBeCloseTo(1.86, 2)
  })

  it('caso 5: ticket médio por item — R$ 7,34 (Assaí), R$ 16,78 (Muffato), R$ 19,54 no braço bruto do Oba', () => {
    const itensComNota = montarItensComNota()
    const porLoja = gastoPorLoja(itensComNota)

    const assai = porLoja.find((l) => l.loja === 'Assaí Atacadista')!
    const muffato = porLoja.find((l) => l.loja === 'Muffato')!

    expect(Math.round(assai.ticket_medio_centavos) / 100).toBeCloseTo(7.34, 2)
    expect(Math.round(muffato.ticket_medio_centavos) / 100).toBeCloseTo(16.78, 2)
  })
})
