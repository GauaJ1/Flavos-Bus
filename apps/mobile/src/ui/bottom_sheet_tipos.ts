// Contrato + helpers do BottomSheet — arquivo NEUTRO (sem sufixo de
// plataforma conflitante): as implementações (.web/.native) importam daqui,
// pois o Metro resolve o spec "./bottom_sheet" PARA O PRÓPRIO SUFIXADO
// (bottom_sheet.web.tsx na web), e um import circular quebraria o módulo.
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
