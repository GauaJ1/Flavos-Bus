"""CLI do coletor — rodar de dentro de tools/scraper:

    python -m scraper collect --linha 510 [--force]
    python -m scraper collect --all [--force]
    python -m scraper report
"""

from __future__ import annotations

import argparse
import re
import sys

from . import config
from .http_client import HttpClient
from .report import build_report, format_report
from .sources.bus2 import collect_all, collect_line, resolver_rota


def _linha_valida(valor: str) -> str:
    """Permite '510', 'TAMBAU-1' etc.; barra travessões estranhos e espaços."""
    text = valor.strip()
    if not re.fullmatch(r"[0-9A-Za-z_-]+", text):
        raise argparse.ArgumentTypeError(f"linha inválida: {valor!r}")
    return text


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="scraper", description="Coleta Fase 1 — Flavos Bus (João Pessoa/PB)"
    )
    sub = parser.add_subparsers(dest="comando", required=True)

    collect = sub.add_parser("collect", help="baixa dados brutos para data/raw/")
    alvo = collect.add_mutually_exclusive_group(required=True)
    alvo.add_argument("--linha", type=_linha_valida, help="coleta apenas esta linha (ex.: 510)")
    alvo.add_argument("--all", action="store_true", help="varre todas as linhas do índice")
    collect.add_argument("--force", action="store_true", help="rebaixa mesmo com cache válido")

    sub.add_parser("report", help="resumo por linha: completas / parciais / erros")
    return parser


def _run(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.comando == "report":
        print(format_report(build_report(config.raw_dir())))
        return 0

    http = HttpClient()
    try:
        if args.all:
            resultados = collect_all(raw_dir=config.raw_dir(), http=http, force=args.force)
        else:
            assert isinstance(args.linha, str)  # argparse exige --linha ou --all
            rota = resolver_rota(
                args.linha, raw_dir=config.raw_dir(), http=http
            )
            resultados = [
                collect_line(
                    rota.rid, rota.rsn, raw_dir=config.raw_dir(), http=http, force=args.force
                )
            ]
    except (ValueError, FileNotFoundError) as exc:
        print(f"[config] {exc}")
        return 2

    houve_erro = False
    for resultado in resultados:
        if resultado.erros:
            houve_erro = True
            for erro in resultado.erros:
                print(f"[erro] linha {resultado.linha} · {erro['kind']} · {erro['error']}")
            if resultado.faltando:
                print(f"       faltando: {', '.join(resultado.faltando)}")
        else:
            novo = f"{len(resultado.baixados)} novo(s)"
            cache = f"{len(resultado.pulados_cache)} de cache"
            print(f"[ok]   linha {resultado.linha}: {novo}; {cache}")
    return 1 if houve_erro else 0


def main(argv: list[str] | None = None) -> None:
    sys.exit(_run(argv))


if __name__ == "__main__":
    main()
