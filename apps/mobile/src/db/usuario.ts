// Persistência do USUÁRIO (fatia 3, B4) — banco SEPARADO do feed:
// flavos_usuario.db (expo-sqlite). Só preferências hoje (chave/valor).
// As SQLs vivem em usuario_sql.ts (puro, testado por node:sqlite).
import * as SQLite from "expo-sqlite";
import { NOME_BANCO_USUARIO, SQL_MIGRACAO_USUARIO, SQL_LER_PREFERENCIA, SQL_GRAVAR_PREFERENCIA } from "./usuario_sql";

export { NOME_BANCO_USUARIO } from "./usuario_sql";

export async function abrirBancoUsuario(): Promise<SQLite.SQLiteDatabase> {
  const banco = await SQLite.openDatabaseAsync(NOME_BANCO_USUARIO);
  await banco.execAsync(SQL_MIGRACAO_USUARIO);
  return banco;
}

export async function lerPreferencia(banco: SQLite.SQLiteDatabase, chave: string): Promise<string | null> {
  const linha = await banco.getFirstAsync<{ valor: string }>(SQL_LER_PREFERENCIA, [chave]);
  return linha?.valor ?? null;
}

export async function gravarPreferencia(banco: SQLite.SQLiteDatabase, chave: string, valor: string): Promise<void> {
  await banco.runAsync(SQL_GRAVAR_PREFERENCIA, [chave, valor]);
}
