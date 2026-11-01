// Tabs (fatia 3, B1) — ordem VISUAL do dono: Início, Linhas, Favoritos,
// Sobre. Ícone phosphor + rótulo SEMPRE visível; >= 44 de alvo; ativo =
// primary + peso 800 (não é só cor); fundo surface com hairline superior;
// a área segura embaixo é do próprio bottom-tabs. ABA INICIAL = Linhas
// enquanto o Início é provisório: a lista mora no ARQUIVO index do grupo
// (rota "/") — no expo-router a rota vazia do grupo é sempre o arquivo
// index (initialRouteName é ignorado para o deep link inicial, provado no
// smoke) — e a Home provisória é inicio.tsx (rota /inicio).
import { Tabs } from "expo-router";
import { StyleSheet, Text, type ColorValue } from "react-native";
import { Bus, House, Info, Star } from "phosphor-react-native";
import { useTema } from "@/tema/theme";

type PropsRotulo = { focused: boolean; color: ColorValue };

function rotulo(texto: string) {
  return function RotuloDaAba({ focused, color }: PropsRotulo) {
    return (
      <Text style={{ color, fontSize: 11, fontWeight: focused ? "800" : "600", letterSpacing: 0.2 }}>{texto}</Text>
    );
  };
}

type PropsIcone = { focused: boolean; color: ColorValue; size: number };

function iconeDaAba(Icone: typeof House) {
  return function IconeDaAba({ color, focused }: PropsIcone) {
    return <Icone size={22} weight={focused ? "fill" : "regular"} color={String(color)} />;
  };
}

// definidos 1x (module scope): evita remount do ícone a cada render
const IconeInicio = iconeDaAba(House);
const IconeLinhas = iconeDaAba(Bus);
const IconeFavoritos = iconeDaAba(Star);
const IconeSobre = iconeDaAba(Info);

export default function TabsLayout() {
  const tema = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.primary,
        tabBarInactiveTintColor: tema.textMuted,
        tabBarStyle: {
          backgroundColor: tema.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: tema.border,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{ tabBarLabel: rotulo("Início"), tabBarIcon: IconeInicio }}
      />
      <Tabs.Screen
        name="index"
        options={{ tabBarLabel: rotulo("Linhas"), tabBarIcon: IconeLinhas }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ tabBarLabel: rotulo("Favoritos"), tabBarIcon: IconeFavoritos }}
      />
      <Tabs.Screen
        name="sobre"
        options={{ tabBarLabel: rotulo("Sobre"), tabBarIcon: IconeSobre }}
      />
    </Tabs>
  );
}
