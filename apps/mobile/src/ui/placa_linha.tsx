// A placa de destino: o gesto memorável da identidade (doc/design/DIRECAO.md).
// Caixa preta com o número em grotesca condensada enorme — o letreiro do
// ônibus que a pessoa espera. No tema escuro a caixa fica branca e o número
// preto (a placa continua "acesa").
import { StyleSheet, Text, View } from "react-native";
import type { TextStyle } from "react-native";
import { fonteNumeros, raio, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export function PlacaLinha({
  numero,
  tamanho = "medio",
}: {
  readonly numero: string;
  readonly tamanho?: "medio" | "grande";
}) {
  const tema = useTema();
  const fonte: TextStyle =
    tamanho === "grande"
      ? { ...fonteNumeros, fontSize: 64, lineHeight: 68, letterSpacing: -1 }
      : { ...fonteNumeros, fontSize: 26, lineHeight: 30 };
  return (
    <View style={[estilosDe(tema).placa, fonte]} accessibilityLabel={`linha ${numero}`}>
      <Text style={[estilosDe(tema).numero, fonte]}>{numero}</Text>
    </View>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    placa: {
      backgroundColor: tema.tinta, // claro: caixa preta · escuro: caixa branca
      borderRadius: raio.placa,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-start",
    },
    numero: {
      color: tema.escuro ? "#000000" : "#FFFFFF",
      fontVariant: ["tabular-nums"],
    },
  });
}
