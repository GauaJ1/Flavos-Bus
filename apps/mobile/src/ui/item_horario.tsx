// Item de horário do quadro: tabular, alvo 32+ em grade de colunas; o
// horário já passado fica esmaecido (só cor/transparência é insuficiente —
// junto com opacidade usamos rótulo "passou" no próximo, nunca cor sozinha).
import { StyleSheet, Text, View } from "react-native";
import { forma, espaco, fonteNumeros, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export function ItemHorario({
  hora,
  passado,
}: {
  readonly hora: string;
  readonly passado: boolean;
}) {
  const tema = useTema();
  return (
    <View
      style={[estilosDe(tema).fita, passado && { opacity: 0.45 }]}
      accessibilityLabel={passado ? `${hora}, já passou` : hora}
    >
      <Text style={[estilosDe(tema).hora, fonteNumeros]}>{hora.slice(0, 5)}</Text>
    </View>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    fita: {
      minWidth: 64,
      minHeight: 40,
      paddingHorizontal: espaco.s + 2,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: forma.pequena,
      borderWidth: 1,
      borderColor: tema.hairline,
      backgroundColor: tema.papel2,
    },
    hora: { fontSize: 17, color: tema.tinta, fontVariant: ["tabular-nums"] },
  });
}
