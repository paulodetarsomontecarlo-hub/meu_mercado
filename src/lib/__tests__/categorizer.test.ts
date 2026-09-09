import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/schema'
import { categorizarPorPalavraChave, categorizarTextoLivre } from '../categorizer'

beforeEach(async () => {
  await db.produtos.clear()
})

describe('categorizarPorPalavraChave', () => {
  it('não confunde salgadinho de batata com hortifruti', () => {
    expect(categorizarPorPalavraChave('Batata Palha')).toBe('Doces e snacks')
    expect(categorizarPorPalavraChave('Fandangos')).toBe('Doces e snacks')
    // a batata "de verdade" (hortifruti) continua funcionando
    expect(categorizarPorPalavraChave('Batata')).toBe('Hortifruti')
  })
})

describe('categorizarTextoLivre (itens digitados na lista de compras, sem código)', () => {
  it('usa o dicionário aprendido quando o texto bate com um produto já comprado', async () => {
    await db.produtos.put({
      codigo: '123',
      descricao_normalizada: 'Ração para Cães Adultos 1Kg',
      categoria: 'Pet',
      peso_g: 1000,
      volume_ml: null,
      historico_precos: [],
    })

    expect(await categorizarTextoLivre('Ração')).toBe('Pet')
  })

  it('cai nas regras por palavra-chave quando não há nada parecido no dicionário', async () => {
    expect(await categorizarTextoLivre('Batata Palha')).toBe('Doces e snacks')
    expect(await categorizarTextoLivre('Alface')).toBe('Hortifruti')
    expect(await categorizarTextoLivre('Feijão')).toBe('Mercearia')
  })

  it('texto vazio cai em Outros sem quebrar', async () => {
    expect(await categorizarTextoLivre('   ')).toBe('Outros')
  })
})
