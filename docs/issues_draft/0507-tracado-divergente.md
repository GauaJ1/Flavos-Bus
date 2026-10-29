# Linha 0507: traçado divergente do itinerário oficial SEMOB

**Erro médio** do shape do feed vs oficial: **34.4 m** (mediana 22.3 m, p95 101.1 m) na auditoria de 2026-10-28.

**Coerência com o serviço real** (item 6, 2026-10-29): mantido o traçado do painel (primeira parada a 1210 m dos extremos oficiais).

## Evidência

- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha 0507, erro médio 34.4 m).
- Tabela do item 6: `docs/item6_shapes_semob.csv` (paradas longe do traçado oficial).
- Geojson oficial congelado: `data/raw/semob_geojson/0507.json` (data de atualização do itinerário no campo ATUALIZACA, preservada nas notas do feed).
