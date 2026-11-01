// Prova do BottomSheet M3 (Passo 6) — função pura de estilo.
import assert from "node:assert/strict";
import { test } from "node:test";
import { estiloBottomSheet } from "../src/tema/estilos_sheet.ts";
import { forma, m3_medidas, papeis } from "../src/tema/tokens.ts";

const sombra = { shadowColor: "#04122E", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } };

test("bottomSheet: container surfaceContainerLow (A)", () => {
  const e = estiloBottomSheet(papeis.claro, sombra);
  assert.equal(e.painel.backgroundColor, papeis.claro.surfaceContainerLow);
});

test("bottomSheet: cantos superiores 28dp (extra-large.top, A)", () => {
  const e = estiloBottomSheet(papeis.claro, sombra);
  assert.equal(e.painel.borderTopLeftRadius, 28);
  assert.equal(e.painel.borderTopRightRadius, 28);
  assert.equal(m3_medidas.bottomSheet.cantosSuperiores, 28);
});

test("bottomSheet: alça 32×4 onSurfaceVariant, faixa 48 (A + projeto)", () => {
  const e = estiloBottomSheet(papeis.escuro, sombra);
  assert.equal(e.alca.width, 32);
  assert.equal(e.alca.height, 4);
  assert.equal(e.alca.borderRadius, forma.full);
  assert.equal(e.alca.backgroundColor, papeis.escuro.onSurfaceVariant);
  assert.equal(e.alcaArea.minHeight, 48);
});

test("bottomSheet: elevação level1 (a ÚNICA sombra real do app)", () => {
  const e = estiloBottomSheet(papeis.claro, sombra);
  assert.equal(e.painel.elevation, 1);
  assert.equal(m3_medidas.bottomSheet.elevacao, 1);
});

test("bottomSheet: sem borda (a hairline antiga saiu)", () => {
  const e = estiloBottomSheet(papeis.claro, sombra);
  assert.equal(e.painel.borderWidth, 0);
});
