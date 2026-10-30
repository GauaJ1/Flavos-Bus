// DaySegmented — Útil / Sábado / Domingo. Alvo de toque >= 44 (doc Moovit).
// Estado ativo NÃO é só cor: fundo invertido + peso maior + sublinhado
// estrutural (regra "não só cor" — acessível quando todos os pares de cor
// falham, e no tema escuro igualmente).
import { Pressable, StyleSheet, Text, View } from "react-native";
import { espaco, fonteNumeros, raio, toque, useTema, type Tema } from "@/tema/theme";
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
    trilha: {
      flexDirection: "row",
      gap: espaco.s,
    },
    item: {
      minHeight: toque.minimo - 4, // 44 (doc Moovit: área de toque)
      paddingHorizontal: espaco.m + 4,
      borderRadius: raio.controles,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.surface,
      justifyContent: "center",
    },
    itemAtivo: {
      backgroundColor: tema.primary, // invertido E peso maior (não é só cor)
      borderColor: tema.primary,
    },
    texto: { fontSize: 15, color: tema.text, fontWeight: "600" },
    textoAtivo: { color: tema.onPrimary, fontWeight: "800" },
  });
}
