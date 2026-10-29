// Banco do USUÁRIO (favoritos + preferências locais) — arquivo SEPARADO do
// feed. Regra crítica: o provedor de dados do feed (provedor_dados.tsx) nunca
// abre, importa por cima nem apaga este arquivo. Guarda só IDs estáveis
// (route_id/stop_id) e a data — sem nome nem horário (vêm do feed vivo).
// Favoritos órfãos (ID que sumiu do feed novo) são detectados no cruzamento
// com o feed: nunca derrubam a tela; a tela mostra "não existe mais" com
// ação de remover.
import * as SQLite from "expo-sqlite";

const NOME_BANCO = "flavos_usuario.db";

export interface FavoritoSalvo {
  readonly id: string;
  readonly criadoEm: string; // ISO 8601
}

let promessaBanco: Promise<SQLite.SQLiteDatabase> | null = null;

async function obterBanco(): Promise<SQLite.SQLiteDatabase> {
  if (promessaBanco === null) {
    promessaBanco = (async () => {
      const db = await SQLite.openDatabaseAsync(NOME_BANCO);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS favoritos_linha (
          route_id  TEXT PRIMARY KEY NOT NULL,
          criado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favoritos_parada (
          stop_id   TEXT PRIMARY KEY NOT NULL,
          criado_em TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return promessaBanco;
}

// ---------------- linhas ----------------
export async function favoritarLinha(routeId: string): Promise<void> {
  const db = await obterBanco();
  await db.runAsync(
    "INSERT OR REPLACE INTO favoritos_linha (route_id, criado_em) VALUES (?, ?)",
    routeId,
    new Date().toISOString(),
  );
}

export async function desfavoritarLinha(routeId: string): Promise<void> {
  const db = await obterBanco();
  await db.runAsync("DELETE FROM favoritos_linha WHERE route_id = ?", routeId);
}

export async function listarLinhasFavoritas(): Promise<readonly FavoritoSalvo[]> {
  const db = await obterBanco();
  return db.getAllAsync<{ route_id: string; criado_em: string }>(
    "SELECT route_id, criado_em FROM favoritos_linha ORDER BY criado_em DESC",
  ).then((rows) =>
    rows.map((r) => ({ id: r.route_id, criadoEm: r.criado_em })),
  );
}

// ---------------- paradas ----------------
export async function favoritarParada(stopId: string): Promise<void> {
  const db = await obterBanco();
  await db.runAsync(
    "INSERT OR REPLACE INTO favoritos_parada (stop_id, criado_em) VALUES (?, ?)",
    stopId,
    new Date().toISOString(),
  );
}

export async function desfavoritarParada(stopId: string): Promise<void> {
  const db = await obterBanco();
  await db.runAsync("DELETE FROM favoritos_parada WHERE stop_id = ?", stopId);
}

export async function listarParadasFavoritas(): Promise<readonly FavoritoSalvo[]> {
  const db = await obterBanco();
  return db.getAllAsync<{ stop_id: string; criado_em: string }>(
    "SELECT stop_id, criado_em FROM favoritos_parada ORDER BY criado_em DESC",
  ).then((rows) =>
    rows.map((r) => ({ id: r.stop_id, criadoEm: r.criado_em })),
  );
}

// ---------------- purga de órfãos (ação explicita do usuário) ----------------
export async function removerLinhaOrfa(routeId: string): Promise<void> {
  await desfavoritarLinha(routeId);
}

export async function removerParadaOrfa(stopId: string): Promise<void> {
  await desfavoritarParada(stopId);
}

// O adapter do `persist` (Zustand) é implementado na fatia de Favoritos,
// sobre ESTE módulo — nenhum pacote de storage adicional é necessário.
