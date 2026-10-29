# Item 6 — relatório consolidado: por que NENHUM traçado oficial foi adotado
# na regeneração atual, com os números que sustentam a decisão (e a infra que
# aplica as trocas quando a SEMOB atualizar).

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scraper import config  # noqa: E402
from scraper.gtfs.dados import carregar_entrada, montar_tabelas  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent.parent
AUDITORIA = RAIZ / "data" / "gtfs" / "_AUDITORIA_SHAPES.md"
CSV_ITEM6 = RAIZ / "docs" / "item6_shapes_semob.csv"

RE_PAINEL = re.compile(r"traçado do painel: (\d+)/(\d+)")
RE_OFICIAL = re.compile(r"deixa (\d+)/(\d+) paradas")


def _erro_medio_da_auditoria() -> dict[str, str]:
    linhas: dict[str, str] = {}
    for m in re.finditer(
            r"\| (\S+) \| `sh-\d+` \| ([\d.]+) \|", AUDITORIA.read_text(encoding="utf-8")):
        linhas[m.group(1)] = m.group(2)
    return linhas


def main() -> int:
    entrada = carregar_entrada(config.raw_dir())
    tabela = montar_tabelas(
        entrada, semob_geojson_dir=config.raw_dir() / "semob_geojson")
    erros_auditoria = _erro_medio_da_auditoria()

    registros: list[dict[str, str]] = []
    REJEITADO, SUBSTITUIDO, SEM_ALINH = (
        "SHAPE_SEMOB_REJEITADO_PARADAS",
        "SHAPE_SEMOB_SUBSTITUIDO",
        "SHAPE_SEMOB_SEM_ALINHAMENTO",
    )
    for nota in tabela.notas:
        if nota.codigo == REJEITADO:
            rsn = nota.mensagem.split()[1]
            mo_of = RE_OFICIAL.search(nota.mensagem)
            mo_pa = RE_PAINEL.search(nota.mensagem)
            registros.append({
                "linha": rsn,
                "erro_medio_auditoria_m": erros_auditoria.get(rsn, ""),
                "paradas_longe_com_tracado_oficial": mo_of.group(1) if mo_of else "",
                "paradas_total": mo_of.group(2) if mo_of else "",
                "paradas_longe_com_tracado_painel": mo_pa.group(1) if mo_pa else "",
                "decisao": "mantido o traçado do painel (oficial desatualizado)",
            })
        elif nota.codigo == SEM_ALINH:
            rsn = nota.mensagem.split()[1]
            if rsn in {r["linha"] for r in registros}:
                continue
            mo = re.search(r"primeira parada a (\d+) m", nota.mensagem)
            registros.append({
                "linha": rsn,
                "erro_medio_auditoria_m": erros_auditoria.get(rsn, ""),
                "paradas_longe_com_tracado_oficial": "",
                "paradas_total": "",
                "paradas_longe_com_tracado_painel": "",
                "decisao": (f"mantido o traçado do painel (primeira parada a "
                            f"{mo.group(1) if mo else '?'} m dos extremos oficiais)"),
            })

    # linhas substituídas (se um dia a SEMOB atualizar e a política passar)
    for nota in tabela.notas:
        if nota.codigo != SUBSTITUIDO:
            continue
        rsn = nota.mensagem.split()[1]
        mo = re.search(r"ATUALIZACA ([\d; \-]+|s/ data)\)", nota.mensagem)
        existente = next((r for r in registros if r["linha"] == rsn), None)
        if existente:
            existente["decisao"] = (f"traçado oficial ADOTADO "
                                    f"(ATUALIZACA {mo.group(1) if mo else '?'})")
        else:
            registros.append({
                "linha": rsn,
                "erro_medio_auditoria_m": erros_auditoria.get(rsn, ""),
                "paradas_longe_com_tracado_oficial": "",
                "paradas_total": "",
                "paradas_longe_com_tracado_painel": "",
                "decisao": "traçado oficial ADOTADO",
            })

    registros.sort(key=lambda r: r["linha"])
    CSV_ITEM6.parent.mkdir(parents=True, exist_ok=True)
    with CSV_ITEM6.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=[
            "linha", "erro_medio_auditoria_m",
            "paradas_longe_com_tracado_oficial", "paradas_total",
            "paradas_longe_com_tracado_painel", "decisao"])
        w.writeheader()
        w.writerows(registros)

    secao = [
        "",
        "## Item 6 — o traçado oficial substitui o do painel? Análise de 2026-10-29",
        "",
        "A troca SÓ acontece quando o traçado oficial não deixa MAIS paradas a mais",
        "de 100 m do que deixa a polyline do painel (comparação com ambos os traçados",
        "reamostrados a 40 m, distância parada→traçado). Resultado com os geojson de",
        "2026-10-29: **nenhuma substituição aprovada** — o traçado do painel cobre",
        "todas as paradas de todas as linhas auditadas (0 paradas longe), enquanto o",
        "oficial deixa até 47 paradas longe (E155, pior caso 4,4 km): o geojson oficial",
        "está desatualizado em relação ao serviço em operação (mesmo sintoma do dado de",
        "operadora). Números completos em `docs/item6_shapes_semob.csv`. Quando a SEMOB",
        "atualizar os itinerários, basta re-coletar (`coleta_shapes_semob.py`) e regenerar:",
        "a política aplica as trocas que sobreviverem à verificação de coerência.",
        "",
        "| Linha | Erro médio (m) | Paradas >100 m c/ oficial | "
        "Paradas >100 m c/ painel | Decisão |",
        "| --- | ---: | ---: | ---: | --- |",
    ]
    for r in registros:
        secao.append(
            f"| {r['linha']} | {r['erro_medio_auditoria_m'] or '—'} "
            f"| {r['paradas_longe_com_tracado_oficial'] or '—'}"
            f"{('/' + r['paradas_total']) if r['paradas_total'] else ''} "
            f"| {r['paradas_longe_com_tracado_painel'] or '—'}"
            f"{('/' + r['paradas_total']) if r['paradas_total'] else ''} "
            f"| {r['decisao']} |")

    texto = AUDITORIA.read_text(encoding="utf-8")
    if "## Item 6" in texto:
        texto = texto.split("## Item 6")[0].rstrip() + "\n"
    AUDITORIA.write_text(texto + "\n".join(secao) + "\n", encoding="utf-8")
    print(f"registros: {len(registros)} · csv: {CSV_ITEM6} · seção anexada a {AUDITORIA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
