import { describe, expect, it } from 'vitest'
import { decomporChave, formatarCNPJ } from '../chaveParser'
import { NOTAS_FIXTURE } from '../../seed/fixtureData'

describe('decomporChave', () => {
  it('decompõe e valida a chave da nota do Assaí do fixture', () => {
    const chave = NOTAS_FIXTURE[0].nota.chave_acesso!
    const decomposta = decomporChave(chave)

    expect(decomposta.valida).toBe(true)
    expect(decomposta.uf_codigo).toBe('35')
    expect(decomposta.uf_nome).toBe('SP')
    expect(decomposta.ano).toBe(2026)
    expect(decomposta.mes).toBe(9)
    expect(decomposta.cnpj_emitente).toBe('06057223056800')
  })

  it('marca como inválida uma chave com dígito verificador errado', () => {
    const chave = NOTAS_FIXTURE[0].nota.chave_acesso!
    const ultimoDigito = Number(chave[43])
    const chaveAdulterada = chave.slice(0, 43) + String((ultimoDigito + 1) % 10)
    expect(decomporChave(chaveAdulterada).valida).toBe(false)
  })

  it('retorna inválida para chave com tamanho incorreto', () => {
    expect(decomporChave('123').valida).toBe(false)
  })

  it('formata CNPJ com máscara', () => {
    expect(formatarCNPJ('06057223056800')).toBe('06.057.223/0568-00')
  })
})
