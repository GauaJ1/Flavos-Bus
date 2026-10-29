# Suite de exaustão — fluxo completo do app (web de depuração)

Data: 2026-10-29T19:24:52.063Z · Edge/Playwright · rede externa bloqueada por padrão

**58/58 PASS** · 0 falha(s)

| Categoria | Check | Resultado | Info |
|---|---|---|---|
| raiz | tela carrega com aviso e contagem | PASS | 84 linha(s) · dado do feed 2026-10-29- |
| raiz | aviso teórico no topo | PASS |  |
| raiz | MVP no topo (0507 1º) | PASS |  |
| raiz | lista renderiza (≥10 cartões) | PASS | 69 números |
| raiz | container de lista rola até o fim | PASS | {"achou":true,"rolou":true,"dentroDaTela":true} |
| busca | número sem zero → 0509 | PASS |  |
| busca | número com zero → 0509 | PASS |  |
| busca | sem acento 'Tambau' → Tambaú | PASS |  |
| busca | com acento 'tambaú' | PASS |  |
| busca | MAIÚSCULA | PASS |  |
| busca | nome do bairro | PASS |  |
| busca | espaços nas pontas | PASS |  |
| busca | lixo → estado vazio + dica | PASS |  |
| busca | curinga '%' não quebra (literal) | PASS |  |
| busca | curinga '_' não quebra | PASS |  |
| busca | injeção SQL é só texto | PASS |  |
| busca | emoji não quebra | PASS |  |
| busca | termo gigante (300 char) | PASS |  |
| busca | campo vazio volta às 84 | PASS |  |
| 84 linhas | mapa numero→id carregado | PASS | 84 linhas |
| detalhe | 0509: próxima saída em destaque | PASS |  |
| chips | chip Seg | PASS | João Agripino / Terminal Varadouro · 20 viagem(n |
| chips | chip Ter | PASS | João Agripino / Terminal Varadouro · 20 viagem(n |
| chips | chip Qua | PASS | João Agripino / Terminal Varadouro · 20 viagem(n |
| chips | chip Qui | PASS | João Agripino / Terminal Varadouro · 20 viagem(n |
| chips | chip Sex | PASS | João Agripino / Terminal Varadouro · 20 viagem(n |
| chips | chip Sáb | PASS | João Agripino / Terminal Varadouro · 6 viagem(ns |
| chips | chip Dom | PASS | (vazio) |
| chips | 7 chips clicáveis | PASS | 7/7 |
| chips | voltar ao dia de hoje restaura destaque | PASS |  |
| detalhe | rolagem alcança o rodapé (voltar) | PASS |  |
| viewport | 320 mínimo: detalhe renderiza | PASS |  |
| viewport | 320 mínimo: sem overflow horizontal | PASS | 0px |
| viewport | 320 mínimo: campo de busca utilizável | PASS | 234px |
| viewport | 320 mínimo: busca sem overflow | PASS | 0px |
| viewport | 360 típico: detalhe renderiza | PASS |  |
| viewport | 360 típico: sem overflow horizontal | PASS | 0px |
| viewport | 360 típico: campo de busca utilizável | PASS | 274px |
| viewport | 360 típico: busca sem overflow | PASS | 0px |
| viewport | 768 tablet: detalhe renderiza | PASS |  |
| viewport | 768 tablet: sem overflow horizontal | PASS | 0px |
| viewport | 768 tablet: campo de busca utilizável | PASS | 682px |
| viewport | 768 tablet: busca sem overflow | PASS | 0px |
| viewport | 1440 desktop: detalhe renderiza | PASS |  |
| viewport | 1440 desktop: sem overflow horizontal | PASS | 0px |
| viewport | 1440 desktop: campo de busca utilizável | PASS | 1354px |
| viewport | 1440 desktop: busca sem overflow | PASS | 0px |
| tema | escuro: raiz carrega | PASS | rgba(0, 0, 0, 0) |
| navegação | toque no cartão abre detalhe | PASS | http://127.0.0.1:8282/linha/42029 |
| navegação | voltar retorna à busca | PASS | http://127.0.0.1:8282/ |
| teclado | Tab + digitar filtra | PASS | campo ativo: INPUT |
| erros | rota '/linha/999999' tratada em português (sem crash) | PASS | linha/[id] / Horários teóricos (programados). O ônibus real pode atrasar — este  |
| erros | rota '/linha/' tratada em português (sem crash) | PASS | +not-found / Horários teóricos (programados). O ônibus real pode atrasar — este  |
| erros | rota '/rota-que-nao-existe' tratada em português (sem crash) | PASS | +not-found / Horários teóricos (programados). O ônibus real pode atrasar — este  |
| offline | raiz sem pageerror com rede externa bloqueada | PASS |  |
| dados | todas as horas no formato HH:MM (normalizadas) | PASS | 20 horários |
| dados | horários do quadro em ordem cronológica | PASS | 05:00 05:40 06:20 07:00 07:40 08:20 09:00 09:40 |
| dados | primeira 05:00 / última 17:40 | PASS |  |
