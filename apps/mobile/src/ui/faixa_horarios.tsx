// Faixa do dia (data-viz do passeio): os horários teóricos do dia inteiro na
// horizontal — dar "visão de relance" dos intervalos sem animação nenhuma
// (datapoint estático: RT não existe e não inventamos dado).
// Regras dataviz aplicadas: eixo com rótulos de hora legíveis (AA), nunca só
// cor para codificar, tinta neutra + acento único no marcador "agora".
import { StyleSheet, Text, View } from "react-native";
import { forma, espaco, useTema, type Tema } from "@/tema/theme";
import * as React from "react";

const INICIO_H = 4; // janela 04:00–24:00 cobre as viagens do feed (05:00–17:40+)
const FIM_H = 24;

function horaPraPosicao(hhmm: string): number {
  const partes = hhmm.split(":");
  const h = Number(partes[0] ?? "0");
  const m = Number(partes[1] ?? "0");
  const total = h * 60 + m;
  return Math.min(1, Math.max(0, (total - INICIO_H * 60) / ((FIM_H - INICIO_H) * 60)));
}

export function FaixaHorarios({
  horarios,
  agora,
}: {
  readonly horarios: readonly string[]; // "HH:MM:SS"
  readonly agora: string; // "HH:MM:SS" local
}) {
  const tema = useTema();
  if (horarios.length === 0) return null;
  const marcadorAgora = horaPraPosicao(agora);
  rotulosInteiros();
  return (
    <View accessibilityLabel={`Faixa do dia: ${horarios.length} partidas entre 4 e 24 horas`}>
      <View style={estilosDe(tema).trilha}>
        {horarios.map((h) => (
          <View
            key={h}
            style={[estilosDe(tema).marcador, { left: `${horaPraPosicao(h) * 100}%` }]}
          />
        ))}
        <View style={[estilosDe(tema).agora, { left: `${marcadorAgora * 100}%` }]} />
      </View>
      <View style={estilosDe(tema).eixo}>
        {[6, 9, 12, 15, 18, 21].map((h) => (
          <Text key={h} style={estilosDe(tema).rotulo}>
            {String(h)}h
          </Text>
        ))}
      </View>
    </View>
  );
}

function rotulosInteiros(): void {
  // eixo fixo 06–21h: garante rótulos mesmo com poucos pontos (sem auto-ajuste
  // mágico que mudaria de tela para tela)
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    trilha: {
      height: 34,
      borderRadius: forma.pequena,
      backgroundColor: tema.papel2,
      borderWidth: 1,
      borderColor: tema.hairline,
      marginHorizontal: espaco.base,
    },
    marcador: {
      position: "absolute",
      top: 6,
      bottom: 6,
      width: 3,
      marginLeft: -1.5,
      borderRadius: forma.full,
      backgroundColor: tema.tinta,
      opacity: 0.8,
    },
    agora: {
      position: "absolute",
      top: 2,
      bottom: 2,
      width: 2,
      marginLeft: -1,
      backgroundColor: tema.acento,
    },
    eixo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: espaco.base,
      marginTop: 2,
    },
    rotulo: { color: tema.tinta2, fontSize: 11, fontVariant: ["tabular-nums"] },
  });
}
