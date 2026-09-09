import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/schema'

// Cada teste precisa de um módulo novo: `carregarSeedSeVazio` guarda a
// promessa da primeira chamada num singleton de módulo, então reimportamos
// com módulos resetados pra simular "recarreguei a página" de verdade.
async function importarSeedLoaderFresco() {
  vi.resetModules()
  return import('../seedLoader')
}

beforeEach(async () => {
  await db.notas.clear()
  await db.itens.clear()
  await db.produtos.clear()
  localStorage.clear()
})

describe('carregarSeedSeVazio', () => {
  it('carrega a seed na primeira vez (banco vazio, sem marca ainda)', async () => {
    const { carregarSeedSeVazio } = await importarSeedLoaderFresco()
    const carregou = await carregarSeedSeVazio()
    expect(carregou).toBe(true)
    expect(await db.notas.count()).toBe(4)
  })

  it('não recarrega a seed depois que o usuário exclui todas as notas e a página é atualizada', async () => {
    // "página 1": primeira abertura, carrega normalmente
    const primeiraCarga = await importarSeedLoaderFresco()
    await primeiraCarga.carregarSeedSeVazio()
    expect(await db.notas.count()).toBe(4)

    // usuário exclui todas as notas manualmente
    await db.notas.clear()
    await db.itens.clear()
    expect(await db.notas.count()).toBe(0)

    // "página 2": simula um F5 — módulo reimportado do zero, singleton perdido,
    // mas a marca no localStorage precisa sobreviver e impedir a recarga
    const segundaCarga = await importarSeedLoaderFresco()
    const recarregou = await segundaCarga.carregarSeedSeVazio()

    expect(recarregou).toBe(false)
    expect(await db.notas.count()).toBe(0)
  })

  it('não duplica quando chamada duas vezes em paralelo (StrictMode)', async () => {
    const { carregarSeedSeVazio } = await importarSeedLoaderFresco()
    await Promise.all([carregarSeedSeVazio(), carregarSeedSeVazio()])
    expect(await db.notas.count()).toBe(4)
  })
})
