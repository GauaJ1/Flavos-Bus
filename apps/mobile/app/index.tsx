// Tela "Buscar linhas" (Tarefa 3): busca por número/nome lendo routes do
// flavos.sqlite, 100% offline. Resposta imediata (SQL local); estados
// obrigatórios cobertos: banco carregando, banco ausente/erro, sem resultado.
// Linhas do MVP (doc do projeto: lista inicial) vêm antes no resultado.
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { buscarLinhas, type Linha } from "@flavos/shared";
import { LINHAS_MVP } from "@/dados/linhas_mvp";
import { useDados } from "@/db/provedor_dados";
import { espaco, useTema, type Tema } from "@/tema/theme";
import { AvisoTeorico } from "@/ui/aviso_teorico";
import { CampoBusca } from "@/ui/campo_busca";
import { CartaoLinha } from "@/ui/cartao_linha";
import { Carregando, EstadoErro, EstadoVazio } from "@/ui/estados";

export default function BuscarLinhas() {
  const tema = useTema();
  const estado = useDados();
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [linhas, setLinhas] = useState<Linha[] | null>(null);

  useEffect(() => {
    if (estado.fase !== "pronto") return;
    let vivo = true;
    void buscarLinhas(estado.fonte, texto).then((resultado) => {
      if (vivo) setLinhas(ordemMvp(resultado));
    });
    return () => {
      vivo = false;
    };
  }, [estado, texto]);

  if (estado.fase === "carregando") {
    return (
      <Tela>
        <AvisoTeorico />
        <Carregando rotulo="Abrindo banco offline…" />
      </Tela>
    );
  }

  if (estado.fase === "erro") {
    return (
      <Tela>
        <AvisoTeorico />
        <EstadoErro
          titulo="Banco de dados não abriu"
          detalhe={`O app é offline e lê o flavos.sqlite embutido. Detalhe: ${estado.mensagem}`}
        />
      </Tela>
    );
  }

  const semResultado = linhas !== null && texto.trim().length > 0 && linhas.length === 0;

  return (
    <Tela>
      <AvisoTeorico />
      <View style={estilosDe(tema).cabecalho}>
        <CampoBusca valor={texto} onChangeText={setTexto} />
        <Text style={estilosDe(tema).meta} numberOfLines={1}>
          {linhas === null ? "buscando…" : `${linhas.length} linha(s) · dado do feed ${estado.feed.versao}`}
        </Text>
      </View>

      {semResultado && (
        <EstadoVazio
          titulo="Nenhuma linha com esse nome"
          explicacao="Tenta só o número (ex.: 509) ou parte do nome do bairro."
        />
      )}

      {!semResultado && linhas === null && <Carregando rotulo="Buscando…" />}

      {linhas !== null && (
        <ScrollView>
          {linhas.map((linha) => (
            <CartaoLinha
              key={linha.id}
              linha={linha}
              aoAbrir={(l) => router.push({ pathname: "/linha/[id]", params: { id: l.id } })}
            />
          ))}
        </ScrollView>
      )}
    </Tela>
  );
}

function ordemMvp(linhas: Linha[]): Linha[] {
  const ranking = new Map(LINHAS_MVP.map((id, indice) => [id, indice]));
  return [...linhas].sort(
    (a, b) => (ranking.get(a.id) ?? 10_000) - (ranking.get(b.id) ?? 10_000) ||
      a.numero.localeCompare(b.numero),
  );
}

function Tela({ children }: { children: React.ReactNode }) {
  const tema = useTema();
  return <View style={estilosDe(tema).tela}>{children}</View>;
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.papel },
    cabecalho: { padding: espaco.base, gap: espaco.s },
    meta: { color: tema.tinta2, fontSize: 12 },
  });
}
