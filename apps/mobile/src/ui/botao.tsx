// Botão Material 3 (Passo 6) — filled / tonal / outlined / text.
// Altura 40, forma full, labelLarge, ícone 18, alvo de toque 48.
// Estilo em src/tema/estilos_m3.ts (puro e testado). Sem spinner (excluído
// no Portão A) e sem hex aqui.
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { forma, toque } from "@/tema/tokens";
import { coresDoBotao, estiloBotao, type EstiloBotao } from "@/tema/estilos_m3";
import { usePapeis } from "@/tema/theme";
import { ripple, estiloFocoWeb } from "./interacao";
import * as React from "react";

export type { EstiloBotao };

export function BotaoM3({
  rotulo,
  aoPressionar,
  estilo = "filled",
  desabilitado = false,
  icone,
  style,
}: {
  readonly rotulo: string;
  readonly aoPressionar: () => void;
  readonly estilo?: EstiloBotao;
  readonly desabilitado?: boolean;
  readonly icone?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const e = estiloBotao(papeis, estilo, desabilitado);
  const c = coresDoBotao(papeis, estilo);
  return (
    <View style={[estilos.area, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityState={{ disabled: desabilitado }}
        disabled={desabilitado}
        onPress={aoPressionar}
        android_ripple={ripple({ cor: c.ripple, desabilitado, raio: forma.full })}
        style={[e.container, estiloFocoWeb(papeis.primary)]}
      >
        {icone ? <View style={{ opacity: e.rotulo.opacity }}>{icone}</View> : null}
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={[e.texto, e.rotulo]}>
          {rotulo}
        </Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { minHeight: toque.minimo, justifyContent: "center", alignItems: "flex-start" },
});

/** Compat: `Botao` (nome antigo) → BotaoM3; variante antiga "primario"
 * vira filled e "secundario" vira outlined. */
export function Botao({
  variante = "secundario",
  ...props
}: Omit<React.ComponentProps<typeof BotaoM3>, "estilo"> & {
  readonly variante?: "primario" | "secundario";
}) {
  return <BotaoM3 {...props} estilo={variante === "primario" ? "filled" : "outlined"} />;
}
