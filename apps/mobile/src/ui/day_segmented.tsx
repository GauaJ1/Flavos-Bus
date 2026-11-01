// DaySegmented — wrapper FINO do Segmented genérico (fatia 3, B4):
// só traduz Útil/Sábado/Domingo e os tipos de dia do GTFS.
import type { TipoDia } from "@flavos/shared";
import { Segmented, type OpcaoSegmented } from "./segmented";
import * as React from "react";

export type SegmentoDia = "util" | "sabado" | "domingo";

const ROTULOS: Record<SegmentoDia, string> = { util: "Útil", sabado: "Sábado", domingo: "Domingo" };

/** Tipos de dia do GTFS cobertos por cada segmento (calendar). */
export const DIAS_DO_SEGMENTO: Record<SegmentoDia, readonly TipoDia[]> = {
  util: ["segunda", "terca", "quarta", "quinta", "sexta"],
  sabado: ["sabado"],
  domingo: ["domingo"],
};

export function segmentoDoDia(tipo: TipoDia): SegmentoDia {
  for (const [seg, dias] of Object.entries(DIAS_DO_SEGMENTO) as [SegmentoDia, readonly TipoDia[]][]) {
    if (dias.includes(tipo)) return seg;
  }
  return "util";
}

const ORDEM: readonly SegmentoDia[] = ["util", "sabado", "domingo"];

export function DaySegmented({
  valor,
  aoEscolher,
}: {
  readonly valor: SegmentoDia;
  readonly aoEscolher: (v: SegmentoDia) => void;
}) {
  const opcoes: readonly OpcaoSegmented<SegmentoDia>[] = ORDEM.map((seg) => ({
    chave: seg,
    rotulo: ROTULOS[seg],
    acessivel: `Horários de dia ${ROTULOS[seg]}`,
  }));
  return (
    <Segmented opcoes={opcoes} valor={valor} aoEscolher={aoEscolher} acessibilidadeGrupo="Tipo de dia" />
  );
}
