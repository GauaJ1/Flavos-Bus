// LineBadge — placa compacta do NUMERAL da linha (feed: color/text_color).
// Regra do doc: numeral SEMPRE >= 19px e peso 700 (texto grande+negrito
// WCAG ⇒ limiar 3:1); a escolha do texto é automática (corDoBadge) e NUNCA
// muda o fundo, que é o dado oficial do feed. Nenhuma cor local: tudo via
// tokens (tema) ou par vindo do feed pelo caller/prova.
import { StyleSheet, Text, View } from "react-native";
import { espaco, fonteNumeros, raio } from "@/tema/theme";
import { corDoBadge } from "@/dados/contraste_badge";
import * as React from "react";

export function LineBadge({
  numero,
  corDoFeed,
  corTextoDoFeed,
}: {
  readonly numero: string;
  /** color do feed (sem "#", ex.: "0000FF") — fundo oficial. */
  readonly corDoFeed: string;
  /** text_color do feed — ponto de partida da regra 3:1. */
  readonly corTextoDoFeed: string;
}) {
  const paleta = corDoBadge(corDoFeed, corTextoDoFeed);
  return (
    <View
      accessibilityLabel={`linha ${numero}`}
      style={[estilos.placa, { backgroundColor: paleta.fundo }]}
    >
      <Text style={[estilos.numero, fonteNumeros, { color: paleta.texto }]} numberOfLines={1}>
        {numero}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  placa: {
    borderRadius: raio.placa,
    paddingHorizontal: espaco.s + 2, // 10
    paddingVertical: 3,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  // regra dura: >= 19px, weight 700 vem de fonteNumeros (tokens)
  numero: {
    fontSize: 19,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.2,
  },
});
