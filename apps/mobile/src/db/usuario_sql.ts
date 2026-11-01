// SQLs do banco do usuário — arquivo PURO (sem expo/react-native) para o
// teste node:test executar as MESMAS strings com node:sqlite em memória.
// A abertura do banco (expo-sqlite) vive em db/usuario.ts.

export const NOME_BANCO_USUARIO = "flavos_usuario.db";

/** Migração idempotente: cria a tabela só se não existir. */
export const SQL_MIGRACAO_USUARIO =
  "CREATE TABLE IF NOT EXISTS preferencias (chave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL)";

/** Upsert: grava e reassocia (pode ser chamado quantas vezes quiser). */
export const SQL_GRAVAR_PREFERENCIA =
  "INSERT INTO preferencias (chave, valor) VALUES (?, ?) " +
  "ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor";

export const SQL_LER_PREFERENCIA = "SELECT valor FROM preferencias WHERE chave = ?";
