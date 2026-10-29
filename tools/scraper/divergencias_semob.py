# Item 5 — Tabela de divergências: GeoJSON/horários oficiais da SEMOB-JP × feed
# Flavos Bus (fonte painel Mobilibus/Bus2).
#
# Por linha compara, sem inferir nada:
#   * partidas por tipo de dia (Dia útil / Sábado / Domingo): quantidade, quais
#     horários batem, quais só existem num lado, primeira/última;
#   * extensão: km do(s) shape(s) do feed × EXTENSAO IDA/VOLTA do geojson;
#   * nº de paradas do feed (o site oficial não publica paradas no horário);
#   * observações operacionais da página oficial (via alternativa etc.).
#
# Saídas: docs/DIVERGENCIAS_SEMOB.md (resumo legível, 0509 destacada),
#         docs/divergencias_semob.csv (uma linha por linha de ônibus).
# Rodar: .venv/Scripts/python.exe divergencias_semob.py [--somente-509] [--online]
# Sem --online usa o geojson congelado; a página de horários é sempre fetchada
# (é ela a fonte viva do lado oficial). Cuidados: rodada de fetch com pausa
# educada de 0.15 s entre linhas.

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any

RAIZ = Path(__file__).resolve().parent.parent.parent
DOCS = RAIZ / "docs"
GTFS = RAIZ / "data" / "gtfs"
BASE = "https://servicos.semobjp.pb.gov.br"
METADADOS = GTFS / "_SEMOB_METADADOS.json"
CAB = {"User-Agent": "FlavosBus-DataCollector/0.1"}
SECOES = (("Dia útil", "uteis"), ("Sábado", "sabado"), ("Domingo", "domingo"))


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    p1, p2 = radians(lat1), radians(lat2)
    dp, dl = p2 - p1, radians(lon2 - lon1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _rows(nome: str, gtfs: Path = GTFS) -> list[dict[str, str]]:
    with (gtfs / f"{nome}.txt").open(encoding="utf-8", newline="") as f:
        return [dict(r) for r in csv.DictReader(f)]


def _seg(txt: str) -> int:
    h, m = (int(x) for x in txt.split(":")[:2])
    return h * 3600 + m * 60


def _hhmm(seg: int) -> str:
    h, r = divmod(seg, 3600)
    return f"{(h % 24):02d}:{(r // 60):02d}" + (" (amanhã)" if h >= 24 else "")


# ── lado oficial (SEMOB): página de horário + geojson congelado ───────────────


def horario_oficial(sigla_semob: str) -> dict[str, Any] | None:
    url = f"{BASE}/linhas-de-onibus/{sigla_semob}/horario/"
    try:
        req = urllib.request.Request(url, headers=CAB)
        with urllib.request.urlopen(req, timeout=25) as r:
            html = r.read().decode("utf-8", "replace")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
        return None
    achados: dict[str, Any] = {}
    marcas = list(re.finditer(
        r"<strong>([^<]+)</strong>\s*\|\s*(\d+)\s*viagens", html))
    for j, m in enumerate(marcas):
        chave = next((k for rotulo, k in SECOES
                      if rotulo.lower() in m.group(1).strip().lower()), None)
        if chave is None:
            continue
        fim = marcas[j + 1].start() if j + 1 < len(marcas) else len(html)
        bloco = html[m.end():fim]
        # horários como (HH:MM, legenda-a/b/""), lidos dos spans badge
        partidas: list[tuple[str, str]] = []
        for span_atributos, hh in re.findall(r"<span([^>]*)>(\d{2}:\d{2})</span>", bloco):
            legenda_m = re.search(r"badge-legenda-(\w+)", span_atributos)
            partidas.append((hh, legenda_m.group(1) if legenda_m else ""))
        achados[chave] = {
            "viagens": int(m.group(2)),
            "partidas": [p for p, _ in partidas],
            "legendas": [lg for _, lg in partidas if lg],
        }
    obs = re.search(r"Observa(?:ç|c)(?:õ|o)es:(.*?)(?:</div>|<footer|$)", html, re.S)
    if obs:
        texto_obs = re.sub(r"<[^>]+>", " ", obs.group(1))
        achados["obs"] = " ".join(texto_obs.split())
    else:
        achados["obs"] = ""
    achados["existe"] = True
    return achados or None


def geojson_congelado() -> dict[str, Any]:
    return json.loads(METADADOS.read_text(encoding="utf-8"))


# ── lado feed (Bus2/painel, como está no GTFS em disco) ──────────────────────


def dados_feed() -> tuple[list[dict[str, str]], list[dict[str, str]],
                         list[dict[str, str]], list[dict[str, str]], list[dict[str, str]]]:
    routes = _rows("routes")
    trips = _rows("trips")
    stop_times = _rows("stop_times")
    calendar = _rows("calendar")
    shapes = _rows("shapes")
    return routes, trips, stop_times, calendar, shapes


def resumo_feed_por_rota() -> dict[str, dict[str, Any]]:
    routes, trips, stop_times, calendar, shapes = dados_feed()
    cal = {c["service_id"]: c for c in calendar}

    partida_por_trip: dict[str, int] = {}
    stops_por_trip: dict[str, set[str]] = {}
    for st in stop_times:
        t = st["trip_id"]
        if int(st["stop_sequence"]) == 1:
            partida_por_trip[t] = _seg(st["departure_time"])
        stops_por_trip.setdefault(t, set()).add(st["stop_id"])

    trips_por_rota: dict[str, list[dict[str, str]]] = {}
    for t in trips:
        trips_por_rota.setdefault(t["route_id"], []).append(t)

    shape_pts: dict[str, list[tuple[float, float]]] = {}
    seq_shape: dict[str, int] = {}
    for s in shapes:
        sid = s["shape_id"]
        if sid not in seq_shape or int(s["shape_pt_sequence"]) < seq_shape[sid]:
            seq_shape[sid] = int(s["shape_pt_sequence"])
        shape_pts.setdefault(sid, []).append(
            (float(s["shape_pt_lat"]), float(s["shape_pt_lon"]),
             int(s["shape_pt_sequence"])))

    out: dict[str, dict[str, Any]] = {}
    for rota in routes:
        rid = rota["route_id"]
        sigla = rota["route_short_name"]
        da_rota = trips_por_rota.get(rid, [])
        partidas_por_dia: dict[str, list[int]] = {"uteis": [], "sabado": [], "domingo": []}
        stops_distintos: set[str] = set()
        shapes_usados = Counter()
        for t in da_rota:
            stops_distintos |= stops_por_trip.get(t["trip_id"], set())
            if t.get("shape_id"):
                shapes_usados[t["shape_id"]] += 1
            servico = cal.get(t["service_id"])
            if not servico:
                continue
            partida = partida_por_trip.get(t["trip_id"])
            if partida is None:
                continue
            if servico["monday"] == "1":
                partidas_por_dia["uteis"].append(partida)
            if servico["saturday"] == "1":
                partidas_por_dia["sabado"].append(partida)
            if servico["sunday"] == "1":
                partidas_por_dia["domingo"].append(partida)
        # km por shape (trajeto somado) para os 2 mais usados
        km_por_shape = {}
        for sid, _ in shapes_usados.most_common(2):
            pts = sorted(shape_pts.get(sid, []), key=lambda p: p[2])
            km_por_shape[sid] = round(sum(
                haversine_m(a[0], a[1], b[0], b[1]) for a, b in
                zip(pts, pts[1:], strict=False)) / 1000, 2)
        out[sigla] = {
            "route_id": rid,
            "partidas_por_dia": {k: sorted(v) for k, v in partidas_por_dia.items()},
            "paradas_distintas": len(stops_distintos),
            "shapes_km": km_por_shape,
        }
    return out


# ── comparação ─────────────────────────────────────────────────────────────────


def comparar_linha(sigla: str, aliased: str, feed: dict[str, Any],
                   oficial: dict[str, Any] | None,
                   geoinfo: dict[str, Any] | None) -> dict[str, Any]:
    linha: dict[str, Any] = {"linha": sigla, "sigla_semob": aliased}
    if geoinfo:
        linha["tipo"] = " / ".join(sorted(
            str(s.get("tipo") or "?") for s in geoinfo["sentidos"].values()))
        linha["ext_ida_oficial_km"] = ";".join(
            str(s.get("extensao_km")) for s in geoinfo["sentidos"].values()
            if "IDA" in str(geoinfo["sentidos"])) or None
        linha["extensoes_oficiais_km"] = "; ".join(
            f"{sen}={s.get('extensao_km')}"
            for sen, s in sorted((geoinfo["sentidos"] or {}).items()))
        linha["operadora_declarada"] = " / ".join(sorted(
            str(s.get("empresa") or "?") for s in geoinfo["sentidos"].values()))
    else:
        linha["tipo"] = ""
        linha["extensoes_oficiais_km"] = "(sem geojson)"
        linha["operadora_declarada"] = ""
    linha["km_shapes_feed"] = "; ".join(
        f"{k}={v}" for k, v in (feed["shapes_km"] or {}).items())
    linha["paradas_distintas_feed"] = feed["paradas_distintas"]

    status_partes: list[str] = []
    if oficial is None:
        linha["status"] = "sem página de horário oficial"
        for chave in ("uteis", "sabado", "domingo"):
            linha[f"viagens_{chave}_feed"] = len(feed["partidas_por_dia"][chave])
            linha[f"viagens_{chave}_oficial"] = ""
        return linha

    diferentes: list[str] = []
    for rotulo, chave in (("uteis", "uteis"), ("sábado", "sabado"), ("domingo", "domingo")):
        do_feed = feed["partidas_por_dia"][chave]
        do_oficial = oficial.get(chave)
        linha[f"viagens_{chave}_feed"] = len(do_feed)
        if do_oficial is None:
            linha[f"viagens_{chave}_oficial"] = ""
            if do_feed:
                status_partes.append(f"{rotulo}: só no feed")
            continue
        seg_oficial = sorted(_seg(p) for p in do_oficial["partidas"])
        seg_feed = sorted(set(do_feed))
        iguais = sorted(set(seg_feed) & set(seg_oficial))
        so_feed = sorted(set(seg_feed) - set(seg_oficial))
        so_oficial = sorted(set(seg_oficial) - set(seg_feed))
        linha[f"viagens_{chave}_oficial"] = do_oficial["viagens"]
        linha[f"iguais_{chave}"] = len(iguais)
        linha[f"so_feed_{chave}"] = "; ".join(_hhmm(s) for s in so_feed)
        linha[f"so_oficial_{chave}"] = "; ".join(_hhmm(s) for s in so_oficial)
        if (so_feed or so_oficial
                or len(seg_feed) != len(seg_oficial)
                or do_oficial["viagens"] != len(seg_feed)):
            diferentes.append(rotulo)
    linha["obs_oficial"] = (oficial.get("obs") or "")[:200]
    linha["status"] = ("diverge (" + ", ".join(diferentes) + ")") if diferentes else "confere"
    if status_partes:
        linha["status"] += " · " + "; ".join(status_partes)
    return linha


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--somente-509", action="store_true")
    parser.add_argument("--online", action="store_true",
                        help="refetcha geojsons antes (monitora_semob.py)")
    args = parser.parse_args()

    if args.online:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import monitora_semob as mon  # noqa: PLC0415
        dados_semob = mon.coletar_online()
        METADADOS.write_text(json.dumps(dados_semob, ensure_ascii=False, indent=1),
                             encoding="utf-8")
    else:
        dados_semob = geojson_congelado()

    linhas_meta = dados_semob.get("linhas") or {}
    alias = {}
    for sigla, info in linhas_meta.items():
        alias[sigla] = info.get("sigla_semob", sigla)
    # 1001 (painel) -> 1001M (SEMOB) já vem em sigla_semob pela coleta

    resumo = resumo_feed_por_rota()
    alvo = ["0509"] if args.somente_509 else sorted(resumo)

    resultado: list[dict[str, Any]] = []
    for sigla in alvo:
        aliased = alias.get(sigla, sigla)
        geoinfo = linhas_meta.get(sigla)
        oficial = horario_oficial(aliased) if aliased else None
        resultado.append(comparar_linha(
            sigla, aliased, resumo[sigla], oficial, geoinfo))
        time.sleep(0.15)

    # saídas
    DOCS.mkdir(parents=True, exist_ok=True)
    campos = ["linha", "sigla_semob", "status", "tipo",
              "viagens_uteis_feed", "viagens_uteis_oficial", "iguais_uteis",
              "so_feed_uteis", "so_oficial_uteis",
              "viagens_sabado_feed", "viagens_sabado_oficial",
              "viagens_domingo_feed", "viagens_domingo_oficial",
              "paradas_distintas_feed", "extensoes_oficiais_km", "km_shapes_feed",
              "operadora_declarada", "obs_oficial"]
    csv_path = DOCS / "divergencias_semob.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows(resultado)

    contagem = Counter(r["status"].split(" (")[0].split(" ·")[0] for r in resultado)
    divergentes = [r for r in resultado
                   if r["status"].startswith("diverge")]
    md: list[str] = [
        "# Divergências: dados oficiais da SEMOB-JP × feed Flavos Bus",
        "",
        f"Gerado em **{datetime.now().strftime('%d/%m/%Y %H:%M')}**."
        " Fontes: quadro de horários oficial"
        " (`servicos.semobjp.pb.gov.br/linhas-de-onibus/<linha>/horario/`)"
        " + geojson de itinerário × feed GTFS Flavos Bus"
        " (fonte painel Mobilibus/Bus2). Comparação direta, nada inferido.",
        "",
        f"- Linhas comparadas: **{len(resultado)}**",
        f"- Confere: **{contagem.get('confere', 0)}** · "
        f"diverge: **{len(divergentes)}** · "
        f"sem página oficial: **{contagem.get('sem página de horário oficial', 0)}**",
        "",
        "## Casos com divergência real de horários",
        "",
        "| Linha | Diverge em | Feed (ut/sáb/dom) | Oficial | Só no feed | Só no oficial |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for r in divergentes:
        onde = (r["status"].split("(")[1].split(")")[0]
                if "(" in r["status"] else "")
        so_feed = " · ".join(x for x in (r.get("so_feed_uteis"),) if x) or "—"
        so_of = " · ".join(x for x in (r.get("so_oficial_uteis"),) if x) or "—"
        md.append(
            f"| {r['linha']}{(' **(509)**' if r['linha'] == '0509' else '')} "
            f"| {onde} "
            f"| {r['viagens_uteis_feed']}/{r['viagens_sabado_feed']}/"
            f"{r['viagens_domingo_feed']} "
            f"| {r['viagens_uteis_oficial'] or '—'}/"
            f"{r['viagens_sabado_oficial'] or '—'}/"
            f"{r['viagens_domingo_oficial'] or '—'} "
            f"| {so_feed} | {so_of} |")
    md += [
        "",
        "## Linha 0509 — João Agripino (validação contínua)",
        "",
    ]
    linha_509 = next((r for r in resultado if r["linha"] == "0509"), None)
    if linha_509:
        md.append(f"- Status: **{linha_509['status']}**")
        md.append(f"- Viagens no feed (ut/sáb/dom): "
                  f"{linha_509['viagens_uteis_feed']}/"
                  f"{linha_509['viagens_sabado_feed']}/"
                  f"{linha_509['viagens_domingo_feed']} · "
                  f"oficial: {linha_509['viagens_uteis_oficial'] or '—'}/"
                  f"{linha_509['viagens_sabado_oficial'] or '—'}/"
                  f"{linha_509['viagens_domingo_oficial'] or '—'}")
        md.append(f"- Extensões oficiais: {linha_509.get('extensoes_oficiais_km')}"
                  f" · shapes do feed (km): {linha_509.get('km_shapes_feed')}")
        if linha_509.get("obs_oficial"):
            md.append(f"- Observação oficial: “{linha_509['obs_oficial']}”")
    md += [
        "",
        "Tabela completa em `docs/divergencias_semob.csv`"
        " (um registro por linha, com TODAS as colunas por tipo de dia).",
        "",
    ]
    md_path = DOCS / "DIVERGENCIAS_SEMOB.md"
    md_path.write_text("\n".join(md), encoding="utf-8")

    print(f"linhas comparadas: {len(resultado)} · {dict(contagem)}")
    print(f"divergentes: {len(divergentes)}")
    print(f"csv: {csv_path}")
    print(f"md: {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
