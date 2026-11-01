// Testes do filtro de busca (B3) — casos mínimos pedidos + ordem.
// Rodar: pnpm run test (node --test, 100% offline).
import assert from "node:assert/strict";
import { test } from "node:test";
import { classificarTermo, filtrarLinhas, normalizar, semZerosEsquerda, type LinhaConsultavel } from "../src/dados/filtro_linhas.ts";

const MOFOS: readonly LinhaConsultavel[] = [
  { id: "r-0002", numero: "0002", nome: "Cruz do Peixe" },
  { id: "r-0101", numero: "0101", nome: "São José Circular" },
  { id: "r-0102", numero: "0102", nome: "Jardim São Paulo" },
  { id: "r-E550", numero: "E550", nome: "Executiva Universitária" },
  { id: "r-0403", numero: "0403", nome: "Bairro Aeroporto" },
];

test("'utilisateur digita 101 e acha 0101 como numero EXATO", () => {
  const r = filtrarLinhas("101", MOFOS);
  assert.equal(r[0]?.id, "r-0101");
  assert.equal(classificarTermo("101", MOFOS[1]), "exato");
});

test("digitou 2: acha 0002 (exato) antes de 0202-style prefixos", () => {
  const r = filtrarLinhas("2", MOFOS);
  assert.equal(r[0]?.id, "r-0002");
  // 0102 SEM zeros viraria 102 (nao comeca com 2) e o nome 'Sao Paulo' nao bate: fora
  assert.ok(!r.some((l) => l.id === "r-0102"));
});

test("maiúscula e sem tratamento: e550 acha E550 (exato)", () => {
  const r = filtrarLinhas("e550", MOFOS);
  assert.deepEqual(r.map((l) => l.id), ["r-E550"]);
});

test("sem acento: sao acha nomes com São (pela ordem de numero)", () => {
  const r = filtrarLinhas("sao", MOFOS);
  assert.deepEqual(r.map((l) => l.numero), ["0101", "0102"]);
});

test("termo vazio devolve TODAS (sem filtrar)", () => {
  assert.equal(filtrarLinhas("", MOFOS).length, MOFOS.length);
  assert.equal(filtrarLinhas("   ", MOFOS).length, MOFOS.length);
});

test("sem resultado: lista vazia (tela mostra EmptyState Limpar busca)", () => {
  assert.deepEqual(filtrarLinhas("zzz", MOFOS), []);
});

test("ordem: exato > prefixo > contem (peso 0 > 1 > 2)", () => {
  const r = filtrarLinhas("01", MOFOS);
  // prefixo: 0101, 0102 (por numero crescente); depois contem (não há)
  assert.deepEqual(
    r.map((l) => l.numero),
    ["0101", "0102"],
  );
});

test("semZerosEsquerda: 0002->2, 0101->101, 000->0, 10->10", () => {
  assert.equal(semZerosEsquerda("0002"), "2");
  assert.equal(semZerosEsquerda("0101"), "101");
  assert.equal(semZerosEsquerda("000"), "0");
  assert.equal(semZerosEsquerda("10"), "10");
  assert.equal(semZerosEsquerda("0"), "0");
});

test("normalizar: acento/caixa/espacos multiplos", () => {
  assert.equal(normalizar("SÃO   JOSÉ"), "sao jose");
  assert.equal(normalizar("Tambaú"), "tambau");
});
