# Operadoras (agências) reais de João Pessoa, descobertas no site oficial da SEMOB-JP.
#
# Fonte primária: campo "EMPRESA" das properties do endpoint público
#   https://servicos.semobjp.pb.gov.br/linhas-de-onibus/<linha>/itinerario/geojson
# Coletado por tools/scraper/coleta_metadados_semob.py e congelado em
#   data/gtfs/_SEMOB_METADADOS.json
#
# Regras:
#   * Nenhuma operadora é inferida. Só entra o que a SEMOB publica.
#   * Linha sem traçado publicado (geojson vazio) fica SEM_OPERADORA, o que o
#     relatório marca como aviso — nunca um palpite.
#   * A grafia do nome é a da fonte (maiúsculas, sem acento), preservada de propósito.

from __future__ import annotations

from datetime import date
from typing import Any

# Código interno (estável, vai para o GTFS) -> nome como a SEMOB escreve.
# A ordem é a de maior frota publicada.
OPERADORAS: dict[str, str] = {
    "REUNIDAS": "REUNIDAS",
    "TRANSNACIONAL": "TRANSNACIONAL",
    "SAO_JORGE": "S\u00c3O JORGE",
    "SANTA_MARIA": "SANTA MARIA",
    "MARCOS_DA_SILVA": "MARCOS DA SILVA",
    "NAVEGANTES": "NAVEGANTES",
    "MANDACARUENSE": "MANDACARUENSE",
}

# Siglas do painel Mobilibus -> sigla publicada pela SEMOB, quando divergem.
# "1001" no painel corresponde à "1001M - BAIRRO DAS INDUSTRIAS/MANDACARU"
# da SEMOB; a variante "1001S - ... - SJ02" é outra linha e não é a nossa.
ALIAS_SIGLA: dict[str, str] = {"1001": "1001M"}

# Chave usada quando a SEMOB não publica operadora para a linha.
SEM_OPERADORA = "SEM_OPERADORA"
NOME_SEM_OPERADORA = "SEMOB - operadora não publicada (dado ausente ou desatualizado)"

# O campo EMPRESA vem junto do traçado, cuja data (ATUALIZACA) pode ser antiga:
# medido em 2026-10, 35% dos registros tinham traçado com 4+ anos e 18% sem data.
# Não é seguro afirmar "quem opera hoje" a partir de um traçado de 2018 — se as
# operadoras mudaram (a Mandacaruense, por exemplo, deixou de operar segundo
# relato de usuário), o campo estaria errado.
#
# Estratégia adotada: publicamos a operadora declarada pela SEMOB (é dado oficial),
# mas NUNCA sem a ressalva de quando foi declarada. Todo `route_desc` carrega
# "operadora declarada <ano>: NOME", e o relatório explica a limitação. Assim o
# consumidor tem a informação útil e sabe que ela não é confirmação do dia.
# Quem quiser ser estrito filtra por agency_id; quem quiser o rótulo completo lê
# route_desc. Inferir operadora "atual" não-nula por conta própria não seria dado.
IDADE_MAXIMA_ANOS: float | None = None

URL_SEMOB = "https://servicos.semobjp.pb.gov.br/linhas-de-onibus/"


def normalizar_empresa(bruto: object) -> str | None:
    """'S\u00c3O JORGE' -> 'SAO_JORGE' (chave estável); devolve None se vazio/desconhecido."""
    if not isinstance(bruto, str):
        return None
    texto = bruto.strip().upper()
    if not texto:
        return None
    chave = _chave(texto)
    if chave in OPERADORAS:
        return chave
    # aceita variações de acento/espaçamento
    for conhecida in OPERADORAS:
        if _chave(OPERADORAS[conhecida]) == chave:
            return conhecida
    return None


def _chave(texto: str) -> str:
    return (
        texto.replace("Á", "A")
        .replace("Â", "A")
        .replace("Ã", "A")
        .replace("É", "E")
        .replace("Ê", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ô", "O")
        .replace("Õ", "O")
        .replace("Ú", "U")
        .replace("Ç", "C")
        .replace(" ", "_")
        .replace("-", "_")
    )


def operadoras_de(metadados: dict[str, Any]) -> dict[str, str]:
    """Mapa route_short_name -> código de operadora a partir do JSON da SEMOB.

    Considera os dois sentidos (IDA/VOLTA) e ignora divergências (não ocorreram na
    coleta, mas se voltarem a ocorrer a linha fica SEM_OPERADORA em vez de chutar).

    Só vale operadora de traçado recente: um EMPRESA de 2018 não prova quem opera
    hoje (ver IDADE_MAXIMA_ANOS).
    """
    linhas = metadados.get("linhas") or {}
    saida: dict[str, str] = {}
    for sigla_painel, info in linhas.items():
        sentidos = info.get("sentidos") or {}
        if not _tem_tracado_recente(sentidos):
            continue
        achadas = {
            codigo
            for props in sentidos.values()
            if (codigo := normalizar_empresa(props.get("empresa"))) is not None
        }
        if len(achadas) == 1:
            saida[str(sigla_painel)] = achadas.pop()
        # 0 ou >1 operadoras: não define (fica SEM_OPERADORA na montagem)
    return saida


def _tem_tracado_recente(
    sentidos: dict[str, Any], referencia: date | None = None
) -> bool:
    """True se algum sentido tem ATUALIZACA dentro de IDADE_MAXIMA_ANOS.

    IDADE_MAXIMA_ANOS = None desliga o filtro (todas as linhas passam).
    """
    if IDADE_MAXIMA_ANOS is None:
        return True
    referencia = referencia or date.today()
    for props in sentidos.values():
        bruto = str(props.get("atualizacao") or "")[:10]
        if not bruto or bruto.startswith("1899"):
            continue
        try:
            quando = date.fromisoformat(bruto.replace("/", "-"))
        except ValueError:
            continue
        if (referencia - quando).days / 365.25 <= IDADE_MAXIMA_ANOS:
            return True
    return False


def idade_operadora(metadados: dict[str, Any]) -> dict[str, str]:
    """Ano/data do dado que sustenta cada operadora (para o relatório)."""
    saida: dict[str, str] = {}
    for sigla, info in (metadados.get("linhas") or {}).items():
        datas = sorted(
            str(p.get("atualizacao") or "")[:10]
            for p in (info.get("sentidos") or {}).values()
            if p.get("atualizacao")
        )
        saida[str(sigla)] = datas[-1] if datas else ""
    return saida


def operadora_declarada(metadados: dict[str, Any], sigla: str) -> str | None:
    """Operadora que a SEMOB declara para a linha, mesmo em traçado antigo.

    Serve para `route_desc`/diagnóstico: o nome aparece rotulado com o ano, então
    o consumidor sabe que é declaração histórica, não confirmação atual.
    """
    info = (metadados.get("linhas") or {}).get(sigla) or {}
    achadas = {
        codigo
        for props in (info.get("sentidos") or {}).values()
        if (codigo := normalizar_empresa(props.get("empresa"))) is not None
    }
    return achadas.pop() if len(achadas) == 1 else None


def descricao_rota(metadados: dict[str, Any], sigla: str) -> str:
    """route_desc com o que a SEMOB publica: tipo, km por sentido e operadora.

    A operadora vem seguida do ano do traçado (ex.: "operadora declarada 2019")
    quando o dado é antigo, para não passar por confirmação atual. Vazio quando
    não há nada publicado.
    """
    info = (metadados.get("linhas") or {}).get(sigla) or {}
    sentidos = info.get("sentidos") or {}
    partes: list[str] = []

    tipos = sorted({str(p.get("tipo")) for p in sentidos.values() if p.get("tipo")})
    if tipos:
        partes.append(" / ".join(titulo_linha(t) for t in tipos))

    kms = [
        (nome, float(p["extensao_km"]))
        for nome, p in sentidos.items()
        if isinstance(p.get("extensao_km"), (int, float))
    ]
    if kms:
        partes.append(
            " · ".join(f"{nome.lower()} {km:.2f} km" for nome, km in sorted(kms))
        )

    operadora = operadora_declarada(metadados, sigla)
    if operadora:
        ano = (idade_operadora(metadados).get(sigla) or "")[:4]
        if ano and not ano.startswith("1899"):
            partes.append(f"operadora declarada {ano}: {OPERADORAS[operadora]}")
        else:
            partes.append(f"operadora declarada (sem data): {OPERADORAS[operadora]}")
    return " | ".join(partes)


def titulo_linha(tipo: str) -> str:
    """'TRANSVERSAL' -> 'Transversal' (mantém siglas sem valor estético)."""
    return tipo.strip().capitalize() if tipo.strip() else ""


def agency_id_de(sigla: str, mapa: dict[str, str]) -> str:
    """Código da operadora da linha; SEM_OPERADORA quando a SEMOB não publica."""
    return mapa.get(sigla, SEM_OPERADORA)


def tabela_agency(mapa: dict[str, str], siglas_do_feed: list[str]) -> list[dict[str, str]]:
    """agency.txt com todas as operadoras usadas por alguma linha do feed.

    `siglas_do_feed` é necessário para saber se SEM_OPERADORA é usada: linhas sem
    operadora publicada não aparecem em `mapa`.
    """
    usadas = set(mapa.values())
    if any(agency_id_de(sigla, mapa) == SEM_OPERADORA for sigla in siglas_do_feed):
        usadas.add(SEM_OPERADORA)
    linhas: list[dict[str, str]] = []
    for codigo, nome in OPERADORAS.items():
        if codigo not in usadas:
            continue
        linhas.append(
            {
                "agency_id": codigo,
                "agency_name": nome,
                "agency_url": URL_SEMOB,
                "agency_timezone": "America/Sao_Paulo",
                "agency_lang": "pt-BR",
            }
        )
    if SEM_OPERADORA in usadas:
        linhas.append(
            {
                "agency_id": SEM_OPERADORA,
                "agency_name": NOME_SEM_OPERADORA,
                "agency_url": URL_SEMOB,
                "agency_timezone": "America/Sao_Paulo",
                "agency_lang": "pt-BR",
            }
        )
    return linhas
