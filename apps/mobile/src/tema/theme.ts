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
  sombra,
  logoTile,
} from "./tokens";
export { fonteNumeros } from "./fontes";
import { useModoTema } from "./tema_provider";
import { resolverEscuro } from "./modo";

export * from "./tokens";

export interface Tema {
  readonly escuro: boolean;
  // ---- nomes novos (tokens) — usados pelos componentes do redesign ----
  /** tokens: primary */ readonly primary: string;
  /** tokens: onPrimary */ readonly onPrimary: string;
  /** tokens: surface */ readonly surface: string;
  /** tokens: surfaceAlt */ readonly surfaceAlt: string;
  /** tokens: border */ readonly border: string;
  /** tokens: text */ readonly text: string;
  /** tokens: textMuted */ readonly textMuted: string;
  /** tokens: verdeMarca */ readonly verdeMarca: string;
  /** tokens: verdeTexto */ readonly verdeTexto: string;
  /** tokens: theoretical — RESERVADO ao TheoreticalBadge */ readonly theoretical: string;
  /** tokens: theoreticalBg — RESERVADO ao TheoreticalBadge */ readonly theoreticalBg: string;
  /** tokens: danger */ readonly danger: string;
  /** tokens: dangerBg */ readonly dangerBg: string;
  // ---- ponte de nomes ANTIGOS (telas que ainda não migraram) ----
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

function montar(escuro: boolean): Tema {
  const c = escuro ? cores.escuro : cores.claro;
  return {
    escuro,
    primary: c.primary,
    onPrimary: c.onPrimary,
    surface: c.surface,
    surfaceAlt: c.surfaceAlt,
    border: c.border,
    text: c.text,
    textMuted: c.textMuted,
    verdeMarca: c.verdeMarca,
    verdeTexto: c.verdeTexto,
    theoretical: c.theoretical,
    theoreticalBg: c.theoreticalBg,
    danger: c.danger,
    dangerBg: c.dangerBg,
    papel: c.surface,
    papel2: c.surfaceAlt,
    tinta: c.text,
    tinta2: c.textMuted,
    hairline: c.border,
    acento: c.primary,
    acentoSobre: c.onPrimary,
    atencao: c.theoretical,
    atencaoFundo: c.theoreticalBg,
    erro: c.danger,
    erroFundo: c.dangerBg,
  };
}

export const temaClaro: Tema = montar(false);
export const temaEscuro: Tema = montar(true);

/** ÚNICO caminho de cor (fatia 3, B4): modo manual (sistema/claro/escuro)
 * persistido em flavos_usuario.db via TemaProvider; sem modo manual, segue
 * o sistema. NENHUM componente novo chama useColorScheme direto (grep). */
export function useTema(): Tema {
  const { modo } = useModoTema();
  const esquema = useColorScheme();
  return resolverEscuro(modo, esquema === "dark") ? temaEscuro : temaClaro;
}
