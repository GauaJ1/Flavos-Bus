# Testes do item 6 (offline): traçado oficial SEMOB substitui a polyline do
# painel — geometria, carga, alinhamento, substituição, notas e órfãos.

from __future__ import annotations

import json
from pathlib import Path

import pytest  # noqa: F401  (fixture tmp_path ativa o plugin)

from scraper.gtfs.shapes_semob import (
    _alinhar,
    _pontos_geometria,
    carregar_tracados,
    haversine_m,
    substituir_shapes_semob,
)


def _feature(sentido: str, pontos: list[list[float]], atualizacao: str = "2024-05-10"):
    return {
        "type": "Feature",
        "properties": {"ITINERARIO": sentido, "ATUALIZACA": atualizacao},
        "geometry": {"type": "LineString", "coordinates": pontos},
    }


class _Tab:
    """Substituto mínimo de Tabelas (só o que o substituidor toca)."""

    def __init__(self) -> None:
        self.shapes: list[dict[str, str]] = []
        self.notas: list[tuple[str, str, str]] = []

    def nota(self, severidade: str, codigo: str, mensagem: str) -> None:
        self.notas.append((severidade, codigo, mensagem))


class _Entrada:
    """Entrada mínima: rotas + timetables decifrados no formato do painel."""

    def __init__(self, timetables: dict[str, list[dict]]) -> None:
        self.rotas = [{"rsn": rsn, "rid": f"4{rsn}"} for rsn in timetables]
        self.timetables = timetables


def _viagem(tid: int, primeira_lat: float, primeira_lon: float) -> dict:
    return {
        "tid": str(tid),
        "dir": 0,
        "sp": "",
        "stops": [{"sid": "1", "lat": primeira_lat, "lon": primeira_lon}],
        "services": [],
    }


def test_pontos_geometria_inverte_lonlat() -> None:
    geometry = {"type": "LineString", "coordinates": [[-34.8, -7.1], [-34.9, -7.2]]}
    assert _pontos_geometria(geometry) == [(-7.1, -34.8), (-7.2, -34.9)]


def test_pontos_geometria_multilinha_concatena() -> None:
    geometry = {
        "type": "MultiLineString",
        "coordinates": [[[-34.8, -7.1]], [[-34.9, -7.2]]],
    }
    assert _pontos_geometria(geometry) == [(-7.1, -34.8), (-7.2, -34.9)]


def test_pontos_geometria_tipo_desconhecido_vazio() -> None:
    assert _pontos_geometria({"type": "Point", "coordinates": [1, 2]}) == []


def test_carregar_tracados_agrupa_sentidos(tmp_path: Path) -> None:
    pasta = tmp_path / "semob_geojson"
    pasta.mkdir()
    (pasta / "0520.json").write_text(json.dumps({
        "features": [
            _feature("IDA", [[-34.8, -7.1], [-34.81, -7.11]]),
            _feature("VOLTA", [[-34.81, -7.11], [-34.8, -7.1]], "2019-01-01"),
        ]
    }), encoding="utf-8")
    tracados = carregar_tracados(pasta)
    assert set(tracados) == {"0520"}
    sentidos = {t.sentido for t in tracados["0520"]}
    assert sentidos == {"IDA", "VOLTA"}
    por_data = {t.atualizacao for t in tracados["0520"]}
    assert por_data == {"2024-05-10", "2019-01-01"}


def test_alinhar_reverte_quando_fim_mais_perto() -> None:
    pontos = [(-7.10, -34.80), (-7.20, -34.85)]
    alinhado, dist = _alinhar((-7.20, -34.85), pontos)
    # referência é o FIM do traçado: lista revertida e distância ~0 no novo início
    assert alinhado[0] == (-7.20, -34.85)
    assert dist < 10


def test_alinhar_sem_reversao() -> None:
    pontos = [(-7.10, -34.80), (-7.20, -34.85)]
    alinhado, dist = _alinhar((-7.10, -34.80), pontos)
    assert alinhado[0] == (-7.10, -34.80)
    assert dist < 1


def test_haversine_valores_plausiveis() -> None:
    # João Pessoa: ~1 grau de latitude ≈ 111 km
    assert 110_000 < haversine_m(-7.0, -34.8, -8.0, -34.8) < 112_000


def _tab_com_shapes(tids: list[int]) -> _Tab:
    tab = _Tab()
    for tid in tids:
        tab.shapes.append({
            "shape_id": f"sh-{tid}", "shape_pt_lat": "-7.100000",
            "shape_pt_lon": "-34.800000", "shape_pt_sequence": "1",
        })
    return tab


def test_substituicao_basica(tmp_path: Path) -> None:
    pasta = tmp_path / "semob_geojson"
    pasta.mkdir()
    (pasta / "0520.json").write_text(json.dumps({
        "features": [
            _feature("IDA", [[-34.80, -7.10], [-34.81, -7.15]]),
            _feature("VOLTA", [[-34.81, -7.15], [-34.80, -7.10]]),
        ]
    }), encoding="utf-8")
    entrada = _Entrada({"0520": [_viagem(9001, -7.10, -34.80)]})
    tab = _tab_com_shapes([9001])
    mapa = {9001: "sh-9001"}

    resultado = substituir_shapes_semob(entrada, tab, mapa, pasta)
    assert resultado == {"0520": 1}
    assert mapa[9001] == "semob-0520-ida"
    ids = {s["shape_id"] for s in tab.shapes}
    assert "sh-9001" not in ids  # órfão removido
    assert "semob-0520-ida" in ids
    pontos_novos = [s for s in tab.shapes if s["shape_id"] == "semob-0520-ida"]
    assert len(pontos_novos) == 2  # dois pontos do traçado
    assert any(
        cod == "SHAPE_SEMOB_SUBSTITUIDO" and "0520" in msg
        for _, cod, msg in tab.notas
    )


def test_linha_fora_do_alvo_nao_e_tocada(tmp_path: Path) -> None:
    entrada = _Entrada({"0509": [_viagem(133842, -7.10, -34.80)]})
    tab = _tab_com_shapes([133842])
    mapa = {133842: "sh-133842"}
    resultado = substituir_shapes_semob(entrada, tab, mapa, tmp_path / "nada")
    assert resultado == {}
    assert mapa[133842] == "sh-133842"
    assert {s["shape_id"] for s in tab.shapes} == {"sh-133842"}


def test_alvo_sem_geojson_vira_aviso(tmp_path: Path) -> None:
    entrada = _Entrada({"0520": [_viagem(9001, -7.10, -34.80)]})
    tab = _tab_com_shapes([9001])
    mapa = {9001: "sh-9001"}
    pasta = tmp_path / "vazio"
    pasta.mkdir()  # pasta existe, mas sem geojson congelado para a linha
    resultado = substituir_shapes_semob(entrada, tab, mapa, pasta)
    assert resultado == {}
    assert mapa[9001] == "sh-9001"
    assert any(cod == "SHAPE_SEMOB_AUSENTE" for _, cod, _ in tab.notas)


def test_pasta_inexistente_desliga_a_feature(tmp_path: Path) -> None:
    entrada = _Entrada({"0520": [_viagem(9001, -7.10, -34.80)]})
    tab = _tab_com_shapes([9001])
    mapa = {9001: "sh-9001"}
    resultado = substituir_shapes_semob(entrada, tab, mapa, tmp_path / "nada")
    assert resultado == {}
    assert mapa[9001] == "sh-9001"
    assert tab.notas == []  # feature off sem ruído


def test_primeira_parada_longe_mantem_painel(tmp_path: Path) -> None:
    pasta = tmp_path / "semob_geojson"
    pasta.mkdir()
    (pasta / "0520.json").write_text(json.dumps({
        "features": [
            # traçado em Recife (~180 km de João Pessoa): alinhamento impossível
            _feature("IDA", [[-34.90, -8.05], [-34.91, -8.06]]),
        ]
    }), encoding="utf-8")
    entrada = _Entrada({"0520": [_viagem(9001, -7.10, -34.80)]})
    tab = _tab_com_shapes([9001])
    mapa = {9001: "sh-9001"}
    resultado = substituir_shapes_semob(entrada, tab, mapa, pasta)
    assert resultado == {"0520": 0}
    assert mapa[9001] == "sh-9001"  # mantido
    assert any(cod == "SHAPE_SEMOB_SEM_ALINHAMENTO" for _, cod, _ in tab.notas)


def test_rejeita_quando_oficial_piora_paradas(tmp_path: Path) -> None:
    """Política do item 6: oficial que deixa MAIS paradas longe não entra."""
    pasta = tmp_path / "semob_geojson"
    pasta.mkdir()
    (pasta / "0109.json").write_text(json.dumps({
        "features": [
            # oficial alinhado na 1.ª parada, mas ~50 km longe da 2.ª
            # (painel cobre ambas) — a política deve rejeitar a troca
            _feature("IDA", [[-34.80, -7.10], [-35.10, -7.50]]),
        ]
    }), encoding="utf-8")
    entrada = _Entrada({"0109": [_viagem(9101, -7.10, -34.80)]})
    tab = _Tab()
    tab.shapes = [  # traçado do painel cobre as DUAS paradas da viagem
        {"shape_id": "sh-9101", "shape_pt_lat": "-7.100000",
         "shape_pt_lon": "-34.800000", "shape_pt_sequence": "1"},
        {"shape_id": "sh-9101", "shape_pt_lat": "-7.200000",
         "shape_pt_lon": "-34.900000", "shape_pt_sequence": "2"},
    ]
    # a viagem precisa de 2 paradas para o oficial falhar na 2.ª
    viagem = _viagem(9101, -7.10, -34.80)
    viagem["stops"].append({"sid": "2", "lat": -7.20, "lon": -34.90})
    entrada.timetables["0109"] = [viagem]
    mapa = {9101: "sh-9101"}

    resultado = substituir_shapes_semob(entrada, tab, mapa, pasta)
    assert resultado == {"0109": 0}
    assert mapa[9101] == "sh-9101"  # mantido
    rejeicoes = [msg for _, cod, msg in tab.notas
                 if cod == "SHAPE_SEMOB_REJEITADO_PARADAS"]
    assert rejeicoes, "esperava nota de rejeição pela política de paradas"


def test_tids_do_mesmo_sentido_compartilham_shape(tmp_path: Path) -> None:
    pasta = tmp_path / "semob_geojson"
    pasta.mkdir()
    (pasta / "0109.json").write_text(json.dumps({
        "features": [_feature("CIRCULAR", [[-34.80, -7.10], [-34.85, -7.20]])]
    }), encoding="utf-8")
    entrada = _Entrada({"0109": [
        _viagem(9101, -7.10, -34.80), _viagem(9102, -7.10, -34.80),
    ]})
    tab = _tab_com_shapes([9101, 9102])
    mapa = {9101: "sh-9101", 9102: "sh-9102"}
    resultado = substituir_shapes_semob(entrada, tab, mapa, pasta)
    assert resultado == {"0109": 2}
    assert mapa[9101] == mapa[9102] == "semob-0109-circular"
    ids = {s["shape_id"] for s in tab.shapes}
    assert ids == {"semob-0109-circular"}  # os dois órfãos saíram, um entrou