# apps/api — API pública

Backend REST + OpenAPI (Node.js + Fastify ou Express). Somente leitura (GET), JSON, prefixo `/api/v1`. O app usa a API para baixar o feed e verificar versões; o dia a dia roda no SQLite local.

Endpoints previstos: `/linhas`, `/paradas`, `/feed` — especificação completa na seção 7 de [docs/arquitetura-e-escopo.md](../../docs/arquitetura-e-escopo.md).
