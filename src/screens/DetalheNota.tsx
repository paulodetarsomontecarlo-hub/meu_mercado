import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/schema'
import { useItensDaNota, useNota } from '../lib/useDados'
import { formatarBRL } from '../lib/money'
import { formatarDataHoraBR } from '../lib/date'
import { precoPorKgOuL } from '../lib/analytics'
import { aprenderCorrecaoDescricao } from '../lib/normalizer'
import { aprenderCategoria } from '../lib/categorizer'
import { excluirNota } from '../lib/receiptBuilder'
import { decomporChave, formatarCNPJ } from '../parsers/chaveParser'
import { CATEGORIAS } from '../types'
import type { Item } from '../types'
import { BadgeCategoria, Card, CardTitulo, EstadoVazio } from '../components/ui'

export function DetalheNota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const notaId = id ? Number(id) : undefined
  const nota = useNota(notaId)
  const itens = useItensDaNota(notaId)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  if (nota === undefined) {
    return <EstadoVazio titulo="Nota não encontrada" descricao="Volte ao histórico e tente novamente." />
  }

  async function excluir() {
    if (notaId === undefined) return
    setExcluindo(true)
    try {
      await excluirNota(notaId)
      navigate('/historico')
    } finally {
      setExcluindo(false)
    }
  }

  const chaveDecomposta = nota.chave_acesso ? decomporChave(nota.chave_acesso) : null
  const percentualTributos =
    nota.valor_pago_centavos > 0 ? (nota.tributos_centavos / nota.valor_pago_centavos) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <Link to="/historico" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        ← Voltar ao histórico
      </Link>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{nota.nome_loja}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatarDataHoraBR(nota.data_hora)}</p>
        {nota.endereco && <p className="text-xs text-slate-400">{nota.endereco}</p>}

        <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">Valor bruto</dt>
          <dd className="text-right tabular-nums">{formatarBRL(nota.valor_bruto_centavos)}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Desconto</dt>
          <dd className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
            − {formatarBRL(nota.desconto_total_centavos)}
          </dd>
          <dt className="font-medium text-slate-700 dark:text-slate-300">Valor pago</dt>
          <dd className="text-right font-semibold tabular-nums">{formatarBRL(nota.valor_pago_centavos)}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Tributos totais incidentes</dt>
          <dd className="text-right tabular-nums text-slate-500 dark:text-slate-400">
            {formatarBRL(nota.tributos_centavos)} ({percentualTributos.toFixed(1)}%)
          </dd>
        </dl>

        {nota.forma_pagamento.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {nota.forma_pagamento.map((f) => `${f.tipo}: ${formatarBRL(f.valor_centavos)}`).join(' · ')}
          </p>
        )}
      </Card>

      {chaveDecomposta?.chave && (
        <Card>
          <CardTitulo>Chave de acesso</CardTitulo>
          <p className="break-all font-mono text-xs text-slate-600 dark:text-slate-400">{chaveDecomposta.chave}</p>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-slate-400">UF</dt>
            <dd className="text-right">{chaveDecomposta.uf_nome ?? chaveDecomposta.uf_codigo}</dd>
            <dt className="text-slate-400">Competência</dt>
            <dd className="text-right">{chaveDecomposta.competencia}</dd>
            <dt className="text-slate-400">CNPJ emitente</dt>
            <dd className="text-right">{formatarCNPJ(chaveDecomposta.cnpj_emitente)}</dd>
            <dt className="text-slate-400">Modelo/Série/Número</dt>
            <dd className="text-right">
              {chaveDecomposta.modelo}/{chaveDecomposta.serie}/{chaveDecomposta.numero}
            </dd>
            <dt className="text-slate-400">Validação</dt>
            <dd className={`text-right ${chaveDecomposta.valida ? 'text-emerald-600' : 'text-rose-600'}`}>
              {chaveDecomposta.valida ? 'Válida' : 'Dígito verificador não confere'}
            </dd>
          </dl>
        </Card>
      )}

      <Card>
        <CardTitulo>Itens ({itens.length})</CardTitulo>
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {itens.map((item) => (
            <LinhaItem key={item.id} item={item} />
          ))}
        </div>
      </Card>

      <Card className="border-rose-200 dark:border-rose-900">
        {confirmandoExclusao ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Excluir esta nota e seus {itens.length} itens? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={excluir}
                disabled={excluindo}
                className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {excluindo ? 'Excluindo…' : 'Sim, excluir'}
              </button>
              <button
                onClick={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm dark:border-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmandoExclusao(true)}
            className="w-full text-center text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Excluir nota
          </button>
        )}
      </Card>
    </div>
  )
}

function LinhaItem({ item }: { item: Item }) {
  const [editando, setEditando] = useState(false)
  const [descricao, setDescricao] = useState(item.descricao_normalizada)
  const [categoria, setCategoria] = useState(item.categoria)

  const { valor, unidade } = precoPorKgOuL(item)

  async function salvar() {
    await db.itens.update(item.id!, {
      descricao_normalizada: descricao,
      categoria,
      descricao_corrigida_manualmente: descricao !== item.descricao_normalizada || undefined,
      categoria_corrigida_manualmente: categoria !== item.categoria || undefined,
    })
    await aprenderCorrecaoDescricao(item.codigo_produto, descricao, categoria, item.peso_g, item.volume_ml)
    await aprenderCategoria(item.codigo_produto, categoria)
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="flex flex-col gap-2 py-3">
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Item['categoria'])}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={salvar} className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-sm font-medium text-white">
            Salvar e aprender
          </button>
          <button
            onClick={() => setEditando(false)}
            className="flex-1 rounded-lg border border-slate-300 py-1.5 text-sm dark:border-slate-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setEditando(true)} className="flex items-start justify-between gap-3 py-3 text-left">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.descricao_normalizada}</p>
        <p className="truncate text-xs text-slate-400">{item.descricao_original}</p>
        <div className="mt-1 flex items-center gap-2">
          <BadgeCategoria categoria={item.categoria} />
          <span className="text-xs text-slate-400">
            {item.quantidade} {item.unidade}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
          {formatarBRL(item.valor_total_centavos - item.desconto_centavos)}
        </p>
        {valor !== null && (
          <p className="text-xs text-slate-400 tabular-nums">
            {formatarBRL(valor)}/{unidade}
          </p>
        )}
        {item.desconto_centavos > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">− {formatarBRL(item.desconto_centavos)}</p>
        )}
      </div>
    </button>
  )
}
