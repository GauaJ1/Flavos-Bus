// Filtro de busca de linhas — FUNÇÃO PURA (fatia 3, B3). Sem React, sem
// banco, sem react-native: testável por node:test.
// Regras do dono:
// - sem acento e sem caixa ("sao" acha "São");
// - números do feed têm zeros à esquerda (0002, 0101): o usuário digita
//   "101" ou "2" — comparação IGNORA zeros à esquerda;
// - ordem dos resultados: número EXATO, número que COMEÇA com, nome que
//   contém; empate dentro do mesmo grupo: número (sem zeros) crescente.

export interface LinhaConsultavel {
  /** route_id — chave estável para o keyExtractor da lista. */
  readonly id: string;
  /** short_name do feed (pode ter zeros à esquerda: "0101"). */
  readonly numero: string;
  /** long_name do feed (com acentos reais: "São José"). */
  readonly nome: string;
}

/** "São José" -> "sao jose" (NFD + tirar diacríticos + lower + colapsar espaços). */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "0002" -> "2" · "0101" -> "101" · "000" -> "0" (zerão não vira vazio). */
export function semZerosEsquerda(texto: string): string {
  const cortado = texto.replace(/^0+(?=\d)/, "");
  return cortado.length > 0 ? cortado : "0";
}

export type Forca = "exato" | "prefixo" | "contem";

/** Força da coincidência de UMA linha com o termo (null = não acha). */
export function classificarTermo(termoBruto: string, linha: LinhaConsultavel): Forca | null {
  const termo = normalizar(termoBruto);
  if (termo.length === 0) return null;
  const numero = semZerosEsquerda(normalizar(linha.numero));
  const nome = normalizar(linha.nome);
  const termoNumero = semZerosEsquerda(termo);
  if (termoNumero === numero) return "exato";
  if (numero.startsWith(termoNumero)) return "prefixo";
  if (nome.includes(termo)) return "contem";
  return null;
}

const PESO: Record<Forca, number> = { exato: 0, prefixo: 1, contem: 2 };

/** Filtra + ordena. Termo vazio devolve TODAS (na ordem natural da lista). */
export function filtrarLinhas(termoBruto: string, linhas: readonly LinhaConsultavel[]): LinhaConsultavel[] {
  const termo = normalizar(termoBruto);
  if (termo.length === 0) return [...linhas];
  const marcadas = linhas
    .map((linha) => ({ linha, forca: classificarTermo(termoBruto, linha) }))
    .filter((m): m is { linha: LinhaConsultavel; forca: Forca } => m.forca !== null);
  return marcadas
    .sort(
      (a, b) =>
        PESO[a.forca] - PESO[b.forca] ||
        Number(semZerosEsquerda(normalizar(a.linha.numero))) - Number(semZerosEsquerda(normalizar(b.linha.numero))) ||
        a.linha.nome.localeCompare(b.linha.nome),
    )
    .map((m) => m.linha);
}
