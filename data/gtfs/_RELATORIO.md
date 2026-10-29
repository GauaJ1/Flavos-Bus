# Feed GTFS João Pessoa — relatório de geração (2026-10-29)

Fonte: painel Mobilibus (project_id 394), respostas brutas de `data/raw/` decifradas.
Feed montado a partir do decodificado; a validação oficial vem depois (seção abaixo).

## Contagens

| Arquivo | Registros |
| --- | --- |
| agency.txt — órgão gestor (dados do painel) | 8 |
| routes.txt — linhas do sistema | 84 |
| stops.txt — paradas únicas com coordenadas | 2097 |
| calendar.txt — serviços por dia da semana | 3 |
| shapes.txt — pontos dos trajetos (polyline decodificada) | 71519 |
| trips.txt — uma viagem por partida real do quadro de horários | 5457 |
| stop_times.txt — horário teórico em cada parada de cada viagem | 476226 |
| feed_info.txt — versão e editor do feed | 1 |

## Notas da montagem (decisões e lacunas)

- [INFORMACAO] AGENCY_SEMOB: agency.txt tem as operadoras publicadas pela SEMOB no campo EMPRESA dos geojson de itinerário (endpoint /linhas-de-onibus/<linha>/itinerario/geojson); agency_url aponta para essa página, pois a SEMOB não publica site das empresas. Grafia preservada (maiúsculas, sem acento).
- [AVISO] OPERADORA_NAO_PUBLICADA: 7 linha(s) ficaram em agency_id SEM_OPERADORA — sem traçado publicado (7): 0116, 0120, 0604, 9901, CBTU, I015, T003. Nenhuma operadora foi inferida.
- [AVISO] OPERADORA_DADO_ANTIGO: O campo EMPRESA vem junto do traçado do geojson da SEMOB, cujo ATUALIZACA pode ser antigo (35% dos registros com 4+ anos, 18% sem data na medição de 2026-10). Relatos indicam que operadoras mudaram (a MANDACARUENSE teria deixado de operar), então NÃO tratamos EMPRESA como confirmação atual: agency_id só recebe operadora de traçado com até 4 anos, e todo route_desc declara o ano do dado ('operadora declarada 2019: ...'). Para operadora confirmada hoje é preciso fonte operacional da SEMOB.
- [INFORMACAO] ROUTE_TYPE_FIXO: route_type=3 (ônibus) para todas as linhas: a fonte não publica modal; linhas com prefixo não numérico (CBTU, E, I, T) merecem revisão futura.
- [INFORMACAO] CALENDAR_DATES_AUSENTE: calendar_dates.txt não é gerado: a fonte não publica feriados/dias atípicos. A confirmar com a SEMOB (doc seção 6 lista o arquivo como 'necessário para feriados').
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0106 tid 132083: o traçado oficial deixa 8/84 paradas a mais de 100 m (traçado do painel: 0/84); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0109 tid 132087: o traçado oficial deixa 11/42 paradas a mais de 100 m (traçado do painel: 0/42); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0115 tid 132091: primeira parada a 1442 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0115 tid 2979650: o traçado oficial deixa 13/57 paradas a mais de 100 m (traçado do painel: 0/57); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0304 tid 133524: primeira parada a 1202 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0307 tid 6019830: o traçado oficial deixa 17/79 paradas a mais de 100 m (traçado do painel: 0/79); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0307 tid 6019831: o traçado oficial deixa 21/83 paradas a mais de 100 m (traçado do painel: 0/83); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0500 tid 1181402: o traçado oficial deixa 12/67 paradas a mais de 100 m (traçado do painel: 0/67); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0500 tid 2257544: primeira parada a 1094 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0502 tid 133568: o traçado oficial deixa 15/105 paradas a mais de 100 m (traçado do painel: 0/105); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0502 tid 2690397: o traçado oficial deixa 17/109 paradas a mais de 100 m (traçado do painel: 0/109); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0503 tid 132096: o traçado oficial deixa 8/58 paradas a mais de 100 m (traçado do painel: 0/58); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0507 tid 133838: primeira parada a 1210 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0507 tid 1240560: primeira parada a 1139 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0512 tid 133845: o traçado oficial deixa 13/56 paradas a mais de 100 m (traçado do painel: 0/56); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0517 tid 1231018: o traçado oficial deixa 12/117 paradas a mais de 100 m (traçado do painel: 0/117); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0520 tid 133951: primeira parada a 3111 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0520 tid 2263799: primeira parada a 3111 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 0520 tid 2981039: primeira parada a 3111 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 0522 tid 133939: o traçado oficial deixa 5/56 paradas a mais de 100 m (traçado do painel: 0/56); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 1500 tid 133889: o traçado oficial deixa 2/139 paradas a mais de 100 m (traçado do painel: 0/139); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 1500 tid 133890: o traçado oficial deixa 6/143 paradas a mais de 100 m (traçado do painel: 0/143); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 1500 tid 2252300: o traçado oficial deixa 10/147 paradas a mais de 100 m (traçado do painel: 0/147); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 1500 tid 2687764: primeira parada a 6191 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha 1510 tid 133954: primeira parada a 1196 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 1519 tid 133570: o traçado oficial deixa 27/105 paradas a mais de 100 m (traçado do painel: 0/105); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 1519 tid 2687955: o traçado oficial deixa 28/106 paradas a mais de 100 m (traçado do painel: 0/106); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 5100 tid 133894: o traçado oficial deixa 16/138 paradas a mais de 100 m (traçado do painel: 0/138); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 5100 tid 133895: o traçado oficial deixa 22/140 paradas a mais de 100 m (traçado do painel: 0/140); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 5100 tid 2263777: o traçado oficial deixa 26/144 paradas a mais de 100 m (traçado do painel: 0/144); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 5100 tid 2263782: o traçado oficial deixa 16/138 paradas a mais de 100 m (traçado do painel: 0/138); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 5110 tid 133964: o traçado oficial deixa 10/101 paradas a mais de 100 m (traçado do painel: 0/101); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha 5210 tid 133944: o traçado oficial deixa 28/92 paradas a mais de 100 m (traçado do painel: 0/92); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha E155 tid 3100174: o traçado oficial deixa 47/116 paradas a mais de 100 m (traçado do painel: 0/116); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha E551 tid 3100177: o traçado oficial deixa 46/116 paradas a mais de 100 m (traçado do painel: 0/116); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha E901 tid 6021439: o traçado oficial deixa 13/53 paradas a mais de 100 m (traçado do painel: 0/53); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha E901 tid 6021982: o traçado oficial deixa 18/83 paradas a mais de 100 m (traçado do painel: 0/83); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_SEM_ALINHAMENTO: linha E901 tid 6021985: primeira parada a 1259 m dos extremos do traçado oficial; mantido o traçado do painel
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha E901 tid 6021986: o traçado oficial deixa 5/37 paradas a mais de 100 m (traçado do painel: 0/37); mantido o traçado do painel — oficial parece desatualizado
- [AVISO] SHAPE_SEMOB_REJEITADO_PARADAS: linha I004 tid 130036: o traçado oficial deixa 10/29 paradas a mais de 100 m (traçado do painel: 0/29); mantido o traçado do painel — oficial parece desatualizado
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
