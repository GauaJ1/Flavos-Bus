// Segmented genérico (fatia 3, B4): largura total, opções flex:1, >=44,
// ativo primary+onPrimary+peso 800. DaySegmented é wrapper fino deste.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { forma, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export interface OpcaoSegmented<T extends string> {
  readonly chave: T;
  readonly rotulo: string;
  readonly acessivel?: string;
}

export function Segmented<T extends string>({
  opcoes,
  valor,
  aoEscolher,
  acessibilidadeGrupo,
}: {
  readonly opcoes: readonly OpcaoSegmented<T>[];
  readonly valor: T;
  readonly aoEscolher: (v: T) => void;
  /** label do grupo (role tablist). */
  readonly acessibilidadeGrupo: string;
}) {
  const tema = useTema();
  return (
    <View style={estilos(tema).trilha} accessibilityRole="tablist" accessibilityLabel={acessibilidadeGrupo}>
      {opcoes.map((op) => {
        const ativo = op.chave === valor;
        return (
          <Pressable
            key={op.chave}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={op.acessivel ?? op.rotulo}
            onPress={() => aoEscolher(op.chave)}
            style={({ pressed }) => [estilos(tema).item, ativo && estilos(tema).itemAtivo, pressed && { opacity: 0.75 }]}
          >
            <Text style={[estilos(tema).texto, ativo && estilos(tema).textoAtivo]}>{op.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    trilha: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: tema.border,
      borderRadius: forma.media,
      backgroundColor: tema.surfaceAlt,
      padding: 2,
    },
    item: {
      flex: 1,
      minHeight: 44,
      borderRadius: forma.pequena,
      justifyContent: "center",
      alignItems: "center",
      margin: 1,
    },
    itemAtivo: { backgroundColor: tema.primary },
    texto: { fontSize: 15, color: tema.text, fontWeight: "600" },
    textoAtivo: { color: tema.onPrimary, fontWeight: "800" },
  });
}
