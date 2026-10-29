# Prova do decoder de polyline: vetor clássico + shape REAL da 0510 cruzado
# com a primeira parada real da viagem (lat/lon do painel).

from __future__ import annotations

import json
import math
from pathlib import Path

from scraper.cryptojs import decifrar_objeto
from scraper.gtfs.polyline import decodificar_polyline
from scraper.sources.bus2 import FRASE_PUBLICA

RAW = Path(__file__).resolve().parent.parent.parent / "data" / "raw"


def distancia_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6_371_000 * math.asin(math.sqrt(h))


def main() -> None:
    vetores = [
        ("??", [(0.0, 0.0)]),  # dois varints = 0: um par (0,0)
        ("", []),
    ]
    for texto, esperado in vetores:
        obtido = decodificar_polyline(texto)
        print(f"vetor {texto!r}: ok={obtido == esperado} -> {obtido}")

    envelope = json.loads((RAW / "linha_0510" / "timetable.json").read_text(encoding="utf-8"))
    viagens = decifrar_objeto(str(envelope["data"]), FRASE_PUBLICA)
    viagem = next(v for v in viagens if v["dir"] == 1)
    pontos = decodificar_polyline(str(viagem["sp"]))
    primeira = viagem["stops"][0]
    parada = (float(primeira["lat"]), float(primeira["lon"]))
    d = distancia_m(pontos[0], parada)
    print(f"\n0510 dir=1: {len(pontos)} pontos decodificados")
    print(f"  1º ponto do shape: {pontos[0]}")
    print(f"  1ª parada (sid {primeira['sid']}): {parada}")
    print(f"  distância entre eles: {d:.1f} m (deve ser pequeno)")
    print(f"  último ponto: {pontos[-1]} | última parada: {float(viagem['stops'][-1]['lon'])}")


if __name__ == "__main__":
    main()
