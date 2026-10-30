// NextDepartureCard — "Primeiro a resposta, depois o detalhe" (doc Moovit):
// a próxima saída é o elemento grande; abaixo dele, o rótulo do dia de
// serviço (quadro). Nada sugere tempo real: contagem em minutos a partir do
// HORÁRIO TEÓRICO, sem pulso, sem "ao vivo", sem verde de chegando.
// Usa a lógica pura de proxima_saida.ts (fuso fixo Fortaleza, GTFS 24h+).
import { StyleSheet, Text, View } from "react-native";
import { espaco, fonteNumeros, raio, tipografia, useTema, type Tema } from "@/tema/theme";
import { proximaSaida, type SaidaProxima } from "@/dados/proxima_saida";
import * as React from "react";

/** "85" -> "1h25" · "40" -> "40 min" · 0 -> "agora" (sem cronômetro vivo). */
export function minutosParaTexto(min: number): string {
  if (min <= 0) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function NextDepartureCard({
  horariosOntem,
  horariosHoje,
  horariosAmanha,
  agora,
}: {
  readonly horariosOntem: readonly string[];
  readonly horariosHoje: readonly string[];
  readonly horariosAmanha: readonly string[];
  /** Date atual — o caller repassa para manter a função testável. */
  readonly agora: Date;
}) {
  const tema = useTema();
  const saida: SaidaProxima = proximaSaida({ ontem: horariosOntem, hoje: horariosHoje, amanha: horariosAmanha, agora });
  if (saida.estado === "sem_horarios") {
    return (
      <View style={[estilos(tema).cartao, estilos(tema).centro]}>
        <Text style={estilos(tema).titulo}>Sem horários neste tipo de dia</Text>
        <Text style={estilos(tema).secundaria}>Escolha outro tipo de dia no quadro abaixo.</Text>
      </View>
    );
  }
  if (saida.estado === "ultima_passou") {
    return (
      <View style={estilos(tema).cartao}>
        <Text style={estilos(tema).rotuloEstado}>Última saída de hoje já passou</Text>
        <View style={estilos(tema).linhaPrincipal}>
          <Text style={[estilos(tema).hora, fonteNumeros]}>{saida.horaExibida}</Text>
          <View style={estilos(tema).lado}>
            <Text style={estilos(tema).rotuloPrimeira}>primeira de amanhã</Text>
            <Text style={[estilos(tema).tempo, fonteNumeros]}>em {minutosParaTexto(saida.emMinutos ?? 0)}</Text>
          </View>
        </View>
      </View>
    );
  }
  const rotuloQuadro = saida.diaServico === "ontem" ? "quadro de ontem · sai hoje" : saida.diaServico === "amanha" ? "quadro de amanhã" : "";
  return (
    <View style={estilos(tema).cartao}>
      <Text style={estilos(tema).rotuloProxima}>Próxima saída</Text>
      <View style={estilos(tema).linhaPrincipal}>
        <Text style={[estilos(tema).hora, fonteNumeros]}>{saida.horaExibida}</Text>
        <Text style={[estilos(tema).tempo, fonteNumeros]}>em {minutosParaTexto(saida.emMinutos ?? 0)}</Text>
      </View>
      {rotuloQuadro.length > 0 ? (
        <Text style={estilos(tema).secundaria}>do {rotuloQuadro}</Text>
      ) : null}
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    cartao: {
      backgroundColor: tema.surfaceAlt,
      borderRadius: raio.cartao,
      borderWidth: 1,
      borderColor: tema.border,
      padding: espaco.base,
      gap: espaco.xs,
    },
    centro: { alignItems: "center", paddingVertical: espaco.g },
    linhaPrincipal: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: espaco.m,
    },
    rotuloProxima: { color: tema.textMuted, fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
    rotuloEstado: { color: tema.textMuted, fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },
    rotuloPrimeira: { color: tema.textMuted, fontSize: 13, fontWeight: "600" },
    // o número da partida é a resposta: grande, tabular, condensado
    hora: { color: tema.text, fontSize: tipografia.display * 1.4, lineHeight: 44, fontVariant: ["tabular-nums"] },
    tempo: { color: tema.primary, fontSize: tipografia.titulo, fontVariant: ["tabular-nums"] },
    lado: { flexDirection: "column" },
    secundaria: { color: tema.textMuted, fontSize: 13 },
    titulo: { color: tema.text, fontSize: tipografia.corpo, fontWeight: "700" },
  });
}
