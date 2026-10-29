// Chip de tipo de dia (segunda…domingo) — seletor da tela de detalhe.
// Estado selecionado indicado por fundo invertido + peso (nunca só cor).
import { Pressable, StyleSheet, Text } from "react-native";
import { espaco, fonteNumeros, useTema, type Tema } from "@/tema/theme";
import type { TipoDia } from "@flavos/shared";
import * as React from "react";

const ROTULOS: Record<TipoDia, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
  domingo: "Dom",
};

export function ChipTipoDia({
  dia,
  selecionado,
  aoEscolher,
}: {
  readonly dia: TipoDia;
  readonly selecionado: boolean;
  readonly aoEscolher: (dia: TipoDia) => void;
}) {
  const tema = useTema();
  const corTexto = selecionado ? (tema.escuro ? "#000000" : "#FFFFFF") : tema.tinta;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={`Horários de ${dia}`}
      onPress={() => aoEscolher(dia)}
      style={({ pressed }) => [
        estilosDe(tema).chip,
        selecionado && estilosDe(tema).selecionado,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[estilosDe(tema).texto, { color: corTexto }, fonteNumeros]}>
        {ROTULOS[dia]}
      </Text>
    </Pressable>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    chip: {
      minHeight: 40,
      paddingHorizontal: espaco.base,
      justifyContent: "center",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: tema.hairline,
      backgroundColor: tema.papel,
    },
    selecionado: {
      backgroundColor: tema.tinta, // claro: pastilha preta · escuro: branca
      borderColor: tema.tinta,
    },
    texto: { fontSize: 14, letterSpacing: 0.3 },
  });
}
