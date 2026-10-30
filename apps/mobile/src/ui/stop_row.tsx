// StopRow — linha de resultado de parada: nome, distância a pé opcional e
// os LineBadges das linhas que passam (quebra de linha, no máximo N com "+X").
import { StyleSheet, Text, View } from "react-native";
import { espaco, raio, useTema, type Tema } from "@/tema/theme";
import { LineBadge } from "@/ui/line_badge";
import * as React from "react";

export interface ChipDeLinha {
  readonly numero: string;
  /** color do feed (sem "#") */
  readonly cor: string;
  /** text_color do feed (sem "#") */
  readonly corTexto: string;
}

export function StopRow({
  nome,
  distanciaMin = null,
  linhas,
  maxChips = 4,
}: {
  readonly nome: string;
  /** distância a pé estimada em minutos (opcional — nunca inventada). */
  readonly distanciaMin?: number | null;
  readonly linhas: readonly ChipDeLinha[];
  /** máximo de badges antes do "+X" (doc Moovit §3). */
  readonly maxChips?: number;
}) {
  const tema = useTema();
  const visiveis = linhas.slice(0, maxChips);
  const extras = linhas.length - visiveis.length;
  return (
    <View style={estilos(tema).linha} accessibilityLabel={`${nome}${distanciaMin !== null ? `, ${distanciaMin} minutos a pé` : ""}${linhas.length > 0 ? `. Linhas: ${linhas.map((l) => l.numero).join(", ")}.` : "."}`}>
      <View style={estilos(tema).textos}>
        <Text style={estilos(tema).nome} numberOfLines={2}>
          {nome}
        </Text>
        {distanciaMin !== null ? (
          <Text style={estilos(tema).distancia}>{distanciaMin} min a pé</Text>
        ) : null}
      </View>
      <View style={estilos(tema).chips}>
        {visiveis.map((l) => (
          <LineBadge key={`${l.numero}-${l.cor}`} numero={l.numero} corDoFeed={l.cor} corTextoDoFeed={l.corTexto} />
        ))}
        {extras > 0 ? (
          <View style={estilos(tema).mais}>
            <Text style={[estilos(tema).maisTexto]}>+{extras}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    linha: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaco.m,
      paddingVertical: espaco.m,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tema.border,
    },
    textos: { flex: 1, gap: 2 },
    nome: { color: tema.text, fontSize: 16, fontWeight: "500" },
    distancia: { color: tema.textMuted, fontSize: 13 },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: espaco.xs,
      maxWidth: 220,
    },
    mais: {
      borderRadius: raio.placa,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 3,
      justifyContent: "center",
    },
    maisTexto: { color: tema.textMuted, fontSize: 13, fontWeight: "700" },
  });
}
