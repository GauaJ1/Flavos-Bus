# LOG de referência 509 — o app mostra o horário que o passageiro vai ver?

Fontes comparadas: flavos.sqlite (o que o app lê) == feed GTFS == painel Bus2
(quadro de hoje). Formato: Data | Hora | Tarefa | 509 no app/SQLite | Bus2 | Dif | Obs

| Data | Hora | Tarefa | 509 no app/SQLite | Bus2 | Dif | Obs |
|---|---|---|---|---|---|---|
| 2026-10-29 | 13:12 | feed (pré-app, teste_509) | 20 viagens 05:00–17:40 | 20/20 iguais | 0 | RT público off (prova às 08:05–08:07); em campo: carro visado passou 13:45 (prev. 13:35, +10 min) |
| 2026-10-29 | 13:35 | T1 (sqlite) | sqlite: 20 trips p/ 0509; Epitácio 550 seq 36: 13:35, 14:15, 14:55… | bus2 20/20 (teste das 13:12) | 0 | flavos.sqlite gerado (58,1 MB): 84 routes, 5.457 trips, 476.226 stop_times; horários = feed = Bus2 |
| 2026-10-29 | 13:55 | T2 (scaffold Expo) | app embute flavos.sqlite como asset (61MB no bundle iOS); consulta contarLinhas/horarios via @flavos/shared = mesmo SQL validado em T1 | bus2 20/20 (13:12) | 0 | export iOS + expo start validados localmente; leitura no Expo Go aguarda aparelho (pendência) |
| 2026-10-29 | 14:05 | T3+T4 (telas busca/detalhe) | mesmo SQL do app (partidas por viagem, coluna seq): 20 partidas 05:00→17:40, sentido único; momento: quadro mostra 14:15 como próxima (após 13:59) | bus2 20/20 (13:12) | 0 | bug pego pela prova: order by textual desordenava (feed usa "5:00:00") — corrigido com normalização de hora + sort em minutos; typecheck limpo; export ios+web OK |
| 2026-10-29 | 14:10 | T5 (lista MVP) | 0509 é 66ª do ranking por frequência (20 viagens/dia útil — baixa frequência real; a linha do teste virou exemplo, não alvo do MVP); busca por "509" continua achando (lista só prioriza o topo) | bus2 20/20 | 0 | critério honesto registrado: frequência como proxy de uso (não há dado de passageiros) |
| 2026-10-29 | 14:40 | T6 web (runtime) | busca "509" encontra; detalhe 0509: 20 partidas 05:00→17:40 visíveis; aviso teórico no topo; 11/11 checks + contraste AA 8/8 pares | bus2 20/20 (13:12) | 0 | web revelou: feed usa route_desc p/ "operadora declarada..." (o sqlite não guardava) → schema do banco corrigido (coluna descricao) e regenerado; 0509 mesmo SEM operadora: app oculta o campo (não inventa) |
| 2026-10-29 | 15:05 | pós-doc Moovit | doc do usuário estudado → testes derivados: 10/10 web (incl. rede externa BLOQUEADA) + 4/4 banco; 0509: quadro íntegro, próxima no topo, aviso antes dos horários, idade do dado visível | bus2 20/20 (13:12) | 0 | doc pedia "normaliza nomes": busca agora acha "Tambau"/"Goiam" sem acento (colunas *_norm no sqlite; regenerado 58,1 MB; suite 19/19) |
