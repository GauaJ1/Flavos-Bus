# Mostra samplesNotices de cada WARNING do validator oficial.

from __future__ import annotations

import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent / ".tmp" / "gv" / "out"
dados = json.loads((PASTA / "report.json").read_text(encoding="utf-8"))
for notice in dados.get("notices", []):
    print(notice["code"], "=>", notice["totalNotices"])
    for amostra in (notice.get("sampleNotices") or [])[:2]:
        print("   ", json.dumps(amostra, ensure_ascii=False)[:400])
