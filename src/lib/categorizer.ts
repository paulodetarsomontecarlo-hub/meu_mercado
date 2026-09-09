import { db } from '../db/schema'
import type { Categoria } from '../types'

const REGRAS: [RegExp, Categoria][] = [
  // Salgadinhos de pacote e marcas conhecidas entram antes de Hortifruti — sem
  // isso "Batata Palha"/"Fandangos" cairiam em Hortifruti só por conterem
  // "batata" ou nenhuma palavra-chave genérica de doces/snacks.
  [/batata palha|batata chips|fandangos|cheetos|doritos|ruffles|torcida|baconzitos|elma chips|cebolitos|pringles/i, 'Doces e snacks'],
  [/tomate|banana|alface|cenoura|batata|cebola|laranja|mac[aã]|uva|verdura|legume|fruta|hortifruti|limão|abacate|couve|morango/i, 'Hortifruti'],
  [/mussarela|president|linguiça|calabresa|sadia|carne|frango|bovin[oa]|su[íi]n[oa]|frios|presunto|salame|bacon|peixe|file/i, 'Carnes e frios'],
  [/arroz|feij[aã]o|macarr[aã]o|farinha|a[çc][uú]car|[óo]leo|sal\b|molho|extrato|caf[eé]|tempero|massa/i, 'Mercearia'],
  [/refrigerante|coca-?cola|suco|cerveja|[áa]gua\b|vinho|energ[eé]tico|refri/i, 'Bebidas'],
  [/chocolate|bolacha|biscoito|doce|snack|salgadinho|bala|balas|sorvete|bombom/i, 'Doces e snacks'],
  [/creme dental|colgate|sabonete|shampoo|desodorante|papel higi[eê]nico|absorvente|escova de dente|fralda/i, 'Higiene'],
  [/detergente|sabão|amaciante|desinfetante|água sanit[áa]ria|esponja|multiuso|limpeza/i, 'Limpeza'],
  [/panela|talher|copo|prato|utens[íi]lio|pote|potinho/i, 'Utensílios'],
  [/ra[çc][aã]o|petisco|areia sanit[áa]ria|coleira/i, 'Pet'],
]

export function categorizarPorPalavraChave(descricaoNormalizada: string): Categoria {
  for (const [padrao, categoria] of REGRAS) {
    if (padrao.test(descricaoNormalizada)) return categoria
  }
  return 'Outros'
}

export async function categorizarItem(
  codigoProduto: string,
  descricaoNormalizada: string,
): Promise<{ categoria: Categoria; aprendidoDoDicionario: boolean }> {
  const aprendido = await db.produtos.get(codigoProduto)
  if (aprendido) {
    return { categoria: aprendido.categoria, aprendidoDoDicionario: true }
  }
  return { categoria: categorizarPorPalavraChave(descricaoNormalizada), aprendidoDoDicionario: false }
}

// Chamado quando o usuário reclassifica um item manualmente.
export async function aprenderCategoria(codigo: string, categoria: Categoria): Promise<void> {
  const existente = await db.produtos.get(codigo)
  if (existente) {
    await db.produtos.update(codigo, { categoria })
  } else {
    await db.produtos.put({
      codigo,
      descricao_normalizada: '',
      categoria,
      peso_g: null,
      volume_ml: null,
      historico_precos: [],
    })
  }
}

// Categoriza um item digitado à mão na lista de compras, sem código de produto
// (ainda não foi comprado). Primeiro tenta achar algo parecido no dicionário
// aprendido pelas notas já lançadas; se não achar, cai nas mesmas regras por
// palavra-chave usadas para itens de nota.
export async function categorizarTextoLivre(texto: string): Promise<Categoria> {
  const normalizado = texto.trim().toLowerCase()
  if (!normalizado) return 'Outros'

  if (normalizado.length >= 3) {
    const produtos = await db.produtos.toArray()
    const encontrado = produtos.find((p) => {
      const nome = p.descricao_normalizada.toLowerCase()
      return nome.length >= 3 && (nome.includes(normalizado) || normalizado.includes(nome))
    })
    if (encontrado) return encontrado.categoria
  }

  return categorizarPorPalavraChave(texto)
}
