// GALERIA DE DESENVOLVIMENTO — componente a componente (doc Moovit §5):
// existe só em __DEV__: em build de produção a rota renderiza VAZIA (guard
// abaixo), e nenhuma tela a linka. OBS.: o dono pediu o nome "_galeria"
// — o Expo Router ignora arquivos com prefixo "_" (não viram rota), então
// o nome aqui é "galeria" com o guard __DEV__ cumprindo o mesmo papel.
//
// Os casos pedidos: badge do número mais longo, uma E550 (override), uma de
// fundo vermelho; aviso teórico; próxima saída nos 3 estados; StopRow com 1
// e 8 linhas; TimelineStop com 6 paradas; Skeleton; EmptyState; DaySegmented
// nos 3 valores. Tema claro/escuro: a página usa o tema do SISTEMA (as
// capturas de verificação rodam em colorScheme light e dark).
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Clock, MapPin } from "phosphor-react-native";
import { espaco, raio, tipografia, useTema, type Tema } from "@/tema/theme";
import { DaySegmented, type SegmentoDia } from "@/ui/day_segmented";
import { EmptyState } from "@/ui/empty_state";
import { LineBadge } from "@/ui/line_badge";
import { NextDepartureCard } from "@/ui/next_departure_card";
import { SearchBar } from "@/ui/search_bar";
import { Skeleton } from "@/ui/skeleton";
import { StopRow } from "@/ui/stop_row";
import { TheoreticalBadge } from "@/ui/theoretical_badge";
import { TimelineStop } from "@/ui/timeline_stop";
import BottomSheet from "@/ui/bottom_sheet";
import * as React from "react";

// agora FIXO (determinismo da captura): 2026-01-12 14:23 em Fortaleza = 17:23Z
const AGORA_FIXO = new Date("2026-01-12T17:23:00Z");
const HORARIOS_229 = ["05:00:00", "06:10:00", "14:35:00", "15:10:00"];
const TARDE_B = ["05:10:00", "06:30:00"];

export default function Galeria() {
  if (!__DEV__) {
    // fora do build de desenvolvimento: rota inexistente de fato
    return null;
  }
  return <GaleriaConteudo />;
}

function GaleriaConteudo() {
  const tema = useTema();
  return (
    <ScrollView style={{ backgroundColor: tema.surface }} contentContainerStyle={{ padding: espaco.base, gap: espaco.gg, paddingBottom: espaco.xg }}>
      <Text style={{ color: tema.textMuted, fontSize: 13 }}>
        Galeria de componentes — tema {tema.escuro ? "escuro" : "claro"} (segue o sistema)
      </Text>

      <Secao tema={tema} titulo="LineBadge (regra 3:1 automática — pares REAIS do feed)">
        <View style={{ flexDirection: "row", gap: espaco.s, flexWrap: "wrap" }}>
          {/* 0002 azul: branco 8.59:1 — mantém o par do feed */}
          <LineBadge numero="0002" corDoFeed="0000FF" corTextoDoFeed="FFFFFF" />
          {/* as 3 do feed cujo par branca/grade cinza < 3:1 — texto vira PRETO */}
          <LineBadge numero="E550" corDoFeed="A1A1A1" corTextoDoFeed="FFFFFF" />
          <LineBadge numero="E551" corDoFeed="A1A1A1" corTextoDoFeed="FFFFFF" />
          <LineBadge numero="E600" corDoFeed="A1A1A1" corTextoDoFeed="FFFFFF" />
          {/* fundo vermelho REAL do feed: 0101 (branco 4.0:1 >= 3 — mantém) */}
          <LineBadge numero="0101" corDoFeed="FF0000" corTextoDoFeed="FFFFFF" />
          {/* renderização com sufixo de letra (formato mais longo visto no feed) */}
          <LineBadge numero="0002A" corDoFeed="0000FF" corTextoDoFeed="FFFFFF" />
        </View>
        <Text style={{ color: tema.textMuted, fontSize: 13 }}>
          E550/E551/E600: o par do feed (branco sobre #A1A1A1) não alcança 3:1 —
          o app troca SÓ o texto para preto; o fundo segue o feed.
        </Text>
      </Secao>

      <Secao tema={tema} titulo="TheoreticalBadge (único usuário das cores theoretical*)">
        <TheoreticalBadge atualizadoEm="2026-01-19T03:10:00Z" />
        <TheoreticalBadge atualizadoEm="19/01/2026" />
        <TheoreticalBadge atualizadoEm="dadoimpuro" /> {/* sem data: não inventa */}
      </Secao>

      <Secao tema={tema} titulo="SearchBar (botão e campo)">
        <SearchBar variante="botao" aoAbrirBusca={() => undefined} />
        <SearchBar variante="campo" texto="" aoMudarTexto={() => undefined} />
      </Secao>

      <Secao tema={tema} titulo="DaySegmented (3 estados, toque >= 44)">
        <LinhaSegmentosSegmento valor="util" />
        <LinhaSegmentosSegmento valor="sabado" />
        <LinhaSegmentosSegmento valor="domingo" />
      </Secao>

      <Secao tema={tema} titulo="NextDepartureCard (3 estados, agora fixo = 14:23 Fortaleza)">
        <NextDepartureCard
          horariosOntem={["24:30:00"]}
          horariosHoje={HORARIOS_229}
          horariosAmanha={TARDE_B}
          agora={AGORA_FIXO}
        />
        <NextDepartureCard
          horariosOntem={[]}
          horariosHoje={["05:00:00", "14:00:00"]}
          horariosAmanha={TARDE_B}
          agora={AGORA_FIXO}
        />
        <NextDepartureCard horariosOntem={[]} horariosHoje={[]} horariosAmanha={[]} agora={AGORA_FIXO} />
      </Secao>

      <Secao tema={tema} titulo="StopRow (1 linha e 8 linhas com +X)">
        <StopRow
          nome="Terminal Tambaú"
          distanciaMin={7}
          linhas={[{ numero: "0002", cor: "0000FF", corTexto: "FFFFFF" }]}
        />
        <StopRow
          nome="Av. Presidente Vargas, 1234 — Centro (em frente ao nº 2200)"
          distanciaMin={null}
          linhas={[
            { numero: "0002", cor: "0000FF", corTexto: "FFFFFF" },
            { numero: "0003", cor: "0000FF", corTexto: "FFFFFF" },
            { numero: "0101", cor: "FF0000", corTexto: "FFFFFF" },
            { numero: "0102", cor: "FF0000", corTexto: "FFFFFF" },
            { numero: "0106", cor: "FF0000", corTexto: "FFFFFF" },
            { numero: "E550", cor: "A1A1A1", corTexto: "FFFFFF" },
            { numero: "E551", cor: "A1A1A1", corTexto: "FFFFFF" },
            { numero: "E155", cor: "A1A1A1", corTexto: "000000" },
          ]}
        />
      </Secao>

      <Secao tema={tema} titulo="TimelineStop (6 paradas, atual na 2ª)">
        <View>
          <TimelineStop nome="Terminal Central" horario="14:35" variante="primeira" />
          <TimelineStop nome="Av. João Agripino, 2100" horario="14:41" atual />
          <TimelineStop nome="R. São José, 310" horario="14:46" />
          <TimelineStop nome="Av. Floriano Peixoto, 42" horario="14:52" />
          <TimelineStop nome="Praça Independência" horario="14:57" />
          <TimelineStop nome="Terminal Varadouro" horario="15:03" variante="ultima" />
        </View>
      </Secao>

      <Secao tema={tema} titulo="Skeleton (sem animação em loop)">
        <View style={{ gap: espaco.m }}>
          <Skeleton forma="busca" />
          <Skeleton forma="proxima" />
          <Skeleton forma="stopRow" />
          <View style={{ flexDirection: "row", gap: espaco.s }}>
            <Skeleton forma="badge" />
            <Skeleton forma="textoLinha" />
          </View>
        </View>
      </Secao>

      <Secao tema={tema} titulo="EmptyState">
        <EmptyState
          icone={MapPin}
          titulo="Nenhuma parada por aqui"
          texto="A parada mais próxima pode estar fora da área coberta pelo feed atual."
          acaoRotulo="Ver linhas"
          aoAcionar={() => undefined}
        />
        <EmptyState icone={Clock} titulo="Favoritos vazio" texto="Toque na estrela de uma linha para acompanhá-la aqui." />
      </Secao>

      <Secao tema={tema} titulo="BottomSheet (web: toque na alça · nativo: arrasto)">
        <View style={{ height: 480, borderWidth: 1, borderColor: tema.border, borderRadius: raio.cartao, overflow: "hidden", backgroundColor: tema.surfaceAlt, padding: espaco.s }}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <BottomSheet alturaContainer={448}>
              <Text style={{ color: tema.text, fontSize: tipografia.titulo, fontWeight: "700" }}>Próximas saídas</Text>
              <Text style={{ color: tema.textMuted, fontSize: tipografia.corpo, lineHeight: 22 }}>
                O painel usa surface do tema; a alça é estrutural. No celular, arrastar
                para cima aumenta até o próximo encaixe (3 alturas).
              </Text>
            </BottomSheet>
          </View>
        </View>
      </Secao>
    </ScrollView>
  );
}

function LinhaSegmentosSegmento({ valor }: { readonly valor: SegmentoDia }) {
  const [atual, setAtual] = React.useState<SegmentoDia>(valor);
  return <DaySegmented valor={atual} aoEscolher={setAtual} />;
}

function Secao({
  tema,
  titulo,
  children,
}: {
  readonly tema: Tema;
  readonly titulo: string;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={{ gap: espaco.m }}>
      <Text style={{ color: tema.text, fontSize: 15, fontWeight: "800", letterSpacing: 0.2 }}>{titulo}</Text>
      <View style={{ gap: espaco.m }}>{children}</View>
    </View>
  );
}
