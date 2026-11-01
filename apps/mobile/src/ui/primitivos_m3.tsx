// Primitivos Material 3 (Passo 6) — Divider, SectionHeader, IconButton,
// ListItem, TopAppBar, SearchBar, SegmentedButton, Chip, FilterChipRow.
// A LÓGICA DE ESTILO vive em src/tema/estilos_m3.ts (puro e testado); este
// arquivo só aplica e cuida de interação/acessibilidade. Sem hex aqui.
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { Check, MagnifyingGlass } from "phosphor-react-native";
import { forma, m3_medidas, toque } from "@/tema/tokens";
import {
  estiloChip,
  estiloDivider,
  estiloFilterChipRow,
  estiloIconButton,
  estiloListItem,
  estiloRotuloSectionHeader,
  estiloSearchBar,
  estiloSectionHeader,
  estiloSegmento,
  estiloSegmentedContainer,
  estiloTextoListItemApoio,
  estiloTextoListItemTitulo,
  estiloTextoSegmento,
  estiloTopAppBar,
  type EstiloBotao,
  type TipoChip,
} from "@/tema/estilos_m3";
import { usePapeis } from "@/tema/theme";
import { ripple, estiloFocoWeb } from "./interacao";
import * as React from "react";

// ============================================================
// DIVIDER
// ============================================================

export function Divider({ style }: { readonly style?: StyleProp<ViewStyle> }) {
  const { papeis } = usePapeis();
  return <View accessibilityRole="none" style={[estiloDivider(papeis), style]} />;
}

// ============================================================
// SECTION HEADER
// ============================================================

export function SectionHeader({
  rotulo,
  acao,
  style,
}: {
  readonly rotulo: string;
  readonly acao?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  return (
    <View accessibilityRole="header" style={[estiloSectionHeader(papeis), style]}>
      <Text accessibilityLabel={rotulo} maxFontSizeMultiplier={1.3} style={estiloRotuloSectionHeader(papeis)}>
        {rotulo}
      </Text>
      {acao}
    </View>
  );
}

// ============================================================
// ICON BUTTON
// ============================================================

export function IconButton({
  icone,
  rotuloAcessivel,
  aoPressionar,
  selecionado = false,
  desabilitado = false,
  estiloSelecionado = "padrao",
  style,
}: {
  readonly icone: (cor: string) => ReactNode;
  readonly rotuloAcessivel: string;
  readonly aoPressionar: () => void;
  readonly selecionado?: boolean;
  readonly desabilitado?: boolean;
  readonly estiloSelecionado?: "padrao" | "filled";
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const e = estiloIconButton(papeis, { selecionado, desabilitado, estiloSelecionado });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoPressionar}
      android_ripple={ripple({ cor: e.ripple, desabilitado, raio: forma.full })}
      style={[e.container, estiloFocoWeb(papeis.primary), style]}
    >
      {icone(e.corIcone)}
    </Pressable>
  );
}

// ============================================================
// LIST ITEM
// ============================================================

export function ListItem({
  titulo,
  apoio,
  iconeLider,
  trailing,
  aoPressionar,
  selecionado = false,
  desabilitado = false,
  linhas = 1,
  style,
}: {
  readonly titulo: string;
  readonly apoio?: string;
  readonly iconeLider?: ReactNode;
  readonly trailing?: ReactNode;
  readonly aoPressionar?: () => void;
  readonly selecionado?: boolean;
  readonly desabilitado?: boolean;
  readonly linhas?: 1 | 2 | 3;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const e = estiloListItem(papeis, { linhas, selecionado, desabilitado });
  const conteudo = (
    <>
      {iconeLider ? <View style={{ opacity: e.opacidade }}>{iconeLider}</View> : null}
      <View style={estilos.itemTextos}>
        <Text numberOfLines={1} style={[estiloTextoListItemTitulo(papeis, selecionado), { opacity: e.opacidade }]}>
          {titulo}
        </Text>
        {apoio ? (
          <Text numberOfLines={2} style={[estiloTextoListItemApoio(papeis, selecionado), { opacity: e.opacidade }]}>
            {apoio}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={{ opacity: e.opacidade }}>{trailing}</View> : null}
    </>
  );
  if (!aoPressionar) return <View style={[e.container, style]}>{conteudo}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={apoio ? `${titulo}. ${apoio}` : titulo}
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoPressionar}
      android_ripple={ripple({ cor: papeis.onSurface, desabilitado, raio: forma.pequena })}
      style={[e.container, style]}
    >
      {conteudo}
    </Pressable>
  );
}

// ============================================================
// TOP APP BAR
// ============================================================

export function TopAppBar({
  titulo,
  lider,
  acoes,
  rolado = false,
  style,
}: {
  readonly titulo: string;
  readonly lider?: ReactNode;
  readonly acoes?: ReactNode;
  readonly rolado?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const e = estiloTopAppBar(papeis, rolado);
  return (
    <View accessibilityRole="header" style={[e.container, style]}>
      {lider ? <View style={estilos.barraLado}>{lider}</View> : null}
      <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={e.titulo}>
        {titulo}
      </Text>
      {acoes ? <View style={estilos.barraAcoes}>{acoes}</View> : null}
    </View>
  );
}

// ============================================================
// SEARCH BAR
// ============================================================

export function SearchBarM3({
  variante = "campo",
  texto,
  aoMudarTexto,
  aoAbrirBusca,
  autoFocar = false,
  onFoco,
  onDesfoco,
  style,
}: {
  readonly variante?: "botao" | "campo";
  readonly texto?: string;
  readonly aoMudarTexto?: (t: string) => void;
  readonly aoAbrirBusca?: () => void;
  readonly autoFocar?: boolean;
  readonly onFoco?: () => void;
  readonly onDesfoco?: () => void;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const e = estiloSearchBar(papeis);
  if (variante === "botao") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Buscar linha ou parada"
        onPress={aoAbrirBusca}
        android_ripple={ripple({ cor: papeis.onSurface, raio: forma.full })}
        style={[e.container, estiloFocoWeb(papeis.primary), style]}
      >
        <MagnifyingGlass size={m3_medidas.searchBar.icone} weight="regular" color={e.corLider} />
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={e.textoPlaceholder}>
          Buscar linha ou parada
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={[e.container, style]}>
      <MagnifyingGlass size={m3_medidas.searchBar.icone} weight="regular" color={e.corLider} />
      <TextInput
        accessibilityLabel="Buscar linha ou parada"
        placeholder="Buscar linha ou parada"
        placeholderTextColor={e.corPlaceholder}
        value={texto}
        onChangeText={aoMudarTexto}
        autoFocus={autoFocar}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={onFoco}
        onBlur={onDesfoco}
        style={e.input}
      />
    </View>
  );
}

// ============================================================
// SEGMENTED BUTTON
// ============================================================

export interface OpcaoSegmento<T extends string> {
  readonly chave: T;
  readonly rotulo: string;
  readonly acessivel?: string;
}

export function SegmentedButton<T extends string>({
  opcoes,
  valor,
  aoEscolher,
  acessibilidadeGrupo,
  style,
}: {
  readonly opcoes: readonly OpcaoSegmento<T>[];
  readonly valor: T;
  readonly aoEscolher: (v: T) => void;
  readonly acessibilidadeGrupo: string;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={acessibilidadeGrupo}
      style={[estiloSegmentedContainer(papeis), style]}
    >
      {opcoes.map((op, i) => {
        const ativo = op.chave === valor;
        return (
          <Pressable
            key={op.chave}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={op.acessivel ?? op.rotulo}
            onPress={() => aoEscolher(op.chave)}
            android_ripple={ripple({ cor: ativo ? papeis.onSecondaryContainer : papeis.onSurface, raio: forma.full })}
            style={estiloSegmento(papeis, ativo, i === 0, i === opcoes.length - 1)}
          >
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={estiloTextoSegmento(papeis, ativo)}>
              {op.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================
// CHIP
// ============================================================

export function Chip({
  rotulo,
  tipo = "filter",
  selecionado = false,
  aoPressionar,
  icone,
  desabilitado = false,
  style,
}: {
  readonly rotulo: string;
  readonly tipo?: TipoChip;
  readonly selecionado?: boolean;
  readonly aoPressionar: () => void;
  readonly icone?: (cor: string) => ReactNode;
  readonly desabilitado?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const { papeis } = usePapeis();
  const e = estiloChip(papeis, tipo, selecionado, desabilitado);
  return (
    <View style={[estilos.chipArea, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityState={{ selected: tipo === "filter" ? selecionado : undefined, disabled: desabilitado }}
        disabled={desabilitado}
        onPress={aoPressionar}
        android_ripple={ripple({ cor: e.ripple, desabilitado, raio: forma.pequena })}
        style={e.container}
      >
        {tipo === "filter" && selecionado ? (
          <Check size={m3_medidas.chip.icone} weight="bold" color={e.corIcone} />
        ) : icone ? (
          icone(e.corIcone)
        ) : null}
        <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={e.texto}>
          {rotulo}
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// FILTER CHIP ROW
// ============================================================

export interface OpcaoFiltro<T extends string> {
  readonly chave: T;
  readonly rotulo: string;
  readonly icone?: (cor: string) => ReactNode;
  readonly acessivel?: string;
}

export function FilterChipRow<T extends string>({
  opcoes,
  selecionados,
  aoAlternar,
  acessibilidadeGrupo,
  style,
}: {
  readonly opcoes: readonly OpcaoFiltro<T>[];
  readonly selecionados: readonly T[];
  readonly aoAlternar: (chave: T) => void;
  readonly acessibilidadeGrupo: string;
  readonly style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={acessibilidadeGrupo}
      style={[estiloFilterChipRow(), style]}
    >
      {opcoes.map((op) => (
        <Chip
          key={op.chave}
          rotulo={op.rotulo}
          tipo="filter"
          selecionado={selecionados.includes(op.chave)}
          aoPressionar={() => aoAlternar(op.chave)}
          {...(op.icone ? { icone: op.icone } : {})}
          style={estilos.chipLinhaItem}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  itemTextos: { flex: 1, gap: 2 },
  barraLado: { flexDirection: "row", alignItems: "center" },
  barraAcoes: { flexDirection: "row", alignItems: "center" },
  chipArea: { minHeight: toque.minimo, justifyContent: "center" },
  chipLinhaItem: { minHeight: toque.minimo },
});

export type { EstiloBotao, TipoChip };
