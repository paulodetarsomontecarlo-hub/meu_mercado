import { db } from '../db/schema'
import { salvarNota } from '../lib/receiptBuilder'
import { NOTAS_FIXTURE } from './fixtureData'

export async function carregarSeedSeVazio(): Promise<boolean> {
  const total = await db.notas.count()
  if (total > 0) return false

  for (const { nota, itens } of NOTAS_FIXTURE) {
    await salvarNota(nota, itens)
  }
  return true
}
