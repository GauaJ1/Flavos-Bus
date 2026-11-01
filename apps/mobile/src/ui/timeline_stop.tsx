// TimelineStop — nó + conector vertical do itinerário (Passo 6, domínio).
//
// FORMA comunica origem/destino ALÉM da cor (princípio adotado da referência
// de tema claro — DESIGN_SYSTEM §9(d)):
//   primeira    = círculo CHEIO 20dp        (origem)
//   última      = QUADRADO CHEIO 20dp       (destino, raio forma.extraPequena)
//   intermediária = anel pequeno 14dp (borda 2dp, vazado)
//   atual       = ponto cheio + nome em peso maior
// Conector = 2dp na COR DA LINHA do feed (nunca cor de tema; ver a etapa de
// integração). A função `estiloNoTimeline` é PURA e testada.
import { StyleSheet, Text, View } from "react-native";
import type { ViewStyle } from "react-native";
import { espaco, fonteNumeros, forma, m3_medidas, tiposM3, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

export type VarianteNo = "primeira" | "intermediaria" | "ultima";

export function TimelineStop({
  nome,
  horario,
  variante = "intermediaria",
  atual = false,
  corLinha,
}: {
  readonly nome: string;
  /** horário teórico na parada ("HH:MM") — opcional (parada sem horário). */
  readonly horario?: string;
  readonly variante?: VarianteNo;
  /** a parada do momento do usuário (ponto cheio + peso maior). */
  readonly atual?: boolean;
  /** cor da LINHA do feed para nó e conector (obrigatória na prática). */
  readonly corLinha?: string;
}) {
  const tema = useTema();
  const corDoFeed = corLinha; // undefined só na galeria sem dado
  const e = estiloNoTimeline(tema, variante, atual, corDoFeed);
  return (
    <View style={estilos.linha}>
      <View style={estilos.trilho}>
        {variante === "primeira" ? <View style={estilos.espacoAcima} /> : <View style={e.conector} />}
        <View style={e.no} />
        {variante === "ultima" ? null : <View style={e.conector} />}
      </View>
      <View style={estilos.textos}>
        <Text
          style={[e.nome, atual && e.nomeAtual]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.3}
        >
          {nome}
        </Text>
        {horario !== undefined && horario.length > 0 ? (
          <Text style={e.horario}>{horario}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Pura: nó (forma/tamanho por variante) + conector na cor do feed. */
export function estiloNoTimeline(
  tema: Tema,
  variante: VarianteNo,
  atual: boolean,
  corLinha: string | undefined,
): { no: ViewStyle; conector: ViewStyle; nome: object; nomeAtual: object; horario: object } {
  const cor = corLinha ?? tema.primary;
  const grande = variante !== "intermediaria";
  const tamanho = grande ? m3_medidas.timelineStop.noGrande : m3_medidas.timelineStop.noPequeno;
  const cheio = variante !== "intermediaria" || atual;
  return {
    no: {
      width: tamanho,
      height: tamanho,
      borderRadius: variante === "ultima" ? forma.extraPequena : tamanho / 2,
      borderWidth: m3_medidas.timelineStop.anel,
      borderColor: cor,
      backgroundColor: cheio ? cor : tema.papel,
    },
    conector: {
      width: m3_medidas.timelineStop.conector,
      flex: 1,
      backgroundColor: cor,
      borderRadius: forma.full,
    },
    nome: {
      flex: 1,
      color: tema.text,
      fontSize: tiposM3.bodyLarge.tamanho,
      lineHeight: tiposM3.bodyLarge.linhaAltura,
      letterSpacing: tiposM3.bodyLarge.tracking,
      paddingVertical: espaco.s,
    },
    nomeAtual: { fontWeight: "700" },
    horario: {
      color: tema.textMuted,
      fontSize: tiposM3.bodyMedium.tamanho,
      lineHeight: tiposM3.bodyMedium.linhaAltura,
      ...fonteNumeros,
    },
  };
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: m3_medidas.timelineStop.gapLinha,
    minHeight: 44,
  },
  trilho: {
    width: m3_medidas.timelineStop.noGrande,
    alignItems: "center",
  },
  espacoAcima: { height: espaco.s },
  textos: { flex: 1 },
});
