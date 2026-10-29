# Confere o que a coleta real deixou em data/raw/: tamanhos, manifest e o
# conteúdo decifrável (lista geral + timetable da 0510) — sem salvar nada novo.

from __future__ import annotations

import json
from pathlib import Path

from scraper.cryptojs import decifrar_objeto
from scraper.sources.bus2 import FRASE_PUBLICA

RAW = Path(__file__).resolve().parent.parent.parent / "data" / "raw"


def main() -> None:
    print("== arquivos em data/raw:")
    for caminho in sorted(RAW.rglob("*")):
        if caminho.is_file():
            print(f"  {caminho.relative_to(RAW).as_posix()}  ({caminho.stat().st_size} bytes)")
    lista = json.loads((RAW / "lista_geral.json").read_text(encoding="utf-8"))
    rotas = decifrar_objeto(str(lista["data"]), FRASE_PUBLICA)
    print(f"\nlista_geral.json: {len(rotas)} linhas decifradas")
    for rota in rotas:
        if rota["rsn"] in ("0510", "0507"):
            print(f"  {rota['fmt']} (rid={rota['rid']})")
    tim = json.loads((RAW / "linha_0510" / "timetable.json").read_text(encoding="utf-8"))
    viagens = decifrar_objeto(str(tim["data"]), FRASE_PUBLICA)
    print(f"\nlinha_0510/timetable.json: {len(viagens)} viagens decifradas")
    for viagem in viagens:
        paradas = viagem.get("stops") or []
        servicos = viagem.get("services") or []
        primeira, ultima = (paradas[0]["sn"], paradas[-1]["sn"]) if paradas else ("?", "?")
        print(f"  tid={viagem['tid']} dir={viagem['dir']} stops={len(paradas)}")
        print(f"    de '{primeira}' até '{ultima}'")
        print(f"    serviços: {[s['sn'] for s in servicos]}")


if __name__ == "__main__":
    main()
