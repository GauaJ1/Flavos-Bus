# Contraprova de tempo real (lembrete 07:20 de 2026-10-29): get-route-vehicles
# para 0507, 0510 e 0104 (3 requests no total), com captura completa em
# captura_extras/rt_manha_2026-10-29.txt. Se vierem veículos, inspecionar
# prefix/plate/vehicleId/label/name; se vier vazio COM partida recente do
# quadro (<30 min), registrar como PROVA de RT desativado.

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from scraper.cryptojs import decifrar_objeto
from scraper.http_client import HttpClient
from scraper.sources.bus2 import FRASE_PUBLICA, PROJECT_ID

URL_VEICULOS = "https://painel.mobilibus.com/public/get-route-vehicles"
URL_PARTIDAS = "https://painel.mobilibus.com/public/get-last-positions"
ROTAS = ("0510", "0104")  # 0507: HTTP 500 duplo em 08:05/08:06 (monitorado separately)
SAIDA = Path(__file__).resolve().parent / "captura_extras" / "rt_manha_2026-10-29.txt"
CAMPOS_VEICULO = ("prefix", "plate", "vehicleId", "label", "name",
                  "prefixo", "placa", "internalId", "deviceId")


def _log(linhas: list[str], texto: str) -> None:
    print(texto)
    linhas.append(texto)


def main() -> int:
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    linhas: list[str] = []
    _log(linhas, f"contraprova RT {datetime.now().isoformat(timespec='seconds')} "
                 f"(America/Sao_Paulo) — rotas: {', '.join(ROTAS)}")
    http = HttpClient(max_retries=1)  # 1 request por rota (limite: 3 total)
    achados: dict[str, list[dict]] = {}
    falhas: list[str] = []
    for rota in ROTAS:
        try:
            envelope = http.post(
                URL_VEICULOS,
                json.dumps({"projectId": PROJECT_ID, "route": rota}).encode("utf-8"),
            )
        except ConnectionError as erro:
            _log(linhas, f"[{rota}] get-route-vehicles -> FALHA: {erro}")
            falhas.append(rota)
            continue
        dados = decifrar_objeto(
            str(json.loads(envelope.content.decode("utf-8"))["data"]),
            FRASE_PUBLICA)
        veiculos = dados if isinstance(dados, list) else (dados or {}).get(
            "vehicles", dados.get("data", []))
        _log(linhas, f"[{rota}] get-route-vehicles -> {len(veiculos)} veículo(s)")
        if veiculos:
            achados[rota] = veiculos
            for veiculo in veiculos[:5]:
                relevantes = {c: veiculo[c] for c in CAMPOS_VEICULO
                              if isinstance(veiculo, dict) and c in veiculo}
                _log(linhas, f"   campos de identidade: "
                             f"{json.dumps(relevantes, ensure_ascii=False)}")
                _log(linhas, f"   objeto completo: "
                             f"{json.dumps(veiculo, ensure_ascii=False)[:400]}")
    _log(linhas, "")
    _log(linhas, "quadro do feed (partida do 1º stop_time por trip, serviço "
                 "de hoje): veja tools/scraper/rd_partida_recente.py")

    SAIDA.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    _log(linhas, f"\ncaptura completa salva em: {SAIDA}")
    if achados:
        print(f"\nRESULTADO: veículos RT em {list(achados)} — mapear "
              "identificador -> posição acima")
    elif len(falhas) == len(ROTAS):
        print("\nRESULTADO: INDETERMINADO — todas as sondas falharam (HTTP "
              "500 do servidor); PROVA de RT desativado depende da reexecução")
    else:
        print(f"\nRESULTADO: 0 veículos nas rotas sondadas (falhas: "
              f"{falhas or 'nenhuma'}) — com partida recente confirmada no "
              "quadro (rd_partida_recente.py), isto PROVA RT desativado no "
              "painel público")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
