// FUNÇÕES DE ESTILO PURAS do Material 3 (Passo 6).
// Sem react-native e sem React de propósito: os testes node:test importam
// ESTE arquivo e provam numericamente cada medida/par de cor, comparando com
// m3_spec.json. Os componentes (.tsx) só aplicam o retorno.
import type { PaletaM3 } from "./tokens.ts";
import { estadoM3, forma, m3_medidas, tiposM3 } from "./tokens.ts";

// ---------------------------------------------------------------
// Tipos de retorno (só estruturas — nada de StyleSheet aqui)
// ---------------------------------------------------------------
export interface CoresBotao {
  readonly container: string | null;
  readonly rotulo: string;
  readonly borda: string | null;
  readonly ripple: string;
}

export type EstiloBotao = "filled" | "tonal" | "outlined" | "text";

export type TipoChip = "assist" | "filter";

export type VarianteNo = "primeira" | "intermediaria" | "ultima";

// ---------------------------------------------------------------
// BOTÃO
// ---------------------------------------------------------------
export function coresDoBotao(papeis: PaletaM3, estilo: EstiloBotao): CoresBotao {
  switch (estilo) {
    case "filled":
      return { container: papeis.primary, rotulo: papeis.onPrimary, borda: null, ripple: papeis.onPrimary };
    case "tonal":
      return {
        container: papeis.secondaryContainer,
        rotulo: papeis.onSecondaryContainer,
        borda: null,
        ripple: papeis.onSecondaryContainer,
      };
    case "outlined":
      return { container: null, rotulo: papeis.primary, borda: papeis.outline, ripple: papeis.primary };
    case "text":
      return { container: null, rotulo: papeis.primary, borda: null, ripple: papeis.primary };
  }
}

export function estiloBotao(papeis: PaletaM3, estilo: EstiloBotao, desabilitado: boolean) {
  const c = coresDoBotao(papeis, estilo);
  return {
    container: {
      minHeight: m3_medidas.botao.altura,
      borderRadius: forma.full,
      paddingHorizontal: m3_medidas.botao.paddingHorizontal,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      backgroundColor: c.container ?? "transparent",
      opacity:
        desabilitado && c.container !== null
          ? estadoM3.desabilitadoContainer
          : c.borda
            ? desabilitado
              ? estadoM3.desabilitadoContainer
              : 1
            : 1,
      borderWidth: c.borda ? 1 : 0,
      borderColor: c.borda ?? "transparent",
    },
    rotulo: { color: c.rotulo, opacity: desabilitado ? estadoM3.desabilitadoConteudo : 1 },
    texto: {
      fontSize: tiposM3.labelLarge.tamanho,
      lineHeight: tiposM3.labelLarge.linhaAltura,
      fontWeight: tiposM3.labelLarge.peso,
      letterSpacing: tiposM3.labelLarge.tracking,
    },
  };
}

// ---------------------------------------------------------------
// DIVIDER
// ---------------------------------------------------------------
export function estiloDivider(papeis: PaletaM3) {
  return {
    height: m3_medidas.divider.espessura,
    backgroundColor: papeis.outlineVariant,
    alignSelf: "stretch" as const,
  };
}

// ---------------------------------------------------------------
// SECTION HEADER — labelLarge onSurfaceVariant
// ---------------------------------------------------------------
export function estiloSectionHeader(papeis: PaletaM3) {
  return {
    minHeight: m3_medidas.sectionHeader.altura,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: papeis.surface,
  };
}

export function estiloRotuloSectionHeader(papeis: PaletaM3) {
  return {
    color: papeis.onSurfaceVariant,
    fontSize: tiposM3.labelLarge.tamanho,
    lineHeight: tiposM3.labelLarge.linhaAltura,
    fontWeight: tiposM3.labelLarge.peso,
    letterSpacing: tiposM3.labelLarge.tracking,
  };
}

// ---------------------------------------------------------------
// ICON BUTTON — ícone 24, alvo 48, selecionado primary
// ---------------------------------------------------------------
export function estiloIconButton(
  papeis: PaletaM3,
  opts: { selecionado?: boolean; desabilitado?: boolean; estiloSelecionado?: "padrao" | "filled" } = {},
) {
  const { selecionado = false, desabilitado = false, estiloSelecionado = "padrao" } = opts;
  const filled = selecionado && estiloSelecionado === "filled";
  return {
    container: {
      width: m3_medidas.iconButton.alvo,
      height: m3_medidas.iconButton.alvo,
      borderRadius: forma.full,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: filled ? papeis.primaryContainer : "transparent",
      opacity: desabilitado ? estadoM3.desabilitadoConteudo : 1,
    },
    corIcone: desabilitado
      ? papeis.onSurface
      : filled
        ? papeis.onPrimaryContainer
        : selecionado
          ? papeis.primary
          : papeis.onSurfaceVariant,
    ripple: filled ? papeis.onPrimaryContainer : papeis.onSurfaceVariant,
  };
}

// ---------------------------------------------------------------
// LIST ITEM — 56/72/88; selecionado secondaryContainer
// ---------------------------------------------------------------
export function estiloListItem(
  papeis: PaletaM3,
  opts: { linhas?: 1 | 2 | 3; selecionado?: boolean; desabilitado?: boolean } = {},
) {
  const { linhas = 1, selecionado = false, desabilitado = false } = opts;
  const minHeight =
    linhas === 3
      ? m3_medidas.listItem.altura3Linhas
      : linhas === 2
        ? m3_medidas.listItem.altura2Linhas
        : m3_medidas.listItem.altura1Linha;
  return {
    container: {
      minHeight,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: m3_medidas.listItem.espacoLiderTrailing,
      borderRadius: forma.pequena,
      paddingHorizontal: m3_medidas.listItem.espacoLiderTrailing,
      backgroundColor: selecionado ? papeis.secondaryContainer : papeis.surface,
    },
    opacidade: desabilitado ? estadoM3.desabilitadoConteudo : 1,
  };
}

export function estiloTextoListItemTitulo(papeis: PaletaM3, selecionado: boolean) {
  return {
    color: selecionado ? papeis.onSecondaryContainer : papeis.onSurface,
    fontSize: tiposM3.bodyLarge.tamanho,
    lineHeight: tiposM3.bodyLarge.linhaAltura,
    fontWeight: tiposM3.bodyLarge.peso,
    letterSpacing: tiposM3.bodyLarge.tracking,
  };
}

export function estiloTextoListItemApoio(papeis: PaletaM3, selecionado: boolean) {
  return {
    color: selecionado ? papeis.onSecondaryContainer : papeis.onSurfaceVariant,
    fontSize: tiposM3.bodyMedium.tamanho,
    lineHeight: tiposM3.bodyMedium.linhaAltura,
    letterSpacing: tiposM3.bodyMedium.tracking,
  };
}

// ---------------------------------------------------------------
// TOP APP BAR — 64; surface → on-scroll surfaceContainer
// ---------------------------------------------------------------
export function estiloTopAppBar(papeis: PaletaM3, rolado: boolean) {
  return {
    container: {
      minHeight: m3_medidas.topAppBar.altura,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      paddingHorizontal: 4,
      backgroundColor: rolado ? papeis.surfaceContainer : papeis.surface,
    },
    titulo: {
      flex: 1,
      color: papeis.onSurface,
      fontSize: tiposM3.titleLarge.tamanho,
      lineHeight: tiposM3.titleLarge.linhaAltura,
      fontWeight: tiposM3.titleLarge.peso,
      letterSpacing: tiposM3.titleLarge.tracking,
    },
  };
}

// ---------------------------------------------------------------
// SEARCH BAR — 56, full, surfaceContainerHigh, sem borda
// ---------------------------------------------------------------
export function estiloSearchBar(papeis: PaletaM3) {
  return {
    container: {
      height: m3_medidas.searchBar.altura,
      borderRadius: forma.full,
      backgroundColor: papeis.surfaceContainerHigh,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      paddingHorizontal: 16,
      borderWidth: 0,
    },
    corLider: papeis.onSurface,
    corPlaceholder: papeis.onSurfaceVariant,
    textoPlaceholder: {
      flex: 1,
      color: papeis.onSurfaceVariant,
      fontSize: tiposM3.bodyLarge.tamanho,
      lineHeight: tiposM3.bodyLarge.linhaAltura,
      letterSpacing: tiposM3.bodyLarge.tracking,
    },
    input: {
      flex: 1,
      color: papeis.onSurface,
      fontSize: tiposM3.bodyLarge.tamanho,
      lineHeight: tiposM3.bodyLarge.linhaAltura,
      letterSpacing: tiposM3.bodyLarge.tracking,
      paddingVertical: 0,
      minHeight: 44,
    },
  };
}

// ---------------------------------------------------------------
// SEGMENTED BUTTON — 40, borda outline, selecionado secondaryContainer
// ---------------------------------------------------------------
export function estiloSegmentedContainer(papeis: PaletaM3) {
  return {
    flexDirection: "row" as const,
    alignSelf: "stretch" as const,
    height: m3_medidas.segmentedButton.altura,
    borderRadius: forma.full,
    borderWidth: m3_medidas.segmentedButton.borda,
    borderColor: papeis.outline,
    overflow: "hidden" as const,
  };
}

export function estiloSegmento(papeis: PaletaM3, ativo: boolean, primeiro: boolean, ultimo: boolean) {
  const meia = m3_medidas.segmentedButton.altura / 2;
  return {
    flex: 1,
    minHeight: m3_medidas.segmentedButton.altura,
    minWidth: m3_medidas.segmentedButton.paddingHorizontalMin,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: ativo ? papeis.secondaryContainer : "transparent",
    borderTopLeftRadius: primeiro ? meia : 0,
    borderBottomLeftRadius: primeiro ? meia : 0,
    borderTopRightRadius: ultimo ? meia : 0,
    borderBottomRightRadius: ultimo ? meia : 0,
    borderLeftWidth: primeiro ? 0 : m3_medidas.segmentedButton.borda,
    borderLeftColor: papeis.outline,
  };
}

export function estiloTextoSegmento(papeis: PaletaM3, ativo: boolean) {
  return {
    color: ativo ? papeis.onSecondaryContainer : papeis.onSurface,
    fontSize: tiposM3.labelLarge.tamanho,
    lineHeight: tiposM3.labelLarge.linhaAltura,
    fontWeight: tiposM3.labelLarge.peso,
    letterSpacing: tiposM3.labelLarge.tracking,
    paddingHorizontal: 4,
  };
}

// ---------------------------------------------------------------
// CHIP — 32, raio 8; filter ativo preenchido, inativo contorno outline
// ---------------------------------------------------------------
export function estiloChip(papeis: PaletaM3, tipo: TipoChip, selecionado: boolean, desabilitado: boolean) {
  const preenchido = tipo === "filter" && selecionado;
  const corBorda = preenchido ? "transparent" : tipo === "filter" ? papeis.outline : papeis.outlineVariant;
  const corTexto = preenchido
    ? papeis.onSecondaryContainer
    : tipo === "filter"
      ? papeis.onSurfaceVariant
      : papeis.onSurface;
  return {
    container: {
      height: m3_medidas.chip.altura,
      borderRadius: forma.pequena,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: corBorda,
      backgroundColor: preenchido ? papeis.secondaryContainer : "transparent",
      opacity: desabilitado ? estadoM3.desabilitadoConteudo : 1,
    },
    texto: { color: corTexto, opacity: 1 },
    corIcone: preenchido ? papeis.onSecondaryContainer : tipo === "filter" ? papeis.onSurfaceVariant : papeis.primary,
    ripple: papeis.onSurfaceVariant,
  };
}

export function estiloFilterChipRow() {
  return { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: m3_medidas.filterChipRow.gap, alignItems: "center" as const };
}

// ---------------------------------------------------------------
// NAVIGATION BAR — medidas SÓ de m3_medidas.navigationBar
// ---------------------------------------------------------------
export function estiloContainerNav(papeis: PaletaM3) {
  return {
    height: m3_medidas.navigationBar.altura,
    flexDirection: "row" as const,
    backgroundColor: papeis.surfaceContainer,
    borderTopWidth: 0,
  };
}

export function estiloDestinoNav(papeis: PaletaM3, selecionado: boolean) {
  return {
    indicador: {
      width: m3_medidas.navigationBar.indicadorLargura,
      height: m3_medidas.navigationBar.indicadorAltura,
      borderRadius: forma.full,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: selecionado ? papeis.secondaryContainer : "transparent",
    },
    corIcone: selecionado ? papeis.onSecondaryContainer : papeis.onSurfaceVariant,
    rotulo: {
      color: selecionado ? papeis.onSurface : papeis.onSurfaceVariant,
      fontSize: tiposM3.labelMedium.tamanho,
      lineHeight: tiposM3.labelMedium.linhaAltura,
      fontWeight: tiposM3.labelMedium.peso,
      letterSpacing: tiposM3.labelMedium.tracking,
      marginTop: m3_medidas.navigationBar.gapIconeRotulo,
      textAlign: "center" as const,
      alignSelf: "stretch" as const,
    },
  };
}

/** Alternativa AZUL do indicador (captura comparativa do Portão B). */
export function estiloContainerNavAzul(papeis: PaletaM3) {
  return estiloContainerNav(papeis);
}

export function estiloDestinoNavAzul(papeis: PaletaM3, selecionado: boolean) {
  const base = estiloDestinoNav(papeis, selecionado);
  return {
    ...base,
    indicador: { ...base.indicador, backgroundColor: selecionado ? papeis.primaryContainer : "transparent" },
    corIcone: selecionado ? papeis.onPrimaryContainer : papeis.onSurfaceVariant,
  };
}

// ---------------------------------------------------------------
// TIMELINE STOP — forma comunica origem/destino
// ---------------------------------------------------------------
export function estiloNoTimeline(variante: VarianteNo, atual: boolean, corLinha: string) {
  const grande = variante !== "intermediaria";
  const tamanho = grande ? m3_medidas.timelineStop.noGrande : m3_medidas.timelineStop.noPequeno;
  const cheio = variante !== "intermediaria" || atual;
  return {
    no: {
      width: tamanho,
      height: tamanho,
      borderRadius: variante === "ultima" ? forma.extraPequena : tamanho / 2,
      borderWidth: m3_medidas.timelineStop.anel,
      borderColor: corLinha,
      backgroundColor: cheio ? corLinha : "transparent",
    },
    conector: {
      width: m3_medidas.timelineStop.conector,
      flex: 1,
      backgroundColor: corLinha,
      borderRadius: forma.full,
    },
    forma: variante === "ultima" ? "quadrado" : grande ? "circulo" : "anel",
    cheio,
  };
}

// ---------------------------------------------------------------
// ESTADOS
// ---------------------------------------------------------------
export function opacidadeDesabilitado(desabilitado: boolean): number {
  return desabilitado ? estadoM3.desabilitadoConteudo : 1;
}

export function opacidadeContainerDesabilitado(desabilitado: boolean): number {
  return desabilitado ? estadoM3.desabilitadoContainer : 1;
}
