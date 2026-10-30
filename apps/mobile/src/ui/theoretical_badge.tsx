// TheoreticalBadge — o ÚNICO usuário das cores theoretical* (grep de fatia).
// Estado: "Horário teórico" sempre visível onde houver horário + data do
// feed ("Atualizado em dd/mm"), vinda de InfoFeed.geradoEm/versao. A cor
// sozinha não carrega o aviso: ícone + PALAVRA (regra do doc), AA nos dois
// temas (7.06 claro / 10.62 escuro, calculados na fatia de tokens).
import { StyleSheet, Text, View } from "react-native";
import { Clock } from "phosphor-react-native";
import { espaco, raio, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

/** "2026-01-19T03:10:00Z" | "19/01/2026" | "20260119" -> "19/01". */
export function diaCurto(valor: string): string {
  const v = valor.trim();
  let d: Date | null = null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) {
    d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  } else {
    const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(v);
    if (br) d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    const compacto = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (!br && compacto) {
      d = new Date(Number(compacto[1]), Number(compacto[2]) - 1, Number(compacto[3]));
    }
  }
  if (!d || Number.isNaN(d.getTime())) return ""; // dado do feed impuro: sem inventar
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function TheoreticalBadge({
  atualizadoEm,
  rotulo = "Horário teórico",
}: {
  /** data do feed (InfoFeed.geradoEm) — o app não inventa atualidade. */
  readonly atualizadoEm: string;
  readonly rotulo?: string;
}) {
  const tema = useTema();
  const dia = diaCurto(atualizadoEm);
  return (
    <View
      style={estilos(tema).pauta}
      accessibilityLabel={`${rotulo}. Dados do feed atualizados em ${dia.length > 0 ? dia : "data indisponível"}.`}
    >
      <Clock size={16} weight="bold" color={tema.theoretical} />
      <Text style={estilos(tema).texto}>{rotulo}</Text>
      {dia.length > 0 ? (
        <Text style={estilos(tema).dia}>Atualizado em {dia}</Text>
      ) : null}
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    pauta: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaco.s,
      alignSelf: "flex-start",
      backgroundColor: tema.theoreticalBg,
      borderRadius: raio.controles,
      paddingHorizontal: espaco.s + 2, // 10
      minHeight: 32,
    },
    texto: { color: tema.theoretical, fontSize: 13, fontWeight: "700" },
    dia: { color: tema.theoretical, fontSize: 13, fontWeight: "500" },
  });
}
