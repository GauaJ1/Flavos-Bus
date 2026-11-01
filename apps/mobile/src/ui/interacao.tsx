// Interação e ESTADO Material 3 (Passo 5).
//
// Diferenças por plataforma (única divergência permitida — DESIGN_SYSTEM §3):
//  - Android: ripple/splash na cor de token (Pressable android_ripple);
//  - iOS: sem ripple — feedback por camada de opacidade de toque;
//  - Web: foco visível (outline 2px primary + offset 2), sem ripple infinito.
//
// As FUNÇÕES DE ESTILO são PURAS (recebem tema + flags e devolvem objetos
// StyleSheet) para que o teste de conformidade as verifique sem renderizar.

import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { estadoM3 } from "@/tema/tokens";
import * as React from "react";

/** Opacidade da camada de estado no ícone/rótulo — só iOS (Android usa ripple). */
export function opacidadeDeToque(pressionado: boolean, desabilitado: boolean): number {
  if (desabilitado) return estadoM3.desabilitadoConteudo;
  return pressionado && Platform.OS === "ios" ? 1 - estadoM3.pressionado : 1;
}

/** Opacidade do conteúdo desabilitado (M3: 0,38 em todos os componentes). */
export function opacidadeDesabilitado(desabilitado: boolean): number {
  return desabilitado ? estadoM3.desabilitadoConteudo : 1;
}

/** Opacidade do container desabilitado (M3: 0,12, filled/tonal/outline). */
export function opacidadeContainerDesabilitado(desabilitado: boolean): number {
  return desabilitado ? estadoM3.desabilitadoContainer : 1;
}

export interface OpcoesRipple {
  readonly cor: string;
  readonly desabilitado?: boolean | undefined;
  /** raio do ripple = forma do controle (pílula usa metade da altura). */
  readonly raio?: number | undefined;
}

/** Opções de `android_ripple` (Android) — `undefined` nas outras plataformas. */
export function ripple(opcoes: OpcoesRipple) {
  if (Platform.OS !== "android") return undefined;
  if (opcoes.desabilitado) return undefined;
  return { color: opcoes.cor, borderless: true, radius: opcoes.raio };
}

/** Estilo do foco WEB (RN-Web → CSS outline). */
export function estiloFocoWeb(cor: string): ViewStyle {
  if (Platform.OS !== "web") return {};
  return { outlineColor: cor, outlineWidth: 2, outlineOffset: 2, outlineStyle: "solid" } as unknown as ViewStyle;
}

/** Props de interação comuns a TODOS os controles M3. */
export function propsInteracao({
  corRipple,
  desabilitado,
  raio,
  corFoco,
  estiloFoco,
}: {
  readonly corRipple: string;
  readonly desabilitado?: boolean | undefined;
  readonly raio?: number | undefined;
  readonly corFoco: string;
  readonly estiloFoco?: StyleProp<ViewStyle>;
}) {
  return {
    android_ripple: ripple({ cor: corRipple, desabilitado, raio }),
    // RN-Web expõe o foco via estilo; nativo usa a aura padrão do SO.
    style: [estiloFoco, { opacity: desabilitado ? estadoM3.desabilitadoConteudo : 1 }] as StyleProp<ViewStyle>,
    _foco: estiloFocoWeb(corFoco),
    disabled: desabilitado ?? false,
  };
}

/** Camada de estado visual (hover/pressed) sobre uma superfície — usada em
 * organismos que desenham a própria camada (ex.: item de lista selecionado). */
export function camadaEstado(pressionado: boolean): ViewStyle {
  return pressionado ? { opacity: 1 - estadoM3.pressionado } : {};
}

/** Pressable já configurado com ripple/foco/opacidade do M3. */
export function PressableM3({
  children,
  onPress,
  desabilitado,
  corRipple,
  corFoco,
  raio,
  style,
  acessibilidade,
}: {
  readonly children: React.ReactNode | ((p: { pressed: boolean }) => React.ReactNode);
  readonly onPress?: (() => void) | undefined;
  readonly desabilitado?: boolean | undefined;
  readonly corRipple: string;
  readonly corFoco: string;
  readonly raio?: number | undefined;
  readonly style?: StyleProp<ViewStyle>;
  readonly acessibilidade?: Record<string, unknown>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado ?? false}
      android_ripple={ripple({ cor: corRipple, desabilitado, raio })}
      style={style}
      {...acessibilidade}
    >
      {children}
    </Pressable>
  );
}

/** Aura de foco simétrica (nativo) — em RN não há `:focus-visible`; mantemos
 * a aura padrão do sistema e expomos o estilo web para o RN-Web. */
export const estilosInteracao = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center" },
});

/** View auxiliar para desenhar a camada de estado por cima do conteúdo
 * (hover em web/pressionado em qualquer plataforma). */
export function CamadaEstado({ visivel, cor }: { readonly visivel: boolean; readonly cor: string }) {
  if (!visivel) return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: cor }]} />;
}
