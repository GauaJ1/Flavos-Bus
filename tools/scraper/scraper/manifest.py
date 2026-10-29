"""Registro de cada baixada em data/raw/_manifest.json.

Cada entrada guarda: URL, data/hora (UTC), parâmetros, status HTTP,
sha256 e tamanho do conteúdo, caminho salvo e mensagem de erro (se houve).
Gravação atômica para não corromper o registro.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

from .cache import sha256_hex


def _now_utc() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


class Manifest:
    FILENAME = "_manifest.json"

    def __init__(self, raw_dir: Path) -> None:
        self.path = raw_dir / self.FILENAME

    def load(self) -> list[dict[str, object]]:
        """Lê as entradas; arquivo ausente → lista vazia."""
        if not self.path.is_file():
            return []
        payload = json.loads(self.path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError(f"{self.path}: esperava uma lista de entradas")
        return payload

    def record_fetch(
        self,
        *,
        url: str,
        params: dict[str, object] | None,
        status: int,
        saved_path: str,
        content: bytes,
    ) -> dict[str, object]:
        entry: dict[str, object] = {
            "url": url,
            "method": "GET",
            "params": params or {},
            "collected_at_utc": _now_utc(),
            "status": status,
            "saved_path": saved_path,
            "sha256": sha256_hex(content),
            "size_bytes": len(content),
            "error": None,
        }
        self._append(entry)
        return entry

    def record_error(
        self,
        *,
        url: str | None,
        params: dict[str, object] | None,
        status: int | None,
        error: str,
    ) -> dict[str, object]:
        """Falha registrada no manifest antes de seguir para a próxima linha."""
        entry: dict[str, object] = {
            "url": url,
            "method": "GET",
            "params": params or {},
            "collected_at_utc": _now_utc(),
            "status": status,
            "saved_path": None,
            "sha256": None,
            "size_bytes": 0,
            "error": error,
        }
        self._append(entry)
        return entry

    def _append(self, entry: dict[str, object]) -> None:
        entries = self.load()
        entries.append(entry)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_name(self.path.name + ".tmp")
        tmp.write_text(
            json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        os.replace(tmp, self.path)
