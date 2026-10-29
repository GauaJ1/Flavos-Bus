# apps/mobile — Flavos Bus (app)

React Native + Expo + TypeScript — alvo principal Android/iOS; web serve só para depuração (`expo start --web`). Navegação com Expo Router.

- `app/` — rotas (Expo Router)
- `src/components/` — componentes reutilizáveis
- `src/features/` — linhas, paradas, mapa, favoritos
- `src/db/` — SQLite local e consultas GTFS (offline primeiro)
- `src/services/` — cliente da API, localização
- `assets/brand/` — logos do projeto
