import type { Categoria, RawItemLine, Unidade } from '../types'

// PRNG determinístico (mulberry32) para gerar os itens de "enchimento" do fixture
// sempre da mesma forma — sem isso, cada carga da seed teria valores diferentes.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ProdutoPool {
  nome: string
  categoria: Categoria
  unidade: Unidade
  precoTipicoCentavos: number
  peso_g?: number
  volume_ml?: number
}

export const POOL_PRODUTOS: ProdutoPool[] = [
  { nome: 'Arroz Branco Tipo 1 5Kg', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 2890, peso_g: 5000 },
  { nome: 'Feijão Carioca 1Kg', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 899, peso_g: 1000 },
  { nome: 'Macarrão Espaguete 500g', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 549, peso_g: 500 },
  { nome: 'Farinha de Trigo 1Kg', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 649, peso_g: 1000 },
  { nome: 'Açúcar Refinado 1Kg', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 599, peso_g: 1000 },
  { nome: 'Óleo de Soja 900ml', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 799, volume_ml: 900 },
  { nome: 'Café Torrado e Moído 500g', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 1690, peso_g: 500 },
  { nome: 'Sal Refinado 1Kg', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 349, peso_g: 1000 },
  { nome: 'Molho de Tomate Tradicional 340g', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 449, peso_g: 340 },
  { nome: 'Leite Integral 1L', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 599, volume_ml: 1000 },
  { nome: 'Iogurte Natural 900g', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 899, peso_g: 900 },
  { nome: 'Manteiga com Sal 200g', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 1290, peso_g: 200 },
  { nome: 'Pão de Forma Integral 500g', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 999, peso_g: 500 },
  { nome: 'Ovos Brancos Dúzia', categoria: 'Mercearia', unidade: 'Un', precoTipicoCentavos: 1490 },
  { nome: 'Queijo Prato Fatiado 200g', categoria: 'Carnes e frios', unidade: 'Un', precoTipicoCentavos: 1590, peso_g: 200 },
  { nome: 'Presunto Cozido Fatiado 200g', categoria: 'Carnes e frios', unidade: 'Un', precoTipicoCentavos: 1390, peso_g: 200 },
  { nome: 'Peito de Frango Kg', categoria: 'Carnes e frios', unidade: 'Kg', precoTipicoCentavos: 1899, peso_g: 1000 },
  { nome: 'Carne Moída Kg', categoria: 'Carnes e frios', unidade: 'Kg', precoTipicoCentavos: 3490, peso_g: 1000 },
  { nome: 'Linguiça Calabresa Kg', categoria: 'Carnes e frios', unidade: 'Kg', precoTipicoCentavos: 2290, peso_g: 1000 },
  { nome: 'Refrigerante Guaraná 2L', categoria: 'Bebidas', unidade: 'Un', precoTipicoCentavos: 899, volume_ml: 2000 },
  { nome: 'Suco de Laranja 1L', categoria: 'Bebidas', unidade: 'Un', precoTipicoCentavos: 799, volume_ml: 1000 },
  { nome: 'Cerveja Pilsen Lata 350ml', categoria: 'Bebidas', unidade: 'Un', precoTipicoCentavos: 349, volume_ml: 350 },
  { nome: 'Água Mineral com Gás 500ml', categoria: 'Bebidas', unidade: 'Un', precoTipicoCentavos: 299, volume_ml: 500 },
  { nome: 'Biscoito Recheado 130g', categoria: 'Doces e snacks', unidade: 'Un', precoTipicoCentavos: 449, peso_g: 130 },
  { nome: 'Chocolate ao Leite 90g', categoria: 'Doces e snacks', unidade: 'Un', precoTipicoCentavos: 699, peso_g: 90 },
  { nome: 'Batata Palha 100g', categoria: 'Doces e snacks', unidade: 'Un', precoTipicoCentavos: 999, peso_g: 100 },
  { nome: 'Salgadinho de Milho 90g', categoria: 'Doces e snacks', unidade: 'Un', precoTipicoCentavos: 649, peso_g: 90 },
  { nome: 'Bala de Goma Pacote 500g', categoria: 'Doces e snacks', unidade: 'Un', precoTipicoCentavos: 1199, peso_g: 500 },
  { nome: 'Sabonete em Barra 90g', categoria: 'Higiene', unidade: 'Un', precoTipicoCentavos: 299, peso_g: 90 },
  { nome: 'Shampoo Uso Diário 350ml', categoria: 'Higiene', unidade: 'Un', precoTipicoCentavos: 1790, volume_ml: 350 },
  { nome: 'Desodorante Aerosol 150ml', categoria: 'Higiene', unidade: 'Un', precoTipicoCentavos: 1590, volume_ml: 150 },
  { nome: 'Escova de Dente Macia', categoria: 'Higiene', unidade: 'Un', precoTipicoCentavos: 799 },
  { nome: 'Absorvente Íntimo Pacote', categoria: 'Higiene', unidade: 'Un', precoTipicoCentavos: 1290 },
  { nome: 'Detergente Neutro 500ml', categoria: 'Limpeza', unidade: 'Un', precoTipicoCentavos: 259, volume_ml: 500 },
  { nome: 'Sabão em Pó 1Kg', categoria: 'Limpeza', unidade: 'Un', precoTipicoCentavos: 1490, peso_g: 1000 },
  { nome: 'Água Sanitária 1L', categoria: 'Limpeza', unidade: 'Un', precoTipicoCentavos: 549, volume_ml: 1000 },
  { nome: 'Amaciante de Roupas 2L', categoria: 'Limpeza', unidade: 'Un', precoTipicoCentavos: 1990, volume_ml: 2000 },
  { nome: 'Esponja de Aço Pacote', categoria: 'Limpeza', unidade: 'Un', precoTipicoCentavos: 449 },
  { nome: 'Desinfetante 1L', categoria: 'Limpeza', unidade: 'Un', precoTipicoCentavos: 699, volume_ml: 1000 },
  { nome: 'Pote Plástico com Tampa', categoria: 'Utensílios', unidade: 'Un', precoTipicoCentavos: 1290 },
  { nome: 'Copo Descartável Pacote 50un', categoria: 'Utensílios', unidade: 'Un', precoTipicoCentavos: 899 },
  { nome: 'Papel Alumínio 30m', categoria: 'Utensílios', unidade: 'Un', precoTipicoCentavos: 1199 },
  { nome: 'Ração para Cães Adultos 1Kg', categoria: 'Pet', unidade: 'Un', precoTipicoCentavos: 1890, peso_g: 1000 },
  { nome: 'Areia Sanitária para Gatos 4Kg', categoria: 'Pet', unidade: 'Un', precoTipicoCentavos: 2490, peso_g: 4000 },
  { nome: 'Petisco para Cães 100g', categoria: 'Pet', unidade: 'Un', precoTipicoCentavos: 999, peso_g: 100 },
]

export interface ItemGeradoComCategoria extends RawItemLine {
  categoria: Categoria
  peso_g: number | null
  volume_ml: number | null
}

// Gera `quantidade` itens com preços pseudo-aleatórios (variação de ±20% sobre o
// preço típico do pool), ajustando o último item para que a soma bata exatamente
// com `somaAlvoCentavos` — sem isso, arredondamentos deixariam a nota alguns
// centavos fora do valor real impresso.
export function gerarItensFiller(
  quantidade: number,
  somaAlvoCentavos: number,
  codigoBase: number,
  seed: number,
): ItemGeradoComCategoria[] {
  const random = mulberry32(seed)
  const itens: ItemGeradoComCategoria[] = []

  for (let i = 0; i < quantidade; i++) {
    const produto = POOL_PRODUTOS[Math.floor(random() * POOL_PRODUTOS.length)]
    const variacao = 0.8 + random() * 0.4
    const valorUnitario = Math.max(50, Math.round(produto.precoTipicoCentavos * variacao))
    const porPeso = produto.unidade === 'Kg'
    const quantidadeItem = porPeso ? Number((0.3 + random() * 2.2).toFixed(3)) : 1
    const valorTotal = porPeso ? Math.round(valorUnitario * quantidadeItem) : valorUnitario

    itens.push({
      codigo_produto: String(codigoBase + i),
      descricao: produto.nome,
      quantidade: quantidadeItem,
      unidade: produto.unidade,
      valor_unitario_centavos: valorUnitario,
      valor_total_centavos: valorTotal,
      categoria: produto.categoria,
      peso_g: porPeso ? Math.round(quantidadeItem * 1000) : (produto.peso_g ?? null),
      volume_ml: produto.volume_ml ?? null,
    })
  }

  const somaAtual = itens.reduce((acc, i) => acc + i.valor_total_centavos, 0)
  const ajuste = somaAlvoCentavos - somaAtual
  const ultimo = itens[itens.length - 1]
  ultimo.valor_total_centavos += ajuste
  if (ultimo.quantidade === 1) {
    ultimo.valor_unitario_centavos = ultimo.valor_total_centavos
  }

  return itens
}
