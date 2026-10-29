# Fonte Bus2 João Pessoa — endpoints REAIS do painel Mobilibus (projeto público 394).
#
# Tudo aqui foi MEDIDO por inspeção (docs/endpoints.md): POST /public/* com body
# {"data":"U2FsdGVkX1..."} (CryptoJS AES, frase pública do front client-side).
# As respostas são gravadas INTACTAS (ainda cifradas) — a decifração é tarefa
# da fase 2, que usa scraper.cryptojs (validado contra o par real capturado).

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from ..cache import (
    KIND_LISTA,
    KIND_TIMETABLE,
    caminho_do_arquivo,
    is_cached,
    save_atomic,
)
from ..cryptojs import cifrar_objeto, decifrar_objeto
from ..http_client import FetchResult, HttpError
from ..manifest import Manifest

# Frase PÚBLICA embutida no JavaScript do front do painel (ofuscação client-side;
# não dá acesso a conta nenhuma — é o mesmo valor que todo navegador executa).
FRASE_PUBLICA = "AL0EHMARC0"
BASE_PUBLIC = "https://painel.mobilibus.com/public/"
URL_LISTA = BASE_PUBLIC + "get-routes"
URL_TIMETABLE = BASE_PUBLIC + "get-timetable"

# project_id de João Pessoa, PB — medido no get-project (miniHash 2qloq), 2026-10-29.
PROJECT_ID = 394


class SupportsPost(Protocol):
    """O que o coletor precisa de um cliente HTTP (permite fakes nos testes)."""

    def post(self, url: str, body: bytes) -> FetchResult: ...


@dataclass(frozen=True)
class RouteRef:
    """Uma linha da lista geral: id na fonte + número exibido + nome."""

    rid: int
    rsn: str
    rln: str


@dataclass
class LineCollectResult:
    """O que aconteceu ao coletar os arquivos de UMA linha."""

    linha: str
    baixados: list[str] = field(default_factory=list)
    pulados_cache: list[str] = field(default_factory=list)
    erros: list[dict[str, object]] = field(default_factory=list)

    @property
    def faltando(self) -> list[str]:
        """Kinds esperados para ESTA linha que não vieram (nem download, nem cache)."""
        coletados = set(self.baixados) | set(self.pulados_cache)
        return [kind for kind in (KIND_TIMETABLE,) if kind not in coletados]


# ------------------------------------------------------------- transporte ----
def corpo_do_pedido(objeto: object) -> bytes:
    """Body cifrado no formato do site: {"data":"U2FsdGVkX1..."} em bytes."""
    envelope = {"data": cifrar_objeto(objeto, FRASE_PUBLICA)}
    return json.dumps(envelope).encode("utf-8")


def fetch_crudo(http: SupportsPost, url: str, objeto: object) -> FetchResult:
    """POST cifrado; devolve o FetchResult com a resposta HTTP intacta."""
    return http.post(url, corpo_do_pedido(objeto))


# ------------------------------------------------------------- payloads ------
def payload_lista() -> dict[str, object]:
    return {"projectId": PROJECT_ID, "agency": None}


def payload_timetable(rid: int) -> dict[str, object]:
    return {"routeId": rid, "date": None, "serviceIds": None}


# ---------------------------------------------------------------- coleta -----
def _relative(destino: Path, raw_dir: Path) -> str:
    return destino.relative_to(raw_dir).as_posix()


def _registrar_erro(
    manifest: Manifest,
    result: LineCollectResult,
    *,
    kind: str,
    url: str | None,
    params: dict[str, object] | None,
    status: int | None,
    error: str,
) -> None:
    # Erro registrado no manifest e na lista da linha — segue para o próximo.
    manifest.record_error(url=url, params=params, status=status, error=f"[{kind}] {error}")
    result.erros.append({"kind": kind, "status": status, "error": error, "url": url})


def collect_lista(
    *, raw_dir: Path, http: SupportsPost, force: bool = False
) -> Path:
    """Baixa (ou usa cache de) a lista geral de linhas → lista_geral.json."""
    raw_dir = Path(raw_dir)
    destino = caminho_do_arquivo(raw_dir, KIND_LISTA)
    if is_cached(destino) and not force:
        return destino
    manifest = Manifest(raw_dir)
    try:
        fetch = fetch_crudo(http, URL_LISTA, payload_lista())
    except (HttpError, ConnectionError) as exc:
        status = exc.status if isinstance(exc, HttpError) else None
        manifest.record_error(
            url=URL_LISTA, params=payload_lista(), status=status, error=str(exc)
        )
        raise
    save_atomic(destino, fetch.content)
    manifest.record_fetch(
        url=fetch.url,
        params=payload_lista(),
        status=fetch.status,
        saved_path=_relative(destino, raw_dir),
        content=fetch.content,
    )
    return destino


def extract_routes(payload: object) -> list[RouteRef]:
    """Converte a lista decifrada do get-routes em RouteRef (dedupe por rsn)."""
    if not isinstance(payload, list):
        raise ValueError("payload do get-routes não é uma lista de linhas")
    vistos: set[str] = set()
    rotas: list[RouteRef] = []
    for item in payload:
        if not isinstance(item, dict) or "rid" not in item or "rsn" not in item:
            continue
        rsn = str(item.get("rsn", "")).strip()
        rid_raw = item.get("rid")
        if not rsn or not isinstance(rid_raw, int) or rsn in vistos:
            continue
        vistos.add(rsn)
        rotas.append(RouteRef(rid=rid_raw, rsn=rsn, rln=str(item.get("rln", "")).strip()))
    return rotas


def ler_routes_do_disco(caminho: Path) -> list[RouteRef]:
    """Decifra o lista_geral.json cru e devolve a lista de linhas."""
    envelope = json.loads(caminho.read_text(encoding="utf-8"))
    if not isinstance(envelope, dict) or "data" not in envelope:
        raise ValueError("lista_geral.json não tem o envelope {'data': ...}")
    return extract_routes(decifrar_objeto(str(envelope["data"]), FRASE_PUBLICA))


def resolver_rota(
    rsn_procurado: str, *, raw_dir: Path, http: SupportsPost, force: bool = False
) -> RouteRef:
    """Acha a RouteRef pelo número da linha (iguala ignorando zeros à esquerda)."""
    alvo = rsn_procurado.strip().lstrip("0") or rsn_procurado.strip()
    caminho = collect_lista(raw_dir=raw_dir, http=http, force=force)
    for rota in ler_routes_do_disco(caminho):
        if rota.rsn.lstrip("0") == alvo:
            return rota
    raise ValueError(
        f"linha '{rsn_procurado}' não existe na lista geral (liste com collect --report"
        " ou veja lista_geral.json decifrado)"
    )


def collect_line(
    rid: int,
    rsn: str,
    *,
    raw_dir: Path,
    http: SupportsPost,
    force: bool = False,
) -> LineCollectResult:
    """Baixa (ou pula por cache) o timetable COMPLETO de uma linha. Resposta intacta."""
    raw_dir = Path(raw_dir)
    destino = caminho_do_arquivo(raw_dir, KIND_TIMETABLE, rsn)
    result = LineCollectResult(linha=rsn)
    if is_cached(destino) and not force:
        result.pulados_cache.append(KIND_TIMETABLE)
        return result
    manifest = Manifest(raw_dir)
    params = payload_timetable(rid)
    try:
        fetch = fetch_crudo(http, URL_TIMETABLE, params)
    except HttpError as exc:
        _registrar_erro(
            manifest, result,
            kind=KIND_TIMETABLE, url=exc.url, params=params, status=exc.status, error=str(exc),
        )
        return result
    except ConnectionError as exc:
        _registrar_erro(
            manifest, result,
            kind=KIND_TIMETABLE, url=URL_TIMETABLE, params=params,
            status=None, error=str(exc),
        )
        return result
    save_atomic(destino, fetch.content)
    manifest.record_fetch(
        url=fetch.url,
        params=params,
        status=fetch.status,
        saved_path=_relative(destino, raw_dir),
        content=fetch.content,
    )
    result.baixados.append(KIND_TIMETABLE)
    return result


def collect_all(
    *, raw_dir: Path, http: SupportsPost, force: bool = False
) -> list[LineCollectResult]:
    """Varre TODAS as linhas da lista; falha em uma não derruba a varredura."""
    raw = Path(raw_dir)
    manifest = Manifest(raw)
    try:
        caminho = collect_lista(raw_dir=raw, http=http, force=force)
        rotas = ler_routes_do_disco(caminho)
    except (HttpError, ConnectionError, ValueError, json.JSONDecodeError) as exc:
        manifest.record_error(url=URL_LISTA, params=None, status=None, error=str(exc))
        raise
    if not rotas:
        raise ValueError(
            "lista decifrada veio sem linhas — verifique o formato em docs/endpoints.md"
        )
    results: list[LineCollectResult] = []
    for rota in rotas:
        try:
            results.append(
                collect_line(rota.rid, rota.rsn, raw_dir=raw, http=http, force=force)
            )
        except Exception as exc:  # noqa: BLE001 — retomável: registra e continua
            manifest.record_error(
                url=URL_TIMETABLE, params={"rid": rota.rid, "rsn": rota.rsn},
                status=None, error=str(exc),
            )
            results.append(
                LineCollectResult(
                    linha=rota.rsn,
                    erros=[
                        {
                            "kind": KIND_TIMETABLE,
                            "status": None,
                            "error": str(exc),
                            "url": URL_TIMETABLE,
                        }
                    ],
                )
            )
    return results
