// Dexie precisa de um IndexedDB — em Node (ambiente dos testes) usamos um polyfill.
import 'fake-indexeddb/auto'

// Node não tem localStorage global; um shim em memória simples é suficiente
// pros testes que dependem dele (ex.: a marca de "seed já carregada").
if (typeof globalThis.localStorage === 'undefined') {
  const armazenamento = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (chave: string) => armazenamento.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void armazenamento.set(chave, valor),
    removeItem: (chave: string) => void armazenamento.delete(chave),
    clear: () => armazenamento.clear(),
    key: (indice: number) => Array.from(armazenamento.keys())[indice] ?? null,
    get length() {
      return armazenamento.size
    },
  } as Storage
}
