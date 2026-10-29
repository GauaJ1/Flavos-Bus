"""Retry, backoff, throttle e códigos HTTP do cliente — sessão falsa, zero rede."""

from __future__ import annotations

import pytest
import requests

from scraper.http_client import HttpClient, HttpError


class FakeResponse:
    def __init__(self, status_code: int, content: bytes = b"{}") -> None:
        self.status_code = status_code
        self.content = content
        self.url = "https://bus.test/x"


class FakeSession:
    """Devolve os status na ordem; quando a lista acaba, repete o último."""

    def __init__(self, statuses: list[int]) -> None:
        self.statuses = list(statuses)
        self.headers: dict[str, str] = {}
        self.calls = 0

    def get(self, url: str, params: object = None, timeout: object = None) -> FakeResponse:
        self.calls += 1
        status = self.statuses.pop(0) if len(self.statuses) > 1 else self.statuses[0]
        return FakeResponse(status)

    def post(
        self, url: str, data: object = None, timeout: object = None,
        headers: object = None,
    ) -> FakeResponse:
        return self.get(url, None, timeout)


class BoomSession(FakeSession):
    """Sessão que sempre levanta erro de rede (sem usar a lista de status)."""

    def get(self, url: str, params: object = None, timeout: object = None) -> FakeResponse:
        self.calls += 1
        raise requests.ConnectionError("rede fora (simulada)")


def test_user_agent_identificavel() -> None:
    client = HttpClient(session=FakeSession([200]))
    assert client.session.headers["User-Agent"].startswith("FlavosBus-DataCollector/0.1")
    assert "(contato:" in client.session.headers["User-Agent"]


def test_retry_5xx_com_backoff_exponencial() -> None:
    sleeps: list[float] = []
    client = HttpClient(session=FakeSession([500, 503, 200]), pause_s=0, sleep_fn=sleeps.append)
    result = client.get("https://bus.test/x")
    assert (result.status, result.attempts) == (200, 3)
    assert sleeps == [1.0, 2.0]  # backoff 1s → 2s


def test_429_tambem_repete() -> None:
    sleeps: list[float] = []
    client = HttpClient(session=FakeSession([429, 200]), pause_s=0, sleep_fn=sleeps.append)
    assert client.get("https://bus.test/x").status == 200
    assert sleeps == [1.0]


def test_4xx_nao_repete() -> None:
    session = FakeSession([404])
    client = HttpClient(session=session, pause_s=0, sleep_fn=lambda s: None)
    with pytest.raises(HttpError) as excinfo:
        client.get("https://bus.test/x")
    assert excinfo.value.status == 404
    assert session.calls == 1


def test_erro_de_rede_esgota_tentativas() -> None:
    session = BoomSession([])
    client = HttpClient(session=session, pause_s=0, max_retries=3, sleep_fn=lambda s: None)
    with pytest.raises(ConnectionError):
        client.get("https://bus.test/x")
    assert session.calls == 3


def test_pausa_antes_de_cada_requisicao() -> None:
    sleeps: list[float] = []
    client = HttpClient(
        session=FakeSession([200, 200]),
        pause_s=0.5,
        clock_fn=lambda: 0.0,  # relógio congelado: sempre deve esperar a pausa cheia
        sleep_fn=sleeps.append,
    )
    client.get("https://bus.test/x")
    client.get("https://bus.test/x")
    assert sleeps == [0.5]  # na 1ª chamada ainda não há pausa; na 2ª, sim


def test_post_tem_as_mesmas_garantias_do_get() -> None:
    sleeps: list[float] = []
    client = HttpClient(session=FakeSession([500, 503, 200]), pause_s=0, sleep_fn=sleeps.append)
    result = client.post("https://painel.test/get-routes", body=b'{"data":"x"}')
    assert (result.status, result.attempts) == (200, 3)
    assert sleeps == [1.0, 2.0]
