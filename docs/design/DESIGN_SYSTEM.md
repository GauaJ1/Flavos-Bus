# DESIGN SYSTEM — M3 no Flavos Bus (escopo, cor e estado do Portão A)

Data: 2026-11-01 · Branch `redesign/moovit` · **Estado: PORTÃO A (nada de tokens gravado ainda)**.
Fonte da especificação: `docs/design/M3_SPEC_EXTRACT.md` + `apps/mobile/src/tema/m3_spec.json`
(tudo com `fonte` URL e `verificado` s/n).

## 1. Princípio do portão

Medida do M3 só com fonte registrada; valor de memória não entra em código. NADA dos tokens é
gravado em `tokens.ts` antes do OK do dono (este documento é proposta; hexes abaixo são derivados
e medidos, não implantados).

## 2. ADOTAR (comum às duas plataformas — uma única linguagem visual)

- **Cor** (sistema de papéis M3, §4) · **tipografia** (15 estilos verificados) · **forma** (0/4/8/
  12/16/28/full) · **estado** (camadas 0,08/0,10/0,10/0,16; desabilitado 0,38/0,12) ·
  **elevação TONAL** (superfícies Container; sombra real só no sheet, nível 1).
- Diferenças permitidas por plataforma: ripple (Android, cor de token, nunca transparente) ×
  opacidade de toque (iOS); web com foco visível (outline 2px primary, offset 2); safe areas.

## 3. Decisão por componente

| Componente | Decisão |
|---|---|
| **NavigationBar** | ADOTAR spec BASE verificada: 80dp, ícone 24, indicador 64×32 full, rótulo labelMedium SEMPRE visível; ícone preenchido ativo + contorno inativo (phosphor 3.0.6); identificação NÃO só por cor (indicador + ícone preenchido + peso). 4 destinos: Início, Linhas, Favoritos, Sobre. Aba inicial = **Linhas** enquanto Início for provisório (rota index já resolve). Rótulo ativo = onSurface (token A, C3). Elevação do container: level2 (TONAL em surfaceContainer) — substitui a hairline da tab bar atual. Alvo de toque das abas ≥ 48 (área). |
| **SearchBar** | ADOTAR estilo "contained": pílula **56**, raio full, container surfaceContainerHigh; variante BOTÃO (rola para /buscar) e variante CAMPO (digitável, focus automático). Placeholder = onSurfaceVariant; líder 24. bodyLarge. |
| **TopAppBar** | SÓ small (64; medium/large NÃO adotados). Voltar = ícone phosphor em IconButton (sem seta em texto). container surface; on-scroll surfaceContainer (a cor muda por estado de rolagem). Uso imediato: tela Buscar (voltar). |
| **BottomSheet** | ADOTAR **docked/standard** (o Início usa 3 encaixes); NÃO modal. Container surfaceContainerLow; cantos topo 28; alça 32×4 onSurfaceVariant; elevação level1 (a ÚNICA sombra do app). Contrato atual (`bottom_sheet_tipos.ts`) inalterado. |
| **SegmentedButton** | ADOTAR baseline (A v6_1_0 ainda publica): altura 40, borda outline, selecionado secondaryContainer/onSecondaryContainer, largura TOTAL com 3 partes iguais (Útil/Sábado/Domingo). REGISTRAR: descontinuado no Expressive (connected button group) — reavaliar depois. |
| **Button / IconButton** | ADOTAR (altura 40, forma full, labelLarge; filled/tonal/outlined/text). Ícone do botão = **18** (A `with-icon.icon.size`; o enunciado dizia 20 — token de A vence). Alvo de toque 48 (área); desabilitado conteúdo 0,38 / container 0,12. |
| **ListItem** | ADOTAR: 56 (1 linha) / 72 (2 linhas); título bodyLarge; apoio bodyMedium onSurfaceVariant; líder 24 onSurfaceVariant; selecionado secondaryContainer (C4). Uso: lista de linhas (item com badge + nome = 1 linha 56) e futura lista de horários (2 linhas). |
| **Chip** | ADOTAR assist (sem preenchimento) e filter (selecionado secondaryContainer + check): 32dp, raio small 8. Uso: filtro de turnos/sentidos futuramente; StopRow usa chip de operadora/dia. |
| **Divider** | ADOTAR 1dp outlineVariant (decorativo, isento de contraste — registrado). |
| NÃO ADOTAR | Material You/dinâmico (identidade fixa da logo), FAB, estilos emphasized de tipografia, fonte variável, molas/spring, morph de forma, qualquer animação em loop, background/onBackground e surfaceVariant legados, valores Expressive, reanimated/gesture-handler/kits de UI. |

## 4. Sistema de COR — proposta do Portão A (não gravado)

### 4.1 Derivação

- Tom = **L*** do CIELAB (aproximação documentada do tono HCT; desvio real para croma baixo
  ≤ ~2 pontos — declarado). Matiz: neutros na região do navy (215–218), variantes com croma
  um pouco maior; containers na matiz do próprio papel (navy p/ primary, verde p/ secondary,
  vermelho p/ error).
- **Fixos já aprovados (não derivados)**: primary #05337B / #9DB8F5; verdeTexto #397E2F;
  verdeMarca #4AA63E (só preenchimento de identidade); logoTile #FFFFFF; surface #FFFFFF /
  #0B0E17; onSurface #0D1322 / #F2F5FA; onSurfaceVariant #46536B / #A8B2C6 (mantidos —
  ver 4.4); error #B00020 / #FF8A98; errorContainer claro #FCEAED; theoretical* e aquaDecorativo
  fora do M3 (papéis do Flavos); scrim #000000.
- Espaço (clonados por tom verificado — `md.ref.palette` de A): ver tabela.

### 4.2 Tabela de papéis proposta (hex + L* medido)

| Papel | Claro | L* | Escuro | L* |
|---|---|---|---|---|
| primary | #05337B (fixo) | 23,1 | #9DB8F5 (fixo) | 74,9 |
| onPrimary | #FFFFFF (fixo) | 100,0 | #04122E (fixo) | 5,9 |
| primaryContainer | **#D9E3F4** (T90) | 90,0 | **#29467A** (T30) | 30,1 |
| onPrimaryContainer | **#121B2C** (T10) | 9,8 | **#D9E3F3** (T90) | 89,9 |
| secondary | #397E2F (fixo) | 47,0 | #4AA63E (fixo) | 60,8 |
| onSecondary | #FFFFFF (T100, A) | 100,0 | **#12371C** (T20) | 19,8 |
| secondaryContainer | **#C5ECCF** (T90) | 90,0 | **#22502E** (T30) | 30,1 |
| onSecondaryContainer | **#09200F** (T10) | 10,0 | **#C9EAD2** (T90) | 89,8 |
| surface | #FFFFFF (fixo = T100) | 100,0 | #0B0E17 (fixo, L*≈T6) | 4,0 |
| onSurface | #0D1322 (fixo ≈T10) | 6,0 | #F2F5FA (fixo ≈T90) | 96,4 |
| onSurfaceVariant | #46536B (fixo, L*35 vs T30) | 35,1 | #A8B2C6 (fixo, L*72 vs T80) | 72,4 |
| surfaceContainerLowest | #FFFFFF (= T100) | 100,0 | **#0C0F12** (T4) | 4,2 |
| surfaceContainerLow | **#F2F4F5** (T96) | 96,1 | **#181C21** (T10) | 10,1 |
| surfaceContainer (base) | **#ECEDF0** (T94) | 93,8 | **#1C2026** (T12) | 12,1 |
| surfaceContainerHigh | **#E6E8EC** (T92) | 91,9 | **#262B32** (T17) | 17,3 |
| surfaceContainerHighest | **#E0E3E7** (T90) | 90,1 | **#2F353E** (T22) | 21,9 |
| outline | **#6D778A** (T50) | 49,8 | **#8892A2** (T60) | 60,2 |
| outlineVariant (decorativo) | **#C2C7CF** (T80) | 80,1 | **#404752** (T30) | 29,9 |
| error | #B00020 (fixo) | 36,6 | #FF8A98 (fixo) | 70,7 |
| onError | #FFFFFF | 100,0 | **#502317** (T20) | 19,9 |
| errorContainer | #FCEAED (fixo ≈T90+) | 94,2 | **#663C31** (T30) | 30,1 |
| onErrorContainer | **#78301E** (T30) | 29,9 | **#F0DFDB** (T90) | 90,1 |
| scrim | #000000 | 0,0 | #000000 | 0,0 |

Desvios por hex já aprovado (documentados, não sãos falhas): onSurface claro L*6 vs T10;
onSurface escuro L*96,4 vs T90; onSurfaceVariant ±5/−7,6; onPrimary escuro L*5,9 vs T20;
primary escuro L*74,9 vs T80; error escuro L*70,7 vs T80. (Superfícies seguem o tom EXATO de A.)

### 4.3 Matriz de contraste (medida; texto ≥ 4,5 / UI ≥ 3,0)

| Par | Claro | Escuro |
|---|---|---|
| onSurface × surface | **18,53** ✓ | **17,64** ✓ |
| onSurface × surfaceContainerLowest | 18,50 ✓ | 17,59 ✓ |
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
| **secondary (rótulo ativo opção verde) × surfaceContainer base** | **4,27 ✗ FALHOU** | 5,31 ✓ |
| onSurface (rótulo ativo do token A) × surfaceContainer base | 15,83 ✓ | 14,97 ✓ |
| onError × error | 7,33 ✓ | 5,86 ✓ |
| onErrorContainer × errorContainer | 8,09 ✓ | 7,22 ✓ |
| outline × surface (borda de controle) | 4,51 ✓ | 6,13 ✓ |
| onSecondaryContainer × secondaryContainer (ícone ≥3) | 13,28 ✓ | 7,18 ✓ |
| onPrimaryContainer × primaryContainer (ícone ≥3, opção azul) | 13,33 ✓ | 7,21 ✓ |
| outlineVariant × surface (**isento — decorativo**) | 1,70 | 2,06 |
| hairline aprovada atual (border #DBE3EC/#242C3E) — isento — | 1,30 | 1,38 |
| theoretical conteúdo×fundo [papéis Flavos, inalterados] | 7,06 ✓ | 10,62 ✓ |
| onSecondary × secondary — medir no Passo 9 | (matrix do teste) | (idem) |
| OBS: indicador (container) × surface — **não está na matriz do portão** | 1,29 | 2,07 |

Correções aplicadas à derivação após a primeira medida: **nenhum par da matriz precisa de
cor nova** — o único reprovado é o par "rótulo ativo VERDE sobre surfaceContainer" no claro
(4,27 < 4,5), que desaparece com qualquer uma das duas opções de indicador abaixo (o rótulo
ativo NÃO é verde em ambas — ver §5). Se o dono INSISTIR no verde como rótulo ativo, teria
que trocar o verde aprovado (proibido) — por isso a decisão §5.

### 4.4 Notas honestas

- O par "indicador × surface" (1,29/2,07) NÃO está na matriz pedida; observação transparente:
  no M3 a identificação do destino ativo é responsabilidade do TRIO indicador+ícone preenchido+
  rótulo, e os três passam (onSecondary/onPrimaryContainer × container ≥ 7; rótulo onSurface ×
  surfaceContainer ≥ 14). WCAG 1.4.11 não exige 3:1 de um fundo passivo sem borda quando o
  estado é comunicado por outros meios — registrado como decisão de desenho, não como descuido.
- outlineVariant derivado (#C2C7CF/#404752) muda a hairline atual (#DBE3EC/#242C3E) — ambos
  decorativos. As DUAS opções vão para o gate (estrito M3 vs aprovado atual).

## 5. DECISÃO de indicador (sua escolha no Portão A) — verde × azul

| Opção | Indicador | Ícone ativo (dentro) | Contraste ícone/rótulo dentro | Rótulo abaixo (labelMedium) | Parecer |
|---|---|---|---|---|---|
| **VERDE (canônica A)** | secondaryContainer #C5ECCF / #22502E | onSecondaryContainer #09200F / #C9EAD2 | 13,28 / 7,18 ✓ | onSurface × surfaceContainer = 15,83 / 14,97 ✓ | é o token oficial; usa o verde do sistema apenas como container, nunca como TEXTO ativo (contorna o reprovado 4,27); visual: SELEÇÃO enérgica que não briga com a placa navy |
| **AZUL (alternativa sua)** | primaryContainer #D9E3F4 / #29467A | onPrimaryContainer #121B2C / #D9E3F3 | 13,33 / 7,21 ✓ | idem onSurface ✓ | ecoa a placa/linha navy (identidade mais constante); verde fica só para verdeMarca/verdeTexto informativo |

Ambas cumprem a matriz; a diferença é de identidade visual. **Recomendação: VERDE (canônica
M3)** — separa "ação/marca" (azul primary) de "seleção" (verde secundário), e o número grande
da linha (navy) continua o elemento MAIS forte da tela (regra do DIRECAO.md). A alternativa
azul é legítima se o dono quiser menos verde na interface.

## 6. Rupturas esperadas no visual atual (para você avaliar no gate A — capturas virão no gate B)

1. Tab bar: hairline inferior + surface → **surfaceContainer + elevação tonal level2 + indicador
   pill 64×32** (sem hairline).
2. Segmented/DaySegmented: fundo surfaceAlt + borda → **outline 1dp em pílula full**, selecionado
   secondaryContainer (hoje é primary) — muda para o verde/blue da decisão §5.
3. Campo de busca (pílula 56 surfaceAlt + borda) → **surfaceContainerHigh SEM borda**.
4. Chips de tipo de dia: outline mais visível (outline T50/T60 no lugar de border).
5. Títulos de tela: titleLarge (22/28, peso 400) — hoje títulos 24/700.
6. hairlines de divisores: outlineVariant estrito (mais discreto no claro) ou as aprovadas.
7. Desabilitados: opacidades M3 (0,38 conteúdo / 0,12 container) em todo o app.
8. LineBadge/placa do ônibus: NÃO muda (domínio, cor do feed); raio passa a forma.pequena (8).

## 7. Pendências de verificação (já declaradas — completas no M3_SPEC_EXTRACT.md §7)

Verificação em APARELHO REAL: NADA do M3 foi testado em aparelho; ripple Android/camada web/iOS
(opacidade) será provado só na web (Playwright). BottomSheet nativo (PanResponder) e
NavigationBar em aparelho = pendência para o gate B. Camada monocromática Android 13+ = antes
da loja.
