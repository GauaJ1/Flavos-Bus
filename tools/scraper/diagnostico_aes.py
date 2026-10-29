# Diagnóstico do núcleo AES contra VETORES OFICIAIS (NIST SP 800-38A):
# AES-128 ECB:  key 2b7e151628aed2a6abf7158809cf4f3c ; plain 6bc1bee22e409f96e93d7e117393172a
#               -> out 3ad77bb40d7a3660a89ecaf32466ef97
# AES-256 ECB:  key 603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4
#               -> out f3eed1bdb5d2a03c064b5a7e3db181f8

from scraper.cryptojs import _expandir_chave, cifrar_bloco, decifrar_bloco

CASOS = [
    (
        "AES-128",
        bytes.fromhex("2b7e151628aed2a6abf7158809cf4f3c"),
        "3ad77bb40d7a3660a89ecaf32466ef97",
    ),
    (
        "AES-256",
        bytes.fromhex("603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4"),
        "f3eed1bdb5d2a03c064b5a7e3db181f8",
    ),
]
PLAIN = bytes.fromhex("6bc1bee22e409f96e93d7e117393172a")

for nome, chave, esperado in CASOS:
    rodadas = _expandir_chave(chave)
    cifrado = cifrar_bloco(PLAIN, rodadas)
    voltou = decifrar_bloco(cifrado, rodadas)
    situacao = cifrado.hex() == esperado
    print(
        f"{nome}: ok={situacao} | volta={voltou == PLAIN}"
        f" | meu={cifrado.hex()} | esperado={esperado}"
    )
