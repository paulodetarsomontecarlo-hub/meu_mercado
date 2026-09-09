import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/schema'
import { useMercados } from '../lib/useDados'
import { CATEGORIAS } from '../types'
import type { Mercado } from '../types'
import { Card, CardTitulo, EstadoVazio } from '../components/ui'

export function Mercados() {
  const mercados = useMercados()
  const [nomeNovo, setNomeNovo] = useState('')
  const [abertoId, setAbertoId] = useState<number | null>(null)

  async function criarMercado() {
    const nome = nomeNovo.trim()
    if (!nome) return
    const id = (await db.mercados.add({ nome, corredores: [] } as Mercado)) as number
    setNomeNovo('')
    setAbertoId(id)
  }

  async function excluirMercado(id: number) {
    await db.mercados.delete(id)
    if (abertoId === id) setAbertoId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/lista" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
        ← Voltar à lista de compras
      </Link>

      <Card>
        <CardTitulo>Mercados e corredores</CardTitulo>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Cadastre um mercado e diga em qual corredor fica cada categoria. A lista de
          compras usa isso pra agrupar e ordenar os itens pelo caminho que você anda no
          mercado.
        </p>
        <div className="flex gap-2">
          <input
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criarMercado()}
            placeholder="Nome do mercado (ex: Assaí Atacadista)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            onClick={criarMercado}
            disabled={!nomeNovo.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </Card>

      {mercados.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum mercado cadastrado"
          descricao="Adicione um mercado acima pra começar a mapear os corredores."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {mercados.map((mercado) => (
            <Card key={mercado.id}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setAbertoId(abertoId === mercado.id ? null : mercado.id!)}
                  className="flex-1 text-left font-medium text-slate-900 dark:text-slate-100"
                >
                  {mercado.nome}
                </button>
                <button
                  onClick={() => excluirMercado(mercado.id!)}
                  className="text-sm text-rose-500 hover:text-rose-700"
                >
                  Excluir
                </button>
              </div>

              {abertoId === mercado.id && <EditorCorredores mercado={mercado} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function EditorCorredores({ mercado }: { mercado: Mercado }) {
  async function salvarCorredor(categoria: (typeof CATEGORIAS)[number], corredor: string) {
    const outros = mercado.corredores.filter((c) => c.categoria !== categoria)
    const novos = corredor.trim() ? [...outros, { categoria, corredor: corredor.trim() }] : outros
    await db.mercados.update(mercado.id!, { corredores: novos })
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      {CATEGORIAS.map((categoria) => {
        const atual = mercado.corredores.find((c) => c.categoria === categoria)?.corredor ?? ''
        return (
          <label key={categoria} className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
            {categoria}
            <input
              defaultValue={atual}
              onBlur={(e) => salvarCorredor(categoria, e.target.value)}
              placeholder="corredor"
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        )
      })}
    </div>
  )
}
