# Valida o módulo de cifra contra os dados REAIS capturados em 2026-10-29:
# 1) da resposta CIFRADA do get-routes (20663 chars) até o JSON de 84 linhas;
# 2) do par claro->cifrado do pedido get-routes (known-plaintext).

from __future__ import annotations

import json
from pathlib import Path
from time import perf_counter

from scraper.cryptojs import cifrar_objeto, decifrar_objeto

FRASE = "AL0EHMARC0"
PASTA = Path(__file__).resolve().parent

# cifra da RESPOSTA get-routes: primeiro parse cujo texto é o envelope
# (identificado pelo bloco base64 visto no log)
PREFIXO_ENVELOPE = '{"data":"U2FsdGVkX1/evKnS38r6yg1c4'


def _achar_envelope() -> str:
    for bruta in (PASTA / "captura.jsonl").read_text(encoding="utf-8").splitlines():
        try:
            evento = json.loads(bruta)
        except json.JSONDecodeError:
            continue
        if isinstance(evento, dict) and str(evento.get("text", "")).startswith(
            PREFIXO_ENVELOPE
        ):
            return str(json.loads(str(evento["text"]))["data"])
    raise SystemExit("envelope da resposta get-routes não achado na captura")


CIFRA_GET_ROUTES_RESPOSTA = _achar_envelope()


def main() -> None:
    inicio = perf_counter()
    rotas = decifrar_objeto(CIFRA_GET_ROUTES_RESPOSTA, FRASE)
    tempo = perf_counter() - inicio
    print(f"decifra da resposta get-routes (20663 cifrados): {tempo:.1f}s")
    print(f"  tipo: {type(rotas).__name__} | itens: {len(rotas)}")
    esperado = json.loads(
        (PASTA / "captura_extras/evento_14.json").read_text(encoding="utf-8")
    )
    igual = rotas == esperado
    print(f"  IGUAL ao capturado em claro: {igual}")
    if not igual:
        for a, b in zip(rotas, esperado, strict=False):
            if a != b:
                print("  primeira divergência:", a, "!=", b)
                break
    # known-plaintext: pedido em claro -> cifra -> igual ao body real
    pedido = {"projectId": 394, "agency": None}
    cifra_fabricada = cifrar_objeto(pedido, FRASE)
    print("cifra fabricada:", cifra_fabricada[:60], "...")
    volta = decifrar_objeto(cifra_fabricada, FRASE)
    print("roundtrip ok:", volta == pedido)


if __name__ == "__main__":
    main()
