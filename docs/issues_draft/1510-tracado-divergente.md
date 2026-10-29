# Linha 1510: traçado divergente do itinerário oficial SEMOB

**Erro médio** do shape do feed vs oficial: **41.1 m** (mediana 17.0 m, p95 133.1 m) na auditoria de 2026-10-28.

**Coerência com o serviço real** (item 6, 2026-10-29): mantido o traçado do painel (primeira parada a 1196 m dos extremos oficiais).

## Evidência

- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha 1510, erro médio 41.1 m).
- Tabela do item 6: `docs/item6_shapes_semob.csv` (paradas longe do traçado oficial).
- Geojson oficial congelado: `data/raw/semob_geojson/1510.json` (data de atualização do itinerário no campo ATUALIZACA, preservada nas notas do feed).
