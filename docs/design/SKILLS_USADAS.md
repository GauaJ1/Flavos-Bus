# Skills de design carregadas e onde foram aplicadas

Data: 2026-10-30 · Solicitado: carregar TODAS as skills de design disponíveis antes das telas.

## Inventário da sessão (catálogo ativo)

| Skill | Aplicável ao MVP? | O que ensinou / onde aplicamos |
|---|---|---|
| `frontend-design` | ✅ Aplicada | Direção estética com identidade própria, anti-"visual de template"; copy como desenho; geometria como informação. Aplicada em `docs/design/DIRECAO.md` e nas telas (verbo direto nos rótulos, estados de erro que dizem o que fazer). |
| `frontend-design-anchors` | ✅ Aplicada | 8 âncoras estéticas com tokens travados; escolha de UMA âncora + diferenciador + disciplina de conteúdo (nada de dado inventado). Escolhemos a âncora **Swiss** (doc seção abaixo); o diferenciador é o **número da linha como placa de destino** (destination sign). |
| `ui-ux-pro-max` | ✅ Aplicada | Busca `--design-system` rodada ("public transit bus departures utility commuter"): apontou Flat Design azul #2563EB e Lexend Mega. **Conflito registrado**: paleta/tipografia genérica × âncora Swiss específica — prevalece a âncora (regra do passo de design: a skill mais específica à tarefa). Aproveitamos os itens transversais: contraste 4,5:1, alvos ≥44px, sem emoji como ícone, sem indicar estado só por cor, checklist pré-entrega. |
| `make-interfaces-feel-better` | ✅ Aplicada | Detalhes micro: raio concêntrico (cartão 16 → filho 8 com padding 8), `tabular-nums` em horários (RN: `fontVariant`), escala no toque 0,96, nada de transição "all", feedback ≤200 ms, alvos 44-48px. Aplicado nos componentes de `apps/mobile/src/ui/`. |
| `fixing-accessibility` | ✅ Aplicada | Nomes acessíveis (label no campo de busca, `accessibilityLabel` em ícones), foco visível, erros ligados ao campo, contraste. Checklist por tela no Passo 6. |
| `baseling-ui` | ✅ Aplicada | Baseline anti-slop: sem gradientes/glow, animar só transform/opacity, esqueleto de carregamento, estado vazio com UMA ação clara, z-index escala fixa. (Nome correto no catálogo: `baseline-ui`.) |
| `fixing-motion-performance` | ✅ Aplicada | Regras de movimento: só compositor (transform/opacity), nada de animação contínua de layout, pausar fora de tela — a "faixa de horários" do detalhe é estática (RT não existe; nada de relógio animado). |
| `create-design-md` | ✅ Aplicada (modo repositório) | Como documentar a linguagem de design com evidência e frontmatter de tokens. Usada como guia de forma para o `DIRECAO.md` (não geramos `DESIGN.md` do Google — documento próprio do projeto). |
| `improve-ui` | ✅ Aplicada | Protocolo de auditoria com prova (contrato → runtime → correção) e saída em tabela. Usado no Passo 6 (verificação visual por tela) e nas revisões de polimento. |
| `canvas-design` | ⚠️ Carregada, não aplicada | É para pôsteres/arte .png/.pdf. Não há pôster no MVP; princípios (craft, margens, nada sobreposto) citados para os SVGs de diagrama. |
| `component-canvas` / `create-canvas` | ⚠️ Carregadas, não aplicadas | Ferramentas de canvas interativo para explorar componentes; não se aplicam a telas React Native sem canvas no fluxo atual. |
| `fixing-metadata` | ⚠️ Carregada, não aplicada | Metadados de páginas web (SEO/OG) — sem páginas públicas web nesta fase. |

## Pedidas pelo usuário e indisponíveis no catálogo

| Skill pedida | Status subtituto |
|---|---|
| `artifact-design` | Não existe na sessão. Papel (artefactos de leitura humana) coberto por `frontend-design` + `canvas-design`. |
| `artifact-diagramming` | Não existe. Diagramas (pipeline e navegação) feitos como SVG autorais em `docs/design/`. |
| `dataviz` | Não existe. Regras equivalentes aplicadas por construção da faixa de horários: contraste AA, não codificar estado só por cor, legendas legíveis claro/escuro. |

## Regra de conflito aplicada

Quando duas skills divergem, prevalece a **mais específica à tarefa**, com o conflito registrado — como acima (`ui-ux-pro-max` genérica × `frontend-design-anchors` específica → âncora Swiss vence).

## Passo 6 executado (evidências de verdade)

- **Capturas**: `docs/design/telas/{busca,detalhe}_{claro,escuro}.png` — 360×740@2x, Edge do
  sistema via Playwright (channel `msedge`, sem baixar navegador). Limitação honesta: este
  agente não tem entrada de imagem, então a conferência pixel a pixel fica para humano;
  o que se prova aqui é conteúdo.
- **Runtime**: `apps/mobile/scripts/verifica_web.mjs` — **11/11 checks** (aviso teórico no topo
  das duas telas; busca por "509" encontra João Agripino; próxima saída; quadro 05:00→17:40;
  fonte com data; chips de dia; linha SEM operadora oculta o campo; linha COM operadora mostra
  "Operadora declarada ANO: NOME"; zero pageerror). Relatório:
  `docs/design/telas/relatorio_runtime.md`.
- **Contraste**: `apps/mobile/scripts/contraste.mjs` — os 8 pares de tokens passam **≥ 4,5:1
  nos dois temas** (`docs/design/telas/contraste_tokens.md`).
- Verificação por tempo fixo foi trocada por espera por conteúdo (espera robusta, não "sleep").
- **Diagramas** (pedidos como SVG autoral em `docs/design/`): `pipeline.svg` (Bus2+SEMOB →
  scraper → GTFS validado → flavos.sqlite → app offline, com a caixa tracejada do RT ausente)
  e `navegacao.svg` (/ → /linha/[id] com aviso permanente, placa, próxima saída, faixa do dia,
  quadro por dia/sentido e pendências Tarefa 7 marcadas). Cores escolhidas para legibilidade
  nos dois temas (blocos escuros + texto claro sobre qualquer fundo).
