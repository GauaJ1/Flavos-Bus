# Crítica objetiva do dashboard: razão de contraste WCAG de todos os pares
# texto/fundo usados, nos DOIS temas, e checagens estruturais do HTML gerado.

from __future__ import annotations

import re
from pathlib import Path

ARQ = Path(__file__).resolve().parent.parent.parent / "docs" / "dashboard_semob.html"
html_txt = ARQ.read_text(encoding="utf-8")


def _lin(c: str) -> float:
    c = c.strip()
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (1, 3, 5))
    def f(x: float) -> float:
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contraste(a: str, b: str) -> float:
    la, lb = _lin(a), _lin(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


pares = [
    # (nome, texto, fundo, mínimo exigido)
    ("claro tinta/bg", "#152641", "#f6f8fb", 4.5),
    ("claro tinta2/superficie", "#4b5b70", "#ffffff", 4.5),
    ("claro chip ok", "#0f766e", "#eef2f8", 4.5),
    ("claro chip alerta", "#c2410c", "#eef2f8", 4.5),
    ("claro tag509 (branco/azul)", "#ffffff", "#1d4ed8", 4.5),
    ("claro kpi atencao", "#c2410c", "#ffffff", 3.0),
    ("claro kpi bom", "#0f766e", "#ffffff", 3.0),
    ("claro barras fresca/branco", "#ffffff", "#15803d", 3.0),
    ("claro barras defasada/branco", "#ffffff", "#c2410c", 3.0),
    ("claro barras sem-data/branco", "#ffffff", "#64748b", 3.0),
    ("claro barras aceitavel/branco", "#ffffff", "#a16207", 3.0),
    ("escuro tinta/bg", "#e8eef7", "#0b1220", 4.5),
    ("escuro tinta2/superficie", "#9fb0c5", "#111a2b", 4.5),
    ("escuro chip ok", "#34d399", "#18233a", 4.5),
    ("escuro chip alerta", "#fb923c", "#18233a", 4.5),
    ("escuro tag509", "#0b1220", "#7ca9ff", 4.5),
    ("escuro kpi atencao", "#fb923c", "#111a2b", 3.0),
    ("escuro barras destaque", "#7ca9ff", "#111a2b", 3.0),
    ("escuro barras ok", "#34d399", "#111a2b", 3.0),
]

falhas = []
for nome, a, b, minimo in pares:
    r = contraste(a, b)
    marca = "OK " if r >= minimo else "FALHA"
    if r < minimo:
        falhas.append((nome, r, minimo))
    print(f"[{marca}] {nome}: {r:.2f}:1 (min {minimo})")

print()
checagens = [
    ("título da página", "<title>Flavos Bus" in html_txt),
    ("lang pt-BR", '<html lang="pt-BR">' in html_txt),
    ("viewport", 'name="viewport"' in html_txt),
    ("6 nós do pipeline", html_txt.count('class="n ') == 6),
    ("setas do pipeline (6)", html_txt.count('class="arq') == 6),
    ("bloco 0509 destacado", 'id="linha-509"' in html_txt),
    ("tabela de rodadas populada", "baseline" in html_txt.lower()
     and html_txt.count("<tr>") >= 4),
    ("12 piores na tabela", html_txt.count("<th scope=\"row\">") == 12),
    ("cards de caso (3)", html_txt.count('<article class="caso">') == 3
     and 'class="caso"' in html_txt),
    ("SVG com aria-label", html_txt.count('aria-label=') >= 3),
    ("sem emoji como ícone", not re.search(r"[\U0001F300-\U0001FAFF]", html_txt)),
    ("sem scripts externos", "<script" not in html_txt),
    ("reduced-motion respeitado", "prefers-reduced-motion" in html_txt),
    ("dark scheme automático", "prefers-color-scheme: dark" in html_txt),
    ("rodapé com forma de regenerar", "gera_dashboard.py" in html_txt),
]
for nome, ok in checagens:
    print(("[OK ] " if ok else "[FALHA] ") + nome)
    if not ok:
        falhas.append((nome, -1, 0))

print()
print("FALHAS:", len(falhas), [f[0] for f in falhas] if falhas else "nenhuma")
raise SystemExit(1 if falhas else 0)
