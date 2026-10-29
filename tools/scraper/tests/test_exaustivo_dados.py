# SUÍTE DE EXAUSTÃO (dados) — todo o caminho de consulta, do mínimo ao extremo.
# NÃO repete os testes do doc Moovit: aqui é fuzzing do SQL, dos dados e da
# integridade. Agregações pesadas são feitas em Python (não em SQL) porque
# este ambiente nega arquivo temporário ao SQLite (GROUP BY/ORDER BY grandes
# falham com "unable to open database file" — limitação do sandbox, não do dado).
import sqlite3
from datetime import date
from pathlib import Path

import pytest

DIAS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def _banco() -> Path:
    p = Path(__file__).resolve()
    for pai in [p, *p.parents]:
        alvo = pai / "data" / "gtfs" / "flavos.sqlite"
        if alvo.exists():
            return alvo
    raise FileNotFoundError("flavos.sqlite ausente; rode python -m scraper sqlite")


@pytest.fixture(scope="module")
def con() -> sqlite3.Connection:
    c = sqlite3.connect(_banco())
    c.row_factory = sqlite3.Row
    return c


def _minutos(h: str) -> int:
    p = h.split(":")
    return int(p[0]) * 60 + int(p[1])


# ---------------------------------------------------------------- integridade
def test_00_tabelas_esperadas(con: sqlite3.Connection) -> None:
    nomes = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    esperadas = {"meta", "agencies", "routes", "stops", "calendar", "shapes", "trips", "stop_times"}
    assert esperadas <= nomes, esperadas - nomes


def test_01_contagens_coerentes(con: sqlite3.Connection) -> None:
    n_routes = con.execute("SELECT count(*) FROM routes").fetchone()[0]
    n_trips = con.execute("SELECT count(*) FROM trips").fetchone()[0]
    n_stops = con.execute("SELECT count(*) FROM stops").fetchone()[0]
    n_st = con.execute("SELECT count(*) FROM stop_times").fetchone()[0]
    assert 80 <= n_routes <= 90, n_routes
    assert n_trips > 5_000, n_trips
    assert n_stops > 2_000, n_stops
    assert n_st > n_trips * 10, (n_st, n_trips)


def test_02_sem_referencias_orfas(con: sqlite3.Connection) -> None:
    # contagem por NOT IN numa tabela pequena -> id de viagens órfãs em stop_times
    # (não uso JOIN/agregação grande: ver cabeçalho)
    trips = {r[0] for r in con.execute("SELECT trip_id FROM trips")}
    stops = {r[0] for r in con.execute("SELECT stop_id FROM stops")}
    routs = {r[0] for r in con.execute("SELECT route_id FROM routes")}
    cal = {r[0] for r in con.execute("SELECT service_id FROM calendar")}
    for r in con.execute("SELECT trip_id, route_id, service_id FROM trips"):
        assert r["trip_id"], "trip_id vazio"
        assert r["route_id"] in routs, f"trip {r['trip_id']} com route_id órfão {r['route_id']}"
        assert r["service_id"] in cal, f"trip {r['trip_id']} com service órfão"
    faltando = 0
    for r in con.execute("SELECT trip_id, stop_id FROM stop_times"):
        if r["trip_id"] not in trips or r["stop_id"] not in stops:
            faltando += 1
    assert faltando == 0, faltando


def test_03_nenhum_campo_critico_vazio(con: sqlite3.Connection) -> None:
    # schema real: stops(stop_id, code, name, lat, lon) — coluna é "name"
    assert con.execute(
        "SELECT count(*) FROM routes WHERE short_name IS NULL OR trim(short_name)=''"
    ).fetchone()[0] == 0
    assert con.execute(
        "SELECT count(*) FROM routes WHERE long_name IS NULL"
    ).fetchone()[0] == 0
    assert con.execute(
        "SELECT count(*) FROM stops WHERE name IS NULL OR trim(name)=''"
    ).fetchone()[0] == 0
    assert con.execute(
        "SELECT count(*) FROM trips WHERE service_id IS NULL"
    ).fetchone()[0] == 0


# ---------------------------------------------------------------- horários
def test_04_horarios_sempre_parseaveis(con: sqlite3.Connection) -> None:
    # o feed usa H:MM:SS (7) ou HH:MM:SS (8); qualquer outro formato é dado podre
    ruins = 0
    exemplos: list[str] = []
    for (h,) in con.execute("SELECT departure FROM stop_times"):
        partes = h.split(":")
        ok = (
            len(partes) == 3
            and len(partes[0]) in (1, 2)
            and len(partes[1]) == 2
            and len(partes[2]) == 2
            and all(p.isdigit() for p in partes)
        )
        if not ok:
            ruins += 1
            if len(exemplos) < 5:
                exemplos.append(h)
    assert ruins == 0, (ruins, exemplos)


def test_05_nenhum_horario_absurdo(con: sqlite3.Connection) -> None:
    # GTFS permite até 47:59:59 (viagens que cruzam a meia-noite); fora disso é lixo
    estranhos = []
    for (h,) in con.execute("SELECT departure FROM stop_times"):
        if _minutos(h) >= 48 * 60:
            estranhos.append(h)
            if len(estranhos) > 5:
                break
    assert estranhos == [], estranhos


def test_06_sequencia_de_paradas_sem_buraco(con: sqlite3.Connection) -> None:
    # percorro por viagem em Python (agrupamento em SQL não roda neste sandbox):
    # seq precisa começar em 1 e crescer de 1 em 1
    atual = None
    esperado = 1
    ruins = 0
    for trip, seq in con.execute("SELECT trip_id, seq FROM stop_times ORDER BY trip_id, seq"):
        if trip != atual:
            atual = trip
            esperado = 1
        if seq != esperado:
            ruins += 1
        esperado += 1
    assert ruins == 0, ruins


def test_07_toda_viagem_tem_primeira_parada(con: sqlite3.Connection) -> None:
    ids_completos = set()
    for (trip,) in con.execute("SELECT trip_id FROM stop_times WHERE seq = 1"):
        ids_completos.add(trip)
    todas = {r[0] for r in con.execute("SELECT trip_id FROM trips")}
    faltando = todas - ids_completos
    assert not faltando, f"{len(faltando)} viagens sem seq=1 (ex.: {list(faltando)[:3]})"


# ---------------------------------------------------------------- calendário
def test_08_algum_dia_ativo_em_cada_calendario(con: sqlite3.Connection) -> None:
    vazios = 0
    sql = (
        "SELECT service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday"
        " FROM calendar"
    )
    for r in con.execute(sql):
        if sum(r[i] for i in range(1, 8)) == 0:
            vazios += 1
    assert vazios == 0, vazios


def test_09_janela_de_datas_coerente(con: sqlite3.Connection) -> None:
    invertido = con.execute(
        "SELECT count(*) FROM calendar WHERE start_date > end_date"
    ).fetchone()[0]
    assert invertido == 0, invertido


def test_10_hoje_tem_viagens(con: sqlite3.Connection) -> None:
    col = DIAS[date.today().weekday()]
    n = con.execute(
        f"""SELECT count(*) FROM trips t JOIN calendar c ON c.service_id=t.service_id
             WHERE c."{col}"=1
               AND c.start_date <= strftime('%Y%m%d','now')
               AND c.end_date   >= strftime('%Y%m%d','now')"""  # noqa: S608
    ).fetchone()[0]
    assert n > 1000, n


# ---------------------------------------------------------------- busca (fuzz)
@pytest.mark.parametrize(
    "termo",
    ["509", "0509", "%", "_", "'; DROP TABLE routes; --", "😀", "a" * 400, " ", "áéí", "null", "0"],
)
def test_11_busca_fuzz_nao_derruba_a_consulta(con: sqlite3.Connection, termo: str) -> None:
    padrao = f"%{termo.strip().lower()}%"
    linhas = con.execute(
        "SELECT route_id FROM routes WHERE short_norm LIKE ? OR long_norm LIKE ? LIMIT 100",
        (padrao, padrao),
    ).fetchall()
    assert isinstance(linhas, list)


def test_12_busca_normalizada_cobre_todos_os_nomes(con: sqlite3.Connection) -> None:
    # O app compara o TERMO NORMALIZADO (sem acento) contra *_norm. A prova
    # correta é: normalizando o nome da linha do mesmo jeito que a ingestão
    # faz, o resultado precisa estar dentro do long_norm gravado.
    import unicodedata

    def norm(t: str) -> str:
        return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()

    falhas = []
    for route_id, long_name, long_norm in con.execute(
        "SELECT route_id, long_name, long_norm FROM routes"
    ):
        termo = norm(long_name.split(" | ")[0].strip())
        if termo and termo not in long_norm:
            falhas.append((route_id, long_name, termo, long_norm))
    assert falhas == [], falhas


# ---------------------------------------------------------------- consultas do app
def test_13_todas_as_linhas_tem_quadro(con: sqlite3.Connection) -> None:
    primeiro_seq = {r[0] for r in con.execute("SELECT trip_id FROM stop_times WHERE seq = 1")}
    sem: list[str] = []
    for route_id, trip in con.execute("SELECT route_id, trip_id FROM trips"):
        if trip not in primeiro_seq:
            sem.append(route_id)
    assert not sem, sem


def test_14_ordem_por_minutos_e_a_ordem_da_tela(con: sqlite3.Connection) -> None:
    # prova que a ordenação cronológica difere da textual em pelo menos um caso
    # (o feed tem H:MM:SS sem zero) e que a de minutos é a correta
    horas = [r[0] for r in con.execute("SELECT departure FROM stop_times LIMIT 20000")]
    por_texto = sorted(horas)
    por_min = sorted(horas, key=_minutos)
    assert por_texto != por_min, "esperava divergência texto vs minutos"
    assert por_min[0] == "5:00:00" or por_min[0].startswith("4:") or por_min[0].startswith("5:")
    assert [_minutos(h) for h in por_min] == sorted(_minutos(h) for h in por_min)


def test_15_cada_linha_abre_com_numero_e_nome(con: sqlite3.Connection) -> None:
    ruins = con.execute(
        "SELECT count(*) FROM routes"
        " WHERE short_name IS NULL OR long_name IS NULL OR long_name = ''"
    ).fetchone()[0]
    assert ruins == 0
