// Todos os valores monetários "de verdade" (o que apareceu impresso na nota) são
// inteiros em centavos. Os campos derivados preco_por_kg/preco_por_l são uma razão
// (centavos por kg/l) e por natureza não são inteiros — são calculados sob demanda
// para exibição/ranqueamento, nunca usados para somar dinheiro.

export const CATEGORIAS = [
  'Hortifruti',
  'Carnes e frios',
  'Mercearia',
  'Bebidas',
  'Doces e snacks',
  'Higiene',
  'Limpeza',
  'Utensílios',
  'Pet',
  'Outros',
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export type Unidade = 'Un' | 'Kg' | 'Pc' | 'L'

export type OrigemNota = 'foto' | 'pdf' | 'qr' | 'manual'

export interface FormaPagamento {
  tipo: string
  valor_centavos: number
}

export interface Nota {
  id?: number
  chave_acesso: string | null
  cnpj_emitente: string
  nome_loja: string
  endereco: string | null
  data_hora: string // ISO 8601, instante real; exibir sempre convertido para America/Sao_Paulo
  numero: string | null
  serie: string | null
  valor_bruto_centavos: number
  desconto_total_centavos: number
  valor_pago_centavos: number
  tributos_centavos: number
  forma_pagamento: FormaPagamento[]
  origem: OrigemNota
  criado_em: string
}

export interface Item {
  id?: number
  nota_id: number
  codigo_produto: string
  descricao_original: string
  descricao_normalizada: string
  quantidade: number
  unidade: Unidade
  valor_unitario_centavos: number
  valor_total_centavos: number
  desconto_centavos: number
  categoria: Categoria
  peso_g: number | null
  volume_ml: number | null
  categoria_corrigida_manualmente?: boolean
  descricao_corrigida_manualmente?: boolean
}

export interface HistoricoPreco {
  nota_id: number
  loja: string
  data_hora: string
  preco_unitario_centavos: number
  // preço normalizado por unidade padrão (kg ou l), em centavos, quando aplicável
  preco_normalizado_centavos: number | null
  unidade_normalizada: 'kg' | 'l' | null
}

export interface Produto {
  codigo: string
  descricao_normalizada: string
  categoria: Categoria
  peso_g: number | null
  volume_ml: number | null
  historico_precos: HistoricoPreco[]
}

export interface RawItemLine {
  codigo_produto: string
  descricao: string
  quantidade: number
  unidade: Unidade
  valor_unitario_centavos: number
  valor_total_centavos: number
}

export interface RawDiscountLine {
  refIndex: number // índice (1-based) do item na nota impressa, conforme "Desconto no item N"
  valor_centavos: number
}

export interface RawReceipt {
  origem: OrigemNota
  chave_acesso: string | null
  cnpj_emitente: string
  nome_loja: string
  endereco: string | null
  data_hora: string
  numero: string | null
  serie: string | null
  valor_bruto_centavos: number | null
  desconto_total_centavos: number | null
  valor_pago_centavos: number | null
  tributos_centavos: number | null
  forma_pagamento: FormaPagamento[]
  itens: RawItemLine[]
  descontos: RawDiscountLine[]
}

export interface MapeamentoCorredor {
  categoria: Categoria
  corredor: string
}

export interface Mercado {
  id?: number
  nome: string
  corredores: MapeamentoCorredor[]
}

export interface ItemListaCompras {
  id?: number
  descricao: string
  categoria: Categoria
  comprado: boolean
  criado_em: string
}

export interface ChaveDecomposta {
  chave: string
  valida: boolean
  uf_codigo: string
  uf_nome: string | null
  competencia: string // AAMM
  ano: number
  mes: number
  cnpj_emitente: string
  modelo: string
  serie: string
  numero: string
  tipoEmissao: string
  codigoNumerico: string
  digitoVerificador: string
}
