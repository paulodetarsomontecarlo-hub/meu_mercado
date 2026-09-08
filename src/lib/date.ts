export const TIMEZONE = 'America/Sao_Paulo'

export function formatarDataBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: TIMEZONE })
}

export function formatarHoraBR(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatarDataHoraBR(iso: string): string {
  return `${formatarDataBR(iso)} ${formatarHoraBR(iso)}`
}

export function chaveMesAno(iso: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(iso))
  const ano = partes.find((p) => p.type === 'year')?.value ?? '0000'
  const mes = partes.find((p) => p.type === 'month')?.value ?? '00'
  return `${ano}-${mes}`
}

export function nomeMesAno(chave: string): string {
  const [ano, mes] = chave.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, 1))
  const nome = data.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)}/${ano}`
}

// Constrói um instante ISO a partir de data (AAAA-MM-DD) e hora (HH:mm) já
// entendidos como horário de São Paulo, sem depender de bibliotecas externas de tz.
export function isoDeDataHoraSaoPaulo(dataISO: string, horaHHmm: string): string {
  const offset = offsetSaoPauloEm(dataISO)
  return `${dataISO}T${horaHHmm}:00${offset}`
}

function offsetSaoPauloEm(_dataISO: string): string {
  // Brasil não usa horário de verão desde 2019; São Paulo é UTC-03:00 o ano todo.
  return '-03:00'
}
