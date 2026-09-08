import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}

export function CardTitulo({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{children}</h2>
}

export function StatTile({
  rotulo,
  valor,
  destaque,
  sub,
}: {
  rotulo: string
  valor: string
  destaque?: boolean
  sub?: string
}) {
  return (
    <Card>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{rotulo}</p>
      <p
        className={`mt-1 font-semibold tabular-nums ${destaque ? 'text-2xl text-emerald-600 dark:text-emerald-400' : 'text-xl text-slate-900 dark:text-slate-100'}`}
      >
        {valor}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </Card>
  )
}

const CATEGORIA_STYLE: Record<string, string> = {
  Hortifruti: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  'Carnes e frios': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  Mercearia: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  Bebidas: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Doces e snacks': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
  Higiene: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
  Limpeza: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  Utensílios: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  Pet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
  Outros: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export function BadgeCategoria({ categoria }: { categoria: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIA_STYLE[categoria] ?? CATEGORIA_STYLE.Outros}`}
    >
      {categoria}
    </span>
  )
}

export function EstadoVazio({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
      <p className="font-medium text-slate-600 dark:text-slate-300">{titulo}</p>
      {descricao && <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{descricao}</p>}
    </div>
  )
}
