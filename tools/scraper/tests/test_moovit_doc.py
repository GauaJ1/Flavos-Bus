# TESTES PÓS-APRENDIZADO — doc "Como funciona o Moovit — Anatomia e MVP.md"
# Derivações do doc aplicadas ao flavos.sqlite gerado pelo nosso pipeline:
# §Experiência: "Detalhe da linha — A que horas passa? — trips + stop_times"
# §Rotas: "A pergunta 'a que horas passa?' é uma consulta em stop_times"
# §Stack: "Atualizar horários exige versão do banco (mecanismo simples)"
import sqlite3
from datetime import date
from pathlib import Path

import pytest


def _banco() -> Path:
    p = Path(__file__).resolve()
    for pai in [p, *p.parents]:
        alvo = pai / "data" / "gtfs" / "flavos.sqlite"
        if alvo.exists():
            return alvo
    raise FileNotFoundError("flavos.sqlite não encontrado; rode python -m scraper sqlite")


@pytest.fixture(scope="module")
def con() -> sqlite3.Connection:
    return sqlite3.connect(_banco())


def test_doc_versao_do_banco_mecanismo_simples(con: sqlite3.Connection) -> None:
    # doc §Stack "Custo de não ter servidor": atualizar exige versão do banco;
    # a nossa versão é o feed_version (data) em meta, mostrada na tela
    versao = con.execute(
        "SELECT valor FROM meta WHERE chave = 'feed_version'"
    ).fetchone()
    assert versao is not None and versao[0].count("-") >= 2, versao


def test_doc_a_que_horas_passa_e_consulta_stop_times(con: sqlite3.Connection) -> None:
    # doc §Experiência: detalhe da linha = trips + stop_times; 0509 (42029),
    # HOJE: 20 partidas, primeira 05:00, última 17:40 (prova Bus2 13:12).
    # Exatamente como o app: filtra calendar do DIA e ordena por MINUTOS
    # (o feed usa H:MM:SS sem zero — ordenar texto desordena o quadro!)
    colunas = (
        "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday",
    )
    col_hoje = colunas[date.today().weekday()]
    partidas = con.execute(
        f"""SELECT st.departure
              FROM trips AS t
              JOIN stop_times AS st ON st.trip_id = t.trip_id
              JOIN calendar AS c ON c.service_id = t.service_id
             WHERE t.route_id = '42029' AND t.direction = 0
               AND c."{col_hoje}" = 1
               AND c.start_date <= strftime('%Y%m%d', 'now')
               AND c.end_date >= strftime('%Y%m%d', 'now')
               AND st.seq = 1"""  # noqa: S608 — col_hoje da allowlist fixa
    ).fetchall()

    def minutos(h: str) -> int:
        p = h.split(":")
        return int(p[0]) * 60 + int(p[1])

    horarios = sorted((linha[0] for linha in partidas), key=minutos)
    assert len(horarios) == 20, horarios
    # o feed cru usa H:MM:SS sem zero ("5:00:00") — o app normaliza p/ 05:00
    assert minutos(horarios[0]) == 5 * 60 and horarios[0].startswith("5:")
    assert minutos(horarios[-1]) == 17 * 60 + 40 and horarios[-1] == "17:40:00"


def test_doc_busca_por_nome_no_banco(con: sqlite3.Connection) -> None:
    # doc tabela: "Busca de linhas — Qual é a linha X?" — número E nome.
    # doc §dados item 2: "normaliza nomes" — sem acento/caixa via *_norm
    por_numero = con.execute(
        "SELECT route_id FROM routes WHERE short_norm LIKE '%509%' LIMIT 1"
    ).fetchone()
    por_nome = con.execute(
        "SELECT route_id FROM routes WHERE long_norm LIKE '%jaguaribe%' LIMIT 1"
    ).fetchone()
    sem_acento = con.execute(
        "SELECT route_id FROM routes"
        " WHERE long_norm LIKE '%tambau%' OR long_norm LIKE '%goiam%' LIMIT 1"
    ).fetchone()
    assert por_numero == ("42029",)
    assert por_nome == ("42001",)
    assert sem_acento is not None


def test_doc_calendario_vivo_hoje(con: sqlite3.Connection) -> None:
    # doc §Rotas "Calendário — escolher só as viagens ativas no dia pedido":
    # a 0509 deve ter viagem ativa HOJE (coluna do dia da semana = 1)
    colunas = (
        "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday",
    )
    col_hoje = colunas[date.today().weekday()]
    ativa = con.execute(
        f"""SELECT 1
              FROM trips AS t
              JOIN calendar AS c ON c.service_id = t.service_id
             WHERE t.route_id = '42029'
               AND c."{col_hoje}" = 1
               AND c.start_date <= strftime('%Y%m%d', 'now')
               AND c.end_date >= strftime('%Y%m%d', 'now')
             LIMIT 1"""  # noqa: S608 — col_hoje vem da allowlist fixa acima
    ).fetchone()
    assert ativa is not None, f"0509 sem viagem ativa hoje ({col_hoje})"
