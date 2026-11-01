// SearchBar — busca com alvo de toque >= 48. Duas variantes:
// - "botao": abre a tela de busca (usado no topo do Início);
// - "campo": editável de fato (tela de busca).
// Sem hex aqui: cor/tema só de tokens.ts.
import { TextInput, Pressable, StyleSheet, Text, View } from "react-native";
import { MagnifyingGlass } from "phosphor-react-native";
import { espaco, raio, toque, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export function SearchBar({
  variante = "campo",
  texto,
  aoMudarTexto,
  aoAbrirBusca,
}: {
  readonly variante?: "botao" | "campo";
  readonly texto?: string;
  readonly aoMudarTexto?: (t: string) => void;
  /** variante botao: ação de navegar p/ a tela de busca. */
  readonly aoAbrirBusca?: () => void;
}) {
  const tema = useTema();
  if (variante === "botao") {
    return (
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Buscar linha ou parada"
        onPress={aoAbrirBusca}
        style={({ pressed }) => [estilos(tema).casco, pressed && { opacity: 0.85 }]}
      >
        <Lupa tema={tema} />
        <Text style={estilos(tema).placeholder}>Buscar linha ou parada</Text>
      </Pressable>
    );
  }
  return (
    <View style={estilos(tema).casco}>
      <Lupa tema={tema} />
      <TextInput
        accessibilityLabel="Buscar linha ou parada"
        placeholder="Buscar linha ou parada"
        placeholderTextColor={tema.textMuted}
        value={texto}
        onChangeText={aoMudarTexto}
        autoCapitalize="none"
        autoCorrect={false}
        style={estilos(tema).campoTexto}
      />
    </View>
  );
}

function Lupa({ tema }: { readonly tema: Tema }) {
  return <MagnifyingGlass size={20} weight="bold" color={tema.textMuted} />;
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    casco: {
      minHeight: toque.minimo,
      borderRadius: raio.controles,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surfaceAlt,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: espaco.m,
      gap: espaco.s,
    },
    placeholder: { color: tema.textMuted, fontSize: 16 },
    // o INPUT interno tinha 21px no RNW (o casco tinha 48): o alvo de toque
    // >= 44 tem que valer para o campo inteiro — checagem objetiva da fatia.
    campoTexto: { flex: 1, color: tema.text, fontSize: 16, paddingVertical: 0, minHeight: 44 },
  });
}
