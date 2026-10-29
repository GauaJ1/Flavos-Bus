// Botão base: alvo 48+, feedback de toque (escala 0,96 ≤120ms) e rótulo
// claro de ação — nunca só cor.
import { Pressable, StyleSheet, Text } from "react-native";
import type { ViewStyle } from "react-native";
import { espaco, toque, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export function Botao({
  rotulo,
  aoPressionar,
  variante = "secundario",
  estilo,
}: {
  readonly rotulo: string;
  readonly aoPressionar: () => void;
  readonly variante?: "primario" | "secundario";
  readonly estilo?: ViewStyle;
}) {
  const tema = useTema();
  const primario = variante === "primario";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilosDe(tema, primario).base,
        pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
        estilo,
      ]}
    >
      <Text style={estilosDe(tema, primario).texto}>{rotulo}</Text>
    </Pressable>
  );
}

function estilosDe(tema: Tema, primario: boolean) {
  return StyleSheet.create({
    base: {
      minHeight: toque.minimo,
      paddingHorizontal: espaco.g,
      borderRadius: raioBotao,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: primario ? tema.tinta : tema.hairline,
      backgroundColor: primario ? tema.tinta : tema.papel,
    },
    texto: {
      color: primario ? (tema.escuro ? "#000000" : "#FFFFFF") : tema.tinta,
      fontSize: 16,
      fontWeight: "600",
    },
  });
}

const raioBotao = 8;
