# Relatório sobre o layout cru: lista_geral.json + pastas linha_<rsn>/timetable.json.

from __future__ import annotations

from scraper.cache import save_atomic
from scraper.manifest import Manifest
from scraper.report import build_report, format_report


def _manifest_com_erro(tmp_path) -> None:
    Manifest(tmp_path).record_error(
        url="https://painel.test/get-timetable",
        params={"routeId": 1},
        status=404,
        error="[timetable] HTTP 404",
    )


def test_report_vazio(tmp_path) -> None:
    report = build_report(tmp_path)
    assert report.lista_geral_ok is False
    assert report.total_linhas == 0
    texto = format_report(report)
    assert "lista geral (get-routes): ausente" in texto
    assert "[ok]   completas: 0" in texto


def test_report_com_lista_e_duas_linhas(tmp_path) -> None:
    save_atomic(tmp_path / "lista_geral.json", b'{"data":"U2FsdGVkX1"}')
    (tmp_path / "linha_0510").mkdir()
    save_atomic(tmp_path / "linha_0510" / "timetable.json", b'{}')
    (tmp_path / "linha_0507").mkdir()  # pasta sem timetable = sem dados
    report = build_report(tmp_path)
    assert report.lista_geral_ok is True
    assert report.completas == ["0510"]
    assert report.sem_dados == ["0507"]
    texto = format_report(report)
    assert "[ok]   completas: 1" in texto
    assert "[erro] sem dados: 1" in texto
    assert "0510" in texto and "0507" in texto


def test_report_mostra_erros_do_manifest(tmp_path) -> None:
    _manifest_com_erro(tmp_path)
    report = build_report(tmp_path)
    assert len(report.erros_manifest) == 1
    texto = format_report(report)
    assert "Erros registrados no manifest: 1" in texto
    assert "[timetable] HTTP 404" in texto
