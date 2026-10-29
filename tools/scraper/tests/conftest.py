# Fixtures dos testes — NENHUM acesso à internet: tudo offline e sintético.
# O FakeHttp roda a MESMA cifra do painel: recebe o pedido CIFRADO (e o decifra
# para provar que o coletor cifrou direito) e devolve a resposta CIFRADA.

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from scraper.cryptojs import cifrar_objeto, decifrar_objeto
from scraper.http_client import FetchResult, HttpError
from scraper.sources.bus2 import FRASE_PUBLICA

FIXTURES = Path(__file__).parent / "fixtures"


def fixture_json(name: str) -> Any:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def envelope_bytes(objeto: object) -> bytes:
    """Body exatamente no formato do painel: {"data":"U2FsdGVkX1..."}."""
    return json.dumps({"data": cifrar_objeto(objeto, FRASE_PUBLICA)}).encode("utf-8")


class FakeHttp:
    """HttpClient de mentira sobre POST cifrado: escolhe resposta pelo path final."""

    def __init__(
        self,
        respostas: dict[str, object] | None = None,
        fail_paths: set[str] | None = None,
    ) -> None:
        self.respostas = respostas if respostas is not None else {}
        self.fail_paths = fail_paths if fail_paths is not None else set()
        self.headers: dict[str, str] = {}
        self.posts: list[tuple[str, object]] = []  # (url, objeto decifrado do pedido)
        self.contents: dict[str, bytes] = {}  # path → bytes devolvidos (raw)

    def post(self, url: str, body: bytes | None = None) -> FetchResult:
        assert body is not None
        envelope = json.loads(body.decode("utf-8"))
        objeto = decifrar_objeto(str(envelope["data"]), FRASE_PUBLICA)
        self.posts.append((url, objeto))
        path = url.rstrip("/").split("/")[-1]
        if path in self.fail_paths:
            raise HttpError(404, url, f"HTTP 404 — falha forçada pelo teste ({path})")
        resposta = self.respostas.get(path, {})
        content = envelope_bytes(resposta)
        self.contents[path] = content
        return FetchResult(
            url=url,
            params=None,
            status=200,
            content=content,
            collected_at_utc="2026-10-29T00:00:00Z",
            attempts=1,
        )

    def calls(self) -> int:
        return len(self.posts)


@pytest.fixture
def fake_http() -> FakeHttp:
    """HTTP falso com a lista (2 linhas) e um timetable-modelo, tudo sintético."""
    return FakeHttp(
        respostas={
            "get-routes": fixture_json("routes_lista.json"),
            "get-timetable": fixture_json("timetable_0510.json"),
        }
    )
