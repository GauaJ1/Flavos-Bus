// REGRAS DE CÓDIGO da fatia M3 (Passo 9) — varredura estática do src/.
// Cada teste falha se uma regra do dono for violada.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";

const RAIZ = join(import.meta.dirname, "..", "src");

function arquivos(dir: string): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.(ts|tsx)$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

const TODOS = arquivos(RAIZ);
const rel = (f: string) => relative(RAIZ, f).split(sep).join("/");
const ler = (f: string) => readFileSync(f, "utf-8");

function violacoes(predicado: (l: string, f: string) => boolean, filtro: (f: string) => boolean = () => true): string[] {
  const fora: string[] = [];
  for (const f of TODOS) {
    if (!filtro(f)) continue;
    const linhas = ler(f).split(/\r?\n/);
    linhas.forEach((l, i) => {
      if (predicado(l, f)) fora.push(`${rel(f)}:${i + 1}: ${l.trim().slice(0, 90)}`);
    });
  }
  return fora;
}

test("nenhum hex literal fora de tokens.ts", () => {
  const fora = violacoes(
    (l) => /#[0-9A-Fa-f]{3,8}\b/.test(l) && !l.trimStart().startsWith("//") && !/^\s*\*/.test(l),
    (f) => rel(f) !== "tema/tokens.ts" && rel(f) !== "tema/m3_spec.json",
  );
  assert.deepEqual(fora, []);
});

test("nenhum fontFamily literal fora de fontes.ts", () => {
  const fora = violacoes((l) => /fontFamily\s*:/.test(l) && !l.trimStart().startsWith("//"), (f) => rel(f) !== "tema/fontes.ts");
  assert.deepEqual(fora, []);
});

test("nenhum borderRadius numerico literal (usar token forma)", () => {
  const fora = violacoes((l) => /borderRadius\s*:\s*\d+/.test(l) && !l.trimStart().startsWith("//"));
  assert.deepEqual(fora, []);
});

test("theoretical* só é usado pelo TheoreticalBadge", () => {
  const permitidos = new Set(["tema/tokens.ts", "tema/theme.ts", "ui/theoretical_badge.tsx"]);
  const fora = violacoes(
    (l) => /\btheoretical(Bg)?\b/.test(l) && !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"),
    (f) => !permitidos.has(rel(f)),
  );
  assert.deepEqual(fora, []);
});

test("useColorScheme só em theme.ts (caminho único de tema)", () => {
  const fora = violacoes((l) => /useColorScheme\s*\(/.test(l) && !l.trimStart().startsWith("//"), (f) => rel(f) !== "tema/theme.ts");
  assert.deepEqual(fora, []);
});

test("success não é exportado nem usado", () => {
  const tokens = ler(join(RAIZ, "tema", "tokens.ts"));
  assert.ok(!/readonly success/.test(tokens), "success não deve existir em PaletaM3");
  const fora = violacoes((l) => /\bsuccess\b/.test(l) && !l.trimStart().startsWith("//"));
  assert.deepEqual(fora, []);
});

test("verde de marca não é usado como semântica em componentes M3", () => {
  // secundária (verde) só é permitida em: seletor/indicador, tastem de foco,
  // badge de linha. Nunca em erro/aviso/sucesso.
  const fora = violacoes(
    (l) => /(erro|aviso|alert|success|sucesso)[A-Za-z]*\s*:\s*[^,}]*\b(secondary|verdeMarca)\b/i.test(l) && !l.trimStart().startsWith("//"),
  );
  assert.deepEqual(fora, []);
});

test("nenhuma dependência de UI kit ou de runtime novo no package.json", () => {
  const pkg = JSON.parse(readFileSync(join(RAIZ, "..", "package.json"), "utf-8"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const proibidos = [
    "react-native-paper",
    "tamagui",
    "@gluestack-ui/themed",
    "nativewind",
    "react-native-reanimated",
    "react-native-gesture-handler",
    "@material/material-color-utilities",
    "material-color-utilities",
  ];
  assert.deepEqual(
    deps.filter((d) => proibidos.includes(d)),
    [],
  );
});

test("nenhum arquivo M3 importa react-native fora de .tsx (puro p/ teste)", () => {
  const puros = ["tema/estilos_m3.ts", "tema/estilos_sheet.ts", "tema/acessibilidade.ts", "tema/tokens.ts"];
  for (const p of puros) {
    const txt = ler(join(RAIZ, ...p.split("/")));
    assert.ok(!/from\s+"react-native"/.test(txt), `${p} não pode importar react-native`);
    assert.ok(!/from\s+"expo/.test(txt), `${p} não pode importar expo`);
  }
});

test("imports relativos em src/tema usam extensão .ts (Node ESM nos testes)", () => {
  // theme.ts é o agregador do app (Metro resolve sem extensão, e ele importa
  // react-native/expo) — fica fora; os módulos PUROS usados pelos testes não.
  const fora: string[] = [];
  for (const nome of readdirSync(join(RAIZ, "tema"))) {
    if (!nome.endsWith(".ts") || nome === "theme.ts") continue;
    const linhas = ler(join(RAIZ, "tema", nome)).split(/\r?\n/);
    linhas.forEach((l, i) => {
      const m = /from\s+"(\.[^"]+)"/.exec(l);
      if (m && !m[1].endsWith(".ts") && !m[1].endsWith(".json")) fora.push(`tema/${nome}:${i + 1}: ${m[1]}`);
    });
  }
  assert.deepEqual(fora, []);
});
