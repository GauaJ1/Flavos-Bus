// NavigationBar Material 3 (Passo 6) — 3 a 5 destinos, rótulo SEMPRE visível,
// ícone preenchido no ativo + contorno nos inativos (nada só por cor).
//
// MEDIDAS: todas vêm de `m3_medidas.navigationBar` (src/tema/tokens.ts). O
// Portão B troca esse ÚNICO objeto (conjunto compacto) sem tocar aqui.
// `varianteIndicador`: "verde" (padrão aprovado) | "azul" (comparativo).
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { House, Info, MapPin, MagnifyingGlass, Star } from "phosphor-react-native";
import { forma, m3_medidas, toque } from "@/tema/tokens";
import {
  estiloContainerNav,
  estiloDestinoNav,
  estiloDestinoNavAzul,
} from "@/tema/estilos_m3";
import { usePapeis } from "@/tema/theme";
import { ripple } from "./interacao";
import * as React from "react";

export type IconeDestino = "inicio" | "paradas" | "linhas" | "favoritos" | "sobre";

export interface DestinoNav {
  readonly chave: string;
  readonly rotulo: string;
  readonly icone: IconeDestino;
  readonly acessivel?: string;
}

type RenderIcone = (cor: string, tamanho: number, preenchido: boolean) => React.ReactNode;

const ICONES: Record<IconeDestino, RenderIcone> = {
  inicio: (c, t, cheio) => <House size={t} weight={cheio ? "fill" : "regular"} color={c} />,
  paradas: (c, t, cheio) => <MapPin size={t} weight={cheio ? "fill" : "regular"} color={c} />,
  linhas: (c, t, cheio) => <MagnifyingGlass size={t} weight={cheio ? "bold" : "regular"} color={c} />,
  favoritos: (c, t, cheio) => <Star size={t} weight={cheio ? "fill" : "regular"} color={c} />,
  sobre: (c, t, cheio) => <Info size={t} weight={cheio ? "fill" : "regular"} color={c} />,
};

/** Valida 3–5 destinos (limite do M3). Exportada para o teste. */
export function destinosValidos(destinos: readonly DestinoNav[]): boolean {
  return (
    destinos.length >= m3_medidas.navigationBar.destinosMin &&
    destinos.length <= m3_medidas.navigationBar.destinosMax
  );
}

export function NavigationBar({
  destinos,
  ativo,
  aoEscolher,
  varianteIndicador = "verde",
  style,
}: {
  readonly destinos: readonly DestinoNav[];
  readonly ativo: string;
  readonly aoEscolher: (chave: string) => void;
  readonly varianteIndicador?: "verde" | "azul";
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const valido = destinosValidos(destinos);
  if (!valido && __DEV__) {
    console.warn(`[NavigationBar] ${destinos.length} destinos: o Material 3 pede de 3 a 5.`);
  }
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Navegação principal"
      style={[estiloContainerNav(papeis), style]}
    >
      {destinos.map((d) => {
        const selecionado = d.chave === ativo;
        const e =
          varianteIndicador === "azul"
            ? estiloDestinoNavAzul(papeis, selecionado)
            : estiloDestinoNav(papeis, selecionado);
        return (
          <Pressable
            key={d.chave}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionado }}
            accessibilityLabel={d.acessivel ?? d.rotulo}
            onPress={() => aoEscolher(d.chave)}
            android_ripple={ripple({ cor: papeis.onSurface, raio: forma.full })}
            style={estilos.destino}
          >
            <View style={e.indicador}>{ICONES[d.icone](e.corIcone, m3_medidas.navigationBar.icone, selecionado)}</View>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} allowFontScaling style={e.rotulo}>
              {d.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  destino: {
    flex: 1,
    minHeight: toque.minimo,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
});
