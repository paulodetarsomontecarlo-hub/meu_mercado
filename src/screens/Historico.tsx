import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useItensComNota, useNotas } from '../lib/useDados'
import { formatarBRL } from '../lib/money'
import { formatarDataBR, formatarHoraBR } from '../lib/date'
import { CATEGORIAS } from '../types'
import { Card, EstadoVazio } from '../components/ui'
import { baixarCSV, gerarCSV } from '../lib/csvExport'

export function Historico() {
  const notas = useNotas()
  const itensComNota = useItensComNota()

  const [data, setData] = useState('')
  const [loja, setLoja] = useState('')
  const [categoria, setCategoria] = useState('')

  const lojas = useMemo(() => Array.from(new Set(notas.map((n) => n.nome_loja))).sort(), [notas])

  const notasComCategoria = useMemo(() => {
    if (!categoria) return null
    return new Set(
      itensComNota.filter((x) => x.item.categoria === categoria).map((x) => x.nota.id),
    )
  }, [itensComNota, categoria])

  const notasFiltradas = useMemo(() => {
    return notas.filter((n) => {
      if (data && formatarDataBR(n.data_hora) !== formatarDataBR(`${data}T12:00:00-03:00`)) return false
      if (loja && n.nome_loja !== loja) return false
      if (notasComCategoria && !notasComCategoria.has(n.id)) return false
      return true
    })
  }, [notas, data, loja, notasComCategoria])

  function exportarCSV() {
    const idsFiltrados = new Set(notasFiltradas.map((n) => n.id))
    const itensFiltrados = itensComNota.filter((x) => idsFiltrados.has(x.nota.id))
    baixarCSV(gerarCSV(itensFiltrados), 'meu-mercado-export.csv')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-1"
          />
          <select
            value={loja}
            onChange={(e) => setLoja(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={exportarCSV}
          disabled={notasFiltradas.length === 0}
          className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Exportar CSV ({notasFiltradas.length} {notasFiltradas.length === 1 ? 'nota' : 'notas'})
        </button>
      </Card>

      {notasFiltradas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma nota encontrada" descricao="Ajuste os filtros ou adicione uma nova nota." />
      ) : (
        <div className="flex flex-col gap-2">
          {notasFiltradas.map((nota) => (
            <Link key={nota.id} to={`/nota/${nota.id}`}>
              <Card className="transition hover:border-emerald-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{nota.nome_loja}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatarDataBR(nota.data_hora)} às {formatarHoraBR(nota.data_hora)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatarBRL(nota.valor_pago_centavos)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
