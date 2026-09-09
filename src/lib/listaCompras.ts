import type { Categoria, ItemListaCompras, Mercado } from '../types'

export interface GrupoListaCompras {
  categoria: Categoria
  corredor: string | null
  itens: ItemListaCompras[]
}

// Agrupa os itens da lista por categoria e ordena os grupos pelo corredor
// mapeado no mercado escolhido — assim a lista sai na ordem em que você
// realmente vai passar pelos corredores. Categorias sem corredor mapeado (ou
// sem mercado selecionado) vão para o final, em ordem alfabética.
export function agruparPorCorredor(itens: ItemListaCompras[], mercado: Mercado | undefined): GrupoListaCompras[] {
  const corredorPorCategoria = new Map<Categoria, string>()
  for (const mapeamento of mercado?.corredores ?? []) {
    if (mapeamento.corredor.trim()) corredorPorCategoria.set(mapeamento.categoria, mapeamento.corredor.trim())
  }

  const porCategoria = new Map<Categoria, ItemListaCompras[]>()
  for (const item of itens) {
    const lista = porCategoria.get(item.categoria) ?? []
    lista.push(item)
    porCategoria.set(item.categoria, lista)
  }

  const grupos: GrupoListaCompras[] = Array.from(porCategoria.entries()).map(([categoria, itensDaCategoria]) => ({
    categoria,
    corredor: corredorPorCategoria.get(categoria) ?? null,
    itens: itensDaCategoria,
  }))

  return grupos.sort((a, b) => {
    if (a.corredor === null && b.corredor === null) return a.categoria.localeCompare(b.categoria, 'pt-BR')
    if (a.corredor === null) return 1
    if (b.corredor === null) return -1

    const numA = Number.parseFloat(a.corredor)
    const numB = Number.parseFloat(b.corredor)
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB

    return a.corredor.localeCompare(b.corredor, 'pt-BR', { numeric: true })
  })
}
