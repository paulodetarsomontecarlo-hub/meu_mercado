# Meu Mercado

App para analisar compras de supermercado a partir da nota fiscal (NFC-e): você
adiciona a nota por foto, PDF, QR code ou chave de acesso, o app extrai e
categoriza os itens, e mostra para onde o dinheiro está indo — gasto por
categoria, preço por kg/litro, comparação entre lojas e alertas de formato caro.

PWA local-first: roda 100% no navegador/celular, os dados ficam no IndexedDB do
próprio dispositivo (sem backend, sem login). Ver [Decisões e limitações](#decisões-e-limitações)
para o que isso implica.

## Como rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (PWA instalável) em dist/
npm run preview   # serve o build de produção localmente
npx vitest run    # testes automatizados
```

Na primeira vez que o app abre (banco local vazio), ele carrega automaticamente
o fixture de teste: quatro notas de 07/09/2026 (Assaí, Muffato, Oba Hortifruti e
uma nota não identificada), com os itens reais citados no briefing — o molho de
tomate a R$6,63/kg vs. R$148,07/kg, a Coca-Cola 200ml, as águas de 5L e 1,5L etc.
Para testar do zero, limpe o IndexedDB do site (DevTools → Application → Clear
storage) e recarregue.

## Telas

- **Dashboard** — total pago e carga tributária consolidados, gasto por
  categoria e por loja (com ticket médio), alertas de formato caro, ranking dos
  itens mais caros por kg/L e evolução mensal por categoria.
- **Adicionar** — quatro abas (PDF, Foto, QR code, Chave) que convergem para
  uma tela de revisão comum, onde você confere/corrige cabeçalho e itens antes
  de salvar.
- **Histórico** — lista de notas filtrável por data/loja/categoria, com
  exportação CSV (`;`, vírgula decimal, para abrir direto no Excel PT-BR).
- **Detalhe da nota** — dados da nota, chave de acesso decomposta (UF,
  competência, CNPJ, modelo/série/número), tributos, e lista de itens com edição
  inline que alimenta o dicionário de normalização/categorização.

## Como o parser foi estruturado

Os quatro caminhos de entrada produzem o mesmo formato intermediário
(`RawReceipt`, em `src/types.ts`) antes de virar `Nota` + `Item[]`:

```
foto ──OCR (Tesseract.js, offline)──┐
pdf  ──texto (pdfjs-dist)───────────┼──► parseLinhasTexto (regex compartilhado)
qr   ──chave/CNPJ apenas────────────┤         │
chave─ decompoe 44 dígitos──────────┘         ▼
                                    deduplicarItens (agrupa por código,
                                     vincula "Desconto no item N")
                                               │
                                               ▼
                                   normalizarItem + categorizarItem
                                   (consulta o dicionário aprendido)
                                               │
                                               ▼
                                    construirNotaEItens → salvarNota
                                    (grava Nota, Item[] e atualiza
                                     Produto.historico_precos)
```

Peças principais (`src/parsers/` e `src/lib/`):

- **`chaveParser.ts`** — decompõe os 44 dígitos (UF, AAMM, CNPJ, modelo, série,
  número) e valida o dígito verificador (módulo 11).
- **`pdfParser.ts` / `ocrParser.ts` / `textExtractors.ts`** — extraem texto
  (via `pdfjs-dist` ou `tesseract.js`) e reaproveitam os mesmos extratores de
  cabeçalho (loja, CNPJ, data, valores, tributos, forma de pagamento).
- **`lineParser.ts`** — regex tolerante a variações de layout
  (`código descrição qtd un vl.unit vl.total`, com "x"/"=" como separadores)
  usado tanto no texto limpo do PDF quanto no texto ruidoso do OCR.
- **`dedupe.ts`** — o cupom impresso agrupa itens repetidos numa linha, o PDF
  não; este passo agrupa por `codigo_produto` e vincula cada linha de desconto
  ("Desconto no item N") ao item pelo índice impresso.
- **`normalizer.ts` / `categorizer.ts`** — cada item é resolvido primeiro
  contra o dicionário aprendido (tabela `produtos`, chave = código do produto);
  só na primeira vez que um código aparece é que entram as heurísticas
  (expansão de abreviações comuns, regex de peso/volume, palavras-chave por
  categoria). Uma correção manual na tela de detalhe grava no dicionário e
  passa a valer para as próximas notas com aquele código.
- **`analytics.ts`** — preço por kg/L, gasto por categoria/loja, comparação de
  um produto entre lojas/datas, detecção de formato caro (compara o preço por
  unidade padrão de itens com o mesmo nome-base, sem assumir que o formato
  grande é sempre mais barato — ver caso de teste da água 5L vs. 1,5L), carga
  tributária e evolução mensal.

### QR code e chave de acesso não trazem os itens

Por design: o QR code de uma NFC-e só contém a chave de acesso e aponta para a
consulta no site da Sefaz, que é bloqueado para acesso automatizado (por isso
está fora de escopo). Nesses dois caminhos de entrada o app decompõe a chave
(UF, CNPJ, competência etc.) e deixa os itens para lançamento manual na tela de
revisão — só a foto e o PDF trazem os itens automaticamente.

## Decisões e limitações conhecidas

- **PWA local-first, sem backend**: os dados vivem só no IndexedDB do
  navegador/celular onde a nota foi lançada. Não há sincronização entre
  aparelhos — o CSV exportado é o mecanismo de backup/migração.
- **OCR de foto roda offline**, mas o `tesseract.js` baixa seu worker e o
  pacote de idioma português (alguns MB) de um CDN a partir de uma URL
  externa por padrão. O `vite-plugin-pwa` está configurado para cachear essas
  respostas (`runtimeCaching` em `vite.config.ts`), então depois do primeiro
  uso com internet o OCR volta a funcionar offline. Sem essa primeira sincronização,
  o caminho de foto exige rede na primeira vez.
- **OCR é o caminho menos confiável dos quatro** — a tela de revisão de itens é
  sempre exibida antes de salvar, justamente para corrigir erros de leitura.
- **Dicionário de normalização é por código de produto**, então ele aprende
  rápido para compras repetidas na mesma loja; entre lojas diferentes (códigos
  internos diferentes para o mesmo produto) a comparação por nome ainda
  funciona, mas cada código precisa da própria correção na primeira vez.
- **Parsers de PDF/foto usam regex heurísticos** para o layout de item
  (`código descrição qtd un vl.unit vl.total`) porque não havia uma
  Consulta Resumida real disponível para calibrar contra o layout exato de
  cada estado/loja. Campos que não forem reconhecidos ficam em branco na
  revisão para preenchimento manual antes de salvar.
- **Dinheiro em centavos**: todo valor monetário "de verdade" (o que saiu
  impresso na nota) é `number` inteiro em centavos. Os campos derivados
  `preco_por_kg`/`preco_por_l` são uma razão (podem ter fração de centavo) e só
  servem para exibição/ranking — nunca são somados como dinheiro.
- **Ticket médio por item = valor pago ÷ número de itens da loja** (soma de
  todas as notas daquela loja no período). Bate exatamente com os R$ 7,34
  (Assaí) e R$ 16,78 (Muffato) do briefing. Para o Oba, essa fórmula dá
  R$ 18,64 (149,09 ÷ 8), não os R$ 19,54 citados — 19,54 só fecha se a conta for
  feita sobre o valor **bruto** (156,28 ÷ 8), uma base diferente da usada nos
  outros dois casos. Optei por manter uma fórmula única e consistente (sobre o
  valor pago, que é o que realmente saiu do bolso) em vez de uma por loja;
  fico à disposição para trocar a base de cálculo se R$ 19,54 for o número que
  você quer ver.
- **Seed de teste**: as quatro notas de 07/09/2026 batem exatamente com os
  totais e os itens citados no briefing (molho de tomate, Coca-Cola 200ml,
  águas 5L/1,5L, tickets médios). Os itens "de enchimento" até completar a
  contagem real de itens de cada nota (95/22/8/1) são gerados
  deterministicamente (mesma seed sempre) a partir de um pool de produtos
  comuns de supermercado, já que o texto completo das quatro notas não foi
  fornecido — ver `src/seed/`.

## Testes

`src/parsers/__tests__` e `src/lib/__tests__` cobrem a chave de acesso (decomposição
e validação do dígito verificador), o parser de linhas (itens + vínculo de
desconto) e, principalmente, `src/lib/__tests__/fixture.test.ts`, que valida os
cinco casos de teste do briefing contra o fixture de 07/09/2026:

1. Consolidado de R$ 1.234,15 pagos e R$ 222,07 de tributos (18,0%).
2. Molho de tomate a R$ 6,63/kg (Fugini) vs. R$ 148,07/kg (Coppola), ~22x.
3. Coca-Cola 200ml sinalizada como formato caro (R$ 11,25/L).
4. Água 5L (R$ 2,38/L) sinalizada como mais cara por litro que a de 1,5L
   (R$ 1,86/L) — sem assumir que o formato grande é mais barato.
5. Ticket médio por item: R$ 7,34 (Assaí) e R$ 16,78 (Muffato).
