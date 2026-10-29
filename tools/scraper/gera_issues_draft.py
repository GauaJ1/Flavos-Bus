# Item 3 — gera rascunhos de issues (um .md por linha problemática) em
# docs/issues_draft/ a partir de _AUDITORIA_SHAPES.md (erro médio >= 30 m) e
# da tabela do item 6 (docs/item6_shapes_semob.csv). RASCUNHO: nada é
# publicado sem confirmação do usuário.

from __future__ import annotations

import csv
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
AUDITORIA = RAIZ / "data" / "gtfs" / "_AUDITORIA_SHAPES.md"
ITEM6 = RAIZ / "docs" / "item6_shapes_semob.csv"
DESTINO = RAIZ / "docs" / "issues_draft"

RE_LINHA = re.compile(
    r"^\| (\S+) \| `sh-\d+` \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \| (\w[\w ]*) \|$",
    re.M,
)


def main() -> int:
    DESTINO.mkdir(parents=True, exist_ok=True)
    item6: dict[str, dict[str, str]] = {}
    if ITEM6.exists():
        with ITEM6.open(encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                item6[r["linha"]] = r

    gerados = 0
    for mo in RE_LINHA.finditer(AUDITORIA.read_text(encoding="utf-8")):
        rsn, erro, mediana, p95, leitura = (
            mo.group(1), mo.group(2), mo.group(3), mo.group(4), mo.group(5))
        if float(erro) < 30.0:
            continue  # só as fora da tolerância de 30 m da auditoria
        informacao = item6.get(rsn, {})
        partes = [
            f"# Linha {rsn}: traçado divergente do itinerário oficial SEMOB",
            "",
            f"**Erro médio** do shape do feed vs oficial: **{erro} m** "
            f"(mediana {mediana} m, p95 {p95} m) na auditoria de 2026-10-28.",
        ]
        if informacao:
            oficial = informacao.get("paradas_longe_com_tracado_oficial") or ""
            total = informacao.get("paradas_total") or ""
            if oficial and total:
                partes += [
                    "",
                    f"**Coerência com o serviço real** (item 6, 2026-10-29): com o "
                    f"traçado oficial, {oficial} de {total} paradas ficam a mais "
                    "de 100 m do traçado; com o traçado apurado do painel, "
                    "nenhuma.",
                ]
            else:
                partes += [
                    "",
                    f"**Coerência com o serviço real** (item 6, 2026-10-29): "
                    f"{informacao.get('decisao', 'sem avaliação')}.",
                ]
        partes += [
            "",
            "## Evidência",
            "",
            "- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha "
            f"{rsn}, erro médio {erro} m).",
            "- Tabela do item 6: `docs/item6_shapes_semob.csv` "
            "(paradas longe do traçado oficial).",
            "- Geojson oficial congelado: `data/raw/semob_geojson/"
            f"{rsn}.json` (data de atualização do itinerário no campo "
            "ATUALIZACA, preservada nas notas do feed).",
        ]
        if leitura.strip().lower().startswith("revis"):
            partes += [
                "",
                "## Hipótese (a confirmar em campo)",
                "",
                "Duas leituras possíveis: (a) o traçado oficial da SEMOB está "
                "desatualizado em relação ao serviço real — mais provável, dada "
                "a evidência do item 6 de paradas longe do oficial; ou (b) o "
                "roteamento do painel tem trecho errôneo. Ação sugerida: "
                "reportar à SEMOB/operadora com a comparação lado a lado e "
                "manter o traçado apurado do painel até resolução.",
            ]
        destino_issue = DESTINO / f"{rsn}-tracado-divergente.md"
        destino_issue.write_text("\n".join(partes) + "\n", encoding="utf-8")
        gerados += 1

    readme = DESTINO / "_LEIA-ME.md"
    readme.write_text(
        "# Issues em RASCUNHO (não publicar sem confirmação)\n\n"
        "Uma issue por linha com erro médio >= 30 m na auditoria de "
        f"2026-10-28: {gerados} arquivos. Cada issue traz o erro do feed vs "
        "oficial, a contagem de paradas que o oficial deixaria longe (item 6) "
        "e a hipótese dominante (oficial desatualizado). Candidatas a issues "
        "do repositório; a da SEMOB vai no ofício (docs/OFICIO_SEMOB...).\n",
        encoding="utf-8")
    print(f"issues rascunhadas: {gerados} em {DESTINO}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
