# Escritor do feed GTFS: CSV com cabeçalhos na ordem da especificação,
# UTF-8, LF, valores por coluna. Só grava o que existe (arquivos opcionais
# ficam de fora — ex.: calendar_dates.txt, sem fonte de feriados).

from __future__ import annotations

import csv
import zipfile
from pathlib import Path

from .dados import Tabelas

# Ordem das colunas conforme o padrão GTFS (referência MobilityData/spec).
CABECALHOS: dict[str, list[str]] = {
    "agency": [
        "agency_id", "agency_name", "agency_url", "agency_timezone",
        "agency_lang", "agency_phone", "agency_email", "agency_fare_url",
    ],
    "routes": [
        "route_id", "agency_id", "route_short_name", "route_long_name", "route_desc",
        "route_type", "route_url", "route_color", "route_text_color", "route_sort_order",
    ],
    "stops": [
        "stop_id", "stop_code", "stop_name", "stop_desc", "stop_lat", "stop_lon",
        "zone_id", "stop_url", "location_type", "parent_station", "stop_timezone",
        "wheelchair_boarding", "level_id",
    ],
    "calendar": [
        "service_id", "monday", "tuesday", "wednesday", "thursday", "friday",
        "saturday", "sunday", "start_date", "end_date",
    ],
    "shapes": [
        "shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence", "shape_dist_traveled",
    ],
    "trips": [
        "route_id", "service_id", "trip_id", "trip_headsign", "trip_short_name",
        "direction_id", "block_id", "shape_id", "wheelchair_accessible", "bikes_allowed",
    ],
    "stop_times": [
        "trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence",
        "stop_headsign", "pickup_type", "drop_off_type", "shape_dist_traveled", "timepoint",
    ],
    "feed_info": [
        "feed_publisher_name", "feed_publisher_url", "feed_lang", "feed_start_date",
        "feed_end_date", "feed_version", "feed_contact_email", "feed_contact_url",
    ],
}

TABELAS_POR_ARQUIVO = {
    "agency.txt": "agency",
    "routes.txt": "routes",
    "stops.txt": "stops",
    "calendar.txt": "calendar",
    "shapes.txt": "shapes",
    "trips.txt": "trips",
    "stop_times.txt": "stop_times",
    "feed_info.txt": "feed_info",
}


def escrever_feed(tabelas: Tabelas, pasta: Path) -> list[Path]:
    """Grava os .txt existentes; devolve a lista de arquivos criados."""
    pasta = Path(pasta)
    pasta.mkdir(parents=True, exist_ok=True)
    criados: list[Path] = []
    for nome_arquivo, campo in TABELAS_POR_ARQUIVO.items():
        registros = getattr(tabelas, campo)
        if not registros:
            continue  # arquivo opcional sem dados fica de fora (nunca vazio fake)
        destino = pasta / nome_arquivo
        with destino.open("w", encoding="utf-8", newline="") as aberto:
            escritor = csv.DictWriter(aberto, fieldnames=CABECALHOS[campo], lineterminator="\n")
            escritor.writeheader()
            for registro in registros:
                linha = {coluna: registro.get(coluna, "") for coluna in CABECALHOS[campo]}
                escritor.writerow(linha)
        criados.append(destino)
    return criados


def zipar_feed(pasta: Path, destino_zip: Path) -> Path:
    """Empacota os .txt do feed em gtfs.zip (formato aceito pelo validator)."""
    destino_zip = Path(destino_zip)
    with zipfile.ZipFile(destino_zip, "w", compression=zipfile.ZIP_DEFLATED) as empacotador:
        for nome in sorted(TABELAS_POR_ARQUIVO):
            caminho = pasta / nome
            if caminho.is_file():
                empacotador.write(caminho, arcname=nome)
    return destino_zip
