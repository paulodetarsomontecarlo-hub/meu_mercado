import { db } from '../db/schema'
import { deduplicarItens } from './dedupe'
import { normalizarItem } from './normalizer'
import { categorizarItem } from './categorizer'
import { somarCentavos } from './money'
import type { Item, Nota, RawReceipt } from '../types'

// Ponto de convergência dos quatro caminhos de entrada (foto/pdf/qr/manual): todos
// produzem um RawReceipt, que vira Nota + Item[] pelo mesmo pipeline de
// deduplicação -> normalização -> categorização.
export async function construirNotaEItens(
  raw: RawReceipt,
): Promise<{ nota: Omit<Nota, 'id'>; itens: Omit<Item, 'id' | 'nota_id'>[] }> {
  const deduplicados = deduplicarItens(raw)

  const itens: Omit<Item, 'id' | 'nota_id'>[] = []
  for (const linha of deduplicados) {
    const normalizado = await normalizarItem(linha.codigo_produto, linha.descricao)
    const { categoria } = await categorizarItem(linha.codigo_produto, normalizado.descricao_normalizada)

    itens.push({
      codigo_produto: linha.codigo_produto,
      descricao_original: linha.descricao,
      descricao_normalizada: normalizado.descricao_normalizada,
      quantidade: linha.quantidade,
      unidade: linha.unidade,
      valor_unitario_centavos: linha.valor_unitario_centavos,
      valor_total_centavos: linha.valor_total_centavos,
      desconto_centavos: linha.desconto_centavos,
      categoria,
      peso_g: normalizado.peso_g,
      volume_ml: normalizado.volume_ml,
    })
  }

  const somaItens = somarCentavos(...itens.map((i) => i.valor_total_centavos))
  const somaDescontos = somarCentavos(...itens.map((i) => i.desconto_centavos))

  const nota: Omit<Nota, 'id'> = {
    chave_acesso: raw.chave_acesso,
    cnpj_emitente: raw.cnpj_emitente,
    nome_loja: raw.nome_loja,
    endereco: raw.endereco,
    data_hora: raw.data_hora,
    numero: raw.numero,
    serie: raw.serie,
    valor_bruto_centavos: raw.valor_bruto_centavos ?? somaItens + somaDescontos,
    desconto_total_centavos: raw.desconto_total_centavos ?? somaDescontos,
    valor_pago_centavos: raw.valor_pago_centavos ?? somaItens,
    tributos_centavos: raw.tributos_centavos ?? 0,
    forma_pagamento: raw.forma_pagamento,
    origem: raw.origem,
    criado_em: new Date().toISOString(),
  }

  return { nota, itens }
}

export async function salvarNota(
  nota: Omit<Nota, 'id'>,
  itens: Omit<Item, 'id' | 'nota_id'>[],
): Promise<number> {
  return db.transaction('rw', db.notas, db.itens, db.produtos, async () => {
    const notaId = (await db.notas.add(nota as Nota)) as number

    for (const item of itens) {
      await db.itens.add({ ...item, nota_id: notaId } as Item)

      const existente = await db.produtos.get(item.codigo_produto)
      const preco_normalizado_centavos = item.peso_g
        ? (item.valor_total_centavos / item.peso_g) * 1000
        : item.volume_ml
          ? (item.valor_total_centavos / item.volume_ml) * 1000
          : null
      const unidade_normalizada: 'kg' | 'l' | null = item.peso_g ? 'kg' : item.volume_ml ? 'l' : null

      const novoHistorico = {
        nota_id: notaId,
        loja: nota.nome_loja,
        data_hora: nota.data_hora,
        preco_unitario_centavos: item.valor_unitario_centavos,
        preco_normalizado_centavos,
        unidade_normalizada,
      }

      await db.produtos.put({
        codigo: item.codigo_produto,
        descricao_normalizada: existente?.descricao_normalizada || item.descricao_normalizada,
        categoria: existente?.categoria ?? item.categoria,
        peso_g: existente?.peso_g ?? item.peso_g,
        volume_ml: existente?.volume_ml ?? item.volume_ml,
        historico_precos: [...(existente?.historico_precos ?? []), novoHistorico],
      })
    }

    return notaId
  })
}

// Remove a nota e seus itens. O histórico de preços dessa nota também é retirado
// do dicionário de produtos, mas o produto em si (nome normalizado, categoria)
// permanece — o aprendizado por código continua valendo para as próximas notas.
export async function excluirNota(notaId: number): Promise<void> {
  return db.transaction('rw', db.notas, db.itens, db.produtos, async () => {
    const itens = await db.itens.where('nota_id').equals(notaId).toArray()

    for (const item of itens) {
      const produto = await db.produtos.get(item.codigo_produto)
      if (produto) {
        await db.produtos.update(item.codigo_produto, {
          historico_precos: produto.historico_precos.filter((h) => h.nota_id !== notaId),
        })
      }
    }

    await db.itens.where('nota_id').equals(notaId).delete()
    await db.notas.delete(notaId)
  })
}
