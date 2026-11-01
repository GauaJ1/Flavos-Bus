// BottomSheet NATIVO — gesto real de arrasto na alça com Animated +
// PanResponder do CORE do RN (reanimated/gesture-handler NÃO estão no
// projeto — nenhuma dependência nova foi adicionada por esta fatia).
// 3 encaixes: arrasto curto troca de encaixe (velocidade decide o lado);
// toque na alça também cicla (acessível sem gesto).
// Visual M3 (Passo 6): surfaceContainerLow, cantos 28, alça 32×4, elevação level1.
import { Animated, PanResponder, Pressable, View } from "react-native";
import { sombra, usePapeis } from "@/tema/theme";
import { estiloBottomSheet } from "@/tema/estilos_sheet";
import { alturasDeEncaixe, ENCAIXES_PADRAO, type PropsBottomSheet } from "./bottom_sheet_tipos";
import * as React from "react";

export default function BottomSheetNativo({
  children,
  alturaContainer,
  encaixes = ENCAIXES_PADRAO,
  aoTrocarAltura,
}: PropsBottomSheet) {
  const { papeis } = usePapeis();
  const e = estiloBottomSheet(papeis, sombra.sheet);
  const alturas = alturasDeEncaixe(alturaContainer, encaixes);
  const [indice, setIndice] = React.useState<0 | 1 | 2>(0);
  const alturaAnim = React.useRef(new Animated.Value(alturas[0])).current;
  const alturasRef = React.useRef(alturas);
  alturasRef.current = alturas;
  const indiceRef = React.useRef<0 | 1 | 2>(0);

  React.useEffect(() => {
    alturaAnim.setValue(alturas[0]);
  }, [alturaContainer]);

  const irPara = React.useCallback(
    (destino: 0 | 1 | 2) => {
      indiceRef.current = destino;
      setIndice(destino);
      aoTrocarAltura?.(destino);
      Animated.spring(alturaAnim, {
        toValue: alturasRef.current[destino],
        useNativeDriver: false,
        bounciness: 0,
      }).start();
    },
    [alturaAnim, aoTrocarAltura],
  );

  const arrastando = React.useRef(false);
  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => arrastando.current,
      onMoveShouldSetPanResponder: (_e, g) => arrastando.current && Math.abs(g.dy) > 6,
      onPanResponderMove: (_e, g) => {
        const hs = alturasRef.current;
        const atual = hs[indiceRef.current] ?? hs[0];
        const novo = Math.min(hs[2], Math.max(hs[0], atual - g.dy));
        alturaAnim.setValue(novo);
      },
      onPanResponderRelease: (_e, g) => {
        arrastando.current = false;
        const hs = alturasRef.current;
        const atual = hs[indiceRef.current] ?? hs[0];
        const projetado = atual - g.dy - g.vy * 120;
        let destino: 0 | 1 | 2 = 0;
        let melhor = Number.MAX_VALUE;
        hs.forEach((h, i) => {
          const d = Math.abs(h - projetado);
          if (d < melhor) {
            melhor = d;
            destino = i as 0 | 1 | 2;
          }
        });
        irPara(destino);
      },
    }),
  ).current;

  return (
    <Animated.View style={[e.painel, { height: alturaAnim }]}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={`Painel na altura ${indice + 1} de 3. Toque para alternar ou arraste a alça.`}
        accessibilityActions={[
          { name: "increment", label: "Aumentar a altura do painel" },
          { name: "decrement", label: "Diminuir a altura do painel" },
        ]}
        onAccessibilityAction={(ev) => {
          const atual = indiceRef.current;
          if (ev.nativeEvent.actionName === "increment") irPara(Math.min(2, atual + 1) as 0 | 1 | 2);
          if (ev.nativeEvent.actionName === "decrement") irPara(Math.max(0, atual - 1) as 0 | 1 | 2);
        }}
        onPress={() => irPara(((indiceRef.current + 1) % 3) as 0 | 1 | 2)}
        onPressIn={() => {
          arrastando.current = true;
        }}
        style={e.alcaArea}
        {...pan.panHandlers}
      >
        <View style={e.alca} />
      </Pressable>
      <View style={e.conteudo}>{children}</View>
    </Animated.View>
  );
}
