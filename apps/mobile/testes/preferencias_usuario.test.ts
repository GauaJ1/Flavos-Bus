// Testes da preferência de tema (B4): as MESMAS SQLs de db/usuario.ts
// executadas em SQLite EM MEMÓRIA (node:sqlite) — prova de migração
// idempotente e de upsert, offline, sem tocar aparelho/web.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  CHAVE_MODO_TEMA,
  MODOS_VALIDOS,
  resolverEscuro,
  validarModo,
} from "../src/tema/modo.ts";
import {
  SQL_GRAVAR_PREFERENCIA,
  SQL_LER_PREFERENCIA,
  SQL_MIGRACAO_USUARIO,
} from "../src/db/usuario_sql.ts";

function bancoMemoria(): DatabaseSync {
  const b = new DatabaseSync(":memory:");
  b.exec(SQL_MIGRACAO_USUARIO);
  return b;
}

test("migracao e idempotente: rodar duas vezes nao falha nem duplica", () => {
  const b = bancoMemoria();
  b.exec(SQL_MIGRACAO_USUARIO); // 2a vez: IF NOT EXISTS
  const tabelas = b.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='preferencias'").all();
  assert.equal(tabelas.length, 1);
});

test("upsert da preferencia: grava, troca e reassocia", () => {
  const b = bancoMemoria();
  const gravar = b.prepare(SQL_GRAVAR_PREFERENCIA);
  gravar.run(CHAVE_MODO_TEMA, "claro");
  gravar.run(CHAVE_MODO_TEMA, "escuro"); // upsert: atualiza, nao duplica
  const linhas = b.prepare("SELECT valor FROM preferencias").all();
  assert.equal(linhas.length, 1);
  assert.equal((linhas[0] as { valor: string }).valor, "escuro");
  const leitura = b.prepare(SQL_LER_PREFERENCIA).get(CHAVE_MODO_TEMA) as { valor: string };
  assert.equal(leitura.valor, "escuro");
});

test("ler preferencia inexistente devolve nada (caller usa default sistema)", () => {
  const b = bancoMemoria();
  assert.equal(b.prepare(SQL_LER_PREFERENCIA).get("inexistente"), undefined);
});

test("validarModo: valores estranhos caem em sistema; validos passam", () => {
  assert.deepEqual(MODOS_VALIDOS, ["sistema", "claro", "escuro"]);
  for (const m of MODOS_VALIDOS) assert.equal(validarModo(m), m);
  assert.equal(validarModo("auto"), "sistema");
  assert.equal(validarModo(null), "sistema");
  assert.equal(validarModo(undefined), "sistema");
  assert.equal(validarModo(""), "sistema");
});

test("resolverEscuro: manual vence; sistema segue o aparelho (tabela 3x2)", () => {
  assert.equal(resolverEscuro("claro", true), false);
  assert.equal(resolverEscuro("claro", false), false);
  assert.equal(resolverEscuro("escuro", true), true);
  assert.equal(resolverEscuro("escuro", false), true);
  assert.equal(resolverEscuro("sistema", true), true);
  assert.equal(resolverEscuro("sistema", false), false);
});
