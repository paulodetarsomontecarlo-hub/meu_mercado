import { extrairPesoVolume } from './normalizer'
import { somarCentavos } from './money'
import type { Categoria, Item, Nota } from '../types'

export interface ItemComNota {
  item: Item
  nota: Nota
}

function valorLiquidoItem(item: Item): number {
  return item.valor_total_centavos - item.desconto_centavos
}

export function precoPorKgOuL(item: Item): { valor: number | null; unidade: 'kg' | 'l' | null } {
  const liquido = valorLiquidoItem(item)
  if (item.peso_g) return { valor: (liquido / item.peso_g) * 1000, unidade: 'kg' }
  if (item.volume_ml) return { valor: (liquido / item.volume_ml) * 1000, unidade: 'l' }
  return { valor: null, unidade: null }
}

export interface GastoCategoria {
  categoria: Categoria
  total_centavos: number
  percentual: number
}

export function gastoPorCategoria(itens: Item[]): GastoCategoria[] {
  const totalGeral = somarCentavos(...itens.map(valorLiquidoItem))
  const mapa = new Map<Categoria, number>()
  for (const item of itens) {
    mapa.set(item.categoria, (mapa.get(item.categoria) ?? 0) + valorLiquidoItem(item))
  }
  return Array.from(mapa.entries())
    .map(([categoria, total_centavos]) => ({
      categoria,
      total_centavos,
      percentual: totalGeral > 0 ? (total_centavos / totalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.total_centavos - a.total_centavos)
}

export interface GastoLoja {
  loja: string
  total_pago_centavos: number
  quantidade_itens: number
  ticket_medio_centavos: number
}

export function gastoPorLoja(itensComNota: ItemComNota[]): GastoLoja[] {
  const mapa = new Map<string, { pago: number; itens: number; notaIds: Set<number> }>()

  for (const { nota } of itensComNota) {
    const chave = nota.nome_loja
    const entrada = mapa.get(chave) ?? { pago: 0, itens: 0, notaIds: new Set() }
    entrada.itens += 1
    if (!entrada.notaIds.has(nota.id!)) {
      entrada.notaIds.add(nota.id!)
      entrada.pago += nota.valor_pago_centavos
    }
    mapa.set(chave, entrada)
  }

  return Array.from(mapa.entries())
    .map(([loja, { pago, itens }]) => ({
      loja,
      total_pago_centavos: pago,
      quantidade_itens: itens,
      ticket_medio_centavos: itens > 0 ? pago / itens : 0,
    }))
    .sort((a, b) => b.total_pago_centavos - a.total_pago_centavos)
}

export interface ComparacaoProduto {
  produto: string
  loja: string
  data_hora: string
  preco_centavos: number
  unidade: 'kg' | 'l'
}

// Agrupa por descrição normalizada (o mesmo produto pode ter códigos internos
// diferentes em lojas diferentes) para comparar preço por kg/l entre lojas e ao
// longo do tempo.
export function compararProdutoEntreLojas(itensComNota: ItemComNota[], produto: string): ComparacaoProduto[] {
  const alvo = produto.trim().toLowerCase()
  const resultado: ComparacaoProduto[] = []
  for (const { item, nota } of itensComNota) {
    if (!item.descricao_normalizada.toLowerCase().includes(alvo)) continue
    const { valor, unidade } = precoPorKgOuL(item)
    if (valor === null || unidade === null) continue
    resultado.push({
      produto: item.descricao_normalizada,
      loja: nota.nome_loja,
      data_hora: nota.data_hora,
      preco_centavos: valor,
      unidade,
    })
  }
  return resultado.sort((a, b) => a.preco_centavos - b.preco_centavos)
}

function nomeBase(descricaoNormalizada: string): string {
  return descricaoNormalizada
    .replace(/\d+(?:[.,]\d+)?\s?(KG|G|ML|L)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export interface AlertaFormatoCaro {
  itemCaro: Item
  itemReferencia: Item
  precoCaroCentavos: number
  precoReferenciaCentavos: number
  unidade: 'kg' | 'l'
  razao: number
}

// Compara formatos diferentes do "mesmo" produto (nome base igual, ex.: "Coca-Cola"
// em 200ml e 2L) e sinaliza qualquer formato cujo preço por unidade padrão seja
// significativamente maior que o formato mais barato disponível no período — sem
// assumir que o formato grande é sempre o mais barato.
export function detectarFormatoCaro(itens: Item[], limiarRazao = 1.15): AlertaFormatoCaro[] {
  const grupos = new Map<string, Item[]>()
  for (const item of itens) {
    if (!item.peso_g && !item.volume_ml) continue
    const chave = nomeBase(item.descricao_normalizada)
    if (!chave) continue
    const lista = grupos.get(chave) ?? []
    lista.push(item)
    grupos.set(chave, lista)
  }

  const alertas: AlertaFormatoCaro[] = []
  for (const itensDoGrupo of grupos.values()) {
    if (itensDoGrupo.length < 2) continue

    const comPreco = itensDoGrupo
      .map((item) => ({ item, ...precoPorKgOuL(item) }))
      .filter((x): x is { item: Item; valor: number; unidade: 'kg' | 'l' } => x.valor !== null)

    const porUnidade = new Map<'kg' | 'l', typeof comPreco>()
    for (const entrada of comPreco) {
      const lista = porUnidade.get(entrada.unidade) ?? []
      lista.push(entrada)
      porUnidade.set(entrada.unidade, lista)
    }

    for (const [unidade, lista] of porUnidade) {
      if (lista.length < 2) continue
      const referencia = lista.reduce((min, atual) => (atual.valor < min.valor ? atual : min))
      for (const atual of lista) {
        if (atual.item === referencia.item) continue
        const razao = atual.valor / referencia.valor
        if (razao >= limiarRazao) {
          alertas.push({
            itemCaro: atual.item,
            itemReferencia: referencia.item,
            precoCaroCentavos: atual.valor,
            precoReferenciaCentavos: referencia.valor,
            unidade,
            razao,
          })
        }
      }
    }
  }

  return alertas.sort((a, b) => b.razao - a.razao)
}

export interface CargaTributaria {
  valor_pago_centavos: number
  tributos_centavos: number
  percentual: number
}

export function cargaTributariaPorNota(nota: Nota): CargaTributaria {
  return {
    valor_pago_centavos: nota.valor_pago_centavos,
    tributos_centavos: nota.tributos_centavos,
    percentual: nota.valor_pago_centavos > 0 ? (nota.tributos_centavos / nota.valor_pago_centavos) * 100 : 0,
  }
}

export function cargaTributariaConsolidada(notas: Nota[]): CargaTributaria {
  const valor_pago_centavos = somarCentavos(...notas.map((n) => n.valor_pago_centavos))
  const tributos_centavos = somarCentavos(...notas.map((n) => n.tributos_centavos))
  return {
    valor_pago_centavos,
    tributos_centavos,
    percentual: valor_pago_centavos > 0 ? (tributos_centavos / valor_pago_centavos) * 100 : 0,
  }
}

export interface RankingItem {
  item: Item
  loja: string
  preco_por_kg_ou_l: number
  unidade: 'kg' | 'l'
}

export function rankingMaisCarosPorUnidade(itensComNota: ItemComNota[], top = 10): RankingItem[] {
  return itensComNota
    .map(({ item, nota }) => ({ item, loja: nota.nome_loja, ...precoPorKgOuL(item) }))
    .filter((x) => x.valor !== null && x.unidade !== null)
    .map((x) => ({ item: x.item, loja: x.loja, preco_por_kg_ou_l: x.valor!, unidade: x.unidade! }))
    .sort((a, b) => b.preco_por_kg_ou_l - a.preco_por_kg_ou_l)
    .slice(0, top)
}

export interface EvolucaoMensal {
  mesAno: string
  categoria: Categoria
  total_centavos: number
}

export function evolucaoMensalPorCategoria(itensComNota: ItemComNota[]): EvolucaoMensal[] {
  const mapa = new Map<string, number>()
  for (const { item, nota } of itensComNota) {
    const mesAno = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date(nota.data_hora))
    const chave = `${mesAno}__${item.categoria}`
    mapa.set(chave, (mapa.get(chave) ?? 0) + valorLiquidoItem(item))
  }
  return Array.from(mapa.entries())
    .map(([chave, total_centavos]) => {
      const [mesAno, categoria] = chave.split('__')
      return { mesAno, categoria: categoria as Categoria, total_centavos }
    })
    .sort((a, b) => a.mesAno.localeCompare(b.mesAno))
}

export { extrairPesoVolume }
