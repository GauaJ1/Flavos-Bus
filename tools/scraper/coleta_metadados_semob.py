# Coleta metadados oficiais por linha no site da SEMOB-JP:
#   /linhas-de-onibus/<sigla>/itinerario/geojson
# Campos das properties: EMPRESA, TIPO, EXTENSAO (km), SEGEO, ATUALIZACA,
# ITINERARIO (IDA/VOLTA), CODIGO_LIN.
# Saída: data/gtfs/_SEMOB_METADADOS.json (bruto, com proveniência).
# NÃO altera o feed — só coleta e resume.

from __future__ import annotations

import csv
import json
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
GTFS = RAIZ / "data" / "gtfs"
BASE = "https://servicos.semobjp.pb.gov.br"
CAB = {"User-Agent": "FlavosBus-DataCollector/0.1 (contato: flavosbus)",
       "Accept": "application/json"}
SAIDA = GTFS / "_SEMOB_METADADOS.json"


def pegar_geojson(sigla: str) -> dict | None:
    url = f"{BASE}/linhas-de-onibus/{sigla}/itinerario/geojson"
    try:
        req = urllib.request.Request(url, headers=CAB)
        with urllib.request.urlopen(req, timeout=25) as r:
            dados = json.loads(r.read().decode("utf-8", "replace"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError):
        return None
    return dados if isinstance(dados, dict) else None


def linhas_do_feed() -> list[tuple[str, str]]:
    """(route_id, short_name) do nosso feed."""
    with (GTFS / "routes.txt").open(encoding="utf-8", newline="") as f:
        return [(r["route_id"], r["route_short_name"]) for r in csv.DictReader(f)]


def main() -> None:
    resultado: dict[str, dict] = {}
    faltando: list[str] = []

    from scraper.gtfs.operadoras import ALIAS_SIGLA  # noqa: PLC0415

    for route_id, sigla in linhas_do_feed():
        # 1001 no painel = "1001M - BAIRRO DAS INDUSTRIAS/MANDACARU" na SEMOB;
        # o alias só é usado quando a sigla do painel não tem geojson.
        dados = pegar_geojson(sigla) or pegar_geojson(ALIAS_SIGLA.get(sigla, ""))
        if not dados:
            faltando.append(sigla)
            continue
        sentidos: dict[str, dict] = {}
        for feature in dados.get("features", []):
            props = feature.get("properties") or {}
            sentido = props.get("ITINERARIO")
            if not sentido or sentido in sentidos:
                continue
            sentidos[sentido] = {
                "empresa": props.get("EMPRESA"),
                "tipo": props.get("TIPO"),
                "extensao_km": props.get("EXTENSAO"),
                "segeo": props.get("SEGEO"),
                "atualizacao": props.get("ATUALIZACA"),
                "nome": props.get("LINHA"),
                "codigo": props.get("CODIGO_LIN"),
                "n_pontos": len((feature.get("geometry") or {}).get("coordinates") or []),
            }
        if not sentidos:
            faltando.append(sigla)
            continue
        resultado[sigla] = {"route_id": route_id, "sentidos": sentidos}
        time.sleep(0.15)  # educado com o servidor público

    SAIDA.write_text(
        json.dumps({
            "fonte": "https://servicos.semobjp.pb.gov.br/linhas-de-onibus/",
            "endpoint": "/linhas-de-onibus/<linha>/itinerario/geojson",
            "coletado_em": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "linhas": resultado,
            "sem_geojson": faltando,
        }, ensure_ascii=False, indent=1),
        encoding="utf-8")

    # ---- resumo ----
    print(f"linhas no feed: {len(resultado) + len(faltando)} · "
          f"com geojson: {len(resultado)} · sem: {len(faltando)}")
    if faltando:
        print(f"sem geojson: {', '.join(faltando)}")

    empresas: dict[str, list[str]] = defaultdict(list)
    tipos: Counter[str] = Counter()
    for sigla, info in resultado.items():
        for sentido, props in info["sentidos"].items():
            if props["empresa"]:
                empresas[props["empresa"]].append(sigla)
            if props["tipo"]:
                tipos[props["tipo"]] += 1

    print(f"\n== OPERADORAS ({len(empresas)}) ==")
    for empresa, linhas in sorted(empresas.items(), key=lambda x: -len(set(x[1]))):
        unicas = sorted(set(linhas))
        print(f"  {empresa:<24} {len(unicas):>3} linha(s): "
              f"{', '.join(unicas[:12])}{' ...' if len(unicas) > 12 else ''}")

    print(f"\n== TIPOS ({len(tipos)}) ==")
    for tipo, qtd in tipos.most_common():
        print(f"  {tipo:<20} {qtd}")

    # inconsistência: linha com empresa diferente entre IDA e VOLTA
    print("\n== consistência ENTRE SENTIDOS ==")
    problemas = 0
    for sigla, info in resultado.items():
        emp = {p["empresa"] for p in info["sentidos"].values() if p["empresa"]}
        if len(emp) > 1:
            print(f"  {sigla}: emp. diferente -> {emp}")
            problemas += 1
    print(f"  linhas com divergência de empresa: {problemas}")

    datas = Counter(p["atualizacao"][:10] for info in resultado.values()
                    for p in info["sentidos"].values() if p["atualizacao"])
    print("\n== ATUALIZACA (top) ==")
    for data, qtd in datas.most_common(6):
        print(f"  {data}: {qtd}")


if __name__ == "__main__":
    main()
