# Lê o report.json do gtfs-validator oficial (MobilityData, schema v8 camelCase)
# e resume severidades + códigos; SUBSTITUI a seção oficial do _RELATORIO.md.

from __future__ import annotations

import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent / ".tmp" / "gv" / "out"
RELATORIO = Path(__file__).resolve().parent.parent.parent / "data" / "gtfs" / "_RELATORIO.md"
MARCADOR = "## Resultado da validação oficial"


def main() -> None:
    dados = json.loads((PASTA / "report.json").read_text(encoding="utf-8"))
    resumo = dados.get("summary", {})
    versao = resumo.get("validatorVersion")
    data_ref = resumo.get("dateForValidation")

    totais = {"ERROR": 0, "WARNING": 0, "INFO": 0}
    linhas: list[str] = []
    for notifica in dados.get("notices", []):
        severidade = str(notifica.get("severity", "?")).upper()
        ocorrencias = int(notifica.get("totalNotices") or 0)
        totais[severidade] = totais.get(severidade, 0) + ocorrencias
        linhas.append(f"- [{severidade}] {notifica.get('code')}: {ocorrencias} ocorrência(s)")

    print(f"validatorVersion: {versao}")
    print(f"dateForValidation: {data_ref}")
    for severidade, qtd in totais.items():
        print(f"{severidade}: {qtd}")
    print("\n".join(sorted(linhas)))

    secao = [
        f"## Resultado da validação oficial (MobilityData gtfs-validator v{versao})",
        "",
        f"- data de referência: {data_ref}",
        f"- **erros: {totais['ERROR']}** · avisos: {totais['WARNING']} · infos: {totais['INFO']}",
        "",
        *sorted(linhas),
        "",
        "Publicação permitida: zero erros (doc seção 6). Warnings avaliados e tratados "
        "em `scraper/gtfs/dados.py` (timepoint teórico, direction_id desconhecido vazio, "
        "feed_contact_url) ou justificados (nomes da fonte preservados).",
        "",
    ]

    if RELATORIO.is_file():
        texto = RELATORIO.read_text(encoding="utf-8")
        if MARCADOR in texto:
            texto = texto.split(MARCADOR)[0].rstrip() + "\n"
        RELATORIO.write_text(texto + "\n" + "\n".join(secao), encoding="utf-8")
        print(f"\nseção oficial reescrita em: {RELATORIO}")


if __name__ == "__main__":
    main()
