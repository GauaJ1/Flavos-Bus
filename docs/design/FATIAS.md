# Flavos Bus — Redesign por fatias: documentação completa (até a fatia 3)

Data: 2026-11-01 · Branch: `redesign/moovit` (pushed; main NUNCA recebe push).
Par de `DIRECAO.md` (que registra DIREÇÃO e decisões): este documento registra
**o que foi entregue, com que provas e o que ficou pendente** — fatia por
fatia. Nada aqui é aspiracional: cada item tem commit, script de prova e/ou
captura no disco.

---

## 0. Estado geral e infraestrutura

- App: `apps/mobile` — Expo SDK 58 (expo 58.0.x, react-native 0.88, expo-router
  ~58, expo-sqlite ~58), TypeScript estrito (`tsc --noEmit` = gate).
- Monorepo pnpm com `nodeLinker: hoisted`; lockfile vive SÓ na raiz do repo.
- Dependências relevantes instaladas: `phosphor-react-native@3.0.6` (ícones),
  `@types/node` (devDep). NÃO instaladas (e fora de escopo até pedido):
  reanimated, gesture-handler, jest, zustand, expo-location.
- Testes: `node:test` nativo (Node 24, type-stripping) — script
  `pnpm run test` = `node --test testes/*.test.ts`. **31 testes verdes**
  ao fim da fatia 3 (16 das fatias 1–2 + 9 filtro + 5 preferências +
  1 pares fatia 3); os assets da fatia 1 têm provas python (exit 0).
  WEB = depuração (a galeria tem guard `__DEV__`: export de produção
  renderiza vazio por design).
- Ferramentas de prova local: Playwright ESM com `channel: "msedge"` (smoke +
  capturas), dev-server Expo na porta 8081, python do runtime DSH (PIL+numpy)
  para os assets da marca.
- Capturas/provas vivas em `.claude/` (gitignored) — são os artefatos de
  revisão HUMANA por fatia; o código que as gera está commitado.

### Regras invariantes (valem em toda fatia)

1. `src/tema/tokens.ts` é a ÚNICA fonte de cor/espaço/sombra; o que depende
   de plataforma (pilha de fontes) vive em `src/tema/fontes.ts`; `theme.ts`
   só reexporta/ponte. Nenhum hex em componente novo; Nenhum `fontFamily`
   literal fora de `fontes.ts` (grep por fatia).
2. `tokens.ts` NÃO importa react-native (os testes node:test leem os tokens
   direto); arquivo dependente de plataforma separado (idem SQL pura em
   `db/usuario_sql.ts`).
3. `theoretical*` SÓ no TheoreticalBadge (grep por fatia).
4. Sem tempo real: nenhum "ao vivo", pulso, sinal verde de chegada. Aviso
   fixo: "Os horários são teóricos (programados), não mostram a posição dos
   ônibus".
5. Nada inventado: dados só do feed/docs (mesmo SQL/mesma fonte quando
   testável); o que falta vira "indisponível" + listado no relatório.
6. Numerais ≥ 19px/700 com `tabular-nums` (limiar 3:1 sobre cor do feed;
   ≤ 4.58 fallback preto/branco); corpo ≥ 4.5.
7. Alvos de toque ≥ 44 (piso verificado; alvo de projeto 48).
8. Ícones só de `phosphor-react-native`; sem setas em texto.
9. Componentes novos SEM margem externa própria (o contêiner controla gaps).
10. Git por grupos coerentes + worktree limpo + push SÓ em
    `origin/redesign/moovit`.

---

## 1. Fatia 1 — Identidade visual (assets da marca)

- `apps/mobile/scripts/gerar_assets_marca.py` (python com PIL/numpy, workdir
  = raiz do repo): gera adaptive icon (foreground/background), splash e
  favicon a partir da marca, com provas de fidelidade (comparações
  pixel a pixel, exit 0).
- Prancha de auditoria `.claude/prancha_fatia1.png` (v9: 263.324 bytes)
  com células por asset; a 6ª célula mostra
  `adaptive_foreground` SOZINHO sobre `#0B0E17` para PROVAR vazamento
  (correção v9: antes levava o `adaptive_background` junto, o que escondia
  o vazamento).
- Paleta do app medida das regiões da logo (`tools/scraper/.tmp/
  corr_verde_regioes.py`, `.claude/paleta_debug.png`) → virou a tabela de
  tokens do `DIRECAO.md`.
- Pendência registrada: camada monocromática do ícone (Android 13+) só
  antes da loja.
- Commits: `44fade5` (assets), `55ba02b` (docs da fatia).

## 2. Fatia 2 — Tema/tokens + componentes base (galeria)

**Conteúdo**: tokens claro/escuro completos; ponte de compatibilidade
`theme.ts` (telas antigas continuam com tinta/acento/papel sem quebrar);
10 componentes novos em 9 seções da galeria: LineBadge, TheoreticalBadge,
SearchBar, NextDepartureCard, StopRow, TimelineStop, EmptyState, Skeleton,
BottomSheet e o par Segmented/DaySegmented (na fatia 3 o DaySegmented virou
wrapper fino do Segmented genérico).

**Galeria** (`app/galeria.tsx`, dev-only): catálogo visual com guard
`__DEV__`; parâmetro `?parte=1..4` (bissecção de diagnóstico — cada parte
inclui as anteriores); `headerShown:false` declarado DENTRO da rota (sem
tocar `_layout` global — descoberta: arquivos com prefixo `_` não viram
rota, mas o header do Stack pinta faixa branca no topo escuro, provado com
`elementFromPoint`).

**Correções técnicas da fatia** (todas com prova):
- **Ciclo do BottomSheet na web**: Metro dá prioridade ao sufixo de
  plataforma — `import "./bottom_sheet"` de dentro de `bottom_sheet.web.tsx`
  resolvía PARA ELE MESMO (recursão → tela branca). Fix: contrato de tipos
  puro em `bottom_sheet_tipos.ts` + `bottom_sheet.tsx` como fachada
  (commit `1c98bb4`).
- Header padrão do Stack pintava faixa branca no tema escuro →
  `headerShown:false` na rota; re-prova: topo escuro RGB(11,14,23).
- Capturas objetivas pegaram 2 defeitos reais: input RNW do SearchBar com
  21px de altura dentro do casco de 48 (`minHeight:44` no campo) e campo de
  demo com handler no-op (deu `value=""` no fill) → `CampoBuscaDemos` com
  estado real.

**Provas numéricas**: `testes/pares_componentes.test.ts` (35 pares de
contraste nos 2 temas — LineBadge 3:1 grande / 4.5 override, TheoreticalBadge
4.5, SearchBar/DaySegmented/NextDepartureCard/StopRow/TimelineStop/EmptyState
4.5), `testes/contraste_badge.test.ts` (4), `testes/proxima_saida.test.ts`
(11) — 16/16 no `pnpm run test` da época.
**Scripts**: `capturas_galeria.mjs` (16 PNGs + checagens: overflow ≤
innerWidth em 360/390; toque ≥ 43.5; títulos no DOM; digitação real; 0 erros
de console), `diag_galeria.mjs`, `diag_topo_escuro.mjs`, `diag_fontes.mjs`.
**Commits**: `acc06a3` (lógica), `15c288b` (componentes), `2f0dfe9` (galeria),
`1c98bb4` (fixes + capturas).

Lógica de próxima saída (comitada nesta fatia, lendo o feed real):
fuso FIXO `America/Fortaleza` (`minutosFortaleza = floor(t/60000) − 180`);
GTFS ≥ 24:00 vira dia de serviço anterior; `estado = primeira.dia ===
"amanha" ? "ultima_passou" : "ha_proxima"`; `calendar_dates` NÃO existe no
feed (tratado como dia normal, documentado). Demo determinística com
`AGORA_FIXO = 2026-01-12T17:23Z` (14:23 Fortaleza).

## 3. Parte A — ajustes da fatia 2 aprovados pelo dono (commit `11cf4b4`, push)

| Item | O que foi feito | Prova |
|---|---|---|
| A1 fonte sem serifa | causa raiz: `sans-serif-condensed` (Android) inexistente no desktop → serif do browser. Pilha ÚNICA por plataforma em `src/tema/fontes.ts` (web: system-ui/Segoe/Roboto…; nativo: sem nome); `tokens.ts` voltou a não importar react-native | tabela `getComputedStyle` (`.claude/fontes_resolvidas.txt`): 0 serif; grep: fontFamily só em `fontes.ts` |
| A2 DaySegmented | full-width: trilha com borda/raio/padding 2, 3 segmentos `flex:1`, ≥44, ativo = primary + onPrimary + peso 800 | capturas 360; checagem de toque do script |
| A3 gaps da galeria | 16 entre demos; 32 entre seções (`espaco.gg`); componentes sem margem externa | capturas refeitas |
| A4 capturas | 16 PNGs (4 partes × 2 temas × 390x844/360x640) + checagens objetivas impressas por página; nomes `galeria_<w>x<h>_<tema>_p<N>.png` | **16/16 "RESULTADO: TUDO OK"** (pegou os 2 defeitos acima) |
| A5 prancha v9 | 6ª célula = foreground SOZINHO sobre #0B0E17 | prancha 263.324 B; provas de fidelidade re-rodadas exit 0; assets regerados byte a byte idênticos |
| A6 icones.tsx | `git show`/diff fatia 2 | diff `icones.tsx` VAZIO; 29 arquivos tocados na fatia 2 sem nenhuma tela antiga |
| A7 script test | `"test": "node --test testes/*.test.ts"` | `pnpm run test` 16/16 (a causa da falha inicial era `import { Platform }` no tokens — Flow do react-native fora do Metro; resolvido com `fontes.ts`) |
| A8 docs | pendência "BottomSheet nativo em aparelho antes da fatia 4" | `DIRECAO.md` § Pendências |
| A9 push | branch `redesign/moovit` criada a partir do estado aprovado e pushada (`-u origin redesign/moovit`) | `origin/redesign/moovit` com tracking; main nunca tocada |

## 4. Fatia 3 — Navegação, Linhas, Busca, tema manual e Sobre

### 4.1 Navegação (B1)

- `_layout.tsx`: Stack raiz `ProvedorDeDados + TemaProvider`; `headerShown:
  false` (cada tela desenha o próprio topo; o Detalhe antigo tem o próprio
  "voltar à busca").
- `(tabs)/_layout.tsx`: abas na ordem do dono — Início, Linhas, Favoritos,
  Sobre — ícone phosphor (fill quando ativo) + rótulo SEMPRE visível
  (11px, peso 800 ativo / 600 inativo), ativo por COR E PESO em `primary`,
  fundo `surface` + hairline superior + safe area do bottom-tabs.
- **Decisão de rota (exposta e provada)**: a rota vazia do grupo é SEMPRE o
  arquivo `index` no expo-router (`initialRouteName` é ignorado para o
  deep-link inicial — o smoke da fatia provou: com `initialRouteName` o app
  ainda abria no Início). Enquanto o Início é PROVISÓRIO, a aba inicial
  pedida é LINHAS → a LISTA de linhas mora em `(tabs)/index.tsx` (rota `/`,
  aba de rótulo "Linhas") e a Home provisória é `(tabs)/inicio.tsx` (rota
  `/inicio`). Tentativa intermediária com `router.replace` foi descartada
  (substituía a entrada da aba Início no navigator e a tela nunca mais
  aparecia). Anotado em `DIRECAO.md` § "Estado após a fatia 3".

### 4.2 Tela Linhas (B2) — `(tabs)/index.tsx` + `src/dados/linhas_do_feed.ts`

- Topo: título + SearchBar variante BOTÃO (role button, abre `/buscar`).
- Lista REAL: consulta própria com `color/text_color` do feed (o `Linha` do
  `@flavos/shared` não tem cores e `packages/shared` NÃO foi tocado);
  `keyExtractor = route_id`; item MEMOIZADO (LineBadge + nome em 2 linhas
  com reticências; nome = `long_name` antes do " | " — terminais/sentido
  NÃO existem no feed e não são inventados).
- Ordem: ranking do MVP (`linhas_mvp.ts`, 12 linhas com mais viagens de
  dia útil) antes das demais por número. RÓTULO honesto: "Primeiro as do
  MVP (mais viagens no dia útil); as demais por número." — afirmar "por
  número de viagens" para a lista INTEIRA seria inventado (só o top-12 tem
  contagem real).
- Estados: Skeleton 5 itens · erro com "Tentar de novo" (relança a leitura)
  · vazio (EmptyState) · SEM TheoreticalBadge (a lista não tem horário).

### 4.3 Tela Buscar (B3) — `app/buscar.tsx` + `src/dados/filtro_linhas.ts`

- Filtro como FUNÇÃO PURA (sem React/banco/RN): `normalizar` (NFD sem
  acento, lower, espaços colapsados), `semZerosEsquerda` ("0002"→"2",
  "000"→"0"), ordem EXATO > PREFIXO > CONTÉM com desempate pelo número.
  A tela só chama; 9 testes cobrem: "101"→0101 exato primeiro; "2"→0002
  (e não 0102); "e550"→E550; "sao"→São; vazio→todas; "zzz"→vazio; peso de
  ordem; zeros; acentos.
- UX: foco automático (autoFocus, provado no smoke: `activeElement`
  é o input), volta com ícone phosphor (sem seta em texto),
  `keyboardShouldPersistTaps="handled"`, sem resultado → EmptyState com
  "Limpar busca" (campo volta a `""` — provado).

### 4.4 Tema manual + preferências (B4) — `src/tema/{modo,tema_provider}.tsx`, `src/db/{usuario,usuario_sql}.ts`

- `modo.ts` (PURO): `ModoTema = sistema|claro|escuro`; `validarModo`
  (default sistema); `resolverEscuro` (manual vence; sistema segue o
  aparelho) — tabela 3×2 testada.
- `usuario_sql.ts` (PURO): as SQLs do banco do usuário como constantes
  (`flavos_usuario.db`, tabela `preferencias` chave/valor,
  `CREATE TABLE IF NOT EXISTS` idempotente, upsert
  `ON CONFLICT(chave) DO UPDATE`). `usuario.ts` abre com expo-sqlite e
  executa as MESMAS strings — e o teste roda as MESMAS SQLs em
  `node:sqlite` em memória (5 testes: migração 2×, upsert atualiza sem
  duplicar, leitura inexistente, validarModo, resolverEscuro).
- `tema_provider.tsx`: carrega o modo, expõe `{modo, aoEscolherModo,
  pronto}` e persiste na troca; se o banco falhar segue com "sistema"
  (avisável no Sobre — sem fingir persistência).
- `theme.ts`: `useTema()` = único caminho de cor: lê o modo do provider +
  `useColorScheme` do sistema. **grep: useColorScheme só existe em
  theme.ts** (os outros 2 matches são comentários).
- `Segmented` genérico (`src/ui/segmented.tsx`): opções `flex:1`, ≥44 ativa
  primary+onPrimary+peso 800, `role=tablist/tab`; DaySegmented vira wrapper
  fino (só rótulos e tipos de dia do GTFS).

### 4.5 Sobre (B5) — `(tabs)/sobre.tsx`

- Seletor de tema (Segmented) que MUDA NA HORA e persiste.
- Dados: versão do feed, gerado-em (formatados), nº de linhas (do próprio
  feed via provedor); versão do app do `app.json` do bundle (import JSON,
  sem dependência nova).
- Aviso fixo dos horários teóricos (com TheoreticalBadge).
- Créditos SÓ do que consta: feed (`agencies`: operadoras; URL
  `servicos.semobjp.pb.gov.br`) + docs (`docs/DIVERGENCIAS_SEMOB.md`:
  "quadro oficial da SEMOB-JP via painel Mobilibus/Bus2") + licença marcada
  como **indisponível** (não consta no feed nem em docs).

### 4.6 Verificação (B6)

- `tsc --noEmit` → 0 · `pnpm run test` → **31/31** · `expo export --platform
  web` → 0.
- `scripts/smoke_fatia3.mjs` (Playwright/msedge): 4 combos (390x844 e
  360x640 × claro/escuro). Por combo: "/" abre a LISTA (primeiro item =
  MVP 0507; 10..70 itens na janela virtualizada), SearchBar → /buscar com
  foco, "101" → 0101 primeiro, "zzz" → vazio + "Limpar busca" (campo `""`),
  Voltar (ícone) → lista, abrir linha → detalhe antigo → "voltar à busca",
  abas clicadas por `href` (`a[role=tab]` — cenas ocultas de telas já
  visitadas interceptam clique por texto), Sobre com "Tema do app",
  **clicar Escuro e LER o fundo resolvido** (claro: rgb(255,255,255) →
  rgb(11,14,23); escuro: Claro clareia e Escuro volta), Início/Favoritos
  provisórios, overflow horizontal ok, toque ≥ 44 nos elementos visíveis
  (0×0 ignorados: fora da janela/aba), **0 erros de console**.
  Resultado: **4/4 "RESULTADO: TUDO OK"** + 36 capturas fullPage
  `.claude/fatia3_*.png` + `fatia3_checagens.txt`.
- Contraste (testes/pares_fatia3.test.ts): 18 pares reprováveis (todos
  passam ≥ 4.5 texto / ≥ 3.0 ícone) + hairline medida INFORMATIVA
  (1.22/1.26 — decorativa; estados que identificam o controle passam com
  folga; alternativa de token documentada).
- `app/index.tsx` antigo REMOVIDO (a busca antiga virou a Buscar/Lista
  novas). `app/linha/[id].tsx` INTOCADO.
- Commits por grupo: `9c5a823` (lógica+testes), `486c2e1` (tema+prefs),
  `dbcb1bb`+`97cd71d` (navegação+telas+verificação; o `dbcb1bb` saiu só com
  a remoção do index antigo — pathspec com parênteses quebrou o shell — e
  o `97cd71d` completa, sem reescrever histórico). Worktree limpo; push em
  `redesign/moovit`.

---

## 5. Pendências conscientes (todas declaradas, nenhuma escondida)

1. **BottomSheet nativo em aparelho** — PanResponder+Animated só exercitado
   por captura estática na web; dono testa no celular (ANTES da fatia 4).
2. **Início e Favoritos provisórios** (`inicio.tsx`/`favoritos.tsx` +
   textos-tipo "chega na próxima etapa") — removem-se junto quando as telas
   reais existirem; enquanto provisórios, rota `/` = lista de linhas.
3. **Detalhe antigo fora do escopo da fatia 3**: chips de dia com 40px de
   altura (< 44) e "←" no texto do botão — entram no refate (fatia 4).
4. **Hairline decorativa** 1.22/1.26 (abaixo do 3:1 não-texto) — decisão
   documentada; alternativas de token no DIRECAO.md se o dono quiser 3:1.
5. **Lint** pendente de decisão (DIRECAO § Lint): eslint vs só tsc.
6. **Monocromática do ícone** (Android 13+) — só antes da loja.
7. **Rótulo de ordem da lista** cita o ranking real do MVP (top-12); lista
   completa ordena por número (não inventar contagens).
8. **FlatList virtualizada** (RN default): o smoke conta a janela visível
   (≥ 10 itens) e o primeiro item; 84 linhas no dataset.

## 6. Como verificar do zero (comandos)

```bash
cd apps/mobile
pnpm exec tsc --noEmit                    # gate de tipos (exit 0)
pnpm run test                             # node --test testes/*.test.ts (33+ verdes)
pnpm exec expo export --platform web      # export de produção (exit 0)
pnpm exec expo start --web --port 8081 --offline   # dev: http://127.0.0.1:8081/
node scripts/smoke_fatia3.mjs             # smoke+capturas (requer dev server)
node scripts/capturas_galeria.mjs         # galeria: 16 PNGs + checagens
node scripts/diag_fontes.mjs              # tabela getComputedStyle das fontes
# assets da marca (python com PIL/numpy — o do runtime DSH; workdir = RAIZ do repo):
python -X utf8 scripts/gerar_assets_marca.py
```

Galeria de componentes: `/galeria` no dev server (só em dev; `?parte=1..4`
para bissecção).

## 7. Fontes de dados e créditos

Feed GTFS gerado offline das fontes públicas de João Pessoa (docs:
`DIVERGENCIAS_SEMOB.md`, `MONITORAMENTO_SEMOB.md`, `arquitetura-e-escopo.md`);
`agencies` do feed declara as operadoras (REUNIDAS, TRANSNACIONAL, SANTA
MARIA, SÃO JORGE, …) e a URL oficial `servicos.semobjp.pb.gov.br/
linhas-de-onibus/`; coleta via painel Mobilibus/Bus2. Licença do feed:
**indisponível** (não consta no feed nem em docs). Os horários são teóricos
(programados); o feed NÃO publica GTFS-RT (sem posição em tempo real — e o
app não sugere o contrário).
