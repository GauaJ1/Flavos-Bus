// Tela "Sobre" (fatia 3, B5):
// - seletor de tema (Segmented genérico): muda NA HORA e persiste no
//   flavos_usuario.db (prova Playwright: clicar Escuro e ler o fundo);
// - data/versão do feed (do PRÓPRIO feed: InfoFeed do provedor);
// - versão do app (mesmo app.json do bundle — sem dependência nova);
// - aviso fixo: "Os horários são teóricos (programados), não mostram a
//   posição dos ônibus";
// - Fonte/créditos SÓ com o que consta no feed (agencies: name + url);
//   o que falta (licença) vai como "indisponível".
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import appJson from "../../app.json";
import { useDados } from "@/db/provedor_dados";
import { useModoTema } from "@/tema/tema_provider";
import { espaco, tipografia, useTema, type Tema } from "@/tema/theme";
import type { ModoTema } from "@/tema/modo";
import { Segmented, type OpcaoSegmented } from "@/ui/segmented";
import { TheoreticalBadge } from "@/ui/theoretical_badge";

const OPCOES_TEMA: readonly OpcaoSegmented<ModoTema>[] = [
  { chave: "sistema", rotulo: "Sistema", acessivel: "Seguir o tema do aparelho" },
  { chave: "claro", rotulo: "Claro", acessivel: "Tema claro sempre" },
  { chave: "escuro", rotulo: "Escuro", acessivel: "Tema escuro sempre" },
];

interface Agencia {
  readonly nome: string;
  readonly url: string;
}

export default function Sobre() {
  const tema = useTema();
  const estado = useDados();
  const { modo, aoEscolherModo, pronto } = useModoTema();
  const [agencias, setAgencias] = useState<readonly Agencia[] | null>(null);
  useEffect(() => {
    if (estado.fase !== "pronto" || agencias !== null) return;
    let vivo = true;
    void estado.fonte
      .consulta<{ name: string; url: string }>("SELECT name, url FROM agencies ORDER BY name")
      .then((linhas) => {
        if (vivo) setAgencias(linhas.map((a) => ({ nome: a.name, url: a.url })));
      })
      .catch(() => {
        if (vivo) setAgencias([]);
      });
    return () => {
      vivo = false;
    };
  }, [estado, agencias]);

  return (
    <ScrollView
      style={estilos(tema).tela}
      contentContainerStyle={estilos(tema).conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos(tema).titulo}>Sobre</Text>

      <Secao titulo="Tema do app" tema={tema}>
        <Segmented opcoes={OPCOES_TEMA} valor={modo} aoEscolher={aoEscolherModo} acessibilidadeGrupo="Tema do app" />
        <Text style={estilos(tema).corpo}>
          {pronto
            ? "Fica salvo no seu aparelho (banco local do app). “Sistema” segue o tema do celular."
            : "Preferência temporária: o banco local do app não respondeu."}
        </Text>
      </Secao>

      <Secao titulo="Os horários deste app" tema={tema}>
        <TheoreticalBadge atualizadoEm={estado.fase === "pronto" ? dataCurta(estado.feed.geradoEm) : ""} />
        <Text style={estilos(tema).corpo}>
          Os horários são teóricos (programados), não mostram a posição dos ônibus. Funciona sem internet: os
          horários ficam dentro do app.
        </Text>
      </Secao>

      <Secao titulo="Dados" tema={tema}>
        <LinhaDado rotulo="Versão do feed" valor={estado.fase === "pronto" && estado.feed.versao ? estado.feed.versao : "indisponível"} tema={tema} />
        <LinhaDado rotulo="Gerado em" valor={estado.fase === "pronto" && estado.feed.geradoEm ? dataCurta(estado.feed.geradoEm) : "indisponível"} tema={tema} />
        <LinhaDado rotulo="Linhas no feed" valor={estado.fase === "pronto" ? String(estado.linhas) : "indisponível"} tema={tema} />
      </Secao>

      <Secao titulo="App" tema={tema}>
        <LinhaDado rotulo="Versão" valor={appJson?.expo?.version ?? "indisponível"} tema={tema} />
      </Secao>

      <Secao titulo="Fonte e créditos" tema={tema}>
        <Text style={estilos(tema).corpo}>
          Linhas e horários: quadro oficial da SEMOB-JP (servicos.semobjp.pb.gov.br/linhas-de-onibus), coletado pelo
          painel Mobilibus/Bus2 — como registrado em docs/DIVERGENCIAS_SEMOB.md. Os dados ficam dentro do app; ele
          funciona sem internet.
        </Text>
        {agencias === null ? (
          <Text style={estilos(tema).corpo}>Procurando operadoras no feed…</Text>
        ) : agencias.length === 0 ? (
          <Text style={estilos(tema).corpo}>Operadoras: indisponível (o feed não traz agências).</Text>
        ) : (
          <Text style={estilos(tema).corpo}>
            Operadoras declaradas no feed: {listaUnicos(agencias.map((a) => a.nome))}. Licença do feed: indisponível
            (não consta no feed nem em docs/).
          </Text>
        )}
      </Secao>
    </ScrollView>
  );
}

function Secao({ titulo, tema, children }: { titulo: string; tema: Tema; children: React.ReactNode }) {
  return (
    <View style={estilos(tema).secao}>
      <Text style={estilos(tema).secaoTitulo}>{titulo}</Text>
      <View style={{ gap: espaco.s }}>{children}</View>
    </View>
  );
}

function LinhaDado({ rotulo, valor, tema }: { rotulo: string; valor: string; tema: Tema }) {
  return (
    <View style={estilos(tema).dado}>
      <Text style={estilos(tema).dadoRotulo}>{rotulo}</Text>
      <Text style={estilos(tema).dadoValor} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

/** "2026-01-10T08:00:00Z" → "10/01/2026 08:00". Vazio/inválido → "indisponível". */
export function dataCurta(iso: string): string {
  if (!iso) return "indisponível";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "indisponível";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

function listaUnicos(nomes: readonly string[]): string {
  const unicos = [...new Set(nomes.filter((n) => n.length > 0))];
  return unicos.length > 0 ? unicos.join(", ") : "indisponível";
}

function estilos(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.surface },
    conteudo: { padding: espaco.base, paddingBottom: espaco.gg, gap: espaco.gg },
    titulo: { color: tema.text, fontSize: tipografia.titulo, fontWeight: "800" },
    secao: { gap: espaco.s },
    secaoTitulo: { color: tema.textMuted, fontSize: tipografia.legenda, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
    corpo: { color: tema.text, fontSize: 15, lineHeight: 21 },
    dado: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: espaco.m, minHeight: 44 },
    dadoRotulo: { color: tema.textMuted, fontSize: 14 },
    dadoValor: { flex: 1, color: tema.text, fontSize: 14, fontWeight: "700", textAlign: "right" },
  });
}
