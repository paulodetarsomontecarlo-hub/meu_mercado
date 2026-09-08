import Dexie, { type EntityTable } from 'dexie'
import type { Item, Nota, Produto } from '../types'

export class MeuMercadoDB extends Dexie {
  notas!: EntityTable<Nota, 'id'>
  itens!: EntityTable<Item, 'id'>
  produtos!: EntityTable<Produto, 'codigo'>

  constructor() {
    super('meu-mercado')

    this.version(1).stores({
      notas: '++id, chave_acesso, cnpj_emitente, nome_loja, data_hora, origem',
      itens: '++id, nota_id, codigo_produto, categoria, descricao_normalizada',
      produtos: 'codigo, descricao_normalizada, categoria',
    })
  }
}

export const db = new MeuMercadoDB()
