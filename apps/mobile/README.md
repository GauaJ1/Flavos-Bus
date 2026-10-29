# Flavos Bus — app de horários (MVP offline)

React Native + Expo (SDK 58) + TypeScript. Alvo principal Android/iOS no
**Expo Go**; a web serve só para depuração (`expo start --web`). Navegação
com Expo Router. O app lê o `flavos.sqlite` gerado pelo `tools/scraper` —
**sem rede em runtime**. Todo horário exibido é teórico (do feed) e o aviso
"Horários teóricos (programados)..." está sempre visível no topo.

## Rodar no celular (Expo Go) — passo a passo

1. Instale **Expo Go** no aparelho (Play Store / App Store).
2. Gere o banco, se ainda não existe (em `tools/scraper`):
   `python -m scraper sqlite` — na entrega já existe em
   `data/gtfs/flavos.sqlite`.
3. Copie o pacote para dentro do app:
   `pnpm --dir apps/mobile sync-db`
4. Instale as dependências e abra o dev server:
   `pnpm install` e depois `pnpm --dir apps/mobile start`
5. No Expo Go, **escaneie o QR code** do terminal.
6. **Modo avião**: depois do primeiro carregamento (o bundle vem do
   computador na rede local), feche e reabra o app no Expo Go com o avião
   ligado — o banco está embutido no app, as consultas são todas locais
   (expo-sqlite) e a tela funciona sem rede. Sem o computador ligado, um
   build de desenvolvimento (EAS) removal a dependência do dev server; o
   dado continua o mesmo asset.

## Web de depuração

`pnpm --dir apps/mobile start --web` (mesma base TS; no navegador o
expo-sqlite importa o mesmo asset do bundle). Ferramentas de verificação:
`node scripts/verifica_web.mjs` (11 checks de conteúdo),
`node scripts/capturas_web.mjs` (screenshots claro/escuro em
`docs/design/telas`), `node scripts/contraste.mjs` (WCAG dos tokens).

## Testes de verdade

- `pnpm -r typecheck` — TS no app, web e pacote compartilhado;
- em `tools/scraper`: `python -m pytest -q` — 15/15 (contagens, sem
  órfãos, próximos horários da 0509, operadora em `descricao`);
- checks de runtime web com resultado em
  `docs/design/telas/relatorio_runtime.md`; contraste AA em
  `docs/design/telas/contraste_tokens.md`.

## Código

- `app/index.tsx` (busca; prioriza as 12 linhas do MVP por frequência) e
  `app/linha/[id].tsx` (próxima saída, quadro por dia/sentido, operadora
  declarada com o ano da fonte);
- `src/db/provedor_dados.tsx` — abre o banco offline (nativo copia o asset
  para o SQLite do aparelho; web importa o asset);
- `src/tema/theme.ts` — TODOS os tokens de design (claro/escuro, AA);
- `src/ui/` — biblioteca de componentes (aviso permanente, placa de linha,
  faixa de horários, estados, alvos de toque ≥ 48);
- `src/dados/linhas_mvp.ts` — a 12 linhas priorizadas (gerada por
  `python -m scraper linhas_mvp`, ver `docs/design/LINHAS_MVP.md`).

## Pendências (Tarefa 7 — mapa e favoritos)

Não implementados neste MVP; lista acordada (a verificação de verdade das
telas existentes consumiu o tempo do MVP):

- [ ] Favoritos: persistir route_ids (AsyncStorage), estrela no cartão e
      ordenação "favoritos primeiro" na busca;
- [ ] Mapa das linhas: `react-native-maps` **só no nativo** (arquivo
      `mapa.nativo.tsx`) e Leaflet **só na web** (`mapa.web.tsx`), atrás de
      `Platform.select` — o banco já tem os traçados (71.519 pontos de
      shapes);
- [ ] Aviso de precisão no mapa: shapes são traçados declarados (podem ser
      generalizados pela SEMOB), nunca GPS em tempo real;
- [ ] Testes: render dos dois mapas, permissão de localização recusada.
