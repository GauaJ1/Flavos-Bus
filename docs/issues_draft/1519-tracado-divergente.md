# Linha 1519: traçado divergente do itinerário oficial SEMOB

**Erro médio** do shape do feed vs oficial: **31.9 m** (mediana 12.0 m, p95 117.3 m) na auditoria de 2026-10-28.

**Coerência com o serviço real** (item 6, 2026-10-29): com o traçado oficial, 28 de 106 paradas ficam a mais de 100 m do traçado; com o traçado apurado do painel, nenhuma.

## Evidência

- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha 1519, erro médio 31.9 m).
- Tabela do item 6: `docs/item6_shapes_semob.csv` (paradas longe do traçado oficial).
- Geojson oficial congelado: `data/raw/semob_geojson/1519.json` (data de atualização do itinerário no campo ATUALIZACA, preservada nas notas do feed).
