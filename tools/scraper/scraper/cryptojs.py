# Cifra/decifra no formato do painel Mobilibus (CryptoJS AES com frase pública).
#
# O front cifre assim (visto no bundle main-es2015 deste projeto, chave pública
# client-side sem valor de conta):
#   CryptoJS.AES.encrypt(JSON.stringify(params), FRASE).toString()
# que produz base64 de:  b"Salted__" + salt(8) + AES-256-CBC(PKCS7, chave/IV
# derivados por EVP_BytesToKey(MD5, 1 iteração), estilo OpenSSL).
#
# AES-256 puro em Python conforme FIPS-197 (sem dependências externas),
# validado por testes contra um par claro->cifrado REAL capturado do painel.
# performance: adequada para payloads de dezenas/centenas de KB por linha.

from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Any

CABECALHO_SALT = b"Salted__"
TAM_SALT = 8

_SBOX = bytes.fromhex(
    "637c777bf26b6fc53001672bfed7ab76"
    "ca82c97dfa5947f0add4a2af9ca472c0"
    "b7fd9326363ff7cc34a5e5f171d83115"
    "04c723c31896059a071280e2eb27b275"
    "09832c1a1b6e5aa0523bd6b329e32f84"
    "53d100ed20fcb15b6acbbe394a4c58cf"
    "d0efaafb434d338545f9027f503c9fa8"
    "51a3408f929d38f5bcb6da2110fff3d2"
    "cd0c13ec5f974417c4a77e3d645d1973"
    "60814fdc222a908846eeb814de5e0bdb"
    "e0323a0a4906245cc2d3ac629195e479"
    "e7c8376d8dd54ea96c56f4ea657aae08"
    "ba78252e1ca6b4c6e8dd741f4bbd8b8a"
    "703eb5664803f60e613557b986c11d9e"
    "e1f8981169d98e949b1e87e9ce5528df"
    "8ca1890dbfe6426841992d0fb054bb16"
)
_INV_SBOX = bytes(256)
for _i, _v in enumerate(_SBOX):
    _INV_SBOX = _INV_SBOX[:_v] + bytes([_i]) + _INV_SBOX[_v + 1 :]

_RCON = (0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D)


def mul_galois(a: int, b: int) -> int:
    """Multiplicação em GF(2^8) com o polinômio do AES (x^8+x^4+x^3+x+1)."""
    resultado = 0
    for _ in range(8):
        if b & 1:
            resultado ^= a
        carry = a & 0x80
        a = (a << 1) & 0xFF
        if carry:
            a ^= 0x1B
        b >>= 1
    return resultado & 0xFF


def _expandir_chave(chave: bytes) -> list[list[int]]:
    """Palavras de rodada: saída[ronda][coluna] = word (4 bytes, coluna)."""
    nk = len(chave) // 4
    nr = nk + 6
    total = 4 * (nr + 1)
    palavras: list[int] = []
    for i in range(nk):
        palavras.append(int.from_bytes(chave[4 * i : 4 * i + 4], "big"))
    for i in range(nk, total):
        temp = palavras[i - 1]
        rotacionado = ((temp << 8) & 0xFFFFFFFF) | (temp >> 24)
        sub_rotacionado = (
            (_SBOX[(rotacionado >> 24) & 0xFF] << 24)
            | (_SBOX[(rotacionado >> 16) & 0xFF] << 16)
            | (_SBOX[(rotacionado >> 8) & 0xFF] << 8)
            | _SBOX[rotacionado & 0xFF]
        )
        if i % nk == 0:
            temp = sub_rotacionado ^ (_RCON[i // nk - 1] << 24)
        elif nk > 6 and i % nk == 4:
            # AES-256: SubWord SEM RotWord, sobre o word original
            temp = (
                (_SBOX[(temp >> 24) & 0xFF] << 24)
                | (_SBOX[(temp >> 16) & 0xFF] << 16)
                | (_SBOX[(temp >> 8) & 0xFF] << 8)
                | _SBOX[temp & 0xFF]
            )
        palavras.append(palavras[i - nk] ^ temp)
    return [palavras[4 * r : 4 * r + 4] for r in range(nr + 1)]


def _adiciona_chave(estado: list[list[int]], ronda: list[int]) -> None:
    for c in range(4):
        palavra = ronda[c]
        for r in range(4):
            estado[r][c] ^= (palavra >> (24 - 8 * r)) & 0xFF


def _mix_colunas(estado: list[list[int]], coefs: tuple[int, int, int, int]) -> None:
    for c in range(4):
        a = [estado[r][c] for r in range(4)]
        for r in range(4):
            estado[r][c] = (
                mul_galois(a[r], coefs[0])
                ^ mul_galois(a[(r + 1) % 4], coefs[1])
                ^ mul_galois(a[(r + 2) % 4], coefs[2])
                ^ mul_galois(a[(r + 3) % 4], coefs[3])
            )


def cifrar_bloco(bloco: bytes, rodadas: list[list[int]]) -> bytes:
    nr = len(rodadas) - 1
    # estado[r][c] = bloco[r + 4c]
    estado = [[bloco[r + 4 * c] for c in range(4)] for r in range(4)]
    _adiciona_chave(estado, rodadas[0])
    for ronda in range(1, nr):
        for r in range(4):
            for c in range(4):
                estado[r][c] = _SBOX[estado[r][c]]
        # ShiftRows: novo[r][c] = antigo[r][(c + r) % 4]
        estado = [[estado[r][(c + r) % 4] for c in range(4)] for r in range(4)]
        _mix_colunas(estado, (2, 3, 1, 1))
        _adiciona_chave(estado, rodadas[ronda])
    for r in range(4):
        for c in range(4):
            estado[r][c] = _SBOX[estado[r][c]]
    estado = [[estado[r][(c + r) % 4] for c in range(4)] for r in range(4)]
    _adiciona_chave(estado, rodadas[nr])
    return bytes(estado[r][c] for c in range(4) for r in range(4))


def decifrar_bloco(bloco: bytes, rodadas: list[list[int]]) -> bytes:
    nr = len(rodadas) - 1
    estado = [[bloco[r + 4 * c] for c in range(4)] for r in range(4)]
    _adiciona_chave(estado, rodadas[nr])
    for ronda in range(nr - 1, 0, -1):
        # InvShiftRows: novo[r][c] = antigo[r][(c - r) % 4]
        estado = [[estado[r][(c - r) % 4] for c in range(4)] for r in range(4)]
        for r in range(4):
            for c in range(4):
                estado[r][c] = _INV_SBOX[estado[r][c]]
        _adiciona_chave(estado, rodadas[ronda])
        _mix_colunas(estado, (14, 11, 13, 9))
    estado = [[estado[r][(c - r) % 4] for c in range(4)] for r in range(4)]
    for r in range(4):
        for c in range(4):
            estado[r][c] = _INV_SBOX[estado[r][c]]
    _adiciona_chave(estado, rodadas[0])
    return bytes(estado[r][c] for c in range(4) for r in range(4))


def evp_bytes_to_key(senha: str, salt: bytes, tamanho: int) -> bytes:
    """Derivação OpenSSL EVP_BytesToKey (MD5, 1 iteração) usada pelo CryptoJS."""
    derivado = b""
    anterior = b""
    while len(derivado) < tamanho:
        anterior = hashlib.md5(anterior + senha.encode("utf-8") + salt).digest()
        derivado += anterior
    return derivado[:tamanho]


def _pkcs7_preencher(dados: bytes) -> bytes:
    comprimento = 16 - len(dados) % 16
    return dados + bytes([comprimento]) * comprimento


def _pkcs7_remover(dados: bytes) -> bytes:
    if not dados or len(dados) % 16:
        raise ValueError("dados de bloco inválidos")
    marcador = dados[-1]
    if not 1 <= marcador <= 16 or dados[-marcador:] != bytes([marcador]) * marcador:
        raise ValueError("padding PKCS7 inválido (frase de cifra errada?)")
    return dados[:-marcador]


def _xor(a: bytes, b: bytes) -> bytes:
    return bytes(x ^ y for x, y in zip(a, b, strict=False))


def cifrar_dados(dados: bytes, frase: str) -> bytes:
    salt = os.urandom(TAM_SALT)
    chave_iv = evp_bytes_to_key(frase, salt, 48)
    chave, iv = chave_iv[:32], chave_iv[32:]
    rodadas = _expandir_chave(chave)
    preenchidos = _pkcs7_preencher(dados)
    saida = bytearray()
    anterior = iv
    for i in range(0, len(preenchidos), 16):
        cifrado = cifrar_bloco(_xor(preenchidos[i : i + 16], anterior), rodadas)
        saida += cifrado
        anterior = cifrado
    return CABECALHO_SALT + salt + bytes(saida)


def decifrar_dados(payload: bytes, frase: str) -> bytes:
    if not payload.startswith(CABECALHO_SALT):
        raise ValueError("payload sem o marcador Salted__")
    salt = payload[8 : 8 + TAM_SALT]
    conteudo = payload[8 + TAM_SALT :]
    if not conteudo or len(conteudo) % 16:
        raise ValueError("tamanho de payload inválido")
    chave_iv = evp_bytes_to_key(frase, salt, 48)
    chave, iv = chave_iv[:32], chave_iv[32:]
    rodadas = _expandir_chave(chave)
    saida = bytearray()
    anterior = iv
    for i in range(0, len(conteudo), 16):
        plain = _xor(decifrar_bloco(conteudo[i : i + 16], rodadas), anterior)
        saida += plain
        anterior = conteudo[i : i + 16]
    return _pkcs7_remover(bytes(saida))


# --- Camada usada pelo coletor (mesmo contrato do front) ---


def cifrar_objeto(objeto: Any, frase: str) -> str:
    return base64.b64encode(
        cifrar_dados(json.dumps(objeto).encode("utf-8"), frase)
    ).decode("ascii")


def decifrar_objeto(texto_base64: str, frase: str) -> Any:
    dados = decifrar_dados(base64.b64decode(texto_base64), frase)
    return json.loads(dados.decode("utf-8"))
