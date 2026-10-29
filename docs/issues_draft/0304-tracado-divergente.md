# Linha 0304: traçado divergente do itinerário oficial SEMOB

**Erro médio** do shape do feed vs oficial: **92.3 m** (mediana 11.9 m, p95 790.5 m) na auditoria de 2026-10-28.

**Coerência com o serviço real** (item 6, 2026-10-29): mantido o traçado do painel (primeira parada a 1202 m dos extremos oficiais).

## Evidência

- Auditoria: `data/gtfs/_AUDITORIA_SHAPES.md` (linha 0304, erro médio 92.3 m).
- Tabela do item 6: `docs/item6_shapes_semob.csv` (paradas longe do traçado oficial).
- Geojson oficial congelado: `data/raw/semob_geojson/0304.json` (data de atualização do itinerário no campo ATUALIZACA, preservada nas notas do feed).

## Hipótese (a confirmar em campo)

Duas leituras possíveis: (a) o traçado oficial da SEMOB está desatualizado em relação ao serviço real — mais provável, dada a evidência do item 6 de paradas longe do oficial; ou (b) o roteamento do painel tem trecho errôneo. Ação sugerida: reportar à SEMOB/operadora com a comparação lado a lado e manter o traçado apurado do painel até resolução.
