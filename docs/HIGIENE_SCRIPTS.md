# Higiene dos scripts de `tools/scraper/` — 2026-10-29

Levantamento feito com `git status --porcelain tools/scraper` (48 itens não
versionados na raiz + 1 módulo dentro do pacote). Classificação em três
destinos e o que foi efetivamente feito nesta data.

## 1. Apagados (21 + 1 diretório) — inequivocamente descartáveis

Iterações descartadas de caças a veículos (o resultado vivo é
`teste_509.py`/`sonda_tempo_real.py`): `caca_veiculos.py` …
`caca_veiculos8.py` (8 arquivos).

Debug descartável de parser (lógica viva em `monitora_semob.py` e
`divergencias_semob.py`): `debug_horario.py`, `debug_rodadas.py`,
`debug_secao.py`, `debug_secoes.py`, `espia_html_horario.py`.

Correção pontual já aplicada ao artefato commitado: `corrige_dashboard.py`.

Demos/investigações pontuais concluídas: `demo_amanha_0104.py`,
`demo_painel_parada.py`, `passagem_epitacio.py`, `radiografia_0518.py`,
`decide_1001.py`, `acha_noturna.py`, `verifica_encoding.py`.

Artefato temporário de teste: `pytest-of-Usuario/` (diretório).

## 2. Arquivados em `tools/scraper/_sondagem/` (24) — fora do repo (gitignored)

Histórico de investigação e versões predecessores, preservados no disco com
valor de metodologia/proveniência:

- Sondagens de GPS/tempo real que deram origem ao `teste_509.py`:
  `sonda_semob.py`, `sonda_semob_gps.py`, `sonda_semob_gps2.py`,
  `sonda_semob_gps3.py`, `sonda_gps_final.py`, `sonda_gps_navegador.py`,
  `sonda_rt_agora.py`, `abre_cdp_semob.py`, `captura_veiculos/` (capturas
  brutas).
- Análises de operadoras (achado "declarações de 2018"):
  `investiga_mandacaruense.py`, `busca_empresa_orfa.py`,
  `mede_confiabilidade_empresa.py`, `sensibilidade_operadora.py`,
  `testa_operadoras.py`, `verifica_operadoras_ativas.py`.
- Sondagem de JS/HTML do site SEMOB (raiz do coletor de metadados):
  `extrai_inline_semob.py`, `coleta_js_semob.py`, `sonda_paginas_semob.py`,
  `sonda_linhas_orfas.py`.
- Predecessor da auditoria de shapes: `compara_shape_semob.py`.
- Apresentação da 0509 de hoje (2026-10-29): `rota_509_hoje.py`,
  `detalhe_509_hoje.py`, `lista_509_hoje.py`, `fetch_509_hoje.py`.

## 3. Tornados ferramenta (versionados a partir de agora)

- `audita_shapes_semob.py` — gera `data/gtfs/_AUDITORIA_SHAPES.md`
  (proveniência dos números citados nos rascunhos de issues/ofício).
- `scraper/gtfs_sqlite.py` — Fase 2.5 (empacotamento do feed em SQLite
  offline), já aprovado em ruff/mypy; pendência: teste dedicado.
- `shot_dashboard.py` — captura do dashboard para QA visual (útil quando o
  modelo passar a aceitar imagens).

## 4. Critérios usados

- **Apagar**: iterações de tentativa-e-erro superseded, debug de parser cuja
  versão final vive em ferramenta commitada, demos esgotadas, artefatos de
  toolchain (pytest tmp).
- **Arquivar**: hipóteses já testadas que podem retornar (ex.: RT no
  navegador, operadoras), e a linhagem de scripts que gerou ferramentas
  vivas — a pasta é gitignored para não engordar o repositório.
- **Versionar**: script que PRODUZ artefato versionado do repositório
  (auditoria) ou que pertence ao produto (módulo do pacote).

## 5. Itens que exigem decisão do usuário (nada feito sem ok)

- `tests/live_509/` cresce 1 JSON por rodada (8 hoje); definir política de
  retenção (ex.: manter LOG.md completo + JSONs do dia).
- `scraper/gtfs_sqlite.py`: encadear no CLI (`python -m scraper sqlite`)? e
  teste dedicado — próximo ciclo de trabalho.
