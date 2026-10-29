"""Tarefa MVP 5 — lista inicial de linhas do app escolhida pelos dados.

Critério honesto disponível: FREQUÊNCIA no próprio feed (viagens/dia). Não
existe dado de passageiros; registro isso na tabela gerada como limitação.

Uso:  python -m scraper linhas_mvp [--n 12]
Escreve: apps/mobile/src/dados/linhas_mvp.ts (lista do app) e
docs/design/LINHAS_MVP.md (tabela de justificativa, legível por humanos).
"""

from __future__ import annotations

import argparse
import datetime as _dt
from pathlib import Path

from . import config
from .gtfs_sqlite import abrir

_PASTA_APP_DADOS = Path("apps/mobile/src/dados/linhas_mvp.ts")
_PASTA_DOC = Path("docs/design/LINHAS_MVP.md")


def ranquear(banco: Path, hoje_iso: str) -> list[dict[str, str | int]]:
    """Viagens por linha no intervalo vigente do calendar, por tipo de dia."""
    conn = abrir(banco)
    linhas = conn.execute(
        """
        SELECT r.route_id, r.short_name, r.long_name,
               SUM(CASE WHEN c.saturday = 0 AND c.sunday = 0 THEN 1 ELSE 0 END) AS util,
               SUM(CASE WHEN c.saturday = 1 THEN 1 ELSE 0 END)                  AS sab,
               SUM(CASE WHEN c.sunday = 1 THEN 1 ELSE 0 END)                    AS dom
        FROM trips AS t
        JOIN routes   AS r ON r.route_id = t.route_id
        JOIN calendar AS c ON c.service_id = t.service_id
        WHERE c.start_date <= ? AND c.end_date >= ?
        GROUP BY r.route_id
        ORDER BY util DESC, sab DESC, r.short_name ASC
        """,
        (hoje_iso, hoje_iso),
    ).fetchall()
    return [
        {
            "route_id": r[0],
            "numero": r[1],
            "nome": (r[2].split(" | ")[0] if r[2] else ""),
            "util": r[3] or 0,
            "sab": r[4] or 0,
            "dom": r[5] or 0,
        }
        for r in linhas
    ]


def _ts_da_lista(route_ids: list[str], n: int, gerado_em: str) -> str:
    itens = ",\n  ".join(f'"{rid}"' for rid in route_ids)
    return (
        f"// Lista inicial de linhas do MVP (Tarefa 5) — GERADA por\n"
        f"// `python -m scraper linhas_mvp --n {n}` em {gerado_em}, a partir da\n"
        f"// frequência real do flavos.sqlite (viagens/dia útil). Para ajustar a\n"
        f"// lista a dedo, edite este arquivo e regenere com --n maior/menor.\n"
        f"export const LINHAS_MVP: readonly string[] = [\n  {itens},\n];\n"
    )


def _md_da_tabela(ranking: list[dict[str, str | int]], n: int, hoje_iso: str) -> str:
    cab = [
        "# Lista inicial de linhas do MVP — justificativa pelos dados",
        "",
        f"Critério: frequência no feed (viagens/dia) vigente em {hoje_iso};",
        f"top {n}. Limitação honesta: não existe dado de passageiros — uso",
        "programação como proxy, sinalizado aqui. Sem dado inventado.",
        "",
        "# | Linha | Nome | Dia útil | Sábado | Domingo |",
        "---|---|---|---|---|---|",
    ]
    corpo = [
        f"{i + 1} | {r['numero']} | {r['nome']} | {r['util']} | {r['sab']} | {r['dom']} |"
        for i, r in enumerate(ranking[:n])
    ]
    return "\n".join(cab + corpo) + "\n"


def executar(n: int) -> int:
    banco = config.gtfs_dir() / "flavos.sqlite"
    if not banco.is_file():
        print("[erro] gere o banco antes: python -m scraper sqlite")
        return 2
    hoje_iso = _dt.date.today().strftime("%Y%m%d")
    gerado_em = _dt.date.today().isoformat()
    ranking = ranquear(banco, hoje_iso)
    escolhidas = [str(r["route_id"]) for r in ranking[:n]]

    raiz = Path(__file__).resolve().parents[3]  # .../tools/scraper/scraper/../.. = repo
    app_ts = raiz / _PASTA_APP_DADOS
    doc_md = raiz / _PASTA_DOC
    app_ts.parent.mkdir(parents=True, exist_ok=True)
    doc_md.parent.mkdir(parents=True, exist_ok=True)
    app_ts.write_text(_ts_da_lista(escolhidas, n, gerado_em), encoding="utf-8")
    doc_md.write_text(_md_da_tabela(ranking, n, hoje_iso), encoding="utf-8")
    top = ", ".join(f"{r['numero']} ({r['util']}/dia util)" for r in ranking[: n // 2])
    print(f"[ok]   {len(escolhidas)} linhas -> {app_ts.name} + {doc_md.name}")
    print(f"[ok]   topo: {top}")
    return 0


def registrar_no(parser: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    cmd = parser.add_parser(
        "linhas_mvp", help="Tarefa MVP 5: ranking de frequência → lista inicial do app"
    )
    cmd.add_argument("--n", type=int, default=12, help="quantas linhas (padrão: 12)")
