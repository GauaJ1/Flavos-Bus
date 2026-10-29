// Tela de verificação do scaffold (Tarefa 2): confirma que o app está lendo
// o flavos.sqlite offline (contagem de linhas) e a data do dado. As telas de
// verdade (buscar linhas, detalhe) entram nas tarefas 3 e 4.
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDados } from "@/db/provedor_dados";

export default function Inicio() {
  const estado = useDados();

  return (
    <ScrollView style={estilos.fundo} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.titulo}>Flavos Bus</Text>
      <Text style={estilos.aviso}>
        Horários teóricos (programados), podem diferir do ônibus na rua.
      </Text>

      {estado.fase === "carregando" && <Text style={estilos.texto}>Abrindo banco offline…</Text>}

      {estado.fase === "erro" && (
        <View style={estilos.erroBox}>
          <Text style={estilos.erroTitulo}>Não consegui abrir o banco offline</Text>
          <Text style={estilos.texto}>{estado.mensagem}</Text>
        </View>
      )}

      {estado.fase === "pronto" && (
        <View style={estilos.cartao}>
          <Text style={estilos.numero}>{estado.linhas}</Text>
          <Text style={estilos.rotulo}>linhas carregadas offline</Text>
          <Text style={estilos.meta}>
            feed {estado.feed.versao || "sem versão"} · gerado em{" "}
            {estado.feed.geradoEm || "—"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Contraste AA nos dois temas (cor base da identidade Eco Wave: azul profundo
// com acento âmbar); áreas de toque e leitura sob sol forte (doc seção 8).
const escuro = false;

const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: escuro ? "#0B1220" : "#F4F6FB" },
  conteudo: { padding: 24, gap: 16, paddingTop: 72 },
  titulo: { fontSize: 30, fontWeight: "800", color: escuro ? "#F4F6FB" : "#0B1220" },
  aviso: {
    fontSize: 14,
    lineHeight: 20,
    color: "#3D2E00",
    backgroundColor: "#FFD666",
    borderRadius: 12,
    padding: 12,
  },
  texto: { fontSize: 16, color: escuro ? "#C9D3E8" : "#20293D" },
  erroBox: {
    backgroundColor: "#3A1010",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  erroTitulo: { fontSize: 16, fontWeight: "700", color: "#FFD0D0" },
  cartao: {
    backgroundColor: escuro ? "#141E33" : "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  numero: { fontSize: 44, fontWeight: "800", color: "#1E40AF" },
  rotulo: { fontSize: 16, color: escuro ? "#C9D3E8" : "#20293D" },
  meta: { fontSize: 12, color: "#5B6478" },
});
