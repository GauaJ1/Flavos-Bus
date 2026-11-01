// DaySegmented — controle segmentado de LARGURA TOTAL (doc Moovit §3 + ajuste
// do dono): container com borda e raio, 3 segmentos de largura IGUAL (flex:1),
// alvo de toque >= 44; ativo = fundo primary + onPrimary + peso 800 (não é só
// cor). Na fatia 3 a parte genérica vira o componente Segmented.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonteNumeros, toque, useTema, type Tema } from "@/tema/theme";
import type { TipoDia } from "@flavos/shared";
import * as React from "react";

export type SegmentoDia = "util" | "sabado" | "domingo";

const ROTULOS: Record<SegmentoDia, string> = { util: "Útil", sabado: "Sábado", domingo: "Domingo" };

/** Tipos de dia do GTFS cobertos por cada segmento (calendar). */
export const DIAS_DO_SEGMENTO: Record<SegmentoDia, readonly TipoDia[]> = {
  util: ["segunda", "terca", "quarta", "quinta", "sexta"],
  sabado: ["sabado"],
  domingo: ["domingo"],
};

export function segmentoDoDia(tipo: TipoDia): SegmentoDia {
  for (const [seg, dias] of Object.entries(DIAS_DO_SEGMENTO) as [SegmentoDia, readonly TipoDia[]][]) {
    if (dias.includes(tipo)) return seg;
  }
  return "util";
}

export function DaySegmented({
  valor,
  aoEscolher,
}: {
  readonly valor: SegmentoDia;
  readonly aoEscolher: (v: SegmentoDia) => void;
}) {
  const tema = useTema();
  const ordem: readonly SegmentoDia[] = ["util", "sabado", "domingo"];
  return (
    <View style={estilos(tema).trilha} accessibilityRole="tablist">
      {ordem.map((seg) => {
        const ativo = seg === valor;
        return (
          <Pressable
            key={seg}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`Horários de dia ${ROTULOS[seg]}`}
            onPress={() => aoEscolher(seg)}
            style={({ pressed }) => [
              estilos(tema).item,
              ativo && estilos(tema).itemAtivo,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={[estilos(tema).texto, fonteNumeros, ativo && estilos(tema).textoAtivo]}>
              {ROTULOS[seg]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    // o CONTAINER é o controle: borda+raio+.track clara; padding interno de 2
    // pertence ao controle (não é margem externa de componente).
    trilha: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: tema.border,
      borderRadius: 12,
      backgroundColor: tema.surfaceAlt,
      padding: 2,
    },
    item: {
      flex: 1, // 3 segmentos de largura IGUAL
      minHeight: toque.minimo - 4, // 44 (área de toque >= 44)
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      margin: 1,
    },
    itemAtivo: {
      backgroundColor: tema.primary, // invertido E peso maior (não é só cor)
    },
    texto: { fontSize: 15, color: tema.text, fontWeight: "600" },
    textoAtivo: { color: tema.onPrimary, fontWeight: "800" },
  });
}
