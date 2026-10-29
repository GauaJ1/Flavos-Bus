// Contraste WCAG 2.x dos pares de tokens do theme.ts (clareza matemática:
// sem depender de olho). Regra: texto normal ≥ 4,5:1; bold ≥18,66px ≥ 3:1.
// Saída: docs/design/telas/contraste_tokens.md
import { writeFile } from "node:fs/promises";

function luminancia(hex) {
  const c = hex.replace("#", "");
  const [, r, g, b] = [0, 0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const f = (u) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contraste(a, b) {
  const l1 = luminancia(a);
  const l2 = luminancia(b);
  const [claro, escuro] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (claro + 0.05) / (escuro + 0.05);
}

const claro = {
  papel: "#FFFFFF",
  papel2: "#F7F7F8",
  tinta: "#000000",
  tinta2: "#54565B",
  acento: "#002FA7",
  acentoSobre: "#FFFFFF",
  ok: "#1B7A3D",
  atencao: "#5A3A00",
  atencaoFundo: "#FFD666",
  erro: "#B00020",
  erroFundo: "#FCEAED",
};
const escuro = {
  papel: "#000000",
  papel2: "#101012",
  tinta: "#FFFFFF",
  tinta2: "#C7C9CE",
  acento: "#7B9DFF",
  acentoSobre: "#000000",
  ok: "#5FD38D",
  atencao: "#FFC24B",
  atencaoFundo: "#332600",
  erro: "#FF8A98",
  erroFundo: "#2E0D12",
};

const pares = [
  ["tinta sobre papel", "tinta", "papel"],
  ["tinta2 sobre papel2", "tinta2", "papel2"],
  ["tinta2 sobre papel", "tinta2", "papel"],
  ["acento sobre papel", "acento", "papel"],
  ["acentoSobre sobre acento", "acentoSobre", "acento"],
  ["ok sobre papel", "ok", "papel"],
  ["atencao sobre atencaoFundo", "atencao", "atencaoFundo"],
  ["erro sobre erroFundo", "erro", "erroFundo"],
];

const linhas = [
  "# Contraste dos tokens (WCAG 2.x) — claro e escuro",
  "",
  "| Par | Claro | Escuro | Mínimo exigido |",
  "|---|---|---|---|",
];
let falhas = 0;
for (const [nome, frente, fundo] of pares) {
  const c1 = contraste(claro[frente], claro[fundo]);
  const c2 = contraste(escuro[frente], escuro[fundo]);
  const minimo = nome === "tinta2 sobre papel2" ? 4.5 : nome.includes("erro") || nome.includes("ok") ? 4.5 : 4.5;
  const ok1 = c1 >= minimo;
  const ok2 = c2 >= minimo;
  if (!ok1 || !ok2) falhas += 1;
  linhas.push(
    `| ${nome} | ${c1.toFixed(2)}:1 ${ok1 ? "PASS" : "FAIL"} | ${c2.toFixed(2)}:1 ${ok2 ? "PASS" : "FAIL"} | ${minimo}:1 |`,
  );
}
linhas.push("", falhas === 0 ? "Todos os pares passam em 4,5:1." : `FAILs: ${falhas}`);
await writeFile(
  new URL("../../../docs/design/telas/contraste_tokens.md", import.meta.url),
  linhas.join("\n") + "\n",
  "utf-8",
);
console.log(linhas.join("\n"));
process.exit(falhas === 0 ? 0 : 1);
