import { describe, expect, it } from 'vitest'
import { agruparPorCorredor } from '../listaCompras'
import type { ItemListaCompras, Mercado } from '../../types'

function item(descricao: string, categoria: ItemListaCompras['categoria']): ItemListaCompras {
  return { descricao, categoria, comprado: false, criado_em: '2026-09-09T10:00:00-03:00' }
}

describe('agruparPorCorredor', () => {
  it('agrupa Fandangos e Batata Palha no mesmo grupo (Doces e snacks) e ordena pelo corredor do mercado', () => {
    const mercado: Mercado = {
      id: 1,
      nome: 'Mercado Teste',
      corredores: [
        { categoria: 'Doces e snacks', corredor: '1' },
        { categoria: 'Hortifruti', corredor: '3' },
        { categoria: 'Mercearia', corredor: '2' },
      ],
    }

    const itens = [
      item('Batata Palha', 'Doces e snacks'),
      item('Alface', 'Hortifruti'),
      item('Feijão', 'Mercearia'),
      item('Fandangos', 'Doces e snacks'),
    ]

    const grupos = agruparPorCorredor(itens, mercado)

    expect(grupos.map((g) => g.categoria)).toEqual(['Doces e snacks', 'Mercearia', 'Hortifruti'])
    expect(grupos.map((g) => g.corredor)).toEqual(['1', '2', '3'])

    const snacks = grupos.find((g) => g.categoria === 'Doces e snacks')!
    expect(snacks.itens.map((i) => i.descricao).sort()).toEqual(['Batata Palha', 'Fandangos'])
  })

  it('ordena corredores numericamente (corredor 2 antes de 10)', () => {
    const mercado: Mercado = {
      id: 1,
      nome: 'Mercado Teste',
      corredores: [
        { categoria: 'Bebidas', corredor: '10' },
        { categoria: 'Higiene', corredor: '2' },
      ],
    }
    const grupos = agruparPorCorredor([item('Água', 'Bebidas'), item('Sabonete', 'Higiene')], mercado)
    expect(grupos.map((g) => g.categoria)).toEqual(['Higiene', 'Bebidas'])
  })

  it('categorias sem corredor mapeado vão para o fim, em ordem alfabética', () => {
    const mercado: Mercado = {
      id: 1,
      nome: 'Mercado Teste',
      corredores: [{ categoria: 'Bebidas', corredor: '1' }],
    }
    const grupos = agruparPorCorredor(
      [item('Água', 'Bebidas'), item('Ração', 'Pet'), item('Detergente', 'Limpeza')],
      mercado,
    )
    expect(grupos.map((g) => g.categoria)).toEqual(['Bebidas', 'Limpeza', 'Pet'])
    expect(grupos[1].corredor).toBeNull()
    expect(grupos[2].corredor).toBeNull()
  })

  it('sem mercado selecionado, agrupa só por categoria em ordem alfabética', () => {
    const grupos = agruparPorCorredor([item('Água', 'Bebidas'), item('Alface', 'Hortifruti')], undefined)
    expect(grupos.map((g) => g.categoria)).toEqual(['Bebidas', 'Hortifruti'])
    expect(grupos.every((g) => g.corredor === null)).toBe(true)
  })
})
