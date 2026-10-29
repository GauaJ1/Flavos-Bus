# Mostra a estrutura interna do get-timetable (trips/stops/services) e
# confere a linha 0510/0507 dentro da lista do get-routes.

from __future__ import annotations

import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent
EXTRAS = PASTA / "captura_extras"


def carregar(nome: str) -> object:
    return json.loads((EXTRAS / nome).read_text(encoding="utf-8"))


def main() -> None:
    tabelas = carregar("evento_19.json")  # get-timetable da 0510 (routeId 42071)
    print("=== get-timetable 0510:", len(tabelas), "viagens")
    primeira = tabelas[0]
    print("chaves da viagem:", sorted(primeira.keys()))
    print("tid:", primeira["tid"], "| th:", primeira["th"], "| dir:", primeira["dir"])
    print("tsn:", json.dumps(primeira.get("tsn"), ensure_ascii=False)[:200])
    print("services:", json.dumps(primeira.get("services"))[:200])
    paradas = primeira.get("stops") or []
    print("n_stops:", len(paradas))
    for parada in paradas[:3]:
        print("  stop:", json.dumps(parada, ensure_ascii=False)[:300])
    if len(paradas) > 3:
        print("  ... última:", json.dumps(paradas[-1], ensure_ascii=False)[:300])
    print("\n=== todas as viagens da resposta:")
    for viagem in tabelas:
        print(
            f"  tid={viagem['tid']} dir={viagem.get('dir')} "
            f"th={str(viagem.get('th'))[:44]!r} "
            f"stops={len(viagem.get('stops') or [])} "
            f"services={viagem.get('services')}"
        )

    rotas = carregar("evento_14.json")  # get-routes (lista completa)
    print("\n=== get-routes:", len(rotas), "linhas")
    for rota in rotas:
        numero = str(rota.get("rsn", "")).lstrip("0")
        if numero in ("510", "507"):
            print("  =>", json.dumps(rota, ensure_ascii=False))
    # amostra dos números para conferir o formato do índice de linhas
    print("primeiros 5 rsn/fmt:", [(r["rsn"], r["fmt"]) for r in rotas[:5]])
    print("últimos 5 rsn/fmt:", [(r["rsn"], r["fmt"]) for r in rotas[-5:]])


if __name__ == "__main__":
    main()
