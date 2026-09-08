import { gerarItensFiller } from './geradorFiller'
import type { Item, Nota } from '../types'

// Dia de compras real usado como fixture: 07/09/2026, quatro notas, quatro lojas.
// Os agregados (bruto/desconto/pago/tributos) e os itens "especiais" abaixo batem
// exatamente com os casos de teste do briefing; os demais itens de cada nota são
// gerados deterministicamente (mesma seed sempre) só para preencher a contagem real
// de itens de cada nota, já que o texto completo das notas não foi fornecido.

type ItemSemNota = Omit<Item, 'id' | 'nota_id'>
type ItemEntrada = Omit<ItemSemNota, 'desconto_centavos'> & { desconto_centavos?: number }

function item(parcial: ItemEntrada): ItemSemNota {
  return { desconto_centavos: 0, ...parcial }
}

// ---------------------------------------------------------------------------
// Nota 1 — Assaí Atacadista, 07/09/2026 12:06, 95 itens
// ---------------------------------------------------------------------------

const assaiEspeciais: ItemSemNota[] = [
  item({
    codigo_produto: '7891100000101',
    descricao_original: 'MUSS PRESID FAT 300G',
    descricao_normalizada: 'Mussarela Président fatiada 300g',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 1890,
    valor_total_centavos: 1890,
    categoria: 'Carnes e frios',
    peso_g: 300,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891100000102',
    descricao_original: 'L T CAL D SADIA FC',
    descricao_normalizada: 'Linguiça Toscana Sadia',
    quantidade: 0.68,
    unidade: 'Kg',
    valor_unitario_centavos: 2390,
    valor_total_centavos: 1625,
    categoria: 'Carnes e frios',
    peso_g: 680,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891100000103',
    descricao_original: 'CD COLG T 90G AD FR',
    descricao_normalizada: 'Creme dental Colgate 90g',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 749,
    valor_total_centavos: 749,
    categoria: 'Higiene',
    peso_g: 90,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891100000104',
    descricao_original: 'PH PERS V L24P22 NEU',
    descricao_normalizada: 'Papel higiênico Personal, leve 24 pague 22',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 5490,
    valor_total_centavos: 5490,
    desconto_centavos: 1084,
    categoria: 'Higiene',
    peso_g: null,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891100000105',
    descricao_original: 'MOLHO TOM FUGINI 300G',
    descricao_normalizada: 'Molho de Tomate Fugini 300g',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 199,
    valor_total_centavos: 199,
    categoria: 'Mercearia',
    peso_g: 300,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891100000106',
    descricao_original: 'COCA COLA PET 200ML',
    descricao_normalizada: 'Coca-Cola 200ml',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 225,
    valor_total_centavos: 225,
    categoria: 'Bebidas',
    peso_g: null,
    volume_ml: 200,
  }),
  item({
    codigo_produto: '7891100000107',
    descricao_original: 'COCA COLA PET 2L',
    descricao_normalizada: 'Coca-Cola 2L',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 899,
    valor_total_centavos: 899,
    categoria: 'Bebidas',
    peso_g: null,
    volume_ml: 2000,
  }),
  item({
    codigo_produto: '7891100000108',
    descricao_original: 'AGUA MIN CRYSTAL 5L',
    descricao_normalizada: 'Água Mineral Crystal 5L',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 1190,
    valor_total_centavos: 1190,
    categoria: 'Bebidas',
    peso_g: null,
    volume_ml: 5000,
  }),
  item({
    codigo_produto: '7891100000109',
    descricao_original: 'AGUA MIN CRYSTAL 1,5L PET',
    descricao_normalizada: 'Água Mineral Crystal 1,5L',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 279,
    valor_total_centavos: 279,
    categoria: 'Bebidas',
    peso_g: null,
    volume_ml: 1500,
  }),
]

const assaiFiller = gerarItensFiller(86, 58241, 7891100001000, 20260907).map((f) =>
  item({
    codigo_produto: f.codigo_produto,
    descricao_original: f.descricao.toUpperCase(),
    descricao_normalizada: f.descricao,
    quantidade: f.quantidade,
    unidade: f.unidade,
    valor_unitario_centavos: f.valor_unitario_centavos,
    valor_total_centavos: f.valor_total_centavos,
    categoria: f.categoria,
    peso_g: f.peso_g,
    volume_ml: f.volume_ml,
  }),
)

const notaAssai: Omit<Nota, 'id'> = {
  chave_acesso: '35260906057223056800651001000012345610001236',
  cnpj_emitente: '06057223056800',
  nome_loja: 'Assaí Atacadista',
  endereco: 'Av. Philadelpho Gouvêa Netto, São José do Rio Preto - SP',
  data_hora: '2026-09-07T12:06:00-03:00',
  numero: '123456',
  serie: '1',
  valor_bruto_centavos: 70787,
  desconto_total_centavos: 1084,
  valor_pago_centavos: 69703,
  tributos_centavos: 7933,
  forma_pagamento: [{ tipo: 'Cartão de Débito', valor_centavos: 69703 }],
  origem: 'pdf',
  criado_em: '2026-09-07T12:10:00-03:00',
}

// ---------------------------------------------------------------------------
// Nota 2 — Muffato, 07/09/2026 12:55, 22 itens
// ---------------------------------------------------------------------------

const muffatoEspeciais: ItemSemNota[] = [
  item({
    codigo_produto: '7891200000101',
    descricao_original: 'MOLHO TOM COPPOLA 135G TRAD',
    descricao_normalizada: 'Molho de Tomate Coppola Tradicional 135g',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 1999,
    valor_total_centavos: 1999,
    categoria: 'Mercearia',
    peso_g: 135,
    volume_ml: null,
  }),
]

const muffatoFiller = gerarItensFiller(21, 34914, 7891200001000, 20260908).map((f) =>
  item({
    codigo_produto: f.codigo_produto,
    descricao_original: f.descricao.toUpperCase(),
    descricao_normalizada: f.descricao,
    quantidade: f.quantidade,
    unidade: f.unidade,
    valor_unitario_centavos: f.valor_unitario_centavos,
    valor_total_centavos: f.valor_total_centavos,
    categoria: f.categoria,
    peso_g: f.peso_g,
    volume_ml: f.volume_ml,
  }),
)

const notaMuffato: Omit<Nota, 'id'> = {
  chave_acesso: '35260907643043800071840055001000512340000517',
  cnpj_emitente: '76430438007184',
  nome_loja: 'Muffato',
  endereco: 'São José do Rio Preto - SP',
  data_hora: '2026-09-07T12:55:00-03:00',
  numero: '5123',
  serie: '5',
  valor_bruto_centavos: 36913,
  desconto_total_centavos: 0,
  valor_pago_centavos: 36913,
  tributos_centavos: 10935,
  forma_pagamento: [{ tipo: 'Pix', valor_centavos: 36913 }],
  origem: 'pdf',
  criado_em: '2026-09-07T13:00:00-03:00',
}

// ---------------------------------------------------------------------------
// Nota 3 — Oba Hortifruti (Fartura), 07/09/2026 13:40, 8 itens
// ---------------------------------------------------------------------------

const obaItens: ItemSemNota[] = [
  item({
    codigo_produto: '7891300000101',
    descricao_original: 'TOMATE KG',
    descricao_normalizada: 'Tomate',
    quantidade: 2.4006,
    unidade: 'Kg',
    valor_unitario_centavos: 699,
    valor_total_centavos: 1678,
    categoria: 'Hortifruti',
    peso_g: 2401,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000102',
    descricao_original: 'BANANA PRATA KG',
    descricao_normalizada: 'Banana Prata',
    quantidade: 3.1002,
    unidade: 'Kg',
    valor_unitario_centavos: 549,
    valor_total_centavos: 1702,
    categoria: 'Hortifruti',
    peso_g: 3100,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000103',
    descricao_original: 'ALFACE CRESPA UN',
    descricao_normalizada: 'Alface Crespa',
    quantidade: 3,
    unidade: 'Un',
    valor_unitario_centavos: 349,
    valor_total_centavos: 1047,
    categoria: 'Hortifruti',
    peso_g: null,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000104',
    descricao_original: 'CENOURA KG',
    descricao_normalizada: 'Cenoura',
    quantidade: 1.7996,
    unidade: 'Kg',
    valor_unitario_centavos: 499,
    valor_total_centavos: 898,
    categoria: 'Hortifruti',
    peso_g: 1800,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000105',
    descricao_original: 'BATATA KG',
    descricao_normalizada: 'Batata',
    quantidade: 4,
    unidade: 'Kg',
    valor_unitario_centavos: 599,
    valor_total_centavos: 2396,
    categoria: 'Hortifruti',
    peso_g: 4000,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000106',
    descricao_original: 'CEBOLA KG',
    descricao_normalizada: 'Cebola',
    quantidade: 2.5008,
    unidade: 'Kg',
    valor_unitario_centavos: 649,
    valor_total_centavos: 1623,
    categoria: 'Hortifruti',
    peso_g: 2501,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000107',
    descricao_original: 'LARANJA KG',
    descricao_normalizada: 'Laranja',
    quantidade: 3.5991,
    unidade: 'Kg',
    valor_unitario_centavos: 429,
    valor_total_centavos: 1544,
    categoria: 'Hortifruti',
    peso_g: 3599,
    volume_ml: null,
  }),
  item({
    codigo_produto: '7891300000108',
    descricao_original: 'MACA GALA KG',
    descricao_normalizada: 'Maçã Gala',
    quantidade: 4.7447,
    unidade: 'Kg',
    valor_unitario_centavos: 999,
    valor_total_centavos: 4740,
    desconto_centavos: 719,
    categoria: 'Hortifruti',
    peso_g: 4745,
    volume_ml: null,
  }),
]

const notaOba: Omit<Nota, 'id'> = {
  chave_acesso: '35260904972092009421550012340098765430000126',
  cnpj_emitente: '04972092009421',
  nome_loja: 'Oba Hortifruti (Fartura)',
  endereco: 'São José do Rio Preto - SP',
  data_hora: '2026-09-07T13:40:00-03:00',
  numero: '9876',
  serie: '1',
  valor_bruto_centavos: 15628,
  desconto_total_centavos: 719,
  valor_pago_centavos: 14909,
  tributos_centavos: 2999,
  forma_pagamento: [{ tipo: 'Dinheiro', valor_centavos: 14909 }],
  origem: 'pdf',
  criado_em: '2026-09-07T13:45:00-03:00',
}

// ---------------------------------------------------------------------------
// Nota 4 — Não identificada, 07/09/2026 21:09, 1 item
// ---------------------------------------------------------------------------

const naoIdentificadaItens: ItemSemNota[] = [
  item({
    codigo_produto: '7891400000101',
    descricao_original: 'PIZZA CONG MUSSARELA 460G',
    descricao_normalizada: 'Pizza Congelada Mussarela 460g',
    quantidade: 1,
    unidade: 'Un',
    valor_unitario_centavos: 1890,
    valor_total_centavos: 1890,
    categoria: 'Mercearia',
    peso_g: 460,
    volume_ml: null,
  }),
]

const notaNaoIdentificada: Omit<Nota, 'id'> = {
  chave_acesso: null,
  cnpj_emitente: '20508752000175',
  nome_loja: 'Não identificada',
  endereco: null,
  data_hora: '2026-09-07T21:09:00-03:00',
  numero: null,
  serie: null,
  valor_bruto_centavos: 1890,
  desconto_total_centavos: 0,
  valor_pago_centavos: 1890,
  tributos_centavos: 340,
  forma_pagamento: [{ tipo: 'Cartão de Crédito', valor_centavos: 1890 }],
  origem: 'manual',
  criado_em: '2026-09-07T21:15:00-03:00',
}

export const NOTAS_FIXTURE: { nota: Omit<Nota, 'id'>; itens: ItemSemNota[] }[] = [
  { nota: notaAssai, itens: [...assaiEspeciais, ...assaiFiller] },
  { nota: notaMuffato, itens: [...muffatoEspeciais, ...muffatoFiller] },
  { nota: notaOba, itens: obaItens },
  { nota: notaNaoIdentificada, itens: naoIdentificadaItens },
]
