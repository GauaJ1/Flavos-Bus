// Campo de busca (tela Buscar linhas): alto, alvo de toque confortável, com
// rótulo acessível e resposta imediata ao digitar (busca é SQL local).
import { StyleSheet, TextInput, View } from "react-native";
import { espaco, raio, useTema, type Tema } from "@/tema/theme";
import { IconeBusca } from "./icones";
import * as React from "react";

export function CampoBusca({
  valor,
  onChangeText,
}: {
  readonly valor: string;
  readonly onChangeText: (novo: string) => void;
}) {
  const tema = useTema();
  return (
    <View style={estilosDe(tema).moldura}>
      <IconeBusca cor={tema.tinta2} />
      <TextInput
        style={estilosDe(tema).campo}
        value={valor}
        onChangeText={onChangeText}
        placeholder="Buscar por número ou nome (ex.: 509, Tambaú)"
        placeholderTextColor={tema.tinta2}
        accessibilityLabel="Buscar linha por número ou nome"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        inputMode="search"
      />
    </View>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    moldura: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaco.s,
      minHeight: 56,
      paddingHorizontal: espaco.m,
      borderWidth: 1,
      borderColor: tema.hairline,
      borderRadius: raio.placa,
      backgroundColor: tema.papel2,
    },
    campo: { flex: 1, color: tema.tinta, fontSize: 16 },
  });
}
