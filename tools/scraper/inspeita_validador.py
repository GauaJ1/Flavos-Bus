# Inspeciona a estrutura real do report.json do validator v8 (chaves/valores).

from __future__ import annotations

import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent / ".tmp" / "gv" / "out"
dados = json.loads((PASTA / "report.json").read_text(encoding="utf-8"))
print("top-level keys:", sorted(dados.keys()))
print("\nsummary:", json.dumps(dados.get("summary"), indent=2)[:1200])
print("\n1a notice completa:")
for notice in dados.get("notices", [])[:1]:
    print(json.dumps(notice, indent=2)[:1500])
print("\ntodas notices (code, severity, total_notices, samples):")
for notice in dados.get("notices", []):
    print(
        " ",
        notice.get("code"),
        notice.get("severity"),
        notice.get("total_notices"),
        "samples:", len(notice.get("samples", []) or []),
    )
