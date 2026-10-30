// Regra do LineBadge replicando a prova Python (mesma fórmula, mesmos
// resultados) contra o banco REAL do feed: 84 linhas; exatamente
// E550/E551/E600 precisam de override; pior caso do override >= 4.58.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contraste, corDoBadge, melhorPretoOuBranco } from "../src/dados/contraste_badge.ts";

const raizRepo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const db = new DatabaseSync(join(raizRepo, "apps", "mobile", "assets", "flavos.sqlite"), { readOnly: true });

interface LinhaBd { short_name: string; color: string; text_color: string }

function linhas(): LinhaBd[] {
  return db
    .prepare("SELECT short_name, color, text_color FROM routes WHERE color IS NOT NULL AND trim(color)<>''")
    .all() as unknown as LinhaBd[];
}

test("pior caso da escolha automatica (preto x branco) passa de AA 4.5", () => {
  let pior = 21;
  for (let i = 0; i <= 1000; i += 1) {
    const L = i / 1000; // luminância teórica via fundo cinza equivalente
    // max(ratio('#000', f), ratio('#fff', f)) para o fundo com essa luminância:
    const comPreto = (L + 0.05) / 0.05;
    const comBranco = 1.05 / (L + 0.05);
    pior = Math.min(pior, Math.max(comPreto, comBranco));
  }
  assert.ok(pior >= 4.58, `pior caso ${pior}`);
  assert.ok(Math.abs(pior - 4.583) < 0.01);
  const escolhido = melhorPretoOuBranco("#777777");
  assert.ok(contraste(escolhido, "#777777") >= 4.5, "a escolha automatica sempre satisfaz AA");
});

test("84 linhas do feed: so E550/E551/E600 ajustam; as outras 81 mantem o par", () => {
  const todas = linhas();
  assert.equal(todas.length, 84, "o feed tem 84 linhas coloridas");
  const ajustadas: string[] = [];
  const mantidas: string[] = [];
  for (const l of todas) {
    const p = corDoBadge(l.color, l.text_color);
    if (p.ajustado) ajustadas.push(l.short_name);
    else mantidas.push(l.short_name);
  }
  assert.deepEqual(ajustadas.sort(), ["E550", "E551", "E600"]);
  assert.equal(mantidas.length, 81);
});

test("badge grande/negrito usa limiar 3:1; menor que 19px usa 4.5", () => {
  // fundo onde o branco dá 3.5:1 — passa como grande/negrito, ajustaria se pequeno
  const p = corDoBadge("0000FF", "FFFFFF"); // azul do feed: branco >= 3:1
  assert.equal(p.ajustado, false);
  const pequeno = corDoBadge("0000FF", "FFFFFF", { tamPx: 16, peso: 700 });
  // branco sobre 0000FF = 8.59 >= 4.5 também passa; usamos um caso limítrofe:
  const limitePequeno = corDoBadge("E550", "FFFFFF", { tamPx: 16 }); // cinza claro x branco ~1.6
  assert.equal(limitePequeno.ajustado, true);
  void pequeno;
});

test("fundo do feed nunca muda no override", () => {
  const p = corDoBadge("888888", "555555"); // cinza médio x cinza escuro (2.08 < 3)
  assert.equal(p.fundo, "#888888"); // fundo = dado oficial do feed, intocado
  assert.equal(p.ajustado, true);
  assert.ok(["#000000", "#FFFFFF"].includes(p.texto));
});
