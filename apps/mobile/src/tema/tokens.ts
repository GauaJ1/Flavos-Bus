// ============================================================
// TOKENS DO FLAVOS BUS — ÚNICA FONTE DE VALORES VISUAIS
// Nenhuma cor, espaçamento ou medida fora deste arquivo.
// Este arquivo NÃO importa react-native (os testes node:test leem
// os tokens direto; platform-specifics vivem em fontes.ts).
//
// ORDEM/PRIORIDADE (Portão A aprovado em 2026-11-01):
//   1. especificação Material 3 verificada (m3_spec.json, tokens v6_1_0)
//   2. identidade aprovada do Flavos (cores fixas da marca)
//   3. "decisão do projeto" (marcada ORIGEM_PROJETO) — itens sem fonte M3
//
// Toda medida M3 aqui é cópia de m3_spec.json; o teste de conformidade
// (testes/m3_conformidade.test.ts) compara os dois e reprova divergência.
//
// REGRAS DE USO (invariantes do redesign):
// - primary #05337B (claro) é IMUTÁVEL; verdeMarca #4AA63E e verdeTexto
//   #397E2F IMUTÁVEIS; logoTile #FFFFFF fixo nos dois temas.
// - verde é IDENTIDADE/SELEÇÃO, nunca estado semântico (erro/aviso/sucesso).
// - theoretical* é RESERVADO ao TheoreticalBadge (nenhum outro componente
//   importa theoretical/theoreticalBg — grep de verificação por fatia).
// - success NÃO existe de propósito (YAGNI).
// - cor de linha/placa vem SEMPRE do feed; nenhuma cor de tema a substitui.
// - nada sugere tempo real ("agora", "ao vivo", "atualizado há N min").
// - o selo "Horário teórico" aparece sempre que um horário é exibido.
// ============================================================

/** Fundo do tile que carrega o emblema no tema escuro (e do ícone do app).
 * Fixo e imune à troca de tema por design. */
export const logoTile = "#FFFFFF";

/** Marca de origem para medidas aprovadas como "decisão do projeto"
 * (sem fonte M3) no Portão A. */
export const ORIGEM_PROJETO = "projeto" as const;

// ============================================================
// 1. COR — PAPÉIS MATERIAL 3 (Portão A aprovado)
//    Fixos da marca mantidos; derivados por tom L* (ver DESIGN_SYSTEM.md §4).
// ============================================================

export interface PaletaM3 {
  readonly primary: string;
  readonly onPrimary: string;
  readonly primaryContainer: string;
  readonly onPrimaryContainer: string;
  readonly secondary: string;
  readonly onSecondary: string;
  readonly secondaryContainer: string;
  readonly onSecondaryContainer: string;
  readonly surface: string;
  readonly surfaceContainerLowest: string;
  readonly surfaceContainerLow: string;
  readonly surfaceContainer: string;
  readonly surfaceContainerHigh: string;
  readonly surfaceContainerHighest: string;
  readonly onSurface: string;
  readonly onSurfaceVariant: string;
  readonly outline: string;
  readonly outlineVariant: string;
  readonly error: string;
  readonly onError: string;
  readonly errorContainer: string;
  readonly onErrorContainer: string;
  readonly scrim: string;
}

export const papeis: { readonly claro: PaletaM3; readonly escuro: PaletaM3 } = {
  claro: {
    primary: "#05337B",
    onPrimary: "#FFFFFF",
    primaryContainer: "#D9E3F4",
    onPrimaryContainer: "#121B2C",
    secondary: "#397E2F",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#C5ECCF",
    onSecondaryContainer: "#09200F",
    surface: "#FFFFFF",
    surfaceContainerLowest: "#FFFFFF",
    surfaceContainerLow: "#F2F4F5",
    surfaceContainer: "#ECEDF0",
    surfaceContainerHigh: "#E6E8EC",
    surfaceContainerHighest: "#E0E3E7",
    onSurface: "#0D1322",
    onSurfaceVariant: "#46536B",
    outline: "#6D778A",
    outlineVariant: "#C2C7CF",
    error: "#B00020",
    onError: "#FFFFFF",
    errorContainer: "#FCEAED",
    onErrorContainer: "#78301E",
    scrim: "#000000",
  },
  escuro: {
    primary: "#9DB8F5",
    onPrimary: "#04122E",
    primaryContainer: "#29467A",
    onPrimaryContainer: "#D9E3F3",
    secondary: "#4AA63E",
    onSecondary: "#12371C",
    secondaryContainer: "#22502E",
    onSecondaryContainer: "#C9EAD2",
    // DESVIO DOCUMENTADO (Portão A): o token M3 pede T6; a marca aprovada
    // mede L* 4,0 e é mantida (splash/assets). surfaceContainerLowest foi
    // escurecido (L* 2,7) para ficar ABAIXO do surface.
    surface: "#0B0E17",
    surfaceContainerLowest: "#080A0C",
    surfaceContainerLow: "#181C21",
    surfaceContainer: "#1C2026",
    surfaceContainerHigh: "#262B32",
    surfaceContainerHighest: "#2F353E",
    onSurface: "#F2F5FA",
    onSurfaceVariant: "#A8B2C6",
    outline: "#8892A2",
    outlineVariant: "#404752",
    error: "#FF8A98",
    onError: "#502317",
    errorContainer: "#663C31",
    onErrorContainer: "#F0DFDB",
    scrim: "#000000",
  },
};

/** Cores de IDENTIDADE do Flavos — fora do M3 de propósito (marca e
 * papéis do domínio de horários). Nunca substituem papel M3 nas telas. */
export interface Identidade {
  readonly verdeMarca: string;
  readonly verdeTexto: string;
  readonly aquaDecorativo: string;
  /** RESERVADO ao TheoreticalBadge */
  readonly theoretical: string;
  readonly theoreticalBg: string;
}

export const identidade: { readonly claro: Identidade; readonly escuro: Identidade } = {
  claro: {
    verdeMarca: "#4AA63E",
    verdeTexto: "#397E2F",
    aquaDecorativo: "#01B5C2",
    theoretical: "#6B4A00",
    theoreticalBg: "#FFEFC2",
  },
  escuro: {
    verdeMarca: "#4AA63E",
    verdeTexto: "#4AA63E",
    aquaDecorativo: "#01B5C2",
    theoretical: "#FFD666",
    theoreticalBg: "#332600",
  },
};

// ============================================================
// 2. MEDIDAS — um ÚNICO objeto por conjunto, fácil de trocar
//    (Portão A ajuste b: barra de navegação isolada em m3_medidas)
// ============================================================

/** Medidas do Material 3 verificadas (fonte: tokens v6_1_0 do diretório
 * gen_defaults do Flutter — ver M3_SPEC_EXTRACT.md). Toda alteração aqui
 * exige fonte registrada ou ORIGEM_PROJETO. */
export const m3_medidas = {
  navigationBar: {
    altura: 80,
    icone: 24,
    indicadorLargura: 64,
    indicadorAltura: 32,
    gapIconeRotulo: 4, // ORIGEM_PROJETO (não publicado em v6_1_0)
    destinosMin: 3,
    destinosMax: 5,
    elevacao: 2,
  },
  topAppBar: {
    altura: 64,
    icone: 24,
    alvoVoltar: 48,
  },
  searchBar: {
    altura: 56,
    icone: 24,
    alvo: 48,
  },
  botao: {
    altura: 40,
    icone: 18,
    paddingHorizontal: 16, // ORIGEM_PROJETO
    alvo: 48,
  },
  iconButton: {
    icone: 24,
    alvo: 48,
  },
  listItem: {
    altura1Linha: 56,
    altura2Linhas: 72,
    altura3Linhas: 88,
    espacoLiderTrailing: 16,
    icone: 24,
  },
  chip: {
    altura: 32,
    icone: 18,
    alvo: 48,
  },
  segmentedButton: {
    altura: 40,
    borda: 1, // ORIGEM_PROJETO
    paddingHorizontalMin: 12, // ORIGEM_PROJETO
    gapIconeRotulo: 8, // ORIGEM_PROJETO
    alvo: 48,
  },
  bottomSheet: {
    cantosSuperiores: 28,
    alcaLargura: 32,
    alcaAltura: 4,
    alcaFaixa: 48, // ORIGEM_PROJETO
    elevacao: 1,
  },
  divider: {
    espessura: 1,
  },
  sectionHeader: {
    altura: 40,
    espacoSuperior: 24,
  },
  filterChipRow: {
    gap: 8,
  },
  timelineStop: {
    noGrande: 20,
    noPequeno: 14,
    anel: 2,
    conector: 2,
    gapLinha: 12,
  },
} as const;

/** Escala de FORMA do Material 3 (dp). */
export const forma = {
  none: 0,
  extraPequena: 4,
  pequena: 8,
  media: 12,
  grande: 16,
  extraGrande: 28,
  full: 999,
} as const;

/** Estado M3 (opacidade da camada de estado). */
export const estadoM3 = {
  hover: 0.08,
  foco: 0.1,
  pressionado: 0.1,
  arrastado: 0.16,
  desabilitadoConteudo: 0.38,
  desabilitadoContainer: 0.12,
} as const;

/** Movimento M3. */
export const movimento = {
  easingStandard: [0.2, 0, 0, 1] as const,
  duracao: { toque: 200, transicao: 300 },
} as const;

/** Alvo de toque mínimo. 48 verificado (MaterialTapTargetSize, api.flutter.dev);
 * piso de 44 só onde a spec manda (rótulo de aba). */
export const toque = { minimo: 48, piso: 44 } as const;

// ============================================================
// 3. TIPOGRAFIA — escala M3 de 15 estilos (dp/line-height/peso/tracking)
//    Família = fonte do SISTEMA (ver fontes.ts); nunca literal aqui.
// ============================================================

export interface EstiloTexto {
  readonly tamanho: number;
  readonly linhaAltura: number;
  readonly peso: "400" | "500" | "700";
  readonly tracking: number;
}

export const tiposM3 = {
  displayLarge: { tamanho: 57, linhaAltura: 64, peso: "400", tracking: -0.25 },
  displayMedium: { tamanho: 45, linhaAltura: 52, peso: "400", tracking: 0 },
  displaySmall: { tamanho: 36, linhaAltura: 44, peso: "400", tracking: 0 },
  headlineLarge: { tamanho: 32, linhaAltura: 40, peso: "400", tracking: 0 },
  headlineMedium: { tamanho: 28, linhaAltura: 36, peso: "400", tracking: 0 },
  headlineSmall: { tamanho: 24, linhaAltura: 32, peso: "400", tracking: 0 },
  titleLarge: { tamanho: 22, linhaAltura: 28, peso: "400", tracking: 0 },
  titleMedium: { tamanho: 16, linhaAltura: 24, peso: "500", tracking: 0.15 },
  titleSmall: { tamanho: 14, linhaAltura: 20, peso: "500", tracking: 0.1 },
  bodyLarge: { tamanho: 16, linhaAltura: 24, peso: "400", tracking: 0.5 },
  bodyMedium: { tamanho: 14, linhaAltura: 20, peso: "400", tracking: 0.25 },
  bodySmall: { tamanho: 12, linhaAltura: 16, peso: "400", tracking: 0.4 },
  labelLarge: { tamanho: 14, linhaAltura: 20, peso: "500", tracking: 0.1 },
  labelMedium: { tamanho: 12, linhaAltura: 16, peso: "500", tracking: 0.5 },
  labelSmall: { tamanho: 11, linhaAltura: 16, peso: "500", tracking: 0.5 },
} as const satisfies Record<string, EstiloTexto>;

/** Papéis tipográficos do DOMÍNIO Flavos (origem: projeto). */
export const tiposDominio = {
  /** numeral gigante do NextDepartureCard — 28/700 tabular (decisão do projeto) */
  numeralHero: { tamanho: 28, linhaAltura: 34, peso: "700", tracking: 0 },
  /** numeral do LineBadge: SEMPRE >= 19px e peso 700 (regra WCAG texto grande) */
  numeralBadge: { tamanho: 20, linhaAltura: 26, peso: "700", tracking: 0 },
} as const satisfies Record<string, EstiloTexto>;

// ============================================================
// 4. ESPAÇO e SOMBRA
// ============================================================

/** Escala de espaço da grade de 4. */
export const espaco = { xs: 4, s: 8, m: 12, base: 16, g: 24, gg: 32, xg: 48 } as const;

/** Elevação M3: tonal para tudo; a ÚNICA sombra real é o sheet (level1). */
export const sombra = {
  sheet: {
    elevacao: 1,
    shadowColor: "#04122E",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
} as const;

// ============================================================
// 5. COMPATIBILIDADE — nomes antigos (fatias anteriores).
//    Mantidos para não quebrar consumidores; o tema novo consome os
//    papéis M3. Nada novo deve nascer usando estes nomes.
// ============================================================

export interface Paleta {
  readonly primary: string;
  readonly onPrimary: string;
  readonly surface: string;
  readonly surfaceAlt: string;
  readonly border: string;
  readonly text: string;
  readonly textMuted: string;
  readonly verdeMarca: string;
  readonly verdeTexto: string;
  readonly aquaDecorativo: string;
  readonly theoretical: string;
  readonly theoreticalBg: string;
  readonly danger: string;
  readonly dangerBg: string;
}

/** Alias legado → papéis M3 + identidade. `border`/`surfaceAlt` passam a
 * apontar para outlineVariant/surfaceContainerLow (Portão A §2). */
export const cores: { readonly claro: Paleta; readonly escuro: Paleta } = {
  claro: {
    primary: papeis.claro.primary,
    onPrimary: papeis.claro.onPrimary,
    surface: papeis.claro.surface,
    surfaceAlt: papeis.claro.surfaceContainerLow,
    border: papeis.claro.outlineVariant,
    text: papeis.claro.onSurface,
    textMuted: papeis.claro.onSurfaceVariant,
    verdeMarca: identidade.claro.verdeMarca,
    verdeTexto: identidade.claro.verdeTexto,
    aquaDecorativo: identidade.claro.aquaDecorativo,
    theoretical: identidade.claro.theoretical,
    theoreticalBg: identidade.claro.theoreticalBg,
    danger: papeis.claro.error,
    dangerBg: papeis.claro.errorContainer,
  },
  escuro: {
    primary: papeis.escuro.primary,
    onPrimary: papeis.escuro.onPrimary,
    surface: papeis.escuro.surface,
    surfaceAlt: papeis.escuro.surfaceContainerLow,
    border: papeis.escuro.outlineVariant,
    text: papeis.escuro.onSurface,
    textMuted: papeis.escuro.onSurfaceVariant,
    verdeMarca: identidade.escuro.verdeMarca,
    verdeTexto: identidade.escuro.verdeTexto,
    aquaDecorativo: identidade.escuro.aquaDecorativo,
    theoretical: identidade.escuro.theoretical,
    theoreticalBg: identidade.escuro.theoreticalBg,
    danger: papeis.escuro.error,
    dangerBg: papeis.escuro.errorContainer,
  },
};

/** Raio legado → escala de forma M3. */
export const raio = {
  placa: forma.pequena,
  controles: forma.media,
  cartao: forma.grande,
  pill: forma.full,
} as const;

/** Tipografia legada → estilos M3 equivalentes. */
export const tipografia = {
  display: tiposM3.headlineMedium.tamanho,
  titulo: tiposM3.titleLarge.tamanho,
  corpo: tiposM3.bodyLarge.tamanho,
  legenda: tiposM3.bodySmall.tamanho,
} as const;

/** Regra do LineBadge (numeral de linha): SEMPRE >= 19px, peso 700 —
 * texto grande e negrito segundo WCAG, logo limiar 3:1 sobre o fundo do
 * feed; se um contexto futuro renderizar menor que 19px, o limiar volta
 * a 4.5 (parâmetro da função de contraste). Função utilitária está em
 * src/ui/contraste_badge.ts (fatia de componentes); nenhuma cor aqui. */
