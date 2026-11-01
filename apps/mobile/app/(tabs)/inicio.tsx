// Tela "Início" (rota /inicio) — PROVISÓRIA (fatia 3, B1): a home real chega numa fatia
// seguinte; enquanto isso, EmptyState com texto HONESTO (nenhum conteúdo
// falso). A aba inicial do app é LINHAS (initialRouteName no (tabs)/
// _layout.tsx) enquanto esta tela é provisória. Texto anotado em
// docs/design/DIRECAO.md como provisório a remover.
import { StyleSheet, View } from "react-native";
import { House } from "phosphor-react-native";
import { espaco, useTema, type Tema } from "@/tema/theme";
import { EmptyState } from "@/ui/empty_state";

export default function Inicio() {
  const tema = useTema();
  return (
    <View style={estilos(tema).tela}>
      <EmptyState
        icone={House}
        titulo="Início chega na próxima etapa"
        texto='Esta tela não existe ainda — use a aba "Linhas" aqui embaixo para achar sua linha hoje.'
      />
    </View>
  );
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.surface, padding: espaco.base, paddingTop: espaco.gg },
  });
}
