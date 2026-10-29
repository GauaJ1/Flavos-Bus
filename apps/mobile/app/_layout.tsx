// Layout do app — Expo Router com a pilha principal e o provider offline.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ProvedorDeDados } from "@/db/provedor_dados";

export default function Layout() {
  return (
    <ProvedorDeDados>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Flavos Bus" }} />
      </Stack>
      <StatusBar style="auto" />
    </ProvedorDeDados>
  );
}
