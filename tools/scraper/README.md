# tools/scraper — Extração de dados (Fase 1) + Feed GTFS (Fase 2)

Coleta os dados públicos de linhas, paradas, itinerários e horários (Python 3.11+, Requests), salva em `data/raw/` como JSON **bruto e intacto** (ainda cifrado, exatamente como a fonte devolve) e gera o **feed GTFS validado** em `data/gtfs/`.

## Estado atual

- ✅ **Fase 1 concluída (2026-10-29):** `collect --all` coletou **84/84 linhas** do painel Mobilibus de João Pessoa (`project_id` 394): 2.097 paradas únicas, 149 padrões de viagem, serviços Dias Úteis/Sábado/Domingo — tudo registrado no `_manifest.json` com sha256.
- ✅ **Fase 2 concluída (2026-10-29):** `gtfs` gera o feed (84 rotas, 2.097 paradas, 5.457 trips, 476.226 stop_times, 71.519 pontos de shape) e passou no **gtfs-validator oficial v8.0.1 com zero erros** (só warnings de grafia de nome vindo da fonte, preservada de propósito) — ver `data/gtfs/_RELATORIO.md`.
- ✅ Endpoints reais mapeados e documentados: [docs/endpoints.md](docs/endpoints.md) (inspeção DevTools + captura automatizada com Playwright).
- ✅ Cifra do painel reproduzida sem dependências: [scraper/cryptojs.py](scraper/cryptojs.py) — AES-256-CBC + EVP_BytesToKey, validado com vetores NIST e com o par claro↔cifrado real capturado. A frase é pública (embutida no front do site; ver nota em `scraper/sources/bus2.py`).
- ✅ Qualidade: 54 testes offline, `ruff` limpo, `mypy --strict` limpo.

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
python -m scraper gtfs [--feed-hash HASH]   # Fase 2: monta o feed GTFS em data/gtfs/, valida e zipa
```

## Feed GTFS (Fase 2)

```bash
python -m scraper gtfs --feed-hash 48cdaaed39f53c0c329cf51616b0de96
```

Saída em `data/gtfs/` (fora do git, exceto o relatório):

```text
data/gtfs/agency.txt · routes.txt · stops.txt · calendar.txt
data/gtfs/shapes.txt · trips.txt · stop_times.txt · feed_info.txt
data/gtfs/gtfs.zip          # empacotado só quando a validação interna tem zero erros
data/gtfs/_RELATORIO.md     # contagens, decisões, notas e resultado da validação oficial
```

Decisões de mapeamento e lacunas documentadas no próprio relatório gerado, incluindo:
`agency` fiel ao get-project do painel (SEMOB, `America/Sao_Paulo`, `pt-BR`);
`route_type=3` para todas (a fonte não publica modal);
um `trip` GTFS por **partida real** do quadro (`trip_id` = `<tid>-<sid>-<hhmmss>`, determinístico);
`timepoint=0` (horários teóricos); `direction_id` vazio quando a fonte usa `-1`;
`calendar_dates.txt` não gerado (a fonte não publica feriados).

Validação oficial usada: `gtfs-validator` v8.0.1 (MobilityData, Java 17+), executado sobre `gtfs.zip` —
resultado: **0 erros**, 0 infos, 37 warnings de `mixed_case_recommended_field` (grafia dos nomes vem da fonte).

## Política de coleta responsável

- Só endpoints **públicos, sem login**. Autenticação, captcha ou bloqueio → **parar e avisar**, nunca contornar.
- Requisições **sequenciais**, pausa de 1 s (`FLAVOS_PAUSE_S`), timeout de 15 s, no máximo 3 tentativas com backoff 1s→2s→4s.
- User-Agent identificável: `FlavosBus-DataCollector/0.1 (contato: ...)`.
- **Zero dados pessoais**: só dados públicos de transporte; nada de perfis ou identificadores de usuários das fontes.
- Dado ausente permanece ausente: erro é registrado no manifest e a linha aparece em `report`, nunca preenchida com invenção.

## Qualidade

```bash
pytest          # 54 testes offline (vetores NIST, par real, montagem GTFS; zero rede)
ruff check .    # linter
mypy scraper    # tipagem estrita
```
