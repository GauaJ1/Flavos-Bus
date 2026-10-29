# Flavos Bus — Documento de Arquitetura e Escopo

Oct 28, 2026 · @Ocara

## 1. Visão geral

O Flavos Bus é um aplicativo mobile, gratuito e de código aberto, que mostra linhas, itinerários, pontos de parada e horários teóricos dos ônibus de João Pessoa/PB, apoiado por uma API pública no padrão GTFS (General Transit Feed Specification).

**Público:** passageiros de João Pessoa (usuário final) e desenvolvedores locais (consumidores da API).

**Princípios do projeto**

- **Mobile primeiro:** React Native é o alvo principal; a versão web existe para depurar, testar layouts e acelerar o desenvolvimento, não como produto final.
- **Offline primeiro:** linhas, paradas e horários teóricos ficam no aparelho; o app funciona sem internet e sincroniza quando houver conexão.
- **Padrão aberto:** todos os dados são publicados como GTFS, validados e versionados no GitHub.
- **Um código, três alvos:** Android, iOS e web a partir da mesma base TypeScript.
- **Honestidade nos dados:** os horários são teóricos (quadro de horários), não posição em tempo real. O app deixa isso claro na interface.

**Fora do escopo do MVP:** posição em tempo real dos ônibus, pagamento de passagem, cartão de transporte, notificações push e múltiplas cidades.

## 2. Arquitetura geral

&#91;embedded content: arquitetura geral · 4 etapas + web de depuração\]

Os dados saem das fontes públicas, viram um feed GTFS validado, passam pelo banco e pela API e chegam ao app, que guarda uma cópia local em SQLite para funcionar offline. A versão web usa o mesmo código e serve só para depurar.

## 3. Stack tecnológica

A recomendação é React Native com Expo e TypeScript: o Expo entrega Android, iOS e web (via react-native-web) com a mesma base e dispensa configurar projetos nativos no início.

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| App (mobile + web) | React Native + Expo (SDK atual) + TypeScript | Um código para Android, iOS e web; builds na nuvem com EAS |
| Navegação | Expo Router | Rotas por arquivos, funciona igual no mobile e na web |
| Mapas | react-native-maps no mobile; MapLibre ou Leaflet na web | Mapa nativo no celular; a web precisa de alternativa para depurar |
| Estado e cache | TanStack Query + Zustand | Cache de chamadas à API e estado local simples |
| Banco local (offline) | expo-sqlite | Guarda o GTFS no aparelho e permite consultas rápidas por linha e parada |
| Localização | expo-location | Paradas próximas ao usuário |
| Extração de dados | Python (Requests / Playwright) | Melhor ecossistema para coletar e limpar dados brutos |
| Conversão GTFS | Python (pandas) + validador oficial | Gera e valida os arquivos .txt |
| Banco do servidor | PostgreSQL + PostGIS (ou Supabase) | Buscas geográficas em milissegundos |
| API | Node.js com Fastify (ou Express) + OpenAPI | Documentação visual e tipos compartilhados com o app |
| Hospedagem | Fly.io ou Render (API) e Supabase (banco) | Custo baixo para começar |

**Mobile primeiro, web para depurar.** Regras para manter a compatibilidade sem sacrificar o celular:

- Cada componente é escrito e testado primeiro para mobile; a web só precisa rodar, sem polimento.
- Código específico de plataforma fica em arquivos `.native.tsx` e `.web.tsx` (por exemplo, o componente de mapa).
- Evitar bibliotecas sem suporte a web ou isolá-las atrás de uma interface própria.
- O comando `expo start --web` serve para depurar lógica, chamadas à API e layout; gestos, GPS e desempenho se validam sempre em aparelho real.

**Nota sobre a versão anterior:** o documento original citava `node-gtfs` para importar o GTFS. Ele continua útil no servidor, mas o app mobile lê os dados de um pacote SQLite pré-gerado, não do arquivo .zip.

## 4. Estrutura do repositório

Um monorepo único (npm ou pnpm workspaces) mantém app, API, dados e scripts juntos e facilita o trabalho de colaboradores locais.

```text
flavos-bus/
├── apps/
│   ├── mobile/          # React Native + Expo (Android, iOS, web)
│   │   ├── app/         # rotas (Expo Router)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/    # linhas, paradas, mapa, favoritos
│   │   │   ├── db/          # SQLite local e consultas GTFS
│   │   │   └── services/    # cliente da API, localização
│   │   └── assets/
│   └── api/             # backend REST + OpenAPI
├── packages/
│   ├── shared/          # tipos TypeScript (Linha, Parada, Horário)
│   └── gtfs-tools/      # utilitários de leitura e geração do GTFS
├── data/
│   ├── raw/             # respostas brutas coletadas (não versionar o que for pesado)
│   └── gtfs/            # feed GTFS final e validado (.zip e .txt)
├── tools/
│   └── scraper/         # scripts Python de extração e conversão
└── docs/                # este documento, decisões e guias
```

O pacote `shared` garante que app e API usem os mesmos tipos, evitando divergência de campos entre as duas pontas.

## 5. Fases do projeto

O projeto tem sete fases; as quatro primeiras produzem os dados e a API, e a Fase 5 entrega o app mobile, que é o produto principal.

### Fase 1 — Extração de dados

- **Objetivo:** coletar os dados brutos de linhas, paradas, itinerários e horários de João Pessoa.
- **Tarefas:** inspecionar as fontes públicas (portal da Semob-JP e o site do Bus2) pela aba Network do navegador; listar os endpoints que devolvem JSON; escrever scripts que varrem todas as linhas; salvar as respostas brutas em `data/raw/`.
- **Entregável:** pasta de dados brutos reproduzível e um README com a origem de cada arquivo.
- **Antes de começar:** ler a seção 9 (riscos legais) e tentar contato com a Semob-JP.

### Fase 2 — Padronização em GTFS

- **Objetivo:** transformar os dados brutos no formato GTFS.
- **Tarefas:** gerar os arquivos descritos na seção 6; validar com o GTFS Validator oficial (MobilityData) e corrigir os erros.
- **Entregável:** feed GTFS validado em `data/gtfs/`, versionado por data.

### Fase 3 — Banco de dados e infraestrutura

- **Objetivo:** servir consultas geográficas rápidas.
- **Tarefas:** subir PostgreSQL com PostGIS; importar o GTFS; criar índices espaciais para a busca de paradas próximas.
- **Entregável:** banco populado e script de reimportação automática.

### Fase 4 — API pública

- **Objetivo:** disponibilizar os endpoints da seção 7.
- **Tarefas:** implementar rotas, paginação e cache; documentar com OpenAPI/Swagger; limitar requisições por IP.
- **Entregável:** API no ar com documentação testável no navegador.

### Fase 5 — App mobile (foco principal)

- **Objetivo:** entregar o app Flavos Bus para Android e iOS, com a web rodando para depuração.
- **Tarefas:** criar o projeto Expo com Expo Router; montar o banco SQLite local a partir do feed GTFS; implementar as telas da seção 8; testar em aparelhos reais; gerar builds com EAS.
- **Entregável:** versão beta instalável (APK/TestFlight) e app web de depuração.

### Fase 6 — Qualidade e beta fechado

- **Objetivo:** validar dados e usabilidade com pessoas reais.
- **Tarefas:** conferir horários de linhas populares contra o que o passageiro vê no ponto; coletar feedback de um grupo pequeno; corrigir erros de dados e de interface.
- **Entregável:** lista de problemas resolvidos e versão candidata a publicação.

### Fase 7 — Publicação e comunidade

- **Objetivo:** lançar e manter o projeto.
- **Tarefas:** publicar na Google Play e na App Store; abrir o repositório no GitHub com guia de contribuição; convidar desenvolvedores locais para ajudar a atualizar horários quando as empresas mudarem as ordens de serviço.
- **Entregável:** apps nas lojas, repositório público e processo de atualização dos dados.

## 6. Modelo de dados GTFS

O feed GTFS tem de passar sem erros no validador oficial antes de ir para o banco ou para o app.

| Arquivo | Conteúdo | Observação |
| --- | --- | --- |
| agency.txt | Órgão gestor (Semob-JP / Sintur) | Fuso `America/Fortaleza` (mesmo horário de Brasília) |
| routes.txt | ID, número curto e nome de cada linha (ex.: 510, Tambaú) | Um registro por linha |
| stops.txt | ID, nome e coordenadas (latitude, longitude) das paradas | Coordenadas com 6 casas decimais |
| shapes.txt | Pontos que desenham o trajeto pelas ruas | Base do traçado no mapa |
| calendar.txt | Dias de operação: úteis, sábados, domingos | Define os `service_id` |
| calendar\_dates.txt | Exceções: feriados e dias atípicos | Opcional, mas necessário para feriados |
| trips.txt | Cada viagem de uma linha, com sentido e traçado | Liga rota, calendário e shape |
| stop\_times.txt | Horário de passagem em cada parada | Maior arquivo do feed |

**Validação:** rodar o GTFS Validator da MobilityData a cada nova geração do feed e bloquear a publicação se houver erros (avisos são avaliados caso a caso).

**Identificadores estáveis:** `route_id`, `stop_id` e `shape_id` não podem mudar entre versões do feed, pois o app guarda favoritos do usuário por esses IDs.

**Versionamento:** cada feed publicado recebe um número de versão (por exemplo, `2026-10-28`) e o app compara essa versão para decidir se baixa uma atualização.

## 7. API pública

A API é somente leitura (GET), em JSON, com prefixo `/api/v1`. O app usa a API principalmente para baixar o feed e verificar atualizações; as consultas do dia a dia rodam no SQLite local.

| Endpoint | O que retorna | Parâmetros |
| --- | --- | --- |
| `/api/v1/linhas` | Lista de linhas ativas | `busca` (texto opcional) |
| `/api/v1/linhas/{id}` | Detalhes de uma linha | — |
| `/api/v1/linhas/{id}/horarios` | Horários teóricos da linha | `tipo_dia` (util, sabado, domingo), `sentido` |
| `/api/v1/linhas/{id}/itinerario` | Lista de coordenadas (lat/lng) do trajeto | `sentido` |
| `/api/v1/linhas/{id}/paradas` | Paradas da linha, em ordem | `sentido` |
| `/api/v1/paradas/proximas` | Paradas dentro de um raio | `lat`, `lng`, `raio` (metros) |
| `/api/v1/paradas/{id}/linhas` | Linhas que passam na parada, com próximos horários | `tipo_dia` |
| `/api/v1/feed/versao` | Versão atual do feed GTFS | — |
| `/api/v1/feed/download` | Arquivo do feed (SQLite pré-gerado ou .zip GTFS) | `formato` |

**Exemplo de resposta de `/api/v1/paradas/proximas?lat=-7.1195&lng=-34.8450&raio=300`:**

```json
{
  "total": 1,
  "paradas": [
    {
      "id": "P0123",
      "nome": "Av. Epitácio Pessoa, 1200",
      "lat": -7.1201,
      "lng": -34.8447,
      "distancia_m": 72,
      "linhas": ["510", "507"]
    }
  ]
}
```

**Regras gerais:** paginação com `limite` e `pagina`; cache HTTP (ETag) para o feed; limite de requisições por IP; erros em formato padronizado com `codigo` e `mensagem`; documentação OpenAPI/Swagger em `/docs`.

*O exemplo acima é ilustrativo; os valores reais dependem dos dados coletados na Fase 1.*

## 8. App mobile (Flavos Bus)

O MVP responde a três perguntas do passageiro: "que ônibus passa perto de mim?", "a que horas passa?" e "por onde ele vai?".

### Telas do MVP

| Tela | Função | Dados usados |
| --- | --- | --- |
| Início | Paradas próximas e favoritos em destaque | Localização + SQLite |
| Buscar linhas | Busca por número ou nome (ex.: 510, Tambaú) | `routes` |
| Detalhe da linha | Horários por tipo de dia e lista de paradas, por sentido | `trips`, `stop_times` |
| Mapa da linha | Traçado da linha e paradas sobre o mapa | `shapes`, `stops` |
| Detalhe da parada | Linhas que passam e próximos horários | `stop_times` |
| Favoritos | Linhas e paradas salvas | Armazenamento local |
| Sobre / Dados | Versão do feed, fonte dos dados, aviso de horários teóricos | `feed/versao` |

### Funcionalidades essenciais

- Paradas próximas pela localização do aparelho, com a distância a pé.
- Próximos horários de uma parada, calculados pelo horário atual e pelo tipo de dia (útil, sábado, domingo, feriado).
- Favoritos salvos no aparelho, sem exigir cadastro ou login.
- Aviso visível de que os horários são teóricos e podem variar.
- Tema claro e escuro, e textos legíveis em telas pequenas.

### Offline primeiro

1. Na primeira abertura, o app baixa o feed (SQLite pré-gerado) e guarda no aparelho.
2. Toda consulta de linhas, paradas e horários lê o banco local, sem depender de rede.
3. Ao abrir, o app consulta `/api/v1/feed/versao` em segundo plano e baixa a atualização só se houver versão nova.
4. Sem internet, o app continua funcionando e mostra a data da última atualização dos dados.

### Compatibilidade com web (depuração)

- A web roda com `expo start --web` e usa a mesma lógica e as mesmas telas.
- O banco local na web usa a variante do expo-sqlite para navegador; se der problema, a web pode ler direto da API.
- O mapa tem duas implementações isoladas (`MapView.native.tsx` e `MapView.web.tsx`) atrás da mesma interface.
- Recursos que só valem no celular (GPS preciso, gestos, desempenho, instalação) são testados em aparelho real.

### Desempenho e usabilidade

- Listas longas com FlatList (ou FlashList) e consultas SQL com índices por parada e por linha.
- Primeira tela útil em menos de 2 segundos com os dados já no aparelho.
- Áreas de toque de pelo menos 44 pontos e contraste adequado para uso na rua, sob sol forte.
- Textos e mensagens em português do Brasil; estrutura pronta para internacionalização futura.

## 9. Riscos, aspectos legais e éticos

O maior risco do projeto não é técnico: é depender de dados extraídos sem autorização, o que pode levar a bloqueio das fontes, pedido de remoção ou problemas com os termos de uso. A recomendação é tentar a via oficial antes e tratar a extração como plano B.

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Termos de uso das fontes (Bus2, portal da Semob-JP) proíbem coleta automatizada | Pedido de remoção, bloqueio de IP, risco jurídico | Ler os termos antes; pedir dados abertos à Semob-JP (Lei de Acesso à Informação); fazer coletas leves, com pausas, sem sobrecarregar os servidores |
| Dados desatualizados quando as empresas mudam as ordens de serviço | Horário errado no app | Mostrar data do feed; rotina de reextração; canal para o usuário reportar erro |
| Endpoints internos mudam sem aviso | Scripts quebram | Testes automáticos dos scripts; guardar respostas brutas para reprocessar |
| Dados incompletos (falta de itinerário ou horário de alguma linha) | Linha incompleta no app | Marcar a linha como "dados parciais" em vez de inventar informação |
| Aprovação nas lojas (localização, política de privacidade) | Atraso na publicação | Pedir permissão de localização só quando necessário; política de privacidade simples; sem coleta de dados pessoais no MVP |
| Projeto depende de poucas pessoas | Abandono | Código aberto, documentação clara, guia de contribuição |

**Caminho recomendado:** em paralelo à Fase 1, enviar à Semob-JP um pedido formal do feed GTFS ou dos dados de linhas e horários. Se a prefeitura liberar, a extração deixa de ser necessária e o projeto ganha legitimidade para publicar nas lojas.

**Boas práticas na coleta:** identificar o coletor com um User-Agent claro, respeitar limites de requisição, guardar só dados públicos de transporte e nunca coletar dados pessoais de usuários dessas fontes.

*Este documento não é aconselhamento jurídico; para publicar o app, vale consultar um advogado ou uma comunidade de dados abertos.*

## 10. Qualidade, testes e publicação

O foco é impedir que um feed quebrado ou uma tela com erro chegue ao passageiro.

| Área | O que fazer | Ferramenta sugerida |
| --- | --- | --- |
| Dados | Validar o GTFS a cada geração; conferir amostra de linhas contra a realidade | GTFS Validator (MobilityData) |
| Extração | Testes dos scripts com respostas gravadas | pytest |
| API | Testes de rotas e da busca por raio | Vitest ou Jest + banco de teste |
| App (lógica) | Testes de consultas SQLite e cálculo de próximos horários | Jest |
| App (interface) | Testes de componentes e de telas principais | React Native Testing Library |
| Fluxos completos | Abrir app, buscar linha, ver horário | Maestro (mobile) |
| Tipos e estilo | Checagem estática em todo commit | TypeScript, ESLint, Prettier |

**Integração contínua (GitHub Actions):** a cada pull request rodar lint, checagem de tipos e testes; ao atualizar o feed, rodar o validador e bloquear se houver erros.

**Builds e distribuição:**

1. Builds de teste (APK e iOS interno) com EAS Build, distribuídos a um grupo pequeno.
2. Atualizações só de JavaScript e dados pelo EAS Update, sem passar pela loja.
3. Publicação na Google Play (conta de desenvolvedor, taxa única) e na App Store (assinatura anual do Apple Developer Program). Valores devem ser conferidos nos sites oficiais antes de decidir.

**Privacidade:** o MVP não exige cadastro e não envia a localização do usuário a servidores; a busca de paradas próximas roda no aparelho.

## 11. Roadmap do MVP e próximos passos

&#91;embedded content: roadmap do MVP · 4 etapas, 3 marcos\]

O MVP fica pronto quando o app roda offline em aparelho real com os dados de uma lista inicial de linhas; as demais linhas entram depois, sem mudar a arquitetura. Os marcos são critérios de passagem, não datas: o cronograma depende de quanto tempo a coleta de dados levar.

**Próximos passos**

- [ ] Criar o monorepo e o projeto Expo com Expo Router e TypeScript
- [ ] Enviar à Semob-JP o pedido formal de dados GTFS
- [ ] Inspecionar as fontes públicas e listar os endpoints (Fase 1)
- [ ] Escolher a biblioteca de mapa para a web (MapLibre ou Leaflet)
- [ ] Definir a lista inicial de linhas do MVP (as mais usadas)
- [ ] Escolher hospedagem da API e do banco
- [ ] Definir identidade visual do Flavos Bus (logo, cores, ícone)
