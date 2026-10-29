# Nomes previsíveis de cache, gravação atômica e manifest — pasta temporária.

from __future__ import annotations

import json
from pathlib import Path

import pytest

from scraper.cache import (
    KIND_LISTA,
    KIND_TIMETABLE,
    caminho_do_arquivo,
    is_cached,
    nome_da_pasta,
    pasta_da_linha,
    save_atomic,
    sha256_hex,
)
from scraper.manifest import Manifest


def test_caminho_da_lista_geral() -> None:
    assert caminho_do_arquivo(Path("raw"), KIND_LISTA).as_posix() == "raw/lista_geral.json"


def test_caminho_do_timetable_por_linha() -> None:
    caminho = caminho_do_arquivo(Path("raw"), KIND_TIMETABLE, "0510")
    assert caminho.as_posix() == "raw/linha_0510/timetable.json"


def test_timetable_sem_rsn_levanta() -> None:
    with pytest.raises(ValueError, match="rsn"):
        caminho_do_arquivo(Path("raw"), KIND_TIMETABLE)


def test_nome_da_pasta_sanitiza() -> None:
    assert nome_da_pasta("0510") == "linha_0510"
    assert nome_da_pasta("I008") == "linha_I008"
    estranho = nome_da_pasta("../x y")
    assert ".." not in estranho and "/" not in estranho and " " not in estranho


def test_pasta_da_linha_fica_dentro_do_raw() -> None:
    pasta = pasta_da_linha(Path("raw"), "..%2F..")
    assert (Path("raw") in pasta.parents) or pasta.parent == Path("raw")


def test_save_atomic_e_cache(tmp_path: Path) -> None:
    destino = caminho_do_arquivo(tmp_path, KIND_TIMETABLE, "0510")
    assert not is_cached(destino)
    save_atomic(destino, b"dados")
    assert is_cached(destino)
    assert destino.read_bytes() == b"dados"
    assert list(destino.parent.glob("*.tmp")) == []  # não sobra temporário


def test_sha256_estavel() -> None:
    assert sha256_hex(b"x") == sha256_hex(b"x")
    assert sha256_hex(b"x") != sha256_hex(b"y")


def test_manifest_roundtrip(tmp_path: Path) -> None:
    manifest = Manifest(tmp_path)
    assert manifest.load() == []
    manifest.record_fetch(
        url="https://painel.test/get-timetable",
        params={"routeId": 42071, "date": None, "serviceIds": None},
        status=200,
        saved_path="linha_0510/timetable.json",
        content=b"conteudo",
    )
    erro = manifest.record_error(url=None, params=None, status=None, error="falhou feio")
    entries = manifest.load()
    assert len(entries) == 2
    assert entries[0]["sha256"] == sha256_hex(b"conteudo")
    assert entries[0]["saved_path"] == "linha_0510/timetable.json"
    assert entries[0]["params"]["routeId"] == 42071
    assert erro["error"] == "falhou feio" and erro["saved_path"] is None
    assert list(tmp_path.glob("*.tmp")) == []  # gravação atômica não deixa lixo
    parsed = json.loads((tmp_path / "_manifest.json").read_text(encoding="utf-8"))
    assert len(parsed) == 2
