import { db } from '../db/schema'
import { salvarNota } from '../lib/receiptBuilder'
import { NOTAS_FIXTURE } from './fixtureData'

// Guardado num singleton em módulo: o StrictMode do React invoca efeitos duas
// vezes em desenvolvimento, e sem isso as duas chamadas passavam pelo `count()
// === 0` antes de qualquer uma terminar de inserir, duplicando a seed inteira
// (viu-se Oba/Muffato aparecendo duas vezes). Assim, a segunda chamada só
// aguarda a mesma promessa da primeira em vez de checar e inserir de novo.
let promessaSeed: Promise<boolean> | null = null

export function carregarSeedSeVazio(): Promise<boolean> {
  if (!promessaSeed) {
    promessaSeed = (async () => {
      const total = await db.notas.count()
      if (total > 0) return false

      for (const { nota, itens } of NOTAS_FIXTURE) {
        await salvarNota(nota, itens)
      }
      return true
    })()
  }
  return promessaSeed
}
