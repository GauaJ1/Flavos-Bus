# Validador interno do feed (antes do validator oficial da MobilityData):
# integridade referencial, ordem de tempos, formatos, coordenadas e datas.
# ERRO bloqueia a publicação (doc seção 6); AVISO pede avaliação.

from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import date

from .dados import Nota, Tabelas

_PADRAO_HORA = re.compile(r"^\d+:[0-5]\d:[0-5]\d$")
_PADRAO_DATA = re.compile(r"^\d{8}$")

DIAS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")

# Expectativa geográfica do município (J assistir doc; limites generosos).
LAT_MIN, LAT_MAX = -8.5, -6.0
LON_MIN, LON_MAX = -36.0, -33.8


def _segundos(hora: str) -> int | None:
    partes = hora.split(":")
    if len(partes) != 3:
        return None
    try:
        return int(partes[0]) * 3600 + int(partes[1]) * 60 + int(partes[2])
    except ValueError:
        return None


def _data_valida(digitos: str) -> bool:
    try:
        date(int(digitos[:4]), int(digitos[4:6]), int(digitos[6:8]))
        return True
    except ValueError:
        return False


def validar_tabelas(tab: Tabelas) -> list[Nota]:
    achados: list[Nota] = []

    def erro(codigo: str, mensagem: str) -> None:
        achados.append(Nota("erro", codigo, mensagem))

    def aviso(codigo: str, mensagem: str) -> None:
        achados.append(Nota("aviso", codigo, mensagem))

    # ── mínimos estruturais ────────────────────────────────────────────────────
    for nome, registros in (
        ("agency", tab.agency), ("routes", tab.routes), ("stops", tab.stops),
        ("calendar", tab.calendar), ("trips", tab.trips), ("stop_times", tab.stop_times),
        ("feed_info", tab.feed_info),
    ):
        if not registros:
            erro("ARQUIVO_VAZIO", f"{nome}.txt obrigatório e vazio: feed inválido")

    # ── IDs únicos ─────────────────────────────────────────────────────────────
    def duplicados(valores: list[str], onde: str) -> None:
        contador = Counter(valores)
        repetidos = {k: v for k, v in contador.items() if v > 1}
        if repetidos:
            erro(
                "ID_DUPLICADO",
                f"{onde}: {len(repetidos)} IDs repetidos; exemplos: {list(repetidos)[:3]}",
            )

    duplicados([r["agency_id"] for r in tab.agency], "agency.agency_id")
    duplicados([r["route_id"] for r in tab.routes], "routes.route_id")
    duplicados([p["stop_id"] for p in tab.stops], "stops.stop_id")
    duplicados([s["service_id"] for s in tab.calendar], "calendar.service_id")
    duplicados([t["trip_id"] for t in tab.trips], "trips.trip_id")

    # ── integridade referencial ────────────────────────────────────────────────
    ids_rota = {r["route_id"] for r in tab.routes}
    ids_parada = {p["stop_id"] for p in tab.stops}
    ids_servico = {s["service_id"] for s in tab.calendar}
    ids_shape = {s["shape_id"] for s in tab.shapes} if tab.shapes else set()
    ids_trip = {t["trip_id"] for t in tab.trips}

    sem_rota = [t["trip_id"] for t in tab.trips if t["route_id"] not in ids_rota]
    if sem_rota:
        erro(
            "TRIP_SEM_ROTA",
            f"{len(sem_rota)} trips com route_id desconhecido; ex.: {sem_rota[:3]}",
        )
    sem_servico = [t["trip_id"] for t in tab.trips if t["service_id"] not in ids_servico]
    if sem_servico:
        erro(
            "TRIP_SEM_SERVICO",
            f"{len(sem_servico)} trips com service_id desconhecido; ex.: {sem_servico[:3]}",
        )
    for trip in tab.trips:
        if trip["shape_id"] and trip["shape_id"] not in ids_shape:
            erro(
                "TRIP_SEM_SHAPE",
                f"trip {trip['trip_id']}: shape_id {trip['shape_id']} não existe em shapes.txt",
            )
    com_stop_time = {st["trip_id"] for st in tab.stop_times}
    orfaos = [tid for tid in ids_trip if tid not in com_stop_time]
    if orfaos:
        erro("TRIP_SEM_STOP_TIMES", f"{len(orfaos)} trips sem nenhuma parada; ex.: {orfaos[:3]}")
    parada_fora = [st["stop_id"] for st in tab.stop_times if st["stop_id"] not in ids_parada]
    if parada_fora:
        erro("STOP_TIME_SEM_PARADA", f"{len(parada_fora)} stop_times com stop_id inexistente")

    # ── tempos e sequência por trip ────────────────────────────────────────────
    por_trip: dict[str, list[dict[str, str]]] = defaultdict(list)
    for st in tab.stop_times:
        por_trip[st["trip_id"]].append(st)
    violacoes = 0
    formato_ruim = 0
    for _tid, linhas in por_trip.items():
        linhas_ordenadas = sorted(linhas, key=lambda st: int(st["stop_sequence"]))
        anterior = -1
        for st in linhas_ordenadas:
            a = _segundos(st["arrival_time"])
            d = _segundos(st["departure_time"])
            horario_bom = _PADRAO_HORA.match(st["arrival_time"]) and _PADRAO_HORA.match(
                st["departure_time"]
            )
            if a is None or d is None or not horario_bom:
                formato_ruim += 1
                continue
            if d < a:
                violacoes += 1
                continue
            if a < anterior:
                violacoes += 1
            anterior = d
    if formato_ruim:
        erro("TEMPO_MAL_FORMADO", f"{formato_ruim} horários fora do padrão H:MM:SS")
    if violacoes:
        erro("TEMPO_NAO_MONOTONICO", f"{violacoes} violações de ordem de horários em stop_times")
    if any(int(st["stop_sequence"]) < 1 for st in tab.stop_times):
        erro("SEQUENCIA_INVALIDA", "stop_sequence < 1 encontrado")

    # ── coordenadas e cores ────────────────────────────────────────────────────
    fora_regiao = [
        p["stop_id"]
        for p in tab.stops
        if not (
            LAT_MIN < float(p["stop_lat"]) < LAT_MAX and LON_MIN < float(p["stop_lon"]) < LON_MAX
        )
    ]
    if fora_regiao:
        aviso(
            "PARADA_FORA_DA_REGIAO",
            f"{len(fora_regiao)} paradas fora da expectativa geográfica (lat/lon); "
            f"ex.: {fora_regiao[:3]}",
        )
    for rota in tab.routes:
        for campo in ("route_color", "route_text_color"):
            valor = rota[campo]
            if valor and not re.fullmatch(r"[0-9A-F]{6}", valor):
                erro("COR_MAL_FORMADA", f"rota {rota['route_id']}: {campo}={valor!r}")

    # ── calendário ─────────────────────────────────────────────────────────────
    for servico in tab.calendar:
        if servico["start_date"] == servico["end_date"]:
            aviso("SERVICO_UM_DIA", f"service {servico['service_id']} opera em um único dia")
        for campo in ("start_date", "end_date"):
            valor = servico[campo]
            if not _PADRAO_DATA.match(valor) or not _data_valida(valor):
                erro("DATA_MAL_FORMADA", f"service {servico['service_id']}: {campo}={valor!r}")
    usados = {t["service_id"] for t in tab.trips}
    sem_uso = [s["service_id"] for s in tab.calendar if s["service_id"] not in usados]
    if sem_uso:
        aviso("SERVICO_SEM_TRIP", f"{len(sem_uso)} serviços sem nenhum trip; ex.: {sem_uso[:3]}")
    if tab.calendar and all(all(s[dia] == "0" for dia in DIAS) for s in tab.calendar):
        erro("CALENDAR_VAZIO", "nenhum service_id opera em dia de semana algum")

    # ── cobertura por rota ─────────────────────────────────────────────────────
    rotas_com_trip = {t["route_id"] for t in tab.trips}
    sem_trip = [r["route_id"] for r in tab.routes if r["route_id"] not in rotas_com_trip]
    if sem_trip:
        aviso(
            "ROTA_SEM_TRIP",
            f"{len(sem_trip)} rotas sem nenhum trip (linha parcial); ex.: {sem_trip[:5]}",
        )

    return achados
