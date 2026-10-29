// Tela "Detalhe da linha" (Tarefa 4): aviso teórico no topo (sempre), placa
// do número, próxima saída com contagem em minutos, faixa do dia (data-viz),
// e o quadro por tipo de dia e sentido com horários passados esmaecidos.
// Operadora vem do feed como está declarado ("operadora declarada ANO: X"),
// nunca como dado atual. Tudo do flavos.sqlite — nada inventado.
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import {
  colunaDoDia,
  horariosDaLinha,
  linhaPorId,
  type HorarioParada,
  type Linha,
  type TipoDia,
} from "@flavos/shared";
import { useDados } from "@/db/provedor_dados";
import { espaco, fonteNumeros, useTema, type Tema } from "@/tema/theme";
import { AvisoTeorico } from "@/ui/aviso_teorico";
import { ChipTipoDia } from "@/ui/chip_tipo_dia";
import { IconeRelogio, IconeSeta } from "@/ui/icones";
import { ItemHorario } from "@/ui/item_horario";
import { Carregando, EstadoErro, EstadoVazio } from "@/ui/estados";
import { FaixaHorarios } from "@/ui/faixa_horarios";
import { PlacaLinha } from "@/ui/placa_linha";

const DIAS: readonly TipoDia[] = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

function horaAgoraLocale(): string {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, "0");
  const m = String(agora.getMinutes()).padStart(2, "0");
  const s = String(agora.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function agoraMinutos(h: string): number {
  const [hh, mm] = h.split(":");
  return Number(hh ?? 0) * 60 + Number(mm ?? 0);
}

export default function DetalheLinha() {
  const tema = useTema();
  const estado = useDados();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const routeId = typeof params.id === "string" ? params.id : "";
  const [dia, setDia] = useState<TipoDia>(() => colunaDoDia(new Date()));
  const [tic, setTic] = useState(0);
  const [linhaInfo, setLinhaInfo] = useState<Linha | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTic((n) => n + 1), 30_000); // atualiza "faltam X min"
    return () => clearInterval(t);
  }, []);

  const agora = useMemo(() => horaAgoraLocale(), [tic]);

  useEffect(() => {
    if (estado.fase !== "pronto" || !routeId) return;
    let vivo = true;
    void linhaPorId(estado.fonte, routeId).then((l) => {
      if (vivo) setLinhaInfo(l);
    });
    return () => {
      vivo = false;
    };
  }, [estado, routeId]);

  const [quadro, setQuadro] = useState<Record<string, HorarioParada[]> | null>(null);

  useEffect(() => {
    if (estado.fase !== "pronto" || !routeId) return;
    let vivo = true;
    void horariosDaLinha(estado.fonte, routeId, dia, dataIsoHoje()).then((q) => {
      if (vivo) setQuadro(q);
    });
    return () => {
      vivo = false;
    };
  }, [estado, routeId, dia, agora]);

  if (estado.fase === "carregando") {
    return (
      <Tela>
        <AvisoTeorico />
        <Carregando rotulo="Abrindo banco offline…" />
      </Tela>
    );
  }
  if (estado.fase === "erro" || !routeId) {
    return (
      <Tela>
        <AvisoTeorico />
        <EstadoErro
          titulo="Não deu para abrir a linha"
          detalhe={estado.fase === "erro" ? estado.mensagem : "Identificador de linha ausente."}
          acaoRotulo="Voltar"
          acao={() => router.back()}
        />
      </Tela>
    );
  }
  if (quadro === null) {
    return (
      <Tela>
        <AvisoTeorico />
        <Carregando rotulo="Consultando quadro…" />
      </Tela>
    );
  }

  const numero = linhaInfo?.numero ?? "";
  const nome = linhaInfo?.nome ?? "";
  const descricao = linhaInfo?.descricao ?? "";
  const mOperadora = /operadora declarada (\d{4}): ([^|]+)/.exec(descricao);
  const operadora = mOperadora
    ? `Operadora declarada ${mOperadora[1]}: ${mOperadora[2].trim()}`
    : "";

  const sentidoChaves = Object.keys(quadro).sort();
  const diaHoje = colunaDoDia(new Date());

  let proxima: HorarioParada | null = null;
  if (dia === diaHoje) {
    const todas = sentidoChaves.flatMap((s) => quadro[s] ?? []);
    proxima =
      todas.find((h) => agoraMinutos(h.partida) >= agoraMinutos(agora)) ?? null;
  }
  const partidasDoDia = sentidoChaves
    .flatMap((s) => quadro[s] ?? [])
    .map((h) => h.partida);

  return (
    <Tela>
      <AvisoTeorico />
      <ScrollView contentContainerStyle={{ paddingBottom: espaco.gg }}>
        <View style={estilosDe(tema).cabeca}>
          <PlacaLinha numero={numero} tamanho="grande" />
          <Text style={estilosDe(tema).nomeLinha}>{nome}</Text>
          {operadora !== "" && (
            <Text style={estilosDe(tema).operadora}>{operadora} (declaração; não é dado atual)</Text>
          )}
          <Text style={estilosDe(tema).fonte}>fonte: feed {estado.feed.versao} · gerado em {estado.feed.geradoEm || "—"}</Text>
        </View>

        {proxima ? (
          <View style={estilosDe(tema).proxima}>
            <View style={estilosDe(tema).proximaCabeca}>
              <IconeRelogio cor={tema.acentoSobre} />
              <Text style={estilosDe(tema).proximaRotulo}>PRÓXIMA SAÍDA</Text>
            </View>
            <Text style={[estilosDe(tema).proximaHora, fonteNumeros]}>
              {proxima.partida.slice(0, 5)}
            </Text>
            <Text style={estilosDe(tema).proximaMeta}>
              faltam {Math.max(0, agoraMinutos(proxima.partida) - agoraMinutos(agora))} min · sentido{" "}
              {rotuloSentido(quadro, proxima)}
            </Text>
          </View>
        ) : (
          <Text style={estilosDe(tema).semProxima}>
            {dia === diaHoje ? "Todas as saídas de hoje já passaram." : `Quadro de ${dia} (sem destaque de agora).`}
          </Text>
        )}

        <FaixaHorarios horarios={partidasDoDia} agora={dia === diaHoje ? agora : "04:00:00"} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilosDe(tema).chips}>
          {DIAS.map((d) => (
            <ChipTipoDia key={d} dia={d} selecionado={d === dia} aoEscolher={setDia} />
          ))}
        </ScrollView>

        {sentidoChaves.length === 0 && (
          <EstadoVazio
            titulo="Sem horários nesse tipo de dia"
            explicacao="Esta linha não circula no dia selecionado — escolha outro dia."
          />
        )}

        {sentidoChaves.map((sentido) => {
          const lista = quadro[sentido] ?? [];
          return (
            <View key={sentido} style={estilosDe(tema).sentido}>
              <Text style={estilosDe(tema).sentidoTitulo}>
                {rotuloSentido(quadro, lista[0])} · {lista.length} viagem(ns)
              </Text>
              <View style={estilosDe(tema).grade}>
                {lista.map((h) => (
                  <ItemHorario
                    key={h.tripId}
                    hora={h.partida}
                    passado={dia === diaHoje && agoraMinutos(h.partida) < agoraMinutos(agora)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}>
          <Text style={estilosDe(tema).voltar}>← voltar à busca</Text>
        </Pressable>
      </ScrollView>
    </Tela>
  );
}

function rotuloSentido(quadro: Record<string, HorarioParada[]>, mostra: HorarioParada | undefined): string {
  if (!mostra) return "—";
  return mostra.destino && mostra.destino.trim().length > 0
    ? mostra.destino.trim()
    : `sentido ${mostra.tripId.slice(-2)}`;
}

function dataIsoHoje(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function Tela({ children }: { children: React.ReactNode }) {
  const tema = useTema();
  return <View style={estilosDe(tema).tela}>{children}</View>;
}

function estilosDe(tema: Tema) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: tema.papel },
    cabeca: { padding: espaco.base, gap: 6 },
    nomeLinha: { color: tema.tinta, fontSize: 20, fontWeight: "700" },
    operadora: { color: tema.tinta2, fontSize: 13 },
    fonte: { color: tema.tinta2, fontSize: 11 },
    proxima: {
      margin: espaco.base,
      backgroundColor: tema.acento,
      borderRadius: 16,
      padding: espaco.base,
      gap: 4,
    },
    proximaCabeca: { flexDirection: "row", alignItems: "center", gap: espaco.s },
    proximaRotulo: { color: tema.acentoSobre, fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
    proximaHora: { color: tema.acentoSobre, fontSize: 56, lineHeight: 62 },
    proximaMeta: { color: tema.acentoSobre, fontSize: 14, opacity: 0.9 },
    semProxima: { color: tema.tinta2, fontSize: 14, marginHorizontal: espaco.base },
    chips: { flexGrow: 0, paddingLeft: espaco.base, marginVertical: espaco.base },
    sentido: { paddingHorizontal: espaco.base, marginBottom: espaco.base, gap: espaco.s },
    sentidoTitulo: { color: tema.tinta, fontSize: 14, fontWeight: "700" },
    grade: { flexDirection: "row", flexWrap: "wrap", gap: espaco.s },
    voltar: { color: tema.acento, fontSize: 15, textAlign: "center", padding: espaco.base },
  });
}
