// Acessibilidade M3 (Passo 7) — helpers compartilhados.
// Regras do projeto:
//  - alvo de toque >= 48 (controles); piso de 44 só no rótulo de aba;
//  - seleção NUNCA só por cor (ícone preenchido + peso + texto);
//  - escala de fonte limitada a 1,3 em rótulos críticos (aba, badge);
//  - rótulos sempre em português e legíveis por leitor de tela.
import { toque } from "./tokens.ts";

/** Escala máxima de fonte em rótulos que não podem quebrar o layout. */
export const MAX_FONTE = 1.3;

/** Piso de alvo de toque do Material (48dp). */
export const ALVO_MINIMO = toque.minimo;

/** Garante alvo de toque em controles menores (chip de 32, aba, etc.):
 * a área clicável cresce sem alterar o desenho. */
export function hitSlopAlvo(
  alturaVisual: number,
  larguraVisual: number,
): { top: number; bottom: number; left: number; right: number } {
  const v = Math.max(0, Math.ceil((ALVO_MINIMO - alturaVisual) / 2));
  const h = Math.max(0, Math.ceil((ALVO_MINIMO - larguraVisual) / 2));
  return { top: v, bottom: v, left: h, right: h };
}

/** Rótulo de estado para leitor de tela (seleção + posição). */
export function rotuloSelecao(rotulo: string, selecionado: boolean): string {
  return selecionado ? `${rotulo}, selecionado` : rotulo;
}

/** Rótulo de aba com posição ("Linhas, aba 3 de 3"). */
export function rotuloAba(rotulo: string, indice: number, total: number): string {
  return `${rotulo}, aba ${indice + 1} de ${total}`;
}

/** Estado de acessibilidade padrão de um controle selecionável. */
export function estadoAcessivel(opts: {
  selecionado?: boolean;
  desabilitado?: boolean;
}): { selected?: boolean; disabled?: boolean } {
  const s: { selected?: boolean; disabled?: boolean } = {};
  if (opts.selecionado !== undefined) s.selected = opts.selecionado;
  if (opts.desabilitado !== undefined) s.disabled = opts.desabilitado;
  return s;
}
