# M3_SPEC_EXTRACT — Extração verificada da especificação Material Design 3

Data: 2026-11-01 · Tokens v6_1_0 · Espelho legível por máquina: `apps/mobile/src/tema/m3_spec.json`
(regra universal: valor SEM fonte marcada `verificado: true` NÃO entra em código — o teste do
Passo 9 reprova qualquer medida usada com `verificado: false` **excluindo** os itens aprovados
como "decisão do projeto" abaixo).

## 0. Decisão do dono no Portão A (2026-11-01) — itens não verificados

Os 10 itens da §7 foram **APROVADOS como "decisão do projeto"** (origem: projeto, não M3) e
podem entrar no código com a marca `origem: projeto` no `m3_spec.json`. **EXCLUÍDOS** (não
implementar): spinner "carregando" e tudo do conjunto "Expressive".

## 1. Fontes (o que foi de fato baixado/lido)

| Fonte | URL real usada | Estado |
|---|---|---|
| **A — Tokens oficiais do Material (Diretório `gen_defaults/data` do Flutter)** | Lista via `https://api.github.com/repos/flutter/flutter/contents/dev/tools/gen_defaults/data`; arquivos via `https://raw.githubusercontent.com/flutter/flutter/master/dev/tools/gen_defaults/data/<arquivo>.json` (mesmo conteúdo do `flutter.googlesource.com/mirrors/flutter.git` citado no prompt) | **25/25 baixados e lidos** (cópia local: `.claude/m3_sources/gen_defaults/`) |
| B — Material Components Android (docs) | `raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/{Shape,Color,Typography}.md` + `docs/components/BottomNavigation.md` | baixados (referência de plataforma Android; os NÚMEROS usados vêm de A) |
| C — Material Web | `material-web.dev/theming/typography` é compilado; a fonte bruta não respondeu a `raw.githubusercontent.com` (404) | **não utilizada** — tipografia verificada em A |
| D — Especificação m3.material.io | `/styles/typography/overview` e `/components/navigation-bar/specs` baixados, mas o HTML é shell JS **sem valores** (grep 48dp/Roboto/80dp = ausentes) | **não utilizável nesta extração** |
| E — Auditoria Callstack (Paper #4949) | não baixada — todos os valores que ela sugeriu já foram confirmados/rejeitados em A (confiança maior) | corroboração apenas |
| F — Papéis de cor (Compose) | `developer.android.com/reference/kotlin/androidx/compose/material3/ColorScheme` (4,5 MB) | baixado; usado como lista de papéis. Cross-check de hex deu `false` (HTML sem os defaults hex no texto estático) — **não citar valores do Compose** |
| Alvo de toque Android | `api.flutter.dev/flutter/material/MaterialTapTargetSize.html` — "padded = Material minimum 48px by 48px" | verificado (mesmo projeto da fonte A) |
| Alvo de toque iOS | `https://developer.apple.com/design/human-interface-guidelines/accessibility` (HIG — tamanho mínimo de alvo 44×44pt) | **fonte citada** (HIG, ver §7 item 5) |

`m3.material.io/styles/color/the-color-system/color-roles` e `.../system/color-roles` → **404**
hoje; os tons de referência foram verificados diretamente em A (`color_light.json` /
`color_dark.json`), que é justamente o banco oficial de tokens.

### Arquivos A lidos
navigation_bar, top_app_bar_small, search_bar, search_view, button_filled, button_filled_tonal,
button_outlined, button_text, icon_button (+variantes no mesmo set), chip_assist, chip_filter,
segmented_button_outlined, sheet_bottom, list, divider, badge, shape, state, elevation, motion,
typeface, text_style, color_light, color_dark.

## 2. CONFLITOS e resoluções (todos resolvidos pelo token oficial A)

| # | Tema | Valores em campo | Resolução (fonte vencedora) |
|---|---|---|---|
| C1 | Altura NavigationBar | 64 (Callstack E) × 80 (guias) | **80** — `A navigation_bar.json container.height` |
| C2 | Indicador do destino ativo | 64×32 (base) × 56×32 (Expressive) | **64×32** — `A active-indicator.width/height`; Expressive **não adotado** (fora do set A v6_1_0) |
| C3 | Rótulo ativo da NavigationBar | "token secondary" (enunciado/E) × onSurface | **onSurface** — `A active.label-text.color`; **reafirmado pelo dono no Portão A** |
| C4 | Item de lista SELECIONADO | primaryContainer (E) × secondaryContainer | **secondaryContainer** — `A list.json selected.container.color` |
| C5 | Rótulo do Button outlined | primary × onSurfaceVariant | **primary** — `A button_outlined.json label-text.color` (borda = outline) |
| C6 | Ícone líder do SearchBar | onSurfaceVariant (enunciado/E) × onSurface | **onSurface** — `A search_bar.json leading-icon.color` |
| C7 | Desabilitado | conteúdo 38% × container "12% ou 10%" | **conteúdo 0,38 + container/outline 0,12** — `A *.json disabled.*.opacity` |
| C8 | Formas 20/32/48 (enunciado) | não encontradas | **NÃO adotadas** — escala A = 0/4/8/12/16/28/full |
| C9 | Faixa da alça do sheet (48) | não publicada em A | **decisão do projeto** (aprovada no Portão A) |
| C10 | Paddings internos (botão 16, segmented 12, gap 8, nav gap 4) | não publicados em A v6_1_0 | **decisão do projeto** (aprovada) |
| C11 | Alvo de toque | 48dp Android × 44pt iOS | **48 verificado** (api.flutter.dev); **44pt iOS: HIG Apple** |
| C12 | "M3 removeu background/surfaceVariant" | tokens legados ainda existem em A | usar `surfaceContainer*`; legados NÃO entram em tokens v2 |
| C13 | TopAppBar ao rolar | container→surfaceContainer | **verificado em A** |
| C14 | Chip raio | 8 (enunciado) | **confirmação A**: `corner.small` (8); altura 32 |

## 3. Escalas verificadas

**Forma (dp)**: none 0 · extraPequena 4 · pequena 8 · media 12 · grande 16 · extraGrande 28 ·
full (circular; `extraGrandeTopo` = 28 topo/0 base) — `A shape.json`.

**Elevação (dp)**: nível0..5 = 0/1/3/6/8/12 — `A elevation.json`. Uso Flavos: sheet level1,
NavigationBar level2, resto nível 0 com elevação TONAL.

**Estado (opacidade de state-layer)**: hover 0,08 · foco 0,10 · pressionado 0,10 · arrastado 0,16
(`A state.json`). Desabilitado: conteúdo 0,38; container filled/tonal e outline 0,12.

**Movimento**: easing standard `Cubic(0.2, 0.0, 0.0, 1.0)`; durações 50–1000 (`A motion.json`).
Flavos: 200 (short4) e 300 (medium2); sem mola, sem morph, sem loop.

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

Fonte: `A text_style.json` + `typeface.json` (Roboto; 400/500/700). Fonte do APP = a do sistema
por plataforma (nenhum componente define fontFamily). Papéis do domínio: `numeralHero`
(28/700 tabular — decisão do projeto: **28**) e `numeralBadge` ≥19/700 tabular (regra aprovada).

## 5. Cores — mapa tom → papel (A color_light.json / color_dark.json)

| Papel | Claro | Escuro |
|---|---|---|
| surface | **T98** | **T6 (referência; hex aprovado mede L\* 4,0 — ver desvio abaixo)** |
| surfaceContainer Lowest/Low/base/High/Highest | **T100/T96/T94/T92/T90** | **T4/T10/T12/T17/T22** (Lowest no Flavos = L\* 2,7 p/ ficar sob o surface) |
| onSurface | T10 | T90 |
| onSurfaceVariant | neutral-variant**30** | neutral-variant**80** |
| outline | neutral-variant**50** | neutral-variant**60** |
| outlineVariant | neutral-variant**80** | neutral-variant**30** |
| primary / onPrimary | T**40**/T100 | T**80**/T20 |
| primaryContainer / onPrimaryContainer | T90/T30 | T30/T90 |
| secondary / onSecondary | T40/**T100** | T80/T20 |
| secondaryContainer / onSecondaryContainer | T90/T30 | T30/T90 |
| error / onError / errorContainer / onErrorContainer | T40/T100/T90/T30 | T80/T20/T30/T90 |
| scrim | T0 | T0 |

**`surface` escuro — DESVIO DOCUMENTADO (decisão do dono no Portão A):** o token A
mapeia `md.sys.color.surface` escuro para `neutral6`, mas o hex aprovado do Flavos
`#0B0E17` mede **L\* 4,0**. O hex é MANTIDO (splash e assets dependem dele) e o desvio
fica registrado. Para preservar a hierarquia tonal, `surfaceContainerLowest` escuro
foi escurecido para **#080A0C, L\* 2,7** (abaixo do surface): a ordem
Lowest < surface < Low < base < High < Highest se mantém.

## 6. Medidas por componente (resumo; detalhe completo em m3_spec.json)

| Componente | Medidas verificadas (A salvo indicado) |
|---|---|
| NavigationBar | altura **80**; ícone **24**; indicador **64×32** full secondaryContainer; ícone ativo onSecondaryContainer; inativos onSurfaceVariant; rótulo ativo **onSurface**; labelMedium; container surfaceContainer; elevação level2; **3 a 5 destinos** |
| TopAppBar small | altura **64**; container surface (on-scroll → surfaceContainer); título titleLarge onSurface; líder onSurface 24; à direita onSurfaceVariant 24 |
| SearchBar | altura **56**; raio full; container surfaceContainerHigh; input bodyLarge onSurface; placeholder onSurfaceVariant; líder onSurface; trailing onSurfaceVariant |
| Button | altura **40**; forma full; labelLarge; filled primary/onPrimary; tonal secondaryContainer/onSecondaryContainer; outlined borda outline + rótulo **primary**; text rótulo primary; ícone 18; disabled 0,38/0,12 |
| IconButton | ícone 24; selecionado primary; não selecionado onSurfaceVariant; alvo 48 |
| ListItem | 1 linha **56**; 2 linhas **72**; 3 linhas 88; líder/trailing 16; título bodyLarge; apoio bodyMedium onSurfaceVariant; líder 24 onSurfaceVariant; selecionado secondaryContainer/onSecondaryContainer, trailing primary |
| Chip (assist/filter) | altura **32**; forma small (**8**); labelLarge; ícone 18; filtro selecionado secondaryContainer/onSecondaryContainer + check; não selecionado outlineVariant/onSurfaceVariant |
| SegmentedButton | altura **40**; borda outline; selecionado secondaryContainer/onSecondaryContainer; não selecionado onSurface; labelLarge |
| BottomSheet docked | container **surfaceContainerLow**; cantos topo **28**; alça **32×4** onSurfaceVariant; elevação **level1** |
| Divider | **1dp** outlineVariant |

## 7. Itens fora da verificação oficial — DECISÃO DO PROJETO (aprovada no Portão A)

Origem: projeto (não M3). Registrados no `m3_spec.json` com `origem: "projeto"`.

1. gap ícone-rótulo da NavigationBar = **4** (não publicado em A).
2. padding horizontal do Button = **16** (não publicado em A).
3. padding horizontal mínimo do SegmentedButton = **12** e gap ícone-rótulo = **8**.
4. faixa superior de **48** da alça do BottomSheet.
5. iOS 44pt — **fonte: HIG Apple** (`developer.apple.com/design/human-interface-guidelines/
   accessibility`), citada como origem (não é M3).
6. `numeralHero` = **28/700 tabular** (27 não; escolhido 28).
7. Timing do on-scroll do TopAppBar = motion standard/**300ms**.
8. Espessura **1dp** da borda do SegmentedButton/TextInput (cor é de A).
9. Altura do alvo de toque dos chips de 32dp: **48** (área, via layout).
10. Alcance/área do botão voltar da TopAppBar = **48** (IconButton padrão).

**EXCLUÍDOS (não implementar):** spinner "carregando" do botão; qualquer valor do conjunto
"Expressive" (indicador 56×32, connected button group).
