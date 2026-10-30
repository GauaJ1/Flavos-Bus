// BottomSheet — INTERFACE comum (o comportamento vive em bottom_sheet.native.tsx
// e bottom_sheet.web.tsx, resolvidos pelo Metro pelo sufixo de plataforma).
// 3 alturas de encaixe (doc Moovit §3: peek/meia/expandida). O fundo do
// painel é surface do tema; a alça é estrutural (não decorativa).
//
// reanimated/gesture-handler NÃO estão no projeto — a implementação nativa
// usa Animated + PanResponder do CORE do RN (sem dependência nova). Se uma
// futura fatia trocar por reanimated, o contrato destas props não muda.
import * as React from "react";

export interface PropsBottomSheet {
  readonly children: React.ReactNode;
  /** altura do CONTÊINER que abriga o sheet (o caller mede/limita). */
  readonly alturaContainer: number;
  /** frações do container para os encaixes (default: peek 0.22 / meia 0.45 / exp 0.86). */
  readonly encaixes?: readonly [number, number, number];
  /** chamado ao trocar de encaixe — útil p/ o caller travar o scroll interno. */
  readonly aoTrocarAltura?: (indice: 0 | 1 | 2) => void;
}

export const ENCAIXES_PADRAO: readonly [number, number, number] = [0.22, 0.45, 0.86];

export function alturasDeEncaixe(alturaContainer: number, encaixes: readonly [number, number, number]): [number, number, number] {
  return encaixes.map((f) => Math.round(alturaContainer * f)) as [number, number, number];
}

// FACHADA de plataforma: o Metro/Editura escolhe bottom_sheet.web.tsx ou
// bottom_sheet.native.tsx pelo sufixo; este base NUNCA roda — default aqui é
// só para o TypeScript resolver o import (interface idêntica nos 3).
export default function BottomSheet(_props: PropsBottomSheet): React.ReactNode {
  throw new Error("importar a implementação da plataforma (.web/.native)");
}
