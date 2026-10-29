# Fase 2: montagem GTFS — fixture sintética inspirada na linha 0510 real.

from __future__ import annotations

from pathlib import Path

import pytest

from scraper.gtfs import (
    carregar_entrada,
    escrever_feed,
    montar_tabelas,
    validar_tabelas,
    zipar_feed,
)
from scraper.gtfs.dados import Entrada
from scraper.gtfs.polyline import decodificar_polyline
from scraper.gtfs.relatorio import texto_relatorio

FEED_HASH = "48cdaaed39f53c0c329cf51616b0de96"
DATA = "2026-10-29"

# sp sintético com matemática fechada: (0.01,0.01) tem deltas 1000 → zigzag 2000
# → varint [16,30,1] → 'o}@'; e (−0.01,−0.01) → zigzag 1999 → [15,30,1] → 'n}@'.
SP_POSITIVO = "o}@o}@"


def _viagem(sp: str = "") -> dict:
    return {
        "tid": 1231017,
        "th": "Tambau-Val Paraiso",
        "tsn": "",
        "dir": 1,
        "sp": sp,
        "stops": [
            {
                "sid": 996679, "dt": "00:05:00", "sdt": "1.048", "wt": 0,
                "sn": "Parque Solon de Lucena - Plataforma 1", "sd": None,
                "lat": "-7.11837676", "lon": "-34.87964890", "wb": 1, "ref": 0,
                "st": "Parque Solon de Lucena", "stn": "413", "stt": 3, "seq": 1,
            },
            {
                "sid": 997604, "dt": "00:48:24", "sdt": "18.558", "wt": 0,
                "sn": "Terminal Val Paraiso", "sd": None,
                "lat": "-7.08109656", "lon": "-34.84610887", "wb": 2, "ref": 0,
                "st": "Rua Dr. Candido", "stn": "1-159", "stt": 3, "seq": 2,
            },
        ],
        "services": [
            {
                "sid": 19911, "sn": "Dias Uteis", "sd": "2024-01-01T00:00:00.000Z",
                "ed": "2026-12-31T00:00:00.000Z",
                "deps": [
                    {"dt": "05:15:00", "at": None, "wb": 1, "nd": False},
                    {"dt": "23:50:00", "at": None, "wb": 1, "nd": False},
                ],
                "info": None, "seg": 1, "ter": 1, "qua": 1, "qui": 1, "sex": 1, "sab": 0, "dom": 0,
            }
        ],
    }


def _entrada(sp: str = "") -> Entrada:
    rota = {
        "rid": 42071, "rsn": "0510", "rln": "Tambau via Tamandare",
        "fmt": "0510 - Tambau via Tamandare", "rc": "#FF0000", "rtc": "#FFFFFF",
        "ol": "IDA", "il": "VOLTA", "cl": "", "rd": "", "ct": "",
    }
    return Entrada(
        rotas=[rota],
        timetables={"0510": [_viagem(sp)]},
        feed_hash=FEED_HASH,
        data_geracao=DATA,
    )


def test_polyline_vetores_derivados() -> None:
    assert decodificar_polyline("o}@o}@") == [(0.01, 0.01)]
    assert decodificar_polyline("n}@n}@") == [(-0.01, -0.01)]
    assert decodificar_polyline("??") == [(0.0, 0.0)]
    assert decodificar_polyline("") == []
    with pytest.raises(ValueError, match="truncada"):
        decodificar_polyline("}")  # só latitude, sem longitude


def test_rotas_e_agencia_vindo_da_fonte() -> None:
    tab = montar_tabelas(_entrada())
    assert len(tab.agency) == 1
    assert tab.agency[0]["agency_timezone"] == "America/Sao_Paulo"
    rota = tab.routes[0]
    assert rota["route_id"] == "42071"
    assert rota["route_short_name"] == "0510"
    assert rota["route_long_name"] == "Tambau via Tamandare"
    assert rota["route_color"] == "FF0000"
    assert rota["route_type"] == "3"


def test_montagem_deterministica_e_stops_formatados() -> None:
    tab1 = montar_tabelas(_entrada())
    tab2 = montar_tabelas(_entrada())
    assert tab1.routes == tab2.routes
    assert tab1.stops == tab2.stops
    assert tab1.trips == tab2.trips
    assert [p["stop_id"] for p in tab1.stops] == ["996679", "997604"]
    assert tab1.stops[0]["stop_lat"] == "-7.118377"  # 6 casas decimais
    assert tab1.stops[0]["stop_lon"] == "-34.879649"


def test_trip_por_partida_e_tempos() -> None:
    tab = montar_tabelas(_entrada())
    # 1 padrão × 1 serviço × 2 partidas = 2 trips; 2 paradas cada = 4 stop_times
    assert len(tab.trips) == 2
    assert len(tab.stop_times) == 4
    por_trip: dict[str, list[dict[str, str]]] = {}
    for st in tab.stop_times:
        por_trip.setdefault(st["trip_id"], []).append(st)
    assert len(por_trip) == 2
    ids = sorted(por_trip)
    assert ids[0] == "1231017-19911-051500"  # tid-sid-hhmmss
    primeira = sorted(por_trip[ids[0]], key=lambda s: int(s["stop_sequence"]))
    # 05:15:00 de partida + 00:05:00 da parada = 05:20:00
    assert primeira[0]["arrival_time"] == "5:20:00"
    assert primeira[0]["departure_time"] == "5:20:00"
    # 23:50:00 + 00:48:24 = 24:38:24+... = 24 h 38 min 24 s → "24:38:24"
    ultima = sorted(por_trip[ids[1]], key=lambda s: int(s["stop_sequence"]))[-1]
    assert ultima["arrival_time"] == "24:38:24"


def test_shape_decodificado_quando_sp_presente() -> None:
    tab = montar_tabelas(_entrada(SP_POSITIVO))
    assert [s["shape_id"] for s in tab.shapes] == ["sh-1231017"]
    pontos = {(s["shape_pt_lat"], s["shape_pt_lon"]) for s in tab.shapes}
    assert pontos == {("0.010000", "0.010000")}
    trip = tab.trips[0]
    assert trip["shape_id"] == "sh-1231017"


def test_calendar_fuso_e_datas() -> None:
    tab = montar_tabelas(_entrada())
    servico = tab.calendar[0]
    assert servico["service_id"] == "19911"
    assert servico["monday"] == "1" and servico["sunday"] == "0"
    assert servico["start_date"] == "20240101"
    assert servico["end_date"] == "20261231"
    info = tab.feed_info[0]
    assert info["feed_version"] == f"{DATA}-{FEED_HASH[:8]}"


def test_validador_sem_erro_no_caso_limpo() -> None:
    tab = montar_tabelas(_entrada())
    achados = validar_tabelas(tab)
    erros = [a for a in achados if a.severidade == "erro"]
    assert erros == []


def test_validador_flag_stop_time_sem_parada() -> None:
    tab = montar_tabelas(_entrada())
    tab.stop_times.append(
        {
            "trip_id": tab.trips[0]["trip_id"],
            "arrival_time": "5:20:00",
            "departure_time": "5:20:00",
            "stop_id": "999999",
            "stop_sequence": "3",
        }
    )
    codigos = {a.codigo for a in validar_tabelas(tab) if a.severidade == "erro"}
    assert "STOP_TIME_SEM_PARADA" in codigos


def test_validador_flag_tempo_mal_formado() -> None:
    tab = montar_tabelas(_entrada())
    tab.stop_times[0]["arrival_time"] = "5-20-00"
    codigos = {a.codigo for a in validar_tabelas(tab) if a.severidade == "erro"}
    assert "TEMPO_MAL_FORMADO" in codigos


def test_validador_flag_trip_sem_stop_times() -> None:
    tab = montar_tabelas(_entrada())
    tab.stop_times = []
    codigos = {a.codigo for a in validar_tabelas(tab) if a.severidade == "erro"}
    assert "TRIP_SEM_STOP_TIMES" in codigos


def test_escrever_feed_zip_e_relatorio(tmp_path: Path) -> None:
    tab = montar_tabelas(_entrada())
    achados = validar_tabelas(tab)
    criados = escrever_feed(tab, tmp_path)
    nomes = {c.name for c in criados}
    assert {
        "agency.txt", "routes.txt", "stops.txt", "calendar.txt",
        "trips.txt", "stop_times.txt", "feed_info.txt",
    } <= nomes
    linhas = (tmp_path / "stop_times.txt").read_text(encoding="utf-8").splitlines()
    assert linhas[0].startswith("trip_id,arrival_time,departure_time,stop_id,stop_sequence")
    assert len(linhas) == 5  # header + 4
    zip_path = zipar_feed(tmp_path, tmp_path / "gtfs.zip")
    assert zip_path.exists() and zip_path.stat().st_size > 0
    texto = texto_relatorio(tab, achados, DATA)
    assert "Feed GTFS João Pessoa" in texto
    assert "## Notas da montagem" in texto


def test_direction_id_negativa_da_fonte_fica_vazia() -> None:
    entrada = _entrada()
    viagem = dict(_entrada().timetables["0510"][0])
    viagem["tid"] = 1240722
    viagem["dir"] = -1
    entrada.timetables["0510"].append(viagem)
    tab = montar_tabelas(entrada)
    por_tid = {t["trip_id"].split("-")[0]: t for t in tab.trips}
    assert por_tid["1231017"]["direction_id"] == "1"
    assert por_tid["1240722"]["direction_id"] == ""
    codigos = {n.codigo for n in tab.notas}
    assert "DIRECAO_DESCONHECIDA" in codigos


def test_timepoint_zero_explicito() -> None:
    tab = montar_tabelas(_entrada())
    assert all(st["timepoint"] == "0" for st in tab.stop_times)
    codigos = {n.codigo for n in tab.notas}
    assert "TIMEPOINT_TEORICO" in codigos


def test_carregar_entrada_com_coleta_real() -> None:
    raw_dir = (Path(__file__).resolve().parents[3] / "data" / "raw").resolve()
    if not (raw_dir / "lista_geral.json").is_file():
        pytest.skip("coleta real ausente")
    entrada = carregar_entrada(raw_dir, feed_hash=FEED_HASH, data_geracao=DATA)
    assert len(entrada.rotas) == 84
    assert entrada.faltando == []
