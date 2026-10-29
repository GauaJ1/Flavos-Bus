# Item 6 — congela os GeoJSONs oficiais das linhas cujo shape do painel ficou
# fora da tolerância na auditoria (erro médio >= 30 m; ver _AUDITORIA_SHAPES.md).
#
# Salva o geojson COMPLETO (traçado por sentido) em data/raw/semob_geojson/ —
# pasta gitignored; o gerador usa esses arquivos na regeneração do feed.
# Re-executável: sempre re-baixa (fonte viva) e regrava.

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
DESTINO = RAIZ / "data" / "raw" / "semob_geojson"
BASE = "https://servicos.semobjp.pb.gov.br"
CAB = {"User-Agent": "FlavosBus-DataCollector/0.1"}

# Auditoria de 2026-10-28 (_AUDITORIA_SHAPES.md): 23 linhas com erro médio >= 30 m.
# A 0509 (29.4 m) NÃO entra: fica como regressão com o traçado do painel.
ALVO = (
    "0500", "1500", "5210", "1519", "E155", "E551", "0512", "0503", "0507",
    "0307", "1510", "5110", "0522", "E901", "0106", "0502", "5100", "0517",
    "0115", "0304", "0109", "I004", "0520",
)


def baixar(sigla: str) -> dict | None:
    url = f"{BASE}/linhas-de-onibus/{sigla}/itinerario/geojson"
    try:
        req = urllib.request.Request(url, headers=CAB)
        with urllib.request.urlopen(req, timeout=25) as r:
            dados = json.loads(r.read().decode("utf-8", "replace"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        return None
    if not (isinstance(dados, dict) and dados.get("features")):
        return None
    return dados


def main() -> int:
    DESTINO.mkdir(parents=True, exist_ok=True)
    ok, falhos, sem_sentido = [], [], []
    for sigla in ALVO:
        dados = baixar(sigla)
        if dados is None:
            falhos.append(sigla)
            print(f"{sigla}: SEM geojson")
            time.sleep(0.15)
            continue
        sentidos = {
            (f.get("properties") or {}).get("ITINERARIO")
            for f in dados["features"]
        }
        caminho = DESTINO / f"{sigla}.json"
        caminho.write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")
        pontos = sum(
            len(((f.get("geometry") or {}).get("coordinates")) or [])
            for f in dados["features"]
        )
        ok.append(sigla)
        if not any(s in ("IDA", "VOLTA") for s in sentidos if s):
            sem_sentido.append(sigla)
        print(f"{sigla}: salvo ({len(dados['features'])} features, "
              f"{pontos} pontos, sentidos={sorted(s or '?' for s in sentidos)})")
        time.sleep(0.15)
    print(f"\ncongelados: {len(ok)}/{len(ALVO)} · falhos: {falhos or 'nenhum'} · "
          f"sem IDA/VOLTA: {sem_sentido or 'nenhum'}")
    return 0 if len(ok) >= len(ALVO) - 2 else 2  # tolerância de até 2 falhas de rede


if __name__ == "__main__":
    raise SystemExit(main())
