// Botão Material 3 (Passo 6) — filled / tonal / outlined / text.
// DESENHO: altura 40, forma full, labelLarge, ícone 18 (A button_*.json).
// ALVO DE TOQUE: 48 — o M3 desenha 40 e exige 48 de área (MaterialTapTargetSize,
// api.flutter.dev/flutter/material/MaterialTapTargetSize.html). Por isso o
// PRESSABLE tem minHeight 48 e centraliza o botão de 40 dentro: o alvo fica
// no próprio elemento clicável (medido pelo Playwright), não na View pai.
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { forma, m3_medidas, toque } from "@/tema/tokens";
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoPressionar}
      android_ripple={ripple({ cor: c.ripple, desabilitado, raio: forma.full })}
      style={[estilos.alvo, estiloFocoWeb(papeis.primary), style]}
    >
      {/* o DESENHO de 40dp (A) vive dentro do alvo de 48 */}
      <View style={e.container}>
        {icone ? <View style={{ opacity: e.rotulo.opacity }}>{icone}</View> : null}
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={[e.texto, e.rotulo]}>
          {rotulo}
        </Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  alvo: { minHeight: toque.minimo, justifyContent: "center", alignItems: "flex-start" },
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

/** Altura desenhada do botão (para a galeria/teste) — não usar em layout. */
export const ALTURA_DESENHO_BOTAO = m3_medidas.botao.altura;
