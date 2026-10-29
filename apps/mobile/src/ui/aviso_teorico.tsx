// AVISO de horários teóricos — nunca descartável, sempre no topo (exigência
// do documento do projeto e do passo de design). Âmbar sistêmico + texto
// forte; palavra junto à cor, AA em claro e escuro.
import { StyleSheet, Text, View } from "react-native";
import { espaco, useTema, type Tema } from "@/tema/theme";
import { IconeAviso } from "./icones";
import * as React from "react";

export function AvisoTeorico() {
  const tema = useTema();
  return (
    <View
      style={estilosDe(tema).faixa}
      accessibilityRole="alert"
      accessibilityLabel="Horários teóricos. O ônibus real pode atrasar; o aplicativo não mostra tempo real."
    >
      <IconeAviso cor={tema.atencao} />
      <View style={estilosDe(tema).textoBloco}>
        <Text style={estilosDe(tema).texto}>
          Horários teóricos (programados). O ônibus real pode atrasar — este app
          não mostra tempo real.
        </Text>
      </View>
    </View>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    faixa: {
      backgroundColor: tema.atencaoFundo,
      borderBottomWidth: 1,
      borderBottomColor: tema.hairline,
      padding: espaco.m,
      flexDirection: "row",
      gap: espaco.s,
      alignItems: "center",
    },
    textoBloco: { flex: 1 },
    texto: { color: tema.atencao, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  });
}
