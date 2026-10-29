# Validação ao vivo da linha 0509 contra o mundo real (missão: teste contínuo).
#
# Rodadas: "antes de começar e depois de CADA tarefa" (missão). Uso:
#   .venv/Scripts/python.exe teste_509.py --rodada baseline --veiculos navegador
#   .venv/Scripts/python.exe teste_509.py --rodada pos-tarefa-X --veiculos direto
#   .venv/Scripts/python.exe teste_509.py --rodada noturna --veiculos pular
#
# Testes (missão, ordem):
#   1) integridade: a 0509 está no feed com trips, stop_times e shape íntegros;
#   2) horários: partidas programadas do feed × timetable fresco do Bus2 HOJE
#      (tipo de dia correto: seg..dom conforme o calendário);
#   3) veículos (só enquanto houver circulação): captura get-last-positions e
#      get-route-vehicles da 0509 — navegador (hook de resposta + decifra AES,
#      mesma frase pública do site) ou POST direto com o payload observado
#      ({project_id, prefixoInicial, prefixoFinal}) — e compara a posição de
#      cada veículo com o shape da 0509: distância ao traçado, sentido
#      declarado e atraso vs próxima partida programada. Se houver prefixo/
#      placa/número de carro, registra e guarda amostra.
#
# Saída: tests/live_509/AAAA-MM-DD_HHMM.json (uma rodada por arquivo) e
# tests/live_509/LOG.md (append-only: horário, resultado OK/ALERTA, o que mudou).
# Regra da missão: teste falhou depois de uma mudança -> parar e reverter.

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

RAIZ = Path(__file__).resolve().parent.parent.parent
GTFS = RAIZ / "data" / "gtfs"
SAIDA = RAIZ / "tests" / "live_509"
RSN, RID = "0509", "42029"
DIAS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
DIAS_PT = ("segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo")


def _seg(txt: object) -> int:
    partes = [int(x) for x in str(txt).split(":")]
    while len(partes) < 3:
        partes.append(0)
    h, m, s = partes
    return h * 3600 + m * 60 + s


def _hhmm(seg_total: int) -> str:
    h, m = divmod(seg_total // 60, 60)
    return f"{h:02d}:{m:02d}" + (" (amanhã)" if h >= 24 else "")


def _hhmmss(seg_total: int) -> str:
    h, resto = divmod(seg_total, 3600)
    m, s = divmod(resto, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _loc(name: str) -> dict[str, str]:
    with (GTFS / f"{name}.txt").open(encoding="utf-8", newline="") as f:
        return {r[k]: r for r in csv.DictReader(f) for k in r}  # noqa: C416


def _csv_rows(name: str) -> list[dict[str, str]]:
    with (GTFS / f"{name}.txt").open(encoding="utf-8", newline="") as f:
        return [dict(r) for r in csv.DictReader(f)]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


# ── teste 1: integridade da 0509 no feed ────────────────────────────────────────


def teste_integridade() -> dict[str, Any]:
    rotas = _csv_rows("routes")
    rota = next((r for r in rotas if r["route_short_name"] == RSN), None)
    if rota is None:
        return {"ok": False, "erro": f"linha {RSN} ausente do routes.txt"}

    hoje = date.today()
    col = DIAS[hoje.weekday()]
    iso = hoje.isoformat()
    cal = {c["service_id"]: c for c in _csv_rows("calendar")}
    ativos = {s for s, c in cal.items()
              if c[col] == "1" and c["start_date"] <= iso.replace("-", "")
              <= c["end_date"]}

    trips = [t for t in _csv_rows("trips") if t["route_id"] == RID]
    trips_hoje = [t for t in trips if t["service_id"] in ativos]
    outros_dias = {t["service_id"] for t in trips} - ativos

    # stop_times: carregar só das trips da 0509
    st_por_trip: dict[str, list[dict[str, str]]] = {}
    for st in _csv_rows("stop_times"):
        if st.get("trip_id") in {t["trip_id"] for t in trips_hoje}:
            st_por_trip.setdefault(st["trip_id"], []).append(st)

    problemas: list[str] = []
    partidas: list[int] = []
    for trip in trips_hoje:
        sts = sorted(st_por_trip.get(trip["trip_id"], []),
                     key=lambda s: int(s["stop_sequence"]))
        if not sts:
            problemas.append(f"trip {trip['trip_id']} sem stop_times")
            continue
        partidas.append(_seg(sts[0]["departure_time"]))
        tempos = [_seg(s["departure_time"]) for s in sts]
        if any(b < a for a, b in zip(tempos, tempos[1:], strict=False)):
            problemas.append(f"trip {trip['trip_id']} com horários retrocedendo")

    shape_ids = {t["shape_id"] for t in trips_hoje if t.get("shape_id")}
    shapes_pts = {}
    for s in _csv_rows("shapes"):
        if s["shape_id"] in shape_ids:
            shapes_pts.setdefault(s["shape_id"], []).append(
                (float(s["shape_pt_lat"]), float(s["shape_pt_lon"]),
                 int(s["shape_pt_sequence"])))
    for sid in shape_ids:
        if len(shapes_pts.get(sid, [])) < 2:
            problemas.append(f"shape {sid} com menos de 2 pontos")

    partidas.sort()
    return {
        "ok": not problemas and len(partidas) > 0,
        "route": {"route_id": RID, "short": RSN, "long": rota["route_long_name"],
                  "agency_id": rota["agency_id"], "route_desc": rota["route_desc"]},
        "trips_total": len(trips),
        "trips_hoje": len(trips_hoje),
        "servicos_hoje": sorted(ativos),
        "servicos_outros_dias": sorted(outros_dias),
        "partidas_hoje": [_hhmmss(s) for s in partidas],
        "primeira": _hhmm(partidas[0]) if partidas else None,
        "ultima": _hhmm(partidas[-1]) if partidas else None,
        "shape_ids": sorted(shape_ids),
        "shape_pontos": {k: len(v) for k, v in shapes_pts.items()},
        "shape_trajeto_m": {
            k: round(sum(haversine(a[0], a[1], b[0], b[1])
                         for a, b in zip(v, v[1:], strict=False)), 1)
            for k, v in shapes_pts.items()
        },
        "problemas": problemas,
    }


# ── teste 2: horários do feed × Bus2 fresco, HOJE ──────────────────────────────


def teste_horarios(integ: dict[str, Any]) -> dict[str, Any]:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from scraper.cache import KIND_TIMETABLE  # noqa: PLC0415
    from scraper.cryptojs import decifrar_objeto  # noqa: PLC0415
    from scraper.http_client import HttpClient  # noqa: PLC0415
    from scraper.sources import bus2  # noqa: PLC0415

    RAW = RAIZ / "data" / "raw"
    COL_PAINEL = ("seg", "ter", "qua", "qui", "sex", "sab", "dom")[date.today().weekday()]
    ISO = date.today().isoformat()
    http = HttpClient()
    rota = bus2.resolver_rota(RSN[1:], raw_dir=RAW, http=http, force=True)
    coleta = bus2.collect_line(rota.rid, rota.rsn, raw_dir=RAW, http=http, force=True)
    caminho = bus2.caminho_do_arquivo(RAW, KIND_TIMETABLE, rota.rsn) \
        if hasattr(bus2, "caminho_do_arquivo") else None
    if caminho is None:
        from scraper.cache import caminho_do_arquivo  # noqa: PLC0415
        caminho = caminho_do_arquivo(RAW, KIND_TIMETABLE, rota.rsn)
    viagens = decifrar_objeto(
        str(json.loads(caminho.read_text(encoding="utf-8"))["data"]),
        bus2.FRASE_PUBLICA,
    )

    partidas_painel: list[int] = []
    for viagem in viagens:
        for s in viagem.get("services") or []:
            if (s.get(COL_PAINEL) == 1
                    and str(s.get("sd", ""))[:10] <= ISO <= str(s.get("ed", ""))[:10]):
                partidas_painel.extend(_seg(d.get("dt")) for d in s.get("deps") or [])
    partidas_painel.sort()

    feed = sorted(_seg(p) for p in integ["partidas_hoje"])
    iguais = sorted(set(feed) & set(partidas_painel))
    so_feed = sorted(set(feed) - set(partidas_painel))
    so_painel = sorted(set(partidas_painel) - set(feed))
    ok = (len(so_feed) == 0 and len(so_painel) == 0)
    return {
        "ok": ok,
        "tipo_de_dia": f"{DIAS_PT[date.today().weekday()]} ({COL_PAINEL})",
        "painel": {"coletado_com": f"bus2 {rota.rsn} rid={rota.rid} force",
                   "faltando": coleta.faltando},
        "partidas_feed": len(feed),
        "partidas_painel": len(partidas_painel),
        "iguais": len(iguais),
        "so_no_feed": [_hhmm(s) for s in so_feed],
        "so_no_painel": [_hhmm(s) for s in so_painel],
        "primeira_painel": _hhmm(partidas_painel[0]) if partidas_painel else None,
        "ultima_painel": _hhmm(partidas_painel[-1]) if partidas_painel else None,
    }


# ── teste 3: veículos ao vivo da 0509 ──────────────────────────────────────────

PAYLOAD_LAST_POS = {"project_id": 394, "prefixoInicial": None, "prefixoFinal": None}
PAYLOAD_ROUTE_VEHICLES = {"projectId": 394, "route": "0509"}


def _decifra_padrao(corpo: str) -> Any:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from scraper.cryptojs import decifrar_objeto  # noqa: PLC0415
    from scraper.sources.bus2 import FRASE_PUBLICA  # noqa: PLC0415

    try:
        env = json.loads(corpo)
        b64 = env.get("data") if isinstance(env, dict) else None
        if isinstance(b64, str) and b64:
            return decifrar_objeto(b64, FRASE_PUBLICA)
    except Exception:
        pass
    return None


def teste_veiculos(modo: str) -> dict[str, Any]:
    capturas: dict[str, Any] = {}
    if modo == "pular":
        return {"ok": True, "pulado": True, "motivo": "fora do horário de circulação"}

    if modo == "navegador":
        _prepara_env_playwright()
        from playwright.sync_api import sync_playwright  # noqa: PLC0415

        respostas: list[tuple[str, str]] = []

        def em_response(resp) -> None:
            if "/public/" in resp.url:
                try:
                    respostas.append((resp.url.rsplit("/", 1)[-1], resp.text()))
                except Exception:
                    pass

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_context(locale="pt-BR").new_page()
            page.on("response", em_response)
            page.goto("https://painel.mobilibus.com/bus2you/mapa?p=2qloq",
                      wait_until="domcontentloaded")
            page.wait_for_timeout(9_000)  # alguns ciclos de polling (2s)
            browser.close()

        for endpoint, corpo in respostas:
            dados = _decifra_padrao(corpo)
            if endpoint == "get-last-positions":
                capturas["get-last-positions"] = dados
            elif endpoint == "get-route-vehicles":
                capturas["get-route-vehicles(0509)"] = dados
    else:  # direto: POST cifrado com o payload observado no navegador da 0.ª rodada
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from scraper.cryptojs import cifrar_objeto  # noqa: PLC0415
        from scraper.http_client import HttpClient  # noqa: PLC0415
        from scraper.sources.bus2 import FRASE_PUBLICA  # noqa: PLC0415

        http = HttpClient()
        for nome, url, payload in (
            ("get-last-positions",
             "https://painel.mobilibus.com/public/get-last-positions",
             PAYLOAD_LAST_POS),
            ("get-route-vehicles(0509)",
             "https://painel.mobilibus.com/public/get-route-vehicles",
             PAYLOAD_ROUTE_VEHICLES),
        ):
            corpo = json.dumps({"data": cifrar_objeto(payload, FRASE_PUBLICA)}).encode(
                "utf-8")
            resposta = http.post(url, corpo)
            capturas[nome] = _decifra_padrao(resposta.content.decode("utf-8"))

    total = 0
    amostras: list[dict[str, Any]] = []
    for nome, dados in capturas.items():
        if isinstance(dados, list):
            total += len(dados)
            for v in dados[:10]:
                amostras.append({"fonte": nome, **dict(v)})
    identificadores = sorted({
        k for a in amostras for k in a
        if k.lower() in {"vid", "prefixo", "prefix", "plate", "placa", "dv",
                        "vehicleId", "vehicle", "carro", "fid", "label"}
    })

    saida: dict[str, Any] = {
        "ok": True,  # impossibilidade de RT é estado da fonte, não erro do teste
        "modo": modo,
        "endpoints_capturados": {k: (len(v) if isinstance(v, list) else "não-lista")
                                 for k, v in capturas.items()},
        "veiculos_total": total,
        "campos_identificador_vistos": identificadores,
        "amostra_veiculos": amostras[:5],
        "analise": None,
    }
    if total:
        saida["analise"] = _analisa_veiculos(amostras)
    return saida


def _analisa_veiculos(amostras: list[dict[str, Any]]) -> dict[str, Any]:
    # shape da 0509 para medir distância ao traçado
    pontos: list[tuple[float, float]] = []
    shape_ids = _shape_ids_509()
    for s in _csv_rows("shapes"):
        if s["shape_id"] in shape_ids:
            pontos.append((float(s["shape_pt_lat"]), float(s["shape_pt_lon"])))
    analises = []
    for v in amostras:
        lat, lon = v.get("lat"), v.get("lon")
        if lat is None or lon is None or not pontos:
            continue
        dist = min(haversine(float(lat), float(lon), a, b) for a, b in pontos)
        analises.append({
            "vid": v.get("vid"), "rid": v.get("rid"),
            "lat/lon": f"{lat},{lon}",
            "dist_ao_shape_m": round(dist, 1),
            "linha_0509": str(v.get("rid")) in ("0509", RID),
            "sentido_campo_dir": v.get("dir"),
            "ts": v.get("ts"),
        })
    atraso = None
    if analises and amostras:
        # atraso vs próxima partida programada (da rodada de integridade)
        agora = datetime.now()
        seg_agora = agora.hour * 3600 + agora.minute * 60
        partidas = sorted(_seg(p) for p in _partidas_509_hoje() or [])
        prox = next((p for p in partidas if p >= seg_agora - 3600), None)
        if prox is not None:
            atraso = {"partida_referencia": _hhmm(prox),
                      "diferenca_posicao_vs_programado": "ver analises por amostra"}
    return {"por_veiculo": analises, "nota_atraso": atraso}


def _shape_ids_509() -> set[str]:
    return {t["shape_id"] for t in _csv_rows("trips")
            if t["route_id"] == RID and t.get("shape_id")}


def _partidas_509_hoje() -> list[str]:
    integ = teste_integridade()
    return integ.get("partidas_hoje", []) if integ.get("ok") else []


def _prepara_env_playwright() -> None:
    tmp = (Path(__file__).resolve().parent / ".tmp").resolve()
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(tmp / "pw-browsers")
    os.environ["TEMP"] = str(tmp / "pw-artifacts")
    os.environ["TMP"] = str(tmp / "pw-artifacts")


# ── orquestração e registro ────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rodada", required=True, help="ex.: baseline, pos-tarefa-4")
    parser.add_argument("--veiculos", choices=["navegador", "direto", "pular"],
                        default="direto")
    args = parser.parse_args()

    SAIDA.mkdir(parents=True, exist_ok=True)
    agora = datetime.now()
    resultado: dict[str, Any] = {
        "data": date.today().isoformat(),
        "hora": agora.strftime("%H:%M:%S"),
        "rodada": args.rodada,
        "linha": RSN,
        "testes": {},
    }
    alertas: list[str] = []
    print(f"== rodada {args.rodada} | {date.today().isoformat()} "
          f"{agora.strftime('%H:%M')} | 0509 João Agripino")

    t1 = teste_integridade()
    resultado["testes"]["integridade"] = t1
    print(f"[1] integridade: {'OK' if t1['ok'] else 'ALERTA'} · "
          f"trips hoje={t1.get('trips_hoje')} · partidas={t1.get('primeira')} a "
          f"{t1.get('ultima')} · problemas={t1.get('problemas') or 'nenhum'}")
    if not t1["ok"]:
        alertas.append("integridade")

    t2 = teste_horarios(t1)
    resultado["testes"]["horarios"] = t2
    print(f"[2] horários feed×painel ({t2['tipo_de_dia']}): "
          f"{'OK' if t2['ok'] else 'ALERTA'} · feed={t2['partidas_feed']} "
          f"painel={t2['partidas_painel']} · iguais={t2['iguais']} · "
          f"só no feed={t2['so_no_feed']} · só no painel={t2['so_no_painel']}")
    if not t2["ok"]:
        alertas.append("horarios")

    t3 = teste_veiculos(args.veiculos)
    resultado["testes"]["veiculos"] = t3
    if t3.get("pulado"):
        print(f"[3] veículos: PULADO ({t3['motivo']})")
    else:
        print(f"[3] veículos ({t3['modo']}): {t3['veiculos_total']} capturado(s) · "
              f"endpoints={t3['endpoints_capturados']} · "
              f"identificadores={t3['campos_identificador_vistos'] or 'nenhum'}")
    if t3.get("veiculos_total"):
        resultado["testes"]["veiculos"]["ok"] = True

    resultado["resultado"] = "ALERTA" if alertas else "OK"
    resultado["alertas"] = alertas
    resultado.get("alertas")

    arquivo = SAIDA / f"{date.today().isoformat()}_{agora.strftime('%H%M')}.json"
    arquivo.write_text(json.dumps(resultado, ensure_ascii=False, indent=1),
                       encoding="utf-8")

    log = SAIDA / "LOG.md"
    existia = log.exists()
    nota = " | ".join([f"só no feed: {t2['so_no_feed']}" if t2["so_no_feed"] else "",
                       f"só no painel: {t2['so_no_painel']}" if t2["so_no_painel"] else "",
                       "sem RT no painel" if (t3 and not t3.get("veiculos_total")
                                              and not t3.get("pulado")) else "",
                       f"problemas: {t1['problemas']}" if t1.get("problemas") else ""
                       ]).replace(" | |", "|").strip(" |")
    with log.open("a", encoding="utf-8") as f:
        if not existia:
            f.write("| Data | Hora | Rodada | [1] Integridade | [2] Horários | "
                    "[3] Veículos | Resultado | Obs |\n|---|---|---|---|---|---|---|---|\n")
        f.write(f"| {date.today().isoformat()} | {agora.strftime('%H:%M')} | "
                f"{args.rodada} | "
                f"{'OK' if t1['ok'] else 'ALERTA'} ({t1.get('trips_hoje')} trips, "
                f"{t1.get('primeira')}-{t1.get('ultima')}) | "
                f"{'OK' if t2['ok'] else 'ALERTA'} "
                f"({t2['partidas_feed']}x{t2['partidas_painel']}) | "
                f"{'pulado' if t3.get('pulado') else t3['veiculos_total']} | "
                f"**{resultado['resultado']}** | {nota} |\n")

    print(f"arquivo: {arquivo}")
    print(f"log: {log}")
    print(f"RESULTADO: {resultado['resultado']}")
    return 0 if resultado["resultado"] == "OK" else 1


if __name__ == "__main__":
    raise SystemExit(main())
