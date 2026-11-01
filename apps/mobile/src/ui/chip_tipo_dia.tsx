// Chip de tipo de dia (segunda…domingo) — seletor da tela de detalhe.
// Estado selecionado indicado por fundo (secondaryContainer) + peso (nunca só
// cor). Cores de PAPÉIS M3: nenhum hex neste arquivo.
import { Pressable, StyleSheet, Text } from "react-native";
import { espaco, fonteNumeros, forma, m3_medidas, tiposM3, useTema, type Tema } from "@/tema/theme";
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
  const corTexto = selecionado ? tema.papel : tema.tinta; // contraste garantido no par
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
      minHeight: m3_medidas.chip.alvo,
      paddingHorizontal: espaco.base,
      justifyContent: "center",
      borderRadius: forma.pequena,
      borderWidth: 1,
      borderColor: tema.border,
      backgroundColor: tema.papel,
    },
    selecionado: {
      backgroundColor: tema.tinta, // onSurface: pastilha escura no claro · clara no escuro
      borderColor: tema.tinta,
    },
    texto: {
      fontSize: tiposM3.labelLarge.tamanho,
      lineHeight: tiposM3.labelLarge.linhaAltura,
      fontWeight: tiposM3.labelLarge.peso,
      letterSpacing: tiposM3.labelLarge.tracking,
    },
  });
}
