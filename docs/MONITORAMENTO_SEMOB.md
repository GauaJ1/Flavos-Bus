# Monitoramento de defasagem â€” dados oficiais SEMOB-JP Ã— feed Flavos Bus

Gerado em **29/10/2026 06:53** (metadados congelados)
 Â· Metadados coletados: **2026-10-29T06:52:51**
 Â· CritÃ©rio: fresca â‰¤ 1 ano Â· aceitÃ¡vel â‰¤ 4 anos Â· defasada acima Â· sem-data = traÃ§ado sem ATUALIZACA.

Fonte: campo `ATUALIZACA`/`SEGEO`/`EMPRESA` do geojson de itinerÃ¡rio (`/linhas-de-onibus/<linha>/itinerario/geojson`). Nada Ã© inferido.

- Linhas monitoradas: **77**
- Sem geojson publicado: **7** (0116, 0120, 0604, 9901, CBTU, I015, T003)
- TraÃ§ado fresco (â‰¤1a): **20** Â· aceitÃ¡vel: **17** Â· defasado (>4a): **26** Â· sem data: **14**

Uso em automaÃ§Ã£o (CI/agendado): `python tools/scraper/monitora_semob.py --online --json`; CSV em `docs/monitoramento_semob.csv`.

## Linha 0509 â€” JoÃ£o Agripino (linha de validaÃ§Ã£o contÃ­nua)

- Status do traÃ§ado oficial: **defasada** (idade mÃ­n. 8.04 anos Â· ATUALIZACA 2018-10-15; 2018-10-15)
- Operadora declarada: MARCOS DA SILVA â€” dado declarativo, nÃ£o confirmaÃ§Ã£o atual (ver relatÃ³rio do feed).
- SEGEO: 2018 Â· tipo: RADIAL

Nota: os horÃ¡rios da 0509 no feed vÃªm do painel Mobilibus (Bus2), nÃ£o do geojson; o que envelhece aqui Ã© o traÃ§ado oficial da SEMOB.

## Linhas fora da tolerÃ¢ncia (defasadas ou sem data)

| Linha | Status | Idade mÃ­n. | ATUALIZACA | Operadora declarada | SEGEO |
| --- | --- | ---: | --- | --- | --- |
| 0003 | defasada | 7.56 | 2019-04-09; 2019-04-09 | MARCOS DA SILVA | 2019 |
| 0101 | defasada | 8.16 | 2018-08-30; 2018-08-30 | SANTA MARIA | 2018 |
| 0103 | sem-data | â€” | 1899-12-30; 1899-12-30 | SANTA MARIA | ? |
| 0104 | defasada | 7.2 | 2019-08-19; 2019-08-19 | SAO JORGE | 2019 |
| 0105 | sem-data | â€” | 1899-12-30; 1899-12-30 | SANTA MARIA | ? |
| 0106 | defasada | 7.88 | 2018-12-12; 2018-12-12 | REUNIDAS | 2018 |
| 0109 | defasada | 6.0 | 2020-10-30; 2020-10-30 | SANTA MARIA | 2020 |
| 0110 | sem-data | â€” | 1899-12-30; 1899-12-30 | SAO JORGE | ? |
| 0123 | defasada | 6.2 | 2020-08-17; 2020-08-17 | SANTA MARIA | 2020 |
| 0204 | defasada | 7.56 | 2019-04-09; 2019-04-09 | TRANSNACIONAL | 2019 |
| 0208 | defasada | 7.56 | 2019-04-09; 2019-04-09 | TRANSNACIONAL | 2019 |
| 0301 | sem-data | â€” | 1899-12-30; 1899-12-30 | TRANSNACIONAL | ? |
| 0302 | defasada | 9.69 | 2017-02-17; 2017-02-17 | TRANSNACIONAL | 2017 |
| 0303 | defasada | 6.02 | 2020-10-20; 2020-10-20 | REUNIDAS | 2021 |
| 0402 | defasada | 4.19 | 2022-08-22; 2022-08-22 | REUNIDAS | 2022 |
| 0500 | defasada | 5.46 | 2021-05-13; 2021-05-13 | REUNIDAS | 2021 |
| 0504 | sem-data | â€” | 1899-12-30; 1899-12-30 | MANDACARUENSE | ? |
| 0506 | defasada | 8.19 | 2018-08-22; 2018-08-22 | MARCOS DA SILVA | 2018 |
| 0509 **(509)** | defasada | 8.04 | 2018-10-15; 2018-10-15 | MARCOS DA SILVA | 2018 |
| 0510 | defasada | 5.46 | 2021-05-13; 2021-05-13 | REUNIDAS | 2021 |
| 0512 | sem-data | â€” | 1899-12-30; 1899-12-30 | MARCOS DA SILVA | ? |
| 0518 | defasada | 5.98 | 2020-11-05; 2020-11-05 | TRANSNACIONAL | 2020 |
| 0522 | sem-data | â€” | 1899-12-30; 1899-12-30 | REUNIDAS | ? |
| 0527 | sem-data | â€” | ;  | TRANSNACIONAL | ? |
| 0530 | defasada | 6.02 | 2020-10-20; 2020-10-20 | REUNIDAS | 2020 |
| 0600 | defasada | 7.26 | 2019-07-26; 2019-07-26 | REUNIDAS | 2019 |
| 0601 | sem-data | â€” | 1899-12-30; 1899-12-30 | REUNIDAS | ? |
| 0701 | sem-data | â€” | 1899-12-30; 1899-12-30 | SAO JORGE | ? |
| 0702 | defasada | 9.6 | 2017-03-22; 2017-03-22 | SAO JORGE | 2017 |
| 1001 | defasada | 7.21 | 2019-08-15; 2019-08-15 | MANDACARUENSE | 2019 |
| 1500 | defasada | 6.05 | 2020-10-09 | TRANSNACIONAL | 2020 |
| 2300 | sem-data | â€” | 1899-12-30 | SAO JORGE | ? |
| 2515 | defasada | 9.69 | 2017-02-17; 2017-02-17 | REUNIDAS | 2021 |
| 5100 | sem-data | â€” | 1899-12-30 | TRANSNACIONAL | ? |
| 5600 | sem-data | â€” | 1899-12-30; 1899-12-30 | REUNIDAS | ? |
| 5603 | defasada | 6.06 | 2020-10-08; 2020-10-08 | REUNIDAS | 2020 |
| 5605 | sem-data | â€” | 1899-12-30; 1899-12-30 | REUNIDAS | ? |
| I004 | defasada | 6.02 | 2020-10-20; 2020-10-20 | SAO JORGE | 2020 |
| T001 | defasada | 6.07 | 2020-10-02 | SANTA MARIA | 2020 |
| T002 | defasada | 5.97 | 2020-11-09 | TRANSNACIONAL | 2020 |
