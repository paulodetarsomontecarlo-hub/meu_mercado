import type { RawItemLine, Unidade } from '../types'
import { formatarBRL } from '../lib/money'

const UNIDADES: Unidade[] = ['Un', 'Kg', 'Pc', 'L']

let proximoCodigoManual = 1

export function novoItemManual(): RawItemLine {
  return {
    codigo_produto: `manual-${proximoCodigoManual++}`,
    descricao: '',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 0,
    valor_total_centavos: 0,
  }
}

export function EditorItensRaw({
  itens,
  onChange,
}: {
  itens: RawItemLine[]
  onChange: (itens: RawItemLine[]) => void
}) {
  function atualizar(index: number, patch: Partial<RawItemLine>) {
    const copia = itens.slice()
    const atual = { ...copia[index], ...patch }
    if (patch.quantidade !== undefined || patch.valor_unitario_centavos !== undefined) {
      atual.valor_total_centavos = Math.round(atual.quantidade * atual.valor_unitario_centavos)
    }
    copia[index] = atual
    onChange(copia)
  }

  function remover(index: number) {
    onChange(itens.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {itens.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
          <input
            placeholder="Descrição do item"
            value={item.descricao}
            onChange={(e) => atualizar(i, { descricao: e.target.value })}
            className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <div className="grid grid-cols-4 gap-1.5">
            <input
              type="number"
              step="0.001"
              placeholder="Qtd"
              value={item.quantidade}
              onChange={(e) => atualizar(i, { quantidade: Number(e.target.value) || 0 })}
              className="rounded-md border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
            <select
              value={item.unidade}
              onChange={(e) => atualizar(i, { unidade: e.target.value as Unidade })}
              className="rounded-md border border-slate-300 px-1 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Vl. unit"
              value={item.valor_unitario_centavos / 100}
              onChange={(e) => atualizar(i, { valor_unitario_centavos: Math.round(Number(e.target.value) * 100) || 0 })}
              className="rounded-md border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs tabular-nums text-slate-500">{formatarBRL(item.valor_total_centavos)}</span>
              <button onClick={() => remover(i)} className="text-rose-500 hover:text-rose-700" aria-label="Remover item">
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...itens, novoItemManual()])}
        className="rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700"
      >
        + Adicionar item
      </button>
    </div>
  )
}
