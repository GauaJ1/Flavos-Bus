// Estados de tela (carregando, vazio, sem resultado, banco ausente, erro).
// Regra das âncoras: estado vazio tem UMA ação clara; erro diz o que fazer,
// sem pedir desculpa e sem vagueza. Nada de dado inventado para preencher.
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { espaco, useTema, type Tema } from "@/tema/theme";
import { Botao } from "./botao";
import { IconeAviso } from "./icones";
import * as React from "react";

export function Carregando({ rotulo }: { readonly rotulo: string }) {
  const tema = useTema();
  return (
    <View style={estilosDe(tema).centro} accessibilityLiveRegion="polite">
      <ActivityIndicator color={tema.acento} />
      <Text style={estilosDe(tema).texto}>{rotulo}</Text>
    </View>
  );
}

export function EstadoVazio({
  titulo,
  explicacao,
  acaoRotulo,
  acao,
}: {
  readonly titulo: string;
  readonly explicacao: string;
  readonly acaoRotulo?: string;
  readonly acao?: () => void;
}) {
  const tema = useTema();
  return (
    <View style={estilosDe(tema).centro}>
      <Text style={estilosDe(tema).titulo}>{titulo}</Text>
      <Text style={estilosDe(tema).texto}>{explicacao}</Text>
      {acaoRotulo && acao ? <Botao rotulo={acaoRotulo} aoPressionar={acao} /> : null}
    </View>
  );
}

export function EstadoErro({
  titulo,
  detalhe,
  acaoRotulo,
  acao,
}: {
  readonly titulo: string;
  readonly detalhe: string;
  readonly acaoRotulo?: string;
  readonly acao?: () => void;
}) {
  const tema = useTema();
  return (
    <View style={[estilosDe(tema).centro, { gap: espaco.base }]}>
      <IconeAviso cor={tema.erro} tamanho={28} />
      <Text style={[estilosDe(tema).titulo, { color: tema.erro }]}>{titulo}</Text>
      <Text style={estilosDe(tema).texto}>{detalhe}</Text>
      {acaoRotulo && acao ? <Botao rotulo={acaoRotulo} aoPressionar={acao} /> : null}
    </View>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    centro: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: espaco.base,
      padding: espaco.gg,
    },
    titulo: { color: tema.tinta, fontSize: 18, fontWeight: "700", textAlign: "center" },
    texto: { color: tema.tinta2, fontSize: 14, lineHeight: 20, textAlign: "center" },
  });
}
