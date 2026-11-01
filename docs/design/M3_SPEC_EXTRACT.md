# M3_SPEC_EXTRACT — Extração verificada da especificação Material Design 3

Data: 2026-11-01 · Tokens v6_1_0 · Espelho legível por máquina: `apps/mobile/src/tema/m3_spec.json`
(regra universal: valor SEM fonte marcada `verificado: true` NÃO entra em código — teste do
Passo 9 reprova qualquer medida usada com `verificado: false`).

## 1. Fontes (o que foi de fato baixado/lido)

| Fonte | URL real usada | Estado |
|---|---|---|
| **A — Tokens oficiais do Material (Diretório `gen_defaults/data` do Flutter)** | Lista via `https://api.github.com/repos/flutter/flutter/contents/dev/tools/gen_defaults/data`; arquivos via `https://raw.githubusercontent.com/flutter/flutter/master/dev/tools/gen_defaults/data/<arquivo>.json` (mesmo conteúdo do `flutter.googlesource.com/mirrors/flutter.git` citado no prompt) | **25/25 baixados e lidos** (cópia local: `.claude/m3_sources/gen_defaults/`) |
| B — Material Components Android (docs) | `raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/{Shape,Color,Typography}.md` + `docs/components/BottomNavigation.md` | baixados (referência de plataforma Android; os NÚMEROS usados vêm de A) |
| C — Material Web | `material-web.dev/theming/typography` é compilado; a fonte bruta não respondeu a `raw.githubusercontent.com` (404) | **não utilizada** — tipografia verificada em A |
| D — Especificação m3.material.io | `/styles/typography/overview` e `/components/navigation-bar/specs` baixados, mas o HTML é shell JS **sem valores** (grep 48dp/Roboto/80dp = ausentes) | **não utilizável nesta extração** |
| E — Auditoria Callstack (Paper #4949) | não baixada — todos os valores que ela sugeriu já foram confirmados/rejeitados em A (confiança maior), exceto onde marcado | corroboração apenas |
| F — Papéis de cor (Compose) | `developer.android.com/reference/kotlin/androidx/compose/material3/ColorScheme` (4,5 MB) | baixado; usado como lista de papéis. Cross-check de hex deram `false` (HTML sem os defaults hex no texto estático) — **não citar valores do Compose** |
| Alvo de toque | `api.flutter.dev/flutter/material/MaterialTapTargetSize.html` — "padded = Material minimum 48px by 48px" | verificado (mesmo projeto da fonte A) |
| NOTA HIG | iOS 44pt: enunciado do dono no prompt; HIG Apple não foi fonte desta extração | não verificado |

`m3.material.io/styles/color/the-color-system/color-roles` e `.../system/color-roles` → **404** hoje; os
tons de referência foram verificados diretamente em A (`color_light.json`/`color_dark.json`), que é
justamente o banco oficial de tokens.

### Arquivos A lidos
navigation_bar, top_app_bar_small, search_bar, search_view, button_filled, button_filled_tonal,
button_outlined, button_text, icon_button (+variantes no mesmo set), chip_assist, chip_filter,
segmented_button_outlined, sheet_bottom, list, divider, badge, shape, state, elevation, motion,
typeface, text_style, color_light, color_dark.

## 2. CONFLITOS e resoluções (todos resolvidos pelo token oficial A)

| # | Tema | Valores em campo | Resolução (fonte vencedora) |
|---|---|---|---|
| C1 | Altura NavigationBar | 64 (Callstack E) × 80 (guias) | **80** — `A navigation_bar.json container.height` |
| C2 | Indicador do destino ativo | 64×32 (base) × 56×32 (Expressive) | **64×32** — `A active-indicator.width/height`; Expressive **não existe em A v6_1_0** (registrado; set BASE coerente, nada misturado) |
| C3 | Rótulo ativo da NavigationBar | "token secondary" (enunciado/E) × onSurface | **onSurface** — `A active.label-text.color` |
| C4 | Item de lista SELECIONADO | primaryContainer (E) × secondaryContainer | **secondaryContainer** — `A list.json selected.container.color` (coerente com chip/segmented/nav) |
| C5 | Rótulo do Button outlined | primary × onSurfaceVariant | **primary** — `A button_outlined.json label-text.color` (borda = outline) |
| C6 | Ícone líder do SearchBar | onSurfaceVariant (enunciado/E) × onSurface | **onSurface** — `A search_bar.json leading-icon.color` (trailing/supporting = onSurfaceVariant) |
| C7 | Desabilitado | conteúdo 38% × container "12% ou 10%" | **conteúdo 0,38 + container/outline 0,12** — `A *.json disabled.*.opacity` (o "10%" não existe nos tokens) |
| C8 | Formas 20/32/48 (enunciado) | não encontradas | **NÃO adotadas** — a escala A é 0/4/8/12/16/28/full |
| C9 | Faixa da alça do sheet (48) | não publicada em A | **verificado: false** — alça 32×4@onSurfaceVariant verificada; faixa só com OK |
| C10 | Paddings internos (botão 16, segmented 12, gap 8, nav gap 4) | não publicados em A v6_1_0 | **verificado: false** — 16 do List é token (A); os demais não entram em código antes do OK |
| C11 | Alvo de toque | 48dp Android × 44pt iOS | **48 verificado** (api.flutter.dev MaterialTapTargetSize); 44pt = enunciado |
| C12 | "M3 removeu background/surfaceVariant" | os tokens legados **ainda existem** em A | decisão: usar `surfaceContainer*` atuais; legados NÃO entrarão em tokens v2 |
| C13 | TopAppBar ao rolar | container→surfaceContainer | **verificado em A** (`on-scroll.container.color`), não precisava do E |
| C14 | Chip raio | 8 (enunciado) | **confirmação A**: `container.shape = corner.small` (8). Altura 32; alvo de toque a garantir por layout (Passo 7) |

## 3. Escalas verificadas

**Forma (dp)**: none 0 · extraPequena 4 · pequena 8 · media 12 · grande 16 · extraGrande 28 · full
(circular; `extraGrandeTopo` = 28 topo/0 base) — `A shape.json`.

**Elevação (dp)**: nível0..5 = 0/1/3/6/8/12 — `A elevation.json`. Uso: sheet level1,
NavigationBar level2, todo o resto nível 0 com elevação TONAL (superfície container).

**Estado (opacidade de state-layer)**: hover 0,08 · foco 0,10 · pressionado 0,10 · arrastado 0,16
(`A state.json`; o arrastado do enunciado CONFIRMADO). Desabilitado: conteúdo 0,38; container
filled/tonal e outline 0,12.

**Movimento**: easing standard `Cubic(0.2, 0.0, 0.0, 1.0)` (accelerate `0.3,0,1,1`; decelerate
`0,0,0,1`); durações short 50/100/150/200 · medium 250/300/350/400 · long 450–600 · extraLong
700–1000 (`A motion.json`). Flavos: 200 (short4) e 300 (medium2); **sem mola, sem morph, sem loop**
(enunciado).

## 4. Tipografia — os 15 estilos (todos com line-height e tracking de A)

| Estilo | dp | line-height | peso | tracking |
|---|---|---|---|---|
| displayLarge | 57 | 64 | 400 | −0,25 |
| displayMedium | 45 | 52 | 400 | 0 |
| displaySmall | 36 | 44 | 400 | 0 |
| headlineLarge | 32 | 40 | 400 | 0 |
| headlineMedium | 28 | 36 | 400 | 0 |
| headlineSmall | 24 | 32 | 400 | 0 |
| titleLarge | 22 | 28 | 400 | 0 |
| titleMedium | 16 | 24 | 500 | 0,15 |
| titleSmall | 14 | 20 | 500 | 0,10 |
| bodyLarge | 16 | 24 | 400 | 0,50 |
| bodyMedium | 14 | 20 | 400 | 0,25 |
| bodySmall | 12 | 16 | 400 | 0,40 |
| labelLarge | 14 | 20 | 500 | 0,10 |
| labelMedium | 12 | 16 | 500 | 0,50 |
| labelSmall | 11 | 16 | 500 | 0,50 |

Fonte: `A text_style.json` + `typeface.json` (Roboto; 400/500/700; labelLarge/medium/small têm
variante `prominent` = bold). Fonte do APP = a do sistema por plataforma (nenhum componente define
fontFamily; ver DESIGN_SYSTEM.md). Papéis do domínio: `numeralHero` 28–32/700 tabular
(enunciado — escolher e travar no gate) e `numeralBadge` ≥19/700 tabular (regra aprovada).

Todos os valores do enunciado conferem; os line-heights ausentes nele AGORA são verificados
(display 64/52/44, headline 40/36/32, title 28/24/20, body 24/20/16, label 20/16/16; tracking
titleMedium 0,15 e titleSmall 0,10 também vieram de A).

## 5. Cores — mapa tom → papel (A color_light.json / color_dark.json)

| Papel | Claro | Escuro |
|---|---|---|
| surface | **T98** | **T6** |
| surfaceContainer Lowest/Low/base/High/Highest | **T100/T96/T94/T92/T90** | **T4/T10/T12/T17/T22** |
| onSurface | T10 (neutral10) | T90 (neutral90) |
| onSurfaceVariant | neutral-variant**30** | neutral-variant**80** |
| outline | neutral-variant**50** | neutral-variant**60** |
| outlineVariant | neutral-variant**80** | neutral-variant**30** |
| primary / onPrimary | T**40**/T100 | T**80**/T20 |
| primaryContainer / onPrimaryContainer | T90/T30 | T30/T90 |
| secondary / onSecondary | T40/**T100** | T80/T20 |
| secondaryContainer / onSecondaryContainer | T90/T30 | T30/T90 |
| error / onError / errorContainer / onErrorContainer | T40/T100/T90/T30 | T80/T20/T30/T90 |
| scrim | T0 | T0 |

Nota: `onSecondary` claro = secondary100 (**T100, branco**) — mapping oficial; o par
onSecondary×secondary entra na matriz do teste. `surface` escuro = **T6** (não T10; T10 é
surfaceContainerLow) — correção aos valores de memória.

## 6. Medidas por componente (resumo; detalhe completo em m3_spec.json)

| Componente | Medidas verificadas (valor @ fonte A salvo indicado) |
|---|---|
| NavigationBar | altura **80**; ícone **24**; indicador **64×32** full secondaryContainer; ícone ativo onSecondaryContainer; ícone/rótulo inativos onSurfaceVariant; rótulo ativo **onSurface**; rótulo labelMedium; container surfaceContainer; elevação level2; 3–5 destinos |
| TopAppBar small | altura **64**; container surface (on-scroll → surfaceContainer); título titleLarge onSurface; ícone líder onSurface 24; à direita onSurfaceVariant 24 |
| SearchBar | altura **56**; raio full (28); container surfaceContainerHigh; input bodyLarge onSurface; placeholder onSurfaceVariant; líder onSurface; trailing onSurfaceVariant |
| Button (filled/tonal/outlined/text) | altura **40** em todos; forma full; labelLarge; filled primary/onPrimary; tonal secondaryContainer/onSecondaryContainer (elevação 0); outlined borda outline + rótulo **primary**; text rótulo primary; ícone 18; disabled: conteúdo 0,38, container 0,12 |
| IconButton | ícone 24; selecionado primary; não selecionado onSurfaceVariant; alvo 48 |
| ListItem | 1 linha **56**; 2 linhas **72** (verificado — enunciado tinha "?"); 3 linhas 88; líder/trailing 16; título bodyLarge; apoio bodyMedium onSurfaceVariant; líder 24 onSurfaceVariant; selecionado secondaryContainer/onSecondaryContainer, trailing primary |
| Chip (assist/filter) | altura **32**; forma small (**8**); labelLarge; ícone 18; assist: outlineVariant + rótulo onSurface + ícone primary; filtro selecionado: secondaryContainer + onSecondaryContainer + check; não selecionado outlineVariant/onSurfaceVariant |
| SegmentedButton | altura **40**; borda outline (cor A; espessura 1dp = não verificado em A); selecionado secondaryContainer/onSecondaryContainer; não selecionado onSurface; labelLarge; **descontinuado no Expressive** (claim E/enunciado — A v6_1_0 ainda o publica) |
| BottomSheet docked | container **surfaceContainerLow**; cantos topo **28** (extra-large.top); alça **32×4** onSurfaceVariant; elevação **level1** |
| Divider | **1dp** outlineVariant |

## 7. Explicitamente NÃO verificado (não entra em código antes do OK)

1. gap ícone-rótulo da NavigationBar (4dp) — não publicado em A.
2. padding horizontal do Button (16; "24 não recomendado") — não publicado em A.
3. padding horizontal mínimo do SegmentedButton (12) e gap ícone-rótulo (8) — não publicados em A.
4. faixa superior de 48dp da alça do BottomSheet — não publicada em A (a alça 32×4 é A).
5. iOS 44pt — HIG Apple fora das fontes; 48dp verificado via api.flutter.dev.
6. Spinner "carregando" do botão — decisão UX local (fora de tokens).
7. `numeralHero` 28‑32/700 — papel do domínio Flavos; escolher 28 ou 32 no gate.
8. Valores Expressive (indicador 56×32; segmented→connected button group) — fora do set A v6_1_0; set BASE adotado.
9. Timing da animação on-scroll do TopAppBar — cor verificada; timing = tokens de motion (standard/300ms).
10. Espessura 1dp da borda do SegmentedButton/TextInput — cor de A; espessura de enunciado.
