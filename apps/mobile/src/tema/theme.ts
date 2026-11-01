// Ponte do tema — theme.ts NÃO define valores: tokens.ts é a única fonte
// de cores/escala. Aqui: acesso ao conjunto de PAPÉIS M3 do tema atual
// (`usePapeis`), ponte de nomes antigos (`Tema`) e as medidas M3.
// Nenhum componente lê useColorScheme direto (grep): useTema/usePapeis.

import { useColorScheme } from "react-native";
import {
  cores,
  papeis,
  identidade,
  espaco,
  toque,
  raio,
  tipografia,
  sombra,
  logoTile,
  m3_medidas,
  forma,
  estadoM3,
  movimento,
  tiposM3,
  tiposDominio,
} from "./tokens";
import type { PaletaM3, Identidade } from "./tokens";
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

/** Conjunto COMPLETO do tema atual: papéis M3 + identidade + medidas.
 * É o que os componentes M3 consomem (via `usePapeis`). */
export interface TemaM3 {
  readonly escuro: boolean;
  /** papéis M3 (Portão A) */
  readonly papeis: PaletaM3;
  /** identidade do Flavos (fora do M3) */
  readonly identidade: Identidade;
  readonly medidas: typeof m3_medidas;
  readonly forma: typeof forma;
  readonly estado: typeof estadoM3;
  readonly movimento: typeof movimento;
  readonly tipos: typeof tiposM3;
  readonly tiposDominio: typeof tiposDominio;
  readonly logoTile: string;
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

function montarM3(escuro: boolean): TemaM3 {
  return {
    escuro,
    papeis: escuro ? papeis.escuro : papeis.claro,
    identidade: escuro ? identidade.escuro : identidade.claro,
    medidas: m3_medidas,
    forma,
    estado: estadoM3,
    movimento,
    tipos: tiposM3,
    tiposDominio,
    logoTile,
  };
}

export const temaClaro: Tema = montar(false);
export const temaEscuro: Tema = montar(true);
export const temaM3Claro: TemaM3 = montarM3(false);
export const temaM3Escuro: TemaM3 = montarM3(true);

function resolveEscuroAtual(modo: ReturnType<typeof useModoTema>["modo"], sistemaEscuro: boolean) {
  return resolverEscuro(modo, sistemaEscuro);
}

/** ÚNICO caminho de cor (fatia 3, B4): modo manual (sistema/claro/escuro)
 * persistido em flavos_usuario.db via TemaProvider; sem modo manual, segue
 * o sistema. NENHUM componente novo chama useColorScheme direto (grep). */
export function useTema(): Tema {
  const { modo } = useModoTema();
  const esquema = useColorScheme();
  return resolveEscuroAtual(modo, esquema === "dark") ? temaEscuro : temaClaro;
}

/** Mesmo caminho único, expondo o conjunto M3 completo (papéis + medidas). */
export function usePapeis(): TemaM3 {
  const { modo } = useModoTema();
  const esquema = useColorScheme();
  return resolveEscuroAtual(modo, esquema === "dark") ? temaM3Escuro : temaM3Claro;
}
