// Contraste da paleta M3 v2 — matriz MEDIDA (não "conforme") do DESIGN_SYSTEM §4.3.
// Limites WCAG: texto 4,5:1 (AA) / 3:1 (texto grande e elementos de UI).
// outlineVariant é DECORATIVO (hairline/divisor) — isento, mas continua impresso.
import assert from "node:assert/strict";
import { test } from "node:test";
import { papeis, identidade } from "../src/tema/tokens.ts";

const hexRgb = (h: string) => {
  const t = h.replace("#", "");
  return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
};
const lin = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (h: string) => {
  const [r, g, b] = hexRgb(h).map(lin) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: string, b: string) => {
  const la = lum(a);
  const lb = lum(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

type Temas = "claro" | "escuro";

const TEXTO: [string, (p: typeof papeis.claro) => string, (p: typeof papeis.claro) => string][] = [
  ["onSurface × surface", (p) => p.onSurface, (p) => p.surface],
  ["onSurface × surfaceContainerLowest", (p) => p.onSurface, (p) => p.surfaceContainerLowest],
  ["onSurface × surfaceContainerLow", (p) => p.onSurface, (p) => p.surfaceContainerLow],
  ["onSurface × surfaceContainer", (p) => p.onSurface, (p) => p.surfaceContainer],
  ["onSurface × surfaceContainerHigh", (p) => p.onSurface, (p) => p.surfaceContainerHigh],
  ["onSurface × surfaceContainerHighest", (p) => p.onSurface, (p) => p.surfaceContainerHighest],
  ["onSurfaceVariant × surface", (p) => p.onSurfaceVariant, (p) => p.surface],
  ["onSurfaceVariant × surfaceContainer", (p) => p.onSurfaceVariant, (p) => p.surfaceContainer],
  ["onSurfaceVariant × surfaceContainerHigh", (p) => p.onSurfaceVariant, (p) => p.surfaceContainerHigh],
  ["primary × surface", (p) => p.primary, (p) => p.surface],
  ["onPrimary × primary", (p) => p.onPrimary, (p) => p.primary],
  ["onPrimaryContainer × primaryContainer", (p) => p.onPrimaryContainer, (p) => p.primaryContainer],
  ["onSecondaryContainer × secondaryContainer", (p) => p.onSecondaryContainer, (p) => p.secondaryContainer],
  ["onSurface (rótulo ativo) × surfaceContainer", (p) => p.onSurface, (p) => p.surfaceContainer],
  ["onSecondary × secondary", (p) => p.onSecondary, (p) => p.secondary],
  ["onError × error", (p) => p.onError, (p) => p.error],
  ["onErrorContainer × errorContainer", (p) => p.onErrorContainer, (p) => p.errorContainer],
  ["outline × surface (borda de controle)", (p) => p.outline, (p) => p.surface],
];

test("matriz de contraste: todos os pares de texto/UI passam (tabela impressa)", () => {
  const linhas: string[] = [];
  let falhas = 0;
  for (const tema of ["claro", "escuro"] as Temas[]) {
    const p = papeis[tema];
    for (const [nome, fg, bg] of TEXTO) {
      const r = contraste(fg(p), bg(p));
      const limite = nome.includes("borda") ? 3 : 4.5;
      const ok = r >= limite;
      if (!ok) falhas++;
      linhas.push(`${tema.padEnd(6)} ${nome.padEnd(44)} ${r.toFixed(2).padStart(6)}:1  limite ${limite}  ${ok ? "OK" : "FALHOU"}`);
    }
  }
  console.log("\n" + linhas.join("\n"));
  assert.equal(falhas, 0, `${falhas} par(es) reprovado(s)`);
});

test("theoretical (papéis do Flavos) continua legível nos dois temas", () => {
  for (const tema of ["claro", "escuro"] as Temas[]) {
    const i = identidade[tema];
    const p = papeis[tema];
    const r = contraste(i.theoretical, i.theoreticalBg);
    console.log(`theoretical ${tema}: ${r.toFixed(2)}:1 (limite 4.5)`);
    assert.ok(r >= 4.5, `theoretical ${tema} = ${r.toFixed(2)}`);
    // o selo fica sobre a superfície também
    const sobreSuperficie = contraste(i.theoretical, p.surface);
    console.log(`theoretical sobre surface ${tema}: ${sobreSuperficie.toFixed(2)}:1`);
  }
});

test("outlineVariant (decorativo) fica registrado com o valor medido", () => {
  for (const tema of ["claro", "escuro"] as Temas[]) {
    const p = papeis[tema];
    const r = contraste(p.outlineVariant, p.surface);
    console.log(`outlineVariant × surface ${tema}: ${r.toFixed(2)}:1 (ISENTO — decorativo)`);
    assert.ok(r < 3, "outlineVariant deve ser discreto (decorativo < 3:1)");
  }
});

test("verde como TEXTO sobre surfaceContainer claro reprova (documentado; não usado)", () => {
  const r = contraste(papeis.claro.secondary, papeis.claro.surfaceContainer);
  console.log(`secondary × surfaceContainer claro: ${r.toFixed(2)}:1 — não usado como rótulo (rótulo ativo = onSurface)`);
  assert.ok(r < 4.5, "este par deve continuar reprovando (por isso o rótulo ativo é onSurface)");
});

test("indicador verde: ícone/rótulo DENTRO do pill passam com folga (>= 4.5)", () => {
  for (const tema of ["claro", "escuro"] as Temas[]) {
    const p = papeis[tema];
    const dentro = contraste(p.onSecondaryContainer, p.secondaryContainer);
    const rotulo = contraste(p.onSurface, p.surfaceContainer);
    console.log(`indicador ${tema}: dentro ${dentro.toFixed(2)}:1 · rótulo externo ${rotulo.toFixed(2)}:1`);
    assert.ok(dentro >= 4.5);
    assert.ok(rotulo >= 4.5);
  }
});

test("alternativa azul (primaryContainer) também passa (usada na captura comparativa)", () => {
  for (const tema of ["claro", "escuro"] as Temas[]) {
    const p = papeis[tema];
    const dentro = contraste(p.onPrimaryContainer, p.primaryContainer);
    assert.ok(dentro >= 4.5, `azul ${tema} = ${dentro.toFixed(2)}`);
  }
});

test("contraste do schema: pares exigidos pela spec existem como papéis", () => {
  for (const papel of [
    "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
    "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
    "surface", "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
    "surfaceContainerHigh", "surfaceContainerHighest", "onSurface", "onSurfaceVariant",
    "outline", "outlineVariant", "error", "onError", "errorContainer", "onErrorContainer", "scrim",
  ]) {
    assert.ok(papel in papeis.claro, `papel ${papel} ausente`);
  }
});
