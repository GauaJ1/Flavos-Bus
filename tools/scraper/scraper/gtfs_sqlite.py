# Fase 2.5 — empacotamento do feed GTFS em SQLite offline (doc: o app lê
# um .db pré-gerado). Lê os CSVs de data/gtfs/, cria tables tipadas com
# índices para as consultas do app (linhas, paradas, horários, shapes) e
# grava metadados (feed_version, sha256 do zip, data de geração).
# Segurança: nunca deleta arquivo — recria com as tabelas via CREATE/DROP.

from __future__ import annotations

import csv
import hashlib
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (
    chave  TEXT PRIMARY KEY,
    valor  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS agencies (
    agency_id TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    url       TEXT NOT NULL,
    timezone  TEXT NOT NULL,
    lang      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS routes (
    route_id   TEXT PRIMARY KEY,
    short_name TEXT NOT NULL,
    long_name  TEXT NOT NULL DEFAULT '',
    type       INTEGER NOT NULL,
    color      TEXT NOT NULL DEFAULT '',
    text_color TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_routes_short ON routes(short_name);
CREATE TABLE IF NOT EXISTS stops (
    stop_id TEXT PRIMARY KEY,
    code    TEXT NOT NULL DEFAULT '',
    name    TEXT NOT NULL,
    lat     REAL NOT NULL,
    lon     REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stops_geo ON stops(lat, lon);
CREATE TABLE IF NOT EXISTS calendar (
    service_id TEXT PRIMARY KEY,
    monday     INTEGER NOT NULL,
    tuesday    INTEGER NOT NULL,
    wednesday  INTEGER NOT NULL,
    thursday   INTEGER NOT NULL,
    friday     INTEGER NOT NULL,
    saturday   INTEGER NOT NULL,
    sunday     INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS shapes (
    shape_id TEXT NOT NULL,
    seq      INTEGER NOT NULL,
    lat      REAL NOT NULL,
    lon      REAL NOT NULL,
    PRIMARY KEY (shape_id, seq)
);
CREATE TABLE IF NOT EXISTS trips (
    trip_id    TEXT PRIMARY KEY,
    route_id   TEXT NOT NULL,
    service_id TEXT NOT NULL,
    headsign   TEXT NOT NULL DEFAULT '',
    direction  INTEGER,
    shape_id   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_service ON trips(service_id);
CREATE TABLE IF NOT EXISTS stop_times (
    trip_id    TEXT NOT NULL,
    seq        INTEGER NOT NULL,
    arrival    TEXT NOT NULL,
    departure  TEXT NOT NULL,
    stop_id    TEXT NOT NULL,
    timepoint  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (trip_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id, departure);
"""

DIAS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def ler_tabela(pasta: Path, nome: str) -> list[dict[str, str]]:
    """Lê um .txt do feed como lista de dicts (todas as colunas como texto)."""
    arquivo = pasta / f"{nome}.txt"
    if not arquivo.is_file():
        return []
    with arquivo.open(encoding="utf-8", newline="") as aberto:
        return [dict(linha) for linha in csv.DictReader(aberto)]


def _inteiro(valor: str, padrao: int | None = None) -> int | None:
    texto = (valor or "").strip()
    return int(texto) if texto.isdigit() else padrao


def montar_db(caminho_db: Path, pasta_gtfs: Path) -> dict[str, int]:
    """Cria/recria o SQLite a partir dos .txt do feed; devolve contagens."""
    conn = sqlite3.connect(caminho_db)
    try:
        conn.executescript(SCHEMA)
        for tabela in ("meta", "agencies", "routes", "stops", "calendar", "shapes", "trips",
                       "stop_times"):
            conn.execute(f"DELETE FROM {tabela}")  # noqa: S608 — nomes internos fixos

        # recomenço do zero: versão antiga do schema não pode sobreviver
        nomes_existentes = {
            linha[0]
            for linha in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        if "meta_v1" in nomes_existentes:  # pragma: no cover — defesa histórica
            conn.execute("DROP TABLE meta_v1")

        contagens: dict[str, int] = {}
        conn.executemany(
            "INSERT INTO agencies VALUES (?,?,?,?,?)",
            [
                (r["agency_id"], r["agency_name"], r["agency_url"], r["agency_timezone"],
                 r["agency_lang"])
                for r in ler_tabela(pasta_gtfs, "agency")
            ],
        )
        conn.executemany(
            "INSERT INTO routes VALUES (?,?,?,?,?,?)",
            [
                (r["route_id"], r["route_short_name"], r["route_long_name"], int(r["route_type"]),
                 r.get("route_color", ""), r.get("route_text_color", ""))
                for r in ler_tabela(pasta_gtfs, "routes")
            ],
        )
        conn.executemany(
            "INSERT INTO stops VALUES (?,?,?,?,?,?)",
            [
                (r["stop_id"], r.get("stop_code", ""), r["stop_name"], float(r["stop_lat"]),
                 float(r["stop_lon"]))
                for r in ler_tabela(pasta_gtfs, "stops")
            ],
        )
        conn.executemany(
            "INSERT INTO calendar VALUES (?,?,?,?,?,?,?,?,?,?)",
            [
                (r["service_id"], *[int(r[d]) for d in DIAS], r["start_date"], r["end_date"])
                for r in ler_tabela(pasta_gtfs, "calendar")
            ],
        )
        conn.executemany(
            "INSERT INTO shapes VALUES (?,?,?,?)",
            [
                (r["shape_id"], int(r["shape_pt_sequence"]), float(r["shape_pt_lat"]),
                 float(r["shape_pt_lon"]))
                for r in ler_tabela(pasta_gtfs, "shapes")
            ],
        )
        conn.executemany(
            "INSERT INTO trips VALUES (?,?,?,?,?,?)",
            [
                (r["trip_id"], r["route_id"], r["service_id"], r.get("trip_headsign", ""),
                 _inteiro(r.get("direction_id", "")), r.get("shape_id", ""))
                for r in ler_tabela(pasta_gtfs, "trips")
            ],
        )
        conn.executemany(
            "INSERT INTO stop_times VALUES (?,?,?,?,?,?)",
            [
                (r["trip_id"], int(r["stop_sequence"]), r["arrival_time"], r["departure_time"],
                 r["stop_id"], _inteiro(r.get("timepoint", ""), 0) or 0)
                for r in ler_tabela(pasta_gtfs, "stop_times")
            ],
        )

        contagens = {
            tabela: int(conn.execute(f"SELECT COUNT(*) FROM {tabela}").fetchone()[0])
            for tabela in ("agencies", "routes", "stops", "calendar", "shapes", "trips",
                           "stop_times")
        }

        # metadados: versão do feed, origem e carimbo de construção
        feed_info = ler_tabela(pasta_gtfs, "feed_info")
        meta: dict[str, str] = {
            "feed_lang": feed_info[0]["feed_lang"] if feed_info else "",
            "feed_start_date": feed_info[0].get("feed_start_date", "") if feed_info else "",
            "feed_end_date": feed_info[0].get("feed_end_date", "") if feed_info else "",
            "feed_version": feed_info[0].get("feed_version", "") if feed_info else "",
            "gerado_em": datetime.now(UTC).isoformat(timespec="seconds"),
            "fonte": "GTFS gerado pelo Flavos Bus a partir do painel público (Mobilibus/SEMOB-JP)",
        }
        zip_path = pasta_gtfs / "gtfs.zip"
        if zip_path.is_file():
            digest = hashlib.sha256(zip_path.read_bytes()).hexdigest()
            meta["gtfs_zip_sha256"] = digest
            meta["gtfs_zip_bytes"] = str(zip_path.stat().st_size)
        conn.executemany(
            "INSERT INTO meta(chave, valor) VALUES (?,?)", list(meta.items())
        )
        conn.commit()
    finally:
        conn.close()
    return contagens


def abrir(caminho_db: Path) -> sqlite3.Connection:
    """Abre o banco pronto para consulta (row_factory em dict-like Row)."""
    conn = sqlite3.connect(caminho_db)
    conn.row_factory = sqlite3.Row
    return conn


def proximos_horarios(
    conn: sqlite3.Connection,
    stop_id: str,
    coluna_dia: str,
    hoje_iso: str,
    a_partir: str = "00:00:00",
    limite: int = 10,
) -> list[dict[str, Any]]:
    """Próximas partidas em uma parada: serviço ativo no dia + degraus de horário.

    coluna_dia é uma das colunas do calendar (monday..sunday); hoje_iso é a
    data YYYYMMDD usada contra start_date/end_date. Retorna dicts com linha,
    horário de partida previsto nessa parada e nome curto da rota.
    """
    linhas = conn.execute(
        f"""
        SELECT t.trip_id, r.short_name, r.long_name, st.departure, t.headsign
        FROM stop_times AS st
        JOIN trips   AS t ON t.trip_id    = st.trip_id
        JOIN routes  AS r ON r.route_id   = t.route_id
        JOIN calendar AS c ON c.service_id = t.service_id
        WHERE st.stop_id = ?
          AND st.departure >= ?
          AND c.start_date <= ? AND c.end_date >= ?
          AND c."{coluna_dia}" = 1
        ORDER BY st.departure
        LIMIT ?
        """,
        (stop_id, a_partir, hoje_iso, hoje_iso, limite),
    )
    return [dict(linha) for linha in linhas]
