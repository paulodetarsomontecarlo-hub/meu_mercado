import { NavLink, Outlet } from 'react-router-dom'

const ABAS = [
  { to: '/', label: 'Dashboard', icon: '📊', fim: true },
  { to: '/adicionar', label: 'Adicionar', icon: '➕' },
  { to: '/lista', label: 'Lista', icon: '📝' },
  { to: '/historico', label: 'Histórico', icon: '🧾' },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Meu Mercado</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-xl border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        {ABAS.map((aba) => (
          <NavLink
            key={aba.to}
            to={aba.to}
            end={aba.fim}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <span className="text-lg leading-none">{aba.icon}</span>
            {aba.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
