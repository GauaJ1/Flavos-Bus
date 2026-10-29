# Endpoints descobertos — Fase 1 (reconhecimento concluído)

> Fonte: inspeção DevTools (chamadas capturadas manualmente) + captura automatizada com
> Playwright espionando `JSON.parse`/`JSON.stringify` (nada inventado: tudo medido em
> 2026-10-28/29, projeto público do Mobilibus para João Pessoa/PB).

## Arquitetura observada

- Portal público `https://bus2.mobilibus.com.br/pb/joao-pessoa/` (WordPress — só páginas).
- A API de dados fica no **`https://painel.mobilibus.com/public/*`**, app Angular "Bus2You"
  (`/bus2you/home?p=2qloq`, onde `2qloq` = mini_hash do projeto JP = `project_id` 394).
- **Cifra**: todo pedido/resposta vai como `{"data":"U2FsdGVkX1/..."}` — CryptoJS AES com a
  frase **pública** embutida no bundle do front (`main-es2015.*.js`): `AL0EHMARC0`.
  Formato: OpenSSL `Salted__` + salt 8B + AES-256-CBC + PKCS7, chave/IV derivados por
  EVP_BytesToKey(MD5, 1 iteração). Cifrar = `AES.encrypt(JSON.stringify(params), frase)`;
  Decifrar = `JSON.parse(AES.decrypt(resp.data, frase).toString(enc.Utf8))`.
  (Não é segredo de conta — é ofuscação client-side pública; usamos com relatório honesto.)
- Ruído descartado: Google Analytics, ads (`pagead2`, `adtrafficquality`), UserWay
  (acessibilidade), tiles de mapa `bus2.info/api/public/tiles/...` (Mapbox-like, sem dados
  de linha).

## Endpoints (todos POST, headers comuns, body cifrado acima)

| # | Fluxo | Endpoint | Body em claro (extrapolado de capturas) | Resposta em claro |
| --- | --- | --- | --- | --- |
| 1 | Config do projeto | `POST https://painel.mobilibus.com/public/get-project` | `{"miniHash":"2qloq"}` | lista (1 item) com `project_id` 394, `project_name` "João Pessoa, PB [G]", `feed_hash`, timezone `America/Sao_Paulo`, agências (histórico menciona SEMOB), resumos |
| 2 | **Lista geral de linhas** (alimenta `--all`) | `POST .../public/get-routes` | `{"projectId":394,"agency":null}` | **84 linhas**: `rid` (id numérico), `rsn` (número: "0002","0510","I008","T003"...), `rln` (nome), `rc`/`rtc` (cores), `ol`/`il` (rótulos ida/volta), `cl`, `rd`, `fmt` ("0510 - Tambaú via Tamandaré") |
| 3 | **Tudo de uma linha** (viagens+horários+paradas+shape) | `POST .../public/get-timetable` | `{"routeId":42071,"date":null,"serviceIds":null}` (`routeId` = `rid` da linha) | lista de viagens (0510: 3): `tid` (trip id), `th` (headsign), `ths` (observação), `dir` (0/1 = sentido), `wa`, `tr`, `sp` (**shape em encoded polyline**), `tsn`, `stops` (**sequência de paradas**), `services` (**tipos de dia com partidas**) |
| 4 | Serviços em uso num dia | `POST .../public/get-used-calendar` | `{"project_id":394,"day":"2026-10-29"}` | `[19911]` (ids de serviço ativos na data) — redundante: os `services` já vêm no `get-timetable` com flags `seg ter qua qui sex sab dom` |
| 5 | Partidas numa parada (tempo real/planejado) | `POST .../public/get-stop-departures` | `{"stop_id":995739,"project_id":394,"offset":-3,"route_id":42071,"route_short_name":"0510"}` | lista `trip_id`, `trip_departure`, `stop_departure`, `stop_sequence`, `feed_id`, `time` |
| 6 | Veículos em tráfego (realtime) | `POST .../public/get-route-vehicles` | `{"projectId":394,"route":"0510"}` | lista (vazia fora do horário) — Fase realtime, fora do escopo da F1 |

## Estrutura interna de `stops[]` e `services[]` (do get-timetable 0510)

- `stop`: `{"sid":996679,"dt":"00:02:44","sdt":"1.048","wt":0,"sc":null,"sn":"Parque Sólon de Lucena - Plataforma 1","sd":null,"lat":"-7.11837676","lon":"-34.87964890","wb":1,"ref":0,"st":"Parque Sólon de Lucena","stn":"413","stt":3,"seq":1}`
  → `sid` stop id · `dt` hora de passagem desde a partida · `sdt` distância km · `sn` nome · `lat/lon` coordenadas · `seq` ordem. 48 paradas na viagem dir=1; 96 na dir=0.
- `service`: `{"sid":19911,"sn":"Dias Úteis","sd":"2024-01-01T00:00:00.000Z","ed":"2026-12-31T00:00:00.000Z","deps":[{"dt":"05:15:00","at":null,"wb":1,"nd":false},...],"seg":1,"ter":1,"qua":1,"qui":1,"sex":1,"sab":0,"dom":0}`
  → **partidas (`deps`) por tipo de dia com flags de dia da semana embutidas** (19911 Dias Úteis, 19912 Sábado, 19913 Domingo). Uma coleta por linha cobre útil+sábado+domingo.

## Mapeamento para as fases

- `get-routes` → índice de linhas (`collect --all`) e GTFS `routes.txt`.
- `get-timetable` por linha → GTFS `trips.txt` (`tid`,`dir`,`th`), `stops.txt` (union de `stops[]`), `stop_times.txt` (`dt`+`seq`+`deps`), `shapes.txt` (`sp`, polyline padrão Google), `calendar`+`calendar_dates` (`services[]` flags/`sd`/`ed`; feriados via `get-used-calendar` em datas-alvo).
- `get-stop-departures` → opcional (não necessário p/ GTFS estático).

## Checklist final

- [x] Endpoints reais registrados (nada inventado; exemplos extraídos de capturas reais em `captura_extras/`).
- [x] Exige login? **Não** (chamadas públicas; cookie nenhum necessário).
- [x] Fixture de teste: captura real recortada (capsula `captura.jsonl`; sintetizáveis nos tests além do par claro↔cifrado para validar a cifra).
- [x] Passphrase pública identificada (fase de automação pendente: testar decifração dx real).
