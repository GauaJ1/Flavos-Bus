// Tela "Favoritos" — PROVISÓRIA (fatia 3, B1): favorites chega numa fatia
// seguinte; EmptyState com texto HONESTO. Anotada em docs/design/DIRECAO.md
// como provisória a remover.
import { StyleSheet, View } from "react-native";
import { Star } from "phosphor-react-native";
import { espaco, useTema, type Tema } from "@/tema/theme";
import { EmptyState } from "@/ui/empty_state";

export default function Favoritos() {
  const tema = useTema();
  return (
    <View style={estilos(tema).tela}>
      <EmptyState
        icone={Star}
        titulo="Favoritos chega na próxima etapa"
        texto="Guardar linhas para acesso rápido vem adiante. Nada aqui é conteúdo real."
      />
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.surface, padding: espaco.base, paddingTop: espaco.gg },
  });
}
