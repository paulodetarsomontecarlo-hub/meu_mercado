import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { decomporChave, formatarCNPJ, limparChave } from '../parsers/chaveParser'
import { construirNotaEItens, salvarNota } from '../lib/receiptBuilder'
import { parseValorBR } from '../lib/money'
import { isoDeDataHoraSaoPaulo } from '../lib/date'
import { EditorItensRaw } from '../components/EditorItensRaw'
import { Card, CardTitulo } from '../components/ui'
import type { OrigemNota, RawReceipt } from '../types'

type Origem = 'foto' | 'pdf' | 'qr' | 'chave'

const ABAS: { id: Origem; rotulo: string; icone: string }[] = [
  { id: 'pdf', rotulo: 'PDF', icone: '📄' },
  { id: 'foto', rotulo: 'Foto', icone: '📷' },
  { id: 'qr', rotulo: 'QR code', icone: '🔳' },
  { id: 'chave', rotulo: 'Chave', icone: '🔑' },
]

function receiptVazio(origem: OrigemNota): RawReceipt {
  return {
    origem,
    chave_acesso: null,
    cnpj_emitente: '',
    nome_loja: '',
    endereco: null,
    data_hora: new Date().toISOString(),
    numero: null,
    serie: null,
    valor_bruto_centavos: null,
    desconto_total_centavos: null,
    valor_pago_centavos: null,
    tributos_centavos: null,
    forma_pagamento: [],
    itens: [],
    descontos: [],
  }
}

async function arquivoParaImageData(arquivo: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(arquivo)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function AdicionarNota() {
  const navigate = useNavigate()
  const [aba, setAba] = useState<Origem>('pdf')
  const [raw, setRaw] = useState<RawReceipt | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [chaveDigitada, setChaveDigitada] = useState('')

  async function handlePdf(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setCarregando(true)
    setErro(null)
    try {
      const buffer = await arquivo.arrayBuffer()
      const { parsearPDFNFCe } = await import('../parsers/pdfParser')
      setRaw(await parsearPDFNFCe(buffer))
    } catch {
      setErro('Não foi possível ler esse PDF. Confira se é a Consulta Resumida da NFC-e.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setCarregando(true)
    setErro(null)
    setProgresso(0)
    try {
      const { parsearFotoCupom } = await import('../parsers/ocrParser')
      setRaw(await parsearFotoCupom(arquivo, setProgresso))
    } catch {
      setErro('Não foi possível reconhecer o texto da foto. Tente uma foto mais nítida.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleQr(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setCarregando(true)
    setErro(null)
    try {
      const { decodificarQRDeImagem, extrairChaveDeConteudoQR } = await import('../parsers/qrParser')
      const imageData = await arquivoParaImageData(arquivo)
      const conteudo = decodificarQRDeImagem(imageData)
      if (!conteudo) {
        setErro('QR code não encontrado na imagem. Tente uma foto mais próxima e nítida do código.')
        return
      }
      const decomposta = extrairChaveDeConteudoQR(conteudo)
      if (!decomposta) {
        setErro('Não foi possível extrair a chave de acesso desse QR code.')
        return
      }
      const base = receiptVazio('qr')
      setRaw({
        ...base,
        chave_acesso: decomposta.chave,
        cnpj_emitente: decomposta.cnpj_emitente,
      })
    } catch {
      setErro('Não foi possível ler essa imagem.')
    } finally {
      setCarregando(false)
    }
  }

  function handleChave() {
    const chave = limparChave(chaveDigitada)
    const decomposta = decomporChave(chave)
    if (chave.length !== 44) {
      setErro('A chave de acesso precisa ter 44 dígitos.')
      return
    }
    setErro(null)
    const base = receiptVazio('manual')
    setRaw({ ...base, chave_acesso: decomposta.chave, cnpj_emitente: decomposta.cnpj_emitente })
  }

  async function salvar() {
    if (!raw) return
    setCarregando(true)
    try {
      const { nota, itens } = await construirNotaEItens(raw)
      const id = await salvarNota(nota, itens)
      navigate(`/nota/${id}`)
    } finally {
      setCarregando(false)
    }
  }

  if (raw) {
    return (
      <RevisaoNota
        raw={raw}
        onChange={setRaw}
        onCancelar={() => setRaw(null)}
        onSalvar={salvar}
        salvando={carregando}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-1.5">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setAba(a.id)
              setErro(null)
            }}
            className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium ${
              aba === a.id
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'border-slate-200 text-slate-500 dark:border-slate-800'
            }`}
          >
            <span className="text-lg">{a.icone}</span>
            {a.rotulo}
          </button>
        ))}
      </div>

      <Card>
        {aba === 'pdf' && (
          <>
            <CardTitulo>PDF da Consulta NFC-e</CardTitulo>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Fonte mais confiável — importe o PDF baixado da consulta no site da Fazenda.
            </p>
            <input type="file" accept="application/pdf" onChange={handlePdf} className="text-sm" />
          </>
        )}
        {aba === 'foto' && (
          <>
            <CardTitulo>Foto do cupom</CardTitulo>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              OCR roda offline no celular. Revise os itens depois — é o caminho menos confiável dos quatro.
            </p>
            <input type="file" accept="image/*" capture="environment" onChange={handleFoto} className="text-sm" />
            {carregando && progresso > 0 && (
              <p className="mt-2 text-xs text-slate-400">Reconhecendo texto… {Math.round(progresso * 100)}%</p>
            )}
          </>
        )}
        {aba === 'qr' && (
          <>
            <CardTitulo>QR code do cupom</CardTitulo>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Extrai a chave de acesso e o CNPJ do emitente. O QR não traz os itens — você os lança manualmente na
              revisão a seguir.
            </p>
            <input type="file" accept="image/*" capture="environment" onChange={handleQr} className="text-sm" />
          </>
        )}
        {aba === 'chave' && (
          <>
            <CardTitulo>Chave de acesso</CardTitulo>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Digite os 44 dígitos. Assim como no QR, os itens são lançados manualmente depois.
            </p>
            <input
              value={chaveDigitada}
              onChange={(e) => setChaveDigitada(e.target.value)}
              placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 00"
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <button onClick={handleChave} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
              Decompor chave
            </button>
          </>
        )}

        {erro && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{erro}</p>}
        {carregando && aba !== 'foto' && <p className="mt-3 text-sm text-slate-400">Processando…</p>}
      </Card>
    </div>
  )
}

function RevisaoNota({
  raw,
  onChange,
  onCancelar,
  onSalvar,
  salvando,
}: {
  raw: RawReceipt
  onChange: (raw: RawReceipt) => void
  onCancelar: () => void
  onSalvar: () => void
  salvando: boolean
}) {
  const [data, hora] = raw.data_hora.slice(0, 16).split('T')

  const decomposta = raw.chave_acesso ? decomporChave(raw.chave_acesso) : null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Revisar antes de salvar</h2>

      <Card>
        <CardTitulo>Dados da nota</CardTitulo>
        {decomposta?.chave && (
          <p className="mb-2 text-xs text-slate-500">
            Chave: {decomposta.chave} · CNPJ {formatarCNPJ(decomposta.cnpj_emitente)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Nome da loja"
            value={raw.nome_loja}
            onChange={(e) => onChange({ ...raw, nome_loja: e.target.value })}
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="date"
            value={data}
            onChange={(e) => onChange({ ...raw, data_hora: isoDeDataHoraSaoPaulo(e.target.value, hora || '12:00') })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => onChange({ ...raw, data_hora: isoDeDataHoraSaoPaulo(data, e.target.value) })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <CampoValor
            rotulo="Valor bruto"
            valor={raw.valor_bruto_centavos}
            onChange={(v) => onChange({ ...raw, valor_bruto_centavos: v })}
          />
          <CampoValor
            rotulo="Desconto"
            valor={raw.desconto_total_centavos}
            onChange={(v) => onChange({ ...raw, desconto_total_centavos: v })}
          />
          <CampoValor
            rotulo="Valor pago"
            valor={raw.valor_pago_centavos}
            onChange={(v) => onChange({ ...raw, valor_pago_centavos: v })}
          />
          <CampoValor
            rotulo="Tributos totais"
            valor={raw.tributos_centavos}
            onChange={(v) => onChange({ ...raw, tributos_centavos: v })}
          />
        </div>
      </Card>

      <Card>
        <CardTitulo>Itens ({raw.itens.length})</CardTitulo>
        <EditorItensRaw itens={raw.itens} onChange={(itens) => onChange({ ...raw, itens })} />
      </Card>

      <div className="flex gap-2">
        <button
          onClick={onCancelar}
          className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium dark:border-slate-700"
        >
          Cancelar
        </button>
        <button
          onClick={onSalvar}
          disabled={salvando || !raw.nome_loja || raw.itens.length === 0}
          className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {salvando ? 'Salvando…' : 'Salvar nota'}
        </button>
      </div>
    </div>
  )
}

function CampoValor({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string
  valor: number | null
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
      {rotulo}
      <input
        inputMode="decimal"
        placeholder="0,00"
        defaultValue={valor !== null ? (valor / 100).toFixed(2).replace('.', ',') : ''}
        onBlur={(e) => onChange(parseValorBR(e.target.value))}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  )
}
