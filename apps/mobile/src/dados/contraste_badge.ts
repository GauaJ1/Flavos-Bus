// Contraste WCAG + regra do LineBadge — função PURA (sem React/RN), mesma
// fórmula provada em Python (tools/scraper/tests/test_badge_contraste.py):
// - numeral do badge é texto GRANDE e negrito (>= 19px, peso 700) ⇒ limiar 3:1;
// - se o par do feed não alcança, troca APENAS o texto para preto ou branco
//   (o de maior contraste) e mantém o fundo OFICIAL do feed;
// - propriedade de segurança: para qualquer fundo, max(preto, branco) >= 4.583,
//   logo o override automático sempre passa até o AA de texto normal (4.5).
// Cores chegam como vêm do feed ("0000FF") ou com "#" — aceito os dois.
import { contrasteBadge } from "../tema/tokens.ts";

function canalSrgb(hexPar: string): number {
  const c = parseInt(hexPar, 16) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminancia(hex: string): number {
  const h = hex.replace("#", "").toUpperCase();
  const r = canalSrgb(h.slice(0, 2));
  const g = canalSrgb(h.slice(2, 4));
  const b = canalSrgb(h.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG (1..21). */
export function contraste(frente: string, fundo: string): number {
  const lf = luminancia(frente);
  const lb = luminancia(fundo);
  const hi = Math.max(lf, lb);
  const lo = Math.min(lf, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Cor de texto que dá o MAIOR contraste sobre o fundo: preto ou branco.
 * As duas constantes vêm de tokens (contrasteBadge) — nenhum hex solto. */
export function melhorPretoOuBranco(fundo: string): string {
  const { preto, branco } = contrasteBadge;
  return contraste(preto, fundo) >= contraste(branco, fundo) ? preto : branco;
}

export interface PaletaBadge {
  readonly fundo: string;
  readonly texto: string;
  /** true quando o par do feed não alcançou o limiar e o app ajustou. */
  readonly ajustado: boolean;
}

/**
 * Cores do LineBadge (numeral >= 19px, 700 ⇒ limiar 3:1).
 * `tamPx`/`peso` permitem reusar a função em contexto menor: abaixo de
 * 19px ou peso < 700, o limiar volta a 4.5 (WCAG texto normal).
 */
export function corDoBadge(
  corDoFeed: string,
  corTextoDoFeed: string,
  opts?: { readonly tamPx?: number; readonly peso?: 400 | 600 | 700 },
): PaletaBadge {
  const grandeENegrito = (opts?.tamPx ?? 20) >= 19 && (opts?.peso ?? 700) === 700;
  const limiar = grandeENegrito ? 3.0 : 4.5;
  const fundo = `#${corDoFeed.replace("#", "").toUpperCase()}`;
  const textoFeed = `#${corTextoDoFeed.replace("#", "").toUpperCase()}`;
  if (contraste(textoFeed, fundo) >= limiar) {
    return { fundo, texto: textoFeed, ajustado: false };
  }
  return { fundo, texto: melhorPretoOuBranco(fundo), ajustado: true };
}
