import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatarBRL } from '../lib/money'
import { CORES, COR_SEQUENCIAL, PALETA_CATEGORICA } from '../lib/palette'

function TooltipMoeda({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-slate-600 dark:text-slate-300">
          <span style={{ color: p.color }}>●</span> {p.name}: {formatarBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

export function GraficoBarraHorizontal({
  dados,
  chaveRotulo,
  chaveValor,
}: {
  dados: { [k: string]: unknown }[]
  chaveRotulo: string
  chaveValor: string
}) {
  const [mostrarTabela, setMostrarTabela] = useState(false)
  const altura = Math.max(120, dados.length * 36)
  const maiorValor = Math.max(1, ...dados.map((d) => Number(d[chaveValor]) || 0))
  const ticksEixoX = [0, maiorValor / 2, maiorValor]

  return (
    <div>
      <ResponsiveContainer width="100%" height={altura}>
        <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={CORES.grade} />
          <XAxis
            type="number"
            domain={[0, maiorValor]}
            ticks={ticksEixoX}
            tickFormatter={(v) => formatarBRL(v)}
            tick={{ fill: CORES.tintaMuted, fontSize: 11 }}
            axisLine={{ stroke: CORES.linhaBase }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey={chaveRotulo}
            width={110}
            tick={{ fill: CORES.tintaSecundaria, fontSize: 12 }}
            axisLine={{ stroke: CORES.linhaBase }}
            tickLine={false}
          />
          <Tooltip content={<TooltipMoeda />} cursor={{ fill: 'rgba(42,120,214,0.08)' }} />
          <Bar dataKey={chaveValor} fill={COR_SEQUENCIAL} radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
      <BotaoTabela
        aberta={mostrarTabela}
        onToggle={() => setMostrarTabela((v) => !v)}
        dados={dados}
        colunas={[chaveRotulo, chaveValor]}
      />
    </div>
  )
}

export function GraficoEmpilhadoMensal({
  dados,
  categorias,
}: {
  dados: { mesAno: string; [categoria: string]: number | string }[]
  categorias: string[]
}) {
  const [mostrarTabela, setMostrarTabela] = useState(false)

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={dados} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={CORES.grade} />
          <XAxis dataKey="mesAno" tick={{ fill: CORES.tintaMuted, fontSize: 11 }} axisLine={{ stroke: CORES.linhaBase }} tickLine={false} />
          <YAxis tickFormatter={(v) => formatarBRL(v)} tick={{ fill: CORES.tintaMuted, fontSize: 11 }} axisLine={{ stroke: CORES.linhaBase }} tickLine={false} width={72} />
          <Tooltip content={<TooltipMoeda />} cursor={{ fill: 'rgba(11,11,11,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {categorias.map((categoria, i) => (
            <Bar
              key={categoria}
              dataKey={categoria}
              stackId="mes"
              fill={PALETA_CATEGORICA[i % PALETA_CATEGORICA.length]}
              radius={i === categorias.length - 1 ? [4, 4, 0, 0] : undefined}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <BotaoTabela aberta={mostrarTabela} onToggle={() => setMostrarTabela((v) => !v)} dados={dados} colunas={['mesAno', ...categorias]} />
    </div>
  )
}

function BotaoTabela({
  aberta,
  onToggle,
  dados,
  colunas,
}: {
  aberta: boolean
  onToggle: () => void
  dados: { [k: string]: unknown }[]
  colunas: string[]
}) {
  return (
    <div className="mt-2">
      <button
        onClick={onToggle}
        className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        {aberta ? 'Ocultar tabela' : 'Ver dados em tabela'}
      </button>
      {aberta && (
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {colunas.map((c) => (
                  <th key={c} className="px-2 py-1.5 font-medium text-slate-600 dark:text-slate-300">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.map((linha, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  {colunas.map((c) => (
                    <td key={c} className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                      {typeof linha[c] === 'number' ? formatarBRL(linha[c] as number) : String(linha[c] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
