// TimelineStop — ponto + conectora vertical do itinerário (doc Moovit §3).
// Variantes: primeira (sem conectora acima), intermediária, última (conectora
// "parada" acima). A conectora é ESTRUTURA (hairline), nunca decorativa.
import { StyleSheet, Text, View } from "react-native";
import { espaco, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export function TimelineStop({
  nome,
  horario,
  variante = "intermediaria",
  atual = false,
}: {
  readonly nome: string;
  /** horário teórico na parada ("HH:MM") — opcional (parada sem horário). */
  readonly horario?: string;
  readonly variante?: "primeira" | "intermediaria" | "ultima";
  /** a parada do momento do usuário (ponto cheio + peso), se há viagem. */
  readonly atual?: boolean;
}) {
  const tema = useTema();
  return (
    <View style={estilos(tema).linha}>
      <View style={estilos(tema).trilho}>
        {variante === "primeira" ? (
          <View style={estilos(tema).espacoAcima} />
        ) : (
          <View style={estilos(tema).conectora} />
        )}
        <View style={[estilos(tema).ponto, atual && estilos(tema).pontoAtual]} />
        {variante === "ultima" ? null : <View style={estilos(tema).conectora} />}
      </View>
      <Text style={[estilos(tema).nome, atual && estilos(tema).nomeAtual]} numberOfLines={2}>
        {nome}
      </Text>
      {horario !== undefined && horario.length > 0 ? (
        <Text style={estilos(tema).horario}>{horario}</Text>
      ) : (
        <Text style={estilos(tema).horarioNulo} />
      )}
    </View>
  );
}

const PONTO = 10;

function estilos(tema: Tema) {
  return StyleSheet.create({
    linha: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: espaco.m,
      minHeight: 40,
    },
    trilho: {
      width: PONTO,
      alignItems: "center",
    },
    espacoAcima: { height: espaco.s },
    conectora: {
      width: 2,
      flex: 1,
      backgroundColor: tema.border,
      borderRadius: 1,
    },
    ponto: {
      width: PONTO,
      height: PONTO,
      borderRadius: PONTO / 2,
      borderWidth: 2,
      borderColor: tema.primary,
      backgroundColor: tema.surface,
    },
    pontoAtual: {
      backgroundColor: tema.primary,
    },
    nome: {
      flex: 1,
      color: tema.text,
      fontSize: 15,
      lineHeight: 20,
      paddingVertical: espaco.s,
    },
    nomeAtual: { fontWeight: "700" },
    horario: {
      color: tema.textMuted,
      fontSize: 14,
      fontVariant: ["tabular-nums"],
      paddingVertical: espaco.s,
    },
    horarioNulo: { width: 0 },
  });
}
