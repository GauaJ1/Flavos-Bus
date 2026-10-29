# Montagem das tabelas GTFS a partir dos dados brutos decifrados (data/raw/).
# Princípios: identificadores vêm da fonte (estáveis para favoritos do app),
# nada é inventado — toda lacuna/ambiguidade vira uma Nota no relatório.

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ..cache import KIND_LISTA, KIND_TIMETABLE, caminho_do_arquivo
from ..cryptojs import decifrar_objeto
from ..sources.bus2 import FRASE_PUBLICA
from .polyline import decodificar_polyline

DIAS_GTFS = ("seg", "ter", "qua", "qui", "sex", "sab", "dom")
DIAS_COLUNAS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")

FUSO = "America/Sao_Paulo"  # valor vindo do próprio painel (get-project)
LANG = "pt-BR"
ID_AGENCY = "SEMOB"
URL_AGENCY = "https://joaopessoa.pb.gov.br/"


@dataclass
class Nota:
    severidade: str  # "erro" | "aviso" | "informacao"
    codigo: str
    mensagem: str

    def linha(self) -> str:
        return f"[{self.severidade.upper()}] {self.codigo}: {self.mensagem}"


@dataclass
class Tabelas:
    agency: list[dict[str, str]] = field(default_factory=list)
    routes: list[dict[str, str]] = field(default_factory=list)
    stops: list[dict[str, str]] = field(default_factory=list)
    calendar: list[dict[str, str]] = field(default_factory=list)
    shapes: list[dict[str, str]] = field(default_factory=list)
    trips: list[dict[str, str]] = field(default_factory=list)
    stop_times: list[dict[str, str]] = field(default_factory=list)
    feed_info: list[dict[str, str]] = field(default_factory=list)
    notas: list[Nota] = field(default_factory=list)

    def nota(self, severidade: str, codigo: str, mensagem: str) -> None:
        self.notas.append(Nota(severidade, codigo, mensagem))

    def resumo_notas(self) -> Counter[str]:
        return Counter(f"{n.severidade}:{n.codigo}" for n in self.notas)


# ── utilidades de conversão ────────────────────────────────────────────────────


def _segundos(hhmmss: object) -> int:
    """'02:34:05' → segundos (tolerante: 'MM:SS' também é aceito)."""
    partes = str(hhmmss or "").strip().split(":")
    numeros = [int(p) for p in partes if p.strip().isdigit()]
    while len(numeros) < 3:
        numeros.append(0)
    horas, minutos, segundos = numeros[0], numeros[1], numeros[2]
    return horas * 3600 + minutos * 60 + segundos


def _tempo_gtfs(segundos_totais: int) -> str:
    """Segundos → 'H:MM:SS' (H pode passar de 23; GTFS permite)."""
    horas, resto = divmod(segundos_totais, 3600)
    minutos, segundos = divmod(resto, 60)
    return f"{horas}:{minutos:02d}:{segundos:02d}"


def _data_gaia(iso: object) -> str:
    """'2026-12-31T00:00:00.000Z' → '20261231' (formato GTFS)."""
    parte = str(iso or "").split("T")[0].replace("-", "")
    if len(parte) != 8 or not parte.isdigit():
        raise ValueError(f"data fora do esperado: {iso!r}")
    return parte


def _cor_hex(valor: object, tab: Tabelas, rsn: str, campo: str) -> str:
    """'#ff0000' → 'FF0000'; inválido → '' com nota (nunca inventa cor)."""
    texto = str(valor or "").removeprefix("#").strip().upper()
    if not texto:
        return ""
    if len(texto) != 6 or any(c not in "0123456789ABCDEF" for c in texto):
        tab.nota(
            "aviso",
            "COR_INVALIDA",
            f"linha {rsn}: {campo}={valor!r} fora do padrão; campo vazio",
        )
        return ""
    return texto


def _nome_longa(rota: dict[str, Any]) -> str:
    """route_long_name na ordem: rln → fmt sem o prefixo do número → sentidos."""
    rln = str(rota.get("rln") or "").strip()
    if rln:
        return rln
    fmt = str(rota.get("fmt") or "").strip()
    if " - " in fmt:
        resto = fmt.split(" - ", 1)[1].strip()
        if resto:
            return resto
    for campo in ("ol", "il", "cl"):
        nome = str(rota.get(campo) or "").strip()
        if nome:
            return nome
    return ""


def _assinatura_parada(parada: dict[str, Any]) -> tuple[str, str, str, str, str]:
    """Assinatura física/nome da parada para dedupe e detecção de divergência."""
    lat_texto = str(parada.get("lat") or "").strip()
    lon_texto = str(parada.get("lon") or "").strip()
    lat = str(round(float(lat_texto), 6)) if lat_texto else ""
    lon = str(round(float(lon_texto), 6)) if lon_texto else ""
    return (
        lat,
        lon,
        str(parada.get("sn") or ""),
        str(parada.get("st") or ""),
        str(parada.get("stn") or ""),
    )


# ── entrada decifrada ──────────────────────────────────────────────────────────


@dataclass
class Entrada:
    """Tudo que foi coletado, já decifrado, pronto para montar o feed."""

    rotas: list[dict[str, Any]]  # dicionários completos do get-routes
    timetables: dict[str, list[dict[str, Any]]]  # rsn → lista de viagens
    feed_hash: str  # hash do projeto publicado pelo painel (get-project)
    data_geracao: str  # YYYY-MM-DD para feed_version

    @property
    def faltando(self) -> list[str]:
        return [str(r["rsn"]) for r in self.rotas if str(r["rsn"]) not in self.timetables]


def carregar_entrada(
    raw_dir: Path, feed_hash: str = "", data_geracao: str | None = None
) -> Entrada:
    """Lê data/raw (lista_geral.json + linha_*/timetable.json) decifrando com a chave pública."""
    raw_dir = Path(raw_dir)
    envelope_lista = json.loads(
        caminho_do_arquivo(raw_dir, KIND_LISTA).read_text(encoding="utf-8")
    )
    rotas = decifrar_objeto(str(envelope_lista["data"]), FRASE_PUBLICA)
    timetables: dict[str, Any] = {}
    for rota in rotas:
        rsn = str(rota.get("rsn"))
        caminho = caminho_do_arquivo(raw_dir, KIND_TIMETABLE, rsn)
        if not caminho.is_file():
            continue
        envelope = json.loads(caminho.read_text(encoding="utf-8"))
        timetables[rsn] = decifrar_objeto(str(envelope["data"]), FRASE_PUBLICA)
    if data_geracao is None:
        data_geracao = datetime.now(UTC).strftime("%Y-%m-%d")
    return Entrada(
        rotas=[dict(r) for r in rotas],
        timetables=timetables,
        feed_hash=feed_hash,
        data_geracao=data_geracao,
    )


# ── montagem ───────────────────────────────────────────────────────────────────


def _montar_routes(entrada: Entrada, tab: Tabelas) -> None:
    for rota in entrada.rotas:
        rsn = str(rota.get("rsn"))
        longa = _nome_longa(rota)
        if not longa:
            tab.nota(
                "aviso",
                "LINHA_SEM_NOME_LONGO",
                f"linha {rsn} sem nome longo conhecido; o campo fica vazio",
            )
        tab.routes.append(
            {
                "route_id": str(rota.get("rid")),
                "agency_id": ID_AGENCY,
                "route_short_name": rsn,
                "route_long_name": longa,
                "route_type": "3",  # fonte não marca modal; ônibus é o caso das 84 linhas
                "route_color": _cor_hex(rota.get("rc"), tab, rsn, "rc"),
                "route_text_color": _cor_hex(rota.get("rtc"), tab, rsn, "rtc"),
            }
        )
    tab.nota(
        "informacao",
        "ROUTE_TYPE_FIXO",
        "route_type=3 (ônibus) para todas as linhas: a fonte não publica modal; "
        "linhas com prefixo não numérico (CBTU, E, I, T) merecem revisão futura.",
    )


def _montar_stops(entrada: Entrada, tab: Tabelas) -> dict[str, dict[str, str]]:
    """Dedupe global por sid: vence a assinatura mais frequente; divergências viram nota."""
    variantes: dict[str, Counter[tuple[str, str, str, str, str]]] = {}
    for viagens in entrada.timetables.values():
        for viagem in viagens:
            for parada in viagem.get("stops") or []:
                sid = str(parada.get("sid"))
                variantes.setdefault(sid, Counter())[_assinatura_parada(parada)] += 1

    tabelada: dict[str, dict[str, str]] = {}
    for sid, contador in variantes.items():
        (lat, lon, sn, st, stn), ocorrencias = contador.most_common(1)[0]
        divergentes = len(contador) - 1
        if divergentes:
            outras = [s for s, _ in contador.most_common()[1:2]]
            tab.nota(
                "aviso",
                "PARADA_DIVERGENTE",
                f"sid {sid}: {divergentes} assinatura(s) divergente(s) entre viagens; "
                f"usada a mais frequente ({ocorrencias}x); exemplo divergente: {outras}",
            )
        if not lat or not lon:
            tab.nota(
                "erro",
                "PARADA_SEM_COORDENADA",
                f"sid {sid} sem lat/lon: não pode entrar no stops.txt",
            )
            continue
        nome = sn or st
        if not nome:
            nome = f"Parada {sid}"
            tab.nota(
                "aviso",
                "PARADA_SEM_NOME",
                f"sid {sid} sem sn/st; nome mínimo necessário aplicado",
            )
        tabelada[sid] = {
            "stop_id": sid,
            "stop_code": stn,
            "stop_name": nome,
            "stop_lat": f"{float(lat):.6f}",
            "stop_lon": f"{float(lon):.6f}",
        }
    tab.stops = sorted(tabelada.values(), key=lambda p: int(p["stop_id"]))
    return tabelada


def _montar_calendar(entrada: Entrada, tab: Tabelas) -> None:
    """Serviços globais dedupe por sid; divergência de flags/datas vira nota."""
    variantes: dict[str, Counter[bytes]] = {}
    modelos: dict[bytes, dict[str, Any]] = {}
    for viagens in entrada.timetables.values():
        for viagem in viagens:
            for servico in viagem.get("services") or []:
                sid = str(servico.get("sid"))
                chave = json.dumps(
                    {
                        **{dia: str(servico.get(dia, "0")) for dia in DIAS_GTFS},
                        "sd": servico.get("sd"),
                        "ed": servico.get("ed"),
                    },
                    sort_keys=True,
                ).encode("utf-8")
                variantes.setdefault(sid, Counter())[chave] += 1
                modelos[chave] = servico

    for sid, contador in variantes.items():
        chave, ocorrencias = contador.most_common(1)[0]
        if len(contador) > 1:
            tab.nota(
                "aviso",
                "SERVICO_DIVERGENTE",
                f"sid {sid}: {len(contador)} variantes de dias/datas entre linhas; "
                f"usada a mais frequente ({ocorrencias}x)",
            )
        servico = modelos[chave]
        registro: dict[str, str] = {"service_id": sid}
        for dia_fonte, coluna in zip(DIAS_GTFS, DIAS_COLUNAS, strict=True):
            registro[coluna] = str(servico.get(dia_fonte, "0"))
        registro["start_date"] = _data_gaia(servico.get("sd"))
        registro["end_date"] = _data_gaia(servico.get("ed"))
        tab.calendar.append(registro)
    tab.calendar.sort(key=lambda r: int(r["service_id"]))
    tab.nota(
        "informacao",
        "CALENDAR_DATES_AUSENTE",
        "calendar_dates.txt não é gerado: a fonte não publica feriados/dias atípicos. "
        "A confirmar com a SEMOB (doc seção 6 lista o arquivo como 'necessário para feriados').",
    )


def _viagens_do_tid(entrada: Entrada, tid: int) -> list[dict[str, Any]]:
    """A primeira viagem com este tid (shapes são por padrão de viagem)."""
    for viagens in entrada.timetables.values():
        for viagem in viagens:
            if int(viagem["tid"]) == tid:
                return [viagem]
    return []


def _montar_shapes(entrada: Entrada, tab: Tabelas) -> dict[int, str]:
    """Um shape por padrão de viagem (tid): sh-<tid>. Devolve tid → shape_id."""
    mapa: dict[int, str] = {}
    densidades: dict[int, int] = {}
    for viagens in entrada.timetables.values():
        for viagem in viagens:
            tid = int(viagem["tid"])
            texto = str(viagem.get("sp") or "")
            if not texto:
                continue
            pontos = decodificar_polyline(texto)
            if not pontos:
                continue
            if tid in mapa:
                if len(pontos) != densidades[tid]:
                    tab.nota(
                        "aviso",
                        "SHAPE_TID_REPETIDO",
                        f"tid {tid} aparece com shapes distintos entre linhas; "
                        "usado o primeiro; revisar",
                    )
                continue
            mapa[tid] = f"sh-{tid}"
            densidades[tid] = len(pontos)

    for tid in sorted(mapa):
        modelo = _viagens_do_tid(entrada, tid)[0]
        for sequencia, (lat, lon) in enumerate(
            decodificar_polyline(str(modelo.get("sp") or "")), start=1
        ):
            tab.shapes.append(
                {
                    "shape_id": mapa[tid],
                    "shape_pt_lat": f"{lat:.6f}",
                    "shape_pt_lon": f"{lon:.6f}",
                    "shape_pt_sequence": str(sequencia),
                }
            )
    return mapa


def _montar_trips_e_stop_times(
    entrada: Entrada,
    tab: Tabelas,
    stops_tabeladas: dict[str, dict[str, str]],
    shapes_mapa: dict[int, str],
) -> None:
    """Cada partida real (serviço × dep) de cada padrão de viagem vira um trip GTFS."""
    contagens: Counter[str] = Counter()
    for rota in entrada.rotas:
        rsn = str(rota["rsn"])
        rid = str(rota["rid"])
        viagens = entrada.timetables.get(rsn) or []
        if not viagens:
            tab.nota("erro", "LINHA_SEM_TIMETABLE", f"linha {rsn} sem timetable em data/raw")
            continue
        for viagem in viagens:
            tid = int(viagem["tid"])
            paradas = viagem.get("stops") or []
            servicos = viagem.get("services") or []
            shape_id = shapes_mapa.get(tid, "")
            if not paradas:
                tab.nota(
                    "aviso",
                    "VIAGEM_SEM_PARADAS",
                    f"linha {rsn} tid {tid} sem paradas; nenhum trip gerado",
                )
            if not servicos:
                tab.nota(
                    "aviso",
                    "VIAGEM_SEM_SERVICO",
                    f"linha {rsn} tid {tid} sem serviços (sem horários); sem trip",
                )
            for servico in servicos:
                sid = str(servico.get("sid"))
                for partida in servico.get("deps") or []:
                    saida = _segundos(partida.get("dt"))
                    # trip_id determinístico e estável: padrão + serviço + hora de partida
                    trip_id = (
                        f"{tid}-{sid}-"
                        f"{saida // 3600:02d}{(saida % 3600) // 60:02d}{saida % 60:02d}"
                    )
                    direcao_bruta = viagem.get("dir")
                    # GTFS só aceita 0/1; a fonte usa -1 para "não definido" → campo vazio
                    direcao = str(direcao_bruta) if direcao_bruta in (0, 1) else ""
                    if direcao == "":
                        contagens["direcao_desconhecida"] += 1
                    tab.trips.append(
                        {
                            "route_id": rid,
                            "service_id": sid,
                            "trip_id": trip_id,
                            "trip_headsign": str(viagem.get("th") or "").strip(),
                            "direction_id": direcao,
                            "shape_id": shape_id,
                            "trip_short_name": str(viagem.get("tsn") or ""),
                        }
                    )
                    contagens["trip"] += 1

                    deslocamento = 0
                    for ordem, parada in enumerate(paradas, start=1):
                        sid_parada = str(parada.get("sid"))
                        if sid_parada not in stops_tabeladas:
                            contagens["parada_fora"] += 1
                            continue
                        if parada.get("dt") is not None:
                            deslocamento = _segundos(parada.get("dt"))
                        espera = _segundos(parada.get("wt")) if parada.get("wt") else 0
                        if espera:
                            contagens["espera"] += 1
                        chegada = saida + deslocamento
                        tab.stop_times.append(
                            {
                                "trip_id": trip_id,
                                "arrival_time": _tempo_gtfs(chegada),
                                "departure_time": _tempo_gtfs(chegada + espera),
                                "stop_id": sid_parada,
                                "stop_sequence": str(ordem),
                                "timepoint": "0",  # horários são teóricos (doc do projeto)
                            }
                        )
                if not (servico.get("deps") or []):
                    tab.nota(
                        "aviso",
                        "SERVICO_SEM_PARTIDA",
                        f"linha {rsn} serviço {sid} sem partidas (deps vazio)",
                    )
    if contagens["espera"]:
        tab.nota(
            "informacao",
            "WAIT_TIME",
            f"{contagens['espera']} paradas com wt>0: aplicado como tempo de parada "
            f"(arrival≠departure). Semântica do campo não confirmada — revisar.",
        )
    else:
        tab.nota(
            "informacao",
            "WAIT_TIME_ZERO",
            "wt=0 em todas as paradas: arrival_time == departure_time em toda a feed.",
        )
    if contagens["parada_fora"]:
        tab.nota(
            "aviso",
            "PARADA_FORA",
            f"{contagens['parada_fora']} referências de parada não mapeadas foram ignoradas.",
        )
    if contagens["direcao_desconhecida"]:
        tab.nota(
            "informacao",
            "DIRECAO_DESCONHECIDA",
            f"{contagens['direcao_desconhecida']} trips com dir=-1 na fonte: "
            "direction_id vazio (desconhecido no GTFS) — preservado como veio.",
        )


def montar_tabelas(entrada: Entrada) -> Tabelas:
    """Constrói todas as tabelas GTFS + quadro de notas (nada inventado em silêncio)."""
    tab = Tabelas()
    tab.agency.append(
        {
            "agency_id": ID_AGENCY,
            "agency_name": "SEMOB - Superintedência Executiva de Mobilidade Urbana",
            "agency_url": URL_AGENCY,
            "agency_timezone": FUSO,
            "agency_lang": LANG,
        }
    )
    tab.nota(
        "informacao",
        "AGENCY_FONTE",
        "Nome, fuso (America/Sao_Paulo) e idioma (pt-BR) vêm da resposta get-project do painel "
        "(a grafia 'Superintedência' é a da fonte); agency_url é a página institucional da "
        "prefeitura — decisão do projeto, pois o painel não publica URL da agência.",
    )
    _montar_routes(entrada, tab)
    stops_tabeladas = _montar_stops(entrada, tab)
    _montar_calendar(entrada, tab)
    shapes_mapa = _montar_shapes(entrada, tab)
    _montar_trips_e_stop_times(entrada, tab, stops_tabeladas, shapes_mapa)

    datas_inicio = [r["start_date"] for r in tab.calendar]
    datas_fim = [r["end_date"] for r in tab.calendar]
    tab.feed_info.append(
        {
            "feed_publisher_name": "Projeto Flavos Bus (fonte: painel público SEMOB-JP/Mobilibus)",
            "feed_publisher_url": "https://github.com/GauaJ1/Flavos-Bus",
            "feed_lang": LANG,
            "feed_start_date": min(datas_inicio) if datas_inicio else "",
            "feed_end_date": max(datas_fim) if datas_fim else "",
            "feed_version": f"{entrada.data_geracao}-{entrada.feed_hash[:8]}",
            "feed_contact_url": "https://github.com/GauaJ1/Flavos-Bus",
        }
    )

    for rsn in entrada.faltando:
        tab.nota(
            "erro",
            "TIMETABLE_FALTANDO",
            f"linha {rsn} está na lista mas não tem timetable em data/raw",
        )
    tab.nota(
        "informacao",
        "TIMEPOINT_TEORICO",
        "timepoint=0 em todos os stop_times: os horários do painel são teóricos "
        "(quadro de horários), não aderência garantida — postura documentada no doc do projeto.",
    )
    tab.nota(
        "informacao",
        "NOMES_PRESERVADOS",
        "stop_name/route_long_name mantêm a grafia da fonte (ex.: 'BR-230 leste'); "
        "nomes publicados não são normalizados pelo Flavos Bus.",
    )
    return tab
