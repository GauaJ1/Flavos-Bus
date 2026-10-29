"""Configurações centrais do coletor — tudo em um lugar só.

Toda variável pode ser sobrescrita por variável de ambiente (FLAVOS_*).
"""

from __future__ import annotations

import os
from pathlib import Path

# Contato que vai no User-Agent (requisito de coleta identificável).
# TODO: troque YOUR_EMAIL_HERE por um e-mail real (variável FLAVOS_CONTACT_EMAIL).
CONTACT_EMAIL = os.environ.get("FLAVOS_CONTACT_EMAIL", "YOUR_EMAIL_HERE")
USER_AGENT = f"FlavosBus-DataCollector/0.1 (contato: {CONTACT_EMAIL})"

# Rede: timeout por requisição, pausa entre requisições e tentativas com backoff.
REQUEST_TIMEOUT_S = float(os.environ.get("FLAVOS_TIMEOUT_S", "15"))
PAUSE_BETWEEN_REQUESTS_S = float(os.environ.get("FLAVOS_PAUSE_S", "1.0"))
MAX_RETRIES = int(os.environ.get("FLAVOS_MAX_RETRIES", "3"))
BACKOFF_BASE_S = 1.0  # 1s → 2s → 4s


def _repo_root() -> Path:
    """Raiz do monorepo (este arquivo vive em <raiz>/tools/scraper/scraper/)."""
    return Path(__file__).resolve().parents[3]


def raw_dir() -> Path:
    """Pasta de saída data/raw/ (override por FLAVOS_RAW_DIR para testes)."""
    override = os.environ.get("FLAVOS_RAW_DIR")
    return Path(override) if override else _repo_root() / "data" / "raw"
