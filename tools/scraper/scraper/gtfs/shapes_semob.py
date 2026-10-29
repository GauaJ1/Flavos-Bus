# Item 6 — traçado canônico: substitui, de forma determinística e auditável,
# a polyline do painel pelo GeoJSON oficial da SEMOB-JP nas linhas cujo shape
# ficou fora da tolerância na auditoria (erro médio >= 30 m).
#
# Regras do substituidor (nada é inventado):
#   * só linhas em LINHAS_ALVO (auditoria _AUDITORIA_SHAPES.md de 2026-10-28);
#   * só roda se o geojson foi congelado em data/raw/semob_geojson/<linha>.json
#     (pasta gitignored; coletado por tools/scraper/coleta_shapes_semob.py);
#   * o sentido (IDA/VOLTA/CIRCULAR) é escolhido pela distância da PRIMEIRA
#     parada da viagem ao extremo do traçado — o traçado é revertido quando o
#     extremo final está mais perto, para o shape começar onde a viagem começa;
#   * tolerância: primeira parada a até TOLERANCIA_INICIO_M de um dos extremos;
#     acima disso o traçado do painel é mantido e vira nota de aviso;
#   * ATUALIZACA do geojson vai para a nota do relatório (idade do dado oficial).
# A 0509 NÃO está na lista: seu traçado continua o do painel (regressão viva).

from __future__ import annotations

import json
from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any

LINHAS_ALVO = frozenset({
    "0500", "1500", "5210", "1519", "E155", "E551", "0512", "0503", "0507",
    "0307", "1510", "5110", "0522", "E901", "0106", "0502", "5100", "0517",
    "0115", "0304", "0109", "I004", "0520",
})
TOLERANCIA_INICIO_M = 1000.0
# Política de coerência com o serviço real (descoberta do item 6 de 2026-10-29:
# em várias das linhas alvo o traçado OFICIAL fica longe das paradas em
# operação — o geojson é mais velho que o serviço). A troca só acontece quando
# o traçado oficial NÃO deixa MAIS paradas longe do que deixa a polyline do
# painel; caso contrário mantém-se o painel (frescas, coerentes com horários).
TOLERANCIA_PARADAS_M = 100.0
# Comparação justa: a polyline do painel é esparsa e o geojson oficial denso;
# comparar parada-a-PONTO favoreceria o denso. Reamostra ambos a cada ~40 m
# para medir distância parada→traçado (aproximação da distância ao segmento).
PASSO_AMOSTRA_M = 40.0


def _resample(pontos: list[tuple[float, float]], passo_m: float) -> list[tuple[float, float]]:
    """Densifica a polyline com pontos interpolados a cada passo_m (linear)."""
    if len(pontos) < 2:
        return list(pontos)
    saida: list[tuple[float, float]] = [pontos[0]]
    acumulado = 0.0
    for (lat_a, lon_a), (lat_b, lon_b) in zip(pontos, pontos[1:], strict=False):
        trecho = haversine_m(lat_a, lon_a, lat_b, lon_b)
        if trecho == 0.0:
            continue
        acumulado += trecho
        while acumulado >= passo_m:
            excedente = acumulado - passo_m
            fração = 1.0 - excedente / trecho
            lat = lat_a + (lat_b - lat_a) * fração
            lon = lon_a + (lon_b - lon_a) * fração
            saida.append((lat, lon))
            acumulado = excedente
            lat_a, lon_a = lat, lon
            trecho = haversine_m(lat_a, lon_a, lat_b, lon_b)
            if trecho == 0.0:
                break
            acumulado = trecho
    saida.append(pontos[-1])
    return saida


@dataclass(frozen=True)
class Tracado:
    """Um traçado oficial de um sentido, já em (lat, lon)."""

    sentido: str
    pontos: tuple[tuple[float, float], ...]
    atualizacao: str


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    p1, p2 = radians(lat1), radians(lat2)
    dp, dl = p2 - p1, radians(lon2 - lon1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _pontos_geometria(geometry: dict[str, Any] | None) -> list[tuple[float, float]]:
    """Converte LineString/MultiLineString GeoJSON ([lon, lat]) em (lat, lon)."""
    if not isinstance(geometry, dict):
        return []
    tipo = geometry.get("type")
    coordenadas = geometry.get("coordinates")
    if tipo == "LineString" and isinstance(coordenadas, list):
        pares = [c for c in coordenadas if isinstance(c, (list, tuple)) and len(c) >= 2]
        return [(float(c[1]), float(c[0])) for c in pares]
    if tipo == "MultiLineString" and isinstance(coordenadas, list):
        saida: list[tuple[float, float]] = []
        for linha in coordenadas:
            saida.extend(_pontos_geometria({"type": "LineString", "coordinates": linha}))
        return saida
    return []


def carregar_tracados(pasta: Path) -> dict[str, list[Tracado]]:
    """Lê data/raw/semob_geojson/<lin>.json e devolve linha → traçados por sentido."""
    pasta = Path(pasta)
    saida: dict[str, list[Tracado]] = {}
    for caminho in sorted(pasta.glob("*.json")):
        sigla = caminho.stem
        try:
            documento = json.loads(caminho.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        por_sentido: dict[str, dict[str, Any]] = {}
        for feature in documento.get("features") or []:
            propriedades = feature.get("properties") or {}
            sentido = str(propriedades.get("ITINERARIO") or "UNICO").strip().upper()
            pontos = _pontos_geometria(feature.get("geometry"))
            if len(pontos) < 2:
                continue
            alvo_ = por_sentido.get(sentido)
            if alvo_ is None:
                alvo_ = por_sentido[sentido] = {"pontos": []}
            alvo_["pontos"].extend(pontos)
            alvo_["atualizacao"] = str(propriedades.get("ATUALIZACA") or "")
        tracados = []
        for sentido, dados in sorted(por_sentido.items()):
            tracados.append(Tracado(
                sentido=sentido,
                pontos=tuple(dados["pontos"]),
                atualizacao=dados.get("atualizacao", ""),
            ))
        if tracados:
            saida[sigla] = tracados
    return saida


def _alinhar(
    ponto_referencia: tuple[float, float], pontos: list[tuple[float, float]]
) -> tuple[list[tuple[float, float]], float]:
    """Começa o traçado pelo extremo mais próximo da referência; devolve a distância."""
    lat, lon = ponto_referencia
    inicio = haversine_m(lat, lon, *pontos[0])
    fim = haversine_m(lat, lon, *pontos[-1])
    if fim < inicio:
        return list(reversed(pontos)), fim
    return list(pontos), inicio


def _shape_id(rsn: str, sentido: str) -> str:
    return f"semob-{rsn.lower()}-{sentido.lower()}"


def _conta_longe(
    paradas: list[tuple[float, float]], pontos: list[tuple[float, float]]
) -> tuple[int, int]:
    """(n paradas > TOLERANCIA_PARADAS_M do traçado, total de paradas)."""
    longe = 0
    for lat, lon in paradas:
        if min(haversine_m(lat, lon, a, b) for a, b in pontos) > TOLERANCIA_PARADAS_M:
            longe += 1
    return longe, len(paradas)


def substituir_shapes_semob(
    entrada: Any,
    tab: Any,
    shapes_mapa: dict[int, str],
    pasta: Path | None = None,
) -> dict[str, int]:
    """Troca o traçado do painel pelo oficial nas linhas alvo; devolve rsn → tids.

    Mutação: altera shapes_mapa (tid → novo shape_id), tab.shapes (remove os
    substituídos, adiciona os oficiais) e registra notas em tab.notas.
    """
    if pasta is None:
        return {}  # feature desligada (montagem de teste/sem coleta): sem ruído
    if not pasta.is_dir():
        return {}  # sem coleta de geojsons: sem ruído no relatório
    tracados_por_linha = carregar_tracados(pasta)

    tids_por_linha: dict[str, set[int]] = {}
    for rota in entrada.rotas:
        rsn = str(rota["rsn"])
        if rsn in LINHAS_ALVO:
            tids_por_linha[rsn] = {
                int(v["tid"]) for v in entrada.timetables.get(rsn) or []
            }
    if not tracados_por_linha and tids_por_linha:
        # pasta existe, mas nenhuma linha alvo tem geojson congelado
        for rsn in sorted(tids_por_linha):
            tab.nota(
                "aviso", "SHAPE_SEMOB_AUSENTE",
                f"linha {rsn} é alvo do traçado oficial, mas o geojson não está "
                f"congelado em {pasta.name}; mantido o traçado do painel",
            )
        return {}

    # paradas (lat, lon) de cada padrão de viagem (tid), na ordem da viagem
    paradas_por_tid: dict[int, list[tuple[float, float]]] = {}
    for viagens in entrada.timetables.values():
        for viagem in viagens:
            tid = int(viagem["tid"])
            paradas: list[tuple[float, float]] = []
            for parada in viagem.get("stops") or []:
                try:
                    lat = float(str(parada.get("lat") or ""))
                    lon = float(str(parada.get("lon") or ""))
                except (TypeError, ValueError):
                    continue
                paradas.append((lat, lon))
            if paradas:
                paradas_por_tid[tid] = paradas

    # pontos do traçado ATUAL (do painel), na ordem, para a comparação relativa
    seq_atual: dict[str, list[tuple[int, tuple[float, float]]]] = {}
    for entrada_shape in tab.shapes:
        try:
            seq_atual.setdefault(entrada_shape["shape_id"], []).append((
                int(entrada_shape["shape_pt_sequence"]),
                (float(entrada_shape["shape_pt_lat"]),
                 float(entrada_shape["shape_pt_lon"])),
            ))
        except (KeyError, TypeError, ValueError):
            continue
    pontos_atuais: dict[str, list[tuple[float, float]]] = {
        sid: [p for _, p in sorted(pares, key=lambda x: x[0])]
        for sid, pares in seq_atual.items()
    }

    novos: dict[str, list[dict[str, str]]] = {}
    substituidos: set[str] = set()
    resultado: dict[str, int] = {}
    for rsn, tids in sorted(tids_por_linha.items()):
        tracados = tracados_por_linha.get(rsn) or []
        if not tracados:
            tab.nota(
                "aviso", "SHAPE_SEMOB_AUSENTE",
                f"linha {rsn} é alvo do traçado oficial, mas o geojson não está "
                f"congelado em {pasta.name}; mantido o traçado do painel",
            )
            continue
        atualizacao = "; ".join(sorted({t.atualizacao[:10] for t in tracados}))
        convertidos = 0
        for tid in sorted(tids):
            paradas = paradas_por_tid.get(tid) or []
            if not paradas:
                tab.nota(
                    "aviso", "SHAPE_SEMOB_SEM_INICIO",
                    f"linha {rsn} tid {tid}: nenhuma parada com coordenada; "
                    "mantido o traçado do painel",
                )
                continue
            referencia = paradas[0]
            escolhido: Tracado | None = None
            melhor_dist: float | None = None
            for tracado in tracados:
                # _alinhar decide a direção do traçado pelo extremo mais próximo
                # da primeira parada; com IDA/VOLTA escolhe o mais perto também
                pontos, dist = _alinhar(referencia, list(tracado.pontos))
                if melhor_dist is None or dist < melhor_dist:
                    melhor_dist = dist
                    escolhido = Tracado(tracado.sentido, tuple(pontos),
                                        tracado.atualizacao)
            if escolhido is None or melhor_dist is None:
                continue
            if melhor_dist > TOLERANCIA_INICIO_M:
                tab.nota(
                    "aviso", "SHAPE_SEMOB_SEM_ALINHAMENTO",
                    f"linha {rsn} tid {tid}: primeira parada a {melhor_dist:.0f} m "
                    "dos extremos do traçado oficial; mantido o traçado do painel",
                )
                continue
            # política de coerência: o oficial não pode deixar MAIS paradas
            # longe (>100 m, medidos sobre traçados reamostrados a 40 m)
            # do que deixa o traçado atual do painel
            longe_oficial, total_paradas = _conta_longe(
                paradas, _resample(list(escolhido.pontos), PASSO_AMOSTRA_M))
            shape_antigo = shapes_mapa.get(tid, "")
            pontos_antigos = pontos_atuais.get(shape_antigo)
            if pontos_antigos:
                longe_painel, _ = _conta_longe(
                    paradas, _resample(pontos_antigos, PASSO_AMOSTRA_M))
            else:
                longe_painel = total_paradas  # sem traçado atual: oficial melhor
            if longe_oficial > longe_painel:
                tab.nota(
                    "aviso", "SHAPE_SEMOB_REJEITADO_PARADAS",
                    f"linha {rsn} tid {tid}: o traçado oficial deixa {longe_oficial}"
                    f"/{total_paradas} paradas a mais de {TOLERANCIA_PARADAS_M:.0f} m "
                    f"(traçado do painel: {longe_painel}/{total_paradas}); "
                    "mantido o traçado do painel — oficial parece desatualizado",
                )
                continue
            sid_novo = _shape_id(rsn, escolhido.sentido)
            pontos_lista = list(escolhido.pontos)
            if sid_novo not in novos:
                novos[sid_novo] = [
                    {"shape_id": sid_novo,
                     "shape_pt_lat": f"{lat:.6f}",
                     "shape_pt_lon": f"{lon:.6f}",
                     "shape_pt_sequence": str(sequencia)}
                    for sequencia, (lat, lon) in enumerate(pontos_lista, start=1)
                ]
            antigo = shapes_mapa.get(tid)
            if antigo:
                substituidos.add(antigo)
            shapes_mapa[tid] = sid_novo
            convertidos += 1
        resultado[rsn] = convertidos
        if convertidos:
            tab.nota(
                "informacao", "SHAPE_SEMOB_SUBSTITUIDO",
                f"linha {rsn}: {convertidos} padrão(ões) de viagem usam o traçado "
                f"oficial SEMOB (ATUALIZACA {atualizacao or 's/ data'})",
            )

    # remove só o que ficou ÓRFÃO: tid compartilhado mantém o shape antigo vivo
    ainda_referenciados = set(shapes_mapa.values())
    orfaos = substituidos - ainda_referenciados
    if orfaos:
        tab.shapes = [s for s in tab.shapes if s["shape_id"] not in orfaos]
    for _, linhas in sorted(novos.items()):
        tab.shapes.extend(linhas)
    return resultado
