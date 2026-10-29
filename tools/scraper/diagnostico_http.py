# Diagnóstico do HTTP 500 do get-routes: isola a causa entre
# (a) User-Agent, (b) headers de navegador (Origin/Referer) e
# (c) formato do payload (json.dumps com espaço vs JSON.stringify compacto).
# Usa o body REAL capturado (replay público, igual ao que o site manda), com
# pausa de 1s entre variações.

from __future__ import annotations

import base64
import json
from time import sleep

import requests

from scraper.cryptojs import cifrar_dados, cifrar_objeto
from scraper.sources.bus2 import FRASE_PUBLICA, URL_LISTA, payload_lista

UA_NOSSO = "FlavosBus-DataCollector/0.1 (contato: YOUR_EMAIL_HERE)"
UA_NAVEGADOR = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
)
HEADERS_BROWSER = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://painel.mobilibus.com",
    "Referer": "https://painel.mobilibus.com/bus2you/home?p=2qloq",
}

# body exatamente como capturado do front (payload {"projectId":394,"agency":null})
BODY_CAPTURADO = '{"data":"U2FsdGVkX1/1NnJXEGvychu8DSBZLDZEQZ93OQP4H0WnOBhbnP3XoH9VJHzUQfG6"}'
# nosso payload cifrado com json.dumps padrão (tem espaços)
BODY_NOSSO_ESPACOS = json.dumps({"data": cifrar_objeto(payload_lista(), FRASE_PUBLICA)})
# nosso payload cifrado no estilo JSON.stringify (sem espaços)
PAYLOAD_COMPACTO = json.dumps(payload_lista(), separators=(",", ":")).encode("utf-8")
BODY_NOSSO_COMPACTO = json.dumps(
    {
        "data": base64.b64encode(
            cifrar_dados(PAYLOAD_COMPACTO, FRASE_PUBLICA)
        ).decode("ascii")
    },
    separators=(",", ":"),
)

VARIACOES = [
    ("coletor-like: UA nosso + Accept app/json,*/* + SEM content-type", BODY_CAPTURADO,
     {"User-Agent": UA_NOSSO, "Accept": "application/json, */*"}),
    ("coletor + content-type json", BODY_CAPTURADO,
     {"User-Agent": UA_NOSSO, "Accept": "application/json, */*",
      "Content-Type": "application/json"}),
    ("UA nosso + content-type json (sem accept custom)", BODY_CAPTURADO,
     {"User-Agent": UA_NOSSO, "Content-Type": "application/json"}),
    ("navegador-like (controle)", BODY_CAPTURADO,
     {"Content-Type": "application/json", **HEADERS_BROWSER, "User-Agent": UA_NAVEGADOR}),
]

for titulo, body, headers in VARIACOES:
    resposta = requests.post(URL_LISTA, data=body.encode("utf-8"), headers=headers, timeout=30)
    vista = resposta.text[:130].replace("\n", " ")
    print(f"[{resposta.status_code}] {titulo}\n      -> {vista}")
    sleep(1.0)
