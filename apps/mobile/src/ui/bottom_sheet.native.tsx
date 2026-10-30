// BottomSheet NATIVO — gesto real de arrasto na alça com Animated +
// PanResponder do CORE do RN (reanimated/gesture-handler NÃO estão no
// projeto — nenhuma dependência nova foi adicionada por esta fatia).
// 3 encaixes: arrasto curto troca de encaixe (velocidade decide o lado);
// toque na alça também cicla (acessível sem gesto).
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { espaco, raio, sombra, useTema, type Tema } from "@/tema/theme";
import { alturasDeEncaixe, ENCAIXES_PADRAO, type PropsBottomSheet } from "./bottom_sheet";
import * as React from "react";

export default function BottomSheetNativo({
  children,
  alturaContainer,
  encaixes = ENCAIXES_PADRAO,
  aoTrocarAltura,
}: PropsBottomSheet) {
  const tema = useTema();
  const alturas = alturasDeEncaixe(alturaContainer, encaixes);
  const [indice, setIndice] = React.useState<0 | 1 | 2>(0);
  const alturaAnim = React.useRef(new Animated.Value(alturas[0])).current;

  React.useEffect(() => {
    alturaAnim.setValue(alturas[0]);
  }, [alturaContainer]);

  const irPara = React.useCallback(
    (destino: 0 | 1 | 2) => {
      setIndice(destino);
      aoTrocarAltura?.(destino);
      Animated.spring(alturaAnim, {
        toValue: alturas[destino],
        useNativeDriver: false, // altura: layout anim — rápido o bastante p/ sheet
        bounciness: 0,
      }).start();
    },
    [alturas, alturaAnim, aoTrocarAltura],
  );

  const arrastando = React.useRef(false);
  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => arrastando.current,
      onMoveShouldSetPanResponder: (_e, g) => arrastando.current && Math.abs(g.dy) > 6,
      onPanResponderMove: (_e, g) => {
        const atual = alturas[indice];
        const novo = Math.min(alturas[2], Math.max(alturas[0], atual - g.dy));
        alturaAnim.setValue(novo);
      },
      onPanResponderRelease: (_e, g) => {
        arrastando.current = false;
        const atual = alturas[indice];
        const projetado = atual - g.dy - g.vy * 120;
        let destino: 0 | 1 | 2 = 0;
        let melhor = Number.MAX_VALUE;
        alturas.forEach((h, i) => {
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
    <Animated.View style={[estilos(tema).painel, { height: alturaAnim }]}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={`Painel na altura ${indice + 1} de 3. Toque para alternar ou arraste a alça.`}
        onPress={() => irPara(((indice + 1) % 3) as 0 | 1 | 2)}
        onPressIn={() => {
          arrastando.current = true;
        }}
        hitSlop={{ top: 8, bottom: 8, left: 40, right: 40 }}
        style={estilos(tema).alcaArea}
        {...pan.panHandlers}
      >
        <View style={estilos(tema).alca} />
      </Pressable>
      <View style={estilos(tema).conteudo}>{children}</View>
    </Animated.View>
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
      // sombra do sheet: o ÚNICO nível de elevação do app (tokens.sombra)
      elevation: sombra.sheet.elevacao,
      shadowColor: sombra.sheet.shadowColor,
      shadowOpacity: sombra.sheet.shadowOpacity,
      shadowRadius: sombra.sheet.shadowRadius,
      shadowOffset: sombra.sheet.shadowOffset,
    },
    alcaArea: { alignItems: "center", paddingTop: espaco.s, paddingBottom: espaco.s, minHeight: 32 },
    alca: { width: 44, height: 4, borderRadius: 2, backgroundColor: tema.border },
    conteudo: { flex: 1, paddingHorizontal: espaco.base, paddingBottom: espaco.m },
  });
}
