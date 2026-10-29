# data/

- `raw/` — respostas brutas coletadas das fontes públicas (Fase 1). Arquivos pesados não entram no git; a origem de cada arquivo fica documentada em `raw/README.md`.
- `gtfs/` — feed GTFS final, validado, versionado por data (ex.: `2026-10-28`).\
  `route_id`, `stop_id` e `shape_id` devem permanecer estáveis entre versões (favoritos do app dependem deles).
