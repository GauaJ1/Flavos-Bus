# tools/scraper — Extração de dados (Fase 1 — CONCLUÍDA)

Coleta os dados públicos de linhas, paradas, itinerários e horários (Python 3.11+, Requests) e salva em `data/raw/` como JSON **bruto e intacto** (ainda cifrado, exatamente como a fonte devolve) — a decifração e a conversão em GTFS ficam para a Fase 2.

## Estado atual

- ✅ **Fase 1 concluída (2026-10-29):** `collect --all` coletou **84/84 linhas** do painel Mobilibus de João Pessoa (`project_id` 394): 2.097 paradas únicas, 149 padrões de viagem, serviços Dias Úteis/Sábado/Domingo — tudo registrado no `_manifest.json` com sha256.
- ✅ Endpoints reais mapeados e documentados: [docs/endpoints.md](docs/endpoints.md) (inspeção DevTools + captura automatizada com Playwright).
- ✅ Cifra do painel reproduzida sem dependências: [scraper/cryptojs.py](scraper/cryptojs.py) — AES-256-CBC + EVP_BytesToKey, validado com vetores NIST e com o par claro↔cifrado real capturado. A frase é pública (embutida no front do site; ver nota em `scraper/sources/bus2.py`).
- ✅ Qualidade: 40 testes offline, `ruff` limpo, `mypy --strict` limpo.

## Instalação

```bash
cd tools/scraper
python -m venv .venv
.venv\Scripts\activate           # Windows · Linux/Mac: source .venv/bin/activate
pip install -e ".[dev]"
```

E-mail identificador do User-Agent (a coleta se identifica a cada chamada):

```bash
set FLAVOS_CONTACT_EMAIL=seu@email.com        # cmd
$env:FLAVOS_CONTACT_EMAIL = "seu@email.com"   # PowerShell
```

## Uso

```bash
python -m scraper collect --linha 510       # baixa a linha 510 (aceita "510" ou "0510")
python -m scraper collect --all             # varre todas as linhas (retomável: pula o que já está em cache)
python -m scraper collect --all --force     # rebaixa mesmo o que está em cache
python -m scraper report                    # estado da coleta (lista geral + linhas completas/sem dados + erros)
```

Saída em `data/raw/` (fora do git; ver `.gitignore` da raiz). As respostas ficam **intactas, ainda cifradas**:

```text
data/raw/_manifest.json                  # URL, data/hora, status, sha256 de cada baixada
data/raw/lista_geral.json                # get-routes: as linhas do sistema (cifradas)
data/raw/linha_0510/timetable.json       # get-timetable completo da linha (cifrado)
```

Para decifrar/inspecionar (Fase 1/2): `scraper/cryptojs.py::decifrar_objeto(texto, FRASE_PUBLICA)`. Scripts de apoio desta fase: `capturar.py` (espionar o site com navegador real), `analiza_captura.py`, `verifica_coleta.py` e `estatisticas_coleta.py`.

## Política de coleta responsável

- Só endpoints **públicos, sem login**. Autenticação, captcha ou bloqueio → **parar e avisar**, nunca contornar.
- Requisições **sequenciais**, pausa de 1 s (`FLAVOS_PAUSE_S`), timeout de 15 s, no máximo 3 tentativas com backoff 1s→2s→4s.
- User-Agent identificável: `FlavosBus-DataCollector/0.1 (contato: ...)`.
- **Zero dados pessoais**: só dados públicos de transporte; nada de perfis ou identificadores de usuários das fontes.
- Dado ausente permanece ausente: erro é registrado no manifest e a linha aparece em `report`, nunca preenchida com invenção.

## Qualidade

```bash
pytest          # 40 testes offline (vetores NIST + par real; zero rede)
ruff check .    # linter
mypy scraper    # tipagem estrita
```
