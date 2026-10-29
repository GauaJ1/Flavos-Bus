// Rota inexistente (expo-router 404): em vez da tela padrão em inglês
// ("Unmatched Route / Go back / Sitemap"), uma tela do próprio app, com o
// mesmo aviso teórico e o caminho de volta — o passageiro nunca vê outro idioma.
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTema, type Tema } from "@/tema/theme";
import { AvisoTeorico } from "@/ui/aviso_teorico";
import { EstadoVazio } from "@/ui/estados";

export default function RotaNaoEncontrada() {
  const tema = useTema();
  const router = useRouter();
  return (
    <View style={estilosDe(tema).tela}>
      <AvisoTeorico />
      <EstadoVazio
        titulo="Essa tela não existe"
        explicacao="O endereço aberto não corresponde a nenhuma tela do app. Volte para a busca e escolha a linha pelo número ou pelo nome."
        acaoRotulo="Ir para a busca"
        acao={() => router.replace("/")}
      />
    </View>
  );
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.papel },
  });
}
