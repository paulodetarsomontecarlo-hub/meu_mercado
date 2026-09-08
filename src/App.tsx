import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './screens/Dashboard'
import { AdicionarNota } from './screens/AdicionarNota'
import { Historico } from './screens/Historico'
import { DetalheNota } from './screens/DetalheNota'
import { carregarSeedSeVazio } from './seed/seedLoader'

export default function App() {
  const [seedPronta, setSeedPronta] = useState(false)

  useEffect(() => {
    carregarSeedSeVazio().finally(() => setSeedPronta(true))
  }, [])

  if (!seedPronta) {
    return <div className="flex h-dvh items-center justify-center text-slate-400">Carregando…</div>
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="adicionar" element={<AdicionarNota />} />
          <Route path="historico" element={<Historico />} />
          <Route path="nota/:id" element={<DetalheNota />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
