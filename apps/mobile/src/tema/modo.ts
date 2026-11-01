// Modo de tema (sistema/claro/escuro) — FUNÇÃO PURA (sem react-native):
// testável por node:test. A persistência usa as SQLs de db/usuario.ts.
export type ModoTema = "sistema" | "claro" | "escuro";

/** Chave na tabela preferencias. */
export const CHAVE_MODO_TEMA = "tema";

export const MODOS_VALIDOS: readonly ModoTema[] = ["sistema", "claro", "escuro"];

/** Valor vindo do banco/string arbitrária -> ModoTema (default: sistema). */
export function validarModo(valor: string | null | undefined): ModoTema {
  return valor === "claro" || valor === "escuro" || valor === "sistema" ? valor : "sistema";
}

/** Escuro? modo manual vence; "sistema" segue o aparelho. */
export function resolverEscuro(modo: ModoTema, sistemaEscuro: boolean): boolean {
  if (modo === "escuro") return true;
  if (modo === "claro") return false;
  return sistemaEscuro;
}
