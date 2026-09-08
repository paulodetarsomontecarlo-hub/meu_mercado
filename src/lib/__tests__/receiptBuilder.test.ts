import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/schema'
import { excluirNota, salvarNota } from '../receiptBuilder'
import type { Item, Nota } from '../../types'

function notaBase(): Omit<Nota, 'id'> {
  return {
    chave_acesso: null,
    cnpj_emitente: '12345678000199',
    nome_loja: 'Mercado Teste',
    endereco: null,
    data_hora: '2026-09-07T12:00:00-03:00',
    numero: null,
    serie: null,
    valor_bruto_centavos: 1000,
    desconto_total_centavos: 0,
    valor_pago_centavos: 1000,
    tributos_centavos: 100,
    forma_pagamento: [],
    origem: 'manual',
    criado_em: '2026-09-07T12:00:00-03:00',
  }
}

function itemBase(): Omit<Item, 'id' | 'nota_id'> {
  return {
    codigo_produto: 'produto-teste-1',
    descricao_original: 'PRODUTO TESTE',
    descricao_normalizada: 'Produto Teste',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 1000,
    valor_total_centavos: 1000,
    desconto_centavos: 0,
    categoria: 'Outros',
    peso_g: null,
    volume_ml: null,
  }
}

beforeEach(async () => {
  await db.notas.clear()
  await db.itens.clear()
  await db.produtos.clear()
})

describe('excluirNota', () => {
  it('remove a nota e seus itens, e limpa o histórico de preço do produto', async () => {
    const notaId = await salvarNota(notaBase(), [itemBase()])

    expect(await db.notas.get(notaId)).toBeDefined()
    expect(await db.itens.where('nota_id').equals(notaId).count()).toBe(1)
    const produtoAntes = await db.produtos.get('produto-teste-1')
    expect(produtoAntes?.historico_precos).toHaveLength(1)

    await excluirNota(notaId)

    expect(await db.notas.get(notaId)).toBeUndefined()
    expect(await db.itens.where('nota_id').equals(notaId).count()).toBe(0)

    // o produto em si (nome normalizado aprendido) continua existindo, só o
    // histórico de preço daquela nota é retirado
    const produtoDepois = await db.produtos.get('produto-teste-1')
    expect(produtoDepois).toBeDefined()
    expect(produtoDepois?.historico_precos).toHaveLength(0)
  })

  it('não afeta outras notas nem o histórico de preço de outras compras do mesmo produto', async () => {
    const nota1 = await salvarNota(notaBase(), [itemBase()])
    const nota2 = await salvarNota(notaBase(), [itemBase()])

    await excluirNota(nota1)

    expect(await db.notas.get(nota2)).toBeDefined()
    const produto = await db.produtos.get('produto-teste-1')
    expect(produto?.historico_precos).toHaveLength(1)
    expect(produto?.historico_precos[0].nota_id).toBe(nota2)
  })
})
