"""Cliente HTTP único: User-Agent identificável, pausa, timeout e retry com backoff.

- Pausa configurável entre requisições (padrão 1 s) — coleta leve, sem sobrecarregar.
- Retry (padrão 3 tentativas) só para erros de rede, HTTP 429 e 5xx (backoff 1s→2s→4s).
- HTTP 4xx (exceto 429) não é repetido: levanta HttpError com o status.
- As respostas voltam como BYTES originais — nada é alterado antes de salvar.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Protocol

import requests

from . import config


class SessionLike(Protocol):
    """O mínimo de sessão que o cliente usa (fazível com fakes nos testes)."""

    headers: Any

    def get(self, url: str, *args: Any, **kwargs: Any) -> Any: ...

    def post(self, url: str, *args: Any, **kwargs: Any) -> Any: ...


class HttpError(RuntimeError):
    """Falha permanente (HTTP 4xx): não adianta repetir a mesma chamada."""

    def __init__(self, status: int, url: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.url = url


@dataclass
class FetchResult:
    """Resultado bruto de uma requisição bem-sucedida (2xx/3xx)."""

    url: str
    params: dict[str, object] | None
    status: int
    content: bytes
    collected_at_utc: str
    attempts: int


class HttpClient:
    """Sessão com identificação clara + limite de ritmo + retry/backoff."""

    def __init__(
        self,
        session: SessionLike | None = None,
        pause_s: float | None = None,
        timeout_s: float | None = None,
        max_retries: int | None = None,
        backoff_base_s: float | None = None,
        sleep_fn: Callable[[float], None] = time.sleep,
        clock_fn: Callable[[], float] = time.monotonic,
    ) -> None:
        self.session: SessionLike = session if session is not None else requests.Session()
        self.session.headers.update(
            {"User-Agent": config.USER_AGENT, "Accept": "application/json, */*"}
        )
        self.pause_s = config.PAUSE_BETWEEN_REQUESTS_S if pause_s is None else pause_s
        self.timeout_s = config.REQUEST_TIMEOUT_S if timeout_s is None else timeout_s
        self.max_retries = config.MAX_RETRIES if max_retries is None else max_retries
        self.backoff_base_s = config.BACKOFF_BASE_S if backoff_base_s is None else backoff_base_s
        self._sleep = sleep_fn
        self._clock = clock_fn
        self._last_request_at: float | None = None

    def get(self, url: str, params: dict[str, object] | None = None) -> FetchResult:
        """GET com ritmo limitado e retry; devolve a resposta intacta."""
        resultado = self._com_retry(
            lambda: self.session.get(url, params=params, timeout=self.timeout_s),
            url,
            params=params,
        )
        return resultado

    def post(self, url: str, body: bytes) -> FetchResult:
        """POST de corpo pronto (bytes) com ritmo limitado e retry; resposta intacta."""
        return self._com_retry(
            lambda: self.session.post(
                url,
                data=body,
                timeout=self.timeout_s,
                headers={"Content-Type": "application/json"},
            ),
            url,
        )

    def _com_retry(
        self,
        enviar: Callable[[], Any],
        url: str,
        params: dict[str, object] | None = None,
    ) -> FetchResult:
        """Núcleo comum: throttle, tentativas, backoff e classificação de erro."""
        last_exception: Exception | None = None
        last_message = ""

        for attempt in range(1, self.max_retries + 1):
            self._throttle()
            try:
                response = enviar()
            except requests.RequestException as exc:
                last_exception = exc
                last_message = f"erro de rede ({type(exc).__name__})"
            else:
                if response.status_code < 400:
                    return FetchResult(
                        url=str(getattr(response, "url", url)),
                        params=params,
                        status=response.status_code,
                        content=response.content,
                        collected_at_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        attempts=attempt,
                    )
                if response.status_code < 500 and response.status_code != 429:
                    destino = str(getattr(response, "url", url))
                    raise HttpError(
                        response.status_code,
                        destino,
                        f"HTTP {response.status_code} — não vou repetir ({destino})",
                    )
                # 429 (excesso de chamadas) e 5xx valem nova tentativa, com backoff.
                last_message = f"HTTP {response.status_code}"

            if attempt < self.max_retries:
                self._sleep(self.backoff_base_s * (2 ** (attempt - 1)))

        raise ConnectionError(
            f"Não consegui baixar {url} após {self.max_retries} tentativas: {last_message}"
        ) from last_exception

    def _throttle(self) -> None:
        """Espera a pausa configurada entre uma requisição e outra."""
        if self._last_request_at is not None and self.pause_s > 0:
            remaining = self.pause_s - (self._clock() - self._last_request_at)
            if remaining > 0:
                self._sleep(remaining)
        self._last_request_at = self._clock()
