// Dinheiro é sempre um inteiro de centavos. Nunca guarde/some reais como float.

export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100)
}

export function centavosParaReais(centavos: number): number {
  return centavos / 100
}

export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Parse de string em formato brasileiro "1.234,56" -> 123456 centavos.
export function parseValorBR(texto: string): number {
  const limpo = texto
    .trim()
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '') // remove separador de milhar
    .replace(',', '.')
  const valor = Number.parseFloat(limpo)
  if (Number.isNaN(valor)) return 0
  return Math.round(valor * 100)
}

export function somarCentavos(...valores: number[]): number {
  return valores.reduce((acc, v) => acc + v, 0)
}

// Preço por unidade padrão (kg ou L), em centavos, a partir de um valor total em
// centavos e uma quantidade em gramas/mililitros. É uma razão (pode ser fracionária),
// não um valor a ser somado como dinheiro — só para exibição/ranking/comparação.
export function precoPorUnidadePadrao(
  valorTotalCentavos: number,
  quantidadeBase: number, // em gramas ou mililitros
): number | null {
  if (!quantidadeBase || quantidadeBase <= 0) return null
  return (valorTotalCentavos / quantidadeBase) * 1000
}
