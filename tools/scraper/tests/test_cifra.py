# Cifra/decifra no formato do painel — vetores oficiais (NIST SP 800-38A),
# round-trip e o PAR REAL capturado do painel (known-plaintext).

from __future__ import annotations

import pytest

from scraper.cryptojs import (
    _expandir_chave,
    cifrar_bloco,
    cifrar_objeto,
    decifrar_dados,
    decifrar_objeto,
)

FRASE_PAINEL = "AL0EHMARC0"

# Pedido real capturado (POST /public/get-routes) — clarificado depois pela
# espionagem do JSON.stringify do próprio site.
CIFRA_REAL_PEDIDO = "U2FsdGVkX1/1NnJXEGvychu8DSBZLDZEQZ93OQP4H0WnOBhbnP3XoH9VJHzUQfG6"


def test_nist_aes128_ecb() -> None:
    chave = bytes.fromhex("2b7e151628aed2a6abf7158809cf4f3c")
    plain = bytes.fromhex("6bc1bee22e409f96e93d7e117393172a")
    assert cifrar_bloco(plain, _expandir_chave(chave)).hex() == (
        "3ad77bb40d7a3660a89ecaf32466ef97"
    )


def test_nist_aes256_ecb() -> None:
    chave = bytes.fromhex(
        "603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4"
    )
    plain = bytes.fromhex("6bc1bee22e409f96e93d7e117393172a")
    assert cifrar_bloco(plain, _expandir_chave(chave)).hex() == (
        "f3eed1bdb5d2a03c064b5a7e3db181f8"
    )


def test_roundtrip_objeto() -> None:
    objeto = {"projectId": 394, "route": "0510", "Lista": ["a", "b", "ç"]}
    volta = decifrar_objeto(cifrar_objeto(objeto, FRASE_PAINEL), FRASE_PAINEL)
    assert volta == objeto


def test_par_real_capturado_decifra() -> None:
    """O ciphertext real capturado deve decifrar para o payload em claro real."""
    assert decifrar_objeto(CIFRA_REAL_PEDIDO, FRASE_PAINEL) == {
        "projectId": 394,
        "agency": None,
    }


def test_payload_sem_salted_levanta() -> None:
    with pytest.raises(ValueError, match="Salted__"):
        decifrar_dados(b"nao-e-cifra", FRASE_PAINEL)


def test_frase_errada_levanta_padding() -> None:
    cifra = cifrar_objeto({"x": 1}, FRASE_PAINEL)
    with pytest.raises(ValueError, match="padding"):
        decifrar_objeto(cifra, "outra-frase")
