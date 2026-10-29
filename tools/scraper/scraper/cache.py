# Cache em disco com nomes previsíveis: se o arquivo já existe, não baixa de novo.
#
# Layout em data/raw/ (respostas salvas INTACTAS, byte a byte, ainda cifradas
# no formato {"data":"U2FsdGVkX1..."} que a fonte devolve):
#
#     data/raw/_manifest.json                 # histórico de tudo que foi baixado
#     data/raw/lista_geral.json               # get-routes (todas as linhas)
#     data/raw/linha_0510/timetable.json      # get-timetable completo da linha 0510
#     data/raw/linha_I008/timetable.json      # (idem para cada linha)
#
# Uma coleta por linha basta: o timetable traz viagens, paradas com horários,
# shape e os serviços por dia da semana (útil/sábado/domingo) embutidos.

from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path

KIND_LISTA = "lista_geral"
KIND_TIMETABLE = "timetable"

_CARACTERES_SEGUROS = re.compile(r"[^A-Za-z0-9._-]")


def nome_da_pasta(rsn: str) -> str:
    """Nome de pasta seguro a partir do número da linha (ex.: '0510' → 'linha_0510')."""
    seguro = _CARACTERES_SEGUROS.sub("_", rsn).strip("._-") or "linha"
    return f"linha_{seguro}"


def pasta_da_linha(raw_dir: Path, rsn: str) -> Path:
    return raw_dir / nome_da_pasta(rsn)


def caminho_do_arquivo(raw_dir: Path, kind: str, rsn: str | None = None) -> Path:
    """Caminho final do artefato cru de acordo com o tipo."""
    if kind == KIND_LISTA:
        return raw_dir / "lista_geral.json"
    if kind == KIND_TIMETABLE:
        if rsn is None:
            raise ValueError("timetable exige o número da linha (rsn)")
        return pasta_da_linha(raw_dir, rsn) / "timetable.json"
    raise ValueError(f"tipo desconhecido: {kind}")


def is_cached(path: Path) -> bool:
    # Já existe conteúdo salvo e não vazio?
    return path.is_file() and path.stat().st_size > 0


def save_atomic(path: Path, content: bytes) -> None:
    # Gravação atômica: escreve em .tmp e só depois substitui o arquivo final.
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(content)
    os.replace(tmp, path)


def sha256_hex(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
