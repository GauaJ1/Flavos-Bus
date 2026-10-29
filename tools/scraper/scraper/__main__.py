"""CLI do coletor — rodar de dentro de tools/scraper:

    python -m scraper collect --linha 510 [--force]
    python -m scraper collect --all [--force]
    python -m scraper report
    python -m scraper gtfs [--feed-hash HASH] [--saida PASTA]
    python -m scraper sqlite [--saida PASTA]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

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

    gtfs = sub.add_parser("gtfs", help="Fase 2: monta o feed GTFS em data/gtfs/ e valida")
    gtfs.add_argument("--saida", type=str, default="", help="pasta de saída (padrão: data/gtfs)")
    gtfs.add_argument(
        "--feed-hash",
        dest="feed_hash",
        type=str,
        default="",
        help="hash do projeto (get-project.feed_hash) incluído no feed_version",
    )

    sqlite_cmd = sub.add_parser(
        "sqlite",
        help="Fase 3 (MVP): empacota o feed em flavos.sqlite (o app lê esse .db)",
    )
    sqlite_cmd.add_argument(
        "--saida",
        type=str,
        default="",
        help="pasta do feed a ler; o flavos.sqlite é gravado nela (padrão: data/gtfs)",
    )

    from .linha_mvp import registrar_no as registrar_linhas_mvp

    registrar_linhas_mvp(sub)
    return parser


def _executar_gtfs(args: argparse.Namespace) -> int:
    """Fase 2: decifra data/raw, monta o feed GTFS, valida e empacota."""
    from .gtfs import (
        carregar_entrada,
        escrever_feed,
        montar_tabelas,
        validar_tabelas,
        zipar_feed,
    )
    from .gtfs.relatorio import texto_relatorio

    saida = Path(args.saida) if args.saida else config.gtfs_dir()
    entrada = carregar_entrada(config.raw_dir(), feed_hash=args.feed_hash)
    faltando = entrada.faltando
    if faltando:
        print(f"[config] timetables faltando em data/raw para: {', '.join(faltando)}")
        return 2

    tab = montar_tabelas(
        entrada, semob_geojson_dir=config.raw_dir() / "semob_geojson"
    )
    achados = validar_tabelas(tab)
    erros = [n for n in tab.notas + achados if n.severidade == "erro"]

    contagens = {
        "routes.txt": len(tab.routes),
        "stops.txt": len(tab.stops),
        "calendar.txt": len(tab.calendar),
        "shapes.txt": len(tab.shapes),
        "trips.txt": len(tab.trips),
        "stop_times.txt": len(tab.stop_times),
    }
    for arquivo, qtd in contagens.items():
        print(f"  {arquivo}: {qtd}")
    for nota in tab.notas:
        print(nota.linha())
    for achado in achados:
        print(achado.linha())

    caminhos = escrever_feed(tab, saida)
    print(f"[ok]   .txt gerados: {', '.join(c.name for c in caminhos)}")
    relatorio = saida / "_RELATORIO.md"
    relatorio.write_text(texto_relatorio(tab, achados, entrada.data_geracao), encoding="utf-8")
    print(f"[ok]   relatório: {relatorio}")

    if erros:
        print(f"[erro] feed com {len(erros)} erro(s): gtfs.zip NÃO gerado (doc seção 6)")
        return 2
    zip_path = zipar_feed(saida, saida / "gtfs.zip")
    print(f"[ok]   gtfs.zip: {zip_path} ({zip_path.stat().st_size / 1024:.0f} KB)")
    return 0


def _executar_sqlite(args: argparse.Namespace) -> int:
    """Fase 3 (MVP): empacota o feed GTFS em flavos.sqlite para o app offline."""
    from .gtfs_sqlite import montar_db

    pasta = Path(args.saida) if args.saida else config.gtfs_dir()
    if not (pasta / "routes.txt").is_file():
        print(f"[erro] feed não encontrado em {pasta}; rode `python -m scraper gtfs` antes")
        return 2
    alvo = pasta / "flavos.sqlite"
    contagens = montar_db(alvo, pasta)
    executaveis = ", ".join(f"{nome}={contagens[nome]}" for nome in sorted(contagens))
    print(f"[ok]   {alvo}")
    print(f"[ok]   tamanho: {alvo.stat().st_size / 1024 / 1024:.1f} MB")
    print(f"[ok]   contagens: {executaveis}")
    return 0


def _run(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.comando == "report":
        print(format_report(build_report(config.raw_dir())))
        return 0

    if args.comando == "gtfs":
        return _executar_gtfs(args)

    if args.comando == "sqlite":
        return _executar_sqlite(args)

    if args.comando == "linhas_mvp":
        from .linha_mvp import executar as executar_linhas_mvp

        return executar_linhas_mvp(args.n)

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
