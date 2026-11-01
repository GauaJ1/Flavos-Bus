// Tela "Linhas" (fatia 3, B2) — é o ARQUIVO index do grupo (rota "/"):
// no expo-router a rota vazia do grupo é sempre o arquivo index, e a aba
// inicial pedida é Linhas enquanto o Início é provisório — então a LISTA
// mora aqui (aba de rótulo "Linhas", key "index" em (tabs)/_layout.tsx) e
// o Início provisório é o arquivo inicio.tsx (rota /inicio).
// Lista REAL do feed, offline. Topo: título + SearchBar variante BOTÃO
// que abre /buscar. Ordem: ranking do MVP (linhas_mvp.ts, nº de viagens
// de dia útil) primeiro, resto por número — o rótulo diz isso em
// linguagem simples (sem lotação/tempo real). NÃO há TheoreticalBadge
// aqui: a lista não tem horário.
// Estados: skeleton (5 itens), erro com "Tentar de novo", vazio (EmptyState).
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Bus } from "phosphor-react-native";
import { memo, useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { LINHAS_MVP } from "@/dados/linhas_mvp";
import { linhasComCores, type LinhaComCores } from "@/dados/linhas_do_feed";
import { useDados } from "@/db/provedor_dados";
import { espaco, tipografia, useTema, type Tema } from "@/tema/theme";
import { EmptyState } from "@/ui/empty_state";
import { LineBadge } from "@/ui/line_badge";
import { SearchBar } from "@/ui/search_bar";
import { Skeleton } from "@/ui/skeleton";

export default function Linhas() {
  const tema = useTema();
  const estado = useDados();
  const router = useRouter();
  const [linhas, setLinhas] = useState<readonly LinhaComCores[] | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (estado.fase !== "pronto") return;
    let vivo = true;
    setLinhas(null);
    void linhasComCores(estado.fonte)
      .then((resultado) => {
        if (vivo) setLinhas(ordemMvp(resultado));
      })
      .catch(() => {
        if (vivo) setLinhas([]);
      });
    return () => {
      vivo = false;
    };
  }, [estado, tentativa]);

  const aoAbrir = useCallback(
    (linha: LinhaComCores) => router.push({ pathname: "/linha/[id]", params: { id: linha.id } }),
    [router],
  );

  const renderizar = useCallback(
    ({ item }: { item: LinhaComCores }) => <ItemLinha linha={item} aoAbrir={aoAbrir} />,
    [aoAbrir],
  );

  return (
    <View style={estilos(tema).tela}>
      <View style={estilos(tema).topo}>
        <Text style={estilos(tema).titulo}>Linhas</Text>
        <SearchBar variante="botao" aoAbrirBusca={() => router.push("/buscar")} />
        <Text style={estilos(tema).meta}>
          Primeiro as do MVP (mais viagens no dia útil); as demais por número.
        </Text>
      </View>

      {linhas === null ? (
        <View style={estilos(tema).listaFalsa}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} forma="stopRow" />
          ))}
        </View>
      ) : estado.fase === "erro" ? (
        <EmptyState
          icone={Bus}
          titulo="Banco de dados não abriu"
          texto={`O app é offline e lê o flavos.sqlite embutido. Detalhe: ${estado.mensagem}`}
          acaoRotulo="Tentar de novo"
          aoAcionar={() => setTentativa((t) => t + 1)}
        />
      ) : linhas.length === 0 ? (
        <EmptyState icone={Bus} titulo="Nenhuma linha no feed" texto="O flavos.sqlite embutido veio sem linhas. Gere o feed de novo e atualize o app." />
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(l) => l.id}
          renderItem={renderizar}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: espaco.gg }}
        />
      )}
    </View>
  );
}

function ordemMvp(linhas: readonly LinhaComCores[]): LinhaComCores[] {
  const ranking = new Map(LINHAS_MVP.map((id, indice) => [id, indice]));
  return [...linhas].sort(
    (a, b) => (ranking.get(a.id) ?? 10_000) - (ranking.get(b.id) ?? 10_000) || a.numero.localeCompare(b.numero),
  );
}

const ItemLinha = memo(function ItemLinha({
  linha,
  aoAbrir,
}: {
  readonly linha: LinhaComCores;
  readonly aoAbrir: (l: LinhaComCores) => void;
}) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Linha ${linha.numero}: ${linha.nome}`}
      onPress={() => aoAbrir(linha)}
      style={({ pressed }) => [estilos(tema).item, pressed && { backgroundColor: tema.surfaceAlt }]}
    >
      <LineBadge numero={linha.numero} corDoFeed={linha.cor} corTextoDoFeed={linha.corTexto} />
      <Text style={estilos(tema).nome} numberOfLines={2}>
        {linha.nome}
      </Text>
    </Pressable>
  );
});

function estilos(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.surface },
    topo: {
      padding: espaco.base,
      paddingBottom: espaco.s,
      gap: espaco.s,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tema.border,
    },
    titulo: { color: tema.text, fontSize: tipografia.titulo, fontWeight: "800" },
    meta: { color: tema.textMuted, fontSize: 13 },
    listaFalsa: { padding: espaco.base, gap: espaco.base },
    item: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: espaco.m,
      paddingHorizontal: espaco.base,
      paddingVertical: espaco.s,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tema.border,
    },
    nome: { flex: 1, color: tema.text, fontSize: 16, lineHeight: 21 },
  });
}
