// Tokens do Flavos Bus (doc/design/DIRECAO.md) — único lugar com valores
// fixos; componentes nunca declaram cor ou tamanho solto. Âncora Swiss:
// papel branco puro (leitura ao sol), tinta preta, hairline estruturante e
// UM acento (Klein Blue). Estados usam cores semânticas SEMPRE com palavra.

import { useColorScheme } from "react-native";

export interface Tema {
  readonly escuro: boolean;
  readonly papel: string;
  readonly papel2: string;
  readonly tinta: string;
  readonly tinta2: string;
  readonly hairline: string;
  readonly acento: string;
  readonly acentoSobre: string;
  readonly ok: string;
  readonly atencao: string;
  readonly atencaoFundo: string;
  readonly erro: string;
  readonly erroFundo: string;
}

export const temaClaro: Tema = {
  escuro: false,
  papel: "#FFFFFF",
  papel2: "#F7F7F8",
  tinta: "#000000",
  tinta2: "#54565B",
  hairline: "#E5E5E7",
  acento: "#002FA7",
  acentoSobre: "#FFFFFF",
  ok: "#1B7A3D",
  atencao: "#5A3A00",
  atencaoFundo: "#FFD666",
  erro: "#B00020",
  erroFundo: "#FCEAED",
};

export const temaEscuro: Tema = {
  escuro: true,
  papel: "#000000",
  papel2: "#101012",
  tinta: "#FFFFFF",
  tinta2: "#C7C9CE",
  hairline: "#2A2A2E",
  acento: "#7B9DFF",
  acentoSobre: "#000000",
  ok: "#5FD38D",
  atencao: "#FFC24B",
  atencaoFundo: "#332600",
  erro: "#FF8A98",
  erroFundo: "#2E0D12",
};

export function useTema(): Tema {
  const esquema = useColorScheme();
  return esquema === "dark" ? temaEscuro : temaClaro;
}

export const espaco = { xs: 4, s: 8, m: 12, base: 16, g: 24, gg: 32, xg: 48 } as const;

export const toque = { minimo: 48 } as const;
export const raio = { placa: 8, cartao: 16 } as const;

/** Paper de exibição dos números (placa de destino) — Android tem a
 * grotesca condensada do sistema; iOS usa a system com peso alto. */
export const fonteNumeros = { fontFamily: "sans-serif-condensed", fontWeight: "700" } as const;
