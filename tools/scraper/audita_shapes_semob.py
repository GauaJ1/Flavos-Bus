# Prova de valor do geojson oficial da SEMOB: compara TODAS as linhas que
# existem nas duas fontes e mostra a qualidade do nosso traçado.
# Gera relatório em data/gtfs/_AUDITORIA_SHAPES.md (dado real, sem inventar).

from __future__ import annotations

import csv
import json
import math
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
GTFS = RAIZ / "data" / "gtfs"
BASE = "https://servicos.semobjp.pb.gov.br"
CAB = {"User-Agent": "FlavosBus-DataCollector/0.1 (contato: flavosbus)"}


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _csv(nome: str) -> list[dict[str, str]]:
    with (GTFS / f"{nome}.txt").open(encoding="utf-8", newline="") as f:
        return [dict(l) for l in csv.DictReader(f)]


def geojson_semob(sigla: str) -> list[tuple[float, float]] | None:
    try:
        req = urllib.request.Request(
            f"{BASE}/linhas-de-onibus/{sigla}/itinerario/geojson", headers=CAB)
        with urllib.request.urlopen(req, timeout=20) as r:
            dados = json.loads(r.read().decode("utf-8", "replace"))
    except Exception:
        return None
    if not isinstance(dados, dict):
        return None
    pontos: list[tuple[float, float]] = []
    for f in dados.get("features", []):
        for lon, lat in f.get("geometry", {}).get("coordinates") or []:
            pontos.append((lat, lon))
    return pontos or None


def main() -> None:
    # indexa shapes por linha
    rotas = {r["route_id"]: r["route_short_name"] for r in _csv("routes")}
    shapes_da_rota: dict[str, set[str]] = {}
    for t in _csv("trips"):
        if t["shape_id"]:
            shapes_da_rota.setdefault(t["route_id"], set()).add(t["shape_id"])
    pontos_por_shape: dict[str, list[tuple[float, float]]] = {}
    for s in _csv("shapes"):
        pontos_por_shape.setdefault(s["shape_id"], []).append(
            (float(s["shape_pt_lat"]), float(s["shape_pt_lon"])))

    linhas = sorted(sigla for sigla in rotas.values() if sigla)
    print(f"linhas no feed: {len(linhas)}")

    resultados = []
    sem_geojson = []
    for i, sigla in enumerate(linhas, 1):
        oficial = geojson_semob(sigla)
        if oficial is None:
            sem_geojson.append(sigla)
            continue
        rid = next(k for k, v in rotas.items() if v == sigla)
        melhor = None
        for shape_id in sorted(shapes_da_rota.get(rid, ())):
            pts = pontos_por_shape.get(shape_id)
            if not pts:
                continue
            dists = [min(haversine_m(a, b, c, d) for c, d in pts) for a, b in oficial]
            media = sum(dists) / len(dists)
            if melhor is None or media < melhor[1]:
                melhor = (shape_id, media, sorted(dists)[len(dists) // 2],
                          sorted(dists)[int(len(dists) * 0.95)])
        if melhor:
            resultados.append((sigla, melhor))
        print(f"  [{i}/{len(linhas)}] {sigla}: "
              f"{'ok ' + melhor[0] if melhor else 'sem shape'} ", end="\r")

    print()
    resultados.sort(key=lambda x: x[1][1])
    linhas_md = [
        "# Auditoria de traçados: feed Flavos Bus vs GeoJSON oficial da SEMOB-JP",
        "",
        "Comparação automática entre `shapes.txt` do nosso feed e o endpoint público",
        "`/linhas-de-onibus/<linha>/itinerario/geojson` do site da SEMOB.",
        "",
        "Métrica: distância (metros) de cada ponto do traçado oficial ao ponto mais próximo",
        "do nosso shape; escolhemos sempre o nosso shape de menor erro médio.",
        "",
        f"- Linhas comparadas: **{len(resultados)}**",
        f"- Linhas sem GeoJSON disponível: {len(sem_geojson)}"
        + (f" ({', '.join(sem_geojson)})" if sem_geojson else ""),
        "",
        "| Linha | Nosso shape | Erro médio (m) | Mediana (m) | p95 (m) | Leitura |",
        "| --- | --- | ---: | ---: | ---: | --- |",
    ]
    for sigla, (shape_id, media, mediana, p95) in resultados:
        if media < 15:
            leitura = "excelente"
        elif media < 30:
            leitura = "bom"
        elif media < 60:
            leitura = "aceitável"
        else:
            leitura = "revisar"
        linhas_md.append(f"| {sigla} | `{shape_id}` | {media:.1f} | {mediana:.1f} | "
                         f"{p95:.1f} | {leitura} |")

    if resultados:
        medias = [r[1][1] for r in resultados]
        linhas_md += [
            "",
            "## Resumo",
            "",
            f"- Erro médio geral: **{sum(medias) / len(medias):.1f} m**",
            f"- Melhor linha: {resultados[0][0]} ({resultados[0][1][1]:.1f} m)",
            f"- Pior linha: {resultados[-1][0]} ({resultados[-1][1][1]:.1f} m)",
            f"- Linhas com erro médio < 30 m: "
            f"{sum(1 for m in medias if m < 30)}/{len(medias)}",
        ]

    destino = GTFS / "_AUDITORIA_SHAPES.md"
    destino.write_text("\n".join(linhas_md) + "\n", encoding="utf-8")
    print(f"\nrelatório: {destino}")
    if resultados:
        medias = [r[1][1] for r in resultados]
        print(f"erro médio geral: {sum(medias) / len(medias):.1f} m · "
              f"melhor {resultados[0][0]} ({resultados[0][1][1]:.1f} m) · "
              f"pior {resultados[-1][0]} ({resultados[-1][1][1]:.1f} m)")


if __name__ == "__main__":
    main()
