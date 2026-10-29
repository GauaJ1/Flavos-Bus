// Ponte do tema — theme.ts NÃO define mais valores: tokens.ts é a única
// fonte de cores/escala. Aqui só: reexport + interface/temas de compat
// com os nomes antigos (papel, tinta, acento…) usados pelas telas atuais.
// A renomeação dos componentes para os nomes novos acontece nas fatias
// desse redesign; quando terminar, esta ponte encolhe para `export *`.
// ok foi REMOVIDO: nenhum componente o usava (grep 2026-10-29) e success
// é YAGNI no MVP (regra em tokens.ts).

import { useColorScheme } from "react-native";
import {
  cores,
  espaco,
  toque,
  raio,
  tipografia,
  fonteNumeros,
  sombra,
  logoTile,
} from "./tokens";

export * from "./tokens";

export interface Tema {
  readonly escuro: boolean;
  // ---- ponte de nomes (valores vêm sempre de tokens.ts) ----
  /** tokens: surface */ readonly papel: string;
  /** tokens: surfaceAlt */ readonly papel2: string;
  /** tokens: text */ readonly tinta: string;
  /** tokens: textMuted */ readonly tinta2: string;
  /** tokens: border */ readonly hairline: string;
  /** tokens: primary */ readonly acento: string;
  /** tokens: onPrimary */ readonly acentoSobre: string;
  /** tokens: theoretical — RESERVADO ao TheoreticalBadge */ readonly atencao: string;
  /** tokens: theoreticalBg — RESERVADO ao TheoreticalBadge */ readonly atencaoFundo: string;
  /** tokens: danger */ readonly erro: string;
  /** tokens: dangerBg */ readonly erroFundo: string;
}

export const temaClaro: Tema = {
  escuro: false,
  papel: cores.claro.surface,
  papel2: cores.claro.surfaceAlt,
  tinta: cores.claro.text,
  tinta2: cores.claro.textMuted,
  hairline: cores.claro.border,
  acento: cores.claro.primary,
  acentoSobre: cores.claro.onPrimary,
  atencao: cores.claro.theoretical,
  atencaoFundo: cores.claro.theoreticalBg,
  erro: cores.claro.danger,
  erroFundo: cores.claro.dangerBg,
};

export const temaEscuro: Tema = {
  escuro: true,
  papel: cores.escuro.surface,
  papel2: cores.escuro.surfaceAlt,
  tinta: cores.escuro.text,
  tinta2: cores.escuro.textMuted,
  hairline: cores.escuro.border,
  acento: cores.escuro.primary,
  acentoSobre: cores.escuro.onPrimary,
  atencao: cores.escuro.theoretical,
  atencaoFundo: cores.escuro.theoreticalBg,
  erro: cores.escuro.danger,
  erroFundo: cores.escuro.dangerBg,
};

export function useTema(): Tema {
  const esquema = useColorScheme();
  return esquema === "dark" ? temaEscuro : temaClaro;
}
