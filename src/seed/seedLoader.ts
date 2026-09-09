import { db } from '../db/schema'
import { salvarNota } from '../lib/receiptBuilder'
import { NOTAS_FIXTURE } from './fixtureData'

// Marca permanente de "a seed já rodou uma vez" — sem isso, o app usava
// `notas.count() === 0` pra decidir se carregava os dados de teste, o que
// parece bom na primeira abertura mas é errado depois: assim que o usuário
// excluísse TODAS as notas (inclusive as de teste), a tabela zerava de novo e
// o app achava que era a primeira abertura outra vez, recarregando tudo a
// cada atualização de página. A flag mora no localStorage (preferência de
// instalação, não dado de negócio) e nunca é apagada por excluir notas.
const CHAVE_SEED_CARREGADA = 'meu-mercado:seed-carregada'

function seedJaCarregada(): boolean {
  try {
    return localStorage.getItem(CHAVE_SEED_CARREGADA) === '1'
  } catch {
    return false
  }
}

function marcarSeedCarregada(): void {
  try {
    localStorage.setItem(CHAVE_SEED_CARREGADA, '1')
  } catch {
    // localStorage indisponível (modo privado etc.) — nesse caso a seed pode
    // vir a rodar de novo se a tabela zerar, mas não há como persistir a marca
  }
}

// Guardado num singleton em módulo: o StrictMode do React invoca efeitos duas
// vezes em desenvolvimento, e sem isso as duas chamadas passavam pela checagem
// antes de qualquer uma terminar de inserir, duplicando a seed inteira (viu-se
// Oba/Muffato aparecendo duas vezes). Assim, a segunda chamada só aguarda a
// mesma promessa da primeira em vez de checar e inserir de novo.
let promessaSeed: Promise<boolean> | null = null

export function carregarSeedSeVazio(): Promise<boolean> {
  if (!promessaSeed) {
    promessaSeed = (async () => {
      if (seedJaCarregada()) return false

      const total = await db.notas.count()
      if (total > 0) {
        marcarSeedCarregada()
        return false
      }

      for (const { nota, itens } of NOTAS_FIXTURE) {
        await salvarNota(nota, itens)
      }
      marcarSeedCarregada()
      return true
    })()
  }
  return promessaSeed
}
