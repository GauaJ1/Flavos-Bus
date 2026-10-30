// Skeleton — formas dos componentes enquanto o banco carrega.
// SEM animação em loop (regra do doc de movimento + "reduzir movimento"):
// blocos na cor surfaceAlt com borda hairline, estáticos; o leitor de tela
// recebe a região como ocupada ("carregando") por LiveRegion do caller.
import { StyleSheet, View } from "react-native";
import { espaco, raio, toque, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export type FormaSkeleton = "busca" | "proxima" | "stopRow" | "badge" | "textoLinha";

export function Skeleton({ forma }: { readonly forma: FormaSkeleton }) {
  const tema = useTema();
  const bloco = estilos(tema).bloco;
  switch (forma) {
    case "busca":
      return (
        <View
          accessibilityLabel="carregando busca"
          style={[bloco, { height: toque.minimo, borderRadius: raio.controles }]}
        />
      );
    case "proxima":
      return (
        <View style={[bloco, { borderRadius: raio.cartao, padding: espaco.base, gap: espaco.s }]}>
          <View style={[bloco, { width: "34%", height: 14, backgroundColor: tema.surface }]} />
          <View style={[bloco, { width: "58%", height: 40, backgroundColor: tema.surface }]} />
          <View style={[bloco, { width: "22%", height: 14, backgroundColor: tema.surface }]} />
        </View>
      );
    case "stopRow":
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: espaco.m }}>
          <View style={[bloco, { width: 64, height: 27, borderRadius: raio.placa }]} />
          <View style={[bloco, { flex: 1, height: 18 }]} />
        </View>
      );
    case "badge":
      return <View style={[bloco, { width: 44, height: 27, borderRadius: raio.placa }]} />;
    case "textoLinha":
      return <View style={[bloco, { height: 14, width: "70%" }]} />;
  }
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    // nunca "piscando": o estado de carregar É informação, não show.
    bloco: {
      backgroundColor: tema.surfaceAlt,
      borderColor: tema.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: raio.controles,
    },
  });
}
