# Linha 5110: traçado divergente do itinerário oficial SEMOB

**Erro médio** do shape do feed vs oficial: **41.9 m** (mediana 19.3 m, p95 154.1 m) na auditoria de 2026-10-28.

**Coerência com o serviço real** (item 6, 2026-10-29): com o traçado oficial, 10 de 101 paradas ficam a mais de 100 m do traçado; com o traçado apurado do painel, nenhuma.

## Evidência

- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha 5110, erro médio 41.9 m).
- Tabela do item 6: `docs/item6_shapes_semob.csv` (paradas longe do traçado oficial).
- Geojson oficial congelado: `data/raw/semob_geojson/5110.json` (data de atualização do itinerário no campo ATUALIZACA, preservada nas notas do feed).
