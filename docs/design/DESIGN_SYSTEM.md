# DESIGN SYSTEM — M3 no Flavos Bus

Data: 2026-11-01 · Branch `redesign/moovit` · **Estado: PORTÃO A APROVADO (2026-11-01)** —
implementação dos PASSOS 4–9 em curso até o Portão B.
Especificação com fontes: `docs/design/M3_SPEC_EXTRACT.md` + `apps/mobile/src/tema/m3_spec.json`.
Estrutura de telas de referência: `docs/design/REFERENCIA_ESTRUTURA.md`.

## 1. Princípio

Medida só com fonte registrada (`verificado: true`) OU aprovada como **decisão do projeto**
(`origem: "projeto"`, Portão A). O teste de conformidade (Passo 9) reprova qualquer medida usada
sem uma das duas marcas. Valor de memória não entra.

## 2. Decisões do dono no Portão A (aplicadas)

1. **Indicador da aba ativa = VERDE (`secondaryContainer`)** e **só** para "selecionado";
   rótulo ativo segue o token oficial **onSurface**. Verde nunca em erro/aviso/sucesso.
2. **outlineVariant derivado estrito**: `#C2C7CF` (claro) / `#404752` (escuro). Divisores e
   contornos decorativos usam outlineVariant; os componentes antigos que usavam as hairlines
   `#DBE3EC`/`#242C3E` foram migrados.
3. Os 10 itens não verificados foram **aprovados como "decisão do projeto"**; EXCLUÍDOS:
   spinner de carregamento e todo o conjunto "Expressive".
4. Rupturas visuais do §6 anterior: **aprovadas** (ver §8).
5. **surface escuro**: `#0B0E17` mantido (L\* 4,0; ver desvio em §4.2), `surfaceContainerLowest`
   escuro escurecido para `#080A0C` (L\* 2,7) para ficar ABAIXO do surface.
6. **NavigationBar**: aceita **3 a 5 destinos** (não fixos em 4); sempre com as medidas de A
   (altura **80**, indicador **64×32**); medidas isoladas num único objeto
   (`m3_medidas.navigationBar`) trocável de uma vez no Portão B.

## 3. ADOTAR (comum às duas plataformas — uma única linguagem visual)

- **Cor** (papéis M3, §4) · **tipografia** (15 estilos verificados) · **forma** (0/4/8/12/16/28/
  full) · **estado** (hover 0,08 / foco 0,10 / pressionado 0,10 / arrastado 0,16;
  desabilitado 0,38 conteúdo e 0,12 container) · **elevação TONAL** (superfícies Container;
  sombra real só no sheet, nível 1).
- Diferenças permitidas: ripple (Android, cor de token) × opacidade (iOS); web com foco visível
  (outline 2px primary, offset 2); safe areas.

## 4. Sistema de cor

### 4.1 Derivação
Tom = **L\* CIELAB** (aproximação documentada do tom HCT; desvio real para croma baixo ≤ 2).
Matiz: neutros na região do navy (215–218); variantes com croma um pouco maior; containers na
matiz do próprio papel.

### 4.2 Tabela de papéis (hex + L\* medido)

| Papel | Claro | L\* | Escuro | L\* |
|---|---|---|---|---|
| primary | #05337B (fixo) | 23,1 | #9DB8F5 (fixo) | 74,9 |
| onPrimary | #FFFFFF (fixo) | 100,0 | #04122E (fixo) | 5,9 |
| primaryContainer | #D9E3F4 (T90) | 90,0 | #29467A (T30) | 30,1 |
| onPrimaryContainer | #121B2C (T10) | 9,8 | #D9E3F3 (T90) | 89,9 |
| secondary | #397E2F (fixo) | 47,0 | #4AA63E (fixo) | 60,8 |
| onSecondary | #FFFFFF (T100) | 100,0 | #12371C (T20) | 19,8 |
| secondaryContainer | #C5ECCF (T90) | 90,0 | #22502E (T30) | 30,1 |
| onSecondaryContainer | #09200F (T10) | 10,0 | #C9EAD2 (T90) | 89,8 |
| surface | #FFFFFF (fixo) | 100,0 | #0B0E17 (fixo) | **4,0** |
| onSurface | #0D1322 (fixo) | 6,0 | #F2F5FA (fixo) | 96,4 |
| onSurfaceVariant | #46536B (fixo) | 35,1 | #A8B2C6 (fixo) | 72,4 |
| surfaceContainerLowest | #FFFFFF (T100) | 100,0 | **#080A0C** (L\* 2,7 — abaixo do surface) | 2,7 |
| surfaceContainerLow | #F2F4F5 (T96) | 96,1 | #181C21 (T10) | 10,1 |
| surfaceContainer | #ECEDF0 (T94) | 93,8 | #1C2026 (T12) | 12,1 |
| surfaceContainerHigh | #E6E8EC (T92) | 91,9 | #262B32 (T17) | 17,3 |
| surfaceContainerHighest | #E0E3E7 (T90) | 90,1 | #2F353E (T22) | 21,9 |
| outline | #6D778A (T50) | 49,8 | #8892A2 (T60) | 60,2 |
| outlineVariant | **#C2C7CF** (T80) | 80,1 | **#404752** (T30) | 29,9 |
| error | #B00020 (fixo) | 36,6 | #FF8A98 (fixo) | 70,7 |
| onError | #FFFFFF | 100,0 | #502317 (T20) | 19,9 |
| errorContainer | #FCEAED (fixo) | 94,2 | #663C31 (T30) | 30,1 |
| onErrorContainer | #78301E (T30) | 29,9 | #F0DFDB (T90) | 90,1 |
| scrim | #000000 | 0,0 | #000000 | 0,0 |

**Desvio documentado do surface escuro**: o token A pede T6; o hex aprovado `#0B0E17` mede
L\* 4,0 (splash e assets dependem dele — mantido). A hierarquia tonal é restaurada por
`surfaceContainerLowest` = L\* 2,7 < surface L\* 4,0 < Low 10,1 < base 12,1 < High 17,3 <
Highest 21,9. Os demais desvios por hex aprovado (onSurface, onSurfaceVariant, onPrimary escuro,
primary escuro, error escuro) são naturais da marca e estão listados no `m3_spec.json`
(`cores_tonalidade.desvios_documentados`).

### 4.3 Matriz de contraste (medida; texto ≥ 4,5 / UI ≥ 3,0)

| Par | Claro | Escuro |
|---|---|---|
| onSurface × surface | 18,53 ✓ | 17,64 ✓ |
| onSurface × surfaceContainerLowest | 18,50 ✓ | 17,86 ✓ |
| onSurface × surfaceContainerLow | 16,79 ✓ | 15,66 ✓ |
| onSurface × surfaceContainer (base) | 15,83 ✓ | 14,97 ✓ |
| onSurface × surfaceContainerHigh | 15,10 ✓ | 13,04 ✓ |
| onSurface × surfaceContainerHighest | 14,39 ✓ | 11,31 ✓ |
| onSurfaceVariant × surface | 7,75 ✓ | 9,04 ✓ |
| onSurfaceVariant × surfaceContainer (base) | 6,62 ✓ | 7,67 ✓ |
| onSurfaceVariant × surfaceContainerHigh | 6,32 ✓ | 6,68 ✓ |
| primary × surface | 11,89 ✓ | 9,74 ✓ |
| onPrimary × primary | 11,89 ✓ | 9,38 ✓ |
| onPrimaryContainer × primaryContainer | 13,33 ✓ | 7,21 ✓ |
| onSecondaryContainer × secondaryContainer | 13,28 ✓ | 7,18 ✓ |
| secondary (rótulo ativo VERDE) × surfaceContainer base | 4,27 ✗ **não usado** | 5,31 ✓ |
| onSurface (rótulo ativo, token A) × surfaceContainer base | 15,83 ✓ | 14,97 ✓ |
| onSecondary × secondary | 4,94 ✓ | 8,42 ✓ |
| onError × error | 7,33 ✓ | 5,86 ✓ |
| onErrorContainer × errorContainer | 8,09 ✓ | 7,22 ✓ |
| outline × surface (borda de controle 1dp) | 4,51 ✓ | 6,13 ✓ |
| onSecondaryContainer × secondaryContainer (ícone/rótulo dentro do indicador) | 13,28 ✓ | 7,18 ✓ |
| onPrimaryContainer × primaryContainer (alternativa azul) | 13,33 ✓ | 7,21 ✓ |
| outlineVariant × surface — **isento (decorativo)** | 1,70 | 2,06 |
| theoretical conteúdo×fundo (papéis Flavos, inalterados) | 7,06 ✓ | 10,62 ✓ |

O único par reprovado (rótulo ativo verde no claro, 4,27) **não é usado**: o rótulo ativo é
onSurface (token A) e o verde aparece só como indicador/container (13,28/7,18 dentro dele).
OBS: "indicador × surface" (1,29/2,07) não é requisito da matriz — a identificação do destino
ativo é do trio indicador + ícone preenchido + rótulo, todos acima de 7:1.

## 5. Componentes — decisão e especificação

| Componente | Decisão |
|---|---|
| **NavigationBar** | ADOTAR (A): altura **80**, ícone 24, indicador **64×32** full `secondaryContainer`, ícone ativo `onSecondaryContainer`, inativos `onSurfaceVariant`, rótulo ativo `onSurface`, labelMedium sempre visível, container `surfaceContainer`, elevação tonal level2. **3 a 5 destinos** (galeria testa 3/4/5). Identificação não depende só de cor (indicador + ícone preenchido). Medidas num único objeto de tokens (`m3_medidas.navigationBar`). |
| **TopAppBar** | SÓ small (64; medium/large não adotados). Voltar = IconButton com ícone phosphor (nunca seta em texto), alvo 48. container surface → on-scroll surfaceContainer. |
| **SearchBar** | contained 56 (pílula full), container surfaceContainerHigh, sem borda; variante BOTÃO (vai para /buscar) e CAMPO (digitável, foco automático); líder `onSurface`, trailing/placeholder `onSurfaceVariant`; bodyLarge. |
| **BottomSheet** | docked/standard (não modal): container surfaceContainerLow, cantos topo 28, alça 32×4 `onSurfaceVariant` com faixa de 48, elevação level1 (única sombra). |
| **SegmentedButton** | baseline (A): altura 40, borda `outline` 1dp, selecionado `secondaryContainer`/`onSecondaryContainer`, não selecionado `onSurface`, labelLarge, pílula nas pontas, largura total 3 partes. Descontinuação Expressive registrada e **não implementada**. |
| **Button** | filled/tonal/outlined/text: altura 40, forma full, labelLarge, ícone 18; outlined borda `outline` + rótulo `primary`; desabilitado 0,38/0,12. Sem spinner (excluído no Portão A). |
| **IconButton** | ícone 24, alvo 48; selecionado `primary`, não selecionado `onSurfaceVariant`. |
| **ListItem** | 56 (1 linha) / 72 (2 linhas) / 88 (3 linhas); título bodyLarge, apoio bodyMedium `onSurfaceVariant`; líder 24 `onSurfaceVariant`; selecionado `secondaryContainer`/`onSecondaryContainer`. |
| **Chip** | assist (contorno outlineVariant, rótulo onSurface, ícone primary) e filter (selecionado secondaryContainer + check; não selecionado contorno outline — decisão do dono). Altura 32, raio small 8, labelLarge, ícone 18. |
| **Divider** | 1dp `outlineVariant`. |
| **SectionHeader** (novo) | labelLarge 14/20/500/tracking 0,1 em `onSurfaceVariant`; **sem maiúsculas forçadas** (precedência do prompt principal sobre a referência Mapbox). |
| **FilterChipRow** (novo) | linha de chips filter: ativo preenchido (secondaryContainer + check), inativo contorno `outline`; forma do M3 (não pílula). |
| **TimelineStop** (domínio) | nó: primeira = círculo cheio 20, **última = quadrado cheio 20 com raio forma.extraPequena**, intermediárias = anel 14 com borda 2; conector 2dp na cor da LINHA do feed; parada atual = ponto cheio + peso de texto maior. Forma comunica origem/destino além da cor. |
| **LineBadge / TheoreticalBadge / NextDepartureCard / StopRow / EmptyState / Skeleton** | domínio: mantêm o comportamento; só trocam para os papéis M3 (NextDepartureCard usa `primaryContainer` como hero — único card custom, extensão documentada do domínio). |

### 5.1 TracadoLinha — ESPECIFICADO (não implementado nesta fatia)
Cartão com raio `forma.grande` (16), traçado SVG na **cor da linha do feed**, e sobreposição de
**gradiente SVG na borda inferior** (cor da superfície de transparente → opaca) para o traçado
"dissolver" no fundo. Interface própria (`props: { corLinha, pontos, altura }`) pronta para ser
trocada por mapa nativo depois. Usa `react-native-svg` (já instalado). Nenhuma dependência nova.

## 6. Estrutura de telas (3 abas) — decisão da fatia

Registrado aqui e detalhado em `docs/design/REFERENCIA_ESTRUTURA.md`:

| Aba | Conteúdo |
|---|---|
| **Início** | TopAppBar com engrenagem (abre Sobre/tema); SearchBar grande em modo botão "Buscar linha ou parada"; bloco **Favoritos** (linhas e paradas, com próxima saída TEÓRICA); bloco **Paradas perto de você** (permissão só no toque; fallback "paradas perto do centro"); BottomSheet de encaixes quando houver faixa de contexto. **Sem mapa no MVP.** |
| **Paradas** | abas "Ao redor"/"Favoritas" (SegmentedButton); StopRow com chips `LineBadge`; distância a pé quando houver localização; próximo horário teórico por linha **só com o TheoreticalBadge visível**. |
| **Linhas** | SearchBar + FilterChipRow (estrela = favoritas, Todas; por operadora **só se o feed tiver mais de uma agência**); lista com SectionHeader quando agrupada; ordem rotulada "Ordenadas por número de viagens". |

Favoritos NÃO é aba (estrela em Linhas, aba em Paradas, bloco no Início). Sobre = engrenagem no
Início. Detalhe da linha: TopAppBar (voltar, LineBadge + nome, estrela), faixa do sentido com
"Mudar sentido" só se o feed tiver 2 sentidos, botão de traçado (TracadoLinha), NextDepartureCard,
SegmentedButton Útil/Sáb/Dom, TimelineStop, painel fixo "Horário teórico" **sem dispensar para
sempre**.

## 7. Acessibilidade (Passo 7)

- Alvo de toque ≥ **48** nos controles (piso 44 só onde a spec manda: rótulo de aba).
- `accessibilityRole`/`State` (selected, disabled) e rótulos em português.
- Seleção nunca só por cor (indicador + ícone preenchido + peso).
- `maxFontSizeMultiplier` 1,3 nos rótulos de aba e no LineBadge; sem truncar rótulo de aba em 130%.
- Ordem de leitura: topo → conteúdo → ação.

## 8. Rupturas visuais aprovadas (Portão A §4)

1. Tab bar: hairline + surface → **surfaceContainer tonal + indicador 64×32** (sem hairline).
2. Segmented/DaySegmented: surfaceAlt+borda → **outline 1dp em pílula**, selecionado
   `secondaryContainer` (verde), antes primary.
3. Campo de busca: surfaceAlt+borda → **surfaceContainerHigh sem borda**.
4. Chips/contornos: `outline` (T50/T60) no lugar das hairlines.
5. Títulos: **titleLarge (22/28, 400)** — antes 24/700.
6. Divisores: **outlineVariant estrito** (#C2C7CF/#404752).
7. Desabilitados: 0,38 / 0,12 em todo o app.
8. LineBadge: só o raio passa a `forma.pequena` (8); cores do feed inalteradas.

## 9. Referências (o que foi adotado, o que foi rejeitado e por quê)

### (a) Material 3 — BASE
Especificação oficial, tokens v6_1_0 (fonte A). **Adotado**: cor por papéis, tipografia de 15
estilos, forma, estado, elevação tonal, medidas de componente (todas com fonte no
M3_SPEC_EXTRACT.md). **Rejeitado**: Material You/cor dinâmica (identidade fixa), FAB, estilos
"emphasized", fonte variável, molas/morph/loops, conjunto "Expressive" (excluído pelo dono).

### (b) Estrutura de app de transporte público (`REFERENCIA_ESTRUTURA.md`)
Análise de PADRÕES por descrição (sem nome, logo, ícones, ilustrações, textos nem cor de marca).
**Adotado**: busca como ação principal; dois eixos por tela (Ao redor/Favoritas); agrupamento com
SectionHeader; progressão lista → detalhe; favoritar por estrela; painel de honestidade sempre
visível. **Rejeitado**: mapa no topo (sem dependência de mapa; fatia futura), carrossel
editorial, avisos de serviço (sem fonte), Casa/Trabalho, distância sem localização, tempo real.

### (c) Referência Mapbox (DESIGN.md do dono) — tema escuro e mapa
**Adotado**: princípio da escada tonal de superfícies escuras por tom (sem sombra, exceto
sheet) e o gesto de dissolução do traçado no fundo (especificado como TracadoLinha).
**Comparação medida da escada escura** (relatório, NADA trocado):

| Nosso degrau | L\* | Referência mais próxima | L\* | ΔE (aprox.) |
|---|---|---|---|---|
| surface #0B0E17 | 4,0 | #0e1012 | 4,6 | 4,4 |
| surfaceContainerLowest #080A0C | 2,7 | #0e1012 | 4,6 | 1,9 |
| surfaceContainerLow #181C21 | 10,1 | #1c1f24 | 11,6 | 1,7 |
| surfaceContainer #1C2026 | 12,1 | #1c1f24 | 11,6 | 0,9 |
| surfaceContainerHigh #262B32 | 17,3 | #23262d | 15,1 | 2,4 |
| surfaceContainerHighest #2F353E | 21,9 | #23262d | 15,1 | 7,0 |

Leitura: a escada do Flavos é MAIS LARGA no topo (Highest 21,9 vs 15,1 da ref.) — diferença de
ΔL\* ~6,8 no último degrau; nos demais a distância é ≤ 2,4. O contraste entre degraus vizinhos é
baixo nos dois (1,01–1,06 na ref.; 1,03–1,18 no nosso — o NOSSO separa mais). Nenhuma troca:
a escada do Flavos já é mais contrastada entre degraus e o `#0B0E17` está amarrado aos assets.
**Rejeitado**: a paleta exata da referência (marca de terceiro), Cera Pro (proprietária),
textos e exemplos. **Defeitos do arquivo de referência (não copiados)**: rótulo `#566171`
12px sobre fundo escuro = 3,04:1 (abaixo de 4,5); branco sobre `#007afc` = 4,05:1; branco sobre
`#228a56` em 10px = 4,34:1; ícone inativo `#333943` = 1,64:1; tracking em "em" incoerente
(+0,70em a +1,00em × +0,84px).

### (d) Referência Uber (DESIGN.md do dono) — tema claro
**Adotado**: cromo neutro com cor no conteúdo (ver §10); forma origens/destino na linha do tempo
(TimelineStop, aplicado); borda de controle em 1dp na faixa 4,5:1 (conferida).
**Rejeitado**: ilustrações, barra preta, hero, barra fixa de conversão, UberMove (proprietária),
paleta exata. **Comparações medidas (sem trocar nada)**:
- `outline` claro `#6D778A` = **4,51:1** vs borda de referência `#767676` = **4,54:1** — mesma
  faixa (ambas > 3:1 para borda de controle; praticamente iguais entre si a ΔE ~1).
- `surfaceContainerLow` claro `#F2F4F5` (L\* 96,1) vs card de referência `#F6F6F6` (L\* 96,9):
  **ΔL\* −0,82, ΔE 1,19, contraste entre os dois 1,021** — equivalentes na prática.
**Defeitos do arquivo de referência (não copiados)**: texto auxiliar `#afafaf` sobre branco =
2,19:1; fundo `#9dcdd6` sobre branco = 1,73:1 (só decorativo); `#5e5e5` com 5 dígitos e token de
fonte "sans-serif" sem descrição (inconsistências do arquivo).

## 10. Princípio "cromo neutro, cor no conteúdo"

A cor informativa vem das LINHAS (feed). A interface usa **navy (`primary`) como ação/navegação
ativa** e **verde (`secondary`/containers) só como seleção e identidade do app** — nunca como
estado semântico (erro/aviso/sucesso). Se o verde do indicador competir visualmente com os selos
coloridos das linhas nas capturas, isso é reportado no Portão B (não corrigido às cegas).

## 11. Pendências de verificação

1. **Nada do M3 foi testado em aparelho real** (Android/iOS). Ripple Android, opacidade iOS e
   safe areas só com o dono no aparelho. Web é provada por Playwright.
2. NavigationBar em aparelho real (altura 80 × conjunto compacto — decisão no Portão B).
3. BottomSheet nativo (`bottom_sheet.native.tsx`, PanResponder + Animated).
4. Camada monocromática do ícone adaptativo (Android 13+) antes da loja.
5. `TracadoLinha` especificado, não implementado (próxima fatia).
