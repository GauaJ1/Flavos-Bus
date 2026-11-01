// GALERIA DE DESENVOLVIMENTO — existe só em __DEV__ (em produção renderiza
// VAZIA e nenhuma tela a linka). ?parte=1..6 mostra slices; sem parâmetro
// mostra tudo. O tema segue o SISTEMA (as capturas rodam em claro e escuro).
//
// Seções M3 (fatia atual) + domínio (fatias anteriores). Cada seção declara
// o que é M3 verificado e o que é decisão do projeto.
import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Clock, MapPin, Star, X } from "phosphor-react-native";
import { espaco, forma, usePapeis, type TemaM3 } from "@/tema/theme";
import type { SegmentoDia } from "@/ui/day_segmented";
import { EmptyState } from "@/ui/empty_state";
import { LineBadge } from "@/ui/line_badge";
import { NextDepartureCard } from "@/ui/next_departure_card";
import { Skeleton } from "@/ui/skeleton";
import { StopRow } from "@/ui/stop_row";
import { TheoreticalBadge } from "@/ui/theoretical_badge";
import { TimelineStop } from "@/ui/timeline_stop";
import { BotaoM3 } from "@/ui/botao";
import { Chip, Divider, FilterChipRow, IconButton, ListItem, SearchBarM3, SectionHeader, SegmentedButton, TopAppBar } from "@/ui/primitivos_m3";
import { NavigationBar, type DestinoNav } from "@/ui/navigation_bar";
import BottomSheet from "@/ui/bottom_sheet";
import * as React from "react";

// agora FIXO (determinismo da captura): 2026-01-12 14:23 em Fortaleza = 17:23Z
const AGORA_FIXO = new Date("2026-01-12T17:23:00Z");
const HORARIOS_229 = ["05:00:00", "06:10:00", "14:35:00", "15:10:00"];
const TARDE_B = ["05:10:00", "06:30:00"];

const DESTINOS_3: readonly DestinoNav[] = [
  { chave: "inicio", rotulo: "Início", icone: "inicio" },
  { chave: "linhas", rotulo: "Linhas", icone: "linhas" },
  { chave: "sobre", rotulo: "Sobre", icone: "sobre" },
];
const DESTINOS_4: readonly DestinoNav[] = [
  { chave: "inicio", rotulo: "Início", icone: "inicio" },
  { chave: "paradas", rotulo: "Paradas", icone: "paradas" },
  { chave: "linhas", rotulo: "Linhas", icone: "linhas" },
  { chave: "sobre", rotulo: "Sobre", icone: "sobre" },
];
const DESTINOS_5: readonly DestinoNav[] = [
  { chave: "inicio", rotulo: "Início", icone: "inicio" },
  { chave: "paradas", rotulo: "Paradas", icone: "paradas" },
  { chave: "linhas", rotulo: "Linhas", icone: "linhas" },
  { chave: "favoritos", rotulo: "Favoritos", icone: "favoritos" },
  { chave: "sobre", rotulo: "Sobre", icone: "sobre" },
];

export default function Galeria() {
  const { parte } = useLocalSearchParams<{ parte?: string }>();
  if (!__DEV__) return null;
  const limite = parte === undefined ? 99 : Number(parte);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <GaleriaConteudo limite={limite} />
    </>
  );
}

function GaleriaConteudo({ limite }: { readonly limite: number }) {
  const t = usePapeis();
  const secoes = secoesDaGaleria(t);
  return (
    <ScrollView
      style={{ backgroundColor: t.papeis.surface }}
      contentContainerStyle={{ padding: espaco.base, gap: espaco.gg, paddingBottom: espaco.xg }}
    >
      <Text style={{ color: t.papeis.onSurfaceVariant, fontSize: 13 }}>
        Galeria M3 — tema {t.escuro ? "escuro" : "claro"} (segue o sistema). Medidas verificadas nos tokens.
      </Text>
      {secoes
        .filter((s) => s.grupo <= limite)
        .map((s) => (
          <Secao key={s.titulo} tema={t.papeis} titulo={s.titulo} nota={s.nota}>
            {s.corpo}
          </Secao>
        ))}
    </ScrollView>
  );
}

function secoesDaGaleria(t: TemaM3): readonly {
  readonly grupo: number;
  readonly titulo: string;
  readonly nota?: string;
  readonly corpo: React.ReactNode;
}[] {
  const p = t.papeis;
  return [
    {
      grupo: 1,
      titulo: "NavigationBar — 3 destinos (360×640)",
      corpo: <DemoNav destinos={DESTINOS_3} ativo="linhas" />,
    },
    {
      grupo: 1,
      titulo: "NavigationBar — 4 destinos",
      corpo: <DemoNav destinos={DESTINOS_4} ativo="linhas" />,
    },
    {
      grupo: 1,
      titulo: "NavigationBar — 5 destinos",
      corpo: <DemoNav destinos={DESTINOS_5} ativo="linhas" />,
    },
    {
      grupo: 1,
      titulo: "NavigationBar — indicador VERDE × AZUL (comparativo do Portão B)",
      nota: "Verde = aprovado (secondaryContainer). Azul = alternativa. Rótulo ativo é onSurface nos dois.",
      corpo: (
        <View style={{ gap: espaco.g }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: p.onSurfaceVariant, fontSize: 12 }}>VERDE (aprovado)</Text>
            <NavigationBar destinos={DESTINOS_4} ativo="linhas" aoEscolher={() => undefined} varianteIndicador="verde" />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ color: p.onSurfaceVariant, fontSize: 12 }}>AZUL (alternativa)</Text>
            <NavigationBar destinos={DESTINOS_4} ativo="linhas" aoEscolher={() => undefined} varianteIndicador="azul" />
          </View>
        </View>
      ),
    },
    {
      grupo: 2,
      titulo: "TopAppBar small (voltar + selo + nome + estrela)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <TopAppBar
            titulo="Linha 0101"
            lider={
              <>
                <IconButton rotuloAcessivel="Voltar" aoPressionar={() => undefined} icone={(c) => <X size={24} color={c} />} />
                <LineBadge numero="0101" corDoFeed="FF0000" corTextoDoFeed="FFFFFF" />
              </>
            }
            acoes={<IconButton rotuloAcessivel="Favoritar linha 0101" aoPressionar={() => undefined} selecionado icone={(c) => <Star size={24} weight="fill" color={c} />} />}
          />
          <TopAppBar titulo="Buscar" lider={<IconButton rotuloAcessivel="Voltar" aoPressionar={() => undefined} icone={(c) => <X size={24} color={c} />} />} rolado />
        </View>
      ),
    },
    {
      grupo: 2,
      titulo: "SearchBar M3 (botão e campo — 56dp, sem borda)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <SearchBarM3 variante="botao" aoAbrirBusca={() => undefined} />
          <CampoBuscaDemo />
        </View>
      ),
    },
    {
      grupo: 2,
      titulo: "Botões M3 (filled / tonal / outlined / text + desabilitado)",
      corpo: (
        <View style={{ gap: espaco.base, flexDirection: "row", flexWrap: "wrap" }}>
          <BotaoM3 rotulo="Ver horários" aoPressionar={() => undefined} estilo="filled" />
          <BotaoM3 rotulo="Favoritar" aoPressionar={() => undefined} estilo="tonal" />
          <BotaoM3 rotulo="Mudar sentido" aoPressionar={() => undefined} estilo="outlined" />
          <BotaoM3 rotulo="Cancelar" aoPressionar={() => undefined} estilo="text" />
          <BotaoM3 rotulo="Desabilitado" aoPressionar={() => undefined} estilo="filled" desabilitado />
        </View>
      ),
    },
    {
      grupo: 2,
      titulo: "IconButton (padrão, selecionado e desabilitado)",
      corpo: (
        <View style={{ gap: espaco.base, flexDirection: "row" }}>
          <IconButton rotuloAcessivel="Favoritar" aoPressionar={() => undefined} icone={(c) => <Star size={24} color={c} />} />
          <IconButton rotuloAcessivel="Favoritado" aoPressionar={() => undefined} selecionado icone={(c) => <Star size={24} weight="fill" color={c} />} />
          <IconButton rotuloAcessivel="Indisponível" aoPressionar={() => undefined} desabilitado icone={(c) => <Clock size={24} color={c} />} />
        </View>
      ),
    },
    {
      grupo: 3,
      titulo: "SegmentedButton (Útil / Sábado / Domingo)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <LinhaSegmentosSegmento valor="util" />
          <LinhaSegmentosSegmento valor="sabado" />
        </View>
      ),
    },
    {
      grupo: 3,
      titulo: "Chips M3 (filter ativo/inativo, assist, desabilitado)",
      nota: "Forma do M3: raio 8 (não é pílula). Inativo = contorno outline.",
      corpo: (
        <View style={{ gap: espaco.base, flexDirection: "row", flexWrap: "wrap" }}>
          <Chip rotulo="Útil" selecionado aoPressionar={() => undefined} />
          <Chip rotulo="Sábado" aoPressionar={() => undefined} />
          <Chip rotulo="Assist" tipo="assist" aoPressionar={() => undefined} icone={(c) => <Clock size={18} color={c} />} />
          <Chip rotulo="Desabilitado" desabilitado aoPressionar={() => undefined} />
        </View>
      ),
    },
    {
      grupo: 3,
      titulo: "FilterChipRow (estrela = favoritas, Todas)",
      corpo: <DemoFiltros />,
    },
    {
      grupo: 4,
      titulo: "ListItem (56 / 72 / 88 + selecionado)",
      corpo: (
        <View style={{ gap: 4 }}>
          <ListItem titulo="Linha 0101" apoio="Terminal Central → Varadouro" linhas={2} aoPressionar={() => undefined} />
          <ListItem titulo="Terminal Tambaú" linhas={1} iconeLider={<MapPin size={24} color={p.onSurfaceVariant} />} aoPressionar={() => undefined} />
          <ListItem titulo="Selecionado" apoio="secondaryContainer" linhas={2} selecionado aoPressionar={() => undefined} />
          <Divider />
          <ListItem titulo="Desabilitado" linhas={1} desabilitado aoPressionar={() => undefined} />
        </View>
      ),
    },
    {
      grupo: 4,
      titulo: "SectionHeader (labelLarge onSurfaceVariant, sem maiúsculas)",
      corpo: (
        <View style={{ gap: 4 }}>
          <SectionHeader rotulo="São Luís (SET)" />
          <ListItem titulo="Linha 0002" linhas={1} />
          <SectionHeader rotulo="Operada por outra agência" />
          <ListItem titulo="Linha 0102" linhas={1} />
        </View>
      ),
    },
    {
      grupo: 5,
      titulo: "LineBadge (regra 3:1 automática — pares REAIS do feed)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <View style={{ flexDirection: "row", gap: espaco.s, flexWrap: "wrap" }}>
            <LineBadge numero="0002" corDoFeed="0000FF" corTextoDoFeed="FFFFFF" />
            <LineBadge numero="E550" corDoFeed="A1A1A1" corTextoDoFeed="FFFFFF" />
            <LineBadge numero="0101" corDoFeed="FF0000" corTextoDoFeed="FFFFFF" />
            <LineBadge numero="0002A" corDoFeed="0000FF" corTextoDoFeed="FFFFFF" />
          </View>
          <Text style={{ color: p.onSurfaceVariant, fontSize: 13 }}>
            E550: o par do feed (branco sobre #A1A1A1) não alcança 3:1 — o app troca SÓ o texto para preto; o fundo segue o feed.
          </Text>
        </View>
      ),
    },
    {
      grupo: 5,
      titulo: "TheoreticalBadge (único usuário das cores theoretical*)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <TheoreticalBadge atualizadoEm="2026-01-19T03:10:00Z" />
          <TheoreticalBadge atualizadoEm="19/01/2026" />
          <TheoreticalBadge atualizadoEm="dadoimpuro" />
        </View>
      ),
    },
    {
      grupo: 5,
      titulo: "NextDepartureCard (3 estados, agora fixo = 14:23 Fortaleza)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <NextDepartureCard horariosOntem={["24:30:00"]} horariosHoje={HORARIOS_229} horariosAmanha={TARDE_B} agora={AGORA_FIXO} />
          <NextDepartureCard horariosOntem={[]} horariosHoje={["05:00:00", "14:00:00"]} horariosAmanha={TARDE_B} agora={AGORA_FIXO} />
          <NextDepartureCard horariosOntem={[]} horariosHoje={[]} horariosAmanha={[]} agora={AGORA_FIXO} />
        </View>
      ),
    },
    {
      grupo: 6,
      titulo: "TimelineStop (origem = círculo, destino = quadrado, anel no meio)",
      nota: "Conector 2dp na cor da LINHA do feed. Forma comunica origem/destino além da cor.",
      corpo: <DemoTimeline />,
    },
    {
      grupo: 6,
      titulo: "StopRow (1 linha e 8 linhas com +X)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <StopRow nome="Terminal Tambaú" distanciaMin={7} linhas={[{ numero: "0002", cor: "0000FF", corTexto: "FFFFFF" }]} />
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
        </View>
      ),
    },
    {
      grupo: 6,
      titulo: "Skeleton (sem animação em loop)",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <Skeleton forma="busca" />
          <Skeleton forma="proxima" />
          <Skeleton forma="stopRow" />
        </View>
      ),
    },
    {
      grupo: 7,
      titulo: "EmptyState",
      corpo: (
        <View style={{ gap: espaco.base }}>
          <EmptyState icone={MapPin} titulo="Nenhuma parada por aqui" texto="A parada mais próxima pode estar fora da área coberta pelo feed atual." acaoRotulo="Ver linhas" aoAcionar={() => undefined} />
          <EmptyState icone={Clock} titulo="Favoritos vazio" texto="Toque na estrela de uma linha para acompanhá-la aqui." />
        </View>
      ),
    },
    {
      grupo: 7,
      titulo: "BottomSheet M3 (docked: surfaceContainerLow, cantos 28, alça 32×4)",
      corpo: (
        <View style={{ height: 420, borderRadius: forma.grande, overflow: "hidden", backgroundColor: p.surfaceContainer, padding: espaco.s }}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <BottomSheet alturaContainer={400}>
              <Text style={{ color: p.onSurface, fontSize: 22, lineHeight: 28 }}>Próximas saídas</Text>
              <Text style={{ color: p.onSurfaceVariant, fontSize: 16, lineHeight: 24 }}>
                Painel surfaceContainerLow com elevação level1 (única sombra do app). Três encaixes.
              </Text>
            </BottomSheet>
          </View>
        </View>
      ),
    },
  ];
}

function DemoNav({ destinos, ativo }: { readonly destinos: readonly DestinoNav[]; readonly ativo: string }) {
  return <NavigationBar destinos={destinos} ativo={ativo} aoEscolher={() => undefined} />;
}

function DemoTimeline() {
  const linha = "FF0000";
  return (
    <View>
      <TimelineStop nome="Terminal Central" horario="14:35" variante="primeira" corLinha={linha} />
      <TimelineStop nome="Av. João Agripino, 2100" horario="14:41" atual corLinha={linha} />
      <TimelineStop nome="R. São José, 310" horario="14:46" corLinha={linha} />
      <TimelineStop nome="Av. Floriano Peixoto, 42" horario="14:52" corLinha={linha} />
      <TimelineStop nome="Terminal Varadouro" horario="15:03" variante="ultima" corLinha={linha} />
    </View>
  );
}

function DemoFiltros() {
  const [sel, setSel] = React.useState<readonly string[]>(["favoritas"]);
  const opcoes = [
    { chave: "favoritas", rotulo: "Favoritas", icone: (c: string) => <Star size={18} color={c} /> },
    { chave: "todas", rotulo: "Todas" },
  ] as const;
  return (
    <FilterChipRow
      opcoes={opcoes}
      selecionados={sel}
      aoAlternar={(c) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
      acessibilidadeGrupo="Filtros de linhas"
    />
  );
}

function CampoBuscaDemo() {
  const [q, setQ] = React.useState("");
  return <SearchBarM3 variante="campo" texto={q} aoMudarTexto={setQ} />;
}

function LinhaSegmentosSegmento({ valor }: { readonly valor: SegmentoDia }) {
  const [atual, setAtual] = React.useState<SegmentoDia>(valor);
  const opcoes = [
    { chave: "util" as const, rotulo: "Útil" },
    { chave: "sabado" as const, rotulo: "Sábado" },
    { chave: "domingo" as const, rotulo: "Domingo" },
  ];
  return <SegmentedButton opcoes={opcoes} valor={atual} aoEscolher={setAtual} acessibilidadeGrupo="Tipo de dia" />;
}

function Secao({
  tema,
  titulo,
  nota,
  children,
}: {
  readonly tema: TemaM3["papeis"];
  readonly titulo: string;
  readonly nota?: string | undefined;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={{ gap: espaco.base }}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: tema.onSurface, fontSize: 15, fontWeight: "700" }}>{titulo}</Text>
        {nota ? <Text style={{ color: tema.onSurfaceVariant, fontSize: 12 }}>{nota}</Text> : null}
      </View>
      <View style={{ gap: espaco.base }}>{children}</View>
    </View>
  );
}
