import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { ItemComNota } from './analytics'
import type { Item, Nota } from '../types'

export function useNotas(): Nota[] {
  return useLiveQuery(() => db.notas.orderBy('data_hora').reverse().toArray(), [], []) ?? []
}

export function useItensComNota(): ItemComNota[] {
  return (
    useLiveQuery(async () => {
      const [notas, itens] = await Promise.all([db.notas.toArray(), db.itens.toArray()])
      const notasPorId = new Map(notas.map((n) => [n.id, n]))
      const resultado: ItemComNota[] = []
      for (const item of itens) {
        const nota = notasPorId.get(item.nota_id)
        if (nota) resultado.push({ item, nota })
      }
      return resultado
    }, [], []) ?? []
  )
}

export function useItensDaNota(notaId: number | undefined): Item[] {
  return (
    useLiveQuery(async () => {
      if (notaId === undefined) return []
      return db.itens.where('nota_id').equals(notaId).toArray()
    }, [notaId], []) ?? []
  )
}

export function useNota(notaId: number | undefined): Nota | undefined {
  return useLiveQuery(async () => {
    if (notaId === undefined) return undefined
    return db.notas.get(notaId)
  }, [notaId])
}
