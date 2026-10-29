// Cartão de resultado de busca: placa de número à esquerda (diferenciador),
// nome + resumo honesto (que inclui "operadora declarada ANO: ..." quando
// existe no dado) à direita. Alvo de toque 48+.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { espaco, useTema, type Tema } from "@/tema/theme";
import type { Linha } from "@flavos/shared";
import { PlacaLinha } from "./placa_linha";
import { IconeSeta } from "./icones";
import * as React from "react";

export function CartaoLinha({
  linha,
  aoAbrir,
}: {
  readonly linha: Linha;
  readonly aoAbrir: (linha: Linha) => void;
}) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir linha ${linha.numero}, ${linha.nome}`}
      onPress={() => aoAbrir(linha)}
      android_ripple={{ color: tema.hairline }}
      style={({ pressed }) => [estilosDe(tema).cartao, pressed && { opacity: 0.7 }]}
    >
      <PlacaLinha numero={linha.numero} />
      <View style={estilosDe(tema).textos}>
        <Text style={estilosDe(tema).nome} numberOfLines={1}>
          {linha.nome}
        </Text>
        <Text style={estilosDe(tema).resumo} numberOfLines={2}>
          {resumoHonesto(linha)}
        </Text>
      </View>
      <IconeSeta cor={tema.tinta2} />
    </Pressable>
  );
}

/** Nada de dado inventado: mostramos o que o feed declara DEPOIS do nome
 * (tipo, quilometragem e a operadora como está declarada, com o ano). */
function resumoHonesto(linha: Linha): string {
  const restante = linha.descricao.split(" | ").slice(1).join(" | ");
  return restante.length > 0 ? restante : linha.descricao;
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    cartao: {
      flexDirection: "row",
      alignItems: "center",
      gap: espaco.m,
      minHeight: 64,
      paddingVertical: espaco.s + 2,
      borderBottomWidth: 1,
      borderBottomColor: tema.hairline,
    },
    textos: { flex: 1, gap: 2 },
    nome: { color: tema.tinta, fontSize: 16, fontWeight: "600" },
    resumo: { color: tema.tinta2, fontSize: 12, lineHeight: 16 },
  });
}
