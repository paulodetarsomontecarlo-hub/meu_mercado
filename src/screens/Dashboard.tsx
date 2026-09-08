import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useItensComNota, useNotas } from '../lib/useDados'
import {
  cargaTributariaConsolidada,
  detectarFormatoCaro,
  evolucaoMensalPorCategoria,
  gastoPorCategoria,
  gastoPorLoja,
  rankingMaisCarosPorUnidade,
} from '../lib/analytics'
import { formatarBRL } from '../lib/money'
import { nomeMesAno } from '../lib/date'
import { Card, CardTitulo, EstadoVazio, StatTile } from '../components/ui'
import { GraficoBarraHorizontal, GraficoEmpilhadoMensal } from '../components/charts'

export function Dashboard() {
  const notas = useNotas()
  const itensComNota = useItensComNota()
  const itens = useMemo(() => itensComNota.map((x) => x.item), [itensComNota])

  const carga = useMemo(() => cargaTributariaConsolidada(notas), [notas])
  const porCategoria = useMemo(() => gastoPorCategoria(itens), [itens])
  const porLoja = useMemo(() => gastoPorLoja(itensComNota), [itensComNota])
  const alertas = useMemo(() => detectarFormatoCaro(itens), [itens])
  const ranking = useMemo(() => rankingMaisCarosPorUnidade(itensComNota, 8), [itensComNota])

  const evolucao = useMemo(() => {
    const linhas = evolucaoMensalPorCategoria(itensComNota)
    const categoriasOrdenadas = Array.from(
      linhas
        .reduce((mapa, l) => mapa.set(l.categoria, (mapa.get(l.categoria) ?? 0) + l.total_centavos), new Map<string, number>())
        .entries(),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)

    const top = categoriasOrdenadas.slice(0, 5)
    const temOutras = categoriasOrdenadas.length > 5

    const porMes = new Map<string, Record<string, number>>()
    for (const l of linhas) {
      const chave = top.includes(l.categoria) ? l.categoria : 'Outras'
      const linhaMes = porMes.get(l.mesAno) ?? {}
      linhaMes[chave] = (linhaMes[chave] ?? 0) + l.total_centavos
      porMes.set(l.mesAno, linhaMes)
    }

    const dados = Array.from(porMes.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mesAno, valores]) => ({ mesAno: nomeMesAno(mesAno), ...valores }))

    return { dados, categorias: temOutras ? [...top, 'Outras'] : top }
  }, [itensComNota])

  if (notas.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma nota lançada ainda"
        descricao="Adicione sua primeira nota fiscal para ver as análises aqui."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile rotulo="Total pago" valor={formatarBRL(carga.valor_pago_centavos)} destaque />
        <StatTile
          rotulo="Tributos"
          valor={formatarBRL(carga.tributos_centavos)}
          sub={`${carga.percentual.toFixed(1)}% do valor pago`}
        />
      </div>

      <Card>
        <CardTitulo>Gasto por categoria</CardTitulo>
        <GraficoBarraHorizontal
          dados={porCategoria.map((c) => ({ categoria: c.categoria, total: c.total_centavos }))}
          chaveRotulo="categoria"
          chaveValor="total"
        />
      </Card>

      <Card>
        <CardTitulo>Gasto por loja</CardTitulo>
        <GraficoBarraHorizontal
          dados={porLoja.map((l) => ({ loja: l.loja, total: l.total_pago_centavos }))}
          chaveRotulo="loja"
          chaveValor="total"
        />
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          {porLoja.map((l) => (
            <div key={l.loja} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{l.loja}</span>
              <span className="tabular-nums">
                {l.quantidade_itens} itens · ticket médio {formatarBRL(l.ticket_medio_centavos)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {alertas.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardTitulo>⚠️ Formato caro detectado</CardTitulo>
          <ul className="space-y-2">
            {alertas.map((a, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{a.itemCaro.descricao_normalizada}</strong> saiu a{' '}
                <strong className="text-amber-700 dark:text-amber-400">
                  {formatarBRL(a.precoCaroCentavos)}/{a.unidade}
                </strong>{' '}
                — {a.razao.toFixed(1)}x mais caro por {a.unidade} do que{' '}
                <strong>{a.itemReferencia.descricao_normalizada}</strong> (
                {formatarBRL(a.precoReferenciaCentavos)}/{a.unidade})
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitulo>Ranking — mais caros por kg/L</CardTitulo>
        <ol className="space-y-1.5">
          {ranking.map((r, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {i + 1}. {r.item.descricao_normalizada}{' '}
                <span className="text-xs text-slate-400">· {r.loja}</span>
              </span>
              <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                {formatarBRL(r.preco_por_kg_ou_l)}/{r.unidade}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      {evolucao.dados.length > 0 && (
        <Card>
          <CardTitulo>Evolução mensal por categoria</CardTitulo>
          <GraficoEmpilhadoMensal dados={evolucao.dados} categorias={evolucao.categorias} />
        </Card>
      )}

      <Link
        to="/historico"
        className="text-center text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        Ver todas as notas →
      </Link>
    </div>
  )
}
