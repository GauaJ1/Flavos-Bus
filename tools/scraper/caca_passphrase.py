# Caça à passphrase CryptoJS usada pelo painel Mobilibus.
# Baixa o HTML e os bundles JS do painel e do portal (páginas públicas),
# procura marcadores de cifra AES e salva os trechos com contexto em
# caca_passphrase.txt — sem inventar chave: só o que aparecer de fato.

from __future__ import annotations

import re
from pathlib import Path

import requests

PASTA = Path(__file__).resolve().parent
RELATORIO = PASTA / "caca_passphrase.txt"
UA = "FlavosBus-DataCollector/0.1 (contato: YOUR_EMAIL_HERE) - reconhecimento tecnico"
PAGINAS = [
    "https://painel.mobilibus.com/bus2you/home?p=2qloq",
    "https://bus2.mobilibus.com.br/pb/joao-pessoa/",
]
MARCADORES = [
    "AES.encrypt",
    "AES[",
    "CryptoJS",
    "U2FsdGVk",
    "enc.Utf8",
    "mode.CBC",
    "pad.Pkcs7",
    "decrypt",
    "passphrase",
    "colet",
]
PADRAO_MARCADORES = re.compile("|".join(re.escape(m) for m in MARCADORES), re.IGNORECASE)


def principais_trechos(texto: str, raio: int = 160, maximo: int = 12) -> list[str]:
    achados: list[str] = []
    for correspondencia in PADRAO_MARCADORES.finditer(texto):
        inicio = max(0, correspondencia.start() - raio)
        fim = min(len(texto), correspondencia.end() + raio)
        trecho = texto[inicio:fim].replace("\n", " ")
        if any(trecho in outros for outros in achados):
            continue
        achados.append(trecho)
        if len(achados) >= maximo:
            break
    return achados


def principal() -> None:
    linhas: list[str] = []
    sessao = requests.Session()
    sessao.headers["User-Agent"] = UA
    for pagina in PAGINAS:
        resposta = sessao.get(pagina, timeout=30)
        html = resposta.text
        linhas.append(f"\n===== {pagina}  (status {resposta.status_code}, {len(html)} chars)")
        # mesmo o HTML inline pode conter a chave
        for trecho in principais_trechos(html):
            linhas.append(f"  [HTML] ...{trecho}...")
        # coleta os scripts (src absolutos)
        origem = re.match(r"(https?://[^/]+)", pagina).group(1)
        caminhos = re.findall(r'src="([^"]+\.js[^"]*)"', html)
        também = re.findall(r"src=['\"]?(/[^'\"]+\.js[^'\"]*)", html)
        caminhos.extend(também)
        caminhos_unicos: list[str] = []
        for caminho in caminhos:
            if caminho.startswith("//"):
                url_js = "https:" + caminho
            elif caminho.startswith("http"):
                url_js = caminho
            else:
                url_js = origem + "/" + caminho.lstrip("/")
            if url_js not in caminhos_unicos:
                caminhos_unicos.append(url_js)
        linhas.append(f"  scripts: {len(caminhos_unicos)}")
        for url_js in caminhos_unicos:
            try:
                js = sessao.get(url_js, timeout=30).text
            except Exception as excecao:
                linhas.append(f"  [FALHA] {url_js}: {type(excecao).__name__}")
                continue
            trechos = principais_trechos(js)
            linhas.append(f"  [JS] {url_js}  ({len(js)} chars, {len(trechos)} trechos)")
            for trecho in trechos:
                linhas.append(f"     ...{trecho}...")
    RELATORIO.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"OK: {RELATORIO}")


if __name__ == "__main__":
    principal()
