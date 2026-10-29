# Feed GTFS João Pessoa — relatório de geração (2026-10-29)

Fonte: painel Mobilibus (project_id 394), respostas brutas de `data/raw/` decifradas.
Feed montado a partir do decodificado; a validação oficial vem depois (seção abaixo).

## Contagens

| Arquivo | Registros |
| --- | --- |
| agency.txt — órgão gestor (dados do painel) | 1 |
| routes.txt — linhas do sistema | 84 |
| stops.txt — paradas únicas com coordenadas | 2097 |
| calendar.txt — serviços por dia da semana | 3 |
| shapes.txt — pontos dos trajetos (polyline decodificada) | 71519 |
| trips.txt — uma viagem por partida real do quadro de horários | 5457 |
| stop_times.txt — horário teórico em cada parada de cada viagem | 476226 |
| feed_info.txt — versão e editor do feed | 1 |

## Notas da montagem (decisões e lacunas)

- [INFORMACAO] AGENCY_FONTE: Nome, fuso (America/Sao_Paulo) e idioma (pt-BR) vêm da resposta get-project do painel (a grafia 'Superintedência' é a da fonte); agency_url é a página institucional da prefeitura — decisão do projeto, pois o painel não publica URL da agência.
- [INFORMACAO] ROUTE_TYPE_FIXO: route_type=3 (ônibus) para todas as linhas: a fonte não publica modal; linhas com prefixo não numérico (CBTU, E, I, T) merecem revisão futura.
- [INFORMACAO] CALENDAR_DATES_AUSENTE: calendar_dates.txt não é gerado: a fonte não publica feriados/dias atípicos. A confirmar com a SEMOB (doc seção 6 lista o arquivo como 'necessário para feriados').
- [INFORMACAO] WAIT_TIME_ZERO: wt=0 em todas as paradas: arrival_time == departure_time em toda a feed.
- [INFORMACAO] DIRECAO_DESCONHECIDA: 40 trips com dir=-1 na fonte: direction_id vazio (desconhecido no GTFS) — preservado como veio.
- [INFORMACAO] TIMEPOINT_TEORICO: timepoint=0 em todos os stop_times: os horários do painel são teóricos (quadro de horários), não aderência garantida — postura documentada no doc do projeto.
- [INFORMACAO] NOMES_PRESERVADOS: stop_name/route_long_name mantêm a grafia da fonte (ex.: 'BR-230 leste'); nomes publicados não são normalizados pelo Flavos Bus.

## Validação interna

- erros: 0 · avisos: 0


## Validação oficial (MobilityData gtfs-validator)

Publicação exige zero erros (doc seção 6). Executar com Java 17+:
`java -jar gtfs-validator-<versão>.jar --input <caminho do gtfs.zip> --validation_report_path <pasta> --system_errors_path <pasta>`
Instruções exatas variam por versão — seguir o README da release oficial.

## Estabilidade dos identificadores

- `route_id` = rid do painel; `stop_id` = sid; `service_id` = sid; `shape_id` = sh-<tid>; `trip_id` = `<tid>-<sid>-<hhmmss>` — todos determinísticos entre coletas (favoritos do app dependem disso).

## Resultado da validação oficial (MobilityData gtfs-validator v8.0.1)

- data de referência: 2026-10-28
- **erros: 0** · avisos: 37 · infos: 0

- [WARNING] mixed_case_recommended_field: 37 ocorrência(s)

Publicação permitida: zero erros (doc seção 6). Warnings avaliados e tratados em `scraper/gtfs/dados.py` (timepoint teórico, direction_id desconhecido vazio, feed_contact_url) ou justificados (nomes da fonte preservados).
