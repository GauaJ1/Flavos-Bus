# Pós-item 6: mede, por linha, quantas paradas ficam > 100 m do shape NOVO
# (trips do feed × shapes.txt). Linhas com muitas paradas longe indicam que o
# traçado oficial está desatualizado em relação ao serviço real (paradas do
# painel frescas): nessas a substituição do item 6 deve ser revertida.

from __future__ import annotations

import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scraper.gtfs.shapes_semob import haversine_m  # noqa: E402

GTFS = Path(__file__).resolve().parent.parent.parent / "data" / "gtfs"
TOLERANCIA_M = 100.0


def _rows(nome: str) -> list[dict[str, str]]:
    with (GTFS / f"{nome}.txt").open(encoding="utf-8", newline="") as f:
        return [dict(r) for r in csv.DictReader(f)]


def main() -> int:
    trips = _rows("trips")
    rotas = {r["route_id"]: r["route_short_name"] for r in _rows("routes")}
    stops = {s["stop_id"]: (float(s["stop_lat"]), float(s["stop_lon"]))
             for s in _rows("stops")}
    pontos: dict[str, list[tuple[float, float]]] = defaultdict(list)
    seqs: dict[str, list[int]] = defaultdict(list)
    for s in _rows("shapes"):
        pontos[s["shape_id"]].append(
            (float(s["shape_pt_lat"]), float(s["shape_pt_lon"])))
        seqs[s["shape_id"]].append(int(s["shape_pt_sequence"]))
    for sid in pontos:
        ordenado = [p for _, p in sorted(
            zip(seqs[sid], pontos[sid], strict=True))]
        pontos[sid] = ordenado

    # para cada shape usado pelo feed, as paradas dos seus trips
    paradas_por_shape: dict[str, set[str]] = defaultdict(set)
    for t in trips:
        if t.get("shape_id"):
            paradas_por_shape[t["shape_id"]].add(1)  # placeholder substituído abaixo

    # reconstruir: stop_times só das trips primeiras? caro (5.5k trips) mas viável
    trip_shape = {t["trip_id"]: t.get("shape_id", "") for t in trips}
    longe_por_shape: dict[str, int] = Counter()
    total_por_shape: dict[str, int] = Counter()
    dist_por_shape: dict[str, list[float]] = defaultdict(list)
    vistos: set[str] = set()
    with (GTFS / "stop_times.txt").open(encoding="utf-8", newline="") as f:
        for st in csv.DictReader(f):
            trip_id = st["trip_id"]
            shape_id = trip_shape.get(trip_id, "")
            if not shape_id or shape_id not in pontos:
                continue
            par = stops.get(st["stop_id"])
            if par is None:
                continue
            chave = (shape_id, st["stop_id"])
            if chave in vistos:
                continue
            vistos.add(chave)
            dist = min(haversine_m(par[0], par[1], a, b) for a, b in pontos[shape_id])
            dist_por_shape[shape_id].append(dist)
            total_por_shape[shape_id] += 1
            if dist > TOLERANCIA_M:
                longe_por_shape[shape_id] += 1

    por_linha: dict[str, dict[str, float]] = {}
    for shape_id, total in sorted(total_por_shape.items()):
        rsn = _linha_do_shape(shape_id, rotas)
        if rsn is None:
            continue
        agrega = por_linha.setdefault(rsn, {"longe": 0, "total": 0, "max": 0.0})
        agrega["longe"] += longe_por_shape.get(shape_id, 0)
        agrega["total"] += total
        agrega["max"] = max(agrega["max"], max(dist_por_shape.get(shape_id, [0])))

    print(f"{'linha':6} {'paradas>100m':>12} {'total':>7} {'pior dist':>10}")
    problematicas = []
    for rsn, dados in sorted(por_linha.items(),
                             key=lambda x: -(x[1]["longe"] / max(x[1]["total"], 1))):
        if dados["longe"] == 0:
            continue
        print(f"{rsn:6} {dados['longe']:>12} {dados['total']:>7} "
              f"{dados['max']:>9.0f}m")
        problematicas.append((rsn, dados["longe"], dados["total"], dados["max"]))
    limiar = 5
    revertidas = [r for r, longes, tot, _ in problematicas if longes > limiar]
    print(f"\ncritério de reversão: > {limiar} paradas > {TOLERANCIA_M:.0f} m do shape")
    print("linhas a REVERTER (manter traçado do painel):", revertidas or "nenhuma")
    print("linhas MANTIDAS com o traçado oficial:",
          [r for r in sorted(por_linha) if r not in revertidas][:40])
    return 0


def _linha_do_shape(shape_id: str, rotas: dict[str, str]) -> str | None:
    # shapes do painel: sh-<tid>; shapes SEMOB: semob-<rsn>-<sentido>
    if shape_id.startswith("semob-"):
        meio = shape_id[len("semob-"):]
        for rsn in rotas.values():
            if meio.startswith(rsn.lower() + "-"):
                return rsn
        return None
    return None


if __name__ == "__main__":
    raise SystemExit(main())
