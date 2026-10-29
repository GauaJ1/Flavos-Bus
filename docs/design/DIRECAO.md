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

## Tokens (as cores vivem SÓ em theme.ts)

| Papel | Claro | Escuro |
|---|---|---|
| papel (fundo) | `#FFFFFF` | `#000000` |
| papel-2 (superfície) | `#F7F7F8` | `#101012` |
| tinta (texto) | `#000000` | `#FFFFFF` |
| tinta-2 (secundário, AA) | `#54565B` | `#C7C9CE` |
| hairline (estrutura) | `#E5E5E7` | `#2A2A2E` |
| acento (Klein Blue) | `#002FA7` | `#7B9DFF` |
| acento sobre | `#FFFFFF` | `#000000` |
| ok (semântico) | `#1B7A3D` | `#5FD38D` |
| atencao (semântico) | `#7A4B00` fundo `#FFEFFE→#FFD666` | `#FFC24B` |
| erro (semântico) | `#B00020` | `#FF8A98` |

- A acento tem UMA função por tela (seleção/destaque do momento); estados usam
  cores semânticas **sempre com texto/palavra junto** — jamais cor sozinha.
- O AVISO de horários teóricos usa âmbar sistêmico + texto preto (AA), nunca
  descartável.

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
