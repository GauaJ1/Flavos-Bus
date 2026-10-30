// BottomSheet WEB — estático por decisão (doc de movimento: sem usar
// transição de arrasto na web de depuração): painel ancorado na altura do
// encaixe atual, com alça CLICÁVEL que cicla peek -> meia -> expandida.
// O comportamento com gesto real no celular vive em bottom_sheet.native.tsx.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { espaco, raio, useTema, type Tema } from "@/tema/theme";
import { alturasDeEncaixe, ENCAIXES_PADRAO, type PropsBottomSheet } from "./bottom_sheet";
import * as React from "react";

export default function BottomSheetWeb({
  children,
  alturaContainer,
  encaixes = ENCAIXES_PADRAO,
  aoTrocarAltura,
}: PropsBottomSheet) {
  const tema = useTema();
  const [indice, setIndice] = React.useState<0 | 1 | 2>(0);
  const alturas = alturasDeEncaixe(alturaContainer, encaixes);
  const altura = alturas[indice] ?? alturaContainer;
  function ciclar() {
    const prox: (0 | 1 | 2)[] = [1, 2, 0];
    setIndice((i) => {
      const n = prox[i] ?? 0;
      aoTrocarAltura?.(n);
      return n;
    });
  }
  return (
    <View style={[estilos(tema).painel, { height: altura }]}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={`Altura do painel: opção ${indice + 1} de 3. Toque para alternar.`}
        onPress={ciclar}
        style={estilos(tema).alcaArea}
        hitSlop={{ top: 8, bottom: 8, left: 40, right: 40 }}
      >
        <View style={estilos(tema).alca} />
        <Text style={estilos(tema).dica}>(web: toque na alça para alternar altura)</Text>
      </Pressable>
      <View style={estilos(tema).conteudo}>{children}</View>
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    painel: {
      backgroundColor: tema.surface,
      borderTopLeftRadius: raio.cartao,
      borderTopRightRadius: raio.cartao,
      borderTopWidth: 1,
      borderTopColor: tema.border,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: tema.border,
      borderRightColor: tema.border,
    },
    alcaArea: { alignItems: "center", paddingTop: espaco.s, paddingBottom: 2 },
    alca: { width: 44, height: 4, borderRadius: 2, backgroundColor: tema.border },
    dica: { color: tema.textMuted, fontSize: 10, marginTop: 2 },
    conteudo: { flex: 1, paddingHorizontal: espaco.base, paddingBottom: espaco.m },
  });
}
