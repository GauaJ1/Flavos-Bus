# Regra do LineBadge (correcao 4 do redesign): o numeral e grande e bold
# (>=19px, peso 700), portanto o limiar e 3:1 sobre o fundo da linha.
# - Par do feed (text_color x color) >= 3:1 -> mantem as cores do feed.
# - Par do feed < 3:1 -> o app troca APENAS o texto para preto ou branco
#   (o de maior contraste); o fundo continua sendo o dado oficial do feed.
# Propriedade de seguranca para feeds futuros: para QUALQUER fundo,
# max(contraste(preto), contraste(branco)) >= 4.583 > 4.5 — logo a escolha
# automatica SEMPRE satisfaz até o limiar AA de texto normal.
import math
import sqlite3
from pathlib import Path


def _srgb(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _lum(hex_: str) -> float:
    h = hex_.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _srgb(r) + 0.7152 * _srgb(g) + 0.0722 * _srgb(b)


def ratio(fg: str, bg: str) -> float:
    lf, lb = _lum(fg), _lum(bg)
    hi, lo = max(lf, lb), min(lf, lb)
    return (hi + 0.05) / (lo + 0.05)


def _banco() -> Path:
    p = Path(__file__).resolve()
    for pai in [p, *p.parents]:
        alvo = pai / "data" / "gtfs" / "flavos.sqlite"
        if alvo.exists():
            return alvo
    raise FileNotFoundError("flavos.sqlite ausente")


def _linhas():
    con = sqlite3.connect(_banco())
    try:
        return con.execute(
            "SELECT route_id, short_name, color, text_color FROM routes"
            " WHERE color IS NOT NULL AND trim(color)<>''"
        ).fetchall()
    finally:
        con.close()


def test_pior_caso_da_escolha_automatica_passa_de_45() -> None:
    # para qualquer luminancia L de fundo, o melhor entre preto e branco
    # rende >= (0.2291.../0.05) = 4.583 — a escolha automatica nunca falha AA
    melhor = min(
        max((L + 0.05) / 0.05, 1.05 / (L + 0.05)) for L in [i / 1000 for i in range(0, 1001)]
    )
    assert melhor >= 4.58, round(melhor, 3)
    assert math.isclose(melhor, 4.583, rel_tol=0.01)


def test_badges_do_feed_atendem_a_regra_3_para_1() -> None:
    precisam_override = []
    for route_id, short_name, color, text_color in _linhas():
        fundo = "#" + color.lstrip("#").upper()
        texto_feed = "#" + text_color.lstrip("#").upper()
        if ratio(texto_feed, fundo) >= 3.0:
            continue
        rb = ratio("#000000", fundo)
        rw = ratio("#FFFFFF", fundo)
        escolhido = "#000000" if rb >= rw else "#FFFFFF"
        assert max(rb, rw) >= 4.5, (short_name, fundo)
        precisam_override.append(
            {"route_id": route_id, "linha": short_name, "fundo": fundo,
             "ratio_feed": round(ratio(texto_feed, fundo), 2), "texto_usado": escolhido}
        )
    ids = {p["linha"] for p in precisam_override}
    # feed atual: exatamente as 3 linhas executivas cinzas
    assert ids == {"E550", "E551", "E600"}, ids
