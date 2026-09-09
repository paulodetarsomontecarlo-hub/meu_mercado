import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/schema'
import { useItensListaCompras, useMercado, useMercados } from '../lib/useDados'
import { categorizarTextoLivre } from '../lib/categorizer'
import { agruparPorCorredor } from '../lib/listaCompras'
import { Card, EstadoVazio } from '../components/ui'

const CHAVE_MERCADO_SELECIONADO = 'meu-mercado:lista-compras:mercado-selecionado'

function lerMercadoSelecionado(): number | undefined {
  try {
    const salvo = localStorage.getItem(CHAVE_MERCADO_SELECIONADO)
    return salvo ? Number(salvo) : undefined
  } catch {
    return undefined
  }
}

export function ListaCompras() {
  const itens = useItensListaCompras()
  const mercados = useMercados()
  const [mercadoId, setMercadoId] = useState<number | undefined>(lerMercadoSelecionado)
  const mercado = useMercado(mercadoId)
  const [texto, setTexto] = useState('')

  useEffect(() => {
    try {
      if (mercadoId === undefined) localStorage.removeItem(CHAVE_MERCADO_SELECIONADO)
      else localStorage.setItem(CHAVE_MERCADO_SELECIONADO, String(mercadoId))
    } catch {
      // localStorage indisponível (modo privado etc.) — só perde a preferência entre sessões
    }
  }, [mercadoId])

  async function adicionarItem() {
    const descricao = texto.trim()
    if (!descricao) return
    const categoria = await categorizarTextoLivre(descricao)
    await db.itensListaCompras.add({
      descricao,
      categoria,
      comprado: false,
      criado_em: new Date().toISOString(),
    })
    setTexto('')
  }

  async function alternarComprado(id: number, comprado: boolean) {
    await db.itensListaCompras.update(id, { comprado: !comprado })
  }

  async function removerItem(id: number) {
    await db.itensListaCompras.delete(id)
  }

  async function limparComprados() {
    const idsComprados = itens.filter((i) => i.comprado).map((i) => i.id!)
    await db.itensListaCompras.bulkDelete(idsComprados)
  }

  const grupos = agruparPorCorredor(itens, mercado)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarItem()}
            placeholder="Adicionar item (ex: Batata Palha)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            onClick={adicionarItem}
            disabled={!texto.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <select
            value={mercadoId ?? ''}
            onChange={(e) => setMercadoId(e.target.value ? Number(e.target.value) : undefined)}
            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Agrupar só por categoria (sem corredor)</option>
            {mercados.map((m) => (
              <option key={m.id} value={m.id}>
                Agrupar pelos corredores do {m.nome}
              </option>
            ))}
          </select>
          <Link
            to="/mercados"
            className="whitespace-nowrap text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Mercados
          </Link>
        </div>
      </Card>

      {itens.length === 0 ? (
        <EstadoVazio titulo="Lista vazia" descricao="Adicione o primeiro item acima." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {grupos.map((grupo) => (
              <div key={grupo.categoria}>
                <div className="mb-1.5 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{grupo.categoria}</h3>
                  {grupo.corredor ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Corredor {grupo.corredor}
                    </span>
                  ) : mercado ? (
                    <span className="text-xs text-slate-400">corredor não mapeado</span>
                  ) : null}
                </div>
                <Card className="divide-y divide-slate-100 p-0! dark:divide-slate-800">
                  {grupo.itens.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.comprado}
                        onChange={() => alternarComprado(item.id!, item.comprado)}
                        className="h-4 w-4 shrink-0 accent-emerald-600"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.comprado
                            ? 'text-slate-400 line-through dark:text-slate-600'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.descricao}
                      </span>
                      <button
                        onClick={() => removerItem(item.id!)}
                        className="text-rose-400 hover:text-rose-600"
                        aria-label="Remover item"
                      >
                        ✕
                      </button>
                    </label>
                  ))}
                </Card>
              </div>
            ))}
          </div>

          {itens.some((i) => i.comprado) && (
            <button
              onClick={limparComprados}
              className="rounded-lg border border-slate-300 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400"
            >
              Limpar itens já comprados
            </button>
          )}
        </>
      )}
    </div>
  )
}
