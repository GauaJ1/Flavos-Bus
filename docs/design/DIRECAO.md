# Flavos Bus — Direção de design (MVP)

Data: 2026-10-30 · Âncora e tokens travados antes da primeira tela.
Uso real que guia TODAS as decisões: pessoa **em pé no ponto de ônibus**, sol
forte, uma mão no celular, pressa, internet ruim. Se uma decisão não melhora a
leitura nessas condições, ela foi pelo caminho errado.

## Âncora visual: Swiss (frontend-design-anchors)

Por quê: o produto é um **quadro de horários de transporte público** — a
linguagem visual mais honesta é a dos quadros de estação: fundo branco de
máxima legibilidade ao ar livre, grotesca, hairlines estruturando a tabela, e
UM acento. Rejeição registrada do "Flat Design azul genérico" do gerador
(paleta de SaaS não diferencia e Lexend Mega é registro errado p/ utilitário).

## Diferenciador (o gesto memorável)

**O número da linha é uma placa de destino: caixa preta, número enorme
branco, curturas apertadas** — como o letreiro frontal do ônibus que a pessoa
está esperando. É o elemento maior da tela de detalhe e marca cada resultado
na busca. Nenhum outro elemento compete com ele.

## Tokens (as cores vivem SÓ em `src/tema/tokens.ts`; `theme.ts` só reexporta)

Atualizado na fatia 1 do redesign (paleta medidA por região da logo — ver
`tools/scraper/.tmp/corr_verde_regioes.py` e `.claude/paleta_debug.png`).

| Papel | Claro | Escuro | Origem/regra |
|---|---|---|---|
| primary | `#05337B` (navy do corpo) | `#9DB8F5` | ações, aba ativa, marca |
| onPrimary | `#FFFFFF` | `#04122E` | sobre primary |
| surface / surfaceAlt | `#FFFFFF` / `#F5F8FB` | `#0B0E17` / `#141926` | leitura ao sol |
| border (hairline) | `#DBE3EC` | `#242C3E` | estrutura Swiss |
| text / textMuted | `#0D1322` / `#46536B` | `#F2F5FA` / `#A8B2C6` | corpo/legenda |
| verdeMarca | `#4AA63E` | `#4AA63E` | identidade ("Bus"): fill com texto escuro (6.01:1); NUNCA estado semântico |
| verdeTexto | `#397E2F` | `#4AA63E` | verde como texto/ícone informativo no claro (AA 4.69) |
| aquaDecorativo | `#01B5C2` | `#01B5C2` | decoração (ondas): nunca informativo sozinho |
| theoretical* | `#6B4A00` s/ `#FFEFC2` | `#FFD666` s/ `#332600` | RESERVADO ao TheoreticalBadge (grep por fatia) |
| danger / dangerBg | `#B00020` / `#FCEAED` | `#FF8A98` / `#2E0D12` | estados de erro |
| logoTile | `#FFFFFF` fixo (imune ao tema) | idem | tile do emblema no escuro; navy/tile = 11.74:1 |
| success | — não exportado (YAGNI) | idem | MVP sem uso; quando nascer: sempre ícone + palavra, nunca cor sozinha |

- O numeral do LineBadge: SEMPRE ≥ 19px, peso 700 → limiar 3:1 sobre o fundo
  do feed; < 3:1 troca só o texto para preto/branco (max(preto,branco) ≥ 4.58
  para qualquer fundo — provado em `test_badge_contraste.py`). No feed atual:
  E550/E551/E600. Numeral menor que 19px ⇒ limiar volta a 4.5 (nenhum contexto
  atual usa).

## Lint (decisão PENDENTE do dono, antes da fatia 3)

Não existe ESLint configurado em `apps/mobile` (o gate atual é
`tsc --noEmit` + pytest/ruff/mypy no scraper + verificação visual D).
NÃO configurei por conta própria. Alternativas: (a) `eslint` +
`eslint-config-expo` (flat config, roda no pnpm do monorepo); (b) manter só
tsc até a v1. Decida antes da fatia 3.

## Pendência para ANTES da loja (não implementar agora)

- **Camada monocromática do ícone adaptativo** (Android 13+, `monochrome`
  no adaptiveIcon): desenho de recorte sólido calculado da marca. Sem isso o
  Android 13+ mostra o ícone colorido dentro de temas de ícone — aceitável no
  MVP, bloqueador só para publicação com tema de ícone ativado.

## Tipografia

| Papel | Família | Uso |
|---|---|---|
| display/números | `sans-serif-condensed` (Android) / System Semibold (iOS) | número da linha, horários, contagem |
| corpo | system-régua (Roboto/SF) 16px | tudo o resto |

- Horários e qualquer número que atualiza: `fontVariant: tabular-nums`.
- Alvos de toque mínimos: 48x48; types spam 4/8/12/16/24/32/48; raio: placa 8,
  cartão 16, filho = pai − padding (concêntrico); separadores = hairline 1px,
  não sombra (âncora Swiss: bordas estruturam, sombra é ruído).

## Layout

- Alinhado à esquerda; o número da linha e a "próxima saída" são a única
  assimetria intencional.
- Tela Buscar: campo de busca no topo (56px, alvo 48+), resultado = cartão com
  placa de número à esquerda, nome + sentidos à direita. Resposta < 100 ms
  (busca em SQL local).
- Tela Detalhe: AVISO no topo → placa + nome → próxima saída (número grande +
  "faltam N min") → faixa do dia (linha do tempo dos horários) → horários por
  tipo de dia/sentido, horário passado esmaecido ~50%.

```
┌────────────────────────────────────┐
│ ⚠ Horários teóricos (não tempo real)│  ← sempre visível
├────────────────────────────────────┤
│ ┌──────┐  0509 · João Agripino     │
│ │ 0509 │  Radial · operadora 2019   │  ← placa + metadados honestos
│ └──────┘                            │
│ PRÓXIMA SAÍDA                       │
│ 14:15   faltam 12 min   (sentido ↗)│
│ ▁▁▁▁▂▂▃▃▃▄▄▅▅▅▆▆▇▇██  faixa do dia │
├────────────────────────────────────┤
│ DIA ÚTIL · IDA                     │  ← chip de tipo de dia
│ 05:00  05:40  06:20  07:00  …      │
└────────────────────────────────────┘
```

## Estados obrigatórios (nenhuma tela sem eles)

carregando (esqueleto) · vazio com ação · sem resultado de busca · banco
ausente (instrução de gerar/sicronizar) · linha sem horário no tipo de dia
escolhido · erro de banco (mensagem + o que fazer).

## Iconografia

Desenhos SVG próprios (24px, stroke 1,5-2 acompanhando o peso do texto ao
lado): aviso, relógio, seta de sentido, busca. Nada de emoji; nada de
biblioteca pesada — os quatro bastem para o MVP.

## Movimento

Só o essencial: escala no toque (0,96, ≤120 ms) e transição de empilhar do
navegador. Zero animação contínua (sem relógio pulsando; sem "atraso" fictício
pensada — RT não existe e não inventamos dado).
