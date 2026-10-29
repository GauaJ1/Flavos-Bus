# Tarefa MVP 1 — o flavos.sqlite do app precisa ser confiável: contagens batem
# com o feed, chaves integram (sem órfãos) e a consulta de exemplo da 509
# devolve os horários. Fixture de feed mínimo em tmp_path (rápido e estável);
# o banco REAL também é gerado pelo CLI e conferido manualmente no commit.

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from scraper.gtfs_sqlite import abrir, montar_db, proximos_horarios

FEED_MINIMO = {
    "agency.txt": (
        "agency_id,agency_name,agency_url,agency_timezone,agency_lang\n"
        "TESTE,Org Teste,https://exemplo.test,America/Sao_Paulo,pt-BR\n"
    ),
    "routes.txt": (
        "route_id,agency_id,route_short_name,route_long_name,route_desc,route_type\n"
        "42029,TESTE,0509,João Agripino,Radial | operadora declarada 2019: TESTE,3\n"
        "42030,TESTE,0510,Cruz das Almas,,3\n"
    ),
    "stops.txt": (
        "stop_id,stop_code,stop_name,stop_lat,stop_lon\n"
        "A,550,Av. Pres. Epitácio Pessoa, 550,-7.1199,-34.8654\n"
        "B,1,Terminal João Agripino,-7.2100,-34.9000\n"
    ),
    "calendar.txt": (
        "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,"
        "start_date,end_date\n"
        "19911,1,1,1,1,1,0,0,20240101,20261231\n"
    ),
    "shapes.txt": (
        "shape_id,shape_pt_sequence,shape_pt_lat,shape_pt_lon\n"
        "sh-1,1,-7.2100,-34.9000\n"
        "sh-1,2,-7.1199,-34.8654\n"
    ),
    "trips.txt": (
        "trip_id,route_id,service_id,trip_headsign,direction_id,shape_id\n"
        "t-0500,42029,19911,João Agripino,0,sh-1\n"
        "t-1300,42029,19911,João Agripino,0,sh-1\n"
        "t-0510,42030,19911,Cruz das Almas,0,sh-1\n"
    ),
    "stop_times.txt": (
        "trip_id,stop_sequence,arrival_time,departure_time,stop_id,timepoint\n"
        "t-0500,1,05:00:00,05:00:00,B,0\n"
        "t-0500,2,05:35:00,05:35:00,A,0\n"
        "t-1300,1,13:00:00,13:00:00,B,0\n"
        "t-1300,2,13:35:00,13:35:00,A,0\n"
        "t-0510,1,05:10:00,05:10:00,B,0\n"
    ),
    "feed_info.txt": (
        "feed_publisher_name,feed_publisher_url,feed_lang,feed_start_date,"
        "feed_end_date,feed_version\n"
        "Flavos Bus,https://exemplo.test,pt-BR,20240101,20261231,2026-10-29-\n"
    ),
}


@pytest.fixture()
def db(tmp_path: Path) -> sqlite3.Connection:
    feed = tmp_path / "feed"
    feed.mkdir()
    for nome, conteudo in FEED_MINIMO.items():
        (feed / nome).write_text(conteudo, encoding="utf-8")
    contagens = montar_db(tmp_path / "flavos.sqlite", feed)
    assert contagens["routes"] == 2
    assert contagens["trips"] == 3
    assert contagens["stop_times"] == 5
    return abrir(tmp_path / "flavos.sqlite")


def test_contagens_e_meta(db: sqlite3.Connection) -> None:
    contagens = {t: db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                 for t in ("agencies", "routes", "stops", "calendar", "trips",
                           "stop_times")}
    assert contagens == {"agencies": 1, "routes": 2, "stops": 2, "calendar": 1,
                         "trips": 3, "stop_times": 5}
    meta = dict(db.execute("SELECT chave, valor FROM meta"))
    assert meta["feed_version"] == "2026-10-29-"
    assert meta["feed_lang"] == "pt-BR"


def test_integridade_sem_orfaos(db: sqlite3.Connection) -> None:
    tripas_orfas = db.execute(
        "SELECT COUNT(*) FROM trips WHERE route_id NOT IN (SELECT route_id FROM routes)"
    ).fetchone()[0]
    assert tripas_orfas == 0
    paradas_orfas = db.execute(
        "SELECT COUNT(*) FROM stop_times WHERE stop_id NOT IN (SELECT stop_id FROM stops)"
    ).fetchone()[0]
    assert paradas_orfas == 0
    horarios_orfos = db.execute(
        "SELECT COUNT(*) FROM stop_times WHERE trip_id NOT IN (SELECT trip_id FROM trips)"
    ).fetchone()[0]
    assert horarios_orfos == 0


def test_consulta_exemplo_509_tem_horarios(db: sqlite3.Connection) -> None:
    horarios = proximos_horarios(
        db, "A", coluna_dia="thursday", hoje_iso="20261029", a_partir="13:00:00",
        limite=10,
    )
    so_509 = [h for h in horarios if h["short_name"] == "0509"]
    horarios_de_partida = [h["departure"] for h in so_509]
    assert horarios_de_partida == ["13:35:00"]  # 05:35 é anterior ao a_partir
    assert horarios_de_partida[0].startswith("13:35")


def test_operadora_com_data_disponivel_para_a_tela(db: sqlite3.Connection) -> None:
    # a operadora vive no route_desc (coluna descricao); o long_name é só nome
    linha = db.execute(
        "SELECT long_name, descricao FROM routes WHERE short_name = '0509'"
    ).fetchone()
    assert linha[0] == "João Agripino"
    assert "operadora declarada 2019" in linha[1]
