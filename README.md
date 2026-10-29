# Flavos Bus 🚌

App gratuito e de código aberto com linhas, itinerários, pontos de parada e horários teóricos dos ônibus de **João Pessoa/PB**, baseado no padrão **GTFS**.

> **Situação atual (2026-10-29):** ✅ **Fase 1 concluída** — coleta real completa do Bus2 João Pessoa
> (84/84 linhas, 2.097 paradas, 149 padrões de viagem, horários útil/sábado/domingo).
> Fase 2 (conversão para GTFS) é o próximo passo. Documento de referência: [docs/arquitetura-e-escopo.md](docs/arquitetura-e-escopo.md)

## O que já roda hoje

```bash
cd tools/scraper
python -m venv .venv                      # uma vez
.venv\Scripts\python -m pip install -e ".[dev]"

.venv\Scripts\python -m scraper collect --linha 510   # uma linha
.venv\Scripts\python -m scraper collect --all          # todas as 84 linhas (retomável)
.venv\Scripts\python -m scraper report                 # estado da coleta
```

Saída em `data/raw/` (arquivos **brutos intactos**, como a fonte entrega):

```
data/raw/
├── _manifest.json            # histórico com URL, data/hora, status e sha256
├── lista_geral.json          # get-routes: as 84 linhas do sistema
└── linha_0510/timetable.json # get-timetable: viagens, paradas c/ horários, shape, serviços
```

## Fonte de dados (público, sem login)

O painel público do **Mobilibus** para João Pessoa (`project_id` 394). As chamadas `POST /public/get-routes` e `/public/get-timetable` trafegam com payload cifrado (CryptoJS AES, chave pública embutida no próprio front — detalhes e história completa em [tools/scraper/docs/endpoints.md](tools/scraper/docs/endpoints.md)). Coleta responsável: 1 requisição por vez, pausa de 1 s, 3 tentativas com backoff, User-Agent identificável `FlavosBus-DataCollector/0.1 (contato: ...)`.

## Estrutura do monorepo

```text
Flavos-Bus/
├── apps/
│   ├── mobile/          # React Native + Expo (Android, iOS, web) — Fase 5 (foco)
│   └── api/             # backend REST + OpenAPI — Fase 4
├── packages/
│   ├── shared/          # tipos TypeScript (Linha, Parada, Horário)
│   └── gtfs-tools/      # utilitários de leitura e geração do GTFS — Fase 2
├── data/
│   ├── raw/             # respostas brutas da coleta (4,8 MB — fora do git)
│   └── gtfs/            # feed GTFS final e validado - Fase 2
├── tools/scraper/       # coletor Python (Fase 1 — CONCLUÍDA)
└── docs/                # arquitetura, decisões e guias
```

## Fases

1. ~~Extração de dados~~ ✅ (84/84 linhas) → 2. **Padronização em GTFS** (agora) → 3. Banco e infra → 4. API pública → 5. **App mobile (foco)** → 6. Qualidade e beta → 7. Publicação e comunidade

## Qualidade (tools/scraper)

`pytest` (40 testes offline, inclusive vetores NIST e o par claro↔cifrado real) · `ruff` · `mypy --strict`.

## Licença e contato

Licença a definir antes da publicação (MIT/GPL sugeridas). Contato do coletor: ver `FLAVOS_CONTACT_EMAIL` em [tools/scraper/scraper/config.py](tools/scraper/scraper/config.py).
