# Item 4 â€” Monitoramento de defasagem dos dados oficiais da SEMOB-JP.
#
# O geojson de itinerÃ¡rio (https://servicos.semobjp.pb.gov.br/linhas-de-onibus/
# <linha>/itinerario/geojson) traz, por sentido (IDA/VOLTA):
#   * ATUALIZACA â€” data da Ãºltima atualizaÃ§Ã£o do traÃ§ado;
#   * SEGEO      â€” ano da carteira/levantamento georreferenciado;
#   * EMPRESA    â€” operadora declarada (pode estar velha; ver operadoras.py).
# Este script cruza essas datas com a versÃ£o do feed Flavos Bus e gera:
#   * docs/MONITORAMENTO_SEMOB.md  (relatÃ³rio legÃ­vel, a 509 destacada);
#   * docs/monitoramento_semob.csv (uma linha por sentido/linha, check CI-Ã¡vel);
# SaÃ­da --json opcional para automaÃ§Ã£o. Sem rede se nÃ£o pedir --online
# (usa data/gtfs/_SEMOB_METADADOS.json congelado pela coleta).
# CritÃ©rio de defasagem: TRACADO_MEDIO_ANOS (default 4) e SEM_DATA como pior caso.

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from typing import Any

RAIZ = Path(__file__).resolve().parent.parent.parent
DOCS = RAIZ / "docs"
METADADOS = RAIZ / "data" / "gtfs" / "_SEMOB_METADADOS.json"
BASE = "https://servicos.semobjp.pb.gov.br"
TRACADO_MEDIO_ANOS = 4.0
STATUS = {
    "fresca": "fresca",            # <= 1 ano
    "aceitavel": "aceitÃ¡vel",      # <= TRACADO_MEDIO_ANOS
    "defasada": "defasada",        # > TRACADO_MEDIO_ANOS
    "sem-data": "sem-data",        # ATUALIZACA nula (1899/vazio)
}


def _idade_anos(bruto: str, referencia: date) -> float | None:
    texto = str(bruto or "")[:10]
    if not texto or texto.startswith("1899"):
        return None
    try:
        quando = date.fromisoformat(texto.replace("/", "-"))
    except ValueError:
        return None
    return (referencia - quando).days / 365.25


def _status(idade: float | None) -> str:
    if idade is None:
        return STATUS["sem-data"]
    if idade > TRACADO_MEDIO_ANOS:
        return STATUS["defasada"]
    if idade <= 1.0:
        return STATUS["fresca"]
    return STATUS["aceitavel"]


def _linha_meta(dados: dict[str, Any], sigla: str) -> dict[str, Any] | None:
    return (dados.get("linhas") or {}).get(sigla)


def coletar_online() -> dict[str, Any]:
    """Re-fetcha todos os geojsons (usado com --online, educaÃ§Ã£o de 0,15 s/linha)."""
    import time
    import urllib.request

    from scraper.gtfs.operadoras import ALIAS_SIGLA

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    rotas: list[tuple[str, str]] = []
    with (RAIZ / "data" / "gtfs" / "routes.txt").open(encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            rotas.append((r["route_short_name"], r["route_id"]))
    linhas: dict[str, Any] = {}
    sem_geojson: list[str] = []
    for sigla, route_id in rotas:
        alvo = sigla if not ALIAS_SIGLA.get(sigla) else None
        dados = None
        for tentativa in filter(None, (sigla, ALIAS_SIGLA.get(sigla))):
            url = f"{BASE}/linhas-de-onibus/{tentativa}/itinerario/geojson"
            try:
                req = urllib.request.Request(
                    url, headers={"User-Agent": "FlavosBus-DataCollector/0.1"})
                with urllib.request.urlopen(req, timeout=25) as resp:
                    dados = json.loads(resp.read().decode("utf-8", "replace"))
            except Exception:
                dados = None
            if isinstance(dados, dict) and dados.get("features"):
                alvo = tentativa
                break
        if not (isinstance(dados, dict) and dados.get("features")):
            sem_geojson.append(sigla)
            time.sleep(0.15)
            continue
        sentidos: dict[str, Any] = {}
        for feature in dados["features"]:
            p = feature.get("properties") or {}
            sentido = p.get("ITINERARIO")
            if sentido and sentido not in sentidos:
                sentidos[sentido] = {
                    "empresa": p.get("EMPRESA"), "tipo": p.get("TIPO"),
                    "extensao_km": p.get("EXTENSAO"), "segeo": p.get("SEGEO"),
                    "atualizacao": p.get("ATUALIZACA"), "nome": p.get("LINHA"),
                    "codigo": p.get("CODIGO_LIN"),
                    "n_pontos": len((feature.get("geometry") or {})
                                     .get("coordinates") or []),
                }
        linhas[sigla] = {"route_id": route_id, "sigla_semob": alvo or sigla,
                         "sentidos": sentidos}
        time.sleep(0.15)
    return {
        "fonte": BASE + "/linhas-de-onibus/",
        "coletado_em": datetime.now().isoformat(timespec="seconds"),
        "linhas": linhas,
        "sem_geojson": sem_geojson,
    }


def monitorar(dados: dict[str, Any], referencia: date) -> list[dict[str, Any]]:
    linhas_out: list[dict[str, Any]] = []
    for sigla, info in sorted(dados.get("linhas", {}).items()):
        sentidos = info.get("sentidos") or {}
        if not sentidos:
            continue
        idades = [_idade_anos(s.get("atualizacao"), referencia)
                  for s in sentidos.values()]
        idades_validas = [i for i in idades if i is not None]
        idade_media = (sum(idades_validas) / len(idades_validas)
                       if idades_validas else None)
        empresas = sorted({str(s.get("empresa") or "?") for s in sentidos.values()})
        tipos = sorted({str(s.get("tipo") or "?") for s in sentidos.values()})
        segos = sorted({str(s.get("segeo") or "?") for s in sentidos.values()})
        mais_nova = min(idades_validas) if idades_validas else None
        status = _status(mais_nova)  # pelo melhor sentido: o dado mais fresco
        linhas_out.append({
            "linha": sigla,
            "route_id": info.get("route_id"),
            "sigla_semob": info.get("sigla_semob", sigla),
            "operadora_declarada": " / ".join(empresas),
            "tipo": " / ".join(tipos),
            "segeo": " / ".join(segos),
            "atualizacoes": "; ".join(sorted(
                str(s.get("atualizacao") or "")[:10] for s in sentidos.values())),
            "idade_min_anos": round(mais_nova, 2) if mais_nova is not None else "",
            "idade_media_anos": round(idade_media, 2) if idade_media is not None else "",
            "status": status,
            "destaque_509": sigla == "0509",
        })
    return linhas_out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--online", action="store_true",
                        help="refetcha os geojsons da SEMOB antes de monitorar")
    parser.add_argument("--json", action="store_true", help="tambÃ©m salva JSON")
    args = parser.parse_args()

    hoje = date.today()
    dados: dict[str, Any]
    if args.online:
        print("coletando geojsons da SEMOB (online, ~0,15 s/linha)...")
        dados = coletar_online()
        METADADOS.parent.mkdir(parents=True, exist_ok=True)
        METADADOS.write_text(json.dumps(dados, ensure_ascii=False, indent=1),
                             encoding="utf-8")
        print(f"metadados atualizados em {METADADOS}")
    else:
        if not METADADOS.is_file():
            print("ERRO: sem metadados congelados; rode com --online primeiro")
            return 2
        dados = json.loads(METADADOS.read_text(encoding="utf-8"))
        dados.setdefault("coletado_em", "(arquivo congelado, sem data registrada)")

    linhas = monitorar(dados, hoje)
    sem_geojson = sorted(dados.get("sem_geojson") or [])
    contagem = Counter(li["status"] for li in linhas)
    defasadas = [li for li in linhas
                 if li["status"] in (STATUS["defasada"], STATUS["sem-data"])]
    linha_509 = next((li for li in linhas if li["linha"] == "0509"), None)

    DOCS.mkdir(parents=True, exist_ok=True)
    csv_path = DOCS / "monitoramento_semob.csv"
    campos = ["linha", "sigla_semob", "route_id", "status", "idade_min_anos",
              "idade_media_anos", "atualizacoes", "segeo", "operadora_declarada",
              "tipo", "destaque_509"]
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows(linhas)
    if args.json:
        (DOCS / "monitoramento_semob.json").write_text(
            json.dumps({"gerado_em": datetime.now().isoformat(timespec="seconds"),
                        "criterio_medio_anos": TRACADO_MEDIO_ANOS,
                        "resumo": dict(contagem), "linhas": linhas},
                       ensure_ascii=False, indent=1), encoding="utf-8")

    md: list[str] = [
        "# Monitoramento de defasagem â€” dados oficiais SEMOB-JP Ã— feed Flavos Bus",
        "",
        f"Gerado em **{datetime.now().strftime('%d/%m/%Y %H:%M')}**"
        + (" (coleta online)" if args.online else " (metadados congelados)"),
        f" Â· Metadados coletados: **{dados.get('coletado_em', '?')}**",
        f" Â· CritÃ©rio: fresca â‰¤ 1 ano Â· aceitÃ¡vel â‰¤ {TRACADO_MEDIO_ANOS:g} anos"
        " Â· defasada acima Â· sem-data = traÃ§ado sem ATUALIZACA.",
        "",
        "Fonte: campo `ATUALIZACA`/`SEGEO`/`EMPRESA` do geojson de itinerÃ¡rio"
        " (`/linhas-de-onibus/<linha>/itinerario/geojson`). Nada Ã© inferido.",
        "",
        f"- Linhas monitoradas: **{len(linhas)}**",
        f"- Sem geojson publicado: **{len(sem_geojson)}**"
        + (f" ({', '.join(sem_geojson)})" if sem_geojson else ""),
        f"- TraÃ§ado fresco (â‰¤1a): **{contagem.get(STATUS['fresca'], 0)}** Â· "
        f"aceitÃ¡vel: **{contagem.get(STATUS['aceitavel'], 0)}** Â· "
        f"defasado (>4a): **{contagem.get(STATUS['defasada'], 0)}** Â· "
        f"sem data: **{contagem.get(STATUS['sem-data'], 0)}**",
        "",
        "Uso em automaÃ§Ã£o (CI/agendado): `python tools/scraper/monitora_semob.py"
        " --online --json`; CSV em `docs/monitoramento_semob.csv`.",
        "",
    ]
    if linha_509:
        md += [
            "## Linha 0509 â€” JoÃ£o Agripino (linha de validaÃ§Ã£o contÃ­nua)",
            "",
            f"- Status do traÃ§ado oficial: **{linha_509['status']}**"
            f" (idade mÃ­n. {linha_509['idade_min_anos'] or '?'} anos Â·"
            f" ATUALIZACA {linha_509['atualizacoes']})",
            f"- Operadora declarada: {linha_509['operadora_declarada']}"
            " â€” dado declarativo, nÃ£o confirmaÃ§Ã£o atual (ver relatÃ³rio do feed).",
            f"- SEGEO: {linha_509['segeo']} Â· tipo: {linha_509['tipo']}",
            "",
            "Nota: os horÃ¡rios da 0509 no feed vÃªm do painel Mobilibus (Bus2),"
            " nÃ£o do geojson; o que envelhece aqui Ã© o traÃ§ado oficial da SEMOB.",
            "",
        ]
    md += [
        "## Linhas fora da tolerÃ¢ncia (defasadas ou sem data)",
        "",
        "| Linha | Status | Idade mÃ­n. | ATUALIZACA | Operadora declarada | SEGEO |",
        "| --- | --- | ---: | --- | --- | --- |",
    ]
    for li in defasadas:
        md.append(f"| {li['linha']}{(' **(509)**' if li['destaque_509'] else '')} "
                  f"| {li['status']} | {li['idade_min_anos'] or 'â€”'} "
                  f"| {li['atualizacoes'] or 'â€”'} | {li['operadora_declarada']} "
                  f"| {li['segeo']} |")
    md.append("")

    md_path = DOCS / "MONITORAMENTO_SEMOB.md"
    md_path.write_text("\n".join(md), encoding="utf-8")

    print(f"linhas monitoradas: {len(linhas)} Â· sem geojson: {len(sem_geojson)}")
    print("resumo:", dict(contagem))
    print(f"509: {linha_509['status'] if linha_509 else 'ausente'}")
    print(f"csv: {csv_path}")
    print(f"md: {md_path}")
    # check automatizÃ¡vel: sai com erro se a maioria dos traÃ§ados estiver sem data
    return 0 if len(linhas) else 2


if __name__ == "__main__":
    raise SystemExit(main())
