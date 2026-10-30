// Contraste de TODOS os pares texto/fundo que os componentes novos usam
// (tokens.ts nos dois temas). Critérios: texto normal >= 4.5 (AA); o
// numeral do LineBadge é 19px/700 (grande) => >= 3.0; borda/hairline/não
// texto de estrutura não entra (decorativo, com rótulo ARIA equivalente).
// Este teste IMPRIME a tabela (saída = prova para o relatório).
import assert from "node:assert/strict";
import { test } from "node:test";
import { contraste } from "../src/dados/contraste_badge.ts";
import { cores } from "../src/tema/tokens.ts";

interface Par {
  readonly componente: string;
  readonly papel: string;
  readonly fg: string;
  readonly bg: string;
  readonly minimo: number;
}

const c = cores.claro;
const e = cores.escuro;

const pares: readonly Par[] = [
  // LineBadge — limiar do numeral: 19px/700 => 3.0 (override sempre >= 4.5)
  { componente: "LineBadge", papel: "numeral mantido (azul 0002)", fg: "#FFFFFF", bg: "#0000FF", minimo: 3.0 },
  { componente: "LineBadge", papel: "numeral mantido (vermelho 0101)", fg: "#FFFFFF", bg: "#FF0000", minimo: 3.0 },
  { componente: "LineBadge", papel: "override preto (E550–E600)", fg: "#000000", bg: "#A1A1A1", minimo: 4.5 },
  // TheoreticalBadge (13px => texto normal 4.5)
  { componente: "TheoreticalBadge", papel: "texto claro", fg: c.theoretical, bg: c.theoreticalBg, minimo: 4.5 },
  { componente: "TheoreticalBadge", papel: "texto escuro", fg: e.theoretical, bg: e.theoreticalBg, minimo: 4.5 },
  // SearchBar
  { componente: "SearchBar", papel: "placeholder claro", fg: c.textMuted, bg: c.surfaceAlt, minimo: 4.5 },
  { componente: "SearchBar", papel: "placeholder escuro", fg: e.textMuted, bg: e.surfaceAlt, minimo: 4.5 },
  { componente: "SearchBar", papel: "texto digitado claro", fg: c.text, bg: c.surfaceAlt, minimo: 4.5 },
  { componente: "SearchBar", papel: "texto digitado escuro", fg: e.text, bg: e.surfaceAlt, minimo: 4.5 },
  // DaySegmented
  { componente: "DaySegmented", papel: "item inativo claro", fg: c.text, bg: c.surface, minimo: 4.5 },
  { componente: "DaySegmented", papel: "item inativo escuro", fg: e.text, bg: e.surface, minimo: 4.5 },
  { componente: "DaySegmented", papel: "item ATIVO claro (onPrimary/primary)", fg: c.onPrimary, bg: c.primary, minimo: 4.5 },
  { componente: "DaySegmented", papel: "item ATIVO escuro", fg: e.onPrimary, bg: e.primary, minimo: 4.5 },
  // NextDepartureCard
  { componente: "NextDepartureCard", papel: "hora grande claro", fg: c.text, bg: c.surfaceAlt, minimo: 4.5 },
  { componente: "NextDepartureCard", papel: "hora grande escuro", fg: e.text, bg: e.surfaceAlt, minimo: 4.5 },
  { componente: "NextDepartureCard", papel: "contagem 'em N min' claro", fg: c.primary, bg: c.surfaceAlt, minimo: 4.5 },
  { componente: "NextDepartureCard", papel: "contagem 'em N min' escuro", fg: e.primary, bg: e.surfaceAlt, minimo: 4.5 },
  { componente: "NextDepartureCard", papel: "rótulos claro", fg: c.textMuted, bg: c.surfaceAlt, minimo: 4.5 },
  { componente: "NextDepartureCard", papel: "rótulos escuro", fg: e.textMuted, bg: e.surfaceAlt, minimo: 4.5 },
  // StopRow
  { componente: "StopRow", papel: "nome claro", fg: c.text, bg: c.surface, minimo: 4.5 },
  { componente: "StopRow", papel: "nome escuro", fg: e.text, bg: e.surface, minimo: 4.5 },
  { componente: "StopRow", papel: "distância claro", fg: c.textMuted, bg: c.surface, minimo: 4.5 },
  { componente: "StopRow", papel: "distância escuro", fg: e.textMuted, bg: e.surface, minimo: 4.5 },
  { componente: "StopRow", papel: "chip '+X' claro", fg: c.textMuted, bg: c.surfaceAlt, minimo: 4.5 },
  { componente: "StopRow", papel: "chip '+X' escuro", fg: e.textMuted, bg: e.surfaceAlt, minimo: 4.5 },
  // TimelineStop
  { componente: "TimelineStop", papel: "nome claro", fg: c.text, bg: c.surface, minimo: 4.5 },
  { componente: "TimelineStop", papel: "nome escuro", fg: e.text, bg: e.surface, minimo: 4.5 },
  { componente: "TimelineStop", papel: "horario claro", fg: c.textMuted, bg: c.surface, minimo: 4.5 },
  { componente: "TimelineStop", papel: "horario escuro", fg: e.textMuted, bg: e.surface, minimo: 4.5 },
  // EmptyState
  { componente: "EmptyState", papel: "titulo claro", fg: c.text, bg: c.surface, minimo: 4.5 },
  { componente: "EmptyState", papel: "titulo escuro", fg: e.text, bg: e.surface, minimo: 4.5 },
  { componente: "EmptyState", papel: "texto claro", fg: c.textMuted, bg: c.surface, minimo: 4.5 },
  { componente: "EmptyState", papel: "texto escuro", fg: e.textMuted, bg: e.surface, minimo: 4.5 },
  { componente: "EmptyState", papel: "acao claro (onPrimary/primary)", fg: c.onPrimary, bg: c.primary, minimo: 4.5 },
  { componente: "EmptyState", papel: "acao escuro", fg: e.onPrimary, bg: e.primary, minimo: 4.5 },
];

test("todos os pares dos componentes novos alcancam o minimo AA do papel", () => {
  const falhas: string[] = [];
  console.log("  componente             | papel                                 | fg    | bg     | razao");
  console.log("  -----------------------|---------------------------------------|-------|--------|-------");
  for (const p of pares) {
    const r = contraste(p.fg, p.bg);
    const linha = `  ${p.componente.padEnd(22)} | ${p.papel.padEnd(37)} | ${p.fg} | ${p.bg} | ${r.toFixed(2)}${r >= p.minimo ? "" : " FALHA"}`;
    console.log(linha);
    if (r < p.minimo) falhas.push(`${p.componente}/${p.papel}: ${r.toFixed(2)} < ${p.minimo}`);
  }
  assert.deepEqual(falhas, [], `pares abaixo do AA do papel: ${falhas.join("; ")}`);
});
