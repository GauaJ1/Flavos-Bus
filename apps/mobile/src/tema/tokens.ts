// ============================================================
// TOKENS DO FLAVOS BUS — ÚNICA FONTE DE VALORES VISUAIS
// Nenhuma cor, espaçamento ou sombra fora deste arquivo.
// `theme.ts` apenas reexporta e mantém a ponte de nomes antigos.
//
// Origem das cores: medição por região da logo (paleta_debug.png,
// .claude/paleta_debug.png): navy do corpo #05337B, navy "Flavos"
// #012D74 (mesma família, checagem Δ<=3), verde da palavra "Bus"
// #4AA63E, aqua das ondas #01B5C2 (gradiente #35D1D9–#0297A4).
//
// REGRAS DE USO (pactos do redesign):
// - verdeMarca JAMAIS transmite estado semântico (erro/aviso/sucesso);
//   é identidade: preenchimento com TEXTO ESCURO por cima (6.01:1 sobre
//   o verde; branco reprovou: 3.08), splash e ícone do app.
//   No claro, verde INFORMATIVO (texto/ícone pequeno) usa verdeTexto.
//   No escuro, o próprio verdeMarca serve como texto (6.26:1).
// - aquaDecorativo: só grifo de marca (splash/arte). Nunca carrega
//   informação sozinho; nunca como texto no claro.
// - theoretical* é o âmbar RESERVADO ao TheoreticalBadge (valores
//   calculados p/ AA 7.06/10.62). Nenhum outro componente deve importar
//   theoretical/theoreticalBg (grep de verificação por fatia).
// - success NÃO existe aqui de propósito (YAGNI): o MVP não tem tela que
//   confirme sucesso. Quando um uso real nascer, o estado vem SEMPRE como
//   ícone (check) + palavra — nunca só pela cor; hue >= 140° para não
//   competir com o verde da marca (hue 116°).
// - logoTile é FIXO nos dois temas: o emblema nasceu em fundo branco e a
//   marca nunca é recolorida; no tema escuro ele desencaixa o emblema do
//   fundo (navy sobre logoTile = 11.74:1; logoTile sobre #0B0E17 = 19.28:1).
// ============================================================

/** Fundo do tile que carrega o emblema no tema escuro (e do ícone do app).
 * Fixo e imune à troca de tema por design. */
export const logoTile = "#FFFFFF";

export interface Paleta {
  readonly primary: string; // navy do corpo da logo (#05337B medido)
  readonly onPrimary: string;
  readonly surface: string;
  readonly surfaceAlt: string;
  readonly border: string;
  readonly text: string;
  readonly textMuted: string;
  /** verde da marca (palavra "Bus", medido). No claro: só PREENCHIMENTO
   * com texto escuro por cima/ícones grandes de marca; no escuro pode
   * também ser texto (6.26:1 sobre o fundo escuro). */
  readonly verdeMarca: string;
  /** verde quando é TEXTO/ícone informativo pequeno no claro (AA 4.69). */
  readonly verdeTexto: string;
  /** ciano das ondas — decorativo (nunca informativo sozinho). */
  readonly aquaDecorativo: string;
  readonly theoretical: string; // RESERVADO ao TheoreticalBadge
  readonly theoreticalBg: string;
  readonly danger: string;
  readonly dangerBg: string;
}

export const cores: { readonly claro: Paleta; readonly escuro: Paleta } = {
  claro: {
    primary: "#05337B",
    onPrimary: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceAlt: "#F5F8FB",
    border: "#DBE3EC",
    text: "#0D1322",
    textMuted: "#46536B",
    verdeMarca: "#4AA63E",
    verdeTexto: "#397E2F",
    aquaDecorativo: "#01B5C2",
    theoretical: "#6B4A00",
    theoreticalBg: "#FFEFC2",
    danger: "#B00020",
    dangerBg: "#FCEAED",
  },
  escuro: {
    primary: "#9DB8F5",
    onPrimary: "#04122E",
    surface: "#0B0E17",
    surfaceAlt: "#141926",
    border: "#242C3E",
    text: "#F2F5FA",
    textMuted: "#A8B2C6",
    verdeMarca: "#4AA63E",
    verdeTexto: "#4AA63E",
    aquaDecorativo: "#01B5C2",
    theoretical: "#FFD666",
    theoreticalBg: "#332600",
    danger: "#FF8A98",
    dangerBg: "#2E0D12",
  },
};

// ---- escala não-colorida (migra origens do antigo theme.ts) ----
export const espaco = { xs: 4, s: 8, m: 12, base: 16, g: 24, gg: 32, xg: 48 } as const;

export const toque = { minimo: 48 } as const;

export const raio = { placa: 8, controles: 12, cartao: 16, pill: 999 } as const;

/** Tipografia: 1 família (system), 4 tamanhos; corpo nunca menor que 13. */
export const tipografia = { display: 28, titulo: 20, corpo: 16, legenda: 13 } as const;

/** Paper de exibição dos números (placa de destino) — Android tem a
 * grotesca condensada do sistema; iOS usa a system com peso alto. */
export const fonteNumeros = { fontFamily: "sans-serif-condensed", fontWeight: "700" } as const;

/** Elevação: um único nível (BottomSheet). Sem sombras decorativas. */
export const sombra = {
  sheet: {
    elevacao: 12,
    shadowColor: "#04122E",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
} as const;

/** Regra do LineBadge (numeral de linha): SEMPRE >= 19px, peso 700 —
 * texto grande e negrito segundo WCAG, logo limiar 3:1 sobre o fundo do
 * feed; se um contexto futuro renderizar menor que 19px, o limiar volta
 * a 4.5 (parâmetro da função de contraste). Função utilitária está em
 * src/ui/contraste_badge.ts (fatia de componentes); nenhuma cor aqui. */
