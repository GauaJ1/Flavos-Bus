// Tela "Buscar" (fatia 3, B3) — tela cheia, campo com foco automático,
// botão de voltar com ícone phosphor (seta NUNCA em texto). O filtro é a
// FUNÇÃO PURA de filtro_linhas.ts (sem acento/caixa, zeros à esquerda,
// ordem exato > prefixo > contem). Sem resultado: EmptyState com "Limpar
// busca". A lista usa teclado persistente (keyboardShouldPersistTaps).
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, MagnifyingGlass } from "phosphor-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { linhasComCores, type LinhaComCores } from "@/dados/linhas_do_feed";
import { filtrarLinhas } from "@/dados/filtro_linhas";
import { LINHAS_MVP } from "@/dados/linhas_mvp";
import { useDados } from "@/db/provedor_dados";
import { espaco, useTema, type Tema } from "@/tema/theme";
import { EmptyState } from "@/ui/empty_state";
import { LineBadge } from "@/ui/line_badge";
import { SearchBar } from "@/ui/search_bar";
import { Skeleton } from "@/ui/skeleton";

export default function Buscar() {
  const tema = useTema();
  const estado = useDados();
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [linhas, setLinhas] = useState<readonly LinhaComCores[] | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (estado.fase !== "pronto") return;
    let vivo = true;
    setLinhas(null);
    void linhasComCores(estado.fonte)
      .then((r) => {
        if (vivo) setLinhas(r);
      })
      .catch(() => {
        if (vivo) setLinhas([]);
      });
    return () => {
      vivo = false;
    };
  }, [estado, tentativa]);

  const resultados = useMemo(() => {
    if (linhas === null) return null;
    const achados = filtrarLinhas(termo, linhas);
    // em lista SEM termo, o ranking do MVP comanda; digitando, a ordem é a
    // do filtro (exato > prefixo > contem) — que JÁ responde primeiro.
    if (termo.trim().length === 0) return ordemMvp(achados);
    return achados;
  }, [linhas, termo]);

  const aoAbrir = useCallback(
    (linha: LinhaComCores) => router.push({ pathname: "/linha/[id]", params: { id: linha.id } }),
    [router],
  );
  const renderizar = useCallback(
    ({ item }: { item: LinhaComCores }) => <ItemLinha linha={item} aoAbrir={aoAbrir} />,
    [aoAbrir],
  );

  const filtrando = termo.trim().length > 0;

  return (
    <View style={estilos(tema).tela}>
      <View style={estilos(tema).topo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [estilos(tema).voltar, pressed && { opacity: 0.7 }]}
        >
          <ArrowLeft size={22} weight="bold" color={tema.primary} />
        </Pressable>
        <View style={estilos(tema).campoArea}>
          <SearchBar variante="campo" texto={termo} aoMudarTexto={setTermo} autoFocar />
        </View>
      </View>

      {linhas === null ? (
        <View style={estilos(tema).listaFalsa}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} forma="stopRow" />
          ))}
        </View>
      ) : resultados !== null && resultados.length === 0 && filtrando ? (
        <EmptyState
          icone={MagnifyingGlass}
          titulo="Nenhuma linha com esse termo"
          texto="Tente só o número (ex.: 101 acha 0101) ou parte do nome, sem acento."
          acaoRotulo="Limpar busca"
          aoAcionar={() => setTermo("")}
        />
      ) : resultados !== null ? (
        <FlatList
          data={resultados}
          keyExtractor={(l) => l.id}
          renderItem={renderizar}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={{ paddingBottom: espaco.gg }}
        />
      ) : null}
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
      flexDirection: "row",
      alignItems: "center",
      gap: espaco.s,
      padding: espaco.base,
      paddingBottom: espaco.s,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tema.border,
    },
    voltar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    campoArea: { flex: 1 },
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
