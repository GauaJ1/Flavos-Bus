# Espião do tráfego legível do Bus2 João Pessoa (Flavos Bus — Fase 1).
#
# O site já decifra as respostas no próprio navegador (JavaScript). Este script
# injeta um hook ANTES de a página carregar, ouvindo JSON.parse (respostas em
# claro) e JSON.stringify (pedidos em claro), e grava CADA evento imediatamente
# em captura.jsonl (nada se perde mesmo se o processo cair).
#
# COMO USAR (de dentro de tools/scraper):
#   1) .venv\Scripts\python.exe -m pip install playwright
#   2) python capturar.py   -> abre Edge/Chrome VISÍVEL no portal público
#   3) Clique nas linhas (ex.: 510), dias (útil/sábado/domingo), sentidos...
#   4) Volte ao terminal e aperte ENTER para encerrar.
#
# Política: apenas páginas públicas, sem login (se pedir login, feche e avise).
# Limites: 600 eventos, 300 mil caracteres por texto — proteção de memória.

from __future__ import annotations

import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

# Painel que origina as chamadas /public/ (confirmado na inspeção); o portal
# público também funciona: python capturar.py https://bus2.mobilibus.com.br/pb/joao-pessoa/
URL_PADRAO = "https://painel.mobilibus.com/bus2you/home?p=2qloq"
ARQUIVO = Path(__file__).resolve().parent / "captura.jsonl"
ARQUIVO_STOP = Path(__file__).resolve().parent / "captura.STOP"
LIMITE_EVENTOS = 600
LIMITE_TEXTO = 300_000

# Rodado em TODO frame, ANTES dos scripts do site (context.add_init_script).
# Se o binding do Playwright ainda não existe, o evento é descartado em
# silêncio — as respostas de rede chegam depois, quando o binding já está lá.
HOOK_JS = """(() => {
  if (window.__flavosHook) return;
  window.__flavosHook = true;
  const SEP = "||FLAVOS||";
  // A trava "quiet" evita reentrância: o runtime do Playwright usa o
  // JSON.stringify da própria página para empacotar o argumento; sem a
  // trava, o hook espionaria esses envelopes (captura gerando captura).
  let quiet = false;
  const envia = (kind, text) => {
    if (quiet) return;
    quiet = true;
    try {
      if (typeof window.flavos_pass === "function")
        window.flavos_pass(kind + SEP + String(text).slice(0, 300000));
    } catch (e) {
    } finally {
      quiet = false;
    }
  };
  const origParse = JSON.parse;
  JSON.parse = function (text, reviver) {
    if (!quiet && typeof text === "string" && text.trim().length > 1) envia("parse", text);
    return origParse.call(this, text, reviver);
  };
  const origStringify = JSON.stringify;
  JSON.stringify = function (value, replacer, space) {
    const out = origStringify.call(this, value, replacer, space);
    if (!quiet && typeof out === "string" && out.trim().length > 1) envia("stringify", out);
    return out;
  };
})();"""


def main() -> None:
    total = 0
    url_inicial = sys.argv[1] if len(sys.argv) > 1 else URL_PADRAO

    # Cabeçalho do arquivo de capture + preparação do modo "agente".
    arquivo = ARQUIVO.open("w", encoding="utf-8")
    arquivo.write(
        json.dumps(
            {
                "_meta": {
                    "url_inicial": url_inicial,
                    "capturado_em_utc": datetime.now(UTC).isoformat(
                        timespec="seconds"
                    ),
                }
            },
            ensure_ascii=False,
        )
        + "\n"
    )
    arquivo.flush()

    def gravar(item: dict, resumo: str = "") -> None:
        """Gravação imediata: crash não derruba a coleta."""
        nonlocal total
        item["chars"] = len(str(item.get("text", "")))
        arquivo.write(json.dumps(item, ensure_ascii=False) + "\n")
        arquivo.flush()
        total += 1
        marca = resumo or " ".join(str(item.get("url", "")).split())[:100]
        print(f"[{total:3d}] {item['kind']:9s} {marca}", flush=True)

    def registrar(source, payload=None) -> None:
        """Binding chamado pela página: chega 'kind<TAB.vertical>texto' (string)."""
        if total >= LIMITE_EVENTOS:
            return
        cru = payload if isinstance(payload, str) else str(payload or "")
        cru = cru.strip()
        if not cru:
            return
        inicio, separador, texto = cru.partition("||FLAVOS||")
        if texto.lstrip().startswith('{"name":"flavos_pass"'):
            return  # envelope interno do Playwright (lixo de runtime)
        if not separador:
            inicio, texto = "?", cru
        gravar(
            {
                "kind": inicio if inicio in ("parse", "stringify") else "?",
                "text": texto[:LIMITE_TEXTO],
                "t": int(datetime.now(UTC).timestamp() * 1000),
            },
            resumo=" ".join(texto.split())[:100],
        )

    def registrar_http(request) -> None:
        """Chamadas /public/ com o body CIFRADO (para ligar cifra ↔ payload)."""
        try:
            if total >= LIMITE_EVENTOS or "/public/" not in request.url:
                return
            body = request.post_data or ""
            gravar(
                {
                    "kind": "http",
                    "method": request.method,
                    "url": request.url,
                    "text": body[:LIMITE_TEXTO],
                }
            )
        except Exception as exc:  # request pode sumir durante a navegação
            print(f"(aviso: requisição ignorada: {exc})", flush=True)

    with sync_playwright() as pw:
        # Usa o navegador JÁ instalado no Windows (Edge ou Chrome); só se não
        # houver nenhum é que precisaríamos do "playwright install chromium".
        browser = None
        for canal in ("msedge", "chrome"):
            try:
                browser = pw.chromium.launch(channel=canal, headless=False)
                print(f"Navegador aberto ({canal}).", flush=True)
                break
            except Exception as exc:  # sem esse canal instalado
                print(f"(canal {canal} indisponível: {type(exc).__name__})", flush=True)
        if browser is None:
            try:
                browser = pw.chromium.launch(headless=False)
                print("Navegador aberto (Chromium embutido).", flush=True)
            except Exception as exc:
                print(
                    "Nenhum navegador disponível. Rode: python -m playwright install chromium"
                    f"\n  detalhe: {exc}",
                    flush=True,
                )
                return

        context = browser.new_context(locale="pt-BR", viewport={"width": 1366, "height": 768})
        # Binding + hook valem para TODAS as páginas/frames, inclusive popups.
        context.expose_binding("flavos_pass", registrar)
        context.add_init_script(HOOK_JS)
        context.on("request", registrar_http)

        page = context.new_page()
        page.set_default_timeout(90_000)
        print(f"Abrindo {url_inicial} ...", flush=True)
        page.goto(url_inicial, wait_until="domcontentloaded")

        print("\n=== CAPTURANDO ===")
        print("  • clique numa linha (ex.: 510), depois em mais uma (ex.: 507)")
        print("  • escolha dia (útil/sábado/domingo) e sentido (ida/volta)")
        print("  • cada clique vira uma linha nova no terminal aqui")
        if os.environ.get("FLAVOS_NOWAIT") == "1":
            # Modo agente: roda até aparecer captura.STOP (a captura já está em
            # disco a cada evento, então matar o processo também é seguro).
            print("  (modo agente: paro quando existir captura.STOP)", flush=True)
            try:
                while not ARQUIVO_STOP.exists():
                    page.wait_for_timeout(1000)
            except Exception:
                pass
        else:
            try:
                input("\nAperte ENTER quando terminar para encerrar...")
            except (KeyboardInterrupt, EOFError):
                pass

        arquivo.write(json.dumps({"_fim": True, "total": total}) + "\n")
        arquivo.flush()
        arquivo.close()
        browser.close()

    print(f"\nFIM: {total} eventos salvos em {ARQUIVO.name}", flush=True)


if __name__ == "__main__":
    main()
