# Estatísticas do espólio coletado: varre data/raw/linha_*/timetable.json,
# decifra cada um e soma viagens/paradas/serviços — relatório honesto, sem
# inventar nada. Marca linhas com timetable vazio ou sem coordenadas.

from __future__ import annotations

import json
from pathlib import Path

from scraper.cryptojs import decifrar_objeto
from scraper.sources.bus2 import FRASE_PUBLICA

RAW = Path(__file__).resolve().parent.parent.parent / "data" / "raw"


def main() -> None:
    pastas = sorted(p for p in RAW.iterdir() if p.is_dir() and p.name.startswith("linha_"))
    total_linhas = 0
    total_viagens = 0
    pares_unicos: set[tuple[str, str]] = set()
    servicos_nomes: set[str] = set()
    sem_viagens: list[str] = []
    sem_coords: list[str] = []
    detalhes: list[str] = []
    for pasta in pastas:
        arquivo = pasta / "timetable.json"
        if not arquivo.is_file():
            continue
        total_linhas += 1
        rsn = pasta.name.removeprefix("linha_")
        envelope = json.loads(arquivo.read_text(encoding="utf-8"))
        viagens = decifrar_objeto(str(envelope["data"]), FRASE_PUBLICA)
        if not viagens:
            sem_viagens.append(rsn)
            detalhes.append(f"{rsn}: SEM viagens no timetable")
            continue
        total_viagens += len(viagens)
        coordenadas_ok = False
        for viagem in viagens:
            for parada in viagem.get("stops") or []:
                sid = str(parada.get("sid"))
                pares_unicos.add((sid, str(parada.get("sn", ""))))
                lat, lon = str(parada.get("lat", "")), str(parada.get("lon", ""))
                if lat not in ("", "0", "None") and lon not in ("", "0", "None"):
                    coordenadas_ok = True
            for servico in viagem.get("services") or []:
                servicos_nomes.add(str(servico.get("sn", "?")))
        if not coordenadas_ok:
            sem_coords.append(rsn)
            detalhes.append(f"{rsn}: viagens sem coordenadas de parada")
    unique_por_id = {sid for sid, _ in pares_unicos}
    print(f"linhas com timetable: {total_linhas}")
    print(f"viagens (trips): {total_viagens}")
    print(f"paradas únicas (sid distintos): {len(unique_por_id)}")
    print(f"nomes de serviço distintos: {len(servicos_nomes)} -> {sorted(servicos_nomes)[:10]}")
    print(f"linhas SEM viagens: {len(sem_viagens)}{' (' + ', '.join(sem_viagens) + ')' if sem_viagens else ''}")
    print(f"linhas sem ANY coordenada: {len(sem_coords)}")
    for linha in detalhes:
        print(f"  avisos: {linha}")
    # tamanho total do espólio
    total_bytes = sum(
        f.stat().st_size for f in RAW.rglob("*") if f.is_file() and f.name != "_manifest.json"
    )
    print(f"tamanho bruto coletado (sem manifest): {total_bytes / 1024:.0f} KB")


if __name__ == "__main__":
    main()
