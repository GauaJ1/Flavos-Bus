# Bateria de exaustão — resultado final

Data: 2026-10-29 · superfície: web de depuração (export estático do próprio
app, mesma base TS do nativo) emulada como Pixel 7 + desktop 1440 + 320 px.

## Placar

| Bateria | Escopo | Resultado |
|---|---|---|
| `suite_exaustiva.mjs` | raiz, 14 buscas (número/acento/caixa/curinga/SQL/emoji/300 char), detalhe, 7 chips de dia, 4 viewports, tema escuro, navegação real, teclado, rotas inválidas, dados do quadro | **58/58 PASS** |
| `varredura_84.mjs` | as 84 linhas do feed, uma a uma | **84/84 OK** |
| `acentos.mjs` | 6 linhas com acento × com/sem acento | **12/12 PASS** |
| `testes_moovit.mjs` | requisitos tirados do doc Moovit | **10/10 PASS** |
| `aparelho.mjs` | emulação de celular: tap real, alvos ≥44 px, paisagem | **TUDO PASS** |
| `pytest` (tools/scraper) | integridade, órfãos, horários, calendário, fuzz de busca, ordem cronológica | **45/45 PASS** |
| `expo export` | iOS, Android e web empacotam | **OK** |
| contraste | 8 pares de tokens × 2 temas | **≥4,5:1 em todos** |

## Bugs reais encontrados pelos testes (e corrigidos)

1. **Busca não achava nome sem acento.** "Tambau" não retornava "Tambaú".
   Corrigido na ingestão: colunas `short_norm`/`long_norm` (sem acento, caixa
   baixa) e o termo da busca é normalizado do mesmo jeito. Banco regenerado.
2. **Rota inexistente caía na tela padrão do expo-router em inglês**
   ("Unmatched Route / Page could not be found / Go back / Sitemap").
   Criado `app/+not-found.tsx` em português, com o mesmo aviso teórico.
3. **ID numérico inexistente mentia**: `/linha/999999` mostrava "Todas as
   saídas de hoje já passaram" e "Sem horários nesse tipo de dia", como se a
   linha existisse. Agora consulta de verdade e responde "Linha não
   encontrada" com o identificador e o caminho de volta.
4. **Campo de busca com alvo de toque de 21 px** (a moldura tinha 56 px, mas
   o elemento de input não esticava). Corrigido com `minHeight` do token de
   toque — no dedo, a área real de toque passou a ser a moldura inteira.

## O que os testes provaram funcionar

- busca por número ("509" e "0509"), por nome, sem acento, em maiúscula, com
  espaços; termos hostis (`%`, `_`, `'; DROP TABLE routes; --`, emoji, 300
  caracteres) não derrubam nem alteram a consulta (parâmetros ligados);
- estado vazio com dica acionável quando não há resultado;
- detalhe: aviso teórico antes de qualquer horário, próxima saída, faixa do
  dia, os 7 dias da semana (com 20 partidas em dia útil e 6 no sábado para a
  0509, domingo sem circulação declarada), horários em ordem cronológica
  (prova de que a ordenação por minutos corrige o `H:MM:SS` do feed),
  primeira 05:00 / última 17:40;
- as **84 linhas** abrem com aviso, data do feed, quadro (ou estado vazio
  honesto) e voltar, sem erro de página;
- navegação real por toque/tecla, voltar, Tab + digitar, 320 px até 1440 px e
  paisagem sem overflow horizontal;
- nenhuma requisição externa: com TODA rede externa bloqueada o app carrega e
  funciona (só o servidor local passa).

## Limitação honesta

O teste roda no render web do mesmo código (react-native-web), não no
aparelho físico. O bundle iOS e o Android foram empacotados com sucesso, mas
"abrir no celular" de verdade (Expo Go, modo avião) continua sendo a prova
humana que só você pode fazer no aparelho — o roteiro está no README do app.
