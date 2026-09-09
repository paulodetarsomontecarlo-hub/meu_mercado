import Dexie, { type EntityTable } from 'dexie'
import type { Item, ItemListaCompras, Mercado, Nota, Produto } from '../types'

export class MeuMercadoDB extends Dexie {
  notas!: EntityTable<Nota, 'id'>
  itens!: EntityTable<Item, 'id'>
  produtos!: EntityTable<Produto, 'codigo'>
  mercados!: EntityTable<Mercado, 'id'>
  itensListaCompras!: EntityTable<ItemListaCompras, 'id'>

  constructor() {
    super('meu-mercado')

    this.version(1).stores({
      notas: '++id, chave_acesso, cnpj_emitente, nome_loja, data_hora, origem',
      itens: '++id, nota_id, codigo_produto, categoria, descricao_normalizada',
      produtos: 'codigo, descricao_normalizada, categoria',
    })

    // v2: lista de compras + cadastro de mercados/corredores.
    this.version(2).stores({
      mercados: '++id, nome',
      itensListaCompras: '++id, categoria, comprado, criado_em',
    })
  }
}

export const db = new MeuMercadoDB()
