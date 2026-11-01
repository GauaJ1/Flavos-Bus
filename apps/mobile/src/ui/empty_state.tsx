// EmptyState — estado vazio com UMA ação clara (regra das âncoras):
// ícone (Phosphor) + título + texto + ação opcional. Nunca dado inventado
// para preencher; o texto diz o que acontece e o que fazer.
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Icon } from "phosphor-react-native";
import { forma, espaco, raio, toque, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export function EmptyState({
  icone,
  titulo,
  texto,
  acaoRotulo,
  aoAcionar,
}: {
  readonly icone: Icon;
  readonly titulo: string;
  readonly texto: string;
  readonly acaoRotulo?: string;
  readonly aoAcionar?: () => void;
}) {
  const tema = useTema();
  const Icone = icone;
  return (
    <View style={estilos(tema).centro}>
      <View style={estilos(tema).circulo}>
        <Icone size={28} weight="duotone" color={tema.textMuted} />
      </View>
      <Text style={estilos(tema).titulo}>{titulo}</Text>
      <Text style={estilos(tema).texto}>{texto}</Text>
      {acaoRotulo !== undefined && aoAcionar !== undefined ? (
        <Pressable
          accessibilityRole="button"
          onPress={aoAcionar}
          style={({ pressed }) => [estilos(tema).acao, pressed && { opacity: 0.8 }]}
        >
          <Text style={estilos(tema).acaoTexto}>{acaoRotulo}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    centro: {
      alignItems: "center",
      gap: espaco.m,
      padding: espaco.gg,
      paddingTop: espaco.gg * 2,
    },
    circulo: {
      width: 56,
      height: 56,
      borderRadius: forma.extraGrande,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    titulo: { color: tema.text, fontSize: 17, fontWeight: "700", textAlign: "center" },
    texto: { color: tema.textMuted, fontSize: 14, lineHeight: 20, textAlign: "center" },
    acao: {
      minHeight: toque.minimo,
      paddingHorizontal: espaco.g,
      borderRadius: raio.controles,
      backgroundColor: tema.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    acaoTexto: { color: tema.onPrimary, fontSize: 15, fontWeight: "700" },
  });
}
