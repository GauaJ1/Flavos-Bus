# Testes do módulo de operadoras (agências reais da SEMOB-JP).
# Nenhum teste depende de rede: os metadados são dicionários montados no teste.

from __future__ import annotations

from typing import Any

from scraper.gtfs.operadoras import (
    ALIAS_SIGLA,
    OPERADORAS,
    SEM_OPERADORA,
    agency_id_de,
    descricao_rota,
    normalizar_empresa,
    operadoras_de,
    tabela_agency,
    titulo_linha,
)


def _meta(empresa: str, atualizacao: str = "", tipo: str = "RADIAL",
          ext_ida: float | None = 10.0) -> dict[str, Any]:
    """Metadados mínimos no formato de _SEMOB_METADADOS.json."""
    sentido = {"empresa": empresa, "tipo": tipo, "atualizacao": atualizacao,
               "extensao_km": ext_ida}
    volta = dict(sentido, extensao_km=(ext_ida + 0.5) if ext_ida else None)
    return {"linhas": {"0507": {"route_id": "42067",
                                "sentidos": {"IDA": sentido, "VOLTA": volta}}}}


def test_normalizar_empresa_aceita_variacoes_de_acento_e_caixa() -> None:
    for bruto in ("SÃO JORGE", "SAO JORGE", "São Jorge", "  sao jorge  "):
        assert normalizar_empresa(bruto) == "SAO_JORGE"


def test_normalizar_empresa_rejeita_vazio_e_desconhecida() -> None:
    assert normalizar_empresa("") is None
    assert normalizar_empresa(None) is None
    assert normalizar_empresa("EMPRESA QUE NAO EXISTE") is None


def test_operadoras_de_mapeia_linha_com_empresa_publicada() -> None:
    mapa = operadoras_de(_meta("NAVEGANTES"))
    assert mapa == {"0507": "NAVEGANTES"}


def test_operadoras_de_ignora_linha_sem_empresa() -> None:
    assert operadoras_de(_meta("")) == {}


def test_operadoras_de_ignora_divergencia_entre_sentidos() -> None:
    """Operadora diferente em IDA e VOLTA não vira palpite."""
    meta = _meta("NAVEGANTES")
    meta["linhas"]["0507"]["sentidos"]["VOLTA"]["empresa"] = "REUNIDAS"
    assert operadoras_de(meta) == {}


def test_agency_id_de_cai_em_sem_operadora_quando_ausente() -> None:
    assert agency_id_de("0507", {"0507": "NAVEGANTES"}) == "NAVEGANTES"
    assert agency_id_de("0116", {"0507": "NAVEGANTES"}) == SEM_OPERADORA


def test_tabela_agency_inclui_sem_operadora_quando_alguma_linha_precisa() -> None:
    mapa = operadoras_de(_meta("NAVEGANTES"))
    tabela = tabela_agency(mapa, ["0507", "0116"])
    ids = [linha["agency_id"] for linha in tabela]
    assert "NAVEGANTES" in ids
    assert SEM_OPERADORA in ids
    assert len(ids) == len(set(ids)), "agency_id não pode repetir"


def test_tabela_agency_omite_sem_operadora_quando_todas_tem_empresa() -> None:
    mapa = {"0507": "NAVEGANTES"}
    tabela = tabela_agency(mapa, ["0507"])
    assert [linha["agency_id"] for linha in tabela] == ["NAVEGANTES"]


def test_tabela_agency_preenche_campos_obrigatorios_do_gtfs() -> None:
    tabela = tabela_agency({"0507": "NAVEGANTES"}, ["0507"])
    obrigatorios = {"agency_id", "agency_name", "agency_url", "agency_timezone"}
    for linha in tabela:
        assert obrigatorios <= set(linha)
        assert linha["agency_timezone"] == "America/Sao_Paulo"
        assert linha["agency_url"].startswith("https://")


def test_descricao_rota_traz_tipo_km_e_operadora_com_ano() -> None:
    texto = descricao_rota(_meta("NAVEGANTES", "2026-01-08"), "0507")
    assert "Radial" in texto
    assert "km" in texto
    assert "NAVEGANTES" in texto
    assert "2026" in texto


def test_descricao_rota_marca_operadora_sem_data() -> None:
    texto = descricao_rota(_meta("MANDACARUENSE", "1899-12-30"), "0507")
    assert "sem data" in texto
    assert "MANDACARUENSE" in texto


def test_descricao_rota_vazia_quando_nao_ha_metadados() -> None:
    assert descricao_rota({}, "0507") == ""
    assert descricao_rota({"linhas": {}}, "9999") == ""


def test_titulo_linha_capitaliza() -> None:
    assert titulo_linha("RADIAL") == "Radial"
    assert titulo_linha("DIAMETRAL") == "Diametral"
    assert titulo_linha("") == ""


def test_alias_1001_aponta_para_variante_mandacaru() -> None:
    """O painel chama de '1001' a '1001M - Bairro das Indústrias/Mandacaru'."""
    assert ALIAS_SIGLA["1001"] == "1001M"


def test_catalogo_de_operadoras_cobre_as_sete_da_semob() -> None:
    esperado = {"REUNIDAS", "TRANSNACIONAL", "SAO_JORGE", "SANTA_MARIA",
                "MARCOS_DA_SILVA", "NAVEGANTES", "MANDACARUENSE"}
    assert set(OPERADORAS) == esperado
    valores = [normalizar_empresa(nome) for nome in OPERADORAS.values()]
    assert all(v in OPERADORAS for v in valores)
