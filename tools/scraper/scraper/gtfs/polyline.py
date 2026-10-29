# Decoder do "Encoded Polyline" do Google (formato usado no campo `sp` do
# painel Bus2/Mobilibus): varint + ZigZag + deltas, precisão 1e5.

from __future__ import annotations

PRECISAO_PADRAO = 100_000.0


def _valor_varint(texto: str, inicio: int) -> tuple[int, int]:
    """Lê um inteiro varint base64-url a partir de `inicio`; devolve (valor, próximo)."""
    resultado = 0
    deslocamento = 0
    indice = inicio
    while True:
        if indice >= len(texto):
            raise ValueError("polyline truncada no meio de um varint")
        codigo = ord(texto[indice]) - 63
        indice += 1
        resultado |= (codigo & 0x1F) << deslocamento
        if codigo < 0x20:
            return resultado, indice
        deslocamento += 5


def _desfazer_zigzag(valor: int) -> int:
    return (valor >> 1) ^ -(valor & 1)


def decodificar_polyline(
    texto: str, precisao: float = PRECISAO_PADRAO
) -> list[tuple[float, float]]:
    """Devolve [(lat, lon), ...] decodificando o formato padrão (deltas + ZigZag)."""
    if not texto:
        return []
    pontos: list[tuple[float, float]] = []
    indice = 0
    lat_acumulada = 0
    lon_acumulada = 0
    total = len(texto)
    while indice < total:
        bruto_lat, indice = _valor_varint(texto, indice)
        lat_acumulada += _desfazer_zigzag(bruto_lat)
        bruto_lon, indice = _valor_varint(texto, indice)
        lon_acumulada += _desfazer_zigzag(bruto_lon)
        pontos.append((lat_acumulada / precisao, lon_acumulada / precisao))
    return pontos
