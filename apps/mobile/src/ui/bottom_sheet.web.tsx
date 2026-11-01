// BottomSheet WEB — estático por decisão: painel ancorado no encaixe atual,
// com alça CLICÁVEL que cicla peek -> meia -> expandida. O gesto real no
// celular vive em bottom_sheet.native.tsx. Visual M3 (Passo 6): container
// surfaceContainerLow, cantos 28, alça 32×4 onSurfaceVariant, elevação level1.
import { Pressable, Text, View } from "react-native";
import { sombra, usePapeis } from "@/tema/theme";
import { estiloBottomSheet } from "@/tema/estilos_sheet";
import { alturasDeEncaixe, ENCAIXES_PADRAO, type PropsBottomSheet } from "./bottom_sheet_tipos";
import { rotuloSelecao } from "@/tema/acessibilidade";
import * as React from "react";

export default function BottomSheetWeb({
  children,
  alturaContainer,
  encaixes = ENCAIXES_PADRAO,
  aoTrocarAltura,
}: PropsBottomSheet) {
  const { papeis } = usePapeis();
  const [indice, setIndice] = React.useState<0 | 1 | 2>(0);
  const alturas = alturasDeEncaixe(alturaContainer, encaixes);
  const altura = alturas[indice] ?? alturaContainer;
  const e = estiloBottomSheet(papeis, sombra.sheet);
  function ciclar() {
    const prox: (0 | 1 | 2)[] = [1, 2, 0];
    setIndice((i) => {
      const n = prox[i] ?? 0;
      aoTrocarAltura?.(n);
      return n;
    });
  }
  return (
    <View style={[e.painel, { height: altura }]}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={rotuloSelecao(`Altura do painel: opção ${indice + 1} de 3. Toque para alternar.`, false)}
        accessibilityHint="Cicla entre encaixe baixo, médio e expandido"
        onPress={ciclar}
        style={e.alcaArea}
      >
        <View style={e.alca} />
        <Text maxFontSizeMultiplier={1.3} style={e.dica}>
          Toque na alça para alternar a altura
        </Text>
      </Pressable>
      <View style={e.conteudo}>{children}</View>
    </View>
  );
}
