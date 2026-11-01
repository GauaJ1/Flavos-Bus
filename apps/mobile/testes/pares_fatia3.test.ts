// Pares de contraste NOVOS da fatia 3 (tela Linhas/Buscar/Sobre + Tabs +
// Segmented/DaySegmented), em AMBOS os temas. Os pares antigos (badges,
// cartões) ficam em pares_componentes.test.ts; este arquivo cobre só o que
// a fatia 3 introduced. Rodar: pnpm run test (node --test).
import assert from "node:assert/strict";
import { test } from "node:test";
import { cores } from "../src/tema/tokens.ts";

/** Relação de contraste WCAG (fonte: algoritmo oficial, sRGB -> linear). */
function relativo(c: string): number {
  const hex = c.replace("#", "");
  const n = hex.length === 3 ? hex.split("").map((h) => h + h).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(f: string, s: string): number {
  const [l1, l2] = [relativo(f), relativo(s)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const LIMIAR_TEXTO = 4.5;
const LIMIAR_COMPONENTE = 3.0; // hairline/borda (não texto)

const PARES = [
  // Tabs (aba): rótulo ativo INÍCIO/LINHAS (11px 800) e ícone
  { papel: "Tabs rótulo/ícone ativos", fg: "primary", bg: "surface", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Tabs rótulo/ícone ativos", fg: "primary", bg: "surface", tema: "escuro", limiar: LIMIAR_TEXTO },
  // Tabs: rótulo inativo (11px 600) — texto secundário mesmo
  { papel: "Tabs rótulo/ícone inativos", fg: "textMuted", bg: "surface", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Tabs rótulo/ícone inativos", fg: "textMuted", bg: "surface", tema: "escuro", limiar: LIMIAR_TEXTO },
  // Página: título (24px 800) e meta (13px) sobre surface
  { papel: "Título de tela", fg: "text", bg: "surface", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Título de tela", fg: "text", bg: "surface", tema: "escuro", limiar: LIMIAR_TEXTO },
  { papel: "Meta/legenda de ordem", fg: "textMuted", bg: "surface", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Meta/legenda de ordem", fg: "textMuted", bg: "surface", tema: "escuro", limiar: LIMIAR_TEXTO },
  // Buscar: nome da linha (16px) sobre surface; placeholder do campo
  { papel: "Nome da linha (item)", fg: "text", bg: "surface", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Nome da linha (item)", fg: "text", bg: "surface", tema: "escuro", limiar: LIMIAR_TEXTO },
  { papel: "Placeholder do campo", fg: "textMuted", bg: "surfaceAlt", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Placeholder do campo", fg: "textMuted", bg: "surfaceAlt", tema: "escuro", limiar: LIMIAR_TEXTO },
  // Segmented/DaySegmented: rótulos 15px (não é texto grande: 4.5)
  { papel: "Segmented rótulo inativo", fg: "text", bg: "surfaceAlt", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Segmented rótulo inativo", fg: "text", bg: "surfaceAlt", tema: "escuro", limiar: LIMIAR_TEXTO },
  { papel: "Segmented opção ativa (onPrimary/primary)", fg: "onPrimary", bg: "primary", tema: "claro", limiar: LIMIAR_TEXTO },
  { papel: "Segmented opção ativa (onPrimary/primary)", fg: "onPrimary", bg: "primary", tema: "escuro", limiar: LIMIAR_TEXTO },
  // Botão Voltar: ícone primary sobre surface
  { papel: "Botão Voltar (ícone)", fg: "primary", bg: "surface", tema: "claro", limiar: LIMIAR_COMPONENTE },
  { papel: "Botão Voltar (ícone)", fg: "primary", bg: "surface", tema: "escuro", limiar: LIMIAR_COMPONENTE },
] as const;

/** Hairline da trilha/casco: INFORMATIVO (não reprova). Justificativa:
 * é separador DECORATIVO (1.22/1.26:1); os estados que identificação
 * EXIGE (opção ativa do Segmented, ícone do botão) passam com folga
 * (>= 3:1 não-texto e >= 4.5 texto). Trocar o token border p/ 3:1 muda o
 * visual aprovado pelo dono — decisão documentada em DIRECAO.md. */
const HAIRLINE = [
  { papel: "Borda (hairline trilha/casco)", fg: "border", bg: "surfaceAlt", tema: "claro" },
  { papel: "Borda (hairline trilha/casco)", fg: "border", bg: "surfaceAlt", tema: "escuro" },
] as const;

test("pares novos da fatia 3 passam nos limites WCAG (tabela impressa)", () => {
  const falhas: string[] = [];
  const linhasDeTabela: string[] = [];
  linhasDeTabela.push(
    `${"par".padEnd(38)} ${"tema".padEnd(7)} fg/bg -> relação (mín.)`,
    "-".repeat(86),
  );
  const temaDe = (t: string) => (cores as unknown as Record<string, Record<string, string>>)[t];
  for (const p of PARES) {
    const fg = temaDe(p.tema)[p.fg];
    const bg = temaDe(p.tema)[p.bg];
    const valor = contraste(fg, bg);
    const ok = valor >= p.limiar;
    if (!ok) falhas.push(`${p.papel} (${p.tema}): ${valor.toFixed(2)} < ${p.limiar}`);
    linhasDeTabela.push(
      `${p.papel.padEnd(38)} ${p.tema.padEnd(7)} ${fg}/${bg} -> ${valor.toFixed(2)}:1 (mín. ${p.limiar.toFixed(1)})${ok ? "" : "  FALHOU"}`,
    );
  }
  for (const p of HAIRLINE) {
    const fg = temaDe(p.tema)[p.fg];
    const bg = temaDe(p.tema)[p.bg];
    const valor = contraste(fg, bg);
    linhasDeTabela.push(
      `${p.papel.padEnd(38)} ${p.tema.padEnd(7)} ${fg}/${bg} -> ${valor.toFixed(2)}:1 (informativo — decorativa)`,
    );
  }
  console.log(linhasDeTabela.join("\n"));
  assert.deepEqual(falhas, [], `pares reprovados: ${falhas.join("; ")}`);
});
