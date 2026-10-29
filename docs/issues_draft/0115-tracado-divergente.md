# Linha 0115: traçado divergente do itinerário oficial SEMOB

**Erro médio** do shape do feed vs oficial: **68.0 m** (mediana 16.5 m, p95 376.6 m) na auditoria de 2026-10-28.

**Coerência com o serviço real** (item 6, 2026-10-29): com o traçado oficial, 13 de 57 paradas ficam a mais de 100 m do traçado; com o traçado apurado do painel, nenhuma.

## Evidência

- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha 0115, erro médio 68.0 m).
- Tabela do item 6: `docs/item6_shapes_semob.csv` (paradas longe do traçado oficial).
- Geojson oficial congelado: `data/raw/semob_geojson/0115.json` (data de atualização do itinerário no campo ATUALIZACA, preservada nas notas do feed).

## Hipótese (a confirmar em campo)

Duas leituras possíveis: (a) o traçado oficial da SEMOB está desatualizado em relação ao serviço real — mais provável, dada a evidência do item 6 de paradas longe do oficial; ou (b) o roteamento do painel tem trecho errôneo. Ação sugerida: reportar à SEMOB/operadora com a comparação lado a lado e manter o traçado apurado do painel até resolução.
