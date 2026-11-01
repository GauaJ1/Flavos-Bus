// Layout do app — fatia 3 (B1): Stack raiz com ProvedorDeDados (feed
// offline) + TemaProvider (sistema/claro/escuro persistido). Headers
// desligados: cada tela desenha o próprio topo (doc Moovit) e o Detalhe
// da linha tem o botão "voltar à busca" (arquivo antigo, intocado).
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ProvedorDeDados } from "@/db/provedor_dados";
import { TemaProvider } from "@/tema/tema_provider";
import { useTema } from "@/tema/theme";

export default function Layout() {
  const tema = useTema();
  return (
    <ProvedorDeDados>
      <TemaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.surface } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="buscar" />
          <Stack.Screen name="linha/[id]" />
        </Stack>
        <StatusBar style={tema.escuro ? "light" : "dark"} />
      </TemaProvider>
    </ProvedorDeDados>
  );
}
