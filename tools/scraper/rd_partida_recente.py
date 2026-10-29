# Partida recente no quadro do feed para 0507/0510/0104 (lembrete 07:20):
# serviço de hoje (dia útil), partidas do 1º stop_time de cada trip, janela e
# a mais recente até o momento — para provar que há serviço em circulação
# mesmo com get-route-vehicles vazio. ZERO requests (lê data/gtfs).

from __future__ import annotations

import csv
from datetime import datetime, timedelta
from pathlib import Path

GTFS = Path(__file__).resolve().parent.parent.parent / "data" / "gtfs"
ROTAS = ("0507", "0510", "0104")


def _rows(nome: str) -> list[dict[str, str]]:
    with (GTFS / f"{nome}.txt").open(encoding="utf-8", newline="") as f:
        return [dict(r) for r in csv.DictReader(f)]


def main() -> int:
    agora = datetime.now()
    limite = agora - timedelta(minutes=30)
    rotas = {r["route_id"]: r["route_short_name"] for r in _rows("routes")}
    servicos_hoje: set[str] = set()
    for cal in _rows("calendar"):
        if (cal["thursday"] == "1"
                and cal["start_date"] <= agora.strftime("%Y%m%d") <= cal["end_date"]):
            servicos_hoje.add(cal["service_id"])
    tripas_pelo_servico = {
        t["trip_id"]: t["route_id"]
        for t in _rows("trips") if t["service_id"] in servicos_hoje
    }
    primeira_partida: dict[str, str] = {}
    with (GTFS / "stop_times.txt").open(encoding="utf-8", newline="") as f:
        for st in csv.DictReader(f):
            trip_id = st["trip_id"]
            if trip_id in tripas_pelo_servico and trip_id not in primeira_partida:
                primeira_partida[trip_id] = st["departure_time"]

    por_rota: dict[str, list[int]] = {r: [] for r in ROTAS}
    usados: set[str] = set()
    for trip_id, route_id in sorted(tripas_pelo_servico.items()):
        rsn = rotas.get(route_id, "?")
        if rsn in por_rota and trip_id not in usados:
            usados.add(trip_id)
            hh, mm, _ = primeira_partida[trip_id].split(":")
            por_rota[rsn].append(int(hh) * 60 + int(mm))

    janela_recente = False
    for rsn in ROTAS:
        partidas = sorted(por_rota[rsn])
        if not partidas:
            print(f"{rsn}: nenhum trip no serviço de hoje (anomalia!)")
            continue
        ultimas = [p for p in partidas
                   if p <= agora.hour * 60 + agora.minute]
        mais_recente = ultimas[-1] if ultimas else None
        texto_recente = (f"{mais_recente // 60:02d}:{mais_recente % 60:02d}"
                         if mais_recente is not None else "—")
        circulando = bool(mais_recente) and (
            agora.hour * 60 + agora.minute - mais_recente) <= 30
        janela_recente = janela_recente or circulando
        print(f"{rsn}: {len(partidas)} partidas hoje, janela "
              f"{partidas[0] // 60:02d}:{partidas[0] % 60:02d}-"
              f"{partidas[-1] // 60:02d}:{partidas[-1] % 60:02d}, "
              f"ultima partida ate agora: {texto_recente} "
              f"({'CIRCULANDO (partida há <=30 min)' if circulando else 'sem prova de circulação agora'})")
    print("\nconclusão: RT público vazio + partidas recentes "
          + ("CONFIRMADAS -> prova de RT desativado"
             if janela_recente else "não confirmadas nesta hora"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
