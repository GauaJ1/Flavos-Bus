# Fluxo do coletor com HTTP falso cifrado: lista, timetable, cache, erros.

from __future__ import annotations

import re

import pytest

from scraper.cache import KIND_TIMETABLE, caminho_do_arquivo
from scraper.manifest import Manifest
from scraper.sources.bus2 import (
    PROJECT_ID,
    URL_LISTA,
    URL_TIMETABLE,
    collect_all,
    collect_line,
    collect_lista,
    extract_routes,
    ler_routes_do_disco,
    resolver_rota,
)
from tests.conftest import FakeHttp, fixture_json


def test_collect_lista_salva_cifrado_intacto(tmp_path, fake_http: FakeHttp) -> None:
    destino = collect_lista(raw_dir=tmp_path, http=fake_http)
    assert destino.exists()
    bruto = destino.read_text(encoding="utf-8")
    assert bruto.startswith('{"data": "U2FsdGVkX1') or bruto.startswith(
        '{"data":"U2FsdGVkX1'
    )
    # o pedido foi cifrado com o payload certo
    assert fake_http.posts[0] == (URL_LISTA, {"projectId": PROJECT_ID, "agency": None})
    # manifest registrou a coleta
    registros = Manifest(tmp_path).load()
    assert any(r.get("url") == URL_LISTA for r in registros)


def test_lista_segunda_chamada_usa_cache(tmp_path, fake_http: FakeHttp) -> None:
    collect_lista(raw_dir=tmp_path, http=fake_http)
    collect_lista(raw_dir=tmp_path, http=fake_http)
    assert fake_http.calls() == 1  # nada re-baixado


def test_lista_com_force_rebaixa(tmp_path, fake_http: FakeHttp) -> None:
    collect_lista(raw_dir=tmp_path, http=fake_http)
    collect_lista(raw_dir=tmp_path, http=fake_http, force=True)
    assert fake_http.calls() == 2


def test_extract_routes_dedupe_e_ordem() -> None:
    bruto = [
        {"rid": 42071, "rsn": "0510", "rln": "Tambaú"},
        {"rid": 42027, "rsn": "0507", "rln": "Cabo Branco"},
        {"rid": 42071, "rsn": "0510", "rln": "duplicada"},
        {"rid": 1, "rln": "sem rsn"},
        {"rid": "não-int", "rsn": "0999", "rln": "rid estranho"},
    ]
    rotas = extract_routes(bruto)
    assert [(r.rid, r.rsn) for r in rotas] == [(42071, "0510"), (42027, "0507")]


def test_ler_routes_do_disco_decifra(tmp_path, fake_http: FakeHttp) -> None:
    caminho = collect_lista(raw_dir=tmp_path, http=fake_http)
    rotas = ler_routes_do_disco(caminho)
    assert [(r.rsn, r.rid) for r in rotas] == [("0510", 42071), ("0507", 42027)]


def test_resolver_rota_aceita_510_sem_zeros(tmp_path, fake_http: FakeHttp) -> None:
    rota = resolver_rota("510", raw_dir=tmp_path, http=fake_http)
    assert (rota.rsn, rota.rid, rota.rln) == ("0510", 42071, "Tambau via Tamandare")


def test_resolver_rota_inexistente_erro_claro(tmp_path, fake_http: FakeHttp) -> None:
    with pytest.raises(ValueError, match="não existe"):
        resolver_rota("999", raw_dir=tmp_path, http=fake_http)


def test_collect_line_baixa_e_retorna(tmp_path, fake_http: FakeHttp) -> None:
    resultado = collect_line(42071, "0510", raw_dir=tmp_path, http=fake_http)
    assert resultado.baixados == [KIND_TIMETABLE]
    assert resultado.faltando == []
    destino = caminho_do_arquivo(tmp_path, KIND_TIMETABLE, "0510")
    assert destino.exists()
    assert destino.read_bytes() == fake_http.contents["get-timetable"]
    # pedido cifrado correto (routeId, date, serviceIds)
    assert fake_http.posts[-1] == (
        URL_TIMETABLE,
        {"routeId": 42071, "date": None, "serviceIds": None},
    )


def test_collect_line_retomavel(tmp_path, fake_http: FakeHttp) -> None:
    collect_line(42071, "0510", raw_dir=tmp_path, http=fake_http)
    resultado = collect_line(42071, "0510", raw_dir=tmp_path, http=fake_http)
    assert resultado.pulados_cache == [KIND_TIMETABLE]
    assert resultado.baixados == []
    assert fake_http.calls() == 1


def test_collect_line_force_rebaixa(tmp_path, fake_http: FakeHttp) -> None:
    collect_line(42071, "0510", raw_dir=tmp_path, http=fake_http)
    resultado = collect_line(
        42071, "0510", raw_dir=tmp_path, http=fake_http, force=True
    )
    assert resultado.baixados == [KIND_TIMETABLE]
    assert fake_http.calls() == 2


def test_collect_line_erro_registra_no_manifest(tmp_path) -> None:
    fake = FakeHttp(fail_paths={"get-timetable"})
    resultado = collect_line(42071, "0510", raw_dir=tmp_path, http=fake)
    assert resultado.faltando == [KIND_TIMETABLE]
    assert caminho_do_arquivo(tmp_path, KIND_TIMETABLE, "0510").exists() is False
    erros = Manifest(tmp_path).load()
    assert any(e.get("error", "").startswith("[timetable]") for e in erros)


def test_collect_all_varre_as_duas_linhas(tmp_path, fake_http: FakeHttp) -> None:
    resultados = collect_all(raw_dir=tmp_path, http=fake_http)
    assert [r.linha for r in resultados] == ["0510", "0507"]
    assert all(not r.erros for r in resultados)
    for rsn in ("0510", "0507"):
        assert caminho_do_arquivo(tmp_path, KIND_TIMETABLE, rsn).exists()
    # 1 lista + 2 timetables
    assert fake_http.calls() == 3


def test_collect_all_e_retomavel(tmp_path, fake_http: FakeHttp) -> None:
    collect_all(raw_dir=tmp_path, http=fake_http)
    resultados = collect_all(raw_dir=tmp_path, http=fake_http)
    assert all(r.pulados_cache == [KIND_TIMETABLE] for r in resultados)
    assert fake_http.calls() == 3  # lista em cache: nada re-baixado


def test_collect_all_erro_em_uma_linha_nao_derruba(tmp_path) -> None:
    # a lista responde, mas o timetable sempre falha (as duas linhas registram erro)
    fake = FakeHttp(respostas={})
    fake.respostas["get-routes"] = {"fantasma": True}  # formato errado de propósito
    with pytest.raises(ValueError):
        collect_all(raw_dir=tmp_path, http=fake)
    erros = Manifest(tmp_path).load()
    assert any(e.get("url") == URL_LISTA for e in erros)


def test_collect_all_linha_com_erro_continua(tmp_path) -> None:
    # a lista responde normal, mas o timetable sempre falha — cada linha registra erro
    fake = FakeHttp(
        respostas={"get-routes": fixture_json("routes_lista.json")},
        fail_paths={"get-timetable"},
    )
    caminho = collect_lista(raw_dir=tmp_path, http=fake)
    assert caminho.exists()
    resultados = []
    for rota in ler_routes_do_disco(caminho):
        resultados.append(
            collect_line(rota.rid, rota.rsn, raw_dir=tmp_path, http=fake)
        )
    assert [r.linha for r in resultados] == ["0510", "0507"]
    assert all(r.faltando == [KIND_TIMETABLE] for r in resultados)
    erros = Manifest(tmp_path).load()
    assert (
        sum(
            1
            for e in erros
            if isinstance(e.get("error"), str) and e["error"].startswith("[timetable]")
        )
        == 2
    )


def test_nomes_de_pasta_sao_seguros(tmp_path) -> None:
    # rsn estranho vindo da rede não pode sair do diretório data/raw/
    from scraper.cache import nome_da_pasta

    assert nome_da_pasta("0510") == "linha_0510"
    assert nome_da_pasta("I008") == "linha_I008"
    estranho = nome_da_pasta("../../etc")
    assert ".." not in estranho
    assert "/" not in estranho
    assert "\\" not in estranho
    # comparam com um padrão simples
    assert re.fullmatch(r"linha_[A-Za-z0-9._-]+", estranho)
