# Analisa captura.jsonl e salva o conteúdo LEGÍVEL em captura_extras/.
# Cada evento "parse" cujo texto é JSON vira um arquivo numerado + um resumo
# (chaves, tamanhos, primeiros itens) em captura_analise.txt.

from __future__ import annotations

import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent
CAPTURA = PASTA / "captura.jsonl"
SAIDA_TEXTO = PASTA / "captura_analise.txt"
PASTA_EXTRAS = PASTA / "captura_extras"

LIMITE_EXEMPLO = 600  # caracteres por item no resumo


def resumo_json(dados: object) -> list[str]:
    """Descreve a estrutura de JSON arbitrário com algumas linhas legíveis."""
    linhas: list[str] = []
    if isinstance(dados, list):
        linhas.append(f"  lista com {len(dados)} itens")
        for i, item in enumerate(dados[:3]):
            linhas.append(
                f"  item[{i}] = {json.dumps(item, ensure_ascii=False)[:LIMITE_EXEMPLO]}"
            )
        if len(dados) > 3:
            linhas.append(f"  ... +{len(dados) - 3} itens")
        if dados and isinstance(dados[0], dict):
            linhas.append(f"  chaves do item[0]: {', '.join(list(dados[0].keys())[:30])}")
    elif isinstance(dados, dict):
        linhas.append(f"  objeto com chaves: {', '.join(list(dados.keys())[:20])}")
        for chave, valor in list(dados.items())[:8]:
            linhas.append(
                f"  {chave} = {json.dumps(valor, ensure_ascii=False)[:LIMITE_EXEMPLO]}"
            )
    else:
        linhas.append(f"  {json.dumps(dados, ensure_ascii=False)[:LIMITE_EXEMPLO]}")
    return linhas


def main() -> None:
    PASTA_EXTRAS.mkdir(exist_ok=True)
    linhas_relatorio: list[str] = []
    for numero, bruta in enumerate(CAPTURA.read_text(encoding="utf-8").splitlines(), start=1):
        bruta = bruta.strip()
        if not bruta:
            continue
        try:
            evento = json.loads(bruta)
        except json.JSONDecodeError:
            linhas_relatorio.append(f"[#{numero}] linha ilegível: {bruta[:80]}")
            continue
        if not isinstance(evento, dict) or evento.get("_meta") or evento.get("_fim"):
            linhas_relatorio.append(f"[#{numero}] == {bruta[:120]}")
            continue
        texto = str(evento.get("text", ""))
        cabecalho = (
            f"[#{numero}] kind={evento.get('kind')} chars={evento.get('chars')} "
            f"{str(evento.get('url', ''))[:90]}"
        )
        linhas_relatorio.append(cabecalho)
        if evento.get("kind") == "http":
            linhas_relatorio.append(f"  body cifrado: {texto[:120]}")
            continue
        limpo = texto.strip()
        if not (limpo.startswith("[") or limpo.startswith("{")):
            linhas_relatorio.append(f"  (texto não-JSON: {limpo[:100]!r})")
            continue
        try:
            dados = json.loads(limpo)
        except json.JSONDecodeError:
            linhas_relatorio.append(f"  JSON inválido: {limpo[:100]}")
            continue
        if isinstance(dados, dict) and set(dados) == {"data"} and str(
            dados.get("data", "")
        ).startswith("U2FsdGVk"):
            linhas_relatorio.append(
                "  envelope CIFRADO — o site decifra e passa de novo por JSON.parse"
            )
            continue
        if not isinstance(dados, (dict, list)) or not dados:
            linhas_relatorio.append(
                f"  valor simples: {json.dumps(dados, ensure_ascii=False)[:LIMITE_EXEMPLO]}"
            )
            continue
        caminho = PASTA_EXTRAS / f"evento_{numero}.json"
        caminho.write_text(
            json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        linhas_relatorio.append(f"  >> salvo: {caminho.name} ({len(limpo)} chars)")
        linhas_relatorio.extend(resumo_json(dados))

    SAIDA_TEXTO.write_text("\n".join(linhas_relatorio) + "\n", encoding="utf-8")
    total_extras = len(list(PASTA_EXTRAS.glob("*.json")))
    print(f"OK: {SAIDA_TEXTO.name} + {total_extras} arquivos em {PASTA_EXTRAS.name}/")


if __name__ == "__main__":
    main()
